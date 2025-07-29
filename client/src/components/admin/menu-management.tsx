import React, {"useState} from "react;"""
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query;""""
import {apiRequest""} from @/lib/queryClient;"
import { MenuItem, MenuCategory } from @/types/admin;
import {
  Card,"
  CardContent,"""
  CardHeader,""
  CardTitle,"""
} from "@/components/ui/card;"""
import {Button"} from @/components/ui/button;""""
import {Input""} from @/components/ui/input;""
import {Textarea""} from @/components/ui/textarea";"""
import {"Badge} from @/components/ui/badge"";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,"
  TableHeader,""
  TableRow,""
} from @/components/ui/table;
import {
  Dialog,
  DialogContent,
  DialogHeader,"
  DialogTitle,""
  DialogTrigger,"""
  DialogDescription,""
} from ""@/components/ui/dialog;
import {
  Form,
  FormControl,
  FormField,"
  FormItem,""
  FormLabel,"""
  FormMessage,""
} from @/components/ui/form"";
import {
  Select,
  SelectContent,
  SelectItem,"
  SelectTrigger,""
  SelectValue,"""
} from @/components/ui/select;""""
import {useForm"} from react-hook-form"";""
import {""zodResolver} from @hookform/resolvers/zod";"""
import {"z} from ""zod;""
import { Plus, Pencil, Trash2, Coffee, DollarSign, Package, Image, Upload, Link } from ""lucide-react;""""
import {useToast"} from @/hooks/use-toast;"""
import {useWebSocket"} from @/hooks/useWebSocket;""""
import {usePermissions""} from @/hooks/usePermissions";"""
import {getItemImageUrl"} from '@/lib/image-mapping;

const getImageUrlByName = (name: string): string  => {
  return getItemImageUrl(name);
};"
"""
""
const menuItemSchema = z.object({""""
  name: z.string().min(2, ""Le nom doit contenir au moins 2 caractères),""
  description: z.string().min(10, ""La description doit contenir au moins 10 caractères),""""
  price: z.coerce.number().positive("Le prix doit être supérieur à 0).min(0.01, ""Prix minimum : 0,01€).max(999.99, "Prix maximum : 999,99€),"""
  categoryId: z.coerce.number().min(1, "Veuillez sélectionner une catégorie),
  available: z.boolean(),
  imageUrl: z.string().optional(),"
});"""
""
type MenuItemFormData = z.infer<typeof menuItemSchema>;"""
""
interface MenuManagementProps  {"""
  userRole? " : ""directeur | "employe;

}"
"""
export default /**""
 * MenuManagement - Description de la fonction"""
 * @param {unknown"} params - Paramètres de la fonction"""
 * @returns {unknown"} - Valeur de retour"
 */"""
/**""
 * MenuManagement - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour"
 */"""
/**""
 * MenuManagement - Description de la fonction"""
 * @param {unknown"} params - Paramètres de la fonction"""
 * @returns {unknown"} - Valeur de retour"""
 */""
function MenuManagement({ userRole = ""directeur }: MenuManagementProps) {""
  const {""user} = useAuth();""
  const {""hasPermission} = usePermissions(user);""
  const canDelete: unknown = hasPermission(""menu, "delete);"""
  const [isDialogOpen, setIsDialogOpen] = useState<unknown><unknown><unknown>(false);""
  const [editingItem, setEditingItem] = useState<unknown><unknown><unknown><MenuItem | null>(null);"""
  const [selectedCategory, setSelectedCategory] = useState<unknown><unknown><unknown><string>("all);"""
  const [previewUrl, setPreviewUrl] = useState<unknown><unknown><unknown><string>(");"""
  const [uploading, setUploading] = useState<unknown><unknown><unknown>(false);""
  const [imageManagementItem, setImageManagementItem] = useState<unknown><unknown><unknown><MenuItem | null>(null);"""
  const {toast"} = useToast();
  const queryClient: unknown = useQueryClient();

  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const form = useForm<MenuItemFormData>({"
    resolver: zodResolver(menuItemSchema),"""
    defaultValues: {""
      name: ,"""
      description: ",
      price: 0,
      categoryId: 0,
      available: true,
      imageUrl: ,
    },"
  });"""
""
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({""""
    queryKey: [""/api/menu/items],
  });"
""
  const { data: categories = [] } = useQuery<MenuCategory[]>({"""
    queryKey: ["/api/menu/categories],"
  });"""
""
  const createMutation = useMutation({"""
    mutationFn: async (data: MenuItemFormData) => {""
      const token = localStorage.getItem(""token) || localStorage.getItem("auth_token);"""
      const response = await fetch("/api/admin/menu/items, {"""
        method: "POST,"""
        headers: {""
          ""Content-Type: "application/json,"""
          Authorization: `Bearer ${"token}`
        },"
        body: JSON.stringify(data as string as string as string)"""
      });""
"""
      if (!${1"}) {"""
        throw new Error(`[${path.basename(filePath)}] "Erreur lors de la création);"
      }"""
      return response.json();""
    },"""
    onSuccess: () => {""
      // Forcer le rechargement immédiat des données"""
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items] });"""
      queryClient.invalidateQueries({ queryKey: [/api/menu/categories"] });"""
      queryClient.refetchQueries({ queryKey: ["/api/menu/items] });"""
      setIsDialogOpen(false);""
      setEditingItem(null);"""
      setPreviewUrl(");"""
      form.reset({""
        name: "","
  ""
        description: "",
  "
        price: 0,""
        categoryId: 0,"""
        available: true,""""
        imageUrl: ,""
      });"""
      toast({""
        title: ""Succès,""""
        message: Article de menu créé avec succès"
};);
    },"
    onError: () => {"""
      toast({""
        title: Erreur"","
  """"
        message: Erreur lors de la création de l"article,"""
        variant: destructive"
};);
    },"
  });"""
""
  const updateMutation = useMutation({"""
    mutationFn: async ({ id, data }: { id: number; data: MenuItemFormData }) => {""
      const token: unknown = localStorage.getItem(token"") || localStorage.getItem(auth_token);""
      const response = await fetch(`/api/admin/menu/items/${id""}`, {""
        method: ""PUT,""
        headers: {"""
          Content-Type: application/json,""
          Authorization"": `Bearer ${token"}`
        },
        body: JSON.stringify(data as string as string as string)"
      });"""
""
      if (!${""1}) {""
        throw new Error(`[${path.basename(filePath)}] Erreur lors de la mise à jour);"""
      }""
      return response.json();"""
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items] });"""
      queryClient.refetchQueries({ queryKey: ["/api/menu/items] });"
      setIsDialogOpen(false);"""
      setEditingItem(null);""
      form.reset({"""
        name: ,""
        description: "","
        price: 0,""
        categoryId: 0,"""
        available: true,""
        imageUrl: ,"""
      });""
      toast({"""
        title: Succès","
  """
        message: "Article mis à jour avec succès,
      });"
    },"""
    onError: () => {""
      toast({""""
        title: Erreur"","
  ""
        message: Erreur lors de la mise à jour de l""article,"
        variant: destructive,
      });"
    },"""
  });""
"""
  const deleteMutation = useMutation({""
    mutationFn: async (id: number) => {"""
      const token = localStorage.getItem("token) || localStorage.getItem(auth_token"");""
      const response = await fetch(`/api/admin/menu/items/${id""}`, {""
        method: DELETE"","
  ""
        headers: {"""
          "Authorization: `Bearer ${token""}`,
        }"
      } as string as string as string);""
"""
      if (!${"1}) {""""
        throw new Error(`[${path.basename(filePath)}] Erreur lors de la suppression"");
      }
      return response.json();"
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: [/api/menu/items] });""""
      queryClient.refetchQueries({ queryKey: [/api/menu/items] });""
      toast({""""
        title: Succès"","
  ""
        message: Article supprimé avec succès"""
};);""
    },"""
    onError: () => {""
      toast({"""
        title: Erreur,""
        message: Erreur lors de la suppression de l""article,""
        variant: ""destructive,
      });
    },
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    try {"
      // Créer une URL temporaire pour laperçu""
      const fileUrl: unknown = URL.createObjectURL(file);"""
      setPreviewUrl(fileUrl);""
"""
      // Ici, vous pourriez ajouter l"upload vers un service cloud"""
      // Pour l"instant, on utilise juste lURL temporaire"""
      form.setValue("imageUrl, fileUrl);"""
""
      toast({"""
        title: Image téléchargée","
  """
        message: "Limage a été ajoutée avec succès,"""
      });""
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"""
      toast({""
        title: ""Erreur,""
        message: ""Erreur lors du téléchargement de limage,""
        variant: destructive""
};);
    } finally {
      setUploading(false);
    }
  };"
""
  const onSubmit = (props: onSubmitProps): JSX.Element  => {"""
    // MODIFICATION : Conserver lURL personnalisée de lutilisateur""""
    // Ne remplacer par limage par défaut QUE si aucune URL nest fournie"
    if (!data.imageUrl || data.imageUrl.trim() === ) {
      data.imageUrl = getImageUrlByName(data.name);'
    }''
'''
    if (editingItem && typeof editingItem !== 'undefined && typeof editingItem && typeof editingItem !== ''undefined !== 'undefined && typeof editingItem && typeof editingItem !== ''undefined && typeof editingItem && typeof editingItem !== 'undefined !== ''undefined !== 'undefined) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (props: handleEditProps): JSX.Element  => {
    setEditingItem(item);
    const imageUrl: unknown = (item as any).imageUrl || getImageUrlByName(item.name);
    setPreviewUrl(imageUrl);"
    form.reset({"""
      name: item.name,""
      description: item.message,"""
      price: item.price ? "parseFloat(item.price) : 0,
      categoryId: item.categoryId,
      available: item.available,
      imageUrl: imageUrl,
    });
    setIsDialogOpen(true);"
  };"""
""
  const handleDelete = (props: handleDeleteProps): ""JSX.Element  => {""
    if (confirm(""Êtes-vous sûr de vouloir supprimer cet article ? )) {
      deleteMutation.mutate(id);
    }
  };
"
  const handleImageManagement = (props: handleImageManagementProps): JSX.Element  => {""
    setImageManagementItem(item);"""
  };""
"""
  const openNewDialog = (props: openNewDialogProps)" : JSX.Element => {"""
    setEditingItem(null);""""
    setPreviewUrl();""
    form.reset({""""
      name: ,""
      description: ,"
      price: 0,""
      categoryId: 0,"""
      available: true,""
      imageUrl: ""
};);
    setIsDialogOpen(true);"
  };""
"""
  const filteredItems = selectedCategory === all" """
    ? "menuItems 
    : menuItems.filter(((((item: { id: number; name: string; price: number; description: string; categoryId: number; available: boolean }: unknown: unknown: unknown) => => => => item.categoryId === parseInt(selectedCategory));

  // Calculer les statistiques"
  const totalItems: unknown = menuItems.length;"""
  const availableItems = menuItems.filter(((((item: { id: number; name: string; price: number; description: string; categoryId: number; available: boolean }: unknown: unknown: unknown) => => => => item.available).length;""
  const averagePrice = menuItems.length > 0 """
    ? menuItems.reduce(((((sum: number, item: { id: number; name: string; price: string | number; description: string; categoryId: number; available: boolean }: unknown: unknown : "unknown) => => => => {"""
        const price = typeof item.price === "string ? ""parseFloat(item.price) : (item.price || 0);"'"
        return sum + (isNaN(price) ? 0 : price);""'''"
      }, 0) / menuItems.length "'""'"
     : "0;''""''"
''"'""'"
  if (isLoading && typeof isLoading !== "undefined'' && typeof isLoading && typeof isLoading !== undefined' !== undefined'' && typeof isLoading && typeof isLoading !== undefined' && typeof isLoading && typeof isLoading !== undefined'' !== undefined' !== undefined'') {"""
    return <div className="p-6>Chargement...</div>;"
  }"""
""
  return ("""
    <div className=p-6" space-y-6""></div>""
      {/* En-tête */}"""
      <div className="flex justify-between items-center\></div>"""
        <div></div>""
          <h1 className=""text-2xl font-bold>Gestion du Menu</h1>""
          <p className=""text-muted-foreground">Gérez vos articles de menu et leurs prix</p>"""
        </div>""
        <Dialog open={""isDialogOpen} onOpenChange={(open) => {""
          if (!${""1}) {""
            // Reset form when dialog closes"""
            setEditingItem(null);""
            setPreviewUrl("");""
            form.reset({"""
              name: ","
  """
              description: ",
  "
              price: 0,"""
              categoryId: 0,""
              available: true,""
              imageUrl: ,
            });"
          }""
          setIsDialogOpen(open);"""
        }}>""
          <DialogTrigger asChild></DialogTrigger>"""
            <Button onClick={openNewDialog"}></Button>"""
              <Plus className="h-4 w-4 mr-2 ></Plus>"
              Nouvel Article"""
            </Button>""
          </DialogTrigger>""""
          <DialogContent className=max-w-md""></DialogContent>"
            <DialogHeader></DialogHeader>""
              <DialogTitle></DialogTitle>"""
                {editingItem ? Modifier l"article : ""Nouvel article}""
              </DialogTitle>"""
              <DialogDescription></DialogDescription>""
                {editingItem ? ""Modifiez les informations de cet article de menu : "Créez un nouvel article pour votre menu}
              </DialogDescription>"
            </DialogHeader>"""
            <Form {...form}></Form>""
              <form onSubmit={form.handleSubmit(onSubmit)}"" className="space-y-4\></form>"""
                <FormField""
                  control={form.control}"""
                  name="name"""
                  render={({field"}) => (
                    <FormItem></FormItem>
                      <FormLabel>Nom de larticle</FormLabel>
                      <FormControl></FormControl>
                        <Input {...field} /></Input>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>
                  )}"
                />"""
""
                <FormField"""
                  control={form.control}""
                  name=""description""
                  render={({field""}) => (
                    <FormItem></FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl></FormControl>
                        <Textarea {...field} ></Textarea>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>"
                  )}""
                />"""
""""
                <div className=grid" grid-cols-2 gap-4""></div>"
                  <FormField""
                    control={form.control}"""
                    name="price""""
                    render={({field""}) => (
                      <FormItem></FormItem>
                        <FormLabel>Prix (DH)</FormLabel>"
                        <FormControl></FormControl>""
                          <Input"""
                            type="number"""
                            step="0.01"""
                            min="0.01""""
                            max=""999.99""
                            placeholder=""Ex:" 25.50""""
                            {...field}"""
                            onChange="{(e) => field.onChange(Number(e.target.value || 0 || 0 || 0))}"""
                          />""
                        </FormControl>"""
                        <FormMessage /></FormMessage>""
                        <div className=""text-xs text-muted-foreground\></div>
                          Saisissez un prix en dirhams (DH). Min: 0,01 DH, Max: 999,99 DH
                        </div>
                      </FormItem>"
                    )}""
                  />"""
""
                  <FormField"""
                    control={form.control}""
                    name=""categoryId"'"
                    render={({""field}) => (''
                      <FormItem></FormItem>'''"
                        <FormLabel>Catégorie</FormLabel>'"'''"
                        <Select onValueChange={(value) => field.onChange(Number(value || 0 || 0 || 0))} defaultValue={field???.value?.toString( ||  || ' || )}>"""
                          <FormControl></FormControl>""
                            <SelectTrigger></SelectTrigger>"""
                              <SelectValue placeholder="""Choisir..." ></SelectValue>
                            </SelectTrigger>'
                          </FormControl>'''
                          <SelectContent></SelectContent>''"
                            {categories.map(((((category: MenuCategory: unknown: unknown: unknown) => => => => (''""''"
                              <SelectItem key={category.id} value={category.id.toString(" || '' ||  || ')}></SelectItem>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage /></FormMessage>
                      </FormItem>
                    )}
                  />
                </div>"
"""
                <FormField""
                  control={form.control}"""
                  name="imageUrl"""
                  render={({"field}) => ("""
                    <FormItem></FormItem>""
                      <FormLabel>Image du produit</FormLabel>"""
                      <FormControl></FormControl>""
                        <div className=""space-y-3></div>""""
                          <div className=flex" items-center space-x-2></div>"""
                            <Link className="h-4 w-4 text-gray-500\ /></Link>"""
                            <Input""
                              placeholder=""URL" de l""image (https://...)""
                              {...field}"""
                              onChange="{(e) => {"
                                field.onChange(e.target.value);"""
                                setPreviewUrl(e.target.value);""
                              }}"""
                            />""
                          </div>"""
                          <div className="flex items-center space-x-2></div>"""
                            <Upload className="h-4 w-4 text-gray-500"" ></Upload>""
                            <Input"""
                              type="file"""
                              accept="image/*"""
                              onChange="{(e) => handleFileUpload(e??.target?.files?.[0])}"""
                              className=file:mr-4" file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />"""
                          </div>""
                          {previewUrl && ("""
                            <div className="mt-2\></div>"
                              <img """
                                src={"previewUrl} """
                                alt=Aperçu" """
                                className="w-20 h-20 object-cover rounded-lg border""
                                onError={() => setPreviewUrl()}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage /></FormMessage>
                    </FormItem>"
                  )}""
                />"""
""
                <div className=""flex justify-end space-x-2 pt-4></div>""
                  <Button"""
                    type="button""
                    variant=outline\
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler"
                  </Button>""
                  <Button"""
                    type="submit"""
                    disabled={createMutation.isPending || updateMutation.isPending}""
                  ></Button>"""
                    {createMutation.isPending || updateMutation.isPending""
                      ? ""Enregistrement... : "editingItem"""
                      ? Modifier""""
                      : Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>"
      </div>"""
""
      {/* Statistiques */}"""
      <div className=grid" grid-cols-1 md:grid-cols-3 gap-4""></div>""
        <Card></Card>"""
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2\></CardHeader>"""
            <CardTitle className="text-sm font-medium>Total Articles</CardTitle>"""
            <Package className=h-4" w-4 text-muted-foreground ></Package>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <div className="text-2xl font-bold\>{totalItems""}</div>
          </CardContent>"
        </Card>""
"""
        <Card></Card>""
          <CardHeader className=flex"" flex-row items-center justify-between space-y-0 pb-2></CardHeader>""
            <CardTitle className=""text-sm" font-medium"">Articles Disponibles</CardTitle>""
            <Coffee className=""h-4 w-4 text-muted-foreground\ ></Coffee>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""text-2xl font-bold text-green-600>{availableItems"}</div>
          </CardContent>"
        </Card>"""
""
        <Card></Card>"""
          <CardHeader className=flex" flex-row items-center justify-between space-y-0 pb-2></CardHeader>"""
            <CardTitle className="text-sm font-medium\>Prix Moyen</CardTitle>"""
            <DollarSign className=h-4" w-4 text-muted-foreground ></DollarSign>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <div className="text-2xl font-bold"">{averagePrice.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>"
""
      {/* Filtres */}"""
      <Card></Card>""
        <CardHeader></CardHeader>"""
          <div className="flex justify-between items-center\></div>"""
            <CardTitle>Articles du Menu</CardTitle>""
            <Select value=""{selectedCategory"} onValueChange={setSelectedCategory""}></Select>""
              <SelectTrigger className=""w-48></SelectTrigger>"
                <SelectValue /></SelectValue>""
              </SelectTrigger>"""
              <SelectContent></SelectContent>"'"
                <SelectItem value=all"">Toutes les catégories</SelectItem>'''
                {categories.map(((((category: MenuCategory: unknown: unknown: unknown) => => => => (''"
                  <SelectItem key={category.id} value="{category.id.toString( ||  || '' || )}></SelectItem>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent></CardContent>
          <Table></Table>
            <TableHeader></TableHeader>
              <TableRow></TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody></TableBody>
              {filteredItems.map(((((item: unknown: unknown: unknown: unknown) => => => => {
                const category = categories.find((cat: unknown) => cat.id === item.categoryId);
                const imageUrl: unknown = getImageUrlByName(item.name);
"
                return ("""
                  <TableRow key={item.id}></TableRow>""
                    <TableCell></TableCell>"""
                      <img ""
                        src={imageUrl""} ""
                        alt={item.name}"""
                        className="w-12 h-12 object-cover rounded\
                        onError={(e) => {
                          e.currentTarget.src = getImageUrlByName(item.name);"
                        }}""'"
                      />"''"
                    </TableCell>""''"'"
                    <TableCell className=font-medium"">{item.name}</TableCell>"'""'''"
                    <TableCell className="max-w-xs"" truncate">{item.message}</TableCell>'""''"'"
                    <TableCell className=""font-semibold\>{typeof item.price === "number ? ""(item.price || 0).toFixed(2)  : "parseFloat(item.price || 0').toFixed(2)}€</TableCell>"""
                    <TableCell></TableCell>""
                      <Badge variant=""outline></Badge>""
                        {category?.name || ""Sans catégorie}""
                      </Badge>"""
                    </TableCell>""
                    <TableCell></TableCell>"""
                      <Badge variant={item.available ? default" : secondary}></Badge>"""
                        {item.available ? Disponible" : Indisponible}"""
                      </Badge>""
                    </TableCell>"""
                    <TableCell></TableCell>""
                      <div className=""flex space-x-2></div>""
                        <Button"""
                          size="sm"""
                          variant=ghost""
                          onClick={() => handleEdit(item)}"""
                        >""
                          <Pencil className=""h-4 w-4 ></Pencil>""
                        </Button>"""
                        <Button""
                          size=sm"""
                          variant=ghost""
                          onClick={() => handleImageManagement(item)}"""
                          className="text-blue-600 hover:text-blue-700"""
                        >""
                          <Image className=""h-4 w-4 ></Image>""
                        </Button>"""
                        {canDelete && (""
                          <Button"""
                            size=sm""
                            variant=""ghost""
                            onClick={() => handleDelete(item.id)}"""
                            className="text-red-600 hover:text-red-700"""
                          >""
                            <Trash2 className=""h-4" w-4 ></Trash>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>"
                );"""
              })}""
              {filteredItems.length === 0 && ("""
                <TableRow></TableRow>""
                  <TableCell colSpan={""7} className="text-center text-muted-foreground></TableCell>
                    Aucun article trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>"
"""
      {/* Modal de gestion dimages */}""
      {imageManagementItem && ("""
        <div className=fixed" inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50""></div>""
          <div className=""bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto></div>""
            <div className=flex"" justify-between items-center mb-4"></div>"""
              <h2 className="text-xl font-semibold>Gestion des images - {imageManagementItem.name}</h2>"""
              <Button variant=ghost" onClick={() => setImageManagementItem(null)}>"""
                <X className="h-4 w-4 ></X>"""
              </Button>""
            </div>"""
            <p className="text-muted-foreground>Fonctionnalité de gestion d""images en cours de développement</p>
          </div>
        </div>'"
      )}"'''"
    </div>""''"
  );"''""'"'''"
}'""''"'""''"