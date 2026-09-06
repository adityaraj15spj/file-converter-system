import csv
import io
from typing import List, Tuple, Optional, Any
from .ir import ValidationDefect

class CSVParseResult:
    def __init__(self, headers: List[str], rows: List[List[Any]], defects: List[ValidationDefect], raw_line_map: List[int]):
        self.headers = headers
        self.rows = rows
        self.defects = defects
        self.raw_line_map = raw_line_map # Maps row index to source file 1-based line number

def parse_csv_content(
    content: str,
    delimiter: str = ",",
    quote_char: str = '"',
    has_header: bool = True
) -> CSVParseResult:
    defects: List[ValidationDefect] = []
    rows: List[List[Any]] = []
    headers: List[str] = []
    raw_line_map: List[int] = []

    if not content.strip():
        defects.append(ValidationDefect(
            line_number=1,
            defect_type="EMPTY_FILE",
            message="The uploaded CSV file is empty.",
            is_fatal=True
        ))
        return CSVParseResult([], [], defects, [])

    # We iterate and parse records while tracking line numbers
    # Custom stateful character-by-character or line-aware parser to get exact line numbers
    lines = content.splitlines(keepends=True)
    buffer = io.StringIO(content)
    
    try:
        reader = csv.reader(
            buffer,
            delimiter=delimiter,
            quotechar=quote_char,
            escapechar=None,
            doublequote=True,
            skipinitialspace=False
        )
    except Exception as e:
        defects.append(ValidationDefect(
            line_number=1,
            defect_type="READER_INIT_ERROR",
            message=f"Could not initialize CSV reader: {str(e)}",
            is_fatal=True
        ))
        return CSVParseResult([], [], defects, [])

    expected_col_count: Optional[int] = None
    current_line_num = 1

    row_idx = 0
    while True:
        try:
            line_start_num = reader.line_num + 1 if row_idx > 0 else 1
            record = next(reader)
        except StopIteration:
            break
        except csv.Error as err:
            defects.append(ValidationDefect(
                line_number=reader.line_num,
                defect_type="MALFORMED_CSV_LINE",
                message=f"CSV formatting error: {str(err)}",
                is_fatal=True
            ))
            break
        except Exception as ex:
            defects.append(ValidationDefect(
                line_number=reader.line_num,
                defect_type="UNEXPECTED_PARSE_ERROR",
                message=f"Parse error: {str(ex)}",
                is_fatal=True
            ))
            break

        actual_line_in_source = reader.line_num

        # Check for empty record at end of file
        if not record or (len(record) == 1 and record[0].strip() == "" and reader.line_num == len(lines)):
            continue

        if has_header and row_idx == 0:
            headers = [col.strip() for col in record]
            expected_col_count = len(headers)
            
            # Check duplicate header names
            seen = set()
            for col_i, h in enumerate(headers):
                if not h:
                    headers[col_i] = f"attr_{col_i+1}"
                    h = headers[col_i]
                if h in seen:
                    defects.append(ValidationDefect(
                        line_number=actual_line_in_source,
                        column=h,
                        defect_type="DUPLICATE_ATTRIBUTE_NAME",
                        message=f"Duplicate column header '{h}' detected in header row.",
                        is_fatal=True
                    ))
                seen.add(h)
            row_idx += 1
            continue

        if not has_header and row_idx == 0:
            expected_col_count = len(record)
            headers = [f"attr_{i+1}" for i in range(expected_col_count)]

        # Check column count consistency (FR-014)
        if expected_col_count is not None and len(record) != expected_col_count:
            defects.append(ValidationDefect(
                line_number=actual_line_in_source,
                defect_type="INCONSISTENT_FIELD_COUNT",
                message=f"Row has {len(record)} fields, but header defined {expected_col_count} fields.",
                is_fatal=True
            ))

        # Sanitize values: empty string or '?' is treated as None (missing value)
        cleaned_row = []
        for val in record:
            s_val = val.strip()
            if s_val == "" or s_val == "?":
                cleaned_row.append(None)
            else:
                cleaned_row.append(val)
        
        rows.append(cleaned_row)
        raw_line_map.append(actual_line_in_source)
        row_idx += 1

    return CSVParseResult(headers, rows, defects, raw_line_map)
