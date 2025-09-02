
export interface LoyaltyTier {
  id: string;
  name: string;
  pointsRequired: number;
  benefits: string[];
  color: string;
  multiplier: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_item' | 'special_offer';
  value: number;
  isActive: boolean;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  pointsPerEuro: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyalty {
  customerId: string;
  currentPoints: number;
  totalPointsEarned: number;
  currentTier: string;
  nextTier?: string;
  pointsToNextTier: number;
  redeemedRewards: string[];
}

// Types pour les composants UI
export type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary';

export interface ToastMessage {
  title?: string;
  description?: string;
  variant?: BadgeVariant;
  duration?: number;
}
