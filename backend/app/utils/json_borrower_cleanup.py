import json
import re
from difflib import SequenceMatcher
from typing import Dict, Any, List, Union, Optional

# -------------------------------
# Name cleaning & fuzzy matching
# -------------------------------
def clean_name(name: Optional[str]) -> str:
    if not name:
        return ""
    name = str(name).upper()
    name = re.sub(r'\b(POD|JR|SR|III|II|IV)\b', '', name)
    name = re.sub(r'[^\w\s]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def extract_name_components(name: str):
    cleaned = clean_name(name)
    parts = [part for part in cleaned.split() if part]
    if not parts:
        return {'first': '', 'middle': [], 'last': '', 'all_parts': set()}
    components = {
        'first': parts[0] if parts else '',
        'middle': parts[1:-1] if len(parts) > 2 else (parts[1:2] if len(parts) == 2 else []),
        'last': parts[-1] if len(parts) > 1 else '',
        'all_parts': set(parts)
    }
    return components

def names_match_fuzzy(name1: str, name2: str, threshold: float = 0.6) -> bool:
    if not name1 or not name2:
        return False
    clean1 = clean_name(name1)
    clean2 = clean_name(name2)
    if clean1 == clean2:
        return True

    parts1 = [p for p in clean1.split() if p]
    parts2 = [p for p in clean2.split() if p]
    if len(parts1) < 1 or len(parts2) < 1:
        return False

    first1, last1 = parts1[0], parts1[-1]
    first2, last2 = parts2[0], parts2[-1]
    middle1 = parts1[1:-1] if len(parts1) > 2 else []
    middle2 = parts2[1:-1] if len(parts2) > 2 else []

    first_match = (first1 == first2 or
                   (len(first1) == 1 and first1 == first2[0]) or
                   (len(first2) == 1 and first2 == first1[0]) or
                   SequenceMatcher(None, first1, first2).ratio() > 0.8)
    if not first_match:
        return False

    def levenshtein_distance(s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        previous_row = list(range(len(s2) + 1))
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (0 if c1 == c2 else 1)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]

    edit_dist = levenshtein_distance(last1, last2)
    similarity_ratio = SequenceMatcher(None, last1, last2).ratio()
    last_match = (last1 == last2) or (edit_dist <= 2) or (similarity_ratio > 0.75)
    if not last_match:
        return False

    middle_compatible = not middle1 or not middle2
    if middle1 and middle2:
        for m1 in middle1:
            compatible = False
            for m2 in middle2:
                if (m1 == m2 or
                    (len(m1) == 1 and m1 == m2[0]) or
                    (len(m2) == 1 and m2 == m1[0]) or
                    SequenceMatcher(None, m1, m2).ratio() > 0.75):
                    compatible = True
                    break
            if not compatible:
                middle_compatible = False
                break

    return first_match and last_match and middle_compatible

def similarity_score(name1: str, name2: str) -> float:
    if names_match_fuzzy(name1, name2):
        return 1.0
    clean1 = clean_name(name1)
    clean2 = clean_name(name2)
    direct_similarity = SequenceMatcher(None, clean1, clean2).ratio()
    comp1 = extract_name_components(name1)
    comp2 = extract_name_components(name2)
    parts1 = comp1['all_parts']
    parts2 = comp2['all_parts']
    if not parts1 or not parts2:
        return direct_similarity
    intersection = len(parts1.intersection(parts2))
    union = len(parts1.union(parts2))
    overlap_ratio = intersection / union if union > 0 else 0
    return max(direct_similarity, overlap_ratio)

def consolidate_similar_borrowers(master_borrowers: List[str]) -> List[Dict[str, Any]]:
    if not master_borrowers:
        return []
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

def extract_individual_names_from_multi_borrower(multi_borrower_name: str) -> List[str]:
    if not multi_borrower_name:
        return []
    names = [n.strip() for n in multi_borrower_name.split(',') if n.strip()]
    return names

def find_single_borrower_match(document_borrower_name: str, consolidated_borrowers: List[Dict[str, Any]]) -> Optional[str]:
    best_match = None
    best_score = 0.0
    for borrower_group in consolidated_borrowers:
        for variation in borrower_group['all_variations']:
            if names_match_fuzzy(document_borrower_name, variation):
                score = similarity_score(document_borrower_name, variation)
                if score > best_score:
                    best_score = score
                    best_match = borrower_group['primary_name']
    return best_match

def find_best_borrower_match(document_borrower_name: str, consolidated_borrowers: List[Dict[str, Any]]) -> Optional[str]:
    if not document_borrower_name or not consolidated_borrowers:
        return None
    individuals = extract_individual_names_from_multi_borrower(document_borrower_name)
    if len(individuals) > 1:
        for ind in individuals:
            match = find_single_borrower_match(ind, consolidated_borrowers)
            if match:
                return match
        return None
    return find_single_borrower_match(document_borrower_name, consolidated_borrowers)

# -------------------------------
# Document extraction
# -------------------------------

LEAF_KEYS = [
    "Borrower Name", "Account Number", "Year", "Schedule C", "Schedule E",
    "Paystub", "Form 1040", "Form 4797"
]

def _is_leaf_document(d: Dict[str, Any]) -> bool:
    if not isinstance(d, dict):
        return False
    return any(k in d for k in LEAF_KEYS)

def _process_labels_recursive(labels_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    out = {}
    if not isinstance(labels_list, list):
        return out

    for item in labels_list:
        if not isinstance(item, dict):
            continue
        label_name = item.get("LabelName")
        if not label_name:
            continue

        # Leaf document found, return directly
        if _is_leaf_document(item):
            # Extract Values as key-value
            if "Values" in item:
                leaf_data = {}
                for val_obj in item["Values"]:
                    if isinstance(val_obj, dict) and "Value" in val_obj:
                        leaf_data[label_name] = val_obj["Value"]
                out.update(leaf_data)
            continue

        # Process Values
        if "Values" in item and isinstance(item.get("Values"), list):
            vals = [v.get("Value") if isinstance(v, dict) else v for v in item["Values"]]
            vals = [v for v in vals if v is not None and v != "N/A"]
            if vals:
                out[label_name] = vals[0] if len(vals) == 1 else vals

        # Process Groups recursively
        if "Groups" in item and isinstance(item.get("Groups"), list):
            records = []
            for group in item["Groups"]:
                if isinstance(group, dict):
                    if "RecordLabels" in group:
                        rec = _process_labels_recursive(group["RecordLabels"])
                        if rec:
                            records.append(rec)
                    elif "Labels" in group:
                        rec = _process_labels_recursive(group["Labels"])
                        if rec:
                            records.append(rec)
            if records:
                out[label_name] = records

    return out

def _extract_any_nested(data: Union[Dict[str, Any], List[Any]], parent_key: str = "") -> Dict[str, Any]:
    out = {}
    sep = "."
    if isinstance(data, dict):
        for k, v in data.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict) or isinstance(v, list):
                out.update(_extract_any_nested(v, new_key))
            else:
                if v is not None and v != "N/A":
                    out[new_key] = v
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            list_key = f"{parent_key}[{idx}]" if parent_key else f"[{idx}]"
            if isinstance(item, (dict, list)):
                out.update(_extract_any_nested(item, list_key))
            else:
                if item is not None and item != "N/A":
                    out[list_key] = item
    return out

def extract_structured_document_data(doc_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Robust wrapper that returns nested, structured extraction for an entire doc.
    Ensures each document type contains only its own values, splitting nested keys.
    """
    if not isinstance(doc_data, dict):
        return {}

    def split_nested_by_doc_type(d: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively splits nested dicts so that each top-level key contains only relevant data.
        """
        result = {}
        for k, v in d.items():
            if isinstance(v, dict):
                # If all nested keys are distinct doc types, split them
                nested_split = split_nested_by_doc_type(v)
                for nk, nv in nested_split.items():
                    # Avoid merging into parent if key already exists
                    result.setdefault(nk, []).append(nv)
            else:
                # Keep scalar values at this level
                result.setdefault(k, []).append(v)
        return result

    try:
        out = {}

        summary = doc_data.get("Summary")
        if isinstance(summary, list) and summary:
            for idx, section in enumerate(summary):
                skill = section.get("SkillName") or f"Section_{idx}"
                labels = section.get("Labels") or []

                # Process labels recursively
                section_data = _process_labels_recursive(labels)

                # Split nested document types
                split_data = {}
                for key, value in section_data.items():
                    if isinstance(value, dict):
                        # Treat each nested dict as its own doc_type
                        split_data[key] = value
                    else:
                        split_data[key] = value

                out[skill] = split_data

        else:
            out = _extract_any_nested(doc_data)

        # Preserve top-level metadata
        for meta in ("Title", "GeneratedOn", "Url", "StageName"):
            if doc_data.get(meta) is not None:
                out.setdefault("_meta", {})[meta] = doc_data[meta]

        return out

    except Exception as e:
        return {"_ParseError": str(e), "_DocTitle": doc_data.get("Title", "Unknown")}
