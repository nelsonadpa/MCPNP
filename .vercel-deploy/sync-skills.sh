#!/bin/bash
# sync-skills.sh — Copy skill files from their source-of-truth locations
# into .vercel-deploy/skills/ for the Vercel static deploy.
#
# Symlinks don't work on Vercel, so we maintain copies here.
# Run this script after editing any skill source file.
#
# Sources:
#   .claude/commands/*           → Global slash commands (Claude Code)
#   <agent>/.claude/skills/*     → Agent-specific skills
#   countries/<country>/skills/* → Country-specific skills

set -euo pipefail
cd "$(dirname "$0")/.."

DEST=".vercel-deploy/skills"

echo "Syncing skills to $DEST/"

# --- Global commands (.claude/commands/) ---
# These are the Claude Code slash commands, served as downloadable skills
for f in check-bpa connect-service debug-service my-files-block service-health \
         bot-failures generate-docs e2e-test correlate-logs; do
  cp ".claude/commands/${f}.md" "$DEST/${f}.md"
done
# change-detection and trace-dossier from commands get a cmd- prefix to avoid
# collision with agent-scoped versions (manual/ and observer/ respectively)
cp ".claude/commands/change-detection.md" "$DEST/cmd-change-detection.md"
cp ".claude/commands/trace-dossier.md"    "$DEST/cmd-trace-dossier.md"

# --- Agent-specific skills ---
cp config/.claude/skills/service-setup.md       "$DEST/service-setup.md"
cp config/setup-my-files-block.md               "$DEST/setup-my-files-block.md"
cp manual/.claude/skills/documentation.md       "$DEST/documentation.md"
cp manual/.claude/skills/change-detection.md    "$DEST/change-detection.md"
cp testing/.claude/skills/playwright-e2e.md     "$DEST/playwright-e2e.md"
cp testing/.claude/skills/page-objects.md       "$DEST/page-objects.md"
cp observer/.claude/skills/bot-failure-report.md    "$DEST/bot-failure-report.md"
cp observer/.claude/skills/service-health-check.md  "$DEST/service-health-check.md"
cp observer/.claude/skills/trace-dossier.md         "$DEST/trace-dossier.md"
cp observer/.claude/skills/correlate-test-logs.md   "$DEST/correlate-test-logs.md"

# --- Country-specific skills ---
cp countries/cuba/skills/fix-determinant-effects/SKILL.md  "$DEST/cuba-fix-determinant-effects.md"
cp countries/cuba/skills/e2e-service-test/SKILL.md         "$DEST/cuba-e2e-service-test.md"
cp countries/jamaica/skills/form-fill-submit/SKILL.md      "$DEST/jamaica-form-fill-submit.md"

echo "Done. $(ls "$DEST"/*.md | wc -l | tr -d ' ') skill files synced."
