# Officer Manual -- Establish a New Zone (Jamaica SEZ)

**Service**: Establish a new zone
**Platform**: Jamaica eRegistrations
**URL**: https://jamaica.eregistrations.org
**Version**: February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [General Navigation](#general-navigation)
3. [Processing by Phase](#processing-by-phase)
   - [Phase 1: Intake -- Documents Check](#phase-1-intake--documents-check)
   - [Phase 2: Parallel Evaluations](#phase-2-parallel-evaluations)
   - [Phase 3: External Agency Consultations](#phase-3-external-agency-consultations)
   - [Phase 4: Internal Approvals](#phase-4-internal-approvals)
   - [Phase 5: Application Review Committee (ARC)](#phase-5-application-review-committee-arc)
   - [Phase 6: Decision and Status](#phase-6-decision-and-status)
   - [Phase 7: Board and Final](#phase-7-board-and-final)
4. [Corrections Flow](#corrections-flow)
5. [Rejection Flow](#rejection-flow)
6. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
7. [Quick Reference Table](#quick-reference-table)

---

## Overview

### Service Workflow

The "Establish a New Zone" service processes applications for Special Economic Zone (SEZ) designation in Jamaica. The workflow moves through seven sequential phases, from initial document intake through final Board approval and license issuance.

**Workflow Summary**:

| Phase | Name | Nature | Key Action |
|-------|------|--------|------------|
| 1 | Intake | Sequential | Verify completeness of 33 required documents |
| 2 | Evaluations | Parallel | Domain-specific review (Legal, Technical, Business, Compliance) |
| 3 | External NOC | Fan-out / Fan-in | Collect no-objection letters from JCA, TAJ, MOFPS |
| 4 | Internal Approvals | Parallel | Senior management sign-off per domain |
| 5 | ARC | Sequential | Committee reviews consolidated evaluations |
| 6 | Decision | Sequential | Draft and sign status/decision letter |
| 7 | Board and Final | Sequential | Board review, final approval, license upload |

### Institutions Involved

Four institutions participate in processing each application:

| Institution | Full Name | Role |
|-------------|-----------|------|
| **SEZA** | Jamaica Special Economic Zone Authority | Lead authority -- receives, evaluates, approves, issues license |
| **JCA** | Jamaica Customs Agency | Issues no-objection letter (customs review) |
| **TAJ** | Tax Administration Jamaica | Issues no-objection letter (tax compliance review) |
| **MOFPS** | Ministry of Finance and Public Services | Issues no-objection letter (fiscal/financial review) |

### Active Processing Roles

There are **21 active roles** in the workflow. Each role represents a processing step assigned to one or more named officers or institutional accounts. The complete list is provided in the Quick Reference Table at the end of this manual.

### Registrations

The service produces four registrations:

1. **Approval SEZA** -- The primary registration. SEZA evaluates and grants or denies zone designation.
2. **No objection JCA** -- Jamaica Customs Agency issues a no-objection decision.
3. **No objection TAJ** -- Tax Administration Jamaica issues a no-objection decision.
4. **No objection MOFPS** -- Ministry of Finance issues a no-objection decision.

---

## General Navigation

### Logging into the System

1. Open your browser and navigate to **https://jamaica.eregistrations.org**.
2. Click the login link in the top-right corner.
3. Enter your assigned email address and password.
4. After successful login, your name will appear in the top navigation bar.

### Accessing Part B (Back-Office Processing View)

1. After logging in, navigate to **https://jamaica.eregistrations.org/part-b**.
2. You will see the application list -- a table of all submitted applications visible to your role.
3. If you do not see Part B or the list is empty, confirm with your administrator that your account has back-office permissions for the appropriate role.

### Understanding the Application List

The application list displays all applications that require your attention. Key elements:

- **Status badges**: Colored labels indicating the current state of each application.
  - "File pending" -- Application is waiting for processing at your step.
  - "File in progress" -- Application is actively being processed.
  - "File complete" -- Your step is done; the application has moved forward.
- **Company name**: The applicant entity name.
- **Active task**: The current workflow step the application is at.

### Opening an Application for Processing

1. In the application list, locate the application with a "File pending" status badge.
2. Click on the status badge or the application row to open the processing view.
3. The processing view will load with the application data, documents, and your role-specific action buttons.
4. The URL will follow the pattern: `/part-b/{serviceId}/{roleName}/{processId}?file_id={fileId}`

### Tabs in the Processing View

- **Documents** -- View and validate uploaded documents.
- **Processing** -- View the action buttons for your role (Approve, Send, etc.).
- **Form** -- View the applicant's submitted form data (read-only for most roles).

---

## Processing by Phase

---

### Phase 1: Intake -- Documents Check

**Purpose**: Verify that the applicant has submitted all 33 required documents and that each document is valid and legible.

**Assigned officers**: Michelle Hewett, Britania Bryan

**Role type**: Revision

#### Step-by-Step Instructions

1. **Open the application**
   - Navigate to Part B (`/part-b`).
   - Click the application with "File pending" status.

2. **Switch to the Documents tab**
   - Click the "Documents" tab link in the processing view.
   - You will see a list of all 33 required document categories.

3. **Enter the document carousel**
   - Click the first document link (a button styled as a link) to open the document carousel viewer.
   - The carousel allows you to review each document one by one.

4. **Validate each document**
   - For each document displayed in the carousel:
     - Review the document for completeness, legibility, and correctness.
     - Click **"Yes"** if the document is valid. This sets the corresponding `filestatus` field to `true`.
     - Click **"No"** if the document is invalid or missing.
   - Navigate through all documents in the carousel until every document has been reviewed.
   - The system tracks validation status via hidden fields named `filestatus1`, `filestatus2`, etc.

5. **Set FORMDATAVALIDATIONSTATUS**
   - After all documents are validated, the system must recognize that the form data is complete.
   - The hidden field `FORMDATAVALIDATIONSTATUS` must be set to `"true"`. In most cases this happens automatically when all documents are marked "Yes".
   - If the "Approve documents check" button remains disabled after validating all documents, see the Troubleshooting section below.

6. **Save the form**
   - The system auto-saves periodically, but you should trigger a manual save before proceeding.
   - The save is triggered internally when the form detects changes.

7. **Switch to the Processing tab**
   - Click the "Processing" tab link.
   - You will now see the action button for your role.

8. **Click "Approve documents check"**
   - Verify the button is enabled (not grayed out).
   - Click the button.
   - A confirmation dialog may appear -- click "OK" or "Confirm" to proceed.
   - Wait for the system to process. The page will redirect or the status will update.

9. **Verify completion**
   - After approval, navigate back to the Part B application list.
   - The application should now show "File in progress" and the active task should indicate one or more evaluation roles.

#### Possible Outcomes

| Outcome | What Happens |
|---------|-------------|
| **Approve** | Application moves to Phase 2 -- all four evaluation roles become active simultaneously. |
| **Send back for corrections** | Application is returned to the applicant via the Complementary Information step. The applicant receives a notification to correct and resubmit. |

---

### Phase 2: Parallel Evaluations

**Purpose**: Four SEZA departments independently evaluate the application from their respective domain perspectives. All four evaluations run in parallel and must complete before Phase 3 begins.

---

#### Role 2: Legal Evaluation

**Assigned officers**: Joanna Mills, Branttany Oforkaja, Shaquille Douglas

**What to evaluate**: Legal aspects of the zone proposal -- corporate structure, legal compliance, regulatory requirements, land use agreements.

**Steps**:

1. Open the application from the Part B list.
2. Review the application form data relevant to legal assessment.
3. Fill in any evaluation form fields assigned to your role (these appear in the form section of the processing view).
4. When your evaluation is complete, click **"Send evaluation to approval"**.
5. Confirm the action if prompted.
6. The evaluation data is forwarded to the Legal Approval role in Phase 4.

**Action button**: "Send evaluation to approval"

---

#### Role 3: Technical Evaluation

**Assigned officers**: Krissan Meredith, Leondra Power, Alianne Barrows

**What to evaluate**: Infrastructure readiness, technical feasibility, site suitability, physical layout, utilities, and master plan adequacy.

**Steps**:

1. Open the application from the Part B list.
2. Review the Master Plan section and technical specifications in the form data.
3. Complete any technical evaluation form fields assigned to your role.
4. When your evaluation is complete, click the action button to send the evaluation forward.
5. Confirm the action if prompted.

**Action button**: Check your processing view for the exact button text (may be "Send evaluation to approval" or similar).

---

#### Role 4: Business Evaluation

**Assigned officers**: Brittany Johnson

**What to evaluate**: Business plan viability, economic impact projections, job creation estimates, financial sustainability.

**Steps**:

1. Open the application from the Part B list.
2. Review the Business Plan section of the form data.
3. Complete any business evaluation form fields assigned to your role.
4. When your evaluation is complete, click **"Send evaluation for approval"**.
5. Confirm the action if prompted.

**Action button**: "Send evaluation for approval"

---

#### Role 5: Compliance Evaluation

**Assigned officers**: Chevaughn Dacres, Cristena Smith, Abigail Johnston, Carleen Clacken-Reid

**What to evaluate**: Compliance across multiple domains -- ownership and financial integrity, health and safety plans, disaster mitigation and recovery, security plan, licensing and permits, customs procedures.

**Steps**:

1. Open the application from the Part B list.
2. Review the Compliance section of the form data (six sub-sections: Ownership & Financial Integrity, Health & Safety, Disaster Mitigation & Recovery, Security Plan, Licensing & Permits, Customs).
3. Complete any compliance evaluation form fields assigned to your role.
4. When your evaluation is complete, click **"Send evaluation for approval"**.
5. Confirm the action if prompted.

**Action button**: "Send evaluation for approval"

---

### Phase 3: External Agency Consultations

**Purpose**: SEZA sends consultation documents to three external agencies (JCA, TAJ, MOFPS), each of which independently reviews the application and issues a no-objection decision.

---

#### Role 6: Organize NOC and Inspection

**Assigned officers**: SEZA staff (as designated)

**What to do**: Compile consultation packages and send them to all three external agencies.

**Steps**:

1. Open the application from the Part B list.
2. Locate the file upload areas for each agency. There will be multiple "Browse" links -- one set of consultation documents for each agency (JCA, TAJ, MOFPS).
3. **Upload consultation documents**:
   - Click the "Browse" link for the first agency.
   - In the file chooser dialog, select the appropriate consultation document (PDF format).
   - Wait for the upload to complete before proceeding to the next.
   - Repeat for each agency's upload slot.
4. After all documents are uploaded, save the form.
5. Click **"Send consultation documents"**.
6. Confirm the action if prompted.
7. The system distributes the consultation packages to JCA, TAJ, and MOFPS simultaneously.

**Action button**: "Send consultation documents"

**Important**: The action button will not become enabled until all required file uploads are completed. If the button remains disabled after uploading, verify that every upload slot has a file attached.

---

#### Role 7: JCA Approval

**Institution**: Jamaica Customs Agency

**What to do**: Review customs-related aspects of the zone application and issue a no-objection decision.

**Steps**:

1. Log in with JCA credentials and navigate to Part B.
2. Open the application.
3. Review the customs-related documentation and consultation package.
4. **Select the "No objection" radio button** on the form. This is a required field -- the action button will not work without a selection.
5. Click **"Send decision to SEZA"**.
6. Confirm the action if prompted.
7. The decision is transmitted back to SEZA for consolidation.

**Action button**: "Send decision to SEZA"

**Important**: You must select the "No objection" radio option before the action button becomes functional. If you have an objection, select the appropriate alternative option.

---

#### Role 8: TAJ Approval

**Institution**: Tax Administration Jamaica

**What to do**: Review tax compliance aspects and issue a no-objection decision.

**Steps**:

1. Log in with TAJ credentials and navigate to Part B.
2. Open the application.
3. Review the tax-related documentation and consultation package.
4. **Select the "No objection" radio button** on the form.
5. Click **"Send decision to SEZA"**.
6. Confirm the action if prompted.

**Action button**: "Send decision to SEZA"

---

#### Role 9: MOFPS Approval

**Institution**: Ministry of Finance and Public Services

**What to do**: Review fiscal and financial aspects and issue a no-objection decision.

**Steps**:

1. Log in with MOFPS credentials and navigate to Part B.
2. Open the application.
3. Review the fiscal documentation and consultation package.
4. **Select the "No objection" radio button** on the form.
5. Click **"Send decision to SEZA"**.
6. Confirm the action if prompted.

**Action button**: "Send decision to SEZA"

---

### Phase 4: Internal Approvals

**Purpose**: Senior SEZA management provides sign-off on each domain evaluation. These four approval steps can run in parallel once the corresponding external agency decisions are received. All four must complete before the application advances to ARC.

---

#### Role 10: Legal Approval

**Assigned officer**: Janis Williams (Senior Director, Legal Services)

**What to do**: Review and approve the legal evaluation prepared in Phase 2, informed by external agency feedback.

**Steps**:

1. Open the application from the Part B list.
2. Review the legal evaluation summary and any external agency inputs.
3. If satisfied, click **"Approve"**.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

#### Role 11: Technical Approval

**Assigned officer**: Deborah Broomfield (Director, Technical Services and Infrastructure)

**What to do**: Review and approve the technical evaluation prepared in Phase 2.

**Steps**:

1. Open the application from the Part B list.
2. Review the technical evaluation summary.
3. If satisfied, click **"Approve"**.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

#### Role 12: Business Approval

**Assigned officers**: Licia Grant Mullings (Senior Director, BPSS), Yeuniek Hinds (Director, SRM)

**What to do**: Review and approve the business evaluation prepared in Phase 2.

**Steps**:

1. Open the application from the Part B list.
2. Review the business evaluation summary.
3. If satisfied, click **"Approve"**.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

#### Role 13: Compliance Approval

**Assigned officer**: Ainsley Brown (COO)

**What to do**: Review and approve the compliance evaluation prepared in Phase 2.

**Steps**:

1. Open the application from the Part B list.
2. Review the compliance evaluation summary across all six compliance sub-areas.
3. If satisfied, click **"Approve"**.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

### Phase 5: Application Review Committee (ARC)

**Purpose**: The Application Review Committee conducts a consolidated review of all evaluations, risk assessments, conditions, and agency recommendations before making an overall recommendation.

**Assigned to**: ARC Committee members

#### Step-by-Step Instructions

1. **Open the application** from the Part B list.
2. **Review consolidated evaluations**: The system aggregates data from all four evaluation domains (Legal, Technical, Business, Compliance) and all three external agency decisions (JCA, TAJ, MOFPS) via internal bots.
3. **Review the EditGrid**: The ARC form contains an EditGrid component for committee notes, conditions, and risk assessments.
   - Click into each row to review or add notes.
   - **Important**: After editing any EditGrid row, you must save the row before proceeding. Unsaved rows in "new" or "editing" state will block the action button. Click the row-level save button (checkmark or "Save Row") for each edited row.
4. **Make your decision**:
   - If the committee approves, click **"Approve"**.
   - If corrections are needed, send the application back to the applicant (Complementary Information step).
   - If the application is to be denied, use the rejection option if available.
5. Confirm the action if prompted.

**Action button**: "Approve"

**Known issue**: EditGrid rows left in "new" state will prevent the Approve button from working. Always save all rows before attempting to approve.

---

### Phase 6: Decision and Status

**Purpose**: Prepare and sign the official status/decision letter communicating the outcome to the applicant.

---

#### Role 16: Status Letter

**Assigned officers**: Michelle Hewett, Britannia Bryan

**What to do**: Draft the official status/decision letter based on the ARC recommendation.

**Steps**:

1. Open the application from the Part B list.
2. Review the ARC decision and any conditions or notes.
3. Complete the status letter form fields -- draft the letter content as required.
4. Save the form.
5. Click the action button to forward the letter for signature.
6. Confirm the action if prompted.

---

#### Role 17: Signature Status Letter

**Assigned officers**: Licia Grant Mullings, Yeuniek Hinds

**What to do**: Review and sign the status letter prepared in the previous step.

**Steps**:

1. Open the application from the Part B list.
2. Review the drafted status letter for accuracy and completeness.
3. If satisfied, click **"Approve"** to apply your signature and advance the workflow.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

### Phase 7: Board and Final

**Purpose**: Prepare the application package for the Board, obtain CEO validation, secure Board approval, and upload final documentation.

---

#### Role 18: Board Submission

**Assigned to**: SEZA staff (as designated)

**What to do**: Prepare and package all materials for Board review.

**Steps**:

1. Open the application from the Part B list.
2. Review the complete application package -- evaluations, agency decisions, ARC recommendation, status letter.
3. The form may contain an EditGrid for Board submission notes.
   - **Important**: Save all EditGrid rows before proceeding. Unsaved rows will block submission.
4. Click the action button to submit the package to the Board.
5. Confirm the action if prompted.

**Known issue**: Same EditGrid row-save requirement as ARC. Ensure all rows are saved before clicking the submission button.

---

#### Role 19: CEO Validation

**Assigned to**: Corporate Secretary

**What to do**: Validate the submission package before it goes to the Board.

**Steps**:

1. Open the application from the Part B list.
2. Review the complete package for accuracy and completeness.
3. If satisfied, click **"Approve"**.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

#### Role 20: Board

**Assigned to**: Board members

**What to do**: Make the final decision on whether to approve the zone establishment.

**Steps**:

1. Open the application from the Part B list.
2. Review all materials: evaluations, agency no-objection letters, ARC recommendation, status letter, CEO validation.
3. Make the final decision:
   - Click **"Approve"** to grant zone establishment.
   - Use the rejection option if the application is denied.
4. Confirm the action if prompted.

**Action button**: "Approve"

---

#### Role 21: SEZ Documents

**Assigned to**: SEZA staff (as designated)

**What to do**: Upload all end-of-process documents, including the developer license, operating certificate, and any other final documentation.

**Steps**:

1. Open the application from the Part B list.
2. Upload all required final documents:
   - Developer license.
   - Operating certificate (if applicable).
   - Any other documents required by the process.
3. Use the "Browse" links to upload each document.
4. Save the form after all uploads are complete.
5. Click the action button to finalize the process.
6. Confirm the action if prompted.

**Note**: The Developer License bot (automatic PDF generation) is currently non-functional due to missing input/output mappings. Until this is resolved, the license document must be prepared and uploaded manually.

---

## Corrections Flow

### When Corrections Are Requested

Corrections can be requested at two key points in the workflow:

1. **Phase 1 (Documents Check)** -- If uploaded documents are incomplete, illegible, or incorrect.
2. **Phase 5 (ARC)** -- If the committee determines that the application requires additional information or corrections.

### What Happens When Corrections Are Requested

1. The officer at the relevant step selects the "Send back for corrections" or equivalent option.
2. The application is routed to the **Complementary Information** step -- a front-office (applicant-side) role.
3. The applicant receives a notification that corrections are required.
4. The applicant logs in to the front office, reviews the correction requests, updates the application, and clicks **"Validate send page"** to resubmit.
5. The application returns to the step that requested corrections (Documents Check or the appropriate evaluation step) for re-review.

### Reviewing a Corrected Submission

1. When the applicant resubmits, the application reappears in your Part B list with a "File pending" status.
2. Open the application and review the corrected documents or data.
3. If corrections are satisfactory, proceed with the normal approval process.
4. If corrections are still insufficient, you may send the application back again.

---

## Rejection Flow

### When to Reject an Application

An application may be rejected at:

- **Phase 5 (ARC)** -- If the committee determines the application does not meet requirements.
- **Phase 7 (Board)** -- If the Board decides against zone establishment.

### Required Documentation

When rejecting an application:

1. Ensure all evaluation notes, risk assessments, and justifications are recorded in the system.
2. The rejection reason should be documented in the relevant form fields or committee notes.
3. The status letter (Phase 6) will communicate the decision to the applicant.

### What the Applicant Sees

Upon rejection, the applicant receives notification via the platform and/or email. The status letter contains the official decision and any reasons provided.

---

## Common Issues and Troubleshooting

### Disabled Action Buttons

**Problem**: The main action button (e.g., "Approve documents check", "Approve", "Send evaluation") is grayed out and cannot be clicked.

**Cause**: The hidden field `FORMDATAVALIDATIONSTATUS` has not been set to `"true"`. This field acts as a gate -- it must be true for the system to enable the action button.

**Solution**:
- For Documents Check: Ensure every document has been validated (clicked "Yes" in the carousel). All `filestatus` fields must be `true`.
- For other roles: Ensure all required form fields are filled in.
- If the button remains disabled after completing all fields, try saving the form and refreshing the page.
- As a last resort, contact your system administrator.

### EditGrid Rows Blocking Submission

**Problem**: The action button does not work even though all fields appear complete. This affects the ARC and Board Submission roles in particular.

**Cause**: EditGrid rows are in "new" or "editing" state. The system requires all rows to be saved (committed) before the form can be submitted.

**Solution**:
1. Scroll to the EditGrid section of the form.
2. Look for any rows that are open for editing (they will have a different background or show input fields).
3. Click the row-level save button (typically a checkmark icon or "Save Row" button) for each open row.
4. After saving all rows, try clicking the action button again.

### NOC Roles -- File Upload Required

**Problem**: The "Send consultation documents" button is disabled on the Organize NOC and Inspection step.

**Cause**: Not all required consultation documents have been uploaded. Each external agency requires its own set of documents.

**Solution**:
1. Check all "Browse" upload slots on the form.
2. Upload the appropriate consultation document for each agency.
3. Wait for each upload to complete before starting the next.
4. Save the form after all uploads are done.
5. The button should become enabled.

### Agency Approval Roles -- Radio Selection Required

**Problem**: The "Send decision to SEZA" button is disabled on JCA, TAJ, or MOFPS approval steps.

**Cause**: The "No objection" (or alternative) radio button has not been selected. This is a required field.

**Solution**:
1. Locate the decision radio button group on the form.
2. Select "No objection" (or the appropriate decision option).
3. Save the form.
4. The action button should become enabled.

### Page Does Not Load or Redirects to List

**Problem**: Clicking into an application redirects you back to the application list instead of opening the processing view.

**Cause**: The application may not be at your step in the workflow, or your account may not have the correct role assignment.

**Solution**:
- Verify that the application is currently at your processing step (check the "Active task" column in the list).
- Confirm with your administrator that your account is assigned to the correct role.

### Confirmation Dialog Does Not Appear

**Problem**: After clicking an action button, nothing seems to happen.

**Cause**: A confirmation dialog may have appeared behind the current window, or the system is still processing.

**Solution**:
- Wait at least 10-15 seconds for the system to respond.
- Check for a confirmation dialog (OK / Confirm / Yes button) that may have appeared.
- If no dialog appears and the page does not change, try clicking the action button again.
- Check for any error toasts or notifications at the top of the page.

---

## Quick Reference Table

The following table lists all 21 active processing roles with their phase, assigned officers, action button, and key steps.

| # | Phase | Role Name | Assigned Officers | Action Button | Key Steps |
|---|-------|-----------|-------------------|---------------|-----------|
| 1 | 1 - Intake | Documents Check | Michelle Hewett, Britania Bryan | "Approve documents check" | Open Documents tab, validate each document in carousel (click "Yes"), set FORMDATAVALIDATIONSTATUS, switch to Processing tab, click Approve |
| 2 | 2 - Evaluations | Legal Evaluation | Joanna Mills, Branttany Oforkaja, Shaquille Douglas | "Send evaluation to approval" | Review legal aspects, fill evaluation fields, click Send |
| 3 | 2 - Evaluations | Technical Evaluation | Krissan Meredith, Leondra Power, Alianne Barrows | (check processing view) | Review technical/infrastructure aspects, fill evaluation fields, click Send |
| 4 | 2 - Evaluations | Business Evaluation | Brittany Johnson | "Send evaluation for approval" | Review business plan viability, fill evaluation fields, click Send |
| 5 | 2 - Evaluations | Compliance Evaluation | Chevaughn Dacres, Cristena Smith, Abigail Johnston, Carleen Clacken-Reid | "Send evaluation for approval" | Review 6 compliance sub-areas, fill evaluation fields, click Send |
| 6 | 3 - External NOC | Organize NOC and Inspection | SEZA staff | "Send consultation documents" | Upload consultation docs for each agency, save, click Send |
| 7 | 3 - External NOC | JCA Approval | Jamaica Customs Agency | "Send decision to SEZA" | Review customs aspects, select "No objection" radio, click Send |
| 8 | 3 - External NOC | TAJ Approval | Tax Administration Jamaica | "Send decision to SEZA" | Review tax compliance, select "No objection" radio, click Send |
| 9 | 3 - External NOC | MOFPS Approval | Ministry of Finance | "Send decision to SEZA" | Review fiscal aspects, select "No objection" radio, click Send |
| 10 | 4 - Approvals | Legal Approval | Janis Williams | "Approve" | Review legal evaluation, click Approve |
| 11 | 4 - Approvals | Technical Approval | Deborah Broomfield | "Approve" | Review technical evaluation, click Approve |
| 12 | 4 - Approvals | Business Approval | Licia Grant Mullings, Yeuniek Hinds | "Approve" | Review business evaluation, click Approve |
| 13 | 4 - Approvals | Compliance Approval | Ainsley Brown (COO) | "Approve" | Review compliance evaluation, click Approve |
| 14 | 5 - ARC | ARC (Application Review Committee) | Committee | "Approve" | Review all consolidated evaluations, save EditGrid rows, click Approve |
| 15 | 5.5 - Corrections | Complementary Information | Applicant (front-office) | "Validate send page" | Applicant corrects and resubmits -- not a back-office role |
| 16 | 6 - Decision | Status Letter | Michelle Hewett, Britannia Bryan | (check processing view) | Draft official status/decision letter, save, forward for signature |
| 17 | 6 - Decision | Signature Status Letter | Licia Grant Mullings, Yeuniek Hinds | "Approve" | Review status letter, click Approve to sign |
| 18 | 7 - Board | Board Submission | SEZA staff | (check processing view) | Prepare Board package, save EditGrid rows, submit |
| 19 | 7 - Board | CEO Validation | Corporate Secretary | "Approve" | Validate submission package, click Approve |
| 20 | 7 - Board | Board | Board members | "Approve" | Final decision -- Approve or Reject |
| 21 | 7 - Board | SEZ Documents | SEZA staff | (check processing view) | Upload final documents (license, certificate), save, finalize |

---

*End of manual.*
