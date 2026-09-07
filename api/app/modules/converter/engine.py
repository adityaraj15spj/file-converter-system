from typing import List, Dict, Any, Optional, Tuple
import os
from .ir import DatasetIR, Attribute, AttributeType, ValidationDefect
from .csv_parser import parse_csv_content
from .arff_parser import parse_arff_content
from .type_inference import infer_attribute_types
from .validator import validate_dataset_against_schema
from .arff_writer import write_to_arff
from .csv_writer import write_to_csv

class ConversionEngine:
    @staticmethod
    def detect_format(filename: str, content: str) -> Tuple[str, str]:
        """Returns (source_format, target_format) e.g. ('csv', 'arff') or ('arff', 'csv')"""
        ext = os.path.splitext(filename)[1].lower()
        
        if ext == ".arff":
            return "arff", "csv"
        elif ext == ".csv":
            return "csv", "arff"

        # Content-based detection for leading lines
        leading_lines = content[:2048].lower()
        if "@relation" in leading_lines or "@attribute" in leading_lines:
            return "arff", "csv"
        
        # Default to CSV
        return "csv", "arff"

    @staticmethod
    def inspect_file(
        content: str,
        source_format: str,
        delimiter: str = ",",
        quote_char: str = '"',
        has_header: bool = True,
        nominal_threshold: int = 20
    ) -> Dict[str, Any]:
        """Parses file, infers/reads schema, and returns preview and defects."""
        if source_format.lower() == "csv":
            parse_res = parse_csv_content(content, delimiter=delimiter, quote_char=quote_char, has_header=has_header)
            if parse_res.defects and any(d.is_fatal for d in parse_res.defects):
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in parse_res.defects],
                    "attributes": [],
                    "sample_rows": [],
                    "instance_count": 0,
                    "attribute_count": 0,
                    "relation_name": "dataset"
                }

            inferred_attributes = infer_attribute_types(parse_res.headers, parse_res.rows, nominal_threshold=nominal_threshold)
            return {
                "success": True,
                "defects": [d.model_dump() for d in parse_res.defects],
                "attributes": [a.model_dump() for a in inferred_attributes],
                "sample_rows": parse_res.rows[:10],
                "instance_count": len(parse_res.rows),
                "attribute_count": len(inferred_attributes),
                "relation_name": "dataset"
            }

        else: # ARFF
            parse_res = parse_arff_content(content)
            fatal_defects = [d for d in parse_res.defects if d.is_fatal]
            if fatal_defects:
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in parse_res.defects],
                    "attributes": [],
                    "sample_rows": [],
                    "instance_count": 0,
                    "attribute_count": 0,
                    "relation_name": "dataset"
                }

            dataset_ir = parse_res.dataset_ir
            return {
                "success": True,
                "defects": [d.model_dump() for d in parse_res.defects],
                "attributes": [a.model_dump() for a in dataset_ir.attributes],
                "sample_rows": dataset_ir.instances[:10],
                "instance_count": dataset_ir.instance_count,
                "attribute_count": dataset_ir.attribute_count,
                "relation_name": dataset_ir.relation_name
            }

    @staticmethod
    def execute_conversion(
        content: str,
        source_format: str,
        target_format: str,
        relation_name: Optional[str] = None,
        overridden_attributes: Optional[List[Dict[str, Any]]] = None,
        delimiter: str = ",",
        quote_char: str = '"',
        has_header: bool = True,
        nominal_threshold: int = 20
    ) -> Dict[str, Any]:
        """Converts dataset from source format to target format with full validation."""
        defects: List[ValidationDefect] = []

        if source_format.lower() == "csv":
            csv_res = parse_csv_content(content, delimiter=delimiter, quote_char=quote_char, has_header=has_header)
            defects.extend(csv_res.defects)

            fatal_parse_errors = [d for d in defects if d.is_fatal]
            if fatal_parse_errors:
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in defects],
                    "converted_output": None
                }

            # Build schema from overrides or inference
            if overridden_attributes:
                attributes = [Attribute(**a) for a in overridden_attributes]
            else:
                attributes = infer_attribute_types(csv_res.headers, csv_res.rows, nominal_threshold=nominal_threshold)

            # Validate rows against final schema
            val_defects = validate_dataset_against_schema(attributes, csv_res.rows, csv_res.raw_line_map)
            defects.extend(val_defects)

            fatal_val_errors = [d for d in val_defects if d.is_fatal]
            if fatal_val_errors:
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in defects],
                    "converted_output": None
                }

            rel = relation_name.strip() if relation_name else "dataset"
            dataset_ir = DatasetIR(relation_name=rel, attributes=attributes, instances=csv_res.rows)

            if target_format.lower() == "arff":
                converted = write_to_arff(dataset_ir)
            else:
                converted = write_to_csv(dataset_ir, delimiter=delimiter, quote_char=quote_char)

            return {
                "success": True,
                "defects": [d.model_dump() for d in defects],
                "converted_output": converted,
                "preview_header": "\n".join(converted.splitlines()[:25]),
                "instance_count": dataset_ir.instance_count,
                "attribute_count": dataset_ir.attribute_count,
                "relation_name": dataset_ir.relation_name
            }

        else: # ARFF source
            arff_res = parse_arff_content(content)
            defects.extend(arff_res.defects)

            fatal_parse = [d for d in defects if d.is_fatal]
            if fatal_parse:
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in defects],
                    "converted_output": None
                }

            dataset_ir = arff_res.dataset_ir
            if overridden_attributes:
                dataset_ir.attributes = [Attribute(**a) for a in overridden_attributes]

            if relation_name:
                dataset_ir.relation_name = relation_name

            val_defects = validate_dataset_against_schema(dataset_ir.attributes, dataset_ir.instances, arff_res.raw_line_map)
            defects.extend(val_defects)

            fatal_val = [d for d in val_defects if d.is_fatal]
            if fatal_val:
                return {
                    "success": False,
                    "defects": [d.model_dump() for d in defects],
                    "converted_output": None
                }

            if target_format.lower() == "csv":
                converted = write_to_csv(dataset_ir, delimiter=delimiter, quote_char=quote_char)
            else:
                converted = write_to_arff(dataset_ir)

            return {
                "success": True,
                "defects": [d.model_dump() for d in defects],
                "converted_output": converted,
                "preview_header": "\n".join(converted.splitlines()[:25]),
                "instance_count": dataset_ir.instance_count,
                "attribute_count": dataset_ir.attribute_count,
                "relation_name": dataset_ir.relation_name
            }
