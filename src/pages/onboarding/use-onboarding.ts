import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { onboardingSchema, type OnboardingFormValues } from "./types";

export const useOnboarding = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationUrl: "",
      personalAccessToken: "",
    },
  });

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsConnecting(true);
    try {
      console.log("Connecting with:", values.organizationUrl);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate("/");
    } finally {
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
