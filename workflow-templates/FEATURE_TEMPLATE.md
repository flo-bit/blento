<!-- 
How to use this document:
1. Copy all content below this comment.
2. Create a new directory for your feature at `project-root/features/<feature-name>`.
3. Create a new feature doc for your feature at `project-root/features/<feature-name>/FEATURE.md`.
4. Paste copied content into your new `FEATURE.md`.
5. Leave Authority section unedited.
6. Edit all other sections with your requirements.
7. Instruct your agent to reference your new `FEATURE.md` during planning.
8. Instruct your agent to output its plan to `project-root/features/<feature-name>/PLAN.md` following the `project-root/PLAN_TEMPLATE.md`.
9. Review, revise, approve the new plan doc iteratively.
10. Ensure your `FEATURE.md` remains unmodified by your agent.
11. Instruct your agent to implement the feature according to your new `PLAN.md`.
12. Ensure your `PLAN.md` remains unmodified by your agent.
13. Instruct your agent to outline its work in `IMPLEMENTATION_NOTES.md`, including any uncertainties or changes to the `PLAN.md` it'd like to make.
-->
# Feature: <name>

## Authority
This document is the source of truth.
If a requirement is missing, implementation must stop.

## Goal
One sentence. What problem exists and what “done” means.

## Non-Goals
Explicitly list what this feature will NOT do.

## Functional Requirements
- Must …
- Must not …
- Should …

## Constraints
- Language/runtime versions
- Architectural boundaries (e.g., “no new services”)
- Performance budgets
- Security/compliance rules
- Libraries allowed / forbidden

## Invariants
Things that must remain true after implementation.
(e.g., “Build remains under 14kb” — very on-brand for you.)

## Anti-Patterns (Explicitly Forbidden)

## Acceptance Criteria
Bullet-pointed, verifiable outcomes.

## Open Questions
If non-empty, agent must surface them *before coding*.
