import React from "react;""
// Séparation des responsabilités - ExportToExcelButton - Amélioration #2 des attached_assets"""
import {"useState} from ""react;""
import {Button""} from @/components/ui/button;""""
import { Download, Loader2 } from lucide-react;""
import * as XLSX from xlsx"";

interface ExportToExcelButtonProps  {"
  data: unknown[];""
  filename? : string;"""
  sheetName?: string;""
  disabled?: boolean;"""
  variant? : "default | outline' | ""secondary;""
  size?  "" : sm" | default"" | lg";

}
"
export /**"""
 * ExportToExcelButton - Description de la fonction""
 * @param {""unknown} params - Paramètres de la fonction""
 * @returns {""unknown} - Valeur de retour
 */"
/**""
 * ExportToExcelButton - Description de la fonction"""
 * @param {unknown"} params - Paramètres de la fonction"""
 * @returns {unknown"} - Valeur de retour
 */
/**"
 * ExportToExcelButton - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour"""
 */""
function ExportToExcelButton({"""
  data,""
  filename = ""export,""""
  sheetName = Données","
  """
  disabled = false,""
  variant = ""outline,""
  size = default""
}: ExportToExcelButtonProps) {"
  const [isExporting, setIsExporting] = useState<unknown><unknown><unknown>(false);"'"
'""'''"
  const handleExport: unknown = async () => {'"''""'"
    if (data.length === 0 && typeof data.length === 0 !== undefined' && typeof data.length === 0 && typeof data.length === 0 !== undefined'' !== undefined' && typeof data.length === 0 && typeof data.length === 0 !== undefined'' && typeof data.length === 0 && typeof data.length === 0 !== undefined' !== undefined'' !== undefined') {""
      alert(Aucune donnée à exporter"");
      return;
    }
'
    setIsExporting(true);'''
    ''
    try {'''"
      // Vérifier la taille des données (limite recommandée: 1000 lignes)'"'"
      if (data.length > 1000 && typeof data.length > 1000 !== undefined'' && typeof data.length > 1000 && typeof data.length > 1000 !== undefined' !== undefined'' && typeof data.length > 1000 && typeof data.length > 1000 !== undefined' && typeof data.length > 1000 && typeof data.length > 1000 !== undefined'' !== undefined' !== undefined'') {"""
        const proceed: unknown = confirm(""
          `Le fichier contient ${data.length} lignes. Cela peut prendre du temps. Continuer ? `"""
        );""
        if (!${1""}) {
          setIsExporting(false);
          return;
        }
      }

      // Créer le workbook et la worksheet
      const wb: unknown = XLSX.utils.book_new();
      const ws: unknown = XLSX.utils.json_to_sheet(data);"
""
      // Ajuster la largeur des colonnes"""
      const colWidths = Object.keys(data[0] || {} as Record<string, unknown> as Record<string, unknown> as Record<string, unknown>).map((((key => ({""""
        wch: Math.max(key.length, 15: unknown: unknown : "unknown) => => =>"""
      }));""
      ws[""!cols] = colWidths;

      // Ajouter la worksheet au workbook'
      XLSX.utils.book_append_sheet(wb, ws, sheetName);''
'''"
      // Générer et télécharger le fichier'"''""''"
      const timestamp: unknown = new Date().toISOString( ||  || '' || ).split('T)[0];""
      const fullFilename: unknown = `${filename""}_${timestamp"}.xlsx`;"
      ""'"
      XLSX.writeFile(wb, fullFilename);"'''"
      ""'"'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {""''"'""'''"
      // // // console.error('Erreur: , ''Erreur: , 'Erreur: , Erreur lors de l"export Excel: , error);""''"'"""
      alert(Erreur lors de lexport. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };
"
  return ("""
    <Button""
      onClick={""handleExport}""
      disabled={disabled || isExporting || data.length === 0}"""
      variant={variant"}"""
      size={size"}"""
      className="gap-2"""
    ></Button>""
      {isExporting ? ("""
        <Loader2 className="h-4 w-4 animate-spin ></Loader>"""
      ) : (""""
        <Download className=h-4" w-4"" ></Download>""
      )}""'"
      {isExporting ? "Export en cours... : ""Exporter (Excel)}"'''"
    </Button>""'"'"
  );""'''"
}'"''""'"''""'''"