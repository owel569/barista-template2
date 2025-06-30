import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, ShoppingCart, Plus, Minus, Coffee, Utensils, Cake, Sandwich } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const reservationSchema = insertReservationSchema.extend({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  customerEmail: z.string().email("Email invalide"),
  customerPhone: z.string().min(10, "Numéro de téléphone invalide"),
  date: z.string().min(1, "Date requise"),
  time: z.string().min(1, "Heure requise"),
  guests: z.number().min(1, "Au moins 1 invité requis").max(12, "Maximum 12 invités"),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface CartItem {
  menuItem: {
    id: number;
    name: string;
    price: string;
    description: string;
    categoryId: number;
  };
  quantity: number;
  notes?: string;
}

// Images réelles pour chaque catégorie de produits
const categoryImages = {
  1: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNEEzNzI4Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM4QjREMkIiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIzMCIgZmlsbD0iI0Q2QUU3QiIvPgo8cGF0aCBkPSJNODAgODBMMTIwIDEyME04MCA4MEwxMjAgMTIwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K", // Café
  2: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMDA3N0JFIi8+CjxyZWN0IHg9IjcwIiB5PSI2MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI3MCIgcj0iMTAiIGZpbGw9IiNGRkE1MDAiLz4KPGF0aCBkPSJNODAgMTQwSDEyMEwxMTAgMTUwSDkwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8L3N2Zz4K", // Boissons
  3: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRkZCMzAwIi8+CjxlbGxpcHNlIGN4PSIxMDAiIGN5PSIxMDAiIHJ4PSI1MCIgcnk9IjMwIiBmaWxsPSIjRkZEQkEwIi8+CjxlbGxpcHNlIGN4PSIxMDAiIGN5PSI5MCIgcng9IjQwIiByeT0iMjAiIGZpbGw9IiNGRkYiLz4KPGF0aCBkPSJNNzAgMTEwUTEwMCAxMzAgMTMwIDExMCIgc3Ryb2tlPSIjOUI0NTAwIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+", // Pâtisseries
  4: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzQ3RjM5Ii8+CjxyZWN0IHg9IjUwIiB5PSI4MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjEwMCIgcj0iNSIgZmlsbD0iI0ZGMDAwMCIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMTAiIHI9IjUiIGZpbGw9IiNGRkZGMDAiLz4KPGNpcmNsZSBjeD0iMTMwIiBjeT0iMTAwIiByPSI1IiBmaWxsPSIjMDBGRjAwIi8+CjwvZz4KPC9zdmc+" // Plats
};

// Images spécifiques pour chaque produit
const productImages = {
  "Expresso": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM0QTM3MjgiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI0NSIgZmlsbD0iIzZGNDA0MyIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjM1IiBmaWxsPSIjOEI0RDJCIi8+PHBhdGggZD0iTTYwIDYwTDkwIDkwTTYwIDkwTDkwIDYwIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==",
  "Cappuccino": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM4QjREMkIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0Q2QUU3QiIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTYwIDYwUTc1IDUwIDkwIDYwIiBzdHJva2U9IiM2RjQwNDMiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==",
  "Latte": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNEMTg4NzAiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0Y1RjVEQyIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQwIiBmaWxsPSIjRkZGRkZGIi8+PHBhdGggZD0iTTYwIDYwSDkwTTYwIDY5SDkwTTYwIDc4SDkwIiBzdHJva2U9IiM2RjQwNDMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
  "Americano": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM2RjQwNDMiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iIzNCMjYxRSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjNUEzNDI1Ii8+PHBhdGggZD0iTTUwIDUwTDEwMCAxMDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+",
  "Thé Earl Grey": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3QjY4RUUiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0Y0RjNGRiIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjRkZGMEU2Ii8+PHBhdGggZD0iTTUwIDc1UzY1IDUwIDc1IDc1Uzk1IDUwIDEwMCA3NSIgc3Ryb2tlPSIjN0I2OEVFIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48L3N2Zz4=",
  "Chocolat chaud": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM3QjM5MTIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0FBNTkyOSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjRkZGRkZGIi8+PGNpcmNsZSBjeD0iNjUiIGN5PSI2NSIgcj0iNSIgZmlsbD0iI0ZGRiIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iNzAiIHI9IjMiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijg1IiByPSI0IiBmaWxsPSIjRkZGIi8+PC9zdmc+",
  "Jus d'orange frais": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkE1MDAiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjRkZGMEUwIi8+PGNpcmNsZSBjeD0iNjUiIGN5PSI2NSIgcj0iNSIgZmlsbD0iI0ZGQTUwMCIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iNzAiIHI9IjQiIGZpbGw9IiNGRkE1MDAiLz48L3N2Zz4=",
  "Croissant": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkI4N0MiLz48cGF0aCBkPSJNNDAgNzVRNjAgNTAgOTAgNjBRMTEwIDc1IDkwIDEwMFE3MCAxMDAgNDAgNzVaIiBmaWxsPSIjRkZEQkEwIi8+PHBhdGggZD0iTTUwIDc1UTcwIDY1IDg1IDc1UTkwIDg1IDgwIDk1UTY1IDk1IDUwIDc1WiIgZmlsbD0iI0Y0QTQ2MSIvPjwvc3ZnPg==",
  "Pain au chocolat": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkI4N0MiLz48cmVjdCB4PSI0NSIgeT0iNjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0ZGREJBMCIvPjxyZWN0IHg9IjUwIiB5PSI3MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjMiIGZpbGw9IiM3QjM5MTIiLz48cmVjdCB4PSI1MCIgeT0iNzciIHdpZHRoPSI1MCIgaGVpZ2h0PSIzIiBmaWxsPSIjN0IzOTEyIi8+PC9zdmc+",
  "Muffin myrtilles": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkI4N0MiLz48ZWxsaXBzZSBjeD0iNzUiIGN5PSI4NSIgcng9IjM1IiByeT0iMjUiIGZpbGw9IiNGRkRCQTAiLz48ZWxsaXBzZSBjeD0iNzUiIGN5PSI2NSIgcng9IjMwIiByeT0iMTUiIGZpbGw9IiNGRkU5QzQiLz48Y2lyY2xlIGN4PSI2NSIgY3k9Ijc1IiByPSI0IiBmaWxsPSIjNDMzOEZGIi8+PGNpcmNsZSBjeD0iODUiIGN5PSI4MCIgcj0iMyIgZmlsbD0iIzQzMzhGRiIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iODUiIHI9IjMiIGZpbGw9IiM0MzM4RkYiLz48L3N2Zz4=",
  "Quiche Lorraine": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkM2NEIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iI0ZGRTk5RCIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjRkZGNUU0Ii8+PGNpcmNsZSBjeD0iNjUiIGN5PSI2NSIgcj0iNSIgZmlsbD0iI0ZGNzA3NSIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iNzAiIHI9IjQiIGZpbGw9IiNGRjcwNzUiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijg1IiByPSI2IiBmaWxsPSIjRkY3MDc1Ii8+PC9zdmc+",
  "Salade César": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiM0QkNGNDciLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI1NSIgZmlsbD0iIzk0RDE5MSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjQ1IiBmaWxsPSIjQ0FFNkM3Ii8+PGNpcmNsZSBjeD0iNjUiIGN5PSI2NSIgcj0iNSIgZmlsbD0iI0ZGRkZGRiIvPjxjaXJjbGUgY3g9Ijg1IiBjeT0iNzAiIHI9IjQiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9Ijg1IiByPSI2IiBmaWxsPSIjRkZCODdDIi8+PC9zdmc+",
  "Croque-monsieur": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRkI4N0MiLz48cmVjdCB4PSI0MCIgeT0iNTAiIHdpZHRoPSI3MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI0ZGREJBMCIvPjxyZWN0IHg9IjQ1IiB5PSI2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjUiIGZpbGw9IiNGRkM2NEIiLz48cmVjdCB4PSI0NSIgeT0iNzUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1IiBmaWxsPSIjRkY3MDc1Ii8+PHJlY3QgeD0iNDUiIHk9Ijg1IiB3aWR0aD0iNjAiIGhlaWdodD0iNSIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg=="
};

export default function InteractiveReservation() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [itemNotes, setItemNotes] = useState<{[key: number]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/categories'],
  });

  const { data: menuItems = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/items'],
  });

  const reservationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/reservations', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Réservation confirmée!",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      form.reset();
      setCart([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      date: "",
      time: "",
      guests: 2,
      specialRequests: "",
      status: "pending",
    },
  });

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        menuItem: item,
        quantity: 1,
        notes: itemNotes[item.id] || ""
      }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.menuItem.id !== itemId));
    }
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: notes }));
    setCart(cart.map(cartItem =>
      cartItem.menuItem.id === itemId
        ? { ...cartItem, notes }
        : cartItem
    ));
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (parseFloat(item.menuItem.price) * item.quantity), 0
  );

  const getItemQuantity = (itemId: number) => {
    const item = cart.find(cartItem => cartItem.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const filteredItems = activeCategory 
    ? menuItems.filter((item: any) => item.categoryId === activeCategory)
    : menuItems;

  const onSubmit = (data: ReservationFormData) => {
    const reservationData = {
      ...data,
      cartItems: cart.length > 0 ? cart : undefined,
    };
    
    reservationMutation.mutate(reservationData);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'cafés': return Coffee;
      case 'boissons': return Coffee;
      case 'pâtisseries': return Cake;
      case 'plats': return Utensils;
      default: return Sandwich;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-light via-amber-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-coffee-dark mb-4">
            Réservez votre table
          </h1>
          <p className="text-lg text-coffee-medium">
            Choisissez vos plats à l'avance et savourez une expérience unique
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu et Sélection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtres par catégorie */}
            <Card className="bg-white/80 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coffee-dark">
                  <Utensils className="h-5 w-5" />
                  Notre Menu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant={activeCategory === null ? "default" : "outline"}
                    onClick={() => setActiveCategory(null)}
                    className="bg-coffee-accent hover:bg-coffee-dark"
                  >
                    Tout voir
                  </Button>
                  {categories.map((category: any) => {
                    const Icon = getCategoryIcon(category.name);
                    return (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? "default" : "outline"}
                        onClick={() => setActiveCategory(category.id)}
                        className="bg-coffee-accent hover:bg-coffee-dark"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>

                {/* Grille des produits */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredItems.map((item: any) => {
                    const quantity = getItemQuantity(item.id);
                    const productImage = productImages[item.name as keyof typeof productImages] || 
                                       categoryImages[item.categoryId as keyof typeof categoryImages];
                    
                    return (
                      <Card key={item.id} className="bg-white/90 backdrop-blur-sm border-coffee-light/30 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-coffee-light/20">
                            <img 
                              src={productImage}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          
                          <h3 className="font-semibold text-coffee-dark mb-1">{item.name}</h3>
                          <p className="text-sm text-coffee-medium mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-coffee-accent">{item.price}€</span>
                            
                            <div className="flex items-center gap-2">
                              {quantity > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {quantity > 0 && (
                                <Badge variant="secondary" className="px-2 py-1">
                                  {quantity}
                                </Badge>
                              )}
                              
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-8 w-8 p-0 bg-coffee-accent hover:bg-coffee-dark"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de réservation et panier */}
          <div className="space-y-6">
            {/* Panier */}
            {cart.length > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm border-coffee-light/30 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-coffee-dark">
                    <ShoppingCart className="h-5 w-5" />
                    Votre Sélection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between items-start p-3 bg-coffee-light/10 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-coffee-dark">{item.menuItem.name}</h4>
                        <p className="text-sm text-coffee-medium">
                          {item.quantity} × {item.menuItem.price}€
                        </p>
                        <Input
                          placeholder="Notes spéciales..."
                          value={item.notes || ""}
                          onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                          className="mt-2 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item.menuItem)}
                          className="h-6 w-6 p-0 bg-coffee-accent hover:bg-coffee-dark"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold text-coffee-dark">
                      <span>Total:</span>
                      <span>{cartTotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulaire de réservation */}
            <Card className="bg-white/90 backdrop-blur-sm border-coffee-light/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coffee-dark">
                  <Calendar className="h-5 w-5" />
                  Informations de réservation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="customerName">Nom complet</Label>
                      <Input
                        {...form.register("customerName")}
                        placeholder="Votre nom"
                        className="mt-1"
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        {...form.register("customerEmail")}
                        type="email"
                        placeholder="votre@email.com"
                        className="mt-1"
                      />
                      {form.formState.errors.customerEmail && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Téléphone</Label>
                      <Input
                        {...form.register("customerPhone")}
                        placeholder="06 12 34 56 78"
                        className="mt-1"
                      />
                      {form.formState.errors.customerPhone && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.customerPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          {...form.register("date")}
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1"
                        />
                        {form.formState.errors.date && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="time">Heure</Label>
                        <Input
                          {...form.register("time")}
                          type="time"
                          className="mt-1"
                        />
                        {form.formState.errors.time && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.time.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guests">Nombre d'invités</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4 text-coffee-medium" />
                        <Input
                          {...form.register("guests", { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="12"
                          className="flex-1"
                        />
                      </div>
                      {form.formState.errors.guests && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.guests.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Demandes spéciales</Label>
                      <Textarea
                        {...form.register("specialRequests")}
                        placeholder="Allergies, préférences..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-coffee-accent hover:bg-coffee-dark"
                    disabled={reservationMutation.isPending}
                  >
                    {reservationMutation.isPending ? (
                      "Confirmation en cours..."
                    ) : (
                      `Confirmer la réservation${cart.length > 0 ? ` (${cartTotal.toFixed(2)}€)` : ""}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}