import re
from typing import List, Any, Tuple, Optional
from datetime import datetime
from .ir import Attribute, AttributeType

DATE_PATTERNS = [
    (r"^\d{4}-\d{2}-\d{2}$", "yyyy-MM-dd"),
    (r"^\d{4}/\d{2}/\d{2}$", "yyyy/MM/dd"),
    (r"^\d{2}-\d{2}-\d{4}$", "dd-MM-yyyy"),
    (r"^\d{2}/\d{2}/\d{4}$", "dd/MM/yyyy"),
    (r"^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$", "yyyy-MM-dd HH:mm:ss"),
]

def is_numeric(val: Any) -> bool:
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return True
    if isinstance(val, str):
        val = val.strip()
        try:
            float(val)
            return True
        except ValueError:
            return False
    return False

def matches_date_pattern(val: str) -> Optional[str]:
    val = val.strip()
    for pattern, fmt in DATE_PATTERNS:
        if re.match(pattern, val):
            return fmt
    return None

def infer_attribute_types(
    headers: List[str],
    rows: List[List[Any]],
    nominal_threshold: int = 20
) -> List[Attribute]:
    attributes: List[Attribute] = []
    num_cols = len(headers)

    for col_idx in range(num_cols):
        col_name = headers[col_idx]
        col_vals = [row[col_idx] for row in rows if col_idx < len(row)]
        non_missing = [v for v in col_vals if v is not None and str(v).strip() != "" and str(v).strip() != "?"]

        if not non_missing:
            # If all values are missing, default to string
            attributes.append(Attribute(name=col_name, type=AttributeType.STRING))
            continue

        # Check if all non-missing values are numeric
        all_numeric = all(is_numeric(v) for v in non_missing)
        if all_numeric:
            attributes.append(Attribute(name=col_name, type=AttributeType.NUMERIC))
            continue

        # Check if all non-missing values match date format
        first_fmt = matches_date_pattern(str(non_missing[0]))
        if first_fmt:
            all_date = all(matches_date_pattern(str(v)) == first_fmt for v in non_missing)
            if all_date:
                attributes.append(Attribute(name=col_name, type=AttributeType.DATE, date_format=first_fmt))
                continue

        # Distinct values count
        distinct_vals = sorted(list(set(str(v).strip() for v in non_missing)))
        if len(distinct_vals) <= nominal_threshold:
            attributes.append(Attribute(
                name=col_name,
                type=AttributeType.NOMINAL,
                nominal_values=distinct_vals
            ))
        else:
            attributes.append(Attribute(
                name=col_name,
                type=AttributeType.STRING
            ))

    return attributes
