# Prompt — Neo-Brutalist Design System

## Context

The current design needs to be replaced entirely. We are switching to a neo-brutalist design system. This affects every component, page, and layout in the app.

---

## Neo-Brutalist Design Rules

### Core Aesthetic
- Raw, bold, unapologetic
- High contrast — black and white as the base
- Thick solid borders (2px to 4px solid black)
- Hard drop shadows — offset box shadows, no blur (e.g. `4px 4px 0px #000` or `6px 6px 0px #000`)
- No rounded corners — `border-radius: 0` everywhere
- No gradients
- No soft shadows
- No frosted glass
- No subtle anything

### Typography
- Use `font-family: 'Space Grotesk', monospace` for UI elements and labels
- Use `font-family: 'Space Mono', monospace` for numbers, times, durations
- Both available via Google Fonts — add to `layout.tsx`
- Bold weights everywhere — minimum `font-weight: 700` for headings
- Large type — don't be shy with font sizes
- All caps for labels and nav items

### Color Palette
- Background: `#FFFFFF` (white)
- Foreground / borders / text: `#000000` (black)
- Primary accent: `#FFFF00` (yellow) — used for active states, highlights, the running timer
- Secondary accent: `#FF3B00` (red-orange) — used for destructive actions, alerts, errors
- Tertiary accent: `#0000FF` (blue) — used for links, info states
- Success: `#00FF00` (green) — used for synced, saved, confirmed states
- All accent colors paired with black borders and black text

### Components

**Buttons**
- Solid black border 3px
- Hard shadow: `4px 4px 0px #000`
- On hover: shadow becomes `2px 2px 0px #000`, translate `2px 2px` (moves into shadow)
- On active/press: shadow `0px 0px 0px #000`, translate `4px 4px`
- Background: white default, yellow for primary CTA, red-orange for destructive

**Cards / Panels**
- Solid black border 3px
- Hard shadow: `6px 6px 0px #000`
- White background
- No border radius

**Inputs**
- Solid black border 3px
- No border radius
- Black text on white background
- On focus: yellow background `#FFFF00`
- No box shadow on focus — border stays black

**Timer Display**
- Massive type — at least `text-6xl` or larger
- `Space Mono` font
- When running: yellow background `#FFFF00`, black border, black text
- When stopped: white background, black border, black text

**Navigation**
- Full width black bar
- White text, all caps, `Space Grotesk`
- Active page: yellow background on nav item
- No icons — text only unless icon is absolutely necessary

**Stats Cards**
- Black border 3px, hard shadow
- Large bold number in `Space Mono`
- Small all-caps label in `Space Grotesk`

**Calendar**
- Grid with thick black borders between cells
- Active day: yellow background
- Days with sessions: black dot or filled cell indicator
- Today: black background, white text
- Future days: gray text `#999`, not selectable

**Offline Indicator**
- Full width banner at top
- Red-orange background `#FF3B00`
- Black text, bold, all caps: "OFFLINE — SESSIONS SAVING LOCALLY"
- Black border bottom 3px

**Sync Indicator**
- Green background `#00FF00` when synced
- Yellow `#FFFF00` when syncing
- Black text, bold, all caps

---

## Tasks

### 1. Create `/lib/design/tokens.ts`

Export a design tokens object with all colors, border widths, shadow values, and font families as TypeScript constants. Every component must import from here — no hardcoded color values in components.

### 2. Update `tailwind.config.ts`

Extend the Tailwind config to include:
- Custom colors from the design tokens (brutalist-yellow, brutalist-red, brutalist-blue, brutalist-green)
- Custom box shadow utilities: `shadow-brutal-sm` (4px 4px 0px #000), `shadow-brutal` (6px 6px 0px #000), `shadow-brutal-lg` (8px 8px 0px #000)
- Custom font families: `font-grotesk` and `font-mono-brutal`
- Border radius set to 0 as the default

### 3. Update `app/globals.css`

- Import Space Grotesk and Space Mono from Google Fonts
- Set base styles: white background, black text, border-radius 0, Space Grotesk as default font
- Add global button reset styles
- Add the brutalist hover/active transition for buttons as a CSS class `.btn-brutal`

### 4. Rebuild every component with the new design system

Go through every component in `/components` and every page in `/app` and apply the neo-brutalist design system. Do not leave any component with the old design.

Components to update:
- `TimerButton.tsx` — this is the most important one, make it bold and punchy
- `ActiveTimer.tsx` — massive monospace time display, yellow when running
- `SessionList.tsx` and `SessionItem.tsx`
- `CalendarGrid.tsx`, `CalendarDay.tsx`, `DayDetail.tsx`
- `StatsCard.tsx`, `HoursChart.tsx`, `PayPeriodSelector.tsx`
- `ExportForm.tsx`, `DateRangePicker.tsx`
- `UserList.tsx`, `UserRow.tsx`, `InviteForm.tsx`
- `SettingsForm.tsx`
- `LoadingSpinner.tsx` — replace with a bold blinking cursor or pulsing block, no spinners
- `ErrorMessage.tsx` — red-orange background, black border, bold text
- `EmptyState.tsx` — bold message, large type
- `OfflineIndicator.tsx` — red-orange banner
- `SyncIndicator.tsx` — green/yellow banner
- `NavBar.tsx` — black bar, white all-caps text

### 5. Update `/plan/plan.md`

Append under `## Progress Log`:
- Date and note that design system was replaced with neo-brutalist theme
- List all components updated

Append under a new section `## Design System`:
- Document the full color palette with hex values
- Document the shadow utilities
- Document the font choices and where they are imported
- Document the button interaction pattern (hover/active shadow shift)

---

## Quality Rules

- Every component must look intentional and bold — if it looks timid it is wrong
- The running timer must be the most visually dominant element on screen
- Mobile first — all components must work on a 390px wide screen
- No leftover styles from the old design
- Playwright tests must still pass after the redesign — do not break functionality

---

## Do Not

- Do not change any logic, API routes, or database code
- Do not push to git
- Do not deploy
- Do not remove or skip any Playwright tests
