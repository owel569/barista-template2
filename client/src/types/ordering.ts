
export interface MenuItemComplete {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable: boolean;
  allergens?: string[];
  preparationTime?: number;
  spicyLevel?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  calories?: number;
}

export interface CartItemComplete {
  id: number;
  menuItem: MenuItemComplete;
  quantity: number;
  customizations: Record<string, string>;
  notes: string;
  subtotal: number;
}

export interface OrderCustomizations {
  notes?: string;
  specialInstructions?: string;
  deliveryTime?: string;
  paymentMethod?: 'card' | 'cash' | 'mobile';
}

export interface OrderSummary {
  items: CartItemComplete[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  estimatedTime: number;
}

// États de l'interface
export interface OrderingState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  currentStep: 'menu' | 'cart' | 'checkout' | 'confirmation';
}

// Types pour les hooks
export interface UseOrderingReturn {
  cart: CartItemComplete[];
  addToCart: (item: MenuItemComplete, customizations?: Record<string, string>) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}
