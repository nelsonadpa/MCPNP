# Backup First Rule — Config Agent

## RULE
Before modifying any component, determinant, bot, or mapping, ALWAYS read its current state first.

## Steps before ANY modification
1. `form_component_get(service_id, component_key)` — save current behaviourId, componentActionId, cssClass
2. `determinant_get(service_id, determinant_id)` — if modifying a determinant
3. `bot_get(service_id, bot_id)` — if modifying a bot
4. `bot_mapping_summary(service_id, bot_id)` — if modifying mappings

## Log the baseline
Include the "before" state in the CHANGELOG entry so rollback is possible.

## If something breaks
1. Log in CHANGELOG with NEEDS_CLEANUP status
2. Include the original values for rollback
3. Do NOT retry the same operation — investigate first
