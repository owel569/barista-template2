import React from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartPageProps {}

const CartPage: React.FC<CartPageProps> = () => {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number): void => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string, itemName: string): void => {
    removeItem(id);
    toast({
      title: "Article supprimé",
      description: `${itemName} a été retiré de votre panier`,
    });
  };

  const handleClearCart = (): void => {
    clearCart();
    toast({
      title: "Panier vidé",
      description: "Tous les articles ont été supprimés de votre panier",
    });
  };

  const handleCheckout = (): void => {
    if (items.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles à votre panier avant de passer commande",
        variant: "destructive"
      });
      return;
    }
    
    // Rediriger vers la page de réservation avec le panier
    navigate('/reservation');
    toast({
      title: "Redirection vers la commande",
      description: "Vous allez être redirigé vers la page de commande",
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        {/* Header avec navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" className="flex items-center text-amber-600 hover:text-amber-700">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Retour à l'accueil
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-6 w-6 text-amber-600" />
                <h1 className="text-2xl font-bold text-gray-900">Mon Panier</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal - Panier vide */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
              <p className="text-gray-600 mb-8">
                Découvrez notre délicieux menu et ajoutez vos articles préférés à votre panier.
              </p>
              <div className="space-y-4">
                <Link href="/menu">
                  <Button 
                    size="lg" 
                    className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                    data-testid="button-browse-menu"
                  >
                    Parcourir le menu
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-amber-600 border-amber-600 hover:bg-amber-50 w-full sm:w-auto ml-0 sm:ml-4"
                    data-testid="button-back-home"
                  >
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header avec navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center text-amber-600 hover:text-amber-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mon Panier</h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des articles */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Articles dans votre panier</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearCart}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider le panier
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex items-center space-x-4" data-testid={`cart-item-${item.id}`}>
                          {/* Image du produit */}
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl || '/placeholder-food.jpg'}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-food.jpg';
                              }}
                            />
                          </div>

                          {/* Informations du produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 truncate" data-testid={`text-item-name-${item.id}`}>
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600">Prix unitaire: {formatPrice(item.price)}€</p>
                            <p className="text-sm font-medium text-amber-600">
                              Sous-total: {formatPrice(item.price * item.quantity)}€
                            </p>
                          </div>

                          {/* Contrôles de quantité */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span 
                              className="w-12 text-center font-medium" 
                              data-testid={`text-quantity-${item.id}`}
                            >
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Bouton supprimer */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id, item.name)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {index < items.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Résumé de commande */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Articles ({totalItems})</span>
                      <span data-testid="text-subtotal">{formatPrice(totalPrice)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Livraison</span>
                      <span className="text-green-600">Gratuite</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-amber-600" data-testid="text-total">{formatPrice(totalPrice)}€</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    size="lg"
                    data-testid="button-checkout"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Passer commande
                  </Button>

                  <Link href="/menu">
                    <Button 
                      variant="outline" 
                      className="w-full text-amber-600 border-amber-600 hover:bg-amber-50"
                      data-testid="button-continue-shopping"
                    >
                      Continuer les achats
                    </Button>
                  </Link>

                  <div className="text-xs text-gray-500 text-center pt-4">
                    <p>🚚 Livraison gratuite dans toute la ville</p>
                    <p>⏰ Temps de préparation: 15-30 min</p>
                    <p>💳 Paiement sécurisé</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;