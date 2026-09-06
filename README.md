# File Converter System: CSV &harr; WEKA ARFF

An enterprise-grade, full-stack data preparation platform providing bidirectional, lossless conversion between **CSV (RFC 4180)** and **Attribute-Relation File Format (WEKA 3.8+ ARFF)**.

Developed for coursework evaluation in the **Department of Information Technology, National Institute of Technology Karnataka (NITK), Surathkal**.

---

## 👥 Team & Work Division

| Name | Roll Number | Module | Assigned Responsibilities |
| :--- | :--- | :--- | :--- |
| **Aditya Raj** | `241IT006` | **Module 1**: Authentication, Security & Administration | User registration, login, JWT session handling, profile management, bcrypt hashing, and admin dashboard (FR-001–FR-004, FR-018, NF-005). |
| **Dhruv Agarwal** | `241IT026` | **Module 2**: File Handling, Workflow UI & History | Multipart uploads, format detection banners, preview grids, secure downloads, and conversion history (FR-005, FR-006, FR-015–FR-017). |
| **Aayush Sarraf** | `241IT001` | **Module 3**: Data Parsing, Schema Extraction & Validation | RFC 4180 CSV & ARFF parsers, attribute type inference, schema overrides, and line-level error reporting (FR-007–FR-010, FR-012, FR-014). |
| **Deepanshu Kumar** | `241IT020` | **Module 4**: Conversion Engine & Internal Representation | Format-independent `DatasetIR`, WEKA 3.8+ ARFF writer, RFC 4180 CSV writer, lossless round-trip tests (FR-011, FR-013, NF-007, NF-009). |

---

## 🚀 Key Features

- **Bidirectional Lossless Conversion**: Full support for `CSV -> ARFF` and `ARFF -> CSV` preserving column order, row counts, and numeric precision without loss.
- **Strict WEKA 3.8+ Compliance**: Generates ARFF files directly importable into WEKA Explorer without manual syntax editing.
- **Intelligent Attribute Type Inference**: Automatically classifies attributes into `NUMERIC`, `NOMINAL` (with automatic unique value set enumeration), `DATE`, and `STRING`.
- **Interactive Schema Review & Override**: Real-time table allowing users to review inferred schemas, rename columns, and override data types with data consistency validation.
- **Line-Level Defect Reporting**: Catches inconsistent field counts, unterminated quotes, duplicate headers, and type violations with exact source line numbers.
- **Conversion Audit History**: Reverse-chronological history log tracking conversion flows, execution latency (ms), row/column counts, with redownload and deletion.
- **Admin Dashboard**: Real-time system metrics, user account management (activate/suspend), and configurable system limits (Max upload size, nominal threshold).
- **Built-in Benchmark Datasets**: One-click testing with Fisher's Iris, WEKA Weather Nominal, Pima Diabetes, and Malformed edge cases.

---

## 🏗️ System Architecture

- **Frontend (Client Tier)**: React.js (Vite), modern Vanilla CSS design system, glassmorphism aesthetics, responsive layouts, Lucide icons.
- **Backend (Application Tier)**: Python 3.13 with FastAPI, Pydantic v2, PyJWT, and salted Bcrypt password security.
- **Data Tier**: SQLite (default zero-configuration) with SQLAlchemy ORM (compatible with PostgreSQL via `DATABASE_URL`).
- **Communication**: RESTful JSON APIs and multipart/form-data for file uploads over HTTP/HTTPS.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Python 3.8+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://127.0.0.1:5173`

### 4. Running Automated Tests
```bash
cd backend
python -m pytest tests
```

---

## 🔑 Demo Accounts

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Student / User** | `aditya@nitk.ac.in` | `Aditya@123` | Converter Studio, Schema Review, History |
| **Administrator** | `admin@nitk.ac.in` | `Admin@123` | Full Dashboard, User Management, Limits Config |

*(Note: Both accounts can also be logged into in 1-click via the "Demo One-Click Logins" in the Sign In modal.)*

---

## 📄 References & Standards
- **ARFF Specification**: [Waikato Environment for Knowledge Analysis (WEKA)](https://www.cs.waikato.ac.nz/ml/weka/arff.html)
- **RFC 4180**: Common Format and MIME Type for CSV Files
- **IEEE Std 830-1998**: Recommended Practice for Software Requirements Specifications (SRS)
