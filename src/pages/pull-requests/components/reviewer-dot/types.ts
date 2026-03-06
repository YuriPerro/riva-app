import type { ReviewVote } from "../../use-pull-requests";

export interface ReviewerDotProps {
  reviewer: {
    displayName: string;
    initials: string;
    vote: ReviewVote;
    isRequired: boolean;
  };
}

export interface VoteConfig {
  icon: React.ElementType;
  className: string;
  title: string;
}

export type VoteConfigMap = Record<ReviewVote, VoteConfig>;
