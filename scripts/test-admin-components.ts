
#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface ComponentCheck {
  name: string;
  file: string;
  exists: boolean;
  exported: boolean;
  hasErrors: boolean;
  errors: string[];
}

async function checkAdminComponents() {
  console.log('🔍 Vérification des composants admin...\n');

  const adminDir = 'client/src/components/admin';
  const indexFile = path.join(adminDir, 'index.ts');

  // Lire le fichier index.ts
  if (!fs.existsSync(indexFile)) {
    console.error('❌ Fichier index.ts manquant dans /admin');
    return;
  }

  const indexContent = fs.readFileSync(indexFile, 'utf-8');
  
  // Extraire les exports
  const exportMatches = indexContent.match(/export.*from.*['"](.*?)['"];/g) || [];
  const defaultExports = indexContent.match(/export \{ default as (\w+) \}/g) || [];

  console.log('📋 Composants exportés trouvés:');
  
  const checks: ComponentCheck[] = [];

  // Vérifier chaque export
  for (const exportLine of exportMatches) {
    const match = exportLine.match(/export.*from.*['"](.*?)['"];/);
    if (match) {
      const filePath = match[1];
      const fullPath = path.join(adminDir, filePath + '.tsx');
      const altPath = path.join(adminDir, filePath + '.ts');
      
      const exists = fs.existsSync(fullPath) || fs.existsSync(altPath);
      const actualPath = fs.existsSync(fullPath) ? fullPath : altPath;
      
      const componentName = path.basename(filePath);
      
      let hasErrors = false;
      const errors: string[] = [];
      
      if (exists) {
        try {
          const content = fs.readFileSync(actualPath, 'utf-8');
          
          // Vérifications basiques
          if (!content.includes('export')) {
            hasErrors = true;
            errors.push('Aucun export trouvé');
          }
          
          if (content.includes('// @ts-ignore') || content.includes('// @ts-nocheck')) {
            hasErrors = true;
            errors.push('Suppressions TypeScript détectées');
          }
          
          // Vérifier les imports problématiques
          if (content.includes('toastManager') && !content.includes('import.*toastManager')) {
            hasErrors = true;
            errors.push('Import toastManager manquant');
          }
          
        } catch (error) {
          hasErrors = true;
          errors.push(`Erreur de lecture: ${error}`);
        }
      }
      
      checks.push({
        name: componentName,
        file: filePath,
        exists,
        exported: true,
        hasErrors,
        errors
      });
    }
  }

  // Afficher les résultats
  let totalComponents = checks.length;
  let workingComponents = 0;
  let errorComponents = 0;

  for (const check of checks) {
    const status = check.exists ? 
      (check.hasErrors ? '⚠️' : '✅') : '❌';
    
    console.log(`${status} ${check.name}`);
    
    if (!check.exists) {
      console.log(`    Fichier manquant: ${check.file}`);
    } else if (check.hasErrors) {
      errorComponents++;
      console.log(`    Erreurs: ${check.errors.join(', ')}`);
    } else {
      workingComponents++;
    }
  }

  console.log('\n📊 RÉSUMÉ:');
  console.log(`Total: ${totalComponents}`);
  console.log(`✅ Fonctionnels: ${workingComponents}`);
  console.log(`⚠️ Avec erreurs: ${errorComponents}`);
  console.log(`❌ Manquants: ${totalComponents - workingComponents - errorComponents}`);

  // Vérifier la connectivité API
  console.log('\n🌐 Test de connectivité API...');
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      console.log('✅ API accessible');
    } else {
      console.log(`⚠️ API répond avec status ${response.status}`);
    }
  } catch (error) {
    console.log('❌ API non accessible:', error);
  }
}

checkAdminComponents().catch(console.error);
