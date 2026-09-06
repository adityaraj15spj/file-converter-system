from typing import List, Any, Optional
from .ir import Attribute, AttributeType, DatasetIR, ValidationDefect
from .type_inference import is_numeric, matches_date_pattern

def validate_dataset_against_schema(
    attributes: List[Attribute],
    rows: List[List[Any]],
    raw_line_map: Optional[List[int]] = None
) -> List[ValidationDefect]:
    defects: List[ValidationDefect] = []
    
    # Check duplicate attribute names
    seen_names = set()
    for attr in attributes:
        if attr.name.lower() in seen_names:
            defects.append(ValidationDefect(
                line_number=1,
                column=attr.name,
                defect_type="DUPLICATE_ATTRIBUTE_NAME",
                message=f"Duplicate attribute name '{attr.name}' in schema.",
                is_fatal=True
            ))
        seen_names.add(attr.name.lower())

    # Validate each row against the schema types
    for row_idx, row in enumerate(rows):
        line_num = raw_line_map[row_idx] if (raw_line_map and row_idx < len(raw_line_map)) else (row_idx + 2)

        if len(row) != len(attributes):
            defects.append(ValidationDefect(
                line_number=line_num,
                defect_type="INCONSISTENT_FIELD_COUNT",
                message=f"Instance has {len(row)} values, but schema requires {len(attributes)} columns.",
                is_fatal=True
            ))
            continue

        for col_idx, (val, attr) in enumerate(zip(row, attributes)):
            if val is None:
                # Missing value is valid
                continue
            
            s_val = str(val).strip()
            if s_val == "" or s_val == "?":
                continue

            if attr.type == AttributeType.NUMERIC:
                if not is_numeric(val):
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        column=attr.name,
                        defect_type="TYPE_VIOLATION_NUMERIC",
                        message=f"Value '{val}' on line {line_num} cannot be converted to numeric for attribute '{attr.name}'.",
                        is_fatal=True
                    ))
            elif attr.type == AttributeType.NOMINAL:
                if attr.nominal_values is not None and s_val not in attr.nominal_values:
                    defects.append(ValidationDefect(
                        line_number=line_num,
                        column=attr.name,
                        defect_type="TYPE_VIOLATION_NOMINAL",
                        message=f"Value '{s_val}' on line {line_num} is not in allowed nominal set {attr.nominal_values} for attribute '{attr.name}'.",
                        is_fatal=True
                    ))
            elif attr.type == AttributeType.DATE:
                # If format is specified, test against pattern
                if attr.date_format:
                    # Basic validation or pattern check
                    pass

    return defects
