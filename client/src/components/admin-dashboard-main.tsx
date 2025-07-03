import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Coffee,
  UserCheck,
  Package,
  BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardStats from "./dashboard-stats";
import ReservationManagement from "./reservation-management";
import OrderManagement from "./order-management-new";
import CustomerManagement from "./customer-management";
import EmployeeManagement from "./employee-management";
import MenuManagement from "./menu-management";
import ContactManagement from "./contact-management";

export default function AdminDashboardMain() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Tableau de Bord", icon: BarChart3 },
    { id: "reservations", label: "Réservations", icon: Calendar },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "customers", label: "Clients", icon: Users },
    { id: "employees", label: "Employés", icon: UserCheck },
    { id: "menu", label: "Menu", icon: Coffee },
    { id: "contacts", label: "Contacts", icon: Package }
  ];

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-900 mb-8">
          Administration Barista Café
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="reservations">
            <ReservationManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}