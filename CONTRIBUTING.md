# Contributing to Onera

Thanks for contributing. Please keep changes focused, reviewable, and consistent with the project style.

## Branch Naming
- Use short, descriptive branch names.
- Recommended format: `type/scope-short-description`
- Examples:
  - `feat/session-summary-copy`
  - `fix/timer-completion-state`
  - `docs/readme-refresh`

## Pull Requests
- Keep PRs scoped to one logical change.
- Use clear titles and include:
  - What changed
  - Why it changed
  - How it was validated (commands/tests)
- Link related issues when applicable.
- Include screenshots for visible UI changes.

## Code Style & Formatting
- Use TypeScript consistently; keep types explicit at module boundaries.
- Follow existing file organization and naming patterns.
- Keep UI concerns in `components/screens` and domain logic in `application/domain/engine`.
- Run checks before opening a PR:
  ```bash
  npm run typecheck
  npm run lint
  ```
