-- Add split_type column to groups table
-- 'equal' = divide equally among participants
-- 'percentage' = divide by percentage defined for each participant

ALTER TABLE public.groups 
ADD COLUMN split_type text NOT NULL DEFAULT 'equal';

-- Add comment explaining the column
COMMENT ON COLUMN public.groups.split_type IS 'Type of expense splitting: equal or percentage';