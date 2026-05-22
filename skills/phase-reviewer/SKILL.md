# Phase Reviewer Skill

Review code changes against phase documentation and source of truth using Claude API.

## When to use
Use at the end of every development phase, before final verification and user sign-off.

## How to execute
1. Check that `.env.local` contains `ANTHROPIC_API_KEY`.
2. Run command:
   ```bash
   npm run review
   ```
3. Locate review report: `docs/phase-xx-xx/claude-review.md`.
4. Address all **RED FLAGS** in the report.
5. Rerun review to confirm fixes.
