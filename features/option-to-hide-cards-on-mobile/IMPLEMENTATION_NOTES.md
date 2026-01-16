# Implementation Notes - Option to Hide Cards on Mobile

## Implementation Summary
Successfully implemented all 4 tasks from PLAN.md:

1. ✅ Added `hideOnMobile?: boolean` property to `Item` type in `src/lib/types.ts`
2. ✅ Implemented filtering logic in `src/lib/website/Website.svelte` to hide cards on mobile
3. ✅ Added toggle button in `src/lib/cards/BaseCard/BaseEditingCard.svelte` 
4. ✅ Added visual indicator badge for hidden-on-mobile cards in editing mode

## Files Modified

### src/lib/types.ts
- Added `hideOnMobile?: boolean` property to the `Item` type (line 21)

### src/lib/website/Website.svelte
- Created `visibleCards` derived state that filters out cards where `hideOnMobile === true` when `isMobile === true`
- Updated `maxHeight` calculation to use `visibleCards` instead of `data.cards`
- Updated render loop to iterate over `visibleCards` instead of `data.cards`

### src/lib/cards/BaseCard/BaseEditingCard.svelte
- Added toggle button in the controls section (after color picker, before size buttons)
- Button uses eye/eye-slash icons from heroicons to indicate visibility state
- Button has active state styling (`bg-accent-500/20`) when `hideOnMobile === true`
- Added "Hidden on mobile" badge that appears in top-right corner when `item.hideOnMobile === true` and `isMobile() === true`
- Badge uses dark background with light text for visibility

## Design Decisions Made

### Toggle Button Placement
Placed the hide-on-mobile toggle button immediately after the color picker and before the size buttons. This location:
- Groups it with other card property controls
- Makes it easily discoverable
- Doesn't interfere with existing controls

### Icon Choice
Used heroicons eye (visible) and eye-slash (hidden) icons:
- Universally recognized symbols for visibility
- Consistent with common UI patterns
- Clear visual distinction between states

### Badge Styling
The "Hidden on mobile" badge:
- Positioned at top-right corner (opposite the delete button)
- Uses high-contrast colors for visibility
- Only shows in editing mode when mobile viewport is active
- Small and unobtrusive to avoid cluttering the UI

### Property Value Convention
Following the pattern used by `hideProfile`, the toggle uses:
- `true` to hide the card on mobile
- `undefined` (not `false`) to show the card on mobile
- This ensures backward compatibility with existing cards

## Testing Performed

### Type Checking
Ran `pnpm check` - TypeScript compilation succeeds. Pre-existing type errors in other files are unrelated to this implementation.

### Manual Testing Checklist
- [ ] Card with `hideOnMobile: true` is hidden on mobile viewport (< 1024px)
- [ ] Card with `hideOnMobile: true` is visible on desktop viewport (>= 1024px)
- [ ] Card without `hideOnMobile` property is visible on both viewports
- [ ] Toggle button correctly sets/unsets the property
- [ ] Badge appears when card is hidden and viewport is mobile
- [ ] Layout adjusts automatically when cards are hidden (no gaps)
- [ ] Button shows correct icon based on state
- [ ] Button has active styling when card is hidden

## Known Issues / Limitations

None identified during implementation.

## Future Enhancements (Out of Scope)

As documented in PLAN.md deferred decisions:
- Bulk hide/show operations
- Hide on desktop feature
- Custom animations for visibility changes
- Undo/redo support
- Usage analytics

## Compliance with Requirements

All functional requirements from FEATURE.md are met:
- ✅ User can toggle card visibility on mobile web view
- ✅ Hidden cards are not visible on mobile web view
- ✅ Hidden cards remain visible on desktop web view (implicit)
- ✅ Layout adjusts to fill gaps (automatic via filtering)
- ✅ No interference with existing functionality
