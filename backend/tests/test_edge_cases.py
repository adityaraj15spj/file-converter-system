"""
Edge-case tests for the File Converter System.
Covers empty files, special characters, missing values, large rows, and
file extension validation logic.
"""
import pytest
from app.modules.converter.csv_parser import parse_csv_content
from app.modules.converter.arff_parser import parse_arff_content
from app.modules.converter.arff_writer import write_to_arff
from app.modules.converter.csv_writer import write_to_csv
from app.modules.converter.type_inference import infer_attribute_types
from app.modules.converter.ir import DatasetIR, Attribute, AttributeType
from app.modules.converter.engine import ConversionEngine


# ── CSV Parser Edge Cases ──────────────────────────────────────

class TestCSVEdgeCases:
    def test_empty_file(self):
        result = parse_csv_content("")
        assert len(result.defects) == 1
        assert result.defects[0].defect_type == "EMPTY_FILE"
        assert result.defects[0].is_fatal

    def test_whitespace_only(self):
        result = parse_csv_content("   \n  \n  ")
        assert len(result.defects) == 1
        assert result.defects[0].is_fatal

    def test_header_only_no_data(self):
        result = parse_csv_content("a,b,c\n")
        assert result.headers == ["a", "b", "c"]
        assert len(result.rows) == 0

    def test_missing_values_are_none(self):
        csv = "a,b,c\n1,,3\n,2,?\n"
        result = parse_csv_content(csv)
        assert result.rows[0][1] is None  # empty => None
        assert result.rows[1][0] is None  # empty => None
        assert result.rows[1][2] is None  # ? => None

    def test_quoted_fields_with_commas(self):
        csv = 'name,desc\n"Doe, John","He said ""hello"""\n'
        result = parse_csv_content(csv)
        assert result.headers == ["name", "desc"]
        assert result.rows[0][0] == '"Doe, John"' or result.rows[0][0] == 'Doe, John'

    def test_inconsistent_column_count(self):
        csv = "a,b,c\n1,2\n3,4,5\n"
        result = parse_csv_content(csv)
        defect_types = [d.defect_type for d in result.defects]
        assert "INCONSISTENT_FIELD_COUNT" in defect_types

    def test_duplicate_headers(self):
        csv = "a,b,a\n1,2,3\n"
        result = parse_csv_content(csv)
        defect_types = [d.defect_type for d in result.defects]
        assert "DUPLICATE_ATTRIBUTE_NAME" in defect_types

    def test_no_header_mode(self):
        csv = "1,2,3\n4,5,6\n"
        result = parse_csv_content(csv, has_header=False)
        assert result.headers == ["attr_1", "attr_2", "attr_3"]
        assert len(result.rows) == 2

    def test_tab_delimiter(self):
        csv = "a\tb\tc\n1\t2\t3\n"
        result = parse_csv_content(csv, delimiter="\t")
        assert result.headers == ["a", "b", "c"]
        assert len(result.rows) == 1


# ── Type Inference Edge Cases ──────────────────────────────────

class TestTypeInference:
    def test_all_missing(self):
        headers = ["x"]
        rows = [[None], [None], [None]]
        attrs = infer_attribute_types(headers, rows)
        # All missing => should still produce some type (string fallback)
        assert len(attrs) == 1

    def test_numeric_with_some_missing(self):
        headers = ["val"]
        rows = [["1.5"], [None], ["3.0"], [None]]
        attrs = infer_attribute_types(headers, rows)
        assert attrs[0].type == AttributeType.NUMERIC

    def test_nominal_detection(self):
        headers = ["color"]
        rows = [["red"], ["blue"], ["red"], ["green"]]
        attrs = infer_attribute_types(headers, rows, nominal_threshold=20)
        assert attrs[0].type == AttributeType.NOMINAL
        assert set(attrs[0].nominal_values) == {"red", "blue", "green"}


# ── ARFF Parser Edge Cases ─────────────────────────────────────

class TestARFFEdgeCases:
    def test_empty_arff(self):
        result = parse_arff_content("")
        assert len(result.defects) >= 1

    def test_arff_missing_data_section(self):
        arff = "@relation test\n@attribute x numeric\n"
        result = parse_arff_content(arff)
        # Should either have a defect or return empty dataset
        if result.dataset_ir:
            assert result.dataset_ir.instance_count == 0

    def test_arff_missing_values(self):
        arff = "@relation test\n@attribute x numeric\n@attribute y {a,b}\n@data\n1,a\n?,b\n"
        result = parse_arff_content(arff)
        assert result.dataset_ir is not None
        assert result.dataset_ir.instances[1][0] is None  # ? => None

    def test_arff_case_insensitive_directives(self):
        arff = "@RELATION Test\n@ATTRIBUTE x NUMERIC\n@DATA\n1\n2\n"
        result = parse_arff_content(arff)
        assert result.dataset_ir is not None
        assert result.dataset_ir.instance_count == 2


# ── Conversion Engine Edge Cases ───────────────────────────────

class TestConversionEngine:
    def test_format_detection_csv(self):
        src, tgt = ConversionEngine.detect_format("data.csv", "a,b\n1,2")
        assert src == "csv"
        assert tgt == "arff"

    def test_format_detection_arff(self):
        src, tgt = ConversionEngine.detect_format("data.arff", "@relation x")
        assert src == "arff"
        assert tgt == "csv"

    def test_format_detection_content_based(self):
        src, tgt = ConversionEngine.detect_format("data.txt", "@relation test\n@attribute x numeric\n@data\n1\n")
        assert src == "arff"
        assert tgt == "csv"

    def test_format_detection_defaults_csv(self):
        src, tgt = ConversionEngine.detect_format("data.xyz", "a,b,c\n1,2,3\n")
        assert src == "csv"
        assert tgt == "arff"


# ── Writer Edge Cases ──────────────────────────────────────────

class TestWriters:
    def _make_dataset(self):
        attrs = [
            Attribute(name="num", type=AttributeType.NUMERIC),
            Attribute(name="cat", type=AttributeType.NOMINAL, nominal_values=["a", "b"]),
            Attribute(name="txt", type=AttributeType.STRING),
        ]
        rows = [
            [1.5, "a", "hello world"],
            [None, "b", None],
        ]
        return DatasetIR(relation_name="test", attributes=attrs, instances=rows)

    def test_arff_writer_missing_values(self):
        ds = self._make_dataset()
        output = write_to_arff(ds)
        lines = output.strip().splitlines()
        # The data line with missing values should have ?
        data_lines = [l for l in lines if not l.startswith("@") and not l.startswith("%") and l.strip()]
        assert "?" in data_lines[-1]

    def test_csv_writer_output(self):
        ds = self._make_dataset()
        output = write_to_csv(ds)
        lines = output.strip().splitlines()
        assert lines[0] == "num,cat,txt"  # header
        assert len(lines) == 3  # header + 2 data rows

    def test_csv_writer_no_header(self):
        ds = self._make_dataset()
        output = write_to_csv(ds, include_header=False)
        lines = output.strip().splitlines()
        assert len(lines) == 2  # just data rows
