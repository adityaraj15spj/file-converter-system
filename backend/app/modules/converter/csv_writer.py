import csv
import io
from typing import List, Any
from .ir import DatasetIR

def write_to_csv(
    dataset: DatasetIR,
    delimiter: str = ",",
    quote_char: str = '"',
    include_header: bool = True
) -> str:
    output = io.StringIO()
    writer = csv.writer(
        output,
        delimiter=delimiter,
        quotechar=quote_char,
        quoting=csv.QUOTE_MINIMAL,
        lineterminator="\n"
    )

    # Header row
    if include_header:
        headers = [attr.name for attr in dataset.attributes]
        writer.writerow(headers)

    # Data rows
    for instance in dataset.instances:
        row_vals = []
        for val in instance:
            if val is None or str(val).strip() == "?":
                row_vals.append("")
            else:
                row_vals.append(val)
        writer.writerow(row_vals)

    return output.getvalue()
