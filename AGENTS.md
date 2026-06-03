<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Purpose

Build and maintain the whitelabel frontend experience with a clean auth flow,
accessible UI, and stable app-level foundations (theme, GraphQL client, route
protection, and deployment hygiene).

## Accessibility Standard

- Meet WCAG 2.2 AA for all new and updated UI.
- Keep keyboard navigation complete and visible (focus rings, logical tab flow).
- Ensure interactive elements have clear labels and sufficient color contrast.
- Respect user motion preferences (`prefers-reduced-motion`) for animated UI.

## React Hygiene

- Prefer small, focused components with explicit props and predictable state.
- Keep server/client boundaries clear; only add `"use client"` when required.
- Validate form inputs before network calls and surface user-friendly errors.
- Avoid unnecessary effects and stale closures; keep dependencies accurate.
- Favor composition and existing design-system primitives over one-off UI code.
