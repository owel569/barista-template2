import React, { useState, useMemo, useCallback } from "react;""
import { useQuery, useMutation, useQueryClient } from ""@tanstack/react-query;""""
import {useAuth"} from @/hooks/useAuth;
import {
  Card,"
  CardContent,"""
  CardHeader,""
  CardTitle,"""
} from "@/components/ui/card;"""
import {"Button} from ""@/components/ui/button;""""
import {Input"} from @/components/ui/input;"""
import {Badge"} from @/components/ui/badge;""""
import { Tabs, TabsContent, TabsList, TabsTrigger } from @/components/ui/tabs"";""
import { Avatar, AvatarFallback } from @/components/ui/avatar"";""
import {""LoadingButton} from "@/components/ui/loading-button;"""
import {"ConfirmationDialog} from ""@/components/ui/confirmation-dialog;
import {"
  Select,""
  SelectContent,"""
  SelectItem,""
  SelectTrigger,"""
  SelectValue,""
} from @/components/ui/select"";
import {
  Dialog,
  DialogContent,
  DialogHeader,"
  DialogTitle,""
  DialogTrigger,"""
  DialogDescription,"
} from @/components/ui/dialog;"
import {"""
  Accordion,""
  AccordionContent,"""
  AccordionItem,""
  AccordionTrigger,"""
} from "@/components/ui/accordion;
import {
  Form,
  FormControl,"
  FormField,"""
  FormItem,""
  FormLabel,"""
  FormMessage,""
} from @/components/ui/form"";""
import {""Switch} from "@/components/ui/switch;"""
import {"Textarea} from ""@/components/ui/textarea;""""
import {useForm"} from react-hook-form;"""
import {zodResolver"} from @hookform/resolvers/zod;""""
import {z""} from zod";
import { 
  User, Heart, Clock, Star, MapPin, Phone, Mail, 
  Calendar, CreditCard, Bell, Shield, Settings,
  Trash2, Edit, Plus, Gift, Search, Filter,
  Download, QrCode, Printer, Trophy, Crown,"
  ChevronLeft, ChevronRight, Eye, EyeOff"""
} from 'lucide-react;""
import {useToast""} from "@/hooks/use-toast;"""
import {"useWebSocket} from ""@/hooks/useWebSocket;""
import QRCode from ""qrcode.react;""
import {""useReactToPrint} from "react-to-print;"""
import * as XLSX from "xlsx;"""
""
// Schéma de validation amélioré"""
const userProfileSchema = z.object({""
  firstName: z.string().min(2, ""Le prénom doit contenir au moins 2 caractères),""
  lastName: z.string().min(2, ""Le nom doit contenir au moins 2 caractères),""
  email: z.string().email(""Email invalide).optional().or(z.literal(")),"""
  phone: z.string().regex(/^(\+?\d{8,15})$/, Numéro de téléphone invalide").optional().or(z.literal()),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  birthDate: z.string().refine((date) => {
    if (!date) return true;"
    const birthDate: unknown = new Date(date);"""
    const today: unknown = new Date();""
    const age: unknown = today.getFullYear() - birthDate.getFullYear();"""
    return age >= 0 && age <= 120;""
  }, ""Date de naissance invalide),
  preferences: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    promotionalEmails: z.boolean(),
    favoriteTable: z.number().optional(),
    dietaryRestrictions: z.array(z.string()),
    allergens: z.array(z.string()),
    language: z.string(),"
    currency: z.string(),""
  }),"""
});""
"""
const addressSchema = z.object({""
  street: z.string().min(1, ""Ladresse est requise"),"""
  city: z.string().min(1, La ville est requise"),"""
  postalCode: z.string().min(1, Le code postal est requis"),"""
  country: z.string().min(1, Le pays est requis"),"""
  type: z.enum([home", work"", other"]),
});

// Interfaces TypeScript améliorées
interface UserProfile  {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address? : string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  avatar?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
    favoriteTable?: number;
    dietaryRestrictions: string[];
    allergens: string[];
    language: string;
    currency: string;
  
};
  loyalty: {
    points: number;
    level: string;
    nextLevelPoints: number;
    totalSpent: number;
    visitsCount: number;
    joinDate: string;
  };
  paymentMethods: PaymentMethod[];
  addresses: Address[];
  orderHistory: OrderHistory[];
  isActive: boolean;
  lastActivity?: string;"
}"""
""
interface PaymentMethod  {"""
  id: number;""
  type"" : card" | paypal"" | cash";
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;

}

interface Address  {"
  id: number;"""
  street: string;""
  city: string;"""
  postalCode: string;""
  country: string;"""
  type" : home"" | work" | other"";
  isDefault: boolean;

}

interface OrderHistory  {
  id: number;
  date: string;
  amount: number;
  status: string;
  items: OrderItem[];

}

interface OrderItem  {
  id: number;
  name: string;
  quantity: number;
  price: number;

}"
""
export default export function UserProfileEnhanced(): JSX.Element  {"""
  const {"apiRequest} = useAuth();"""
  const queryClient: unknown = useQueryClient();""
  const {toast""} = useToast();"
  const printRef: unknown = React.useRef<HTMLDivElement>(null);""
  """
  // États locaux pour la gestion UI""
  const [selectedUser, setSelectedUser] = useState<unknown><unknown><unknown><UserProfile | null>(null);"""
  const [searchTerm, setSearchTerm] = useState<unknown><unknown><unknown>();""
  const [sortBy, setSortBy] = useState<unknown><unknown><unknown><joinDate"" | points" | totalSpent"" | name">(joinDate"");
  const [currentPage, setCurrentPage] = useState<unknown><unknown><unknown>(1);
  const [showInactive, setShowInactive] = useState<unknown><unknown><unknown>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<unknown><unknown><unknown>(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState<unknown><unknown><unknown>(false);
  const [editingAddress, setEditingAddress] = useState<unknown><unknown><unknown><Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<unknown><unknown><unknown><Address | null>(null);
  const [showQRCode, setShowQRCode] = useState<unknown><unknown><unknown>(false);
  const [exporting, setExporting] = useState<unknown><unknown><unknown>(false);
  
  const usersPerPage: unknown = 12;"
""
  // Récupération des utilisateurs"""
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({""""
    queryKey: [user-profiles"],"""
    queryFn: async () => {""
      const response: unknown = await apiRequest(""/api/admin/user-profiles);
      return response.json();
    },
  });

  // Formulaires avec validation"
  const profileForm = useForm<z.infer<typeof userProfileSchema>>({""
    resolver: zodResolver(userProfileSchema),"""
    defaultValues: {""
      firstName: "","
  ""
      lastName: "","
  ""
      email: "","
  ""
      phone: "","
  """"
      address: ,""
      city: ,""""
      postalCode: ,"""
      birthDate: ",
      preferences: {
        emailNotifications: true,"
        smsNotifications: false,"""
        promotionalEmails: true,""
        dietaryRestrictions: [],"""
        allergens: [],""
        language: fr"",
        currency: EUR,
      },
    },
  });
"
  const addressForm = useForm<z.infer<typeof addressSchema>>({""
    resolver: zodResolver(addressSchema),"""
    defaultValues: {""
      street: ,"""
      city: ,""
      postalCode: ,"""
      country: France","
  """
      type: home"
};,
  });

  // Mutations pour les opérations CRUD"
  const updateUserMutation = useMutation({"""
    mutationFn: async (data: { id: number; updates: Partial<UserProfile> }) => {""
      const response = await apiRequest(`/api/admin/user-profiles/${data.id}`, {""
        method: PUT,"
        body: JSON.stringify(data.updates),""
      });"""
      return response.json();""
    },"""
    onSuccess: () => {""
      queryClient.invalidateQueries({ queryKey: [""user-profiles] });""
      toast({"""
        title: Profil mis à jour,"
        message: Le profil utilisateur a été mis à jour avec succès,
      });
      setIsEditDialogOpen(false);"
    },"""
  });""
"""
  const addAddressMutation = useMutation({""
    mutationFn: async (data: { userId: number; address: Omit<Address, ""id> }) => {""
      const response = await apiRequest(`/api/admin/user-profiles/${data.userId}/addresses`, {""
        method: POST,
        body: JSON.stringify(data.address),
      });"
      return response.json();""
    },"""
    onSuccess: () => {""
      queryClient.invalidateQueries({ queryKey: [""user-profiles] });""
      toast({"""
        title: "Adresse ajoutée,"""
        message: Ladresse a été ajoutée avec succès"
};);
      setIsAddressDialogOpen(false);
      addressForm.reset();
    },
  });"
"""
  const deleteAddressMutation = useMutation({""
    mutationFn: async (addressId: number) => {"""
      const response = await apiRequest(`/api/admin/addresses/${"addressId}`, {""
        method: DELETE,"
      });""
      return response.json();"""
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: ["user-profiles] });"""
      toast({""
        title: ""Adresse supprimée,""""
        message: Ladresse a été supprimée avec succès"
};);
      setAddressToDelete(null);
    },
  });

  // Filtrage et tri des utilisateurs (mémorisé)
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((((user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase(: unknown: unknown: unknown) => => =>.includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesActiveFilter: unknown = showInactive || user.isActive;
      
      return matchesSearch && matchesActiveFilter;
    });

    // Tri"
    filtered.sort((a, b) => {"""
      switch (sortBy) {""
        case name: return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);"""
        case "joinDate:"""
          return new Date(b.loyalty.joinDate).getTime() - new Date(a.loyalty.joinDate).getTime();""
        case ""points: return b.loyalty.points - a.loyalty.points;
        case totalSpent: return b.loyalty.totalSpent - a.loyalty.totalSpent;
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, searchTerm, showInactive, sortBy]);

  // Pagination
  const paginatedUsers: unknown = useMemo(() => {
    const startIndex: unknown = (currentPage - 1) * usersPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredAndSortedUsers, currentPage, usersPerPage]);

  const totalPages: unknown = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

  // Fonctions utilitaires
  const calculateAge = useCallback((birthDate: string) => {
    if (!birthDate) return null;
    const today: unknown = new Date();
    const birth: unknown = new Date(birthDate);
    const age: unknown = today.getFullYear() - birth.getFullYear();
    const monthDiff: unknown = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  }, []);"
""
  const getLoyaltyBadge = useCallback((level: string, points: number) => {"""
    const badges = {""
      ""Bronze: { icon: Trophy, color: bg-amber-100 text-amber-800" },"""
      Silver: { icon: Trophy, color: "bg-gray-100 text-gray-800 },"""
      "Gold: { icon: Crown, color: bg-yellow-100 text-yellow-800"" },""
      ""Platinum: { icon: Crown, color: bg-purple-100 text-purple-800" },"""
      Diamond": { icon: Crown, color: bg-blue-100 text-blue-800 },"""
    };""
    """
    const badge: unknown = badges[level as keyof typeof badges] || badges["Bronze];"
    const IconComponent: unknown = badge.icon;"""
    ""
    return ("""
      <Badge className={`${badge.color} flex items-center gap-1`}></Badge>""
        <IconComponent className=""h-3 w-3" ></IconComponent>"""
        {level"} ({points""} pts)
      </Badge>
    );
  }, []);"
""
  const formatCurrency = (props: formatCurrencyProps): JSX.Element  => {"""
    return new Intl.NumberFormat(fr-FR, {""""
      style: currency","
  """
      currency: EUR"
};).format(amount);
  };

  // Gestion des formulaires
  const handleEditUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      birthDate: user.birthDate,
      preferences: user.preferences,
    });
    setIsEditDialogOpen(true);
  }, [profileForm]);

  const handleUpdateUser = useCallback(async (data: z.infer<typeof userProfileSchema>) => {
    if (!selectedUser) return;
    
    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      updates: data,
    });
  }, [selectedUser, updateUserMutation]);

  const handleAddAddress = useCallback(async (data: z.infer<typeof addressSchema>) => {
    if (!selectedUser) return;
    
    await addAddressMutation.mutateAsync({
      userId: selectedUser.id,"
      address: { ...data, id: 0, isDefault: false },"""
    });""
  }, [selectedUser, addAddressMutation]);"""
"
  // Fonctions dimpression et export
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Profil-${selectedUser? .firstName}-${selectedUser?.lastName}`,
  });

  const handleExportProfile: unknown = useCallback(async () => {
    if (!selectedUser) return;"
    """
    setExporting(true);""
    try {""'"
      const profileData =  {"''"
        ""Informations personnelles: {''"'""'"
          ''Prénom: selectedUser.firstName,"'"
          ""Nom: selectedUser.lastName,"""''"
          "Email: selectedUser.email,""'''"
          "Téléphone: selectedUser.phone,""'"'''"
          ""Âge: calculateAge(selectedUser.birthDate || ") || Non renseigné"",'"'''"
          Date d""inscription: new Date(selectedUser.loyalty.joinDate).toLocaleDateString("fr-FR ||  ||  || '),""''"''"
          ""Dernière activité: selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleDateString("fr-FR || '' ||  || ') : ""Inconnue,""
          ""Statut: selectedUser.isActive ? "Actif : ""Inactif,""
        },"""
        "Fidélité: {"""
          "Niveau: selectedUser.loyalty.level,"""
          "Points: selectedUser.loyalty.points,"""
          "Total dépensé: formatCurrency(selectedUser.loyalty.totalSpent),""'"
          "Nombre de visites: selectedUser.loyalty.visitsCount,""''"''"
        },""'''"
        "Historique des commandes: selectedUser.orderHistory.map((((order => ({""'"''""'"'''"
          ""Date: new Date(order.date: unknown: unknown: unknown) => => =>.toLocaleDateString("fr-FR ||  || ' || ),"""
          "Montant: formatCurrency(order.amount),""""
          ""Statut: order.status,""
          ""Articles: order.items.map((((item => `${item.name} (${item.quantity}: unknown: unknown: unknown) => => =>`).join(", ),
        })),
      };"
"""
      const wb: unknown = XLSX.utils.book_new();""
      """
      // Feuille informations personnelles""
      const personalWS: unknown = XLSX.utils.json_to_sheet([profileData[""Informations personnelles]]);""""
      XLSX.utils.book_append_sheet(wb, personalWS, "Informations personnelles);"
      """
      // Feuille fidélité""
      const loyaltyWS: unknown = XLSX.utils.json_to_sheet([profileData[""Fidélité]]);""
      XLSX.utils.book_append_sheet(wb, loyaltyWS, ""Fidélité);""
      """
      // Feuille commandes"'"
      const ordersWS: unknown = XLSX.utils.json_to_sheet(profileData[""Historique des commandes]);"''""'"'''"
      XLSX.utils.book_append_sheet(wb, ordersWS, ""Commandes);''
      '''
      const fileName: unknown = `profil-${selectedUser.firstName}-${selectedUser.lastName}-${new Date().toISOString( || ' ||  || '').split(T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);"
      ""
      toast({"""
        title: "Export réussi,"""
        description: `Le profil a été exporté dans ${fileName"}`,
      });"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"""
      toast({""
        title: ""Erreur dexport","
  """
        description: Impossible d"exporter le profil,"""
        variant: "destructive,
      });
    } finally {
      setExporting(false);
    }'"
  }, [selectedUser, calculateAge, formatCurrency, toast]);''""''"
''"'"
  if (isLoading && typeof isLoading !== undefined' && typeof isLoading && typeof isLoading !== undefined'' !== undefined' && typeof isLoading && typeof isLoading !== undefined'' && typeof isLoading && typeof isLoading !== undefined' !== undefined'' !== undefined') {"""
    return (""
      <div className=""flex items-center justify-center h-64></div>""
        <div className=text-center""></div>""
          <div className=""animate-spin" rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto></div>"""
          <p className="mt-4 text-gray-600>Chargement des profils utilisateurs...</p>
        </div>'
      </div>'''
    );''
  }'''"
'""''"'"
  if (error && typeof error !== undefined' && typeof error && typeof error !== undefined'' !== undefined' && typeof error && typeof error !== undefined'' && typeof error && typeof error !== undefined' !== undefined'' !== undefined') {"""
    return (""""
      <div className=text-center" py-8></div>"""
        <p className="text-red-600"">Erreur lors du chargement des profils utilisateurs</p>""
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: [user-profiles""] })}>
          Réessayer
        </Button>
      </div>
    );"
  }""
"""
  return (""
    <div className=""space-y-6></div>""
      {/* En-tête avec recherche et filtres */}""""
      <div className=flex"" flex-col space-y-4></div>""
        <div className=""flex justify-between items-center></div>""
          <div></div>"""
            <h2 className="text-2xl"" font-bold flex items-center gap-2"></h2>"""
              <User className="h-6 w-6 ></User>"""
              Profils Utilisateurs""
            </h2>"""
            <p className="text-gray-600></p>
              Gestion avancée des profils clients ({filteredAndSortedUsers.length} utilisateurs)
            </p>
          </div>"
        </div>"""
        ""
        {/* Barre de recherche et filtres */}"""
        <Card></Card>""
          <CardContent className=""pt-6></CardContent>""
            <div className=flex"" flex-wrap gap-4 items-center"></div>"""
              <div className="flex-1 min-w-64></div>"""
                <div className=relative"></div>"""
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 ></Search>"""
                  <Input""
                    placeholder=""Rechercher" par nom, prénom, email..."""
                    value={searchTerm"}"""
                    onChange="{(e) => setSearchTerm(e.target.value)}"""
                    className=pl-10""""
                    aria-label="Rechercher un utilisateur
                  />"
                </div>"""
              </div>""
              """
              <Select value={sortBy"}"" onValueChange={(value) => setSortBy(value as any)}>""
                <SelectTrigger className=""w-48></SelectTrigger>""
                  <SelectValue placeholder=""Trier" par"" ></SelectValue>""
                </SelectTrigger>"""
                <SelectContent></SelectContent>"'"
                  <SelectItem value=""joinDate">Date d""inscription</SelectItem>"'''"
                  <SelectItem value=""points">Points de fidélité</SelectItem>""'"'''"
                  <SelectItem value=""totalSpent>Total dépensé</SelectItem>'"''"""
                  <SelectItem value=name">Nom alphabétique</SelectItem>"""
                </SelectContent>""
              </Select>"""
              ""
              <div className=""flex items-center space-x-2"></div>"""
                <Switch""
                  id=""show-inactive""
                  checked={showInactive""}""
                  onCheckedChange={setShowInactive""}""
                ></Switch>"""
                <label htmlFor="show-inactive className=""text-sm"></label>
                  Afficher les utilisateurs inactifs
                </label>
              </div>
            </div>
          </CardContent>
        </Card>"
      </div>"""
""
      {/* Grille des utilisateurs */}""""
      <div className=grid"" grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4></div>""
        {paginatedUsers.map(((((user: unknown: unknown: unknown) => => => => (""""
          <Card key={user.id} className=cursor-pointer"" hover:shadow-md transition-shadow"></Card>"""
            <CardContent className="p-4""></CardContent>""
              <div className=""flex items-center space-x-3 mb-3></div>""
                <Avatar className=""h-12 w-12></Avatar>""""
                  <AvatarFallback className=bg-blue-100" text-blue-600></AvatarFallback>"
                    {user.firstName[0]}{user.lastName[0]}"""
                  </AvatarFallback>""
                </Avatar>"""
                <div className="flex-1></div>"""
                  <h3 className="font-semibold>{user.firstName} {user.lastName}</h3>""""
                  <p className=text-sm"" text-gray-600>{user.email}</p>""
                </div>""""
                <div className=flex"" items-center gap-1></div>""
                  {user.isActive ? (""""
                    <Eye className=h-4"" w-4 text-green-500" ></Eye>"""
                  ) : (""
                    <EyeOff className=""h-4 w-4 text-red-500" ></EyeOff>
                  )}
                </div>"
              </div>"""
              ""
              <div className=""space-y-2 mb-3></div>""
                {getLoyaltyBadge(user.loyalty.level, user.loyalty.points)}"""
                <div className="flex justify-between text-sm""></div>""
                  <span>Dépenses:</span>"""
                  <span className="font-semibold"">{formatCurrency(user.loyalty.totalSpent)}</span>""
                </div>"""
                <div className="flex justify-between text-sm></div>"""
                  <span>Visites:</span>""
                  <span className=""font-semibold>{user.loyalty.visitsCount}</span>""
                </div>"""
                {user.birthDate && (""
                  <div className=""flex justify-between text-sm"></div>"""
                    <span>Âge:</span>""
                    <span className=""font-semibold>{calculateAge(user.birthDate)} ans</span>
                  </div>
                )}
              </div>"
              ""
              <Button """
                variant=outline" """
                size=sm" """
                className="w-full
                onClick={() => setSelectedUser(user)}
              >
                Voir le profil
              </Button>
            </CardContent>
          </Card>
        ))}"
      </div>"""
""
      {/* Pagination */}"""
      {totalPages > 1 && (""
        <div className=""flex justify-center items-center space-x-2"></div>"""
          <Button""
            variant=outline"""
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}"""
            disabled={currentPage === 1}""
          >""""
            <ChevronLeft className=h-4"" w-4" ></ChevronLeft>"
          </Button>"""
          ""
          <span className=""px-4" py-2 text-sm></span>"""
            Page {"currentPage} sur {""totalPages}"
          </span>""
          """
          <Button""
            variant=""outline""
            size=""sm""
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}"""
            disabled={currentPage === totalPages}""
          >"""
            <ChevronRight className="h-4 w-4"" ></ChevronRight>
          </Button>
        </div>"
      )}""
"""
      {/* Dialog de détail utilisateur */}""
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>"""
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto></DialogContent>"""
          <DialogHeader></DialogHeader>""
            <DialogTitle className=""flex items-center gap-2"></DialogTitle>"""
              <Avatar className="h-8 w-8""></Avatar>""
                <AvatarFallback className=""bg-blue-100 text-blue-600></AvatarFallback>
                  {selectedUser?.firstName[0]}{selectedUser?.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription></DialogDescription>
              Profil détaillé du client
            </DialogDescription>"
          </DialogHeader>""
          """
          {selectedUser && (""
            <div ref={printRef""} className=space-y-4"></div>"""
              {/* Actions */}""
              <div className=""flex flex-wrap gap-2"></div>"""
                <Button""
                  variant=""outline""
                  size=""sm""
                  onClick={() => handleEditUser(selectedUser)}"""
                  aria-label=Modifier le profil""
                >"""
                  <Edit className="h-4 w-4 mr-2 ></Edit>"""
                  Modifier""
                </Button>"""
                <Button""
                  variant=""outline""""
                  size=sm""
                  onClick={() => setShowQRCode(true)}""""
                  aria-label=Générer QR Code"""
                >""""
                  <QrCode className=h-4" w-4 mr-2"" ></QrCode>
                  QR Code"
                </Button>""
                <Button"""
                  variant=outline""""
                  size=sm""
                  onClick={""handlePrint}""""
                  aria-label=Imprimer le profil""
                ></Button>"""
                  <Printer className="h-4 w-4 mr-2"" ></Printer>
                  Imprimer"
                </Button>""
                <LoadingButton"""
                  variant=outline""""
                  size=sm""
                  loading={exporting""}""
                  loadingText=Export..."""
                  onClick={handleExportProfile"}"""
                  aria-label="Exporter le profil"""
                ></LoadingButton>""
                  <Download className=""h-4 w-4 mr-2 ></Download>
                  Export
                </LoadingButton>"
              </div>""
"""
              {/* Contenu du profil avec accordéon */}""
              <Accordion type=""multiple" defaultValue={[profile, ""loyalty, orders"]}></Accordion>"""
                <AccordionItem value="profile></AccordionItem>"""
                  <AccordionTrigger className="text-lg font-semibold></AccordionTrigger>"
                    Informations personnelles"""
                  </AccordionTrigger>""
                  <AccordionContent></AccordionContent>"""
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4""></div>""
                      <div className=""space-y-2></div>""
                        <div className=""flex items-center gap-2></div>""
                          <Mail className=""h-4" w-4 ></Mail>"""
                          <span>{selectedUser.email}</span>""
                        </div>"""
                        <div className="flex items-center gap-2></div>"""
                          <Phone className="h-4 w-4 ></Phone>"""
                          <span>{selectedUser.phone}</span>""
                        </div>"""
                        {selectedUser.birthDate && (""
                          <div className=""flex items-center gap-2"></div>"""
                            <Calendar className="h-4 w-4 ></Calendar>
                            <span>{calculateAge(selectedUser.birthDate)} ans</span>
                          </div>"
                        )}"""
                      </div>""
                      <div className=""space-y-2"></div>"""
                        <div className="flex items-center gap-2""></div>""
                          <MapPin className=""h-4 w-4 ></MapPin>""
                          <span>{selectedUser.address || ""Adresse non renseignée}</span>""
                        </div>"""'"
                        <div className=flex"" items-center gap-2></div>"''"
                          <Clock className=""h-4 w-4 ></Clock>"''""'"'"
                          <span></span>""'''"
                            Dernière activité: {selectedUser.lastActivity ? "'""''"'"
                              new Date(selectedUser.lastActivity).toLocaleDateString(""fr-FR || ' ||  || '') : Inconnue"
                            }
                          </span>
                        </div>
                      </div>
                    </div>"
                  </AccordionContent>"""
                </AccordionItem>""
"""
                <AccordionItem value="loyalty""></AccordionItem>""
                  <AccordionTrigger className=""text-lg font-semibold></AccordionTrigger>""
                    Programme de fidélité"""
                  </AccordionTrigger>""
                  <AccordionContent></AccordionContent>"""
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4""></div>""
                      <div className=""space-y-3></div>""
                        {getLoyaltyBadge(selectedUser.loyalty.level, selectedUser.loyalty.points)}"""
                        <div className="space-y-2></div>"""
                          <div className="flex justify-between></div>"""
                            <span>Total dépensé:</span>""
                            <span className=""font-semibold">{formatCurrency(selectedUser.loyalty.totalSpent)}</span>"""
                          </div>""
                          <div className=""flex justify-between></div>""
                            <span>Nombre de visites:</span>"""
                            <span className="font-semibold>{selectedUser.loyalty.visitsCount}</span>"""
                          </div>""
                          <div className=""flex justify-between></div>""
                            <span>Points actuels:</span>"""
                            <span className="font-semibold"">{selectedUser.loyalty.points}</span>""
                          </div>"""
                          <div className="flex justify-between></div>"""
                            <span>Prochain niveau:</span>""
                            <span className=""font-semibold>{selectedUser.loyalty.nextLevelPoints - selectedUser.loyalty.points} pts</span>""
                          </div>"""
                        </div>""
                      </div>"""
                      <div className="space-y-2></div>""'"
                        <div className="flex justify-between></div>""''"
                          <span>Membre depuis:</span>"''""'"'"
                          <span className=font-semibold""></span>"''""'"'''"
                            {new Date(selectedUser.loyalty.joinDate).toLocaleDateString(fr-FR"" ||  || ' || )}""
                          </span>"""
                        </div>""
                        <div className=flex"" justify-between></div>""
                          <span>Panier moyen:</span>"""
                          <span className=font-semibold"></span>
                            {formatCurrency(selectedUser.loyalty.totalSpent / selectedUser.loyalty.visitsCount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>"
                  </AccordionContent>"""
                </AccordionItem>""
""""
                <AccordionItem value=orders""></AccordionItem>""
                  <AccordionTrigger className=""text-lg font-semibold></AccordionTrigger>""
                    Historique des commandes ({selectedUser.orderHistory.length})"""
                  </AccordionTrigger>""
                  <AccordionContent></AccordionContent>"""
                    <div className="space-y-3></div>"""
                      {selectedUser.orderHistory.slice(0, 5).map(((((order: unknown: unknown: unknown) => => => => (""
                        <div key={order.id} className=""border rounded-lg p-3></div>""
                          <div className=flex"" justify-between items-start mb-2"></div>"""
                            <div></div>"'"
                              <div className=""font-semibold></div>"'''"
                                Commande #{order.id}""'"'"
                              </div>""''"''"
                              <div className=""text-sm text-gray-600"></div>""''"'"
                                {new Date(order.date).toLocaleDateString(""fr-FR || ' ||  || '')}""
                              </div>"""
                            </div>""
                            <div className=""text-right></div>""
                              <div className=""font-semibold>{formatCurrency(order.amount)}</div>""
                              <Badge variant={order.status === completed"" ? default" : secondary""}></Badge>
                                {order.status}"
                              </Badge>""
                            </div>"""
                          </div>""
                          <div className=text-sm""></div>"
                            {order.items.map(((((item, index: unknown: unknown: unknown) => => => => (""
                              <span key={item.id}></span>"""
                                {item.quantity}x {item.name}""
                                {index < order.items.length - 1 ? "",  : "}
                              </span>
                            ))}
                          </div>
                        </div>"
                      ))}"""
                      {selectedUser.orderHistory.length > 5 && (""
                        <p className=""text-sm text-gray-600 text-center></p>
                          ... et {selectedUser.orderHistory.length - 5} autres commandes
                        </p>
                      )}"
                    </div>""
                  </AccordionContent>"""
                </AccordionItem>""
"""
                <AccordionItem value="addresses></AccordionItem>"""
                  <AccordionTrigger className=text-lg" font-semibold></AccordionTrigger>"
                    Adresses ({selectedUser.addresses.length})"""
                  </AccordionTrigger>""
                  <AccordionContent></AccordionContent>"""
                    <div className="space-y-3></div>"""
                      {selectedUser.addresses.map(((((address: unknown: unknown: unknown) => => => => (""""
                        <div key={address.id} className=border" rounded-lg p-3 flex justify-between items-start></div>"""
                          <div></div>""""
                            <div className=font-semibold" flex items-center gap-2""></div>""
                              <MapPin className=""h-4 w-4 ></MapPin>""
                              {address.type === ""home ? "Domicile : ""address.type === work" ? Travail"" : Autre"}"""
                              {address.isDefault && <Badge variant="secondary>Par défaut</Badge>}"""
                            </div>""
                            <div className=""text-sm text-gray-600></div>
                              {address.street}<br /></br>
                              {address.postalCode} {address.city}<br /></br>"
                              {address.country}""
                            </div>"""
                          </div>"'"
                          <Button""''"
                            variant=outline"''""'"
                            size="sm'""'''"
                            onClick={() => setAddressToDelete(address)}'"''"""
                            aria-label="Supprimer ladresse"""
                          >""
                            <Trash2 className=h-4"" w-4" ></Trash>
                          </Button>"
                        </div>"""
                      ))}""
                      <Button""""
                        variant=outline"""
                        size=sm""
                        onClick={() => setIsAddressDialogOpen(true)}"""
                        className="w-full"""
                      >""
                        <Plus className=""h-4" w-4 mr-2 ></Plus>
                        Ajouter une adresse
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}"
        </DialogContent>"""
      </Dialog>""
"""
      {/* Dialog QR Code */}""
      <Dialog open={showQRCode""} onOpenChange={setShowQRCode"}></Dialog>"""
        <DialogContent className="max-w-md></DialogContent>
          <DialogHeader></DialogHeader>
            <DialogTitle>QR Code Client</DialogTitle>
            <DialogDescription></DialogDescription>"
              Code QR pour le profil de {selectedUser?.firstName} {selectedUser?.lastName}"""
            </DialogDescription>""
          </DialogHeader>""""
          <div className=flex"" justify-center p-4></div>"
            <QRCode ""
              value={`barista-cafe-user-${selectedUser?.id}`}"" ""
              size={200""}""
              level=""H""
              includeMargin={true""}
            ></QRCode>
          </div>
        </DialogContent>"
      </Dialog>""
"""
      {/* Dialog dédition du profil */}""
      <Dialog open={""isEditDialogOpen} onOpenChange={"setIsEditDialogOpen}></Dialog>"""
        <DialogContent className="max-w-2xl></DialogContent>"""
          <DialogHeader></DialogHeader>""
            <DialogTitle>Modifier le profil</DialogTitle>"""
          </DialogHeader>""
          <Form {...profileForm}></Form>"""
            <form onSubmit="{profileForm.handleSubmit(handleUpdateUser)} className=""space-y-4></form>""
              <div className=""grid grid-cols-1 md:grid-cols-2 gap-4></div>""
                <FormField"""
                  control={profileForm.control}""
                  name=firstName"""
                  render={({"field}) => (
                    <FormItem></FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>"
                  )}"""
                />""
                <FormField"""
                  control={profileForm.control}""
                  name=""lastName""
                  render={({field""}) => (
                    <FormItem></FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}"
                />""
              </div>"""
              """"
              <div className=grid" grid-cols-1 md:grid-cols-2 gap-4></div>"""
                <FormField""
                  control={profileForm.control}"""
                  name="email""""
                  render={({field""}) => (
                    <FormItem></FormItem>"
                      <FormLabel>Email</FormLabel>""
                      <FormControl></FormControl>"""
                        <Input {...field} type="email /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>"
                  )}"""
                />""
                <FormField"""
                  control={profileForm.control}""
                  name=""phone""
                  render={({field""}) => (
                    <FormItem></FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}
                />
              </div>"
""
              <FormField"""
                control={profileForm.control}""""
                name=birthDate""
                render={({""field}) => (""
                  <FormItem></FormItem>"""
                    <FormLabel>Date de naissance</FormLabel>""
                    <FormControl></FormControl>"""
                      <Input {...field} type="date"" /></Input>
                    </FormControl>
                    <FormMessage /></FormMessage>"
                  </FormItem>""
                )}"""
              />""
"""
              <div className="space-y-4></div>"""
                <h4 className=font-semibold">Préférences</h4>"""
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4></div>"""
                  <FormField""
                    control={profileForm.control}"""
                    name="preferences.emailNotifications"""
                    render={({field"}) => ("""
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3></FormItem>"""
                        <div className="space-y-0.5""></div>
                          <FormLabel>Notifications email</FormLabel>
                        </div>
                        <FormControl></FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          ></Switch>
                        </FormControl>
                      </FormItem>
                    )}"
                  />""
                  <FormField"""
                    control={profileForm.control}""
                    name=preferences"".smsNotifications""
                    render={({""field}) => (""
                      <FormItem className=flex"" flex-row items-center justify-between rounded-lg border p-3></FormItem>""
                        <div className=""space-y-0.5></div>
                          <FormLabel>Notifications SMS</FormLabel>
                        </div>
                        <FormControl></FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          ></Switch>
                        </FormControl>
                      </FormItem>
                    )}"
                  />""
                </div>"""
              </div>""
"""
              <div className="flex justify-end space-x-2></div>"""
                <Button type=button" variant=outline onClick={() => setIsEditDialogOpen(false)}>"
                  Annuler"""
                </Button>""
                <LoadingButton""""
                  type=submit""
                  loading={updateUserMutation.isPending}
                  loadingText=Mise à jour...
                ></LoadingButton>
                  Mettre à jour
                </LoadingButton>
              </div>
            </form>
          </Form>
        </DialogContent>"
      </Dialog>""
"""
      {/* Dialog dajout d"adresse */}"""
      <Dialog open={isAddressDialogOpen"} onOpenChange={setIsAddressDialogOpen""}></Dialog>
        <DialogContent></DialogContent>
          <DialogHeader></DialogHeader>
            <DialogTitle>Ajouter une adresse</DialogTitle>"
          </DialogHeader>""
          <Form {...addressForm}></Form>"""
            <form onSubmit={addressForm.handleSubmit(handleAddAddress)}" className=""space-y-4"></form>"""
              <FormField""
                control={addressForm.control}""""
                name=street"""
                render={({field"}) => (
                  <FormItem></FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl></FormControl>
                      <Input {...field} /></Input>
                    </FormControl>
                    <FormMessage /></FormMessage>"
                  </FormItem>"""
                )}""
              />"""
              ""
              <div className=""grid" grid-cols-1 md:grid-cols-2 gap-4></div>"""
                <FormField""
                  control={addressForm.control}"""
                  name=city""""
                  render={({field"}) => (
                    <FormItem></FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}"
                />"""
                <FormField""
                  control={addressForm.control}"""
                  name=postalCode""""
                  render={({field"}) => (
                    <FormItem></FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}"
                />"""
              </div>""
"""
              <div className=grid" grid-cols-1 md:grid-cols-2 gap-4></div>"""
                <FormField""
                  control={addressForm.control}"""
                  name="country"""
                  render={({field"}) => (
                    <FormItem></FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}"
                />"""
                <FormField""
                  control={addressForm.control}""""
                  name=type"""
                  render={({"field}) => ("
                    <FormItem></FormItem>"""
                      <FormLabel>Type</FormLabel>""
                      <Select onValueChange={field.onChange} defaultValue={field.value}></Select>"""
                        <FormControl></FormControl>""
                          <SelectTrigger></SelectTrigger>"""
                            <SelectValue placeholder="Sélectionner"" un type ></SelectValue>"
                          </SelectTrigger>""
                        </FormControl>"""
                        <SelectContent></SelectContent>""""
                          <SelectItem value=home">Domicile</SelectItem>"""
                          <SelectItem value="work>Travail</SelectItem>"""
                          <SelectItem value=other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage /></FormMessage>
                    </FormItem>"
                  )}"""
                />""
              </div>"""
""
              <div className=""flex justify-end space-x-2></div>""
                <Button type=""button" variant=outline onClick={() => setIsAddressDialogOpen(false)}>"
                  Annuler""'"
                </Button>"''"
                <LoadingButton""''"'"
                  type=""submit"''"
                  loading={addAddressMutation.isPending}""''"'"
                  loadingText='Ajout...""
                ></LoadingButton>
                  Ajouter
                </LoadingButton>
              </div>
            </form>
          </Form>
        </DialogContent>"
      </Dialog>""
""
      {/* Dialog de confirmation de suppression dadresse */}"
      <ConfirmationDialog"'"
        open={!!addressToDelete}""'''"
        onOpenChange={() => setAddressToDelete(null)}"'""'"
        title="Supprimer ladresse""''"''"
        description=Êtes-vous sûr de vouloir supprimer cette adresse ? Cette action est irréversible.""''"'"""
        confirmText=Supprimer""
        cancelText=Annuler"""
        onConfirm={() => addressToDelete && deleteAddressMutation.mutate(addressToDelete.id)}""
        loading={deleteAddressMutation.isPending}"""
        variant="destructive
      />"
"""
      {/* Message si aucun utilisateur */}""
      {filteredAndSortedUsers.length === 0 && ("""
        <div className="text-center py-12""></div>""
          <User className=""h-12 w-12 text-gray-400 mx-auto mb-4 ></User>""
          <p className=""text-gray-600>Aucun utilisateur trouvé</p>""
          <p className=""text-sm" text-gray-500></p>
            Essayez de modifier vos critères de recherche ou de filtrage"
          </p>""'"
        </div>"'''"
      )}""'"'"
    </div>""''"''"
  );""''"'"
}""'"''""'"''""'''"