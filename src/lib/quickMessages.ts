/**
 * Pre-planned Quick Messages for Order Communication
 * 
 * These templates enable fast, standardized communication between
 * customers, shoppers, concierges, and admins.
 */

export interface QuickMessage {
  id: string;
  category: 'greeting' | 'status' | 'substitution' | 'issue' | 'delivery' | 'confirmation';
  text: string;
  roles: Array<'customer' | 'shopper' | 'concierge' | 'admin'>;
}

export const QUICK_MESSAGES: QuickMessage[] = [
  // Customer Messages
  {
    id: 'customer-greeting',
    category: 'greeting',
    text: 'Hi! Thanks for shopping for me today.',
    roles: ['customer']
  },
  {
    id: 'customer-substitution-approve',
    category: 'substitution',
    text: 'That substitution looks good, please proceed!',
    roles: ['customer']
  },
  {
    id: 'customer-substitution-reject',
    category: 'substitution',
    text: 'Please skip that item, no substitution needed.',
    roles: ['customer']
  },
  {
    id: 'customer-question-location',
    category: 'issue',
    text: 'Can you find [item name]? It might be in a different section.',
    roles: ['customer']
  },
  {
    id: 'customer-delivery-ready',
    category: 'delivery',
    text: 'I\'m ready to receive the delivery. Please call when you arrive.',
    roles: ['customer']
  },
  {
    id: 'customer-delivery-delay',
    category: 'delivery',
    text: 'I need to delay delivery by 30 minutes. Is that okay?',
    roles: ['customer']
  },
  {
    id: 'customer-thanks',
    category: 'confirmation',
    text: 'Thank you! Everything looks great.',
    roles: ['customer']
  },

  // Shopper Messages
  {
    id: 'shopper-greeting',
    category: 'greeting',
    text: 'Hi! I\'m starting your order now. I\'ll keep you updated!',
    roles: ['shopper']
  },
  {
    id: 'shopper-item-found',
    category: 'status',
    text: 'Found your [item name] - looks perfect!',
    roles: ['shopper']
  },
  {
    id: 'shopper-substitution-request',
    category: 'substitution',
    text: '[Original item] is out of stock. I found [alternative] for $[price]. Approve?',
    roles: ['shopper']
  },
  {
    id: 'shopper-item-unavailable',
    category: 'issue',
    text: 'Unfortunately [item name] is completely out of stock. Skip or substitute?',
    roles: ['shopper']
  },
  {
    id: 'shopper-quality-check',
    category: 'status',
    text: 'Checking produce quality for your order. All items look fresh!',
    roles: ['shopper']
  },
  {
    id: 'shopper-checkout-starting',
    category: 'status',
    text: 'All items collected! Heading to checkout now.',
    roles: ['shopper']
  },
  {
    id: 'shopper-ready-handoff',
    category: 'delivery',
    text: 'Order is packed and ready for delivery!',
    roles: ['shopper']
  },

  // Concierge Messages
  {
    id: 'concierge-received',
    category: 'status',
    text: 'Order received at property. Starting stocking process.',
    roles: ['concierge']
  },
  {
    id: 'concierge-fridge-done',
    category: 'status',
    text: 'Refrigerated items are stocked and organized.',
    roles: ['concierge']
  },
  {
    id: 'concierge-pantry-done',
    category: 'status',
    text: 'Pantry items are stocked and organized.',
    roles: ['concierge']
  },
  {
    id: 'concierge-complete',
    category: 'confirmation',
    text: 'Everything is stocked! Your property is ready for your arrival.',
    roles: ['concierge']
  },
  {
    id: 'concierge-access-issue',
    category: 'issue',
    text: 'Having trouble accessing the property. Can you provide entry instructions?',
    roles: ['concierge']
  },
  {
    id: 'concierge-photo-sent',
    category: 'confirmation',
    text: 'Photo of stocked areas sent for your review.',
    roles: ['concierge']
  },

  // Admin/Support Messages
  {
    id: 'admin-investigating',
    category: 'issue',
    text: 'We\'re looking into this issue right now. Will update you shortly.',
    roles: ['admin']
  },
  {
    id: 'admin-resolved',
    category: 'confirmation',
    text: 'Issue has been resolved. Your order is back on track!',
    roles: ['admin']
  },
  {
    id: 'admin-refund-processing',
    category: 'confirmation',
    text: 'Refund for [item] is being processed. You\'ll see it in 3-5 business days.',
    roles: ['admin']
  },
  {
    id: 'admin-delay-notice',
    category: 'status',
    text: 'Due to [reason], there may be a slight delay. We\'re working to minimize it.',
    roles: ['admin']
  },
  {
    id: 'admin-thanks',
    category: 'confirmation',
    text: 'Thank you for your patience! Is there anything else we can help with?',
    roles: ['admin']
  },

  // Shared Messages
  {
    id: 'shared-question',
    category: 'issue',
    text: 'I have a quick question about your order.',
    roles: ['customer', 'shopper', 'concierge', 'admin']
  },
  {
    id: 'shared-acknowledge',
    category: 'confirmation',
    text: 'Got it, thank you!',
    roles: ['customer', 'shopper', 'concierge', 'admin']
  }
];

/**
 * Get quick messages for a specific role
 */
export function getQuickMessagesForRole(role: 'customer' | 'shopper' | 'concierge' | 'admin'): QuickMessage[] {
  return QUICK_MESSAGES.filter(msg => msg.roles.includes(role));
}

/**
 * Get quick messages by category for a role
 */
export function getQuickMessagesByCategory(
  role: 'customer' | 'shopper' | 'concierge' | 'admin',
  category: QuickMessage['category']
): QuickMessage[] {
  return QUICK_MESSAGES.filter(msg => msg.roles.includes(role) && msg.category === category);
}
