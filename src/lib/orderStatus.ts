/**
 * Canonical Order Status Management
 * 
 * This file defines the single source of truth for order statuses across the application.
 * All components must use these canonical statuses and display labels.
 * 
 * Canonical Status Flow:
 * placed → claimed → shopping → ready → delivered → closed (or canceled at any point)
 */

export type OrderStatus = 'placed' | 'claimed' | 'shopping' | 'ready' | 'delivered' | 'closed' | 'canceled';

/**
 * Display labels for each status (user-friendly names)
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  claimed: 'Assigned to Shopper',
  shopping: 'Shopping in Progress',
  ready: 'Ready for Delivery',
  delivered: 'Delivered',
  closed: 'Completed',
  canceled: 'Canceled',
};

/**
 * Status descriptions for detailed views
 */
export const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  placed: 'Order has been placed and is awaiting assignment',
  claimed: 'A shopper has been assigned and will start shopping soon',
  shopping: 'Shopper is currently gathering items',
  ready: 'All items collected and ready for delivery',
  delivered: 'Order has been delivered to the property',
  closed: 'Order is complete and closed',
  canceled: 'Order has been canceled',
};

/**
 * Status colors for badges and indicators
 */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-blue-100 text-blue-700 border-blue-200',
  claimed: 'bg-purple-100 text-purple-700 border-purple-200',
  shopping: 'bg-orange-100 text-orange-700 border-orange-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  canceled: 'bg-red-100 text-red-700 border-red-200',
};

/**
 * Badge variants for status display
 */
export const STATUS_BADGE_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  placed: 'outline',
  claimed: 'default',
  shopping: 'default',
  ready: 'default',
  delivered: 'default',
  closed: 'secondary',
  canceled: 'destructive',
};

/**
 * Legal status transitions (from → to)
 */
export const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['claimed', 'canceled'],
  claimed: ['shopping', 'canceled'],
  shopping: ['ready', 'canceled'],
  ready: ['delivered', 'canceled'],
  delivered: ['closed'],
  closed: [],
  canceled: [],
};

/**
 * Check if a status transition is legal
 */
export function isLegalTransition(from: OrderStatus, to: OrderStatus): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get the display label for a status
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] || status;
}

/**
 * Get the description for a status
 */
export function getStatusDescription(status: string): string {
  return STATUS_DESCRIPTIONS[status as OrderStatus] || 'Unknown status';
}

/**
 * Get the color classes for a status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as OrderStatus] || 'bg-gray-100 text-gray-700';
}

/**
 * Get the badge variant for a status
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_BADGE_VARIANTS[status as OrderStatus] || 'outline';
}

/**
 * Get all statuses that can be transitioned to from the current status
 */
export function getNextStatuses(status: string): OrderStatus[] {
  return LEGAL_TRANSITIONS[status as OrderStatus] || [];
}

/**
 * Order statuses by progression (for filtering and sorting)
 */
export const STATUS_ORDER: OrderStatus[] = ['placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed', 'canceled'];

/**
 * Get the index of a status in the progression
 */
export function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status as OrderStatus);
}

/**
 * Check if a status is before another in the progression
 */
export function isStatusBefore(status1: string, status2: string): boolean {
  const index1 = getStatusIndex(status1);
  const index2 = getStatusIndex(status2);
  return index1 !== -1 && index2 !== -1 && index1 < index2;
}

/**
 * Check if a status is after another in the progression
 */
export function isStatusAfter(status1: string, status2: string): boolean {
  const index1 = getStatusIndex(status1);
  const index2 = getStatusIndex(status2);
  return index1 !== -1 && index2 !== -1 && index1 > index2;
}
