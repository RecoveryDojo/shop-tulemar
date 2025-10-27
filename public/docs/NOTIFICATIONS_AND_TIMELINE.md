# Notifications and Timeline System

## Overview

The notifications and timeline system provides real-time updates for order events across customer and staff interfaces with consistent messaging and event handling.

## Event Types and Messages

| Event Type | Customer Visible | Message Format |
|------------|------------------|----------------|
| `STATUS_CHANGED` | ✅ | Order moved from {from} → {to} |
| `ASSIGNED` | ✅ | A personal shopper has been assigned to your order |
| `STOCKING_STARTED` | ✅ | Your groceries are being stocked in your unit |
| `STOCKED_IN_UNIT` | ✅ | Your groceries have been delivered and stocked! |
| `ITEM_UPDATED` | ✅ (if qty_picked) | {name} updated (picked {qty_picked}/{qty}) |
| `ITEM_ADDED` | ❌ | {name} added to order |
| `ITEM_REMOVED` | ❌ | {name} removed from order |
| `SUBSTITUTION_SUGGESTED` | ❌ | Substitution suggested for {name} |
| `SUBSTITUTION_DECISION` | ❌ | Substitution {decision} for {name} |

## Usage

### Triggering Notifications

```typescript
import { notify } from '@/lib/notifications';
import { orderEventBus } from '@/lib/orderEventBus';

// When an order event occurs
const event = {
  id: 'event-id',
  order_id: 'order-id',
  event_type: 'STATUS_CHANGED',
  actor_role: 'shopper',
  data: { from: 'SHOPPING', to: 'READY' },
  created_at: new Date().toISOString()
};

// Publish to event bus (triggers real-time UI updates)
orderEventBus.publish(event);

// Send notifications (toasts for staff, emails for customers)
await notify(event, { order: orderData });
```

### Event Message Formatting

```typescript
import { getEventMessage, getEventIcon, isCustomerVisible } from '@/lib/notifications';

const message = getEventMessage('STATUS_CHANGED', { from: 'SHOPPING', to: 'READY' });
const icon = getEventIcon('STATUS_CHANGED');
const customerVisible = isCustomerVisible('STATUS_CHANGED', data);
```

## Components

### Customer Timeline (`src/pages/shop/OrderTrack.tsx`)
- Vertical timeline grouped by day
- Real-time updates via OrderEventBus
- Relative time display with absolute timestamp on hover
- Automatic snapshot reconciliation on reconnect

### Staff Timeline (`src/components/admin/EnhancedOrderNotificationSystem.tsx`)
- Same timeline with additional internal events
- Filter chips: All, Customer-visible, Internal
- Event badge indicators for visibility status

### Notifications Library (`src/lib/notifications.ts`)
- Central event message formatting
- Customer visibility rules
- Toast notifications for staff
- Email notification triggers

## Edge Function

The `create-notification` edge function handles:
- Order event notifications
- Email dispatch for customer-visible events
- Database persistence
- Legacy message notification support

## Integration Points

1. **OrderEventBus**: Real-time event publishing and subscription
2. **useEnhancedOrderWorkflow**: Publishes events on successful mutations
3. **Customer OrderTrack**: Subscribes to events and renders timeline
4. **Admin Dashboard**: Shows staff timeline with filtering
5. **Edge Function**: Handles notification delivery and persistence