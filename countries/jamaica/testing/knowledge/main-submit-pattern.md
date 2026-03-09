# MAIN Service — File Submission Pattern

**Service**: MAIN - Establish a new zone (`0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`)
**Instance**: BPA-jamaica
**Last used**: 2026-03-05

## Quick Steps (Manual ~2 min)

1. Go to: `https://jamaica.eregistrations.org/services/0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc`
2. Fill Project Overview (company name, contact, etc.)
3. Fill Developer tab (company type, shareholders)
4. Fill Master Plan:
   - **Land rights & tenure**: Add row → fill Parcel designation → click **Save**
   - **Land area summary**: Edit row → set Area (must match Total land area!) → select Unit via dropdown → click **Save**
   - Upload documents to all required file fields
5. Fill Business Plan + Compliance (6 sub-sections)
6. Upload all 33+ required documents
7. Go to Send → check consents → Submit

## Critical Gotchas

| Issue | Solution |
|-------|----------|
| EditGrid rows not saved | Must click the **Save** button inside the row (API setValue doesn't persist) |
| Area doesn't match Total land area | Set the grid Area to match the Total land area field value |
| Unit dropdown (Choices.js, dataSrc:url) | Must use UI click interaction — API setValue rejected by backend |
| Fake file metadata | Backend rejects `comp.setValue([{url:...}])` — must upload real files via filechooser |
| 33+ document requirements | Every file upload field must have a real uploaded PDF |
| "Please correct invalid rows" error | An EditGrid row is in editing/unsaved state — find and Save it |
| "Unit is required" error | The parcel grid row's Unit dropdown is empty |

## Automated Form Fill (Partial)

The spec `main-submit-file.spec.ts` fills ~80% of the form automatically:
- Text fields, emails, phone numbers
- Radio buttons, checkboxes
- Choices.js dropdowns (search-based)
- Shareholders EditGrid
- ~15 document uploads (where browse links are visible)

**Still requires manual**:
- Master Plan sub-section navigation (nested tabs)
- Land parcels grid (Save button)
- Land area summary grid (Area + Unit + Save)
- ~18 additional document uploads in hidden sub-sections

## IDs from Last Submission

```json
{
  "fileId": "9b7143dc-4977-4d93-bccb-94c09e216d89",
  "processId": "6baccd1e-18e5-11f1-899e-b6594fb67add",
  "serviceId": "0d8ca0c6-2a74-4d10-8c64-0b4e4a186adc"
}
```

## Key Component Keys (identical to PARTB)

| Component | Key |
|-----------|-----|
| Land parcels grid | `applicantParcelsDescriptionGrid` |
| Parcel areas grid | `applicantDetailedParcelsGrid2` |
| Unit (project overview) | `applicantUnit` |
| Unit (grid) | `applicantUnit2` |
| Unit (building) | `applicantUnit3` |
| Total land area | referenced in validation message |
