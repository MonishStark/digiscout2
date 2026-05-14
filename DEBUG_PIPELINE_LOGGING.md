<!-- @format -->

# Debug Pipeline Logging

This project now writes a file-backed generation trace for every website build under `.debug-generation/<trace-id>/`.

## Where Logs Live

Each generation creates a dedicated folder named from the business and timestamp, for example:

- `.debug-generation/2026-05-14T07-30-40-one-hour-cleaners/`

That folder contains ordered stage artifacts:

1. `01-business-input.json`
2. `02-generation-prompt.md`
3. `03-gemini-raw-response.txt`
4. `04-extracted-json.json`
5. `05-normalized-schema.json`
6. `06-renderer-input.json`
7. `07-rendered-html.html`
8. `08-wordpress-blocks.html`
9. `09-final-preview-summary.md`
10. `10-errors.log`

## What Each File Shows

- `01-business-input.json` captures the input business object and enrichment context before generation starts.
- `02-generation-prompt.md` stores the exact prompt sent to Gemini.
- `03-gemini-raw-response.txt` preserves the unparsed model output.
- `04-extracted-json.json` records the JSON object extracted from the model response.
- `05-normalized-schema.json` shows the repaired schema after section normalization.
- `06-renderer-input.json` captures what the frontend renderer receives.
- `07-rendered-html.html` is the preview HTML emitted by the site renderer.
- `08-wordpress-blocks.html` is the Gutenberg/WordPress block output used for provisioning.
- `09-final-preview-summary.md` summarizes the trace, section order, counts, and errors.
- `10-errors.log` appends any parser, normalization, rendering, or provisioning failures.

## Live Test Run

A real UI generation test was run for:

- Location: San Francisco, CA
- Business type: dry cleaner
- Business selected: One Hour Cleaners

Trace created:

- `2026-05-14T07-30-40-one-hour-cleaners`

Observed result:

- The generation completed and wrote the first nine stage artifacts.
- The final preview summary reported 8 parse repairs, 1 gallery item, 1 testimonial item, and no fallback schema use.
- The qualification step also surfaced a backend/tooling issue in the input notes: `Tool use with a response mime type: 'application/json' is unsupported`.

## How To Inspect A Trace

1. Open the trace folder under `.debug-generation/`.
2. Compare `01-business-input.json` against `02-generation-prompt.md` to confirm the input context actually reached the model.
3. Compare `03-gemini-raw-response.txt` with `04-extracted-json.json` to see whether parsing or extraction introduced loss.
4. Compare `05-normalized-schema.json` with `06-renderer-input.json` to verify renderer shaping.
5. Use `07-rendered-html.html` and `08-wordpress-blocks.html` to compare preview output versus WordPress provisioning output.
6. Check `09-final-preview-summary.md` first when a trace looks suspicious; it is the quickest high-level health check.

## Debugging Guidance

- If `03-gemini-raw-response.txt` is missing, the model call likely failed before a response was returned.
- If `04-extracted-json.json` exists but `05-normalized-schema.json` looks degraded, the schema parser or section repair logic is the likely culprit.
- If `07-rendered-html.html` looks good but the WordPress output does not, the issue is in the Gutenberg conversion path.
- If `10-errors.log` is present, start there before reading the rest of the trace.

## Current Note

The backend now boots cleanly and the live generation trace is being emitted. The one remaining issue observed during the live run is the qualification/tooling error noted above, which should be addressed separately if the intent is to make lead enrichment fully reliable.
