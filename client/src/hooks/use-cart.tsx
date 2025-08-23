import { useState, useCallback } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartStore {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (id: string) => CartItem | undefined;
}

const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { totalItems, totalPrice };
};

export const useCart = (): CartStore => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('barista-cart-storage');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.state?.items || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveToStorage = useCallback((newItems: CartItem[]) => {
    localStorage.setItem('barista-cart-storage', JSON.stringify({ 
      state: { items: newItems }, 
      version: 1 
    });
  }, []);

  const totals = calculateTotals(items);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);
      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      } else {
        updatedItems = [...currentItems, { ...newItem, quantity: newItem.quantity || 1 }];
      }

      saveToStorage(updatedItems);
      return updatedItems;
    });
  }, [saveToStorage]);

  const removeItem = useCallback((id: string) => {
    setItems(currentItems => {
      const updatedItems = currentItems.filter(item => item.id !== id);
      saveToStorage(updatedItems);
      return updatedItems;
    });
  }, [saveToStorage]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(currentItems => {
      const updatedItems = currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveToStorage(updatedItems);
      return updatedItems;
    });
  }, [removeItem, saveToStorage]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveToStorage([]);
  }, [saveToStorage]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  return {
    items,
    totalItems: totals.totalItems,
    totalPrice: totals.totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
  };
};