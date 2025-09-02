
import { LoyaltyMember, LoyaltyReward } from '@/types/loyalty';

// Calcul intelligent des niveaux de fidélité
export const calculateLoyaltyLevel = (totalPoints: number, totalSpent: number): string => {
  const combinedScore = (totalPoints * 0.7) + (totalSpent * 0.3);
  
  if (combinedScore >= 5000) return 'Diamant';
  if (combinedScore >= 2500) return 'Platine';
  if (combinedScore >= 1000) return 'Or';
  if (combinedScore >= 500) return 'Argent';
  return 'Bronze';
};

// Prédiction des points à gagner
export const predictNextLevelPoints = (member: LoyaltyMember): number => {
  const levels = {
    'Bronze': 500,
    'Argent': 1000,
    'Or': 2500,
    'Platine': 5000,
    'Diamant': 10000
  };
  
  const currentLevel = member.currentLevel as keyof typeof levels;
  const nextLevelThreshold = levels[currentLevel] || 10000;
  
  return Math.max(0, nextLevelThreshold - member.currentPoints);
};

// Recommandations personnalisées de récompenses
export const getPersonalizedRewards = (
  member: LoyaltyMember, 
  rewards: LoyaltyReward[]
): LoyaltyReward[] => {
  return rewards
    .filter(reward => 
      reward.available && 
      reward.pointsCost <= member.currentPoints
    )
    .sort((a, b) => {
      // Prioriser selon l'historique du membre
      if (member.favoriteCategory && a.category === member.favoriteCategory) return -1;
      if (member.favoriteCategory && b.category === member.favoriteCategory) return 1;
      
      // Puis par rapport qualité/prix
      const aValue = (a.value || 0) / a.pointsCost;
      const bValue = (b.value || 0) / b.pointsCost;
      return bValue - aValue;
    })
    .slice(0, 5);
};

// Calcul ROI des campagnes de fidélité
export const calculateCampaignROI = (
  pointsAwarded: number,
  revenueGenerated: number,
  campaignCost: number
): number => {
  const pointsCost = pointsAwarded * 0.01; // 1 point = 1 centime
  const totalCost = pointsCost + campaignCost;
  
  if (totalCost === 0) return 0;
  return ((revenueGenerated - totalCost) / totalCost) * 100;
};

// Détection de comportements suspects
export const detectSuspiciousActivity = (member: LoyaltyMember): string[] => {
  const warnings: string[] = [];
  
  // Points accumulés trop rapidement
  const avgPointsPerDay = member.totalPointsEarned / 30; // 30 derniers jours
  if (avgPointsPerDay > 100) {
    warnings.push('Accumulation de points anormalement élevée');
  }
  
  // Récompenses utilisées trop fréquemment
  if (member.rewardsUsed > 10 && member.totalSpent < 100) {
    warnings.push('Ratio récompenses/dépenses suspect');
  }
  
  // Parrainages excessifs
  if (member.referrals > 20) {
    warnings.push('Nombre de parrainages anormalement élevé');
  }
  
  return warnings;
};

// Optimisation des stocks de récompenses
export const optimizeRewardInventory = (rewards: LoyaltyReward[]): {
  overstocked: LoyaltyReward[];
  understocked: LoyaltyReward[];
  optimal: LoyaltyReward[];
} => {
  const overstocked = rewards.filter(r => 
    r.usageCount < 5 && r.available
  );
  
  const understocked = rewards.filter(r => 
    r.maxUsage && r.usageCount >= r.maxUsage * 0.9
  );
  
  const optimal = rewards.filter(r => 
    !overstocked.includes(r) && !understocked.includes(r)
  );
  
  return { overstocked, understocked, optimal };
};
