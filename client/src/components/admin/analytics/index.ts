
/**
 * Export centralisé des composants Analytics
 */

// Composant principal unifié
export { MetricCard, type MetricCardProps } from './MetricCard';
export { UnifiedStatsCard, type UnifiedStatsCardProps, type BaseStatsData, useStatsData } from './components/UnifiedStatsCard';

// Vues spécialisées
export { RevenueView } from './RevenueView';
export { ProductView } from './ProductView'; 
export { HourView } from './HourView';
export { TrendsView } from './TrendsView';
export { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';

// Utilitaires
export * from './dataGenerators';
export * from './ExportUtils';

// Sous-composants (uniquement ceux qui existent encore)
export { AIInsightsPanel } from './components/AIInsightsPanel';
export { CustomerBehaviorView } from './components/CustomerBehaviorView';
export { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
export { RealTimeKPIs } from './components/RealTimeKPIs';
export { RevenueView as ComponentRevenueView } from './components/RevenueView';
