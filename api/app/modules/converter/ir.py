from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class AttributeType(str, Enum):
    NUMERIC = "numeric"
    NOMINAL = "nominal"
    STRING = "string"
    DATE = "date"

class Attribute(BaseModel):
    name: str
    type: AttributeType
    nominal_values: Optional[List[str]] = Field(default=None, description="Enumerated values if type is nominal")
    date_format: Optional[str] = Field(default=None, description="Date format string if type is date")

    def to_arff_declaration(self) -> str:
        # Quote attribute name if it contains spaces, hyphens, or special characters
        safe_name = f"'{self.name}'" if (" " in self.name or "-" in self.name or "." in self.name) else self.name
        
        if self.type == AttributeType.NUMERIC:
            return f"@attribute {safe_name} numeric"
        elif self.type == AttributeType.NOMINAL:
            vals = self.nominal_values or []
            # Quote nominal value if it has spaces or commas
            formatted_vals = []
            for v in vals:
                v_str = str(v)
                if " " in v_str or "," in v_str or "'" in v_str:
                    clean = v_str.replace("'", "\\'")
                    formatted_vals.append(f"'{clean}'")
                else:
                    formatted_vals.append(v_str)
            return f"@attribute {safe_name} {{{','.join(formatted_vals)}}}"
        elif self.type == AttributeType.STRING:
            return f"@attribute {safe_name} string"
        elif self.type == AttributeType.DATE:
            fmt = f" \"{self.date_format}\"" if self.date_format else ""
            return f"@attribute {safe_name} date{fmt}"
        return f"@attribute {safe_name} string"

class ValidationDefect(BaseModel):
    line_number: int
    column: Optional[str] = None
    defect_type: str
    message: str
    is_fatal: bool = True

class DatasetIR(BaseModel):
    relation_name: str
    attributes: List[Attribute]
    instances: List[List[Any]]

    @property
    def instance_count(self) -> int:
        return len(self.instances)

    @property
    def attribute_count(self) -> int:
        return len(self.attributes)

    def get_column_values(self, col_index: int) -> List[Any]:
        if col_index < 0 or col_index >= len(self.attributes):
            return []
        return [row[col_index] for row in self.instances]
