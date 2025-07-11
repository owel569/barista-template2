import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, 
  Smartphone, Receipt, User, Search, Calculator, Gift,
  Clock, MapPin, Truck, Coffee, Star, Tag
} from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  modifications?: string[];
  category: string;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  loyaltyPoints: number;
  level: string;
}

export default function AdvancedPOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderType, setOrderType] = useState('dine-in');
  const [showPayment, setShowPayment] = useState(false);
  const [discount, setDiscount] = useState(0);

  const [menuItems] = useState([
    { id: 1, name: 'Cappuccino Premium', price: 4.20, category: 'café', available: true },
    { id: 2, name: 'Latte Vanille', price: 4.50, category: 'café', available: true },
    { id: 3, name: 'Americano', price: 3.20, category: 'café', available: true },
    { id: 4, name: 'Croissant Beurre', price: 2.80, category: 'pâtisserie', available: true },
    { id: 5, name: 'Pain au Chocolat', price: 3.00, category: 'pâtisserie', available: true },
    { id: 6, name: 'Sandwich Club', price: 8.50, category: 'plat', available: true },
    { id: 7, name: 'Salade César', price: 12.90, category: 'plat', available: true },
    { id: 8, name: 'Thé Earl Grey', price: 3.50, category: 'boisson', available: true },
    { id: 9, name: 'Chocolat Chaud', price: 4.20, category: 'boisson', available: true },
    { id: 10, name: 'Macaron Framboise', price: 2.50, category: 'pâtisserie', available: true },
  ]);

  const [customers] = useState<Customer[]>([
    { id: 1, name: 'Sophie Laurent', phone: '+33612345678', loyaltyPoints: 450, level: 'VIP' },
    { id: 2, name: 'Jean Dupont', phone: '+33623456789', loyaltyPoints: 120, level: 'Fidèle' },
    { id: 3, name: 'Marie Martin', phone: '+33634567890', loyaltyPoints: 75, level: 'Standard' },
  ]);

  const categories = [
    { id: 'all', name: 'Tous', icon: Coffee },
    { id: 'café', name: 'Cafés', icon: Coffee },
    { id: 'boisson', name: 'Boissons', icon: Coffee },
    { id: 'pâtisserie', name: 'Pâtisseries', icon: Coffee },
    { id: 'plat', name: 'Plats', icon: Coffee },
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, modifications: [] }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const processPayment = async () => {
    try {
      const orderData = {
        items: cart,
        customer: selectedCustomer,
        paymentMethod,
        orderType,
        subtotal,
        discount: discountAmount,
        total,
        timestamp: new Date().toISOString()
      };

      console.log('Traitement de la commande:', orderData);
      
      // Simuler le traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Réinitialiser le panier
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setShowPayment(false);
      
      alert('Commande traitée avec succès !');
    } catch (error) {
      console.error('Erreur traitement paiement:', error);
      alert('Erreur lors du traitement de la commande');
    }
  };

  const applyLoyaltyDiscount = () => {
    if (selectedCustomer && selectedCustomer.loyaltyPoints >= 100) {
      const pointsToUse = Math.min(selectedCustomer.loyaltyPoints, Math.floor(subtotal * 10));
      const discountFromPoints = pointsToUse / 10;
      setDiscount(Math.min(50, (discountFromPoints / subtotal) * 100));
    }
  };

  return (
    <div className="h-screen flex">
      {/* Section Menu */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">Point de Vente Avancé</h2>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine-in">Sur place</SelectItem>
                <SelectItem value="takeaway">À emporter</SelectItem>
                <SelectItem value="delivery">Livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Catégories */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              <category.icon className="h-4 w-4 mr-2" />
              {category.name}
            </Button>
          ))}
        </div>

        {/* Grille de produits */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={() => addToCart(item)}>
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-lg font-bold text-primary">{item.price.toFixed(2)}€</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {item.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section Panier */}
      <div className="w-96 bg-gray-50 p-4 flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Commande en cours</h3>
          
          {/* Sélection client */}
          <div className="mb-4">
            <Label>Client</Label>
            <Select value={selectedCustomer?.id.toString()} onValueChange={(value) => {
              const customer = customers.find(c => c.id.toString() === value);
              setSelectedCustomer(customer || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Client anonyme</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} ({customer.loyaltyPoints} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && (
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant={selectedCustomer.level === 'VIP' ? 'default' : 'secondary'}>
                  {selectedCustomer.level}
                </Badge>
                <span className="ml-2">{selectedCustomer.loyaltyPoints} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Articles du panier */}
        <div className="flex-1 overflow-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Panier vide</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
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
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Résumé et paiement */}
        {cart.length > 0 && (
          <div className="space-y-3">
            {/* Réduction */}
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Réduction %"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1"
              />
              {selectedCustomer && selectedCustomer.loyaltyPoints >= 100 && (
                <Button variant="outline" size="sm" onClick={applyLoyaltyDiscount}>
                  <Gift className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Totaux */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction ({discount}%):</span>
                  <span>-{discountAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-1">
                <span>Total:</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>

            {/* Méthodes de paiement */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex items-center space-x-1"
              >
                <CreditCard className="h-4 w-4" />
                <span>Carte</span>
              </Button>
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex items-center space-x-1"
              >
                <Banknote className="h-4 w-4" />
                <span>Espèces</span>
              </Button>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setShowPayment(true)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Finaliser ({total.toFixed(2)}€)
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de paiement */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finaliser la commande</DialogTitle>
            <DialogDescription>
              Vérifiez les détails de la commande avant le paiement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Résumé de la commande</h4>
              <div className="space-y-1 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.price * item.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-2 font-bold">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Méthode de paiement</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  {paymentMethod === 'card' ? 'Carte bancaire' : 'Espèces'}
                </div>
              </div>
              <div>
                <Label>Type de commande</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  {orderType === 'dine-in' ? 'Sur place' : 
                   orderType === 'takeaway' ? 'À emporter' : 'Livraison'}
                </div>
              </div>
            </div>

            {selectedCustomer && (
              <div>
                <Label>Client</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  {selectedCustomer.name} - {selectedCustomer.loyaltyPoints} points
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={processPayment} className="flex-1">
                Confirmer le paiement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}