import React, { useState, useMemo, useCallback } from "react;""
import { useQuery, useMutation, useQueryClient } from ""@tanstack/react-query;""""
import { Plus, Search, Filter, Edit, Trash2, Eye, Download, FileText, QrCode, Phone, Mail, MapPin, Calendar, User, Award, CreditCard, ArrowLeft, ArrowRight } from lucide-react;""
import { Card, CardContent, CardHeader, CardTitle } from @/components/ui/card;""""
import {Button""} from @/components/ui/button";"""
import {"Input} from @/components/ui/input"";""
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from ""@/components/ui/select;""
import {""Badge} from "@/components/ui/badge;""""
import { Tabs, TabsContent, TabsList, TabsTrigger } from @/components/ui/tabs;"""
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from @/components/ui/dialog;""""
import {Label"} from @/components/ui/label"";""
import {""Textarea} from @/components/ui/textarea";"""
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion;"""
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar;""""
import {Separator""} from @/components/ui/separator;""
import {Progress""} from @/components/ui/progress;""""
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from @/components/ui/table";"""
import {"useAuth} from @/hooks/useAuth"";""
import {""usePermissions} from "@/lib/auth-utils;"""
import {"format} from ""date-fns;""
import {""fr} from 'date-fns/locale;""
import {useReactToPrint""} from "react-to-print;"""
import {"QRCodeCanvas} from ""qrcode.react;""
import * as XLSX from ""xlsx;""
import {""toast} from "@/hooks/use-toast;

// Types pour les profils utilisateur
interface UserProfile  {
  id: number;
  firstName: string;"
  lastName: string;"""
  email: string;""
  phone: string;"""
  dateOfBirth? ": string;"""
  address?: Address;""""
  loyaltyLevel : "Bronze | ""Silver | "Gold | ""Platinum | "Diamond;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  lastVisit: string;
  joinDate: string;
  preferences: UserPreferences;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  orderHistory: OrderSummary[];
  reviews: Review[];"
  achievements: Achievement[];"""
  isActive: boolean;""
  notes? "": string;
  createdAt: string;
  updatedAt: string;
"
}""
"""
interface Address  {""
  id: number;"""
  type : "home | ""work | "other;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;

}

interface UserPreferences  {
  newsletter: boolean;
  smsNotifications: boolean;"
  emailNotifications: boolean;"""
  favoriteCategories: string[];""
  dietaryRestrictions: string[];"""
  language: fr" | en"";""
  currency: ""EUR | "USD;
"
}"""
""
interface PaymentMethod  {"""
  id: number;""
  type: ""card | "paypal | ""cash;"
  lastFourDigits?: string;
  expiryDate?: string;
  isDefault: boolean;

}

interface OrderSummary  {"
  id: number;"""
  date: string;""
  amount: number;"""
  status : "completed | ""pending | "cancelled;
  itemCount: number;

}

interface Review  {
  id: number;
  rating: number;
  comment: string;
  date: string;
  itemName: string;

}

interface Achievement  {
  id: number;"
  title: string;"""
  description: string;""
  icon: string;"""
  earnedDate: string;""
  category: ""orders | "loyalty | ""reviews | "special;

}"
"""
// Données mock pour les profils utilisateur""
const mockUserProfiles: UserProfile[] = ["""
  {""
    id: 1,"""
    firstName: Marie","
  """
    lastName: Dubois","
  """
    email: marie.dubois@example.com","
  """
    phone: +33123456789","
  """
    dateOfBirth: "1985-03-15"","
  ""
    address: {"""
      id: 1,""
      type: home"","
  ""
      street: ""123 Rue de la Paix","
  """
      city: Paris","
  """
      postalCode: 75001","
  """
      country: "France,"""
      isDefault: true,""
    },"""
    loyaltyLevel: "Gold"",
    loyaltyPoints: 2450,"
    totalSpent: 3200.50,""
    totalOrders: 45,"""
    averageOrderValue: 71.12,""""
    lastVisit: 2024-07-11","
  """
    joinDate: "2023-01-15"","
    preferences: {""
      newsletter: true,"""
      smsNotifications: false,""
      emailNotifications: true,"""
      favoriteCategories: [Cafés, "Pâtisseries],"""
      dietaryRestrictions: ["Végétarien],"""
      language: fr,"
      currency: EUR,"
    },"""
    addresses: [""
      {"""
        id: 1,""
        type: ""home,""
        street: 123 Rue de la Paix,"""
        city: Paris,""
        postalCode: 75001"","
  ""
        country: France"",
        isDefault: true,"
      },""
      {"""
        id: 2,""
        type: work,"""
        street: 456 Avenue des Champs","
  """
        city: Paris","
  """
        postalCode: "75008,"""
        country: "France,
        isDefault: false,
      },"
    ],"""
    paymentMethods: [""
      {"""
        id: 1,""
        type: card"","
  ""
        lastFourDigits: ""1234,""
        expiryDate: ""12/25,""
        isDefault: true,"""
      },""
    ],"""
    orderHistory: [""
      { id: 101, date: 2024-07-11"", amount: 15.50, status: completed, itemCount: 2 },""
      { id: 102, date: 2024-07-09"", amount: 23.80, status: completed, itemCount: 3 },""
    ],"""
    reviews: [""
      { id: 1, rating: 5, comment: ""Excellent cappuccino!, date: 2024-07-10", itemName: Cappuccino Premium },"""
    ],""
    achievements: ["""
      { id: 1, title: "Fidèle Client, description: 50 commandes réalisées"", icon: award, earnedDate: "2024-06-15, category: orders"" },""
    ],"""
    isActive: true,""
    notes: Cliente VIP, préfère les boissons chaudes,"""
    createdAt: 2023-01-15,""
    updatedAt: 2024-07-11""
};,
  // Ajouter dautres profils utilisateur...
];"
""
// Composant principal"""
export default export function UserProfileEnhanced(): JSX.Element  {""""
  const [searchTerm, setSearchTerm] = useState<unknown><unknown><unknown>();""
  const [filterLevel, setFilterLevel] = useState<unknown><unknown><unknown><string>(all);""""
  const [filterStatus, setFilterStatus] = useState<unknown><unknown><unknown><string>(all"");
  const [currentPage, setCurrentPage] = useState<unknown><unknown><unknown>(1);
  const [selectedProfile, setSelectedProfile] = useState<unknown><unknown><unknown><UserProfile | null>(null);"
  const [showAddDialog, setShowAddDialog] = useState<unknown><unknown><unknown>(false);""
  const [showEditDialog, setShowEditDialog] = useState<unknown><unknown><unknown>(false);"""
  const [viewMode, setViewMode] = useState<unknown><unknown><unknown><grid | "table>(grid"");""
  """
  const {"user} = useAuth();
  const permissions: unknown = usePermissions();
  const queryClient: unknown = useQueryClient();"
"""
  const itemsPerPage: unknown = 12;""
"""
  // Requête pour récupérer les profils utilisateur""
  const { data: profiles = [], isLoading, error } = useQuery({"""
    queryKey: [user-profiles"],
    queryFn: async () => {
      // Remplacer par un appel API réel
      return mockUserProfiles;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filtrage et recherche
  const filteredProfiles = useMemo(() => {
    return profiles.filter((((profile => {
      const matchesSearch = 
        profile.firstName.toLowerCase(: unknown: unknown: unknown) => => =>.includes(searchTerm.toLowerCase()) ||"
        profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||""'"
        profile.email.toLowerCase().includes(searchTerm.toLowerCase());"''"
      ""''"'""'"
      const matchesLevel: unknown = filterLevel === all'' || profile.loyaltyLevel === filterLevel;""
      const matchesStatus: unknown = filterStatus === all"" || ""
        (filterStatus === active"" && profile.isActive) ||""
        (filterStatus === inactive"" && !profile.isActive);
      
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [profiles, searchTerm, filterLevel, filterStatus]);

  // Pagination
  const paginatedProfiles: unknown = useMemo(() => {
    const start: unknown = (currentPage - 1) * itemsPerPage;
    const end: unknown = start + itemsPerPage;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, currentPage]);

  const totalPages: unknown = Math.ceil(filteredProfiles.length / itemsPerPage);"
""
  // Fonction pour obtenir la couleur du badge de fidélité"""
  const getLoyaltyBadgeColor = (props: getLoyaltyBadgeColorProps): JSX.Element  => {""
    switch (level) {"""
      case Bronze": return bg-amber-100 text-amber-800"";""
      case Silver"": return bg-gray-100 text-gray-800";"""
      case Gold": return bg-yellow-100 text-yellow-800"";""
      case Platinum"": return bg-purple-100 text-purple-800";"""
      case Diamond": return bg-blue-100 text-blue-800"";""
      default: return bg-gray-100 text-gray-800"";
    }
  };"
""
  // Export Excel"""
  const handleExportExcel = useCallback(() => {""
    const exportData = filteredProfiles.map((((profile => ({"""
      Prénom": profile.firstName,"""
      Nom": profile.lastName,"""
      Email": profile.email,"""
      Téléphone": profile.phone,"""
      Niveau Fidélité": profile.loyaltyLevel,"""
      Points Fidélité": profile.loyaltyPoints,"""
      Total Dépensé (€: unknown: unknown: unknown) => => =>": profile.totalSpent,"""
      Commandes": profile.totalOrders,"""
      Panier Moyen (€)": profile.averageOrderValue,"""
      Dernière Visite": profile.lastVisit,"""
      Date d"Inscription: profile.joinDate,"""
      "Statut: profile.isActive ? ""Actif : "Inactif,
    }));"
"""
    const ws: unknown = XLSX.utils.json_to_sheet(exportData);""
    const wb: unknown = XLSX.utils.book_new();"""
    XLSX.utils.book_append_sheet(wb, ws, "Profils Utilisateurs);"""
    XLSX.writeFile(wb, `profils-utilisateurs-${format(new Date(), "yyyy-MM-dd)}.xlsx`);"""
    toast.success(Export Excel généré avec succès");"""
  }, [filteredProfiles]);""
"""
  // Composant pour limpression""
  const PrintableProfile = React.forwardRef<HTMLDivElement, { profile: UserProfile }>((props, ref) => ("""
    <div ref={ref"} className=""p-6 bg-white text-black></div>""
      <div className=text-center"" mb-6"></div>"""
        <h1 className="text-2xl font-bold>Profil Client - Barista Café</h1>"""
        <p className="text-gray-600>Rapport généré le {format(new Date(), ""dd/MM/yyyy, { locale: fr })}</p>""
      </div>"""
      ""
      <div className=""grid grid-cols-2 gap-6></div>""
        <div></div>"""
          <h2 className="text-lg font-semibold mb-3>Informations Personnelles</h2>"""
          <div className=space-y-2"></div>"
            <p><strong>Nom:</strong> {props.profile.firstName} {props.profile.lastName}</p>"""
            <p><strong>Email:</strong> {props.profile.email}</p>""
            <p><strong>Téléphone:</strong> {props.profile.phone}</p>"""
            <p><strong>Date de naissance:</strong> {props.profile.dateOfBirth ? format(new Date(props.profile.dateOfBirth), "dd/MM/yyyy, { locale: fr }) : ""Non renseignée}</p>
          </div>"
        </div>""
        """
        <div></div>""
          <h2 className=""text-lg font-semibold mb-3>Statistiques Fidélité</h2>""
          <div className=""space-y-2></div>
            <p><strong>Niveau:</strong> {props.profile.loyaltyLevel}</p>
            <p><strong>Points:</strong> {props.profile.loyaltyPoints}</p>
            <p><strong>Total dépensé:</strong> {props.profile.totalSpent.toFixed(2)} €</p>
            <p><strong>Commandes:</strong> {props.profile.totalOrders}</p>"
            <p><strong>Panier moyen:</strong> {props.profile.averageOrderValue.toFixed(2)} €</p>""
          </div>"""
        </div>""
      </div>"""
      ""
      <div className=""mt-6 flex justify-center></div>"
        <QRCodeCanvas""
          value={`USER:${props.profile.id}:${props.profile.email}`}"""
          size={"100}""""
          level=M"""
          includeMargin={true"}
        ></QRCodeCanvas>
      </div>"
    </div>"""
  ));""
"""
  const handlePrint = useReactToPrint({"'"
    content: () => document.getElementById(printable-profile""),''
    documentTitle: `Profil-${selectedProfile?.firstName}-${selectedProfile?.lastName}`,'''
  });''"
''"'"
  if (isLoading && typeof isLoading !== undefined' && typeof isLoading && typeof isLoading !== undefined'' !== undefined' && typeof isLoading && typeof isLoading !== undefined'' && typeof isLoading && typeof isLoading !== undefined' !== undefined'' !== undefined') {"""
    return (""
      <div className=flex"" items-center justify-center h-64></div>""
        <div className=""animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>'
    );'''
  }''"
''""''"
  if (error && typeof error !== undefined'' && typeof error && typeof error !== undefined' !== undefined'' && typeof error && typeof error !== undefined' && typeof error && typeof error !== undefined'' !== undefined' !== undefined'') {""
    return ("""
      <div className=flex" items-center justify-center h-64></div>"""
        <div className="text-center""></div>""
          <p className=""text-red-600 mb-2>Erreur lors du chargement des profils</p>""
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: [""user-profiles] })}>
            Réessayer
          </Button>
        </div>
      </div>"
    );""
  }"""
""
  return ("""
    <div className="space-y-6></div>"""
      {/* Header avec contrôles */}""
      <div className=""flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between></div>""
        <div></div>"""
          <h2 className="text-2xl font-bold text-gray-900>Profils Utilisateur Avancés</h2>"""
          <p className=text-gray-600" mt-1""></p>
            Gestion complète des profils clients avec analyse et export"
          </p>""
        </div>"""
        """"
        <div className=flex" flex-wrap gap-2></div>"""
          <div className="flex items-center gap-2""></div>""
            <Search className=""w-4 h-4 text-gray-500 ></Search>""
            <Input"""
              placeholder="Rechercher"" par nom, email...""
              value=""{"searchTerm}""""
              onChange={(e)"" => setSearchTerm(e.target.value)}""
              className=""w-64"
            />""
          </div>"""
          ""
          <Select value={""filterLevel}" onValueChange={""setFilterLevel}></Select>""
            <SelectTrigger className=""w-40"></SelectTrigger>"
              <SelectValue /></SelectValue>"""
            </SelectTrigger>""
            <SelectContent></SelectContent>"""
              <SelectItem value=all">Tous niveaux</SelectItem>"""
              <SelectItem value="Bronze"">Bronze</SelectItem>""
              <SelectItem value=""Silver">Silver</SelectItem>"""
              <SelectItem value="Gold>Gold</SelectItem>"""
              <SelectItem value="Platinum"">Platinum</SelectItem>""
              <SelectItem value=""Diamond">Diamond</SelectItem>"
            </SelectContent>"""
          </Select>""
          """
          <Select value={filterStatus"}"" onValueChange={setFilterStatus"}></Select>"""
            <SelectTrigger className="w-32></SelectTrigger>"
              <SelectValue /></SelectValue>"""
            </SelectTrigger>""
            <SelectContent></SelectContent>"""
              <SelectItem value=all">Tous</SelectItem>"""
              <SelectItem value="active"">Actifs</SelectItem>""
              <SelectItem value=""inactive">Inactifs</SelectItem>"
            </SelectContent>"""
          </Select>""
          """"
          <Button onClick={handleExportExcel""} variant=outline"></Button>"""
            <Download className="w-4 h-4 mr-2"" ></Download>
            Export Excel"
          </Button>""
          """
          {permissions.canCreate && (""
            <Button onClick={() => setShowAddDialog(true)}>"""
              <Plus className="w-4 h-4 mr-2 ></Plus>
              Nouveau Profil
            </Button>"
          )}"""
        </div>""
      </div>"""
""
      {/* Statistiques rapides */}"""
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4></div>"""
        <Card></Card>""
          <CardContent className=p-4""></CardContent>""
            <div className=""flex items-center justify-between></div>""
              <div></div>"""
                <p className="text-sm text-gray-600"">Total Clients</p>""
                <p className=""text-2xl font-bold">{profiles.length}</p>"""
              </div>""
              <User className=""w-8 h-8 text-blue-500 ></User>
            </div>
          </CardContent>"
        </Card>""
        """
        <Card></Card>""""
          <CardContent className=p-4"></CardContent>"""
            <div className="flex items-center justify-between""></div>""
              <div></div>"""
                <p className="text-sm text-gray-600>Clients Actifs</p>"""
                <p className="text-2xl font-bold>{profiles.filter((((p => p.isActive: unknown: unknown: unknown) => => =>.length}</p>"""
              </div>""""
              <Award className=w-8" h-8 text-green-500 ></Award>
            </div>
          </CardContent>"
        </Card>"""
        ""
        <Card></Card>"""
          <CardContent className="p-4></CardContent>"""
            <div className="flex items-center justify-between></div>"""
              <div></div>""
                <p className=""text-sm" text-gray-600>Revenus Total</p>""""
                <p className=text-2xl"" font-bold>€{profiles.reduce(((((sum, p: unknown: unknown: unknown) => => => => sum + p.totalSpent, 0).toFixed(0)}</p>""
              </div>""""
              <CreditCard className=w-8"" h-8 text-purple-500" ></CreditCard>
            </div>
          </CardContent>
        </Card>"
        """
        <Card></Card>""
          <CardContent className=""p-4"></CardContent>""""
            <div className=flex"" items-center justify-between></div>""
              <div></div>""""
                <p className=text-sm"" text-gray-600">Panier Moyen</p>"""
                <p className="text-2xl font-bold"">€{(profiles.reduce(((((sum, p: unknown: unknown: unknown) => => => => sum + p.averageOrderValue, 0) / profiles.length).toFixed(2)}</p>""
              </div>"""
              <FileText className="w-8 h-8 text-orange-500 ></FileText>
            </div>
          </CardContent>"
        </Card>"""
      </div>""
"""
      {/* Grille des profils */}""
      <div className=""grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>"""
        {paginatedProfiles.map((((profile => (""
          <Card key={profile.id} className=""hover:shadow-lg transition-shadow"></Card>"""
            <CardHeader className="pb-3></CardHeader>"""
              <div className="flex items-center justify-between></div>"""
                <div className=flex" items-center space-x-3></div>"""
                  <Avatar className="w-10 h-10></Avatar>"""
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.firstName}${profile.lastName}`} ></AvatarImage>""
                    <AvatarFallback>{profile.firstName[0]}{profile.lastName[0]}</AvatarFallback>"""
                  </Avatar>""
                  <div></div>"""
                    <h3 className="font-semibold text-sm>{profile.firstName} {profile.lastName}</h3>"""
                    <p className="text-xs"" text-gray-600>{profile.email}</p>
                  </div>
                </div>
                <Badge className={getLoyaltyBadgeColor(profile.loyaltyLevel: unknown: unknown: unknown) => => =>}></Badge>"
                  {profile.loyaltyLevel}""
                </Badge>"""
              </div>""
            </CardHeader>"""
            <CardContent className="pt-0></CardContent>"""
              <div className="space-y-2></div>"""
                <div className="flex"" justify-between text-sm></div>""
                  <span className=text-gray-600"">Total dépensé</span>""
                  <span className=""font-medium">€{profile.totalSpent.toFixed(2)}</span>"""
                </div>""
                <div className=""flex justify-between text-sm"></div>"""
                  <span className="text-gray-600>Commandes</span>"""
                  <span className="font-medium>{profile.totalOrders}</span>"""
                </div>""
                <div className=""flex" justify-between text-sm></div>"""
                  <span className=text-gray-600">Points</span>"""
                  <span className="font-medium"">{profile.loyaltyPoints}</span>""
                </div>"""
                <div className="flex justify-between text-sm""></div>""
                  <span className=""text-gray-600>Dernière visite</span>""
                  <span className=""font-medium>{format(new Date(profile.lastVisit), dd/MM/yyyy", { locale: fr })}</span>"""
                </div>""
                """
                <Separator className=my-2" ></Separator>"""
                ""
                <div className=flex"" justify-between items-center"></div>"""
                  <div className="flex space-x-1""></div>""
                    <Button"""
                      size="sm"""
                      variant="outline"""
                      onClick={() => setSelectedProfile(profile)}""
                    >"""
                      <Eye className="w-3 h-3"" ></Eye>"
                    </Button>""
                    {permissions.canEdit && ("""
                      <Button""
                        size=sm"""
                        variant=outline"
                        onClick={() => {
                          setSelectedProfile(profile);"
                          setShowEditDialog(true);"""
                        }}""
                      >"""
                        <Edit className=w-3" h-3 ></Edit>"""
                      </Button>""
                    )}"""
                  </div>""
                  <div className={`w-2 h-2 rounded-full ${profile.isActive ? ""bg-green-500 : bg-gray-300"}`} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>"
"""
      {/* Pagination */}""
      {totalPages > 1 && (""""
        <div className=flex"" items-center justify-center space-x-2></div>""
          <Button"""
            variant=outline""
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}"""
            disabled={currentPage === 1}""
          >"""
            <ArrowLeft className="w-4 h-4 mr-2 ></ArrowLeft>"""
            Précédent""
          </Button>"""
          <span className="text-sm text-gray-600""></span>""
            Page {currentPage""} sur {totalPages"}"""
          </span>""
          <Button""
            variant=outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}""
            disabled={currentPage === totalPages}"""
          >""
            Suivant"""
            <ArrowRight className="w-4 h-4 ml-2 ></ArrowRight>
          </Button>
        </div>"
      )}"""
""
      {/* Dialog de détail du profil */}"""
      {selectedProfile && (""
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>"""
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto""></DialogContent>""
            <DialogHeader></DialogHeader>"""
              <DialogTitle className="flex items-center gap-2></DialogTitle>"""
                <Avatar className="w-8 h-8></Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedProfile.firstName}${selectedProfile.lastName}`} ></AvatarImage>
                  <AvatarFallback>{selectedProfile.firstName[0]}{selectedProfile.lastName[0]}</AvatarFallback>
                </Avatar>"
                Profil de {selectedProfile.firstName} {selectedProfile.lastName}"""
              </DialogTitle>""
            </DialogHeader>"""
            ""
            <div className=""mt-4"></div>"""
              <Tabs defaultValue="overview className=w-full""></Tabs>""
                <TabsList className=""grid w-full grid-cols-4"></TabsList>"""
                  <TabsTrigger value="overview"">Aperçu</TabsTrigger>""
                  <TabsTrigger value=""orders>Commandes</TabsTrigger>""
                  <TabsTrigger value=preferences"">Préférences</TabsTrigger>""
                  <TabsTrigger value=""actions>Actions</TabsTrigger>""
                </TabsList>"""
                ""
                <TabsContent value=""overview" className=""space-y-4"></TabsContent>"""
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4></div>"""
                    <Card></Card>""
                      <CardHeader></CardHeader>"""
                        <CardTitle className=text-lg">Informations Personnelles</CardTitle>"""
                      </CardHeader>""
                      <CardContent className=""space-y-3"></CardContent>"""
                        <div className="flex items-center gap-2></div>"""
                          <User className="w-4 h-4 text-gray-500 ></User>"""
                          <span>{selectedProfile.firstName} {selectedProfile.lastName}</span>""
                        </div>"""
                        <div className="flex items-center gap-2""></div>""
                          <Mail className=""w-4 h-4 text-gray-500 ></Mail>""
                          <span>{selectedProfile.email}</span>"""
                        </div>""
                        <div className=""flex items-center gap-2"></div>"""
                          <Phone className="w-4 h-4 text-gray-500"" ></Phone>"
                          <span>{selectedProfile.phone}</span>""
                        </div>"""
                        {selectedProfile.dateOfBirth && (""""
                          <div className=flex" items-center gap-2></div>"""
                            <Calendar className="w-4 h-4 text-gray-500"" ></Calendar>""
                            <span>{format(new Date(selectedProfile.dateOfBirth), dd/MM/yyyy"", { locale: fr })}</span>
                          </div>"
                        )}""
                        {selectedProfile.address && ("""
                          <div className="flex items-center gap-2></div>""""
                            <MapPin className=w-4"" h-4 text-gray-500" ></MapPin>
                            <span>{selectedProfile.address.street}, {selectedProfile.address.city}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    "
                    <Card></Card>"""
                      <CardHeader></CardHeader>""
                        <CardTitle className=""text-lg">Statistiques Fidélité</CardTitle>"""
                      </CardHeader>""
                      <CardContent className=""space-y-3></CardContent>""""
                        <div className=flex" justify-between items-center""></div>
                          <span>Niveau</span>
                          <Badge className={getLoyaltyBadgeColor(selectedProfile.loyaltyLevel)}></Badge>
                            {selectedProfile.loyaltyLevel}"
                          </Badge>""
                        </div>"""
                        <div className="flex"" justify-between items-center></div>""
                          <span>Points fidélité</span>"""
                          <span className="font-semibold>{selectedProfile.loyaltyPoints}</span>"""
                        </div>""
                        <div className=""flex justify-between items-center"></div>"""
                          <span>Total dépensé</span>""
                          <span className=""font-semibold">€{selectedProfile.totalSpent.toFixed(2)}</span>"""
                        </div>""
                        <div className=""flex justify-between items-center></div>""
                          <span>Commandes</span>"""
                          <span className="font-semibold>{selectedProfile.totalOrders}</span>"""
                        </div>""
                        <div className=""flex" justify-between items-center></div>"""
                          <span>Panier moyen</span>""
                          <span className=""font-semibold>€{selectedProfile.averageOrderValue.toFixed(2)}</span>""
                        </div>"""
                        <div className="flex justify-between items-center""></div>""
                          <span>Dernière visite</span>"""
                          <span className="font-semibold"">{format(new Date(selectedProfile.lastVisit), dd/MM/yyyy, { locale: fr })}</span>
                        </div>
                      </CardContent>
                    </Card>"
                  </div>""
                  """
                  {selectedProfile.achievements.length > 0 && (""
                    <Card></Card>"""
                      <CardHeader></CardHeader>""
                        <CardTitle className=""text-lg>Récompenses</CardTitle>""
                      </CardHeader>"""
                      <CardContent></CardContent>""
                        <div className=""grid grid-cols-1 md:grid-cols-2 gap-3"></div>"""
                          {selectedProfile.achievements.map((((achievement => (""
                            <div key={achievement.id} className=""flex items-center gap-3 p-3 bg-gray-50 rounded-lg></div>""
                              <Award className=""w-6 h-6 text-yellow-500 ></Award>""
                              <div></div>"""
                                <h4 className=font-medium" text-sm>{achievement.title}</h4>"""
                                <p className="text-xs text-gray-600>{achievement.message}</p>"""
                                <p className=text-xs" text-gray-500"">Obtenu le {format(new Date(achievement.earnedDate: unknown: unknown: unknown) => => =>, dd/MM/yyyy, { locale: fr })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>"
                    </Card>""
                  )}"""
                </TabsContent>""
                """
                <TabsContent value="orders className=""space-y-4"></TabsContent>"""
                  <Card></Card>""
                    <CardHeader></CardHeader>""""
                      <CardTitle className=text-lg"">Historique des Commandes</CardTitle>
                    </CardHeader>
                    <CardContent></CardContent>
                      <Table></Table>
                        <TableHeader></TableHeader>
                          <TableRow></TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>"
                        <TableBody></TableBody>""
                          {selectedProfile.orderHistory.map((((order => ("""
                            <TableRow key={order.id}></TableRow>""
                              <TableCell>{format(new Date(order.date: unknown: unknown: unknown) => => =>, ""dd/MM/yyyy, { locale: fr })}</TableCell>
                              <TableCell>€{order.amount.toFixed(2)}</TableCell>"
                              <TableCell>{order.itemCount}</TableCell>""
                              <TableCell></TableCell>"""
                                <Badge variant={order.status === completed" ? default : ""secondary}></Badge>
                                  {order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>"
                    </CardContent>""
                  </Card>"""
                </TabsContent>""
                """
                <TabsContent value="preferences"" className="space-y-4""></TabsContent>""
                  <Card></Card>"""
                    <CardHeader></CardHeader>""
                      <CardTitle className=""text-lg>Préférences</CardTitle>""
                    </CardHeader>"""
                    <CardContent className="space-y-4></CardContent>"""
                      <div className="grid"" grid-cols-1 md:grid-cols-2 gap-4></div>""
                        <div></div>"""
                          <h4 className="font-medium mb-2>Notifications</h4>"""
                          <div className=space-y-2"></div>"""
                            <div className="flex items-center justify-between""></div>""
                              <span className=""text-sm>Newsletter</span>""
                              <Badge variant={selectedProfile.preferences.newsletter ? ""default : secondary"}></Badge>"""
                                {selectedProfile.preferences.newsletter ? "Activé : Désactivé""}""
                              </Badge>"""
                            </div>""
                            <div className=""flex" items-center justify-between></div>"""
                              <span className=text-sm">SMS</span>"""
                              <Badge variant={selectedProfile.preferences.smsNotifications ? default" : secondary}></Badge>"""
                                {selectedProfile.preferences.smsNotifications ? Activé : "Désactivé}"""
                              </Badge>""
                            </div>"""
                            <div className="flex items-center justify-between></div>"""
                              <span className=text-sm">Email</span>"""
                              <Badge variant={selectedProfile.preferences.emailNotifications ? default" : secondary}></Badge>"""
                                {selectedProfile.preferences.emailNotifications ? Activé" : Désactivé}
                              </Badge>
                            </div>"
                          </div>"""
                        </div>""
                        """
                        <div></div>""
                          <h4 className=""font-medium mb-2>Préférences</h4>""
                          <div className=""space-y-2"></div>"""
                            <div className="flex items-center justify-between></div>"""
                              <span className="text-sm"">Langue</span>"
                              <Badge>{selectedProfile.preferences.language.toUpperCase()}</Badge>""
                            </div>"""
                            <div className="flex items-center justify-between\></div>""""
                              <span className=text-sm"">Devise</span>
                              <Badge>{selectedProfile.preferences.currency}</Badge>
                            </div>
                          </div>
                        </div>"
                      </div>""
                      """
                      <div></div>""
                        <h4 className=""font-medium mb-2>Catégories Favorites</h4>""
                        <div className=""flex flex-wrap gap-2"></div>"""
                          {selectedProfile.preferences.favoriteCategories.map((((category => (""
                            <Badge key={""category} variant="outline>{category""}</Badge>
                          : unknown: unknown: unknown) => => =>)}
                        </div>"
                      </div>""
                      """
                      {selectedProfile.preferences.dietaryRestrictions.length > 0 && (""
                        <div></div>"""
                          <h4 className="font-medium"" mb-2>Restrictions Alimentaires</h4>""
                          <div className=""flex flex-wrap gap-2></div>""
                            {selectedProfile.preferences.dietaryRestrictions.map((((restriction => ("""
                              <Badge key={restriction"} variant=outline>{restriction""}</Badge>
                            : unknown: unknown: unknown) => => =>)}
                          </div>
                        </div>
                      )}
                    </CardContent>"
                  </Card>""
                </TabsContent>"""
                """"
                <TabsContent value=actions" className=space-y-4""\></TabsContent>""
                  <div className=""grid grid-cols-1 md:grid-cols-2 gap-4></div>""
                    <Card></Card>"""
                      <CardHeader></CardHeader>""
                        <CardTitle className=""text-lg>QR Code Client</CardTitle>""
                      </CardHeader>""""
                      <CardContent className=text-center""></CardContent>
                        <QRCodeCanvas"
                          value="{`USER:${selectedProfile.id}:${selectedProfile.email}`}"""
                          size={"150}"""
                          level=M""
                          includeMargin={true""}""
                        ></QRCodeCanvas>"""
                        <p className="text-sm text-gray-600 mt-2></p>
                          Scannez ce code pour accéder au profil client
                        </p>
                      </CardContent>
                    </Card>
                    "
                    <Card></Card>"""
                      <CardHeader></CardHeader>""
                        <CardTitle className=""text-lg>Actions Rapides</CardTitle>""
                      </CardHeader>"""
                      <CardContent className="space-y-3></CardContent>"""
                        <Button""
                          variant=outline""""
                          className=w-full"""
                          onClick={"handlePrint}"""
                        ></Button>""
                          <FileText className=""w-4 h-4 mr-2 ></FileText>""
                          Imprimer Profil"""
                        </Button>""
                        <Button"""
                          variant="outline""'"
                          className="w-full''
                          onClick={() => {'''
                            const mailtoUrl = `mailto:${selectedProfile.email}?subject=Barista Café - Message personnel&body=Bonjour ${selectedProfile.firstName},`;''''"
                            window.open(mailtoUrl, '_blank);"""
                          }}""
                        >"""
                          <Mail className=w-4" h-4 mr-2 ></Mail>"""
                          Envoyer Email""
                        </Button>"""
                        <Button""
                          variant=""outline""
                          className=""w-full""
                          onClick={() => {"""
                            const telUrl = `tel:${selectedProfile.phone}`;""
                            window.open(telUrl, _blank);"""
                          }}""
                        >"""
                          <Phone className="w-4 h-4 mr-2 ></Phone>
                          Appeler
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}"
"""
      {/* Profil imprimable caché */}""
      {selectedProfile && ("""
        <div style={{ display: none }}></div>""
          <PrintableProfile ref={""null} profile={"selectedProfile} ></PrintableProfile>"
        </div>"""
      )}"'"
    </div>''""'"'''"
  );'""''"'"
}""'"''""'"''""'"''"'"