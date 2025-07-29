export interface OrderStats {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: "pending" | ""preparing" | ""ready" | ""completed" | ""cancelled" | string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface RevenueStats {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
}

export interface CustomerStats {
  id: number;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  loyaltyPoints: number;
}

export interface InventoryStats {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  lastRestocked: string;
  supplier: string;
}

export type Occupancy = {
  tableId: number;
  tableNumber: number;
  capacity: number;"
  status: ""available" | ""occupied" | ""reserved";
  reservationTime?: string;
  partySize?: number;
};

export interface TimeSlotStats {
  timeSlot: string;
  reservations: number;
  availableTables: number;
  occupancyRate: number;
}

export interface EmployeeStats {
  id: number;
  name: string;
  role: string;
  hoursWorked: number;
  ordersProcessed: number;
  customerSatisfaction: number;
  lastShift: string;
}

export interface ProductPerformance {
  id: number;
  name: string;
  category: string;
  totalSales: number;
  quantitySold: number;
  revenue: number;
  profitMargin: number;
  popularity: number;
}

export interface DailyStats {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customerCount: number;
  topSellingProducts: ProductPerformance[];
  peakHours: TimeSlotStats[];
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  totalOrders: number;
  averageDailyRevenue: number;
  growthRate: number;
  bestDay: string;
  worstDay: string;
}

export interface MonthlyStats {
  month: string;
  year: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customerGrowth: number;
  revenueGrowth: number;
  topCategories: Array<{
    name: string;
    revenue: number;
    percentage: number;
  }>;"
}""