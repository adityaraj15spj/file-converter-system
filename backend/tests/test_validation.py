import pytest
from app.modules.converter.engine import ConversionEngine
from app.modules.converter.ir import AttributeType

def test_inconsistent_field_count_detection():
    # Line 3 has only 2 fields instead of 3
    malformed_csv = (
        "col1,col2,col3\n"
        "1,2,3\n"
        "4,5\n"
        "7,8,9\n"
    )
    result = ConversionEngine.execute_conversion(
        content=malformed_csv,
        source_format="csv",
        target_format="arff"
    )
    assert result["success"] is False
    assert result["converted_output"] is None
    defects = result["defects"]
    assert len(defects) >= 1
    # Line 3 should be flagged
    assert any(d["line_number"] == 3 and d["defect_type"] == "INCONSISTENT_FIELD_COUNT" for d in defects)

def test_duplicate_attribute_names_in_csv():
    dup_csv = (
        "age,salary,age\n"
        "25,50000,25\n"
    )
    result = ConversionEngine.execute_conversion(
        content=dup_csv,
        source_format="csv",
        target_format="arff"
    )
    assert result["success"] is False
    assert any(d["defect_type"] == "DUPLICATE_ATTRIBUTE_NAME" for d in result["defects"])

def test_missing_data_section_in_arff():
    arff_no_data = (
        "@relation sample\n"
        "@attribute a numeric\n"
        "@attribute b numeric\n"
    )
    result = ConversionEngine.execute_conversion(
        content=arff_no_data,
        source_format="arff",
        target_format="csv"
    )
    assert result["success"] is False
    assert any(d["defect_type"] == "MISSING_DATA_SECTION" for d in result["defects"])

def test_schema_override_type_violation():
    csv_data = (
        "id,status\n"
        "1,active\n"
        "2,pending\n"
    )
    # Attempt to override 'status' to NUMERIC
    overrides = [
        {"name": "id", "type": "numeric"},
        {"name": "status", "type": "numeric"}
    ]
    result = ConversionEngine.execute_conversion(
        content=csv_data,
        source_format="csv",
        target_format="arff",
        overridden_attributes=overrides
    )
    assert result["success"] is False
    assert any("cannot be converted to numeric" in d["message"] for d in result["defects"])
