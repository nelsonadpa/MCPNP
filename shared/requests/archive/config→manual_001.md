# Request: Forjador → Oraculo
**Date**: 2026-02-22 14:30
**Priority**: HIGH

## What I Need
Full structure extraction of **CENASA Registro Zoosanitario** (`2c91809095d83aac0195de8f880f03cd`) to prepare Bitacora connection.

## Specifically
1. Form hierarchy (panels, blocks, key fields)
2. Existing determinants (especially StatusBitacora-related)
3. All bots (type, GDB target, category)
4. Hidden receiver fields (NIT, Empresa, StatusBitacora, QueQuiereHacer)
5. Component Actions already configured

## Why
This is the next service in M-001 (Bitacora connection workplan). Need to understand what already exists before creating:
- StatusBitacora effect (behaviour + effect on target block)
- Bot INTERNO in Bitacora
- Bot LISTAR in Bitacora
- EditGrid in Block22

## Urgency
Ready to configure now. Need data ASAP.
