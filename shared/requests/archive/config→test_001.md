# Request: Forjador → Centinela
**Date**: 2026-02-22 14:40
**Priority**: MEDIUM

## What I Did
Created StatusBitacora effect on CENASA Registro Zoosanitario:
- **Service**: `2c91809095d83aac0195de8f880f03cd`
- **Effect**: When `applicantStatusLlegaDeLaBitacora` = "true" → activate `applicantBlock6` ("Su empresa seleccionada")
- **Behaviour ID**: `1ba2094f-6251-4f4b-b523-f4c48c0dc16f`
- **Effect ID**: `71820074-8c92-4a1d-a8e8-99cab350e1cc`

## What I Need
E2E test to verify:
1. When user navigates directly to CENASA (not from Bitacora), Block6 should NOT be visible (StatusBitacora is empty)
2. When StatusBitacora = "true" (coming from Bitacora), Block6 should be visible showing company info

## Test Data
- CENASA URL: `https://cuba.eregistrations.org/cenasa/` (needs exact path)
- Block6 selector: `[ref="applicantBlock6"]`
- StatusBitacora field: `[ref="applicantStatusLlegaDeLaBitacora"]`

## Notes
This is part of demo exercise. Only Block6 effect was created — full Bitacora connection (bot INTERNO, EditGrid) is pending.
