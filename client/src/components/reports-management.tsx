import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { UserRole } from "@/lib/permissions";

interface ReportsManagementProps {
  userRole: UserRole;
}

export default function ReportsManagement({ userRole }: ReportsManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rapports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Génération de rapports et analyses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport de ventes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyse des ventes et revenus par période
            </p>
            <Button className="w-full" disabled={userRole !== "directeur"}>
              <Download className="h-4 w-4 mr-2" />
              Générer rapport
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rapport de réservations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Statistiques des réservations et occupation
            </p>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Générer rapport
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport d'activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Journal d'activité des employés
            </p>
            <Button className="w-full" disabled={userRole === "employe"}>
              <Download className="h-4 w-4 mr-2" />
              Générer rapport
            </Button>
          </CardContent>
        </Card>
      </div>

      {userRole !== "directeur" && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <p className="text-amber-800 dark:text-amber-200">
              Certains rapports nécessitent des privilèges de directeur.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}