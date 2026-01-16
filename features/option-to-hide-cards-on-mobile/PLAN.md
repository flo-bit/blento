# Implementation Plan - Option to Hide Cards on Mobile

## Problem Statement
Users need the ability to hide specific cards from the mobile web view while keeping them visible on desktop. When a card is hidden on mobile, the layout should automatically adjust so surrounding cards fill the gap without leaving empty space.

## Requirements
Based on FEATURE.md:
- Users can toggle a card's visibility for mobile web view
- Hidden cards are not visible on mobile web view
- Hidden cards remain visible on desktop web view
- Layout automatically adjusts to fill gaps left by hidden cards on mobile
- No interference with existing functionality

## Background
After examining the codebase:
- Cards are rendered using BaseCard.svelte and BaseEditingCard.svelte
- The Item type (in src/lib/types.ts) stores card properties including mobile-specific dimensions (mobileW, mobileH, mobileX, mobileY)
- Mobile vs desktop rendering is determined by viewport width check (innerWidth < 1024)
- The isMobile() context function is available throughout the card components
- Cards are filtered and sorted in Website.svelte using data.cards.toSorted(sortItems)
- The BaseEditingCard.svelte already has a settings popover system for card configuration
- Similar visibility toggle exists for profile (hideProfile preference)

## Proposed Solution
Add a hideOnMobile boolean property to the Item type. Filter cards in the rendering logic based on this property and the current viewport.
Add a toggle control in the card editing interface.

Key Design Decisions:
- Store the property at the card level (not global) for per-card control
- Use filtering in render logic - simply filter cards from the render array
- Leverage existing popover UI pattern from BaseEditingCard.svelte
- No changes needed to layout algorithm since filtered cards won't participate in positioning

## Task Breakdown

Task 1: Add hideOnMobile property to Item type
- Objective: Extend the data model to support the hide-on-mobile feature
- Add optional hideOnMobile?: boolean property to the Item type in src/lib/types.ts
- Test: Verify TypeScript compilation succeeds
- Demo: No visual change; type system now supports the new property

Task 2: Filter cards in Website.svelte based on hideOnMobile
- Objective: Implement the core hiding logic for mobile view
- In src/lib/website/Website.svelte, modify the card rendering to filter out cards where hideOnMobile === true when isMobile === true
- Apply filter before the toSorted(sortItems) call: data.cards.filter(item => !(isMobile && item.hideOnMobile)).toSorted(sortItems)
- Test: Manually set hideOnMobile: true on a card in the data and verify it disappears on mobile viewport
- Demo: Cards with hideOnMobile: true are hidden on mobile view, visible on desktop view, and layout adjusts automatically

Task 3: Add toggle control in BaseEditingCard.svelte
- Objective: Provide UI for users to toggle the hideOnMobile setting
- In src/lib/cards/BaseCard/BaseEditingCard.svelte, add a button in the controls section (near color/size controls)
- Button should show mobile-hide icon (eye-slash or similar from heroicons)
- Button should toggle item.hideOnMobile between true and undefined
- Visual indicator: button should appear highlighted/active when hideOnMobile === true
- Only show button when canEdit() returns true
- Test: Click button and verify property toggles in the item object
- Demo: Users can click the button to toggle mobile visibility; button state reflects current setting

Task 4: Add visual indicator for hidden-on-mobile cards in editing mode
- Objective: Make it clear which cards are hidden on mobile while editing
- In src/lib/cards/BaseCard/BaseEditingCard.svelte, add a small badge/indicator when item.hideOnMobile === true and isMobile() === true
- Badge should appear in a corner (e.g., top-right) with text like "Hidden on mobile" or an icon
- Use subtle styling to avoid cluttering the UI
- Test: Set hideOnMobile: true and switch to mobile viewport in editing mode
- Demo: Cards hidden on mobile show a clear visual indicator in editing mode, helping users understand which cards are affected

## Assumptions

- The hideOnMobile property defaults to undefined (falsy), meaning cards are visible by default on both mobile and desktop
- Existing cards without the hideOnMobile property will continue to display normally on mobile (backward compatibility)
- The feature only affects the public-facing website view (Website.svelte), not the editing view (EditableWebsite.svelte) - users can still see and edit cards marked as hidden while in edit mode
- The mobile breakpoint remains at 1024px (existing innerWidth < 1024 logic)
- No server-side or API changes are required; the property is stored as part of the card's data structure

## Deferred Decisions

- **Bulk operations**: No UI for hiding/showing multiple cards at once - users must toggle each card individually
- **Desktop hide option**: No corresponding "hide on desktop" feature - only mobile hiding is implemented per requirements
- **Animation/transitions**: No special animations when cards appear/disappear based on viewport changes - relies on existing layout transitions
- **Undo/redo**: No special handling for undo/redo of hide/show actions - relies on existing state management
- **Analytics/tracking**: No tracking of which cards are commonly hidden or usage patterns of this feature
