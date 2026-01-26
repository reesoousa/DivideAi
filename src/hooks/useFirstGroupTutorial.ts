import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFirstGroupTutorial() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean | null>(null);

  // Check if user has seen the tutorial
  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) {
        setHasSeenTutorial(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("has_seen_first_group_tutorial")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking tutorial status:", error);
          setHasSeenTutorial(true); // Default to true on error to avoid showing
          return;
        }

        setHasSeenTutorial(data?.has_seen_first_group_tutorial ?? false);
      } catch (error) {
        console.error("Error checking tutorial status:", error);
        setHasSeenTutorial(true);
      }
    };

    checkTutorialStatus();
  }, [user]);

  // Trigger the tutorial after first group creation
  const triggerTutorial = useCallback(() => {
    if (hasSeenTutorial === false) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  }, []);

  return {
    showTutorial,
    hasSeenTutorial,
    triggerTutorial,
    closeTutorial,
  };
}
