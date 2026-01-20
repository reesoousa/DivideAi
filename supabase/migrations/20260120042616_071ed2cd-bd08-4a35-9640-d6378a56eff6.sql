-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR EXPENSE SPLITTER APP
-- =====================================================

-- 1. GROUPS TABLE
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Home',
  color TEXT NOT NULL DEFAULT 'bg-primary',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  billing_day INTEGER CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for groups
CREATE POLICY "Users can view their own groups"
  ON public.groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. PARTICIPANTS TABLE
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  participation_percentage NUMERIC DEFAULT 100,
  avatar_color TEXT DEFAULT 'bg-primary',
  avatar_type TEXT NOT NULL DEFAULT 'color' CHECK (avatar_type IN ('color', 'image')),
  avatar_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user owns the group
CREATE OR REPLACE FUNCTION public.user_owns_group(group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = group_id
      AND user_id = auth.uid()
  )
$$;

-- RLS policies for participants
CREATE POLICY "Users can view participants of their groups"
  ON public.participants FOR SELECT
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can create participants in their groups"
  ON public.participants FOR INSERT
  WITH CHECK (public.user_owns_group(group_id));

CREATE POLICY "Users can update participants in their groups"
  ON public.participants FOR UPDATE
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can delete participants from their groups"
  ON public.participants FOR DELETE
  USING (public.user_owns_group(group_id));

-- Trigger for updated_at
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. PIX KEYS TABLE
CREATE TABLE public.pix_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  key_value TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pix_keys
ALTER TABLE public.pix_keys ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user owns the participant
CREATE OR REPLACE FUNCTION public.user_owns_participant(participant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participants p
    JOIN public.groups g ON p.group_id = g.id
    WHERE p.id = participant_id
      AND g.user_id = auth.uid()
  )
$$;

-- RLS policies for pix_keys
CREATE POLICY "Users can view pix_keys of their participants"
  ON public.pix_keys FOR SELECT
  USING (public.user_owns_participant(participant_id));

CREATE POLICY "Users can create pix_keys for their participants"
  ON public.pix_keys FOR INSERT
  WITH CHECK (public.user_owns_participant(participant_id));

CREATE POLICY "Users can update pix_keys of their participants"
  ON public.pix_keys FOR UPDATE
  USING (public.user_owns_participant(participant_id));

CREATE POLICY "Users can delete pix_keys from their participants"
  ON public.pix_keys FOR DELETE
  USING (public.user_owns_participant(participant_id));

-- 4. EXPENSES TABLE
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'other',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  split_among UUID[] DEFAULT NULL, -- Array of participant IDs, NULL means split among all
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view expenses of their groups"
  ON public.expenses FOR SELECT
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can create expenses in their groups"
  ON public.expenses FOR INSERT
  WITH CHECK (public.user_owns_group(group_id));

CREATE POLICY "Users can update expenses in their groups"
  ON public.expenses FOR UPDATE
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can delete expenses from their groups"
  ON public.expenses FOR DELETE
  USING (public.user_owns_group(group_id));

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. RECURRING ITEMS TABLE
CREATE TABLE public.recurring_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'utilities',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  paid_amount NUMERIC,
  paid_by_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  due_day INTEGER CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31)),
  split_among UUID[] DEFAULT NULL, -- Array of participant IDs, NULL means split among all
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for recurring_items
ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_items
CREATE POLICY "Users can view recurring_items of their groups"
  ON public.recurring_items FOR SELECT
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can create recurring_items in their groups"
  ON public.recurring_items FOR INSERT
  WITH CHECK (public.user_owns_group(group_id));

CREATE POLICY "Users can update recurring_items in their groups"
  ON public.recurring_items FOR UPDATE
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can delete recurring_items from their groups"
  ON public.recurring_items FOR DELETE
  USING (public.user_owns_group(group_id));

-- Trigger for updated_at
CREATE TRIGGER update_recurring_items_updated_at
  BEFORE UPDATE ON public.recurring_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. PAYMENTS TABLE
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  to_participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Users can view payments of their groups"
  ON public.payments FOR SELECT
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can create payments in their groups"
  ON public.payments FOR INSERT
  WITH CHECK (public.user_owns_group(group_id));

CREATE POLICY "Users can update payments in their groups"
  ON public.payments FOR UPDATE
  USING (public.user_owns_group(group_id));

CREATE POLICY "Users can delete payments from their groups"
  ON public.payments FOR DELETE
  USING (public.user_owns_group(group_id));

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_groups_user_id ON public.groups(user_id);
CREATE INDEX idx_participants_group_id ON public.participants(group_id);
CREATE INDEX idx_pix_keys_participant_id ON public.pix_keys(participant_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expenses_paid_by_id ON public.expenses(paid_by_id);
CREATE INDEX idx_recurring_items_group_id ON public.recurring_items(group_id);
CREATE INDEX idx_recurring_items_month ON public.recurring_items(month);
CREATE INDEX idx_payments_group_id ON public.payments(group_id);