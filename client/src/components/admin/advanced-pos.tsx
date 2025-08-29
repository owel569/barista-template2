import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  CreditCard,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Calculator,
  Smartphone,
  QrCode,
  Zap,
  Printer,
  Check,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  stock?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  subtotal: number;
  paymentMethod: string;
  customerName?: string;
  tableNumber?: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  processingFee?: number;
}

export default function AdvancedPOS(): JSX.Element {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  const TAX_RATE = 0.10; // 10% TVA

  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Espèces', icon: DollarSign, enabled: true },
    { id: 'card', name: 'Carte', icon: CreditCard, enabled: true, processingFee: 0.025 },
    { id: 'contactless', name: 'Sans contact', icon: Zap, enabled: true },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, enabled: true },
    { id: 'qr', name: 'QR Code', icon: QrCode, enabled: true },
  ];

  const categories = ['all', 'Cafés', 'Pâtisseries', 'Boissons', 'Plats'];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menu || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du menu:', error);
      // Données par défaut
      setMenuItems([
        { id: 1, name: 'Espresso', price: 2.50, category: 'Cafés', stock: 50 },
        { id: 2, name: 'Cappuccino', price: 3.50, category: 'Cafés', stock: 30 },
        { id: 3, name: 'Croissant', price: 2.00, category: 'Pâtisseries', stock: 20 },
        { id: 4, name: 'Sandwich Club', price: 8.50, category: 'Plats', stock: 15 },
      ]);
    }
  };

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: "Ajouté au panier",
      description: `${item.name} ajouté avec succès`,
    });
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeFromCart]);

  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);

  const processPayment = async (paymentMethod: string) => {
    setLoading(true);
    try {
      const totals = calculateTotals();
      const selectedMethod = paymentMethods.find(m => m.id === paymentMethod);
      const processingFee = selectedMethod?.processingFee ? totals.total * selectedMethod.processingFee : 0;
      const finalTotal = totals.total + processingFee;

      const order: Order = {
        id: `ORD-${Date.now()}`,
        items: [...cart],
        total: finalTotal,
        tax: totals.tax,
        subtotal: totals.subtotal,
        paymentMethod,
        customerName: customerName || undefined,
        tableNumber: tableNumber || undefined,
        timestamp: new Date(),
        status: 'completed',
      };

      // Simulation du traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentOrder(order);
      setCart([]);
      setCustomerName('');
      setTableNumber(null);
      setPaymentModalOpen(false);

      toast({
        title: "Paiement réussi",
        description: `Commande ${order.id} traitée avec succès`,
      });

      // Auto-impression du reçu (simulation)
      setTimeout(() => printReceipt(order), 500);
    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (order: Order) => {
    // Simulation de l'impression
    console.log('Impression du reçu:', order);
    toast({
      title: "Reçu imprimé",
      description: `Reçu pour la commande ${order.id}`,
    });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 bg-white dark:bg-gray-800 border-b">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Calculator className="h-6 w-6" />
          <span>Point de Vente Avancé</span>
        </h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Menu Items */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4 space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Toutes catégories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-gray-400 text-2xl">🍽️</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>
                  <p className="text-lg font-bold text-primary">{item.price.toFixed(2)}€</p>
                  {item.stock !== undefined && (
                    <p className="text-xs text-gray-500">Stock: {item.stock}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l p-4 flex flex-col">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Panier ({cart.length})</span>
            </h2>

            <div className="space-y-2 mb-4">
              <Input
                placeholder="Nom du client (optionnel)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Numéro de table (optionnel)"
                value={tableNumber || ''}
                onChange={(e) => setTableNumber(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Panier vide</p>
            ) : (
              cart.map(item => (
                <Card key={item.id} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>TVA (10%):</span>
                <span>{tax.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{total.toFixed(2)}€</span>
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                onClick={() => setPaymentModalOpen(true)}
                disabled={cart.length === 0}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Procéder au paiement
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.filter(m => m.enabled).map(method => (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                    className="h-16 flex flex-col items-center"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <method.icon className="h-6 w-6 mb-1" />
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => processPayment(selectedPaymentMethod)}
                  disabled={!selectedPaymentMethod || loading}
                  className="flex-1"
                >
                  {loading ? 'Traitement...' : 'Confirmer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Success */}
      {currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Paiement réussi !</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p>Commande #{currentOrder.id}</p>
              <p className="text-2xl font-bold">{currentOrder.total.toFixed(2)}€</p>
              <p className="text-sm text-gray-500">
                Payé par {paymentMethods.find(m => m.id === currentOrder.paymentMethod)?.name}
              </p>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => printReceipt(currentOrder)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
                <Button
                  onClick={() => setCurrentOrder(null)}
                  className="flex-1"
                >
                  Nouvelle commande
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}