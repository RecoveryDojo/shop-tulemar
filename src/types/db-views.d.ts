export type OrderItemView = {
  id: string
  order_id: string
  sku: string | null
  product_id: string | null
  name: string | null
  qty: number | null
  quantity: number | null
  qty_picked: number | null
  found_quantity: number | null
  notes: string | null
  shopper_notes: string | null
  created_at: string
  unit_price: number | null
  total_price: number | null
  shopping_status: string | null
  photo_url: string | null
  substitution_data: Record<string, unknown> | null
  products: Record<string, unknown> | null
  product_name: string | null
  product_unit: string | null
  product_category_id: string | null
  product_price: number | null
}

export type OrderEventView = {
  id: string
  order_id: string
  event_type: string
  actor_role: string
  data: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  created_at: string
}