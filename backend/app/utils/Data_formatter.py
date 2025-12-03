import json
import re
from difflib import SequenceMatcher


class BorrowerDocumentProcessor:
    def __init__(self, input_file, output_file):
        self.input_file = input_file
        self.output_file = output_file

    @staticmethod
    def clean_name(name):
        if not name:
            return ""
        name = str(name).upper()
        name = re.sub(r'\b(POD|JR|SR|III|II|IV)\b', '', name)
        name = re.sub(r'[^\w\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    @classmethod
    def extract_name_components(cls, name):
        cleaned = cls.clean_name(name)
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

    @staticmethod
    def is_initial_match(full_name, initial):
        if not full_name or not initial:
            return False
        return full_name[0].upper() == initial.upper()

    @staticmethod
    def names_match_fuzzy(name1, name2, threshold=0.6):
        if not name1 or not name2:
            return False

        clean1 = BorrowerDocumentProcessor.clean_name(name1)
        clean2 = BorrowerDocumentProcessor.clean_name(name2)

        if clean1 == clean2:
            return True

        parts1 = [part for part in clean1.split() if part]
        parts2 = [part for part in clean2.split() if part]

        if len(parts1) < 2 or len(parts2) < 2:
            return False

        first1, last1 = parts1[0], parts1[-1]
        first2, last2 = parts2[0], parts2[-1]

        middle1 = parts1[1:-1] if len(parts1) > 2 else []
        middle2 = parts2[1:-1] if len(parts2) > 2 else []

        first_match = first1 == first2 or (
            len(first1) == 1 and first1 == first2[0]
        ) or (
            len(first2) == 1 and first2 == first1[0]
        ) or (
            SequenceMatcher(None, first1, first2).ratio() > 0.8
        )

        if not first_match:
            return False

        def levenshtein_distance(s1, s2):
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

        last_match = last1 == last2 or edit_dist <= 2 or similarity_ratio > 0.75

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

    @classmethod
    def similarity_score(cls, name1, name2):
        if cls.names_match_fuzzy(name1, name2):
            return 1.0

        clean1 = cls.clean_name(name1)
        clean2 = cls.clean_name(name2)

        direct_similarity = SequenceMatcher(None, clean1, clean2).ratio()

        comp1 = cls.extract_name_components(name1)
        comp2 = cls.extract_name_components(name2)

        parts1 = comp1['all_parts']
        parts2 = comp2['all_parts']

        if not parts1 or not parts2:
            return direct_similarity

        intersection = len(parts1.intersection(parts2))
        union = len(parts1.union(parts2))
        overlap_ratio = intersection / union if union > 0 else 0

        return max(direct_similarity, overlap_ratio)

    @classmethod
    def safe_string_compare(cls, name1, name2, threshold=0.7):
        if not name1 or not name2:
            return False
        return cls.names_match_fuzzy(name1, name2, threshold)

    @classmethod
    def consolidate_similar_borrowers(cls, master_borrowers):
        if not master_borrowers:
            return []

        consolidated = []
        used_indices = set()

        for i, borrower1 in enumerate(master_borrowers):
            if i in used_indices:
                continue

            matching_group = [borrower1]
            used_indices.add(i)

            for j, borrower2 in enumerate(master_borrowers):
                if j <= i or j in used_indices:
                    continue

                match_result = cls.names_match_fuzzy(borrower1, borrower2)
                if match_result:
                    matching_group.append(borrower2)
                    used_indices.add(j)

            consolidated.append({
                'primary_name': borrower1,
                'all_variations': matching_group
            })

        return consolidated

    @staticmethod
    def extract_individual_names_from_multi_borrower(multi_borrower_name):
        if not multi_borrower_name:
            return []
        names = [name.strip() for name in multi_borrower_name.split(',') if name.strip()]
        return names

    @classmethod
    def find_best_borrower_match(cls, document_borrower_name, consolidated_borrowers):
        if not document_borrower_name or not consolidated_borrowers:
            return None

        individual_names = cls.extract_individual_names_from_multi_borrower(document_borrower_name)

        if len(individual_names) > 1:
            for individual_name in individual_names:
                match = cls.find_single_borrower_match(individual_name, consolidated_borrowers)
                if match:
                    return match
            return None
        else:
            return cls.find_single_borrower_match(document_borrower_name, consolidated_borrowers)

    @classmethod
    def find_single_borrower_match(cls, document_borrower_name, consolidated_borrowers):
        if not document_borrower_name or not consolidated_borrowers:
            return None

        best_match = None
        best_score = 0

        for borrower_group in consolidated_borrowers:
            for variation in borrower_group['all_variations']:
                if cls.names_match_fuzzy(document_borrower_name, variation):
                    score = cls.similarity_score(document_borrower_name, variation)
                    if score > best_score:
                        best_score = score
                        best_match = borrower_group['primary_name']

        return best_match

    @staticmethod
    def extract_borrower_name_from_document(doc_data):
        if not isinstance(doc_data, dict):
            return None

        borrower_name = None

        if 'Summary' in doc_data:
            summaries = doc_data['Summary'] if isinstance(doc_data['Summary'], list) else [doc_data['Summary']]
            for summary in summaries:
                if 'Labels' in summary:
                    for label in summary['Labels']:
                        label_name = label.get('LabelName', '').lower()

                        borrower_indicators = [
                            'borrower name', 'employee name', 'account holder name',
                            'applicant name', 'employee full name', 'full name'
                        ]

                        employer_indicators = [
                            'employer', 'company', 'organization', 'business',
                            'corp', 'inc', 'llc', 'ltd', 'bank', 'association'
                        ]

                        is_borrower_field = any(indicator in label_name for indicator in borrower_indicators)
                        is_employer_field = any(indicator in label_name for indicator in employer_indicators)

                        if is_borrower_field and not is_employer_field:
                            if 'Values' in label and label['Values']:
                                for val_obj in label['Values']:
                                    if 'Value' in val_obj and val_obj['Value']:
                                        value = val_obj['Value'].strip()

                                        company_patterns = [
                                            r'\b(LLC|INC|CORP|LTD|CO|COMPANY|BANK|ASSOCIATION|CHASE|JPMORGAN)\b',
                                            r'\b(LENDING|FINANCIAL|SERVICES|SOLUTIONS|GROUP)\b'
                                        ]

                                        is_company_name = any(re.search(pattern, value.upper()) for pattern in company_patterns)

                                        if not is_company_name and not re.match(r'^\d+$', value) and len(value) > 2:
                                            if not borrower_name or len(value) > len(borrower_name):
                                                borrower_name = value

        return borrower_name

    @staticmethod
    def extract_clean_labels(doc_data):
        if not isinstance(doc_data, dict):
            return {}

        clean_data = {}

        if 'Summary' in doc_data:
            summaries = doc_data['Summary'] if isinstance(doc_data['Summary'], list) else [doc_data['Summary']]
            for summary in summaries:
                if 'Labels' in summary:
                    for label in summary['Labels']:
                        label_name = label.get('LabelName')
                        if not label_name:
                            continue

                        if 'Values' in label and label['Values']:
                            values = []
                            for val_obj in label['Values']:
                                if 'Value' in val_obj:
                                    values.append(val_obj['Value'])

                            if values:
                                if len(values) == 1:
                                    clean_data[label_name] = values[0]
                                else:
                                    clean_data[label_name] = values

                        elif 'Groups' in label and label['Groups']:
                            grouped_records = []

                            for group in label['Groups']:
                                group_name = group.get('GroupName', 'Record')
                                record_data = {'Group': group_name}

                                if 'RecordLabels' in group:
                                    for record_label in group['RecordLabels']:
                                        record_label_name = record_label.get('LabelName')
                                        if record_label_name and 'Values' in record_label:
                                            record_values = []
                                            for val_obj in record_label['Values']:
                                                if 'Value' in val_obj:
                                                    record_values.append(val_obj['Value'])

                                            if record_values:
                                                if len(record_values) == 1:
                                                    record_data[record_label_name] = record_values[0]
                                                else:
                                                    record_data[record_label_name] = record_values

                                if len(record_data) > 1:
                                    grouped_records.append(record_data)

                            if grouped_records:
                                clean_data[label_name] = grouped_records

        excluded_fields = {
            'summary', 'labels', 'values', 'confidence', 'confidencescore',
            'page', 'pageno', 'pagenumber', 'coordinates', 'bbox', 'x', 'y',
            'width', 'height', 'top', 'left', 'right', 'bottom',
            'extraction_confidence', 'ocr_confidence', 'link'
        }

        for key, value in doc_data.items():
            key_lower = key.lower()
            if key_lower in excluded_fields or key == 'Summary':
                continue

            if isinstance(value, (str, int, float, list)):
                if isinstance(value, list):
                    if value and isinstance(value[0], dict):
                        extracted_list = []
                        for item in value:
                            if isinstance(item, dict):
                                item_data = {}
                                for item_key, item_value in item.items():
                                    if item_key.lower() not in excluded_fields:
                                        item_data[item_key] = item_value
                                if item_data:
                                    extracted_list.append(item_data)
                        if extracted_list:
                            clean_data[key] = extracted_list
                    elif value and not all(isinstance(v, dict) for v in value):
                        clean_data[key] = value
                elif value and str(value).strip():
                    clean_data[key] = value

        metadata_fields = ['Title', 'Url', 'StageName', 'GeneratedOn']
        for field in metadata_fields:
            if field in doc_data:
                clean_data[field] = doc_data[field]

        return clean_data

    def show_json_structure(self, limit=2):
        with open(self.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        structure_info = {}

        if isinstance(data, list):
            items_to_check = data[:limit]
        elif isinstance(data, dict):
            items_to_check = [data]
        else:
            return {}

        structure_info["items"] = []
        for item in items_to_check:
            if isinstance(item, dict):
                item_info = {"BorrowerName": item.get('BorrowerName', 'N/A')}
                for key, value in item.items():
                    if key != 'BorrowerName':
                        if isinstance(value, list):
                            item_info[key] = f"{len(value)} documents"
                        else:
                            item_info[key] = str(type(value))
                structure_info["items"].append(item_info)

        return structure_info

    def clean_borrower_documents(self):
        with open(self.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if isinstance(data, dict):
            items_to_process = []
            for key, value in data.items():
                if isinstance(value, list) and value:
                    if isinstance(value[0], dict) and 'BorrowerName' in value[0]:
                        items_to_process = value
                        break

            if not items_to_process:
                if 'BorrowerName' in data:
                    items_to_process = [data]
                else:
                    return {}
        elif isinstance(data, list):
            items_to_process = data
        else:
            return {}

        master_borrowers = set()
        for item in items_to_process:
            if 'BorrowerName' in item and item['BorrowerName']:
                borrower_name = item['BorrowerName'].strip()
                if borrower_name and borrower_name != "Unidentified Borrower":
                    if ',' in borrower_name:
                        borrowers = [b.strip() for b in borrower_name.split(',') if b.strip()]
                        master_borrowers.update(borrowers)
                    else:
                        master_borrowers.add(borrower_name)

        master_borrowers = list(master_borrowers)

        if not master_borrowers:
            return {}

        consolidated_borrowers = self.consolidate_similar_borrowers(master_borrowers)

        cleaned_data = {}
        for borrower_group in consolidated_borrowers:
            cleaned_data[borrower_group['primary_name']] = {}

        for item in items_to_process:
            if not isinstance(item, dict) or 'BorrowerName' not in item:
                continue

            top_level_borrower = item['BorrowerName']

            for key, value in item.items():
                if key == 'BorrowerName':
                    continue

                document_type = key
                documents = value if isinstance(value, list) else [value]

                for doc in documents:
                    if not isinstance(doc, dict):
                        continue

                    doc_borrower_name = self.extract_borrower_name_from_document(doc)

                    if not doc_borrower_name:
                        if top_level_borrower and top_level_borrower != "Unidentified Borrower":
                            matched_borrower = self.find_best_borrower_match(top_level_borrower, consolidated_borrowers)
                            if not matched_borrower:
                                continue
                        else:
                            continue
                    else:
                        matched_borrower = self.find_best_borrower_match(doc_borrower_name, consolidated_borrowers)
                        if not matched_borrower:
                            continue

                    clean_doc = self.extract_clean_labels(doc)
                    if not clean_doc:
                        continue

                    if document_type not in cleaned_data[matched_borrower]:
                        cleaned_data[matched_borrower][document_type] = []

                    cleaned_data[matched_borrower][document_type].append(clean_doc)

        cleaned_data = {k: v for k, v in cleaned_data.items() if v}

        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

        return cleaned_data
    def clean_json(self, obj):
        if isinstance(obj, dict):
            # Remove unwanted keys
            obj.pop("Link", None)
            obj.pop("ConfidenceScore", None)
            obj.pop("Url", None)
            obj.pop("LabelOrder", None)
            obj.pop("ScreenshotUrl", None)
            obj.pop("GeneratedOn", None)
            obj.pop("DocTitle", None)
            obj.pop("PageNumber", None)
            obj.pop("StageName", None)
            obj.pop("Title", None)
            obj.pop("SkillName", None)
            # Recursively clean nested dicts
            for key in list(obj.keys()):
                self.clean_json(obj[key])
        elif isinstance(obj, list):
            for item in obj:
                self.clean_json(item)
        return obj
    def filter_documents_by_type(self, processed_data, document_types):
        """
        Filter processed borrower data to include only specified document types.
        
        Args:
            processed_data (dict): The processed JSON data with borrower names as keys
            document_types (list): List of document types to keep (e.g., ['Paystubs', 'W2'])
        
        Returns:
            dict: Filtered data containing only the specified document types for each borrower
        """
        filtered_data = {}
        
        # Iterate through each borrower
        for borrower_name, documents in processed_data.items():
            filtered_borrower_data = {}
            
            # Iterate through each document type for this borrower
            for doc_type, doc_list in documents.items():
                # Check if this document type is in our filter list (case-insensitive)
                if any(doc_type.lower() == filter_type.lower() for filter_type in document_types):
                    filtered_borrower_data[doc_type] = doc_list
            
            # Only add borrower if they have at least one of the requested document types
            if filtered_borrower_data:
                filtered_data[borrower_name] = filtered_borrower_data
        
        return filtered_data

