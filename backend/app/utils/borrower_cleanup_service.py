

import json
import re
from difflib import SequenceMatcher
from collections import defaultdict
from typing import Dict, Any, List, Optional

# ---------- Helper functions ----------


def clean_name(name: str) -> str:
    if not name:
        return ""
    name = str(name).upper()
    name = re.sub(r'\b(POD|JR|SR|III|II|IV)\b', '', name)
    name = re.sub(r'[^\w\s]', ' ', name)
    return re.sub(r'\s+', ' ', name).strip()


def extract_name_components(name: str) -> Dict[str, Any]:
    cleaned = clean_name(name)
    parts = [p for p in cleaned.split() if p]
    if not parts:
        return {'first': '', 'middle': [], 'last': '', 'all_parts': set()}
    return {
        'first': parts[0],
        'middle': parts[1:-1] if len(parts) > 2 else (parts[1:2] if len(parts) == 2 else []),
        'last': parts[-1] if len(parts) > 1 else '',
        'all_parts': set(parts)
    }


def names_match_fuzzy(name1: str, name2: str, threshold: float = 0.6) -> bool:
    if not name1 or not name2:
        return False
    c1, c2 = clean_name(name1), clean_name(name2)
    if c1 == c2:
        return True
    p1, p2 = c1.split(), c2.split()
    if len(p1) < 2 or len(p2) < 2:
        return False
    first_match = (
        p1[0] == p2[0]
        or (len(p1[0]) == 1 and p1[0] == p2[0][0])
        or (len(p2[0]) == 1 and p2[0] == p1[0][0])
        or SequenceMatcher(None, p1[0], p2[0]).ratio() > 0.8
    )
    if not first_match:
        return False

    def levenshtein(s1, s2):
        if len(s1) < len(s2):
            return levenshtein(s2, s1)
        if not s2:
            return len(s1)
        prev = list(range(len(s2)+1))
        for i, c1 in enumerate(s1):
            curr = [i+1]
            for j, c2 in enumerate(s2):
                ins = prev[j+1] + 1
                dele = curr[j] + 1
                sub = prev[j] + (0 if c1 == c2 else 1)
                curr.append(min(ins, dele, sub))
            prev = curr
        return prev[-1]

    last_match = (
        p1[-1] == p2[-1]
        or levenshtein(p1[-1], p2[-1]) <= 2
        or SequenceMatcher(None, p1[-1], p2[-1]).ratio() > 0.75
    )
    if not last_match:
        return False

    m1 = p1[1:-1] if len(p1) > 2 else []
    m2 = p2[1:-1] if len(p2) > 2 else []
    if not m1 or not m2:
        return True
    for a in m1:
        if any(
            b == a
            or (len(a) == 1 and a == b[0])
            or (len(b) == 1 and b == a[0])
            or SequenceMatcher(None, a, b).ratio() > 0.75
            for b in m2
        ):
            return True
    return False


def similarity_score(name1: str, name2: str) -> float:
    if names_match_fuzzy(name1, name2):
        return 1.0
    c1, c2 = clean_name(name1), clean_name(name2)
    direct = SequenceMatcher(None, c1, c2).ratio()
    p1, p2 = extract_name_components(
        name1)['all_parts'], extract_name_components(name2)['all_parts']
    if not p1 or not p2:
        return direct
    overlap = len(p1 & p2) / len(p1 | p2)
    return max(direct, overlap)


def consolidate_similar_borrowers(master_borrowers: List[str]) -> List[Dict[str, Any]]:
    consolidated = []
    used = set()
    for i, b1 in enumerate(master_borrowers):
        if i in used:
            continue
        group = [b1]
        used.add(i)
        for j, b2 in enumerate(master_borrowers):
            if j <= i or j in used:
                continue
            if names_match_fuzzy(b1, b2):
                group.append(b2)
                used.add(j)
        consolidated.append({'primary_name': b1, 'all_variations': group})
    return consolidated


def extract_individual_names_from_multi_borrower(name: str) -> List[str]:
    return [n.strip() for n in name.split(',') if n.strip()] if name else []


def find_best_borrower_match(doc_name: str, groups: List[Dict[str, Any]]) -> Optional[str]:
    if not doc_name:
        return None
    best, score = None, 0.0
    for g in groups:
        for v in g['all_variations']:
            if names_match_fuzzy(doc_name, v):
                s = similarity_score(doc_name, v)
                if s > score:
                    best, score = g['primary_name'], s
    return best


def extract_borrower_name_from_document(doc: Dict[str, Any]) -> Optional[str]:
    if not isinstance(doc, dict):
        return None
    borrower_name = None
    if 'Summary' in doc:
        summaries = doc['Summary'] if isinstance(
            doc['Summary'], list) else [doc['Summary']]
        for summary in summaries:
            for label in summary.get('Labels', []):
                lname = label.get('LabelName', '').lower()
                borrower_keys = [
                    'borrower name', 'employee name', 'account holder name',
                    'applicant name', 'employee full name', 'full name'
                ]
                employer_keys = [
                    'employer', 'company', 'organization', 'business',
                    'corp', 'inc', 'llc', 'ltd', 'bank', 'association'
                ]
                if any(k in lname for k in borrower_keys) and not any(k in lname for k in employer_keys):
                    for vobj in label.get('Values', []):
                        val = vobj.get('Value', '').strip()
                        if val and not re.search(r'\b(LLC|INC|CORP|LTD|CO|BANK)\b', val.upper()):
                            if not borrower_name or len(val) > len(borrower_name):
                                borrower_name = val
    return borrower_name


def extract_clean_labels(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(doc, dict):
        return {}
    clean: Dict[str, Any] = {}
    if 'Summary' in doc:
        summaries = doc['Summary'] if isinstance(
            doc['Summary'], list) else [doc['Summary']]
        for s in summaries:
            for label in s.get('Labels', []):
                name = label.get('LabelName')
                if not name:
                    continue
                vals = [v.get('Value')
                        for v in label.get('Values', []) if 'Value' in v]
                if vals:
                    clean[name] = vals[0] if len(vals) == 1 else vals
                elif 'Groups' in label:
                    groups = []
                    for g in label['Groups']:
                        record = {'Group': g.get('GroupName', 'Record')}
                        for rl in g.get('RecordLabels', []):
                            rname = rl.get('LabelName')
                            rvals = [v.get('Value') for v in rl.get(
                                'Values', []) if 'Value' in v]
                            if rname and rvals:
                                record[rname] = rvals[0] if len(
                                    rvals) == 1 else rvals
                        if len(record) > 1:
                            groups.append(record)
                    if groups:
                        clean[name] = groups
    meta = ['Title', 'Url', 'StageName', 'GeneratedOn']
    for m in meta:
        if m in doc:
            clean[m] = doc[m]
    return clean

# ---------- New entry point with parameter & return types ----------


def clean_borrower_documents_from_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean borrower documents directly from an in-memory dict.
    Returns cleaned borrower data with structure:
    { primary_borrower_name: { DocumentType: [cleaned_doc, ...], ... }, ... }
    """
    items: List[Dict[str, Any]] = []
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, list) and v and isinstance(v[0], dict) and "BorrowerName" in v[0]:
                items = v
                break
        if not items and "BorrowerName" in data:
            items = [data]
    elif isinstance(data, list):
        items = data
    else:
        raise ValueError("Unexpected JSON structure")

    master = set()
    for item in items:
        if "BorrowerName" in item and item["BorrowerName"]:
            b = item["BorrowerName"].strip()
            if b and b != "Unidentified Borrower":
                master.update(x.strip() for x in b.split(",") if x.strip())

    consolidated = consolidate_similar_borrowers(list(master))
    cleaned: Dict[str, Any] = {g["primary_name"]: {} for g in consolidated}

    for item in items:
        if not isinstance(item, dict) or "BorrowerName" not in item:
            continue
        top = item["BorrowerName"]
        for dtype, value in item.items():
            if dtype == "BorrowerName":
                continue
            docs = value if isinstance(value, list) else [value]
            for doc in docs:
                if not isinstance(doc, dict):
                    continue
                dname = extract_borrower_name_from_document(doc)
                match = find_best_borrower_match(dname, consolidated) if dname else \
                    find_best_borrower_match(top, consolidated)
                if not match:
                    continue
                cdoc = extract_clean_labels(doc)
                if cdoc:
                    cleaned.setdefault(match, {}).setdefault(
                        dtype, []).append(cdoc)

    return {k: v for k, v in cleaned.items() if v}
