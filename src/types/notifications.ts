export type PollingInterval = 'off' | 1 | 2 | 5 | 10 | 30;

export type PrReviewSnapshot = {
  [prId: number]: {
    [reviewerDisplayName: string]: number;
  };
};
