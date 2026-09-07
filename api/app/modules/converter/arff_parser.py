import re
from typing import List, Tuple, Optional, Any
from .ir import Attribute, AttributeType, DatasetIR, ValidationDefect

class ARFFParseResult:
    def __init__(self, dataset_ir: Optional[DatasetIR], defects: List[ValidationDefect], raw_line_map: List[int]):
        self.dataset_ir = dataset_ir
        self.defects = defects
        self.raw_line_map = raw_line_map

def parse_arff_content(content: str) -> ARFFParseResult:
    defects: List[ValidationDefect] = []
    lines = content.splitlines()
    raw_line_map: List[int] = []

    relation_name = "dataset"
    attributes: List[Attribute] = []
    instances: List[List[Any]] = []
    in_data_section = False
    data_section_found = False

    seen_attributes = set()

    for line_idx, line in enumerate(lines):
        line_num = line_idx + 1
        trimmed = line.strip()

        # Ignore comments and blank lines
        if not trimmed or trimmed.startswith("%"):
            continue

        if not in_data_section:
            lower = trimmed.lower()
            if lower.startswith("@relation"):
                parts = trimmed.split(maxsplit=1)
                if len(parts) > 1:
                    rel = parts[1].strip()
                    if (rel.startswith("'") and rel.endswith("'")) or (rel.startswith('"') and rel.endswith('"')):
                        rel = rel[1:-1]
                    relation_name = rel
                continue

            elif lower.startswith("@attribute"):
                # Format: @attribute <name> <type_spec>
                # Using regex to capture name (possibly quoted) and rest
                match = re.match(r"@attribute\s+('[^']+'|\"[^\"]+\"|\S+)\s+(.+)$", trimmed, re.IGNORECASE)
                if not match:
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        defect_type="MALFORMED_ATTRIBUTE_DECLARATION",
                        message=f"Invalid @attribute declaration syntax: '{trimmed}'",
                        is_fatal=True
                    ))
                    continue

                raw_name, raw_type = match.group(1).strip(), match.group(2).strip()
                if (raw_name.startswith("'") and raw_name.endswith("'")) or (raw_name.startswith('"') and raw_name.endswith('"')):
                    attr_name = raw_name[1:-1]
                else:
                    attr_name = raw_name

                if attr_name in seen_attributes:
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        column=attr_name,
                        defect_type="DUPLICATE_ATTRIBUTE_NAME",
                        message=f"Attribute '{attr_name}' declared more than once in ARFF header.",
                        is_fatal=True
                    ))
                seen_attributes.add(attr_name)

                # Parse type
                raw_type_lower = raw_type.lower()
                if raw_type_lower in ["numeric", "real", "integer"]:
                    attributes.append(Attribute(name=attr_name, type=AttributeType.NUMERIC))
                elif raw_type_lower == "string":
                    attributes.append(Attribute(name=attr_name, type=AttributeType.STRING))
                elif raw_type_lower.startswith("date"):
                    # Optional format: date "yyyy-MM-dd HH:mm:ss"
                    date_match = re.match(r"date(?:\s+[\"']([^\"']+)[\"'])?", raw_type, re.IGNORECASE)
                    fmt = date_match.group(1) if (date_match and date_match.group(1)) else "yyyy-MM-dd"
                    attributes.append(Attribute(name=attr_name, type=AttributeType.DATE, date_format=fmt))
                elif raw_type.startswith("{") and raw_type.endswith("}"):
                    # Nominal values
                    nom_inner = raw_type[1:-1].strip()
                    # Split comma while respecting quotes
                    vals = []
                    for item in re.findall(r"(?:'[^']*'|\"[^\"]*\"|[^,]+)", nom_inner):
                        item = item.strip()
                        if (item.startswith("'") and item.endswith("'")) or (item.startswith('"') and item.endswith('"')):
                            item = item[1:-1]
                        vals.append(item)
                    attributes.append(Attribute(name=attr_name, type=AttributeType.NOMINAL, nominal_values=vals))
                else:
                    # Default to string
                    attributes.append(Attribute(name=attr_name, type=AttributeType.STRING))
                continue

            elif lower.startswith("@data"):
                in_data_section = True
                data_section_found = True
                continue
            else:
                defects.append(ValidationDefect(
                    line_number=line_num,
                    defect_type="UNKNOWN_ARFF_DIRECTIVE",
                    message=f"Unrecognized directive outside @data section: '{trimmed}'",
                    is_fatal=False
                ))
        else:
            # We are in the @data section
            # Parse line as comma-separated values, respecting quotes
            try:
                # Custom splitter that handles quoted commas
                parts = []
                current_token = []
                in_quote = False
                quote_char = None
                
                for char in trimmed:
                    if char in ("'", '"'):
                        if not in_quote:
                            in_quote = True
                            quote_char = char
                        elif quote_char == char:
                            in_quote = False
                            quote_char = None
                        else:
                            current_token.append(char)
                    elif char == ',' and not in_quote:
                        parts.append("".join(current_token).strip())
                        current_token = []
                    else:
                        current_token.append(char)
                parts.append("".join(current_token).strip())

                if in_quote:
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        defect_type="UNTERMINATED_QUOTE",
                        message=f"Unterminated quote character '{quote_char}' at line {line_num}.",
                        is_fatal=True
                    ))

                if len(parts) != len(attributes):
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        defect_type="INCONSISTENT_FIELD_COUNT",
                        message=f"Row has {len(parts)} values, expected {len(attributes)} matching declared attributes.",
                        is_fatal=True
                    ))

                row_vals = []
                for idx, token in enumerate(parts):
                    if (token.startswith("'") and token.endswith("'")) or (token.startswith('"') and token.endswith('"')):
                        val = token[1:-1]
                    else:
                        val = token
                    
                    if val == "?" or val == "":
                        row_vals.append(None)
                    else:
                        # Attempt numeric conversion if attribute is numeric
                        if idx < len(attributes) and attributes[idx].type == AttributeType.NUMERIC:
                            try:
                                if "." in val or "e" in val.lower():
                                    row_vals.append(float(val))
                                else:
                                    row_vals.append(int(val))
                            except ValueError:
                                defects.append(ValidationDefect(
                                    line_number=line_num,
                                    column=attributes[idx].name,
                                    defect_type="TYPE_MISMATCH",
                                    message=f"Value '{val}' cannot be parsed as numeric for attribute '{attributes[idx].name}'.",
                                    is_fatal=False
                                ))
                                row_vals.append(val)
                        else:
                            row_vals.append(val)

                instances.append(row_vals)
                raw_line_map.append(line_num)

            except Exception as e:
                defects.append(ValidationDefect(
                    line_number=line_num,
                    defect_type="ARFF_DATA_PARSE_ERROR",
                    message=f"Error parsing data line {line_num}: {str(e)}",
                    is_fatal=True
                ))

    if not data_section_found:
        defects.append(ValidationDefect(
            line_number=len(lines) if lines else 1,
            defect_type="MISSING_DATA_SECTION",
            message="ARFF file is missing the required '@data' section.",
            is_fatal=True
        ))

    if not attributes:
        defects.append(ValidationDefect(
            line_number=1,
            defect_type="NO_ATTRIBUTES_FOUND",
            message="No '@attribute' definitions found in ARFF header.",
            is_fatal=True
        ))

    dataset_ir = DatasetIR(
        relation_name=relation_name,
        attributes=attributes,
        instances=instances
    )

    return ARFFParseResult(dataset_ir=dataset_ir, defects=defects, raw_line_map=raw_line_map)
