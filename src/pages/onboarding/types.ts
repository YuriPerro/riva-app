import { z } from 'zod';

export const onboardingSchema = z.object({
  organizationUrl: z
    .string()
    .min(1, 'Organization URL is required')
    .url('Enter a valid URL')
    .refine(
      (val) => val.includes('dev.azure.com') || val.includes('visualstudio.com'),
      'Must be a valid Azure DevOps URL',
    ),
  personalAccessToken: z
    .string()
    .min(1, 'Personal Access Token is required')
    .min(52, 'PAT looks too short — check if it was copied correctly'),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
