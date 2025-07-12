// Mock data pour les statistiques - externalisé pour réutilisabilité
export const mockRevenueData = [
  { date: '2024-01-01', revenue: 1250, orders: 45 },
  { date: '2024-01-02', revenue: 1380, orders: 52 },
  { date: '2024-01-03', revenue: 980, orders: 38 },
  { date: '2024-01-04', revenue: 1520, orders: 58 },
  { date: '2024-01-05', revenue: 1430, orders: 48 },
  { date: '2024-01-06', revenue: 1680, orders: 62 },
  { date: '2024-01-07', revenue: 1850, orders: 71 },
];

export const mockCategoryData = [
  { category: 'Cafés', value: 45, color: '#8884d8' },
  { category: 'Pâtisseries', value: 25, color: '#82ca9d' },
  { category: 'Boissons', value: 20, color: '#ffc658' },
  { category: 'Plats', value: 10, color: '#ff7300' },
];

export const mockCustomerData = [
  { name: 'Sophie Martin', visits: 28, spent: 450 },
  { name: 'Pierre Dubois', visits: 22, spent: 380 },
  { name: 'Marie Leroy', visits: 19, spent: 290 },
  { name: 'Jean Dupont', visits: 15, spent: 225 },
  { name: 'Emma Rousseau', visits: 12, spent: 180 },
];

export const mockPopularItems = [
  { name: 'Cappuccino', sales: 156, growth: 12.5 },
  { name: 'Croissant', sales: 134, growth: 8.2 },
  { name: 'Latte', sales: 128, growth: -2.1 },
  { name: 'Espresso', sales: 95, growth: 15.8 },
  { name: 'Americano', sales: 87, growth: 5.4 },
];

export const mockHourlyData = [
  { hour: '08:00', customers: 12, revenue: 180 },
  { hour: '09:00', customers: 25, revenue: 375 },
  { hour: '10:00', customers: 35, revenue: 525 },
  { hour: '11:00', customers: 28, revenue: 420 },
  { hour: '12:00', customers: 45, revenue: 675 },
  { hour: '13:00', customers: 52, revenue: 780 },
  { hour: '14:00', customers: 38, revenue: 570 },
  { hour: '15:00', customers: 32, revenue: 480 },
  { hour: '16:00', customers: 28, revenue: 420 },
  { hour: '17:00', customers: 22, revenue: 330 },
  { hour: '18:00', customers: 15, revenue: 225 },
];