# Jamaica SEZ Document Upload Test Data

Generated: 2026-02-25

## Overview
Minimal test PDF files for Jamaica SEZ service document upload requirements testing. Total: 35 files (33 valid PDFs + 2 negative test files).

## Valid Test Documents (33 PDFs)
All PDFs are 589 bytes, valid PDF 1.0 format with minimal structure:

### Land & Property Documents (7)
- TEST-certificate-of-title.pdf
- TEST-lease-agreement.pdf
- TEST-affidavit-no-land-dispute.pdf
- TEST-landlords-affidavit.pdf
- TEST-occupancy-rights-document.pdf
- TEST-certificate-of-incorporation.pdf
- TEST-articles-of-incorporation.pdf

### Planning & Design Documents (8)
- TEST-business-plan.pdf
- TEST-concept-master-plan.pdf
- TEST-final-master-plan.pdf
- TEST-environmental-assessment.pdf
- TEST-survey-plan.pdf
- TEST-site-plan.pdf
- TEST-building-plans.pdf
- TEST-infrastructure-layout.pdf

### Compliance & Regulatory Documents (9)
- TEST-tax-compliance-certificate.pdf
- TEST-security-plan.pdf
- TEST-health-safety-plan.pdf
- TEST-disaster-mitigation-plan.pdf
- TEST-utilities-plan.pdf
- TEST-drainage-plan.pdf
- TEST-traffic-impact-assessment.pdf
- TEST-customs-readiness-plan.pdf
- TEST-due-diligence-report.pdf

### Corporate & Financial Documents (6)
- TEST-company-directors-list.pdf
- TEST-shareholders-register.pdf
- TEST-board-resolution.pdf
- TEST-financial-statements.pdf
- TEST-bank-reference-letter.pdf
- TEST-export-projections.pdf

### Other Documents (3)
- TEST-employment-plan.pdf
- TEST-resettlement-plan.pdf
- TEST-phasing-plan.pdf

## Negative Test Files (2)
For testing invalid/edge case handling:
- **TEST-invalid-format.txt** (1 byte) — Text file, not PDF format
- **TEST-empty.pdf** (0 bytes) — Empty file for validation testing

## Usage
These files are minimal but valid PDFs suitable for:
- Unit testing document upload handlers
- Integration testing file validation logic
- UI testing file type restrictions
- Performance testing batch uploads

All PDFs contain the minimal valid PDF 1.0 structure with a single page containing "TEST DOCUMENT" text.

## Directory
`/Users/nelsonperez/Desktop/OCAgents/countries/jamaica/testing/test-data/documents/`
