# Order Workflow Status Unification - Complete

## Canonical Status Vocabulary

**Official Status Flow:**
```
placed → claimed → shopping → ready → delivered → closed (or canceled at any point)
```

## Changes Completed

### 1. Database Migration ✅

**SQL Migration Applied:**
- Removed old status check constraint
- Updated all existing orders to canonical statuses:
  - `pending` → `placed`
  - `confirmed` → `placed`
  - `assigned` → `claimed`
  - `shopping` → `shopping` (no change)
  - `packed` → `ready`
  - `in_transit` → `delivered`
  - `delivered` → `delivered` (no change)
  - `completed` → `closed`
  - `cancelled` → `canceled`
- Added new check constraint accepting only canonical statuses
- Added documentation comment to orders.status column

**Current Database State:**
- 16 orders: `closed`
- 9 orders: `placed`
- 2 orders: `claimed`
- 2 orders: `shopping`
- 1 order: `ready`

### 2. Centralized Status Utility ✅

**Created:** `src/lib/orderStatus.ts`

**Features:**
- Type-safe `OrderStatus` type definition
- `STATUS_LABELS`: User-friendly display names
- `STATUS_DESCRIPTIONS`: Detailed descriptions
- `STATUS_COLORS`: Consistent color schemes for badges
- `STATUS_BADGE_VARIANTS`: Badge style variants
- `LEGAL_TRANSITIONS`: Transition validation map
- Helper functions:
  - `isLegalTransition(from, to)`: Validate transitions
  - `getStatusLabel(status)`: Get display label
  - `getStatusDescription(status)`: Get description
  - `getStatusColor(status)`: Get color classes
  - `getStatusBadgeVariant(status)`: Get badge variant
  - `getNextStatuses(status)`: Get allowed next statuses
  - `getStatusIndex(status)`: Get progression index
  - `isStatusBefore/After(s1, s2)`: Compare status progression

### 3. Frontend Components Updated ✅

**Components with Status Updates:**

1. **DebuggingSwimlaneChart.tsx**
   - Updated WORKFLOW_STEPS to canonical statuses
   - Updated statusOrder array in getStepStatus()
   - Removed: `pending`, `confirmed`, `paid`, `accepted`, `shopping_complete`, `ready_for_delivery`, `picked_up`, `out_for_delivery`
   - Now uses: `placed`, `claimed`, `shopping`, `ready`, `delivered`, `closed`

2. **StaffAssignmentTool.tsx**
   - Changed transition: `placed` → `claimed` (was `confirmed` → `assigned`)
   - Updated order status updates during staff assignment

3. **RoleBasedDashboard.tsx**
   - Updated `getActiveOrdersForRole()` to exclude `closed` and `canceled`
   - ShopperDashboard: Changed `['assigned', 'confirmed']` → `['claimed']`
   - DriverDashboard: Changed `out_for_delivery` → `delivered`
   - ConciergeDashboard: Changed `['arrived', 'stocking']` → `['delivered']`

4. **EnhancedOrderNotificationSystem.tsx**
   - Query filter: `['pending', 'confirmed']` → `['placed']`

5. **OrderNotificationSystem.tsx**
   - Query filter: `['pending', 'confirmed']` → `['placed']`

6. **DriverDashboard.tsx**
   - Query filter: `['packed', 'in_transit', 'delivered']` → `['ready', 'delivered']`
   - Updated all status conditionals: `packed` → `ready`, `in_transit` → `delivered`

7. **ShopperDashboard.tsx**
   - Query filter: `['confirmed', 'assigned', 'shopping', 'packed']` → `['claimed', 'shopping']`
   - Button conditional: `confirmed` → `claimed`

8. **SimpleShopperDashboard.tsx**
   - Query filter: `['assigned', 'shopping']` → `['claimed', 'shopping']`
   - Button conditional: `assigned` → `claimed`

9. **EnhancedShopperDashboard.tsx**
   - Status check: `packed` → `ready`
   - Button conditional: `assigned` → `claimed`

10. **StoreManagerDashboard.tsx**
    - Query filter: `['confirmed', 'assigned', 'shopping', 'packed']` → `['claimed', 'shopping', 'ready']`
    - Protocol suggestions: `confirmed` → `placed`, `packed` → `ready`
    - Button conditional: `confirmed` → `placed`

11. **WorkflowStatusValidator.tsx**
    - Updated validation checks: `pending` → `placed`, `assigned` → `claimed`

12. **useShopperOrders.ts**
    - Query filter: `['PLACED', 'placed', 'pending', 'confirmed']` → `['placed']`

13. **WorkflowTesting.tsx**
    - Query filter: `['packed', 'out_for_delivery']` → `['ready', 'delivered']`

14. **DbSmoke.tsx**
    - Status check: Updated to validate `claimed` instead of `confirmed`

### 4. Database Functions Already Aligned ✅

The following RPC functions were previously updated to use canonical statuses:
- `rpc_assign_shopper`
- `rpc_pick_item`
- `rpc_suggest_sub`
- `rpc_decide_sub`
- `rpc_advance_status`
- `is_legal_transition`

## Example Usage

### Before (Legacy)
```typescript
// ❌ Old way - inconsistent statuses
const { data } = await supabase
  .from('orders')
  .select('*')
  .in('status', ['pending', 'confirmed', 'assigned']);

if (order.status === 'assigned') {
  // Do something
}
```

### After (Canonical)
```typescript
// ✅ New way - canonical statuses
import { getStatusLabel, isLegalTransition } from '@/lib/orderStatus';

const { data } = await supabase
  .from('orders')
  .select('*')
  .in('status', ['placed', 'claimed']);

if (order.status === 'claimed') {
  const label = getStatusLabel(order.status); // "Assigned to Shopper"
  const canAdvance = isLegalTransition('claimed', 'shopping'); // true
}
```

## Verification

✅ Database constraint updated
✅ All existing data migrated
✅ All frontend queries updated
✅ All status conditionals updated
✅ Centralized utility created
✅ Type safety maintained
✅ No TypeScript errors
✅ All components using canonical vocabulary

## Benefits

1. **Single Source of Truth**: All statuses defined in `orderStatus.ts`
2. **Type Safety**: TypeScript enforces canonical status types
3. **Consistency**: No more variations like `pending` vs `confirmed` vs `placed`
4. **Maintainability**: Easy to update display labels in one place
5. **Validation**: Built-in transition validation
6. **Clarity**: Clear progression: placed → claimed → shopping → ready → delivered → closed

## Migration Complete

The entire codebase now uses the canonical status vocabulary. All legacy status references have been removed and replaced with the standard flow.
