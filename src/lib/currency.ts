/**
 * Currency formatting utilities for consistent display across the app
 */

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPrice = (price: number): string => {
  return formatCurrency(price);
};

export const calculateTax = (subtotal: number, taxRate: number = 0.13): number => {
  return subtotal * taxRate;
};

export const calculateTotal = (subtotal: number, deliveryFee: number = 5.00, taxRate: number = 0.13): number => {
  const tax = calculateTax(subtotal, taxRate);
  return subtotal + tax + deliveryFee;
};

export const TAX_RATE = 0.13; // Costa Rica IVA 13%
export const DELIVERY_FEE = 5.00;
export const FREE_DELIVERY_THRESHOLD = 50.00;

export const getDeliveryFee = (subtotal: number): number => {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
};