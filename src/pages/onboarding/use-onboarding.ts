import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { credentials, session } from "@/lib/tauri";
import { onboardingSchema, type OnboardingFormValues } from "./types";

export const useOnboarding = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationUrl: "https://dev.azure.com/levesaude",
      personalAccessToken: "",
    },
  });

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsConnecting(true);
    try {
      // 1. Validate against Azure API
      await session.validate(values.organizationUrl, values.personalAccessToken);
      // 2. Persist credentials to disk
      await credentials.save(values.organizationUrl, values.personalAccessToken);
      // 3. Hydrate Rust session
      await session.init(values.organizationUrl, values.personalAccessToken);
      // 4. Navigate to project selection
      navigate("/project-select", { replace: true });
    } catch (err) {
      toast.error(
        typeof err === "string" ? err : "Failed to connect. Check your URL and PAT."
      );
      setIsConnecting(false);
    }
  };

  return {
    form,
    isConnecting,
    showToken,
    toggleShowToken: () => setShowToken((prev) => !prev),
    onSubmit: form.handleSubmit(onSubmit),
  };
};
