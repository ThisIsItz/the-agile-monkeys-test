# CLAUDE.md

## General

- Prefer simple, readable, maintainable solutions.
- Follow KISS, YAGNI, DRY, and SOLID pragmatically.
- Avoid premature abstractions and over-engineering.
- Follow existing project conventions.
- Read `CHALLENGE.md` when challenge requirements affect a decision.
- Keep responses brief: max 5 bullet points unless more detail is requested; avoid filler and unsolicited explanations.

## Changes

- Inspect relevant existing code before modifying it.
- Make the smallest coherent change.
- Reuse existing components and utilities.
- Avoid unrelated refactors and unnecessary dependencies.

## Code

- Use clear names and focused functions/components.
- Prefer readable, straightforward code over clever or overly compact code.
- Keep business logic separate from UI where practical.
- Prefer precise TypeScript types; avoid `any`.
- Avoid unnecessary comments and commented-out code.
- Never silently swallow errors.

## Data Modelling

- Treat schemas and entries as core domain models.
- Keep schema definitions explicit and type-safe.
- Validate entries against their schema.
- Handle reference fields and referential integrity deliberately.

## Schema-driven UI

- Generate entry forms from schema definitions.
- Schema changes must be reflected in the entry editor.
- Schema-driven rendering and validation are core requirements, not premature abstraction.

## React

- Keep state local when possible.
- Do not store derived state.
- Avoid unnecessary effects and memoization.
- Prefer semantic HTML.
- Keep JSX simple and readable.

## Backend

- Keep the backend thin.
- Focus on required CRUD, validation, persistence, and real-time broadcasts.
- Avoid unnecessary backend layers or abstractions.

## Real-Time

- Synchronize schema and entry changes across connected clients.
- Keep synchronization simple.
- Do not implement conflict resolution, versioning, or optimistic locking unless required.

## Navigation

- Support browsing entries by schema and navigating to referenced entries.
- Keep routing simple and consistent.

## Styles

- Use BEM: `block`, `block__element`, `block--modifier`.
- Use semantic class names, not visual names.
- Keep selectors shallow and specificity low.
- Avoid IDs, `!important`, and DOM-dependent selectors.
- Use CSS variables/tokens for shared values.
- Keep JSX structure and BEM naming clear and consistent.

## Testing

- Test behavior, not implementation details.
- Add tests for meaningful logic, edge cases, and regressions.
- Prioritize tests around schema validation, dynamic forms, CRUD behavior, and real-time updates.
- Run tests, typecheck, and lint before finishing.

## Scope

- Do not add authentication or role-based permissions.
- Do not add advanced conflict resolution.
- Avoid production infrastructure not required by the challenge.

## Before finishing

- Remove dead and debug code.
- Check edge cases.
- Verify schema changes are reflected correctly in the entry editor.
- Run tests, typecheck, and lint.
- Do not claim something works unless verified.
