# FRANCHISE OS — UX/UI audit

## Product principle

FRANCHISE OS is not a reporting dashboard. It is an operating cockpit for three very different users:

- Owner: decisions, capital, profitability, expansion.
- Manager: daily operations, team, schedules, checklists, requests.
- Master: personal schedule, clients, revenue, accrued pay, checklists and requests.

Every screen should answer one of three questions:

1. What matters now?
2. What action should I take?
3. What changed after I took it?

## Main findings

### 1. Navigation was too flat
The owner had too many items in two broad groups. Finance, staff operations and expansion competed for attention.

Implemented:
- Overview
- Finance
- Team
- Growth
- System

Role-based visibility remains enforced.

### 2. Analytics appeared before actions
The first screen emphasized charts before operational exceptions.

Implemented:
- Owner attention center before charts.
- Manager daily work center.
- Master “Today” block.
- Requests, incomplete checklists, upcoming payments and alerts surface before deep analytics.

### 3. Role preview was confusing
A general role selector looked like an account switcher.

Implemented:
- “Preview” is owner-only.
- Preview banner clearly states whose interface is being viewed.
- One-tap return to owner mode.

### 4. Mobile navigation needed clearer priorities
Owner mobile navigation contained secondary items and the drawer had no modal behavior.

Implemented:
- Owner bottom nav: Home, Locations, Plan vs actual, P&L, More.
- Manager bottom nav follows daily operations.
- Master bottom nav contains only Home, Checklists and Requests.
- Drawer backdrop, scroll lock and Escape close behavior.

### 5. Dense text was too small
Many secondary labels were 7–9 px, especially in operational modules.

Implemented:
- Raised readability floor.
- Larger KPI labels and secondary text.
- 16 px form controls on mobile to avoid iOS zoom.
- Stronger information hierarchy between label, value and helper text.

### 6. Staff management would not scale
A long employee table becomes slow to scan as the network grows.

Implemented:
- Search by employee/role/service.
- Location filters.
- Result count.

### 7. Forms lacked consistent interaction emphasis
Inputs looked similar regardless of importance.

Implemented:
- Branded field containers.
- Stronger focus states.
- Grouped number formatting.
- Ruble/percent suffixes.
- Numeric mobile keyboard.
- Clear helper text.

### 8. Employee modes needed a simpler mental model
Master and manager screens should not feel like reduced owner dashboards.

Implemented:
- Separate role home experiences.
- Manager focuses on shifts, readiness, requests and team.
- Master focuses on schedule, personal figures, checklists and requests.
- Owner finance is not surfaced in employee modes.

## Design rules going forward

- Put actions and exceptions above charts.
- Do not show a metric if the role cannot act on it.
- Maximum five primary destinations on mobile.
- Secondary actions belong inside the relevant screen, not in global navigation.
- Avoid horizontal tables on mobile for high-frequency workflows; prefer cards/lists when those screens are next redesigned.
- Use red for attention/action, not decoration everywhere.
- Green means completed/healthy, amber means attention, red means urgent/risk.
- Every destructive action needs clear separation from primary actions.
- Do not use text below 9 px; operational descriptions should normally be 10–12 px.
- Tap targets should be approximately 40–44 px minimum.
- Owner preview must never be confused with real employee authentication.
- Real multi-user access must be enforced by backend/RLS, not only hidden UI.

## Next UX priorities

1. Convert the widest mobile tables (staff, plan/fact, access, finance) into responsive card/list views.
2. Add toast feedback for save/update/send actions.
3. Add persistent backend sync status once Supabase is connected.
4. Add a unified search / command menu after the platform contains enough real data to justify it.
5. Validate the final design on real iPhone sizes after backend integration.
