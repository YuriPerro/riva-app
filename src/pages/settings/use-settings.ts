import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { credentials, session } from "@/lib/tauri";

export function useSettings() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await session.clear();
      await credentials.clear();
      localStorage.removeItem("forge_project");
      localStorage.removeItem("forge_team");
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
