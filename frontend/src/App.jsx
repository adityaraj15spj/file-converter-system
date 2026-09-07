import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import UploadZone from "./components/UploadZone";
import ParsingOptions from "./components/ParsingOptions";
import SchemaReviewTable from "./components/SchemaReviewTable";
import ValidationAlerts from "./components/ValidationAlerts";
import OutputPreview from "./components/OutputPreview";
import HistoryTable from "./components/HistoryTable";
import AdminPanel from "./components/AdminPanel";
import BenchmarkView from "./components/BenchmarkView";
import AuthModal from "./components/AuthModal";
import DataPreview from "./components/DataPreview";
import Footer from "./components/Footer";
import { api } from "./api";
import { Sparkles, Play, CheckCircle2, AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("converter");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // File and Conversion State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [sourceFormat, setSourceFormat] = useState("csv");
  const [targetFormat, setTargetFormat] = useState("arff");
  const [parsingOptions, setParsingOptions] = useState({
    delimiter: ",",
    quoteChar: '"',
    hasHeader: true,
    relationName: "dataset"
  });

  const [schemaAttributes, setSchemaAttributes] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [instanceCount, setInstanceCount] = useState(0);
  const [validationDefects, setValidationDefects] = useState([]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);

  // History State
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Benchmark Sample list
  const [sampleList, setSampleList] = useState([]);

  // Toast feedback
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map(t => t.id === id ? { ...t, dismissing: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  // Initial load: Auth & Samples
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => localStorage.removeItem("token"));
    }

    api.getSamples()
      .then((data) => setSampleList(data))
      .catch(() => {});

    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getHistory();
      setHistoryItems(data);
    } catch {
      // Ignored
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle File Selection
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setConversionResult(null);
    setValidationDefects([]);
    setSampleRows([]);

    const text = await file.text();
    setFileContent(text);

    // Auto-detect formats (FR-006)
    const formData = new FormData();
    formData.append("file", file);
    try {
      const detectRes = await api.detectFormat(formData);
      setSourceFormat(detectRes.source_format);
      setTargetFormat(detectRes.target_format);

      // Set default relation name based on filename
      const baseName = file.name.split(".")[0].replace(/[\s-]+/g, "_").toLowerCase();
      setParsingOptions((prev) => ({
        ...prev,
        relationName: baseName
      }));

      // Inspect Schema automatically
      inspectDataset(file, detectRes.source_format, parsingOptions);
    } catch (err) {
      showToast(err.message || "Error detecting format.", "error");
    }
  };

  // Inspect Schema (FR-009, FR-010)
  const inspectDataset = async (file, srcFormat, options) => {
    setIsInspecting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_format", srcFormat);
    formData.append("delimiter", options.delimiter);
    formData.append("quote_char", options.quoteChar);
    formData.append("has_header", options.hasHeader);

    try {
      const res = await api.inspectSchema(formData);
      if (res.success) {
        setSchemaAttributes(res.attributes || []);
        setInstanceCount(res.instance_count || 0);
        setValidationDefects(res.defects || []);
        setSampleRows(res.sample_rows || []);
      } else {
        setValidationDefects(res.defects || []);
        setSchemaAttributes([]);
        setSampleRows([]);
      }
    } catch (err) {
      showToast(err.message || "Failed to inspect file schema.", "error");
    } finally {
      setIsInspecting(false);
    }
  };

  // Execute Conversion (FR-011, FR-013, FR-015)
  const handleExecuteConversion = async () => {
    if (!selectedFile) {
      showToast("Please upload a file or choose a benchmark dataset first.", "error");
      return;
    }

    setIsConverting(true);
    setConversionResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("source_format", sourceFormat);
    formData.append("target_format", targetFormat);
    formData.append("relation_name", parsingOptions.relationName || "dataset");
    formData.append("delimiter", parsingOptions.delimiter);
    formData.append("quote_char", parsingOptions.quoteChar);
    formData.append("has_header", parsingOptions.hasHeader);
    
    if (schemaAttributes && schemaAttributes.length > 0) {
      formData.append("schema_overrides", JSON.stringify(schemaAttributes));
    }

    try {
      const res = await api.executeConversion(formData);
      if (res.success) {
        setConversionResult(res);
        setValidationDefects(res.defects || []);
        showToast(`Converted successfully: ${res.instance_count} instances in ${res.duration_ms}ms!`);
        loadHistory();
      } else {
        setValidationDefects(res.defects || []);
        showToast(res.message || "Conversion halted due to validation defects.", "error");
      }
    } catch (err) {
      showToast(err.message || "An error occurred during conversion.", "error");
    } finally {
      setIsConverting(false);
    }
  };

  // Load sample dataset
  const handleLoadSample = async (sampleId) => {
    try {
      const sample = await api.getSampleContent(sampleId);
      const blob = new Blob([sample.content], { type: "text/plain" });
      const file = new File([blob], sample.filename, { type: "text/plain" });
      handleFileSelect(file);
      showToast(`Loaded sample dataset: ${sample.filename}`);
    } catch (err) {
      showToast(err.message || "Failed to load sample.", "error");
    }
  };

  // Programmatic download — no page navigation
  const triggerDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = () => {
    if (conversionResult && conversionResult.history_id) {
      triggerDownload(api.getDownloadUrl(conversionResult.history_id));
    }
  };

  const handleDownloadHistoryItem = (historyId) => {
    triggerDownload(api.getDownloadUrl(historyId));
  };

  const handleDeleteHistoryItem = async (historyId) => {
    try {
      await api.deleteHistory(historyId);
      loadHistory();
      showToast("History record deleted.");
    } catch (err) {
      showToast(err.message || "Failed to delete history record.", "error");
    }
  };

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear all history records?")) {
      try {
        await api.clearHistory();
        loadHistory();
        showToast("History cleared.");
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  };

  return (
    <div className="app-container">
      {/* Toast stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === "error" ? "toast-error" : "toast-success"} ${t.dismissing ? "dismissing" : ""}`}>
            {t.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
            <div className="toast-progress" />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          localStorage.removeItem("token");
          setCurrentUser(null);
          showToast("Logged out successfully.");
        }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="app-main-content">
        {/* MAIN VIEW: CONVERTER STUDIO */}
        {activeTab === "converter" && (
          <div>
            {/* Hero Description */}
            <div className="fade-in-up" style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 32px auto" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.25)", color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>
                <Sparkles size={14} />
                <span>NITK Information Technology &bull; Data Preparation Utility</span>
              </div>
              <h2 style={{ fontSize: "2.1rem", marginBottom: "10px", fontWeight: 800 }}>
                Bidirectional CSV <span style={{ color: "var(--accent-indigo)" }}>&harr;</span> WEKA ARFF Engine
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Lossless format conversion conforming strictly to RFC 4180 and WEKA 3.8+ specifications. Inspect inferred column types, customize nominal categories, and export verified datasets directly into the WEKA machine learning workbench.
              </p>
            </div>

            {/* Upload Zone */}
            <div className="fade-in-up fade-in-up-delay-1">
              <UploadZone
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                sourceFormat={sourceFormat}
                targetFormat={targetFormat}
                onTargetFormatChange={setTargetFormat}
                isInspecting={isInspecting}
                onLoadSample={handleLoadSample}
                sampleList={sampleList}
              />
            </div>

            {/* Parsing Options */}
            {selectedFile && (
              <div className="fade-in-up fade-in-up-delay-2">
                <ParsingOptions
                  options={parsingOptions}
                  onChange={(newOpts) => {
                    setParsingOptions(newOpts);
                    inspectDataset(selectedFile, sourceFormat, newOpts);
                  }}
                  sourceFormat={sourceFormat}
                />
              </div>
            )}

            {/* Validation Alerts (FR-014) */}
            <ValidationAlerts defects={validationDefects} />

            {/* Interactive Schema Review Table (FR-010) */}
            {schemaAttributes.length > 0 && (
              <div className="fade-in-up">
                <SchemaReviewTable
                  attributes={schemaAttributes}
                  onAttributeChange={setSchemaAttributes}
                  instanceCount={instanceCount}
                />
              </div>
            )}

            {/* Data Preview Table */}
            {sampleRows.length > 0 && schemaAttributes.length > 0 && (
              <DataPreview sampleRows={sampleRows} attributes={schemaAttributes} />
            )}

            {/* Execution Button */}
            {selectedFile && (
              <div className="fade-in-up" style={{ textAlign: "center", marginBottom: "32px" }}>
                <button
                  id="btn-execute-convert"
                  className="btn btn-primary"
                  onClick={handleExecuteConversion}
                  disabled={isConverting}
                  style={{ padding: "14px 36px", fontSize: "1.05rem", borderRadius: "14px" }}
                >
                  {isConverting ? (
                    <>
                      <span className="spinner" />
                      <span>Converting Dataset...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span>Convert to {targetFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Output Preview Studio (FR-015, FR-016) */}
            {conversionResult && (
              <div className="fade-in-up">
                <OutputPreview
                  result={conversionResult}
                  downloadUrl={api.getDownloadUrl(conversionResult.history_id)}
                  onDownload={handleDownload}
                />
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="fade-in-up">
            <HistoryTable
              historyItems={historyItems}
              onDownloadItem={handleDownloadHistoryItem}
              onDeleteItem={handleDeleteHistoryItem}
              onClearAll={handleClearHistory}
              isLoading={historyLoading}
            />
          </div>
        )}

        {/* BENCHMARK SAMPLES TAB */}
        {activeTab === "samples" && (
          <div className="fade-in-up">
            <BenchmarkView
              onLoadSampleAndSwitch={(sampleId) => {
                handleLoadSample(sampleId);
                setActiveTab("converter");
              }}
            />
          </div>
        )}

        {/* ADMIN DASHBOARD TAB */}
        {activeTab === "admin" && (
          <div className="fade-in-up">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* FOOTER */}
      <Footer />

      {/* AUTH & PROFILE MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.full_name}!`);
          loadHistory();
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          setCurrentUser(null);
          showToast("Signed out.");
        }}
      />
    </div>
  );
}
