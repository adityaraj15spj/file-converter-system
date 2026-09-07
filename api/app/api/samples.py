from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/samples", tags=["Benchmark Datasets & Samples"])

SAMPLES = {
    "iris.csv": {
        "filename": "iris.csv",
        "description": "Fisher's Iris dataset (150 instances, 4 numeric measurements, 3 nominal species)",
        "source_format": "csv",
        "content": (
            "sepal_length,sepal_width,petal_length,petal_width,species\n"
            "5.1,3.5,1.4,0.2,Iris-setosa\n"
            "4.9,3.0,1.4,0.2,Iris-setosa\n"
            "4.7,3.2,1.3,0.2,Iris-setosa\n"
            "4.6,3.1,1.5,0.2,Iris-setosa\n"
            "5.0,3.6,1.4,0.2,Iris-setosa\n"
            "5.4,3.9,1.7,0.4,Iris-setosa\n"
            "7.0,3.2,4.7,1.4,Iris-versicolor\n"
            "6.4,3.2,4.5,1.5,Iris-versicolor\n"
            "6.9,3.1,4.9,1.5,Iris-versicolor\n"
            "5.5,2.3,4.0,1.3,Iris-versicolor\n"
            "6.5,2.8,4.6,1.5,Iris-versicolor\n"
            "5.7,2.8,4.5,1.3,Iris-versicolor\n"
            "6.3,3.3,6.0,2.5,Iris-virginica\n"
            "5.8,2.7,5.1,1.9,Iris-virginica\n"
            "7.1,3.0,5.9,2.1,Iris-virginica\n"
            "6.3,2.9,5.6,1.8,Iris-virginica\n"
            "6.5,3.0,5.8,2.2,Iris-virginica\n"
            "7.6,3.0,6.6,2.1,Iris-virginica\n"
        )
    },
    "weather_nominal.arff": {
        "filename": "weather_nominal.arff",
        "description": "WEKA Standard Weather Nominal benchmark dataset (14 instances, 5 nominal attributes)",
        "source_format": "arff",
        "content": (
            "% WEKA Weather Nominal Dataset\n"
            "% Reference benchmark from Witten & Frank Data Mining\n"
            "\n"
            "@relation weather\n"
            "\n"
            "@attribute outlook {sunny, overcast, rainy}\n"
            "@attribute temperature {hot, mild, cool}\n"
            "@attribute humidity {high, normal}\n"
            "@attribute windy {TRUE, FALSE}\n"
            "@attribute play {yes, no}\n"
            "\n"
            "@data\n"
            "sunny,hot,high,FALSE,no\n"
            "sunny,hot,high,TRUE,no\n"
            "overcast,hot,high,FALSE,yes\n"
            "rainy,mild,high,FALSE,yes\n"
            "rainy,cool,normal,FALSE,yes\n"
            "rainy,cool,normal,TRUE,no\n"
            "overcast,cool,normal,TRUE,yes\n"
            "sunny,mild,high,FALSE,no\n"
            "sunny,cool,normal,FALSE,yes\n"
            "rainy,mild,normal,FALSE,yes\n"
            "sunny,mild,normal,TRUE,yes\n"
            "overcast,mild,high,TRUE,yes\n"
            "overcast,hot,normal,FALSE,yes\n"
            "rainy,mild,high,TRUE,no\n"
        )
    },
    "diabetes_sample.csv": {
        "filename": "diabetes_sample.csv",
        "description": "Pima Indian Diabetes dataset sample with missing values ('?') and numeric attributes",
        "source_format": "csv",
        "content": (
            "Pregnancies,Glucose,BloodPressure,SkinThickness,Insulin,BMI,Pedigree,Age,Outcome\n"
            "6,148,72,35,?,33.6,0.627,50,tested_positive\n"
            "1,85,66,29,?,26.6,0.351,31,tested_negative\n"
            "8,183,64,?,0,23.3,0.672,32,tested_positive\n"
            "1,89,66,23,94,28.1,0.167,21,tested_negative\n"
            "0,137,40,35,168,43.1,2.288,33,tested_positive\n"
            "5,116,74,?,0,25.6,0.201,30,tested_negative\n"
            "3,78,50,32,88,31.0,0.248,26,tested_positive\n"
            "10,115,?,0,0,35.3,0.134,29,tested_negative\n"
        )
    },
    "malformed_test.csv": {
        "filename": "malformed_test.csv",
        "description": "Test dataset with inconsistent column counts on Line 3 to verify line-level validation (FR-014)",
        "source_format": "csv",
        "content": (
            "patient_id,heart_rate,blood_pressure,diagnosis\n"
            "P001,72,120/80,normal\n"
            "P002,88,140/90\n"
            "P003,95,150/95,hypertension\n"
            "P004,65,110/70,normal\n"
        )
    }
}

@router.get("")
def list_sample_datasets():
    return [
        {
            "id": key,
            "filename": val["filename"],
            "description": val["description"],
            "source_format": val["source_format"]
        }
        for key, val in SAMPLES.items()
    ]

@router.get("/{sample_id}")
def get_sample_content(sample_id: str):
    if sample_id not in SAMPLES:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")
    return SAMPLES[sample_id]
