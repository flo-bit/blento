# Feature: Option to hide cards on mobile.

## Authority
This document is the source of truth.
If a requirement is missing, implementation must stop.

## Goal
This feature enables users to hide a specified card from mobile web view.

## Non-Goals
This feature will not:
- Hide the specified card from desktop web view.
- Replace any other existing functionality.
- Interfere with any other existing functionality.
- Leave a gap in the layout when the specified card is hidden.

## Functional Requirements
- The user should be able to toggle the specified card's visibility in the UI on mobile web view.

## Acceptance Criteria
- Given a card, when it is toggled to hide on mobile web view, then it is not visible in the UI on mobile web view.
- Given a card toggled to hide on mobile web view, when the full layout is rendered, then surrounding cards move to fill the gap left by the hidden card.
- Given a card, when it is toggled to show on mobile web view, then it is visible in the UI on mobile web view.