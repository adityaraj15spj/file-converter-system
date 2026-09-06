import pytest
from app.modules.converter.engine import ConversionEngine
from app.modules.converter.csv_parser import parse_csv_content
from app.modules.converter.arff_parser import parse_arff_content
from app.modules.converter.arff_writer import write_to_arff
from app.modules.converter.csv_writer import write_to_csv

def test_csv_to_arff_and_back_roundtrip():
    original_csv = (
        "sepal_length,sepal_width,petal_length,petal_width,class\n"
        "5.1,3.5,1.4,0.2,Iris-setosa\n"
        "4.9,3.0,1.4,0.2,Iris-setosa\n"
        "7.0,3.2,4.7,1.4,Iris-versicolor\n"
        "6.3,3.3,6.0,2.5,Iris-virginica\n"
    )

    # 1. Convert CSV to ARFF
    conv1 = ConversionEngine.execute_conversion(
        content=original_csv,
        source_format="csv",
        target_format="arff",
        relation_name="iris"
    )
    assert conv1["success"] is True
    arff_content = conv1["converted_output"]
    assert "@relation iris" in arff_content
    assert "@attribute sepal_length numeric" in arff_content
    assert "@attribute class {Iris-setosa,Iris-versicolor,Iris-virginica}" in arff_content
    assert "@data" in arff_content
    assert conv1["instance_count"] == 4
    assert conv1["attribute_count"] == 5

    # 2. Convert generated ARFF back to CSV
    conv2 = ConversionEngine.execute_conversion(
        content=arff_content,
        source_format="arff",
        target_format="csv"
    )
    assert conv2["success"] is True
    back_to_csv = conv2["converted_output"]
    assert conv2["instance_count"] == 4
    assert conv2["attribute_count"] == 5

    # 3. Verify parse of the roundtripped CSV equals original structure
    parsed_original = parse_csv_content(original_csv)
    parsed_roundtrip = parse_csv_content(back_to_csv)

    assert parsed_original.headers == parsed_roundtrip.headers
    assert len(parsed_original.rows) == len(parsed_roundtrip.rows)
    for r1, r2 in zip(parsed_original.rows, parsed_roundtrip.rows):
        # Check numeric and string values
        for v1, v2 in zip(r1, r2):
            if v1 is None:
                assert v2 is None
            else:
                try:
                    assert float(v1) == pytest.approx(float(v2))
                except ValueError:
                    assert str(v1) == str(v2)

def test_missing_values_and_quotes_handling():
    csv_with_quotes = (
        'name,age,city,remarks\n'
        'Alice,25,"New York, NY",active\n'
        'Bob,?,Chicago,"Needs follow-up"\n'
        '"Charlie, Jr.",30,?,?\n'
    )

    conv_arff = ConversionEngine.execute_conversion(
        content=csv_with_quotes,
        source_format="csv",
        target_format="arff",
        relation_name="users"
    )
    assert conv_arff["success"] is True
    arff_text = conv_arff["converted_output"]

    # Verify missing value '?'
    assert "?" in arff_text
    # Verify quotes around fields with commas
    assert "'New York, NY'" in arff_text or '"New York, NY"' in arff_text
    assert "'Charlie, Jr.'" in arff_text or '"Charlie, Jr."' in arff_text

    # Convert back to CSV
    conv_back = ConversionEngine.execute_conversion(
        content=arff_text,
        source_format="arff",
        target_format="csv"
    )
    assert conv_back["success"] is True
    csv_text = conv_back["converted_output"]
    
    parsed = parse_csv_content(csv_text)
    assert parsed.headers == ["name", "age", "city", "remarks"]
    assert len(parsed.rows) == 3
    # Check Charlie Jr row
    assert parsed.rows[2][0] == "Charlie, Jr."
    assert parsed.rows[2][2] is None
    assert parsed.rows[2][3] is None
