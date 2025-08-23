import { format, subDays, subHours, startOfDay, endOfDay } from 'date-fns';

export const generateRevenueData = (timeRange: string) => {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Simulation plus réaliste basée sur le jour de la semaine
    const baseRevenue = isWeekend ? 2000 : 1500;
    const variance = Math.random() * 800 - 400;
    const revenue = Math.max(800, baseRevenue + variance);
    
    const baseOrders = Math.floor(revenue / 35); // Panier moyen ~35€
    const orders = baseOrders + Math.floor(Math.random() * 10 - 5);
    
    data.push({
      date: format(date, 'MM/dd'),
      revenue: Math.round(revenue),
      orders,
      avgOrder: Math.round(revenue / orders * 100) / 100
    });
  }
  
  return data;
};

export const generateProductData = (timeRange: string) => {
  const products = [
    { name: 'Cappuccino', baseShare: 0.35, price: 4.5 },
    { name: 'Latte', baseShare: 0.28, price: 5.0 },
    { name: 'Americano', baseShare: 0.20, price: 3.5 },
    { name: 'Espresso', baseShare: 0.12, price: 2.5 },
    { name: 'Autres', baseShare: 0.05, price: 4.0 }
  ];
  
  const totalOrders = timeRange === '7d' ? 300 : timeRange === '30d' ? 1200 : 3600;
  
  return products.map((product) => {
    const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
    const actualShare = Math.max(0.01, product.baseShare + variance);
    const sales = Math.round(totalOrders * actualShare);
    const revenue = Math.round(sales * product.price);
    const percentage = Math.round(actualShare * 100);
    
    return {
      name: product.name,
      sales,
      revenue,
      percentage
    };
  });
};

export const generateHourlyData = (timeRange: string) => {
  const hours = [
    { hour: '8h', baseOrders: 12, peakMultiplier: 0.6 },
    { hour: '9h', baseOrders: 25, peakMultiplier: 0.8 },
    { hour: '10h', baseOrders: 32, peakMultiplier: 1.0 },
    { hour: '11h', baseOrders: 28, peakMultiplier: 0.9 },
    { hour: '12h', baseOrders: 45, peakMultiplier: 1.4 },
    { hour: '13h', baseOrders: 52, peakMultiplier: 1.6 },
    { hour: '14h', baseOrders: 38, peakMultiplier: 1.2 },
    { hour: '15h', baseOrders: 30, peakMultiplier: 1.0 },
    { hour: '16h', baseOrders: 35, peakMultiplier: 1.1 },
    { hour: '17h', baseOrders: 28, peakMultiplier: 0.9 },
    { hour: '18h', baseOrders: 22, peakMultiplier: 0.7 },
    { hour: '19h', baseOrders: 15, peakMultiplier: 0.5 }
  ];
  
  return hours.map((hourData) => {
    const variance = Math.random() * 0.4 - 0.2; // ±20% variance
    const orders = Math.round(hourData.baseOrders * (1 + variance);
    const revenue = orders * (30 + Math.random() * 20); // 30-50€ par commande
    const avgWaitTime = Math.round((5 + Math.random() * 10) * 10) / 10; // 5-15 min
    
    return {
      hour: hourData.hour,
      orders,
      revenue: Math.round(revenue),
      avgWaitTime
    };
  });
};

export const generateTrendsData = (timeRange: string) => {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Tendances simulées avec croissance progressive
    const growthFactor = (days - i) / days * 0.2; // 20% growth over period
    const baseCustomers = isWeekend ? 45 : 35;
    const customers = Math.round(baseCustomers * (1 + growthFactor) + Math.random() * 10 - 5);
    
    const baseOrders = Math.round(customers * 0.8); // 80% conversion rate
    const orders = baseOrders + Math.floor(Math.random() * 8 - 4);
    
    const avgOrderValue = 30 + Math.random() * 20; // 30-50€
    const revenue = Math.round(orders * avgOrderValue);
    
    const satisfaction = 3.5 + Math.random() * 1.5; // 3.5-5.0
    
    data.push({
      date: format(date, 'MM/dd'),
      customers,
      orders,
      revenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      satisfaction: Math.round(satisfaction * 10) / 10
    });
  }
  
  return data;
};

export const generateMetrics = (timeRange: string) => {
  const currentPeriodData = generateRevenueData(timeRange);
  const previousPeriodData = generateRevenueData(timeRange); // Simulate previous period
  
  const currentRevenue = currentPeriodData.reduce((sum, item) => sum + item.revenue, 0);
  const previousRevenue = previousPeriodData.reduce((sum, item) => sum + item.revenue, 0);
  const revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  
  const currentOrders = currentPeriodData.reduce((sum, item) => sum + item.orders, 0);
  const previousOrders = previousPeriodData.reduce((sum, item) => sum + item.orders, 0);
  const ordersGrowth = ((currentOrders - previousOrders) / previousOrders) * 100;
  
  const currentCustomers = Math.round(currentOrders * 0.7); // Estimate unique customers
  const previousCustomers = Math.round(previousOrders * 0.7);
  const customersGrowth = ((currentCustomers - previousCustomers) / previousCustomers) * 100;
  
  const currentAvgOrder = currentRevenue / currentOrders;
  const previousAvgOrder = previousRevenue / previousOrders;
  const avgOrderGrowth = ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100;
  
  return {
    revenue: { current: currentRevenue, previous: previousRevenue, growth: revenueGrowth },
    orders: { current: currentOrders, previous: previousOrders, growth: ordersGrowth },
    customers: { current: currentCustomers, previous: previousCustomers, growth: customersGrowth },
    avgOrderValue: { current: currentAvgOrder, previous: previousAvgOrder, growth: avgOrderGrowth }
  };
};