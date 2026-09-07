import React from "react";
import { Code2, Heart, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <div className="footer-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="footer-logo-text">File Converter System</span>
          </div>
          <p className="footer-description">
            Bidirectional CSV ↔ ARFF conversion engine built for WEKA&nbsp;3.8+ and&nbsp;RFC&nbsp;4180.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Project</h4>
          <a href="https://github.com/adityaraj15spj/file-converter-system" target="_blank" rel="noopener noreferrer">
            <Code2 size={14} /> Source Code
          </a>
          <a href="https://www.weka.io/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> WEKA ML
          </a>
        </div>

        <div className="footer-links-group">
          <h4>Team</h4>
          <span>Aditya Raj</span>
          <span>NITK – Information Technology</span>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} File Converter System — NITK IT Dept.</span>
        <span className="footer-heart">
          Built with <Heart size={13} className="heart-icon" /> by Aditya Raj
        </span>
      </div>
    </footer>
  );
}
