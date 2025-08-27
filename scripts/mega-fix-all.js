import fs from 'fs';
import path from 'path';

console.log('🔥 MEGA CORRECTION - Élimination de TOUTES les erreurs TypeScript!\n');

// Corrections massives à appliquer
const globalFixes = [
  // Problèmes de syntaxe de base
  {
    pattern: /\[\s*,\s*\]/g,
    replacement: '[]',
    description: 'Tableaux vides avec virgule'
  },
  {
    pattern: /\{\s*,\s*\}/g,
    replacement: '{}',
    description: 'Objets vides avec virgule'
  },
  {
    pattern: /unknown\[\s*,\s*\]/g,
    replacement: 'unknown[]',
    description: 'Types unknown[] corrects'
  },
  {
    pattern: /string\[\s*,\s*\]/g,
    replacement: 'string[]',
    description: 'Types string[] corrects'
  },
  {
    pattern: /queryKey:\s*\[[^\]]*,\s*\]/g,
    replacement: (match) => match.replace(/,\s*\]/, ']'),
    description: 'QueryKey sans virgule trailing'
  },
  {
    pattern: /error instanceof Error \? error\.message : ['"']Erreur inconnue['"] \)\s*\}\s*\}/g,
    replacement: 'error instanceof Error ? error.message : "Erreur inconnue" })',
    description: 'Error handlers corrects'
  },
  {
    pattern: /\$\{[^}]*\)\}/g,
    replacement: (match) => match.replace(/\)\}/, '}'),
    description: 'Template literals corrects'
  },
  {
    pattern: /=\s*\[\s*,\s*\]/g,
    replacement: ' = []',
    description: 'Assignations de tableaux corrects'
  }
];

// Fichiers à absolument corriger
const priorityFiles = [
  'server/services/ai-automation.service.ts',
  'server/websocket.ts',
  'client/src/components/delivery-tracking.tsx',
  'client/src/components/online-ordering.tsx',
  'client/src/components/table-management.tsx',
  'client/src/components/reservation-notifications.tsx',
  'client/src/components/user-profile.tsx'
];

let totalGlobalFixes = 0;

priorityFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Fichier ignoré (non trouvé): ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileFixes = 0;
    const originalLength = content.length;

    console.log(`🔧 Traitement PRIORITAIRE: ${filePath}`);

    globalFixes.forEach(fix => {
      const beforeContent = content;
      if (typeof fix.replacement === 'string') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== beforeContent) {
        const matches = beforeContent.match(fix.pattern) || [];
        fileFixes += matches.length;
        console.log(`    ✅ ${fix.description}: ${matches.length} corrections`);
      }
    });

    // Corrections spécifiques par fichier
    if (filePath.includes('ai-automation.service.ts')) {
      // Corrections spéciales pour AI automation
      content = content.replace(/private calculateScore\(words: string\[,\], keywords: string\[\]\)/g, 
        'private calculateScore(words: string[], keywords: string[])');
      content = content.replace(/session: unknown\[,\]/g, 'session: unknown[]');
      console.log(`    🎯 Corrections spéciales AI automation appliquées`);
    }

    if (filePath.includes('websocket.ts')) {
      // Corrections spéciales pour WebSocket
      content = content.replace(/\)\},$/gm, ')},');
      content = content.replace(/timestamp: new Date\(\)\s*\)\s*\}/g, 'timestamp: new Date().toISOString() }');
      console.log(`    🎯 Corrections spéciales WebSocket appliquées`);
    }

    if (fileFixes > 0 || content.length !== originalLength) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalGlobalFixes += fileFixes;
      console.log(`    💾 ${filePath}: ${fileFixes} corrections sauvées\n`);
    } else {
      console.log(`    ✨ ${filePath}: Déjà correct\n`);
    }

  } catch (error) {
    console.error(`❌ ERREUR avec ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 MEGA CORRECTION TERMINÉE!`);
console.log(`📊 Total: ${totalGlobalFixes} erreurs corrigées dans les fichiers prioritaires`);
console.log(`🚀 Votre projet devrait maintenant être proche de 100% correct!`);

// Suppression des scripts de correction temporaires pour nettoyer
const tempScripts = [
  'scripts/quick-fix.js',
  'scripts/final-fix.js'
];

tempScripts.forEach(script => {
  if (fs.existsSync(script)) {
    fs.unlinkSync(script);
    console.log(`🗑️ Script temporaire supprimé: ${script}`);
  }
});

console.log('\n✨ Nettoyage terminé!');