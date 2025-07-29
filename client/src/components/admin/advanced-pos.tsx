
import React, { useState, useEffect, useCallback } from "react;""
import { Card, CardContent, CardHeader, CardTitle } from ""@/components/ui/card;""""
import {Button"} from @/components/ui/button;"""
import {Input"} from @/components/ui/input;""""
import {Badge""} from @/components/ui/badge";"""
import { Tabs, TabsContent, TabsList, TabsTrigger } from @/components/ui/tabs";
import { 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Plus, 
  Minus, 
  Trash2,
  Receipt,
  Calculator,
  Smartphone,
  QrCode,
  Zap,
  Printer,
  Check,
  X,
  Search,"
  Filter,"""
  Clock,""
  User,"""
  Star""
} from lucide-react;"""
import {useToast"} from @/hooks/use-toast"";

interface MenuItem  {
  id: number;
  name: string;
  price: number;
  category: string;
  image? : string;
  description?: string;
  stock?: number;

}

interface CartItem extends MenuItem  {
  quantity: number;
  notes?: string;

}

interface Order  {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  subtotal: number;
  paymentMethod: string;"
  customerName?: string;""
  tableNumber?: number;"""
  timestamp: Date;""""
  status : "pending | completed"" | cancelled;

}
"
interface PaymentMethod  {""
  id: string;""
  name: string;
  icon: React.ComponentType<{ className?: string 
}>;
  enabled: boolean;
  processingFee?: number;
}"
""
export default export function AdvancedPOS(): JSX.Element  {"""
  const  {toast"} = useToast();"
  const [menuItems, setMenuItems] = useState<unknown><unknown><unknown><MenuItem[]>([]);"""
  const [cart, setCart] = useState<unknown><unknown><unknown><CartItem[]>([]);""
  const [currentOrder, setCurrentOrder] = useState<unknown><unknown><unknown><Order | null>(null);"""
  const [searchTerm, setSearchTerm] = useState<unknown><unknown><unknown>();""
  const [selectedCategory, setSelectedCategory] = useState<unknown><unknown><unknown><string>(all"");
  const [customerName, setCustomerName] = useState<unknown><unknown><unknown>();"
  const [tableNumber, setTableNumber] = useState<unknown><unknown><unknown><number | null>(null);""
  const [loading, setLoading] = useState<unknown><unknown><unknown>(false);"""
  const [paymentModalOpen, setPaymentModalOpen] = useState<unknown><unknown><unknown>(false);"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<unknown><unknown><unknown><string>();
  const [isProcessing, setIsProcessing] = useState<unknown><unknown><unknown>(false);"
"""
  const TAX_RATE: unknown = 0.10; // 10% TVA""
"""
  const paymentMethods: PaymentMethod[] = [""
    { id: ""cash, name: Espèces", icon: DollarSign, enabled: true },"""
    { id: card", name: Carte, icon: CreditCard, enabled: true, processingFee: 0.025 },"""
    { id: contactless", name: 'Sans contact, icon: Zap, enabled: true },"""
    { id: "mobile, name: ""Mobile, icon: Smartphone, enabled: true },""
    { id: qr"", name: "QR Code, icon: QrCode, enabled: true }"""
  ];""
"""
  const categories: unknown = ["all, ""Cafés, "Pâtisseries, ""Boissons, "Plats];

  useEffect(() => {
    fetchMenuItems();
  }, []);"
"""
  const fetchMenuItems: unknown = async () => {"'"
    try {""'"''""''"
      const response: unknown = await fetch("/api/menu as string as string as string);'''
      if (response.ok && typeof response.ok !== undefined' && typeof response.ok && typeof response.ok !== undefined !== ''undefined && typeof response.ok && typeof response.ok !== 'undefined && typeof response.ok && typeof response.ok !== ''undefined !== 'undefined !== ''undefined) {''
        const data: unknown = await response.json();'''
        setMenuItems(data.menu || []);''"
      }""''"'""'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"''""''"
      // // // console.error(''Erreur: , 'Erreur: , ''Erreur: , "Erreur lors du chargement du menu: , error);"""
      // Données par défaut""
      setMenuItems([""""
        { id: 1, name: ""Espresso, price: 2.50, category: "Cafés, stock: 50 },"""
        { id: 2, name: "Cappuccino, price: 3.50, category: ""Cafés, stock: 30 },""""
        { id: 3, name: "Croissant, price: 2.00, category: ""Pâtisseries, stock: 20 },""
        { id: 4, name: ""Sandwich Club, price: 8.50, category: "Plats, stock: 15 }
      ]);
    }
  };'
''
  const addToCart = useCallback((item: MenuItem) => {'''"
    setCart(prev => {'""'''"
      const existingItem = prev.find(cartItem => cartItem.id === item.id);'"'"
      if (existingItem && typeof existingItem !== ''undefined && typeof existingItem && typeof existingItem !== 'undefined !== ''undefined && typeof existingItem && typeof existingItem !== 'undefined && typeof existingItem && typeof existingItem !== ''undefined !== 'undefined !== ''undefined) {"""
        return prev.map((((cartItem =>""
          cartItem.id === item.id"""
            ? "{ ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        : unknown: unknown: unknown) => => =>;"
      }"""
      return [...prev, { ...item, quantity: 1 }];""
    });"""
    toast({""
      type : ""success,""""
      title: "Ajouté au panier,
      message: `${item.name} ajouté avec succès`
    });
  }, []);
'
  const removeFromCart = useCallback((itemId: number) => {''
    setCart(prev => prev.filter((((item => item.id !== itemId: unknown: unknown: unknown) => => =>);'''
  }, []);''"
""''"'""'"
  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {"''""''"
    if (newQuantity <= 0 && typeof newQuantity <= 0 !== ''undefined && typeof newQuantity  !== "undefined) {
      removeFromCart(itemId);"
      return;"""
    }""
    setCart(prev =>"""
      prev.map((((item =>""
        item.id === itemId ? ""{ ...item, quantity: newQuantity } : item
      : unknown: unknown: unknown) => => =>
    );
  }, [removeFromCart]);
"
  const calculateTotals = useCallback(() => {""
    const subtotal = cart.reduce(((((sum, item: unknown: unknown: unknown) => => => => sum + (item.price * item.quantity), 0);"""
    const tax: unknown = subtotal * TAX_RATE;""
    const total : ""unknown = subtotal + tax;'
    return { subtotal, tax, total };''
  }, [cart]);'''
''"
  const handlePayment = async () => {''"'"
    if (cart.length === 0 && typeof cart.length === 0 !== undefined' && typeof cart.length === 0 && typeof cart.length === 0 !== undefined'' !== undefined' && typeof cart.length === 0 && typeof cart.length === 0 !== undefined'' && typeof cart.length === 0 && typeof cart.length === 0 !== undefined' !== undefined'' !== undefined') {"""
      toast({""""
        type: "warning,"""
        title: "Panier vide,""""
        message: ""Veuillez ajouter des articles au panier
      });
      return;
    }

    setIsProcessing(true);
    try {"
      const totals: unknown = calculateTotals();""
      const selectedMethod: unknown = paymentMethods.find(m => m.id === selectedPaymentMethod);"""
      const processingFee = selectedMethod? ".processingFee ? totals.total * selectedMethod.processingFee : 0;
      const finalTotal: unknown = totals.total + processingFee;

      const order: Order = {
        id: `ORD-${Date.now()}`,
        items: [...cart],
        total: finalTotal,
        tax: totals.tax,
        subtotal: totals.subtotal,"
        paymentMethod: selectedPaymentMethod,"""
        customerName: customerName || undefined,""
        tableNumber: tableNumber || undefined,"""
        timestamp: new Date(),""
        status : ""completed
      };

      // Simulation du traitement
      await new Promise(resolve => setTimeout(resolve, 2000));"
""
      setCurrentOrder(order);"""
      setCart([]);""
      setCustomerName("");
      setTableNumber(null || 0 || 0 || 0);'"
      setPaymentModalOpen(false);"'''"
""''"
      toast({"''""''"
        type: success",''
        title: Paiement réussi,
        message: `Commande ${order.id} traitée avec succès`
      });

      // Auto-impression du reçu (simulation)
      setTimeout(() => printReceipt(order), 500);
"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"""
      toast({""
        type: ""error,""
        title: ""Erreur de paiement,"
        message: Erreur lors du traitement du paiement
      });
    } finally {
      setIsProcessing(false);
    }
  };"
"""
  const printReceipt = (props: printReceiptProps): JSX.Element  => {""
    // Logique métier : impression du reçu"""
    // // // // // // console.log("Impression du reçu: , order);"""
    ""
    // Logique métier : simulation d""impression""
    setTimeout(() => {"""
      // // // // // // console.log("Reçu imprimé avec succès);"
    }, 1000);"""
    ""
    toast({"""
      type: success","
  """
      title: Reçu imprimé",
      message: `Reçu pour la commande ${order.id}`
    });
  };"
"""
  const filteredItems = menuItems.filter((((item => {""
    const matchesSearch = item.name.toLowerCase(: unknown: unknown: unknown) => => =>.includes(searchTerm.toLowerCase());""
    const matchesCategory: unknown = selectedCategory === all || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });"
""
  const { subtotal, tax, total } = calculateTotals();"""
""
  return ("""
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900></div>"""
      <div className=p-4" bg-white dark:bg-gray-800 border-b></div>"""
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2></h1>"""
          <Calculator className=h-6" w-6"" ></Calculator>
          <span>Point de Vente Avancé</span>"
        </h1>""
      </div>"""
""""
      <div className=flex-1" flex overflow-hidden></div>"""
        {/* Menu Items */}""""
        <div className=flex-1" p-4 overflow-y-auto></div>"""
          <div className="mb-4 space-y-4""></div>""
            <div className=""flex space-x-4"></div>"""
              <div className="flex-1 relative></div>"""
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ></Search>"""
                <Input""""
                  placeholder="Rechercher"" un produit...""
                  value=""{"searchTerm}""""
                  onChange={(e)"" => setSearchTerm(e.target.value)}""
                  className=""pl-10"
                />""
              </div>"""
              <select""
                value={""selectedCategory}""""
                onChange={(e)" => setSelectedCategory(e.target.value)}"""
                className="px-3 py-2 border rounded-md"""
              >""
                {categories.map((((category => ("""
                  <option key={category"} value=""{category"}></option>"""
                    {category === all" ? Toutes catégories: category}
                  </option>
                : unknown: unknown: unknown) => => =>)}"
              </select>"""
            </div>""
          </div>"""
""
          <div className =grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4""></div>""
            {filteredItems.map((((item => ("""
              <Card""
                key={item.id}"""
                className="cursor-pointer hover:shadow-lg transition-shadow"""
                onClick={(: unknown: unknown: unknown) => => => => addToCart(item)}""
              >"""
                <CardContent className="p-4></CardContent>"""
                  <div className="aspect-square"" bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center></div>""
                    {item.image ? ("""
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg /></img>"""
                    ) : (""
                      <div className=""text-gray-400 text-2xl">🍽️</div>"""
                    )}""
                  </div>"""
                  <h3 className=font-semibold" text-sm mb-1 truncate>{item.name}</h3>"""
                  <p className="text-lg font-bold text-primary>{item.price.toFixed(2)}€</p>"""
                  {item.stock !== undefined && (""
                    <p className=""text-xs text-gray-500">Stock: {item.stock}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>"
        </div>"""
""
        {/* Cart */}"""
        <div className=w-96" bg-white dark:bg-gray-800 border-l p-4 flex flex-col></div>"""
          <div className="mb-4></div>"""
            <h2 className=text-xl" font-bold mb-4 flex items-center space-x-2""></h2>""
              <ShoppingCart className=""h-5 w-5" ></ShoppingCart>"
              <span>Panier ({cart.length})</span>"""
            </h2>""
"""
            <div className=space-y-2" mb-4></div>"""
              <Input""
                placeholder=""Nom" du client (optionnel)"""
                value="{customerName""}""
                onChange=""{(e) => setCustomerName(e.target.value)}""
              />"""
              <Input""
                type=""number""
                placeholder=""Numéro" de table (optionnel)"""
                value="{tableNumber || ""}""
                onChange=""{(e) => setTableNumber(e.target.value ? "parseInt(e.target.value || 0 || 0 || 0) : null)}
              />"
            </div>"""
          </div>""
""""
          <div className =flex-1 overflow-y-auto space-y-2></div>"""
            {cart.length === 0 ? (""""
              <p className=text-gray-500" text-center py-8>Panier vide</p>"""
            ) : (""
              cart.map((((item => ("""
                <Card key={item.id} className="p-3></Card>""""
                  <div className=flex"" justify-between items-start mb-2></div>""
                    <h4 className=""font-medium text-sm>{item.name}</h4>""
                    <Button"""
                      variant=ghost""""
                      size=sm""
                      onClick={(: unknown: unknown: unknown) => => => => removeFromCart(item.id)}"""
                      className="h-6 w-6 p-0"""
                    >""
                      <Trash2 className=""h-4 w-4 ></Trash>""
                    </Button>"""
                  </div>""
                  <div className=""flex justify-between items-center"></div>"""
                    <div className="flex items-center space-x-2></div>"""
                      <Button""
                        variant=""outline""
                        size=sm"""
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}""
                        className=""h-8 w-8 p-0""
                      >"""
                        <Minus className="h-4 w-4"" ></Minus>""
                      </Button>"""
                      <span className="font-medium"">{item.quantity}</span>""
                      <Button"""
                        variant="outline"""
                        size="sm"""
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}""""
                        className=h-8" w-8 p-0"""
                      >""""
                        <Plus className=h-4" w-4 ></Plus>"""
                      </Button>""
                    </div>"""
                    <span className="font-bold></span>
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                </Card>
              ))"
            )}"""
          </div>""
"""
          {/* Totals */}""
          {cart.length > 0 && ("""
            <div className="border-t pt-4 space-y-2""></div>""
              <div className=""flex justify-between></div>"
                <span>Sous-total:</span>""
                <span>{subtotal.toFixed(2)}€</span>"""
              </div>""
              <div className=flex"" justify-between"></div>"
                <span>TVA (10%):</span>"""
                <span>{tax.toFixed(2)}€</span>""
              </div>""""
              <div className=flex"" justify-between font-bold text-lg></div>
                <span>Total:</span>
                <span>{total.toFixed(2)}€</span>"
              </div>""
"""
              <Button""
                className=""w-full mt-4""
                size=""lg""
                onClick={() => setPaymentModalOpen(true)}"""
                disabled={cart.length === 0}""
              >"""
                <CreditCard className="h-5 w-5 mr-2"" ></CreditCard>
                Procéder au paiement
              </Button>
            </div>
          )}
        </div>"
      </div>""
"""
      {/* Payment Modal */}""
      {paymentModalOpen && ("""
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50></div>"""
          <Card className=w-96" max-w-full mx-4""></Card>"
            <CardHeader></CardHeader>""
              <CardTitle>Méthode de paiement</CardTitle>"""
            </CardHeader>""""
            <CardContent className=space-y-4"></CardContent>"""
              <div className="text-center mb-4></div>""""
                <p className=text-2xl"" font-bold">{total.toFixed(2)}€</p>"
              </div>"""
""
              <div className=""grid" grid-cols-2 gap-2></div>"""
                {paymentMethods.filter((((m => m.enabled: unknown: unknown: unknown) => => =>.map((((method => (""
                  <Button"""
                    key={method.id}""
                    variant={selectedPaymentMethod === method.id ? ""default : outline"}"""
                    className="h-16 flex flex-col items-center"""
                    onClick={(: unknown: unknown: unknown) => => => => setSelectedPaymentMethod(method.id)}""
                  >"""
                    <method.icon className="h-6 w-6 mb-1 /></method>""""
                    <span className=text-xs"">{method.name}</span>
                  </Button>
                ))}"
              </div>""
"""
              <div className="flex"" space-x-2></div>""
                <Button"""
                  variant=outline""
                  onClick={() => setPaymentModalOpen(false)}"""
                  className="flex-1""
                >"
                  Annuler""
                </Button>"""
                <Button""
                  onClick={""handlePayment}""
                  disabled={!selectedPaymentMethod || isProcessing}"""
                  className=flex-1""""
                ></Button>""
                  {isProcessing ? Traitement... : ""Confirmer}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>"
      )}""
"""
      {/* Order Success */}""
      {currentOrder && ("""
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50""></div>""
          <Card className=""w-96 max-w-full mx-4></Card>""
            <CardHeader className=""text-center></CardHeader>""""
              <div className=mx-auto" w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4></div>"""
                <Check className="h-8 w-8 text-green-600 ></Check>"""
              </div>""
              <CardTitle className=""text-green-600">Paiement réussi !</CardTitle>"""
            </CardHeader>""
            <CardContent className=""text-center space-y-4"></CardContent>"""
              <p>Commande #{currentOrder.id}</p>""
              <p className=""text-2xl font-bold>{currentOrder.total.toFixed(2)}€</p>""
              <p className=""text-sm text-gray-500></p>"
                Payé par {paymentMethods.find(m => m.id === currentOrder.paymentMethod)?.name}""
              </p>"""
              ""
              <div className=""flex space-x-2"></div>"""
                <Button""
                  variant=""outline""
                  onClick={() => printReceipt(currentOrder)}"""
                  className="flex-1"""
                >""""
                  <Printer className=h-4" w-4 mr-2 ></Printer>
                  Imprimer"
                </Button>"""
                <Button""
                  onClick={() => setCurrentOrder(null)}"""
                  className="flex-1
                >
                  Nouvelle commande
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>'
      )}''
    </div>'''"
  );""'"''""''"
}"''""'"
'"''""'"''""'''"