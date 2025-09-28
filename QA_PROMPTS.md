# QA & Fix Prompts for Lovable (Shop Tulemar App)

> Copy each prompt into Lovable one at a time, in order. Each item is self‑contained and results in concrete code diffs or SQL patches.

---

## 0) Repository sanity & environment
**Prompt:**  
“Scan the repo and replace hardcoded Supabase credentials with environment variables compatible with Vite. Move `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env` using `VITE_` prefix (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Update `src/integrations/supabase/client.ts` to read from `import.meta.env`. Add a sample `.env.example`. Ensure no secrets are committed. Output: updated client file, new `.env.example`, and a grep result proving no keys remain in code.”

---

## 1) Auth & role bootstrap
**Prompt:**  
“Open `src/contexts/AuthContext.tsx`. Ensure session bootstrap on page load restores user, fetches profile and roles with a single function (`fetchCurrentUserContext`) that: (a) calls `supabase.auth.getSession()`, (b) loads `profiles` row, (c) loads roles from `user_roles`, and (d) gracefully defaults to `['client']` on error. Add `useEffect` with proper unsubscribe for `supabase.auth.onAuthStateChange`. Export helpers: `hasRole(role)`, `isAdmin()`, `hasCompletedOnboarding()`. Add loading guards and remove any ellipses/unfinished blocks.”

---

## 2) Central Realtime manager hardening
**Prompt:**  
“Refactor `src/utils/realtimeConnectionManager.ts` into a resilient singleton. Requirements:  
- Per‑order channel naming (`order-{id}-orders`, `order-{id}-items`, `order-{id}-events`).  
- Idempotent `subscribe(config)` that no‑ops if already subscribed with identical config.  
- Auto‑reconnect with exponential backoff capped at 30s; on reconnect, emit a `onReconnect` callback to caller.  
- Accurate `unsubscribe(channelName)` that removes all handlers and truly closes the channel.  
- `getChannelStatus(name)` returns 'subscribed' | 'pending' | 'disconnected'.  
- Add memory‑leak test utility to list live channels when `?debug=1`.”

---

## 3) Order realtime hook correctness
**Prompt:**  
“In `src/hooks/useOrderRealtime.ts`, finish implementation so that:  
- On mount or when `orderId` changes, `unsubscribe` old channels then `subscribe` to the three per‑order channels.  
- Wire `on` handlers for: table `orders` (UPDATE), table `order_items` (INSERT/UPDATE/DELETE), and table `order_events` (INSERT).  
- Debounce UI updates to 50ms to avoid thrash.  
- On reconnect, request a server snapshot and emit a local `snapshot_reconciled` event.”

---

## 4) OrderEventBus source of truth
**Prompt:**  
“Complete `src/lib/orderEventBus.ts` so it becomes the single source of truth for order timelines. Implement:  
- `subscribe(orderId, handler)` and `unsubscribe(orderId, handler)`; ensure no duplicate handlers.  
- `publish(event)` client‑side only for optimistic UI; server writes must be done via RPC/insert.  
- `fetchSnapshot(orderId)` that returns `{ order, items, events }` with all necessary joins.  
- Emit a synthetic `snapshot_reconciled` after `fetchSnapshot` so dashboards refresh.”

---

## 5) Database schema, indexes, and triggers
**Prompt:**  
“Create/verify SQL migrations for:  
- Tables: `orders`, `order_items`, `order_events`.  
- Enum `order_status` (PLACED, CLAIMED, SHOPPING, READY, DELIVERED, CLOSED, CANCELED).  
- Indexes: `order_events(order_id, created_at)`, `order_items(order_id)`.  
- Trigger: on `orders.status` UPDATE insert corresponding row into `order_events` with `event_type = 'STATUS_CHANGED'` and payload `{from,to}`.  
- Optional trigger: on `order_items` INSERT/UPDATE/DELETE insert event (`ITEM_ADDED`, `ITEM_UPDATED`, `ITEM_REMOVED`).  
Output: a single migration with `DO $$ BEGIN ... END $$;` guards to be idempotent for dev.”

---

## 6) Row Level Security (RLS) by role
**Prompt:**  
“Write RLS policies for `orders`, `order_items`, `order_events` such that:  
- `client` can read their own orders only; write limited to creating orders and updating `notes` until CLAIMED.  
- `concierge` can read all orders in assigned property scope (use `orders.property_id` and a join table `team_properties`).  
- `shopper` can read orders they are assigned to via `orders.shopper_id = auth.uid()`.  
- `admin/sysadmin` can read/write all.  
Implement a `current_user_roles()` function returning text[]. Provide `USING` and `WITH CHECK` conditions. Include tests in SQL comments.”

---

## 7) Role-based dashboards routing
**Prompt:**  
“Finalize `src/components/workflow/RoleBasedDashboard.tsx` to switch between Customer, Concierge, Shopper, Admin, Driver, Store Manager dashboards based on roles from `AuthContext`. Add safe fallbacks and a message if no recognized role is present. Ensure each dashboard receives `{ user, roles }` props.”

---

## 8) Shopper dashboard: event‑driven updates
**Prompt:**  
“Finish `src/components/workflow/CleanShopperDashboard.tsx` so that it:  
- Subscribes via `useShopperOrders` and `useOrderRealtime` for each open order.  
- Handles `STATUS_CHANGED`, `ITEM_*`, and `snapshot_reconciled` with toasts and `refetchOrders()`.  
- Prevents double fetches; consolidate to a single `refetchOrders` with a request‑in‑flight guard.”

---

## 9) Concierge dashboard: assignment workflow
**Prompt:**  
“In `src/components/workflow/ConciergeDashboard.tsx`, implement:  
- List of unassigned orders; assign a shopper; notify via `order_events` (`ASSIGNED_TO_SHOPPER`).  
- Approval UI for substitutions using `SubstitutionApprovalPanel`.  
- A timeline viewer rendering `order_events` with relative time.”

---

## 10) Admin oversight tools
**Prompt:**  
“Complete admin tools:  
- `AdminImpersonation.tsx` and `ImpersonationBanner.tsx` with guardrails (admin only, clearly visible).  
- `OrderNotificationSystem` unified with `EnhancedOrderNotificationSystem`; remove duplicates.  
- `StaffAssignmentTool` to view workload per shopper with simple stats.”

---

## 11) Debug panel (`?debug=1`)
**Prompt:**  
“Create `src/components/workflow/DebugPanel.tsx` rendered only when `?debug=1`. Buttons:  
- Seed sample order,  
- Simulate each status transition server‑side,  
- Replay `order_events` timeline,  
- Show live channel list from realtime manager,  
- Force reconnect.  
Add a small overlay showing channel count and last event time.”

---

## 12) Notifications & toasts
**Prompt:**  
“Unify all toasts to use `src/hooks/use-toast.ts`. Replace console logs in dashboards with toasts on key actions; add error surfaces with actionable messages. Output: diff for each file changed.”

---

## 13) Performance safeguards
**Prompt:**  
“Add batching and throttling where lists can get large: virtualize long lists of orders/items, memoize derived state, and ensure event handlers are stable (useCallback). Add a `useIsMounted` hook to prevent state updates on unmounted components.”

---

## 14) Playwright E2E (smoke across roles)
**Prompt:**  
“Add Playwright with tests for:  
1) Client creates order and sees realtime status.  
2) Concierge assigns shopper.  
3) Shopper updates items and marks READY.  
4) Admin sees full timeline and closes order.  
Seed data via fixtures; add `data-testid` attributes where needed. Provide `npx playwright test` script and CI config.”

---

## 15) CI lint & type strictness
**Prompt:**  
“Enable strict TypeScript in `tsconfig.json` (`strict`, `noImplicitAny`, `exactOptionalPropertyTypes`). Fix resulting errors. Add ESLint rules for React hooks and unused vars. Provide a single PR with these fixes.”

---

## 16) Observability (dev-only)
**Prompt:**  
“Add a tiny client logger that mirrors `order_events` to the console when `?debug=1`, including latency between events and resubscribe counts.”

---

## 17) Security quick sweep
**Prompt:**  
“Run a security sweep: verify no keys are committed; ensure uploads/storage use signed URLs; check RLS prevents cross‑tenant data leakage. Output: list of checks and their results; fix diffs where necessary.”

