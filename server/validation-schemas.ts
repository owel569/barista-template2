import { z } from 'zod';

export const commonSchemas = {
  id: z.number().int().positive(),
  idSchema: z.object({
    id: z.coerce.number().int().positive()
  }),
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
  phone: z.string().optional(),
  date: z.string(),
  time: z.string(),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
};

export const OrderStatusEnum = z.enum(['pending', 'cancelled', 'preparing', 'ready', 'delivered']);

export const CreateOrderSchema = z.object({
  customerId: z.number().int().positive().optional(),
  tableId: z.number().int().positive().optional(),
  orderType: z.string().default('dine-in'),
  items: z.array(z.object({
    menuItemId: z.number().int().positive(),
    quantity: z.number().int().min(1),
    notes: z.string().optional()
  })),
  specialRequests: z.string().optional(),
  notes: z.string().optional()
});

export const UpdateOrderSchema = z.object({
  status: OrderStatusEnum.optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional()
});