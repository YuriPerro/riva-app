import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { credentials, session } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";

export function useSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clear);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await session.clear();
      await credentials.clear();
      clearSession();
      queryClient.clear();
      navigate("/onboarding", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isSigningOut,
    handleSignOut,
  };
}
