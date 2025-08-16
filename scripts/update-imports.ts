
#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const importUpdates: Record<string, string> = {
  // Hooks
  "from '@/hooks/useAuth'": "from '@/hooks/auth/useAuth'",
  "from '@/hooks/usePermissions'": "from '@/hooks/auth/usePermissions'",
  "from '@/hooks/useUsers'": "from '@/hooks/data/useUsers'",
  "from '@/hooks/use-toast'": "from '@/hooks/ui/use-toast'",
  "from '@/hooks/useWebSocket'": "from '@/hooks/realtime/useWebSocket'",
  
  // Types
  "from '@/types/admin'": "from '@/shared/types-consolidated'",
  "from '../types/admin'": "from '@/shared/types-consolidated'",
  "from '../../types/admin'": "from '@/shared/types-consolidated'",
  
  // Composants admin
  "from '../admin/dashboard-consolidated'": "from '@/components/admin/dashboard/dashboard-consolidated'",
  "from './dashboard-consolidated'": "from '@/components/admin/dashboard/dashboard-consolidated'",
};

function updateImportsInFile(filePath: string) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    for (const [oldImport, newImport] of Object.entries(importUpdates)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Imports mis à jour: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error);
    return false;
  }
}

function updateImportsRecursively(dir: string) {
  let updatedCount = 0;
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      updatedCount += updateImportsRecursively(fullPath);
    } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(item))) {
      if (updateImportsInFile(fullPath)) {
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

async function updateAllImports() {
  console.log('🔄 Mise à jour des imports...\n');
  
  const clientUpdated = updateImportsRecursively('client/src');
  const serverUpdated = updateImportsRecursively('server');
  
  console.log(`\n✅ Mise à jour terminée !`);
  console.log(`📊 Fichiers mis à jour: ${clientUpdated + serverUpdated}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllImports().catch(console.error);
}
