export type MonthlyReservation = {
  date: string;
  count: number;
};

export type RevenueStat = {
  date: string;
  revenue: number;
};

export type OrderStatus = {
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | string;
  count: number;
};

export type TodayReservations = {
  count: number;
};

export type Occupancy = {
  rate: number;
};
