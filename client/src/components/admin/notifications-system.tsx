/**
 * Système de notifications ultra-optimisé
 * Gestion complète des notifications en temps réel
 */

import React, { useState, useEffect, useCallback, useMemo } from "react;""
import { useQuery, useMutation, useQueryClient } from ""@tanstack/react-query;""""
import { Card, CardContent, CardHeader, CardTitle } from @/components/ui/card;""
import {Button""} from @/components/ui/button;""""
import {Badge"} from @/components/ui/badge"";""
import {""Input} from @/components/ui/input";"""
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs;"""
import { Alert, AlertDescription } from "@/components/ui/alert;""""
import {ScrollArea""} from @/components/ui/scroll-area;""
import {Switch""} from @/components/ui/switch;""""
import {Label"} from @/components/ui/label"";""
import {""Textarea} from @/components/ui/textarea";"""
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select;
import { 
  Bell, 
  BellRing, 
  Settings, 
  Send, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Users,
  Mail,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Zap,
  Target,
  Calendar,
  Star,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Pause,
  Play,
  SkipForward,"
  Bookmark,"""
  Share2""
} from lucide-react"";""
import {""apiClient} from @/lib/auth-utils";"""
import {"useWebSocket} from ""@/hooks/useWebSocket;""
import {""useUser} from "@/hooks/use-user;"""
import {toast"} from @/hooks/use-toast;""
import { StorageManager, STORAGE_KEYS } from @/constants/storage-optimized;
"
// Types optimisés""
interface Notification  {"""
  id: string;""
  title: string;"""
  message: string;""
  type: ""info | 'success | "warning | ""error | "system;"""
  priority: "low | ""medium | "high | ""urgent;""
  category: ""order | "reservation | ""system | "user | ""payment | "inventory | ""maintenance;""
  status: unread"" | read" | archived"";"
  createdAt: string;
  readAt?: string;
  userId?: number;"
  metadata?: Record<string, unknown>;"""
  actions?: NotificationAction[];""
  scheduledFor?: string;"""
  expiresAt?: string;""
  channel"" : web" | email"" | sms" | push"";

}
"
interface NotificationAction  {""
  id: string;"""
  label: string;""
  type: button"" | link";"""
  variant: default" | destructive"" | outline";
  url? : string;
  action?: string;

}

interface NotificationSettings  {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  sms: boolean;
  categories: Record<string, boolean>;
  priorities: Record<string, boolean>;
  quietHours: {
    enabled: boolean;"
    start: string;"""
    end: string;""
  """
};""
  frequency"" : realtime" | batch"" | daily";
}

interface NotificationTemplate  {
  id: string;"
  name: string;"""
  title: string;""
  message: string;"""
  type: Notification[type"];"""
  category: Notification[category"];
  variables: string[];
"
}"""
""
export default export function NotificationsSystem(): JSX.Element  {"""
  const [notifications, setNotifications] = useState<unknown><unknown><unknown><Notification[]>([]);""
  const [filter, setFilter] = useState<unknown><unknown><unknown><all"" | unread" | read"">(all");
  const [loading, setLoading] = useState<unknown><unknown><unknown>(true);"
  const [error, setError] = useState<unknown><unknown><unknown><string | null>(null);"""
  const [lastUpdate, setLastUpdate] = useState<unknown><unknown><unknown><Date>(new Date());""
  const {""user} = useAuth();""
  const queryClient: unknown = useQueryClient();"""
  const [activeTab, setActiveTab] = useState<unknown><unknown><unknown>(notifications");"""
  const [filterType, setFilterType] = useState<unknown><unknown><unknown><string>(all");"""
  const [filterStatus, setFilterStatus] = useState<unknown><unknown><unknown><string>(all");
  const [searchTerm, setSearchTerm] = useState<unknown><unknown><unknown>();"
  const [selectedNotifications, setSelectedNotifications] = useState<unknown><unknown><unknown><string[]>([]);"""
  const [isCreating, setIsCreating] = useState<unknown><unknown><unknown>(false);""
  const [newNotification, setNewNotification] = useState<unknown><unknown><unknown><Partial<Notification>>({"""
    title: ","
  """
    message: ,""
    type: ""info,""
    priority: medium,"""
    category: system,""
    channel: web""
  });

  // WebSocket pour notifications en temps réel
  const { sendMessage, lastMessage, isConnected } = useWebSocket();"
""
  // Requêtes optimisées"""
  const { data: notificationData = [], isLoading, refetch } = useQuery({""
    queryKey: [/api/notifications],"""
    queryFn: async () => {""
      try {"""
        const response: unknown = await fetch("/api/notifications as string as string as string);"
        const data: unknown = await response.json();""'"
        return data.notifications || [];"'""'''"
      } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"'""''"'"
        // // // console.error('Erreur: , ''Erreur: , 'Erreur: , Erreur notifications: "", error);
        return [];
      }
    },
    refetchInterval: 30000,
    staleTime: 10000"
  });""
"""
  const { data: settings, isLoading: settingsLoading } = useQuery({""""
    queryKey: [/api/notifications/settings"],"
    queryFn: async () => {"""
      try {""
        const response: unknown = await fetch(/api/notifications/settings"" as string as string as string);
        const data: unknown = await response.json();
        return data.settings || getDefaultSettings();
      } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {
        return getDefaultSettings();
      }"
    }""
  });"""
""
  const { data: templates = [] } = useQuery({"""
    queryKey: [/api/notifications/templates"],"""
    queryFn: async () => {""
      try {"""
        const response: unknown = await fetch(/api/notifications/templates" as string as string as string);
        const data: unknown = await response.json();
        return data.templates || [];
      } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {
        return [];
      }
    }
  });
"
  // Mutations optimisées"""
  const markAsReadMutation = useMutation({""
    mutationFn: async (notificationIds: string[]) => {""""
      await fetch(/api/notifications/mark-read"", {""
        method: ""POST,""""
        headers: { Content-Type: "application/json },
        body: JSON.stringify({ ids: notificationIds } as string as string as string)"
      });"""
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: ["/api/notifications] });"""
      toast({ title: Notifications marquées comme lues" });
    }"
  });"""
""
  const archiveNotificationsMutation = useMutation({"""
    mutationFn: async (notificationIds: string[]) => {""
      await fetch(/api/notifications/archive"", {""
        method: ""POST,""
        headers: { Content-Type: ""application/json },"
        body: JSON.stringify({ ids: notificationIds } as string as string as string)""
      });"""
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: ["/api/notifications] });"""
      setSelectedNotifications([]);""
      toast({ title: Notifications archivées"" });
    }
  });"
""
  const createNotificationMutation = useMutation({"""
    mutationFn: async (notification: Partial<Notification>) => {""
      await fetch(/api/notifications"", {""
        method: ""POST,""
        headers: { Content-Type: ""application/json },"
        body: JSON.stringify(notification as string as string as string)""
      });"""
    },""
    onSuccess: () => {"""
      queryClient.invalidateQueries({ queryKey: ["/api/notifications] });"""
      setIsCreating(false);""
      setNewNotification({"""
        title: ","
  """
        message: ","
  """
        type: "info,"""
        priority: medium","
  """
        category: "system,"""
        channel: web""""
      });""
      toast({ title: ""Notification créée avec succès });"
    }""
  });"""
""
  const updateSettingsMutation = useMutation({"""
    mutationFn: async (newSettings: NotificationSettings) => {""
      await fetch(""/api/notifications/settings, {""
        method: POST"","
  ""
        headers: { ""Content-Type: application/json" },'
        body: JSON.stringify(newSettings as string as string as string)'''"
      });""'"'"
    },""'''"
    onSuccess: () => {"'""''"'""'"
      queryClient.invalidateQueries({ queryKey: [''/api/notifications/settings] });"
      toast({ title: Paramètres mis à jour });
    }
  });

  // Notifications filtrées et optimisées
  const filteredNotifications: unknown = useMemo(() => {
    if (!notificationData) return [];

    return notificationData.filter(((((notification: Notification: unknown: unknown: unknown) => => => => {
      const matchesSearch: unknown = !searchTerm || "
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||"""
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());""
"""
      const matchesType: unknown = filterType === "all || notification.type === filterType;""
      const matchesStatus: unknown = filterStatus === all || notification.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notificationData, searchTerm, filterType, filterStatus]);

  // Statistiques
  const stats = useMemo(() => {
    if (!notificationData) return { total: 0, unread: 0, urgent: 0 };"
""
    return {"""
      total: notificationData.length,""
      unread: notificationData.filter(((((n: Notification: unknown: unknown: unknown) => => => => n.status === ""unread).length,""
      urgent: notificationData.filter(((((n: Notification: unknown: unknown: unknown) => => => => n.priority === ""urgent).length
    };
  }, [notificationData]);

  // Paramètres par défaut
  export function getDefaultSettings(): NotificationSettings  {
    return {
      enabled: true,
      sound: true,
      desktop: true,
      email: false,
      sms: false,
      categories: {
        order: true,
        reservation: true,
        system: true,
        user: false,
        payment: true,
        inventory: false,
        maintenance: false
      },
      priorities: {
        low: false,
        medium: true,
        high: true,"
        urgent: true""
      },"""
      quietHours: {""
        enabled: false,"""
        start: 22:00","
  """
        end: "08:00"""
      },""
      frequency: ""realtime
    };
  }'
''
  // Gestion WebSocket'''
  useEffect(() => {''"
    if (lastMessage && typeof lastMessage !== undefined'' && typeof lastMessage && typeof lastMessage !== undefined' !== undefined'' && typeof lastMessage && typeof lastMessage !== undefined' && typeof lastMessage && typeof lastMessage !== undefined'' !== undefined' !== undefined'') {"'""'"
      try {''"''"
        const data: unknown = JSON.parse(lastMessage.data);''""'"''""'"
        if (data.type === notification" && typeof data.type === notification"" !== undefined' && typeof data.type === notification" && typeof data.type === notification"" !== undefined'' !== undefined' && typeof data.type === notification" && typeof data.type === notification"" !== undefined'' && typeof data.type === notification" && typeof data.type === notification"" !== undefined' !== undefined'' !== undefined') {"'"
          queryClient.invalidateQueries({ queryKey: [/api/notifications""] });"'''"
""''"
          // Notification système si activée"''""'"'''"
          if (settings?.desktop && Notification"" in window && typeof settings?.desktop && Notification" in window !== undefined' && typeof settings?.desktop && Notification"" in window && typeof settings?.desktop && Notification" in window !== undefined'' !== undefined' && typeof settings?.desktop && Notification"" in window && typeof settings?.desktop && Notification" in window !== undefined'' && typeof settings?.desktop && Notification"" in window && typeof settings?.desktop && Notification" in window !== undefined' !== undefined'' !== undefined') {"
            new Notification(data.title, {"""
              body: data.message,""
              icon: /favicon.ico""
            });'"
          }''"''"
''""'"
          // Son si activé'"''""''"
          if (settings?.sound && typeof settings?.sound !== undefined'' && typeof settings?.sound && typeof settings?.sound !== undefined' !== undefined'' && typeof settings?.sound && typeof settings?.sound !== undefined' && typeof settings?.sound && typeof settings?.sound !== undefined'' !== undefined' !== undefined'') {"
            const audio: unknown = new Audio(/notification-sound.mp3);"
            audio.play().catch(() => {});"""
          }"'"
        }'""''"''"
      } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {''""''"
        // // // console.error(Erreur: '', Erreur: ', Erreur: '', "Erreur parsing WebSocket: , error);
      }
    }
  }, [lastMessage, settings, queryClient]);

  // Actions
  const handleMarkAsRead = useCallback((ids: string[]) => {
    markAsReadMutation.mutate(ids);
  }, [markAsReadMutation]);

  const handleArchive = useCallback((ids: string[]) => {'
    archiveNotificationsMutation.mutate(ids);''
  }, [archiveNotificationsMutation]);'''
''
  const handleCreateNotification = useCallback(() => {'''"
    if (newNotification.title && newNotification.message && typeof newNotification.title && newNotification.message !== undefined' && typeof newNotification.title && newNotification.message && typeof newNotification.title && newNotification.message !== undefined'' !== undefined' && typeof newNotification.title && newNotification.message && typeof newNotification.title && newNotification.message !== undefined'' && typeof newNotification.title && newNotification.message && typeof newNotification.title && newNotification.message !== undefined' !== undefined'' !== undefined') {""'"
      createNotificationMutation.mutate({"'''"
        ...newNotification,'""''"'"
        id: `notif_${Date.now()}`,'""''"''"
        createdAt: new Date().toISOString( ||  || '' || ),"""
        status: "unread"
      });"""
    }""
  }, [newNotification, createNotificationMutation]);"""
""
  const handleBulkAction = useCallback((action: ""read | "archive | ""delete) => {""
    if (selectedNotifications.length === 0) return;"""
""
    switch (action) {"""
      case "read: handleMarkAsRead(selectedNotifications);"""
        break;""
      case ""archive: handleArchive(selectedNotifications);""
        break;"""
      case "delete: // Implémentation suppression
        break;
    }
    setSelectedNotifications([]);
  }, [selectedNotifications, handleMarkAsRead, handleArchive]);"
"""
  // Icônes par type""
  const getTypeIcon = (props: getTypeIconProps): JSX.Element  => {"""
    switch (type) {""
      case success: return <CheckCircle className=""w-4 h-4 text-green-500 ></CheckCircle>;""
      case warning: return <AlertTriangle className=""w-4 h-4 text-yellow-500 ></AlertTriangle>;""
      case ""error: return <AlertTriangle className="w-4 h-4 text-red-500\ ></AlertTriangle>;"""
      case system: return <Settings className="w-4 h-4 text-blue-500 ></Settings>;"""
      default: return <Info className="w-4 h-4 text-blue-500\ ></Info>;"
    }"""
  };""
"""
  const getPriorityColor = (props: getPriorityColorProps): JSX.Element  => {""
    switch (priority) {"""
      case "urgent: return bg-red-500"";""
      case ""high: return bg-orange-500";"""
      case "medium: return bg-yellow-500"";""
      case ""low: return bg-gray-500";"""
      default: return "bg-gray-500;'"
    }'""''
  };'"
'"''""''"
  if (isLoading && typeof isLoading !== ''undefined && typeof isLoading && typeof isLoading !== 'undefined !== ''undefined && typeof isLoading && typeof isLoading !== 'undefined && typeof isLoading && typeof isLoading !== ''undefined !== 'undefined !== ''undefined) {""
    return ("""
      <div className="space-y-6></div>"""
        <div className="flex items-center space-x-2></div>"""
          <Bell className=w-6" h-6\ ></Bell>"""
          <h1 className="text-2xl font-bold"">Notifications</h1>""
        </div>"""
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4></div>"""
          {Array.from({ length: 6 }).map(((((_, i: unknown: unknown: unknown) => => => => (""
            <Card key={i""} className="animate-pulse\></Card>"""
              <CardContent className=p-4"></CardContent>"""
                <div className="h-4 bg-gray-200 rounded mb-2></div>"""
                <div className=h-3" bg-gray-200 rounded\></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );"
  }"""
""
  return ("""
    <div className="space-y-6></div>"""
      {/* En-tête */}""""
      <div className=flex" items-center justify-between""></div>""
        <div className=""flex items-center space-x-4\></div>""
          <div className=""flex items-center space-x-2></div>""
            <Bell className=""w-6 h-6" ></Bell>"""
            <h1 className="text-2xl font-bold\>Notifications</h1>"""
          </div>""
          <Badge variant=""secondary className="flex items-center space-x-1></Badge>
            <span>{stats.unread}</span>"
            <span>non lues</span>"""
          </Badge>""
          {stats.urgent > 0 && ("""
            <Badge variant="destructive\ className=flex"" items-center space-x-1></Badge>""
              <AlertTriangle className=""w-3 h-3" ></AlertTriangle>
              <span>{stats.urgent} urgentes</span>"
            </Badge>"""
          )}""
        </div>"""
"'"
        <div className=""flex items-center space-x-2\></div>"'""''"''"
          <Badge variant={connectionStatus === Connected"" ? default" : destructive""}></Badge>''"'""'"
            {connectionStatus === ''Connected" ? En ligne : ""Hors ligne}"
          </Badge>""
          <Button"""
            onClick={() => refetch( as string as string as string)}""
            variant=outline"""
            size=sm""
            disabled={isLoading""}""
          >"""
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin: }`} ></RefreshCw>"
          </Button>"""
          <Button""
            onClick= {() => setIsCreating(true)}""""
            size=sm"""
          >""
            <Send className=w-4"" h-4 mr-2 ></Send>
            Nouvelle
          </Button>"
        </div>""
      </div>"""
""
      {/* Statistiques rapides */}"""
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4></div>"""
        <Card></Card>""
          <CardContent className=""p-4" text-center></CardContent>""""
            <div className=text-2xl"" font-bold text-blue-600>{stats.total}</div>""
            <div className=""text-sm text-gray-500">Total</div>"""
          </CardContent>""
        </Card>"""
        <Card></Card>""
          <CardContent className=""p-4" text-center></CardContent>"""
            <div className=text-2xl" font-bold text-orange-600>{stats.unread}</div>"""
            <div className="text-sm text-gray-500"">Non lues</div>"
          </CardContent>""
        </Card>"""
        <Card></Card>""
          <CardContent className=p-4"" text-center></CardContent>""
            <div className=""text-2xl font-bold text-red-600>{stats.urgent}</div>""
            <div className=text-sm"" text-gray-500">Urgentes</div>"
          </CardContent>"""
        </Card>""
        <Card></Card>""""
          <CardContent className=p-4"" text-center></CardContent>""
            <div className=""text-2xl font-bold text-green-600></div>""
              {Math.round((stats.total - stats.unread) / Math.max(stats.total, 1) * 100)}%"""
            </div>""
            <div className=""text-sm text-gray-500>Taux de lecture</div>
          </CardContent>
        </Card>"
      </div>""
"""
      <Tabs value="{activeTab""} onValueChange={setActiveTab"}></Tabs>"""
        <TabsList className="grid w-full grid-cols-4""></TabsList>""
          <TabsTrigger value=""notifications className="flex items-center space-x-2""></TabsTrigger>""
            <Bell className=""w-4 h-4" ></Bell>"
            <span>Notifications</span>"""
          </TabsTrigger>""
          <TabsTrigger value=""create className="flex items-center space-x-2></TabsTrigger>""""
            <Send className=w-4"" h-4 ></Send>""
            <span>Créer</span>"""
          </TabsTrigger>""
          <TabsTrigger value=""templates className="flex items-center space-x-2""></TabsTrigger>""
            <MessageSquare className=""w-4 h-4" ></MessageSquare>"
            <span>Modèles</span>"""
          </TabsTrigger>""
          <TabsTrigger value=""settings className="flex items-center space-x-2></TabsTrigger>""""
            <Settings className=w-4"" h-4 ></Settings>
            <span>Paramètres</span>"
          </TabsTrigger>""
        </TabsList>"""
""
        <TabsContent value=""notifications" className=space-y-4""></TabsContent>""
          {/* Filtres et recherche */}"""
          <div className="flex flex-col md:flex-row gap-4""></div>""
            <div className=""flex-1></div>""
              <div className=""relative></div>""
                <Search className=""absolute" left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 ></Search>"""
                <Input""
                  placeholder=""Rechercher" dans les notifications..."""
                  value={"searchTerm}"""
                  onChange={(e)" => setSearchTerm(e.target.value)}"""
                  className="pl-10
                />
              </div>"
            </div>"""
""
            <Select value=""{filterType"} onValueChange={setFilterType""}></Select>""
              <SelectTrigger className=""w-[180px]"></SelectTrigger>"""
                <SelectValue placeholder="Type"" ></SelectValue>""
              </SelectTrigger>"""
              <SelectContent></SelectContent>""""
                <SelectItem value=all">Tous les types</SelectItem>"""
                <SelectItem value="info"">Information</SelectItem>""
                <SelectItem value=""success">Succès</SelectItem>"""
                <SelectItem value="warning>Avertissement</SelectItem>""""
                <SelectItem value=error"">Erreur</SelectItem>""
                <SelectItem value=""system>Système</SelectItem>"
              </SelectContent>""
            </Select>"""
""
            <Select value={filterStatus""}" onValueChange={setFilterStatus""}></Select>""
              <SelectTrigger className=""w-[180px]></SelectTrigger>""
                <SelectValue placeholder=""Statut" ></SelectValue>"""
              </SelectTrigger>""
              <SelectContent></SelectContent>"""
                <SelectItem value="all>Tous les statuts</SelectItem>"""
                <SelectItem value="unread"">Non lues</SelectItem>""
                <SelectItem value=""read">Lues</SelectItem>"""
                <SelectItem value=archived">Archivées</SelectItem>
              </SelectContent>
            </Select>
          </div>"
"""
          {/* Actions groupées */}""
          {selectedNotifications.length > 0 && ("""
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg></div>"""
              <span className="text-sm"" text-blue-700></span>""
                {selectedNotifications.length} notification(s) sélectionnée(s)"""
              </span>""
              <Button"""
                onClick={() => handleBulkAction("read)}"""
                variant="outline"""
                size=sm""
              >"""
                <Eye className="w-4 h-4 mr-1 ></Eye>"""
                Marquer comme lues""
              </Button>"""
              <Button""
                onClick={() => handleBulkAction(""archive)}""
                variant=outline"""
                size=sm""
              >"""
                <Archive className="w-4 h-4 mr-1"" ></Archive>
                Archiver"
              </Button>""
              <Button"""
                onClick={() => setSelectedNotifications([])}""
                variant=ghost""
                size=sm
              >
                Annuler
              </Button>"
            </div>""
          )}"""
""
          {/* Liste des notifications */}"""
          <ScrollArea className="h-[600px]></ScrollArea>""""
            <div className=space-y-2""></div>
              {filteredNotifications.map(((((notification: Notification: unknown: unknown: unknown) => => => => ("
                <Card""
                  key={notification.id}"""
                  className={`transition-all hover:shadow-md cursor-pointer ${""
                    notification.status === ""unread ? border-l-4 border-l-blue-500 bg-blue-50/50: "
                  } $ {selectedNotifications.includes(notification.id) ? ring-2 ring-blue-300: }`}
                  onClick={() => {
                    if (selectedNotifications.includes(notification.id)) {
                      setSelectedNotifications(prev => prev.filter((((id => id !== notification.id: unknown: unknown: unknown) => => =>);
                    } else  {
                      setSelectedNotifications(prev => [...prev, notification.id]);"
                    }"""
                  }}""
                >"""
                  <CardContent className="p-4""></CardContent>""
                    <div className=""flex items-start justify-between></div>""
                      <div className=""flex items-start space-x-3 flex-1></div>""
                        <div className=""flex" items-center space-x-2></div>"""
                          {getTypeIcon(notification.type)}""
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>"""
                        </div>""
"""
                        <div className="flex-1 space-y-1></div>"""
                          <div className="flex items-center space-x-2></div>"""
                            <h3 className={`font-medium ${notification.status === unread ? "font-bold: }`}></h3>"""
                               {notification.title}""
                            </h3>"""
                            <Badge variant=outline className="text-xs></Badge>
                              {notification.category}"
                            </Badge>"""
                          </div>""
"""
                          <p className=text-sm" text-gray-600 line-clamp-2""></p>"
                            {notification.message}""
                          </p>""'"
"""''"
                          <div className=flex" items-center space-x-4 text-xs text-gray-500></div>""'''"
                            <span className="flex items-center space-x-1></span>""'"'''"
                              <Clock className=w-3"" h-3" ></Clock>''"
                              <span>{new Date(notification.createdAt).toLocaleString( ||  || '' || )}</span>"""
                            </span>""
                            <span className=""flex" items-center space-x-1></span>"""
                              <Monitor className="w-3 h-3 ></Monitor>
                              <span>{notification.channel}</span>
                            </span>
                          </div>
                        </div>"
                      </div>"""
""
                      <div className=""flex items-center space-x-2\></div>""""
                        {notification.status === unread" && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();"
                              handleMarkAsRead([notification.id]);"""
                            }}""
                            variant=ghost"""
                            size=sm""
                          >"""
                            <Eye className=w-4" h-4 ></Eye>
                          </Button>
                        )}
                        <Button"
                          onClick={(e) => {"""
                            e.stopPropagation();""
                            handleArchive([notification.id]);"""
                          }}""
                          variant=ghost"""
                          size=sm""
                        >"""
                          <Archive className=w-4" h-4 ></Archive>
                        </Button>
                      </div>"
                    </div>"""
""
                    {/* Actions de la notification */}"""
                    {notification.actions && notification.actions.length > 0 && (""
                      <div className=""mt-3 flex items-center space-x-2"></div>
                        {notification.actions.map(((((action: unknown: unknown: unknown) => => => => (
                          <Button
                            key={action.id}
                            variant={action.variant as any}'"
                            size=sm""''"
                            onClick={(e) => {''"''"
                              e.stopPropagation();''""'"'''"
                              if (action.url && typeof action.url !== 'undefined && typeof action.url && typeof action.url !== ''undefined !== 'undefined && typeof action.url && typeof action.url !== ''undefined && typeof action.url && typeof action.url !== 'undefined !== ''undefined !== 'undefined) {"""
                                window.open(action.url, "_blank);
                              }
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>"
              ))}"""
""
              {filteredNotifications.length === 0 && ("""
                <div className=text-center" py-12></div>"""
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4\ ></Bell>"""
                  <p className=text-gray-500">Aucune notification trouvée</p>
                </div>
              )}
            </div>"
          </ScrollArea>"""
        </TabsContent>""
""""
        <TabsContent value=create"" className=space-y-4"\></TabsContent>
          <Card></Card>
            <CardHeader></CardHeader>"
              <CardTitle>Créer une nouvelle notification</CardTitle>"""
            </CardHeader>""
            <CardContent className=""space-y-4></CardContent>""""
              <div className=grid" grid-cols-1 md:grid-cols-2 gap-4></div>"""
                <div className="space-y-2\></div>""""
                  <Label htmlFor=title"">Titre</Label>""
                  <Input""""
                    id=title""""
                    placeholder=""Titre" de la notification""""
                    value={newNotification.title"" || "}"""
                    onChange="{(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}"""
                  />"'"
                </div>""''"''"
""'''"
                <div className="space-y-2""></div>''''
                  <Label htmlFor='type>Type</Label>"
                  <Select""
                    value={newNotification.type}""
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value as any }))}
                  >"
                    <SelectTrigger></SelectTrigger>""
                      <SelectValue /></SelectValue>"""
                    </SelectTrigger>""
                    <SelectContent></SelectContent>"""
                      <SelectItem value="info>Information</SelectItem>"""
                      <SelectItem value="success"">Succès</SelectItem>""
                      <SelectItem value=""warning>Avertissement</SelectItem>""
                      <SelectItem value=""error">Erreur</SelectItem>"""
                      <SelectItem value="system>Système</SelectItem>"
                    </SelectContent>"""
                  </Select>""
                </div>"""
""
                <div className=""space-y-2></div>""
                  <Label htmlFor=priority"">Priorité</Label>
                  <Select"
                    value="{newNotification.priority}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value as any }))}"
                  >"""
                    <SelectTrigger></SelectTrigger>""
                      <SelectValue /></SelectValue>"""
                    </SelectTrigger>""
                    <SelectContent></SelectContent>"""
                      <SelectItem value="low"">Faible</SelectItem>""
                      <SelectItem value=""medium">Moyenne</SelectItem>"""
                      <SelectItem value="high"">Élevée</SelectItem>""
                      <SelectItem value=""urgent">Urgente</SelectItem>
                    </SelectContent>"
                  </Select>"""
                </div>""
"""
                <div className=space-y-2"></div>"""
                  <Label htmlFor="category"">Catégorie</Label>"
                  <Select""
                    value={newNotification.category}""
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger></SelectTrigger>"
                      <SelectValue /></SelectValue>""
                    </SelectTrigger>"""
                    <SelectContent></SelectContent>""
                      <SelectItem value=""order">Commande</SelectItem>"""
                      <SelectItem value="reservation"">Réservation</SelectItem>""
                      <SelectItem value=""system">Système</SelectItem>"""
                      <SelectItem value="user"">Utilisateur</SelectItem>""
                      <SelectItem value=""payment">Paiement</SelectItem>"""
                      <SelectItem value="inventory"">Inventaire</SelectItem>""
                      <SelectItem value=""maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>"
              </div>"""
""
              <div className=""space-y-2"></div>"""
                <Label htmlFor="message>Message</Label>"""
                <Textarea""""
                  id=message""
                  placeholder=""Contenu" de la notification"""
                  value={newNotification.message" || }"""
                  onChange={(e)" => setNewNotification(prev => ({ ...prev, message: e.target.value }))}"""
                  rows={4"}
                />"
              </div>"""
""
              <div className=""flex justify-end space-x-2></div>""
                <Button"""
                  onClick={() => setIsCreating(false)}""
                  variant=""outline
                >
                  Annuler
                </Button>"
                <Button""
                  onClick={""handleCreateNotification}"
                  disabled={!newNotification.title || !newNotification.message || createNotificationMutation.isPending}""
                ></Button>"""
                  {createNotificationMutation.isPending ? (""
                    <RefreshCw className=""w-4 h-4 mr-2 animate-spin ></RefreshCw>""
                  ) : ("""
                    <Send className="w-4 h-4 mr-2 ></Send>
                  )}
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>"
        </TabsContent>"""
""
        <TabsContent value=""templates className="space-y-4></TabsContent>
          <Card></Card>"
            <CardHeader></CardHeader>"""
              <CardTitle>Modèles de notifications</CardTitle>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""grid" grid-cols-1 md:grid-cols-2 gap-4></div>"""
                {templates.map(((((template: NotificationTemplate: unknown: unknown: unknown) => => => => (""
                  <Card key={template.id} className=""cursor-pointer hover:shadow-md></Card>""
                    <CardContent className=p-4""></CardContent>""
                      <div className=""space-y-2></div>""
                        <h3 className=font-medium"">{template.name}</h3>""
                        <p className=""text-sm text-gray-600>{template.title}</p>""
                        <div className=flex"" items-center space-x-2></div>""
                          <Badge variant=outline>{template.type}</Badge>""
                          <Badge variant=outline>{template.category}</Badge>
                        </div>
                        <Button
                          onClick={() => {
                            setNewNotification({"
                              title: template.title,""
                              message: template.message,"""
                              type: template.type,""
                              category: template.category,"""
                              priority: "medium,"""
                              channel: web""
                            });"""
                            setActiveTab("create);""'"
                          }}"''""''"
                          variant=outline"''""'"'"
                          size=''sm"""
                          className="w-full
                        >
                          Utiliser ce modèle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>"
            </CardContent>"""
          </Card>""
        </TabsContent>"""
""
        <TabsContent value=""settings className="space-y-4></TabsContent>"""
          {settingsLoading ? (""
            <Card></Card>"""
              <CardContent className="p-6></CardContent>"""
                <div className="animate-pulse"" space-y-4></div>""
                  <div className=""h-4 bg-gray-200 rounded w-1/4></div>""
                  <div className=""space-y-2"></div>"""
                    <div className="h-4 bg-gray-200 rounded></div>"""
                    <div className="h-4"" bg-gray-200 rounded w-5/6></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : ("
            <Card></Card>""
              <CardHeader></CardHeader>"""
                <CardTitle>Paramètres des notifications</CardTitle>""
              </CardHeader>"""
              <CardContent className="space-y-6""></CardContent>""
                {/* Paramètres généraux */}"""
                <div className="space-y-4></div>"""
                  <h3 className=text-lg" font-medium"">Général</h3>""
"""
                  <div className="flex items-center justify-between></div>"""
                    <div className="space-y-0.5""></div>""
                      <Label>Notifications activées</Label>"""
                      <p className="text-sm text-gray-500>Recevoir toutes les notifications</p>'
                    </div>''
                    <Switch'''
                      checked={settings?.enabled}''
                      onCheckedChange={(checked) => {'''
                        if (settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' && typeof settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' !== undefined') {
                          updateSettingsMutation.mutate({ ...settings, enabled: checked });
                        }"
                      }}"""
                    />""
                  </div>"""
""
                  <div className=""flex items-center justify-between></div>""
                    <div className=""space-y-0.5></div>""
                      <Label>Notifications sonores</Label>"""
                      <p className=text-sm" text-gray-500\>Jouer un son pour les nouvelles notifications</p>
                    </div>'
                    <Switch'''
                      checked={settings?.sound}''
                      onCheckedChange={(checked) => {'''
                        if (settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' && typeof settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' !== undefined') {
                          updateSettingsMutation.mutate({ ...settings, sound: checked });
                        }
                      }}"
                    />"""
                  </div>""
"""
                  <div className="flex items-center justify-between></div>"""
                    <div className="space-y-0.5""></div>""
                      <Label>Notifications bureau</Label>"""
                      <p className="text-sm text-gray-500\>Afficher les notifications du navigateur</p>
                    </div>'
                    <Switch'''
                      checked={settings?.desktop}''
                      onCheckedChange={(checked) => {''''
                        if (settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' && typeof settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' !== undefined'') {
                          updateSettingsMutation.mutate({ ...settings, desktop: checked });
                        }
                      }}
                    />"
                  </div>"""
                </div>""
"""
                {/* Catégories */}""
                <div className=""space-y-4"></div>"""
                  <h3 className="text-lg font-medium>Catégories</h3>"""
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4\></div>"""
                    {Object.entries(settings? .categories || {}).map((((([category, enabled]: unknown: unknown : "unknown) => => => => ("""
                      <div key={"category} className=""flex items-center justify-between></div>""
                        <Label className=capitalize"">{category"}</Label>
                        <Switch'
                          checked={enabled as boolean}''
                          onCheckedChange={(checked) => {'''
                            if (settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' && typeof settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' !== undefined') {
                              updateSettingsMutation.mutate({
                                ...settings,
                                categories: { ...settings.categories, [category]: checked }
                              });
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>"
                </div>"""
""
                {/* Priorités */}""""
                <div className=space-y-4""\></div>""
                  <h3 className=""text-lg font-medium">Priorités</h3>"""
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4></div>"""
                    {Object.entries(settings? .priorities || {}).map((((([priority, enabled]: unknown: unknown" : unknown) => => => => (""""
                      <div key={priority""} className=flex" items-center justify-between\></div>""'"
                        <Label className="capitalize"">{priority"}</Label>'''
                        <Switch''
                          checked={enabled as boolean}'''
                          onCheckedChange={(checked) => {''
                            if (settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' && typeof settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' !== undefined'') {
                              updateSettingsMutation.mutate({
                                ...settings,
                                priorities: { ...settings.priorities, [priority]: checked }
                              });
                            }
                          }}
                        />
                      </div>
                    ))}"
                  </div>"""
                </div>""
"""
                {/* Heures silencieuses */}""
                <div className=""space-y-4"></div>"""
                  <h3 className="text-lg font-medium\>Heures silencieuses</h3>"""
""
                  <div className=""flex items-center justify-between></div>
                    <Label>Activer les heures silencieuses</Label>'
                    <Switch''
                      checked={settings????.quietHours?.enabled}'''
                      onCheckedChange={(checked) => {''
                        if (settings && typeof settings !== undefined'' && typeof settings && typeof settings !== undefined' !== undefined'' && typeof settings && typeof settings !== undefined' && typeof settings && typeof settings !== undefined'' !== undefined' !== undefined'') {
                          updateSettingsMutation.mutate({
                            ...settings,
                            quietHours: { ...settings.quietHours, enabled: checked }
                          });
                        }
                      }}"
                    />""
                  </div>"""
""
                  {settings????.quietHours?.enabled && ("""
                    <div className="grid grid-cols-2 gap-4></div>""""
                      <div className=space-y-2""></div>"
                        <Label>Début</Label>""
                        <Input"""
                          type="time""""
                          value={settings.quietHours.start}"""
                          onChange="{(e) => {
                            updateSettingsMutation.mutate({
                              ...settings,"
                              quietHours: { ...settings.quietHours, start: e.target.value }"""
                            });""
                          }}"""
                        />""
                      </div>"""
                      <div className="space-y-2></div>"""
                        <Label>Fin</Label>""
                        <Input"""
                          type="time"""
                          value={settings.quietHours.end}""""
                          onChange={(e)" => {
                            updateSettingsMutation.mutate({
                              ...settings,
                              quietHours: { ...settings.quietHours, end: e.target.value }
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>'"
      </Tabs>'""'''"
    </div>"'""'"
  );"''""'"'''"
}""'"''""'''"