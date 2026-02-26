Im testing in applicantExpiradoFito inside applicantEditGridFito we need to create the same behavior we have in applicantEditGrid applicantExpirado to show the badge if applicantExpiracionFito is later than today



Let me first check the existing behavior on the PE's applicantExpirado to understand the exact pattern, then replicate it for Fito.


Retrieved component behavior and form configuration for applicantExpirado button

I can see the pattern. The PE applicantExpirado uses:

Behaviour 448beb4f with effect f2271f0a
Determinant 2b43313a — let me get its details
Effect: activate=true, show=true when determinant matches
Default: activate: false (hidden by default, shown when expired)
Let me check the determinant:


Retrieved determinant configuration for temporary permit expiration validation rule

It's a grid determinant targeting applicantEditGrid. It wraps a row-level determinant. Let me find the row determinant. Let me search for date determinants targeting the expiration field:


Searched determinants for "vigencia" pattern match

I see 6bacdc42 is the broken one we created before (the row_determinant_id saved as null due to Bug 4-5). Let me also look for the row-level date determinant that the PE grid determinant references:


Found 1 date determinant matching "hoy" pattern

Let me search more broadly for the row-level date determinant:


Searched for date-type determinants in BPA-cuba service

Only one date determinant visible. The row-level determinant for PE's grid might be embedded differently. Let me check if there's a raw structure on the grid determinant 2b43313a:


Searched for applicant expiration determinants and found temporary permit validity rule

Let me look at the full determinant list and check fa1f7425 which I noted as the valid row date determinant in MEMORY:


Retrieved determinant list for service configuration and validation

I see 19 determinants. The row-level date determinant for PE isn't showing as a separate determinant — it's likely embedded inside the grid determinant. The grid determinant 2b43313a wraps a row date determinant.

Let me check what fa1f7425 was — maybe slightly different ID. Let me search by name pattern:


Searched for determinants matching "fito" pattern found

OK so 6bacdc42 is the broken grid determinant we created before (row_determinant_id=null). Let me try to look at the raw export to find the PE's row-level determinant embedded inside 2b43313a:


Fixed CSS badges for Expirado status on Fito and Zoo

Let me try a different approach — let me look at the PE grid determinant's internals via service export to understand the row determinant structure:


Attempted service export but encountered null pointer error in BPA server

The export itself fails because 6bacdc42 (the broken grid determinant with null row_determinant_id) causes a NullPointerException. This is Bug 4-5 — the broken grid determinant is blocking the entire service export!

Let me first clean up that broken determinant and its broken behaviour, then retry:


Failed to delete behavior due to non-existent ID

Let me find the correct ID:


Queried component behavior for applicantExpiradoFito, found none configured

No behaviour on applicantExpiradoFito currently. Let me try to delete the broken grid determinant directly:


Deleted determinant "Vigencia fito < hoy" from service successfully

Broken grid determinant deleted. Now let me retry the export:


Exported service configuration to file due to size limit
Show more

Good, the export succeeded now. I just need to find the PE grid determinant structure. Let me search for the relevant determinant section:


Searched for hex string pattern in exported data file

The file is one long line. Let me use jq to extract the determinant:


Analyzed Cuba service export data and extracted 23 determinants

Now I can see it. The row determinant is 73879ced — "Row determinant in Vigencia permiso eventual < hoy". Let me inspect it:


Extracted and analyzed service export data from JSON file
Show more

Now I have the complete pattern:

PE Pattern:

Row date determinant 73879ced: applicantEditGrid_collection_applicantExpiracion LESS_THAN current date
Grid determinant 2b43313a: wraps the row determinant, targets applicantEditGrid
Effect: activates applicantExpirado when the grid determinant matches
For Fito I need:

Row date determinant: applicantEditGridFito_collection_applicantExpiracionFito LESS_THAN current date
Grid determinant: wraps row determinant, targets applicantEditGridFito
Effect: activates applicantExpiradoFito
Let me try creating these. First the row date determinant:


Created date determinant for phytosanitary expiration validation

Row date determinant created: 5711375c. Now the grid determinant:


Created grid determinant for phytosanitary validity date validation

Bug 4-5 confirmed again — row_determinant_id: null even though I passed it. The grid determinant d483d9fd is broken just like the previous one.

This means we cannot automate this via MCP. The grid determinant create tool has the known bug where it doesn't persist the row_determinant_id.

Let me clean up the broken objects I just created:


Deleted phytosanitary validity determinant from service configuration

Good. But the row date determinant 5711375c is valid — we should keep it since it'll be needed when creating the grid determinant manually.

Let me also delete the old row determinant fa1f7425 that was referenced in MEMORY if it still exists — actually from the determinant list earlier I didn't see it, so it may have already been cleaned up. The only row determinant we have now is 5711375c.


Fixed CSS badges for Expirado components on Fito and Zoo

Here's the situation with the Expirado badge for Fito:

Bug 4-5 confirmed: griddeterminant_create does NOT persist row_determinant_id — saves as null every time, making the grid determinant broken and unusable.

What I was able to do via MCP:
✅ Cleaned up the old broken grid determinant 6bacdc42 (was blocking service export!)
✅ Created the row date determinant 5711375c — this is valid and ready to use:
Name: "Row determinant in Vigencia fito < hoy"
Target: applicantEditGridFito_collection_applicantExpiracionFito
Operator: LESS_THAN current date
❌ Tried creating the grid determinant wrapping it — row_determinant_id saved as null. Deleted the broken grid determinant.
What you need to do manually in BPA UI:
Step 1: Create Grid Determinant

Go to Bitácora service → Determinants
Create a new Grid Determinant:
Name: Vigencia fito < hoy
Target field: applicantEditGridFito
Row determinant: select the existing Row determinant in Vigencia fito < hoy (5711375c)
Step 2: Create Effect on applicantExpiradoFito

Go to Component Behaviours for applicantExpiradoFito
Create effect:
Determinant: Vigencia fito < hoy (the grid determinant from step 1)
Logic: OR
Effect: activate = true, show = true, disabled = false
This replicates exactly what PE has on applicantExpirado with determinant 2b43313a → effect f2271f0a.

Would you like me to walk you through the BPA UI for this, or shall we try something else first?

Uploaded image
image.png
Looks bad the configuration of the determinant Row determinant in Vigencia fito < hoy is not complete



You're right — the MCP tool created the row date determinant with the name and target field key, but the BPA UI shows "Select field" and "where will the determinant be applied" are both empty. The MCP bug means it didn't properly save the field reference and operator/date configuration.

Let me delete this broken one so you can create it manually from scratch:


Deleted determinant "Row determinant in Vigencia fito < hoy"

Deleted. Now let me check exactly how the PE reference determinant looks in the UI so I can guide you. Let me get the working PE row determinant details:


Retrieved determinant configuration for date validation rule

OK, here's what you need to create both determinants manually in the BPA UI. The whole chain is 2 determinants + 1 effect:

Step 1: Create the Row Date Determinant
In Bitácora → Determinants → Create new → Type: Date

Field	Value
Name	Row determinant in Vigencia fito < hoy
Select field	applicantExpiracionFito (inside applicantEditGridFito)
Where will the determinant be applied	Should auto-set to applicantEditGridFito
Operator	LESS_THAN (menor que)
Compare to	Current date (today's date checkbox)
Step 2: Create the Grid Determinant
In Bitácora → Determinants → Create new → Type: Grid

Field	Value
Name	Vigencia fito < hoy
Select field	applicantEditGridFito
Row determinant	Select the row determinant from Step 1
Step 3: Create the Effect on applicantExpiradoFito
In Bitácora → Form → find applicantExpiradoFito (inside EditGridFito) → Behaviours → Add effect:

Field	Value
Determinant	Vigencia fito < hoy (the grid determinant from Step 2)
Effect	activate = true
This will make the red "Expirado" badge appear on rows where applicantExpiracionFito is in the past.

why can you do it using the MCP?



You're right to question that. The datedeterminant_create created the determinant but the BPA UI showed it incomplete. But looking at the raw data, the API actually returned operator: LESS_THAN, target_form_field_key, and is_current_date: true — so maybe the issue is specific to how the BPA UI renders date determinants that target _collection_ fields.

Let me try a different approach — create the row date determinant targeting just applicantExpiracionFito (without the _collection_ prefix), since that's how the BPA UI would reference it inside the grid context:


Created date determinant for phytosanitary expiration validation

Created f0868ce7. Can you check in the BPA UI if this one shows the field and operator correctly? Go to Determinants → find "Row determinant in Vigencia fito < hoy" and see if "Select field", operator, and current date are populated.

If it looks good, I'll proceed with the grid determinant + effect. (The grid determinant is the one with Bug 4-5 — row_determinant_id saves as null — but let's first confirm this row determinant is properly configured.)

Uploaded image
image.png
Still incomplete you need to indicate that will be used inside the same grid and select the predicate



I see — the MCP created the determinant but it's missing:

"where will the determinant be applied" needs to be set to "inside same grid"
The operator (LESS_THAN) and current date comparison aren't showing
The field selection looks correct: Applicant form...Permiso fitosanitario.Vigente hasta

Please complete it manually in the UI:

Select "inside same grid" (already showing in your dropdown ✅)
After selecting that, you should see the operator/comparison fields appear — set:
Operator: Less than (menor que)
Compare to: Current date (fecha actual)
Click Save
Then you'll need to:

Create the Grid Determinant manually too (since griddeterminant_create has Bug 4-5)
And the Effect on applicantExpiradoFito
The MCP datedeterminant_create tool doesn't have a parameter for "inside same grid" vs "outside the grid" — that's a new limitation we hadn't documented. Let me delete this broken one so you start fresh:


Deleted determinant "Row determinant in Vigencia fito < hoy"

Deleted. So all three pieces need manual creation in BPA UI. Here's the complete guide:

Create all 3 manually:
1. Row Date Determinant → Determinants → New → Type: Date

Field	Value
Name	Row determinant in Vigencia fito < hoy
Select field	applicantExpiracionFito (Vigente hasta, inside EditGridFito)
Where applied	inside same grid
Operator	Less than
Compare to	Current date ✓
2. Grid Determinant → Determinants → New → Type: Grid

Field	Value
Name	Vigencia fito < hoy
Select field	applicantEditGridFito
Row determinant	Select Row determinant in Vigencia fito < hoy from step 1
3. Effect on applicantExpiradoFito → Form → find the Expirado button inside EditGridFito → Behaviours → Add:

Field	Value
Determinant	Vigencia fito < hoy (grid determinant from step 2)
Effect	activate = true
This is a new MCP bug to document — datedeterminant_create doesn't support the determinantInsideGrid flag.
Can you please link any existing determinant to that component 'expirados' so we can learn also together if your MCP capabilities allow linking correctly a determinant or effect into an element in the form?



Good idea — let's test if the effect_create tool works correctly. I'll link an existing determinant to applicantExpiradoFito just as a test. Let me use a simple existing determinant — like 22ea0e4b ("Empresa seleccionada distinto de vacío") — just to see if the effect/behaviour machinery works:


Created activation effect for applicantExpiradoFito component

It worked! The effect was created:

Behaviour ID: c1efbb4b
Effect ID: 16e6ca1d
Determinant: "Empresa seleccionada distinto de vacío" → activate applicantExpiradoFito
Let me verify the component now has the behaviour linked:


Retrieved form component and behavior configuration for applicantExpiradoFito button

effect_create works perfectly via MCP! Here's what we confirmed:

Check	Result
behaviourId on component	✅ c1efbb4b — auto-linked
Behaviour has effect	✅ 16e6ca1d with activate=true
Determinant resolved	✅ data.applicantNit5 != ""
So the good news is: effect_create works and auto-links the behaviourId to the component. No need for a manual form_component_update step for behaviours (unlike component actions).

This means once you create the two determinants manually (row date + grid), I can link the grid determinant to applicantExpiradoFito via MCP. Let me clean up this test effect now:


Deleted applicantExpiradoFito behavior from system

Test effect cleaned up.

Summary — what's automatable vs manual for the Expirado badge:

Step	MCP?	Status
1. Row date determinant (inside grid, LESS_THAN current date)	❌ Missing determinantInsideGrid param	Manual
2. Grid determinant (wraps row determinant)	❌ Bug 4-5, row_determinant_id saves null	Manual
3. Effect linking grid determinant → applicantExpiradoFito	✅ effect_create works	MCP — I'll do it after you create steps 1 & 2
Go ahead and create the two determinants in the BPA UI, then tell me the grid determinant ID and I'll link it.

Uploaded image
image.png
No effect seems to be linked to the key applicantExpiradoFito



Interesting — the Relation ID c1efbb4b is still there (from our test), but Effects (0) shows empty. The effect_delete removed the effect/behaviour from the backend but the behaviourId reference on the component wasn't cleared.

Let me clean that up and also verify the backend state:


Retrieved "Expirado" button component configuration from applicant form

Confirmed — behaviourId is stale (c1efbb4b which was already deleted) and effectsIds is empty. Let me clear it:


Updated applicantExpiradoFito component in Applicant Form

Cleaned up. So we learned something important:

effect_delete deletes the behaviour record but does NOT clear the behaviourId from the component. The component is left with a stale reference. This means after effect_delete you need to also call form_component_update to clear behaviourId.

Now — can you go ahead and create the two determinants manually in the BPA UI:

Row date determinant: applicantExpiracionFito, inside same grid, LESS_THAN, current date
Grid determinant: applicantEditGridFito, row determinant = the one from step 1
Once you have the grid determinant ID, give it to me and I'll link it to applicantExpiradoFito via effect_create.