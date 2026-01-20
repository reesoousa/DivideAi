-- Add DELETE policy for profiles table to allow the edge function to delete profiles
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);