-- Add concierge_checklist table for stocking workflow tracking
CREATE TABLE IF NOT EXISTS public.concierge_checklist (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  arrived_at_property boolean DEFAULT false NOT NULL,
  pantry_stocked boolean DEFAULT false NOT NULL,
  fridge_stocked boolean DEFAULT false NOT NULL,
  freezer_stocked boolean DEFAULT false NOT NULL,
  photo_url text,
  notes text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.concierge_checklist ENABLE ROW LEVEL SECURITY;

-- Policy: Concierge can read/write checklist for their assigned orders
CREATE POLICY "Concierges can manage their assigned order checklists"
ON public.concierge_checklist
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = concierge_checklist.order_id
    AND o.assigned_concierge_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = concierge_checklist.order_id
    AND o.assigned_concierge_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_concierge_checklist_order_id ON public.concierge_checklist(order_id);