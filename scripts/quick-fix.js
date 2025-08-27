import fs from 'fs';
import path from 'path';

// Corrections à appliquer
const fixes = [
  // Erreurs de syntaxe communes
  {
    pattern: /\[,\]/g,
    replacement: '[]',
    description: 'Tableaux vides avec virgule'
  },
  {
    pattern: /queryKey:\s*\[[^\]]*,\s*\]/g,
    replacement: (match) => match.replace(/,\s*\]/, ']'),
    description: 'Virgules trailing dans queryKey'
  },
  {
    pattern: /=\s*\[\s*,\s*\]/g,
    replacement: ' = []',
    description: 'Assignations de tableaux vides'
  },
  {
    pattern: /error\s+instanceof\s+Error\s+\?\s+error\.message\s+:\s+['"']Erreur inconnue['"]\s*\)\s*\}\s*\}/g,
    replacement: (match) => match.replace(/\)\s*\}\s*\}/, ' })'),
    description: 'Error handlers mal formés'
  }
];

// Fichiers à corriger
const filesToFix = [
  'client/src/components/delivery-tracking.tsx',
  'client/src/components/menu.tsx',
  'client/src/components/online-ordering.tsx',
  'client/src/components/table-management.tsx',
  'client/src/components/reservation-notifications.tsx'
];

function applyFixes() {
  console.log('🔧 Application des corrections rapides...\n');
  
  let totalFixes = 0;
  
  filesToFix.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Fichier non trouvé: ${filePath}`);
      return;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let fileFixes = 0;
      
      fixes.forEach(fix => {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          fileFixes += matches.length;
          console.log(`  ✅ ${fix.description}: ${matches.length} corrections`);
        }
      });
      
      if (fileFixes > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${filePath}: ${fileFixes} corrections appliquées\n`);
        totalFixes += fileFixes;
      }
      
    } catch (error) {
      console.error(`❌ Erreur avec ${filePath}:`, error.message);
    }
  });
  
  console.log(`🎉 ${totalFixes} corrections appliquées au total!`);
}

applyFixes();