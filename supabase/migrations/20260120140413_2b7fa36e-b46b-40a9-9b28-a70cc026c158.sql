-- Add user_id column to participants table to link with authenticated users
ALTER TABLE public.participants 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_participants_user_id ON public.participants(user_id);

-- Create unique constraint to prevent duplicate user-group combinations
CREATE UNIQUE INDEX idx_participants_user_group ON public.participants(group_id, user_id) 
WHERE user_id IS NOT NULL;

-- Update RLS policy for pix_keys to also allow group members to view
DROP POLICY IF EXISTS "Users can view pix_keys of their participants" ON public.pix_keys;
CREATE POLICY "Group members can view pix_keys" 
ON public.pix_keys 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.participants p 
    WHERE p.id = pix_keys.participant_id 
    AND user_is_group_member(p.group_id)
  )
);