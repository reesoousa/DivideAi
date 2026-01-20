-- Create app_role enum for group membership
CREATE TYPE public.group_role AS ENUM ('admin', 'member');

-- Create group_members table to track who has access to which groups
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role public.group_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (group_id, user_id)
);

-- Create group_invites table for invite links
CREATE TABLE public.group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on new tables
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is a member of a group
CREATE OR REPLACE FUNCTION public.user_is_group_member(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
      AND user_id = auth.uid()
  )
$$;

-- Create function to check if user is admin of a group
CREATE OR REPLACE FUNCTION public.user_is_group_admin(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
      AND user_id = auth.uid()
  )
$$;

-- RLS policies for group_members
CREATE POLICY "Users can view members of groups they belong to"
ON public.group_members
FOR SELECT
USING (user_is_group_member(group_id));

CREATE POLICY "Group admins can add members"
ON public.group_members
FOR INSERT
WITH CHECK (user_is_group_admin(group_id));

CREATE POLICY "Group admins can update member roles"
ON public.group_members
FOR UPDATE
USING (user_is_group_admin(group_id));

CREATE POLICY "Group admins can remove members"
ON public.group_members
FOR DELETE
USING (user_is_group_admin(group_id));

-- RLS policies for group_invites
CREATE POLICY "Group admins can view invites"
ON public.group_invites
FOR SELECT
USING (user_is_group_admin(group_id));

CREATE POLICY "Group admins can create invites"
ON public.group_invites
FOR INSERT
WITH CHECK (user_is_group_admin(group_id));

CREATE POLICY "Group admins can update invites"
ON public.group_invites
FOR UPDATE
USING (user_is_group_admin(group_id));

CREATE POLICY "Group admins can delete invites"
ON public.group_invites
FOR DELETE
USING (user_is_group_admin(group_id));

-- Update existing RLS policies to use new membership function
-- Drop existing restrictive policies and recreate with permissive ones

-- Groups table - owners OR members can view
DROP POLICY IF EXISTS "Users can view their own groups" ON public.groups;
CREATE POLICY "Users can view groups they own or are members of"
ON public.groups
FOR SELECT
USING (auth.uid() = user_id OR user_is_group_member(id));

-- Only owners can update/delete groups
DROP POLICY IF EXISTS "Users can update their own groups" ON public.groups;
CREATE POLICY "Group owners can update their groups"
ON public.groups
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own groups" ON public.groups;
CREATE POLICY "Group owners can delete their groups"
ON public.groups
FOR DELETE
USING (auth.uid() = user_id);

-- Update expenses policies to include group members
DROP POLICY IF EXISTS "Users can view expenses of their groups" ON public.expenses;
CREATE POLICY "Users can view expenses of their groups"
ON public.expenses
FOR SELECT
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can create expenses in their groups" ON public.expenses;
CREATE POLICY "Users can create expenses in their groups"
ON public.expenses
FOR INSERT
WITH CHECK (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can update expenses in their groups" ON public.expenses;
CREATE POLICY "Users can update expenses in their groups"
ON public.expenses
FOR UPDATE
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can delete expenses from their groups" ON public.expenses;
CREATE POLICY "Users can delete expenses from their groups"
ON public.expenses
FOR DELETE
USING (user_is_group_member(group_id));

-- Update participants policies
DROP POLICY IF EXISTS "Users can view participants of their groups" ON public.participants;
CREATE POLICY "Users can view participants of their groups"
ON public.participants
FOR SELECT
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can create participants in their groups" ON public.participants;
CREATE POLICY "Users can create participants in their groups"
ON public.participants
FOR INSERT
WITH CHECK (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can update participants in their groups" ON public.participants;
CREATE POLICY "Users can update participants in their groups"
ON public.participants
FOR UPDATE
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can delete participants from their groups" ON public.participants;
CREATE POLICY "Users can delete participants from their groups"
ON public.participants
FOR DELETE
USING (user_is_group_member(group_id));

-- Update payments policies
DROP POLICY IF EXISTS "Users can view payments of their groups" ON public.payments;
CREATE POLICY "Users can view payments of their groups"
ON public.payments
FOR SELECT
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can create payments in their groups" ON public.payments;
CREATE POLICY "Users can create payments in their groups"
ON public.payments
FOR INSERT
WITH CHECK (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can update payments in their groups" ON public.payments;
CREATE POLICY "Users can update payments in their groups"
ON public.payments
FOR UPDATE
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can delete payments from their groups" ON public.payments;
CREATE POLICY "Users can delete payments from their groups"
ON public.payments
FOR DELETE
USING (user_is_group_member(group_id));

-- Update recurring_items policies
DROP POLICY IF EXISTS "Users can view recurring_items of their groups" ON public.recurring_items;
CREATE POLICY "Users can view recurring_items of their groups"
ON public.recurring_items
FOR SELECT
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can create recurring_items in their groups" ON public.recurring_items;
CREATE POLICY "Users can create recurring_items in their groups"
ON public.recurring_items
FOR INSERT
WITH CHECK (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can update recurring_items in their groups" ON public.recurring_items;
CREATE POLICY "Users can update recurring_items in their groups"
ON public.recurring_items
FOR UPDATE
USING (user_is_group_member(group_id));

DROP POLICY IF EXISTS "Users can delete recurring_items from their groups" ON public.recurring_items;
CREATE POLICY "Users can delete recurring_items from their groups"
ON public.recurring_items
FOR DELETE
USING (user_is_group_member(group_id));

-- Update pix_keys policies to use new function
CREATE OR REPLACE FUNCTION public.user_owns_participant(participant_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.participants p
    JOIN public.groups g ON p.group_id = g.id
    WHERE p.id = participant_id
      AND (g.user_id = auth.uid() OR user_is_group_member(g.id))
  )
$$;

-- Create index for faster lookups
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_invites_code ON public.group_invites(invite_code);
CREATE INDEX idx_group_invites_group_id ON public.group_invites(group_id);