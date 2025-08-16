
#!/usr/bin/env tsx

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

interface FileMove {
  from: string;
  to: string;
  createDir?: boolean;
}

const filesToMove: FileMove[] = [
  // Composants admin
  { from: 'client/src/components/admin/dashboard-consolidated.tsx', to: 'client/src/components/admin/dashboard/dashboard-consolidated.tsx', createDir: true },
  { from: 'client/src/components/admin/user-profile-enhanced-optimized.tsx', to: 'client/src/components/admin/users/user-management.tsx', createDir: true },
  { from: 'client/src/components/admin/menu-management.tsx', to: 'client/src/components/admin/menu/menu-management.tsx', createDir: true },
  { from: 'client/src/components/admin/orders.tsx', to: 'client/src/components/admin/orders/order-management.tsx', createDir: true },
  { from: 'client/src/components/admin/analytics-dashboard.tsx', to: 'client/src/components/admin/analytics/analytics-dashboard.tsx', createDir: true },
  { from: 'client/src/components/admin/reports-system.tsx', to: 'client/src/components/admin/reports/reports-system.tsx', createDir: true },
  { from: 'client/src/components/admin/settings.tsx', to: 'client/src/components/admin/settings/settings-panel.tsx', createDir: true },
  { from: 'client/src/components/admin/permissions-management-improved.tsx', to: 'client/src/components/admin/permissions/permissions-management.tsx', createDir: true },
  
  // Hooks
  { from: 'client/src/hooks/useAuth.ts', to: 'client/src/hooks/auth/useAuth.ts', createDir: true },
  { from: 'client/src/hooks/usePermissions.ts', to: 'client/src/hooks/auth/usePermissions.ts', createDir: true },
  { from: 'client/src/hooks/useUsers.ts', to: 'client/src/hooks/data/useUsers.ts', createDir: true },
  { from: 'client/src/hooks/use-toast.ts', to: 'client/src/hooks/ui/use-toast.ts', createDir: true },
  { from: 'client/src/hooks/useWebSocket.ts', to: 'client/src/hooks/realtime/useWebSocket.ts', createDir: true },
];

function moveFile(move: FileMove) {
  try {
    if (move.createDir) {
      const dir = dirname(move.to);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`✅ Dossier créé: ${dir}`);
      }
    }
    
    if (existsSync(move.from)) {
      renameSync(move.from, move.to);
      console.log(`✅ Fichier déplacé: ${move.from} → ${move.to}`);
    } else {
      console.log(`⚠️ Fichier non trouvé: ${move.from}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du déplacement de ${move.from}:`, error);
  }
}

async function reorganizeProject() {
  console.log('🔄 Début de la réorganisation du projet...\n');
  
  // Déplacer les fichiers
  for (const move of filesToMove) {
    moveFile(move);
  }
  
  console.log('\n✅ Réorganisation terminée !');
  console.log('\n📁 Nouvelle structure créée avec succès');
  console.log('🔧 N\'oubliez pas de mettre à jour les imports dans vos fichiers');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  reorganizeProject().catch(console.error);
}
