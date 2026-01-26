-- Add has_seen_first_group_tutorial column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_first_group_tutorial boolean DEFAULT false;