import pytest
from app.modules.converter.arff_parser import parse_arff_content
from app.modules.converter.arff_writer import write_to_arff
from app.modules.converter.ir import Attribute, AttributeType, DatasetIR

def test_weka_arff_parsing_with_comments_and_spaces():
    arff_sample = (
        "% This is a comment\n"
        "% Another comment\n"
        "\n"
        "@relation 'weather forecast'\n"
        "\n"
        "@attribute outlook {sunny, overcast, rainy}\n"
        "@attribute temperature numeric\n"
        "@attribute humidity numeric\n"
        "@attribute windy {TRUE, FALSE}\n"
        "@attribute play {yes, no}\n"
        "\n"
        "@data\n"
        "sunny,85,85,FALSE,no\n"
        "sunny,80,90,TRUE,no\n"
        "overcast,83,86,FALSE,yes\n"
        "rainy,?,96,FALSE,yes\n"
    )

    res = parse_arff_content(arff_sample)
    assert not any(d.is_fatal for d in res.defects)
    ds = res.dataset_ir
    assert ds.relation_name == "weather forecast"
    assert len(ds.attributes) == 5
    assert ds.attributes[0].name == "outlook"
    assert ds.attributes[0].type == AttributeType.NOMINAL
    assert ds.attributes[0].nominal_values == ["sunny", "overcast", "rainy"]
    assert ds.attributes[1].type == AttributeType.NUMERIC
    assert len(ds.instances) == 4
    # Check missing value at row 4 column 1 (temperature)
    assert ds.instances[3][1] is None

def test_weka_writer_formatting():
    dataset = DatasetIR(
        relation_name="hospital patients",
        attributes=[
            Attribute(name="patient id", type=AttributeType.NUMERIC),
            Attribute(name="condition", type=AttributeType.NOMINAL, nominal_values=["stable", "critical"]),
            Attribute(name="notes", type=AttributeType.STRING)
        ],
        instances=[
            [101, "stable", "Discharged with medicine"],
            [102, "critical", None]
        ]
    )
    arff_output = write_to_arff(dataset)
    assert "@relation 'hospital patients'" in arff_output
    assert "@attribute 'patient id' numeric" in arff_output
    assert "@attribute condition {stable,critical}" in arff_output
    assert "@data" in arff_output
    assert "101,stable,'Discharged with medicine'" in arff_output
    assert "102,critical,?" in arff_output
