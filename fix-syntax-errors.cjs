const fs = require('fs');
const path = require('path');

// Fonction pour corriger les erreurs de syntaxe courantes
function fixSyntaxErrors(content) {
  let fixed = content;
  
  // Corriger les parenthèses fermantes en trop dans les objets
  fixed = fixed.replace(/\)\s*}\s*\)\s*;?/g, '});');
  fixed = fixed.replace(/\)\s*}\s*\)\s*\)/g, '}));');
  
  // Corriger les parenthèses fermantes en trop dans les appels de fonction
  fixed = fixed.replace(/\)\s*\)\s*\)/g, '))');
  fixed = fixed.replace(/\)\s*\)\s*;?/g, ');');
  
  // Corriger les parenthèses mal placées dans les props JSX
  fixed = fixed.replace(/key=\{([^}]+)\)\}/g, 'key={$1}');
  fixed = fixed.replace(/onClick=\{\(\)\s*\)\s*=>/g, 'onClick={() =>');
  
  // Corriger les erreurs dans les chaînes de caractères
  fixed = fixed.replace(/\{([^}]+)\)\}/g, '{$1}');
  
  // Corriger les erreurs dans les appels de logger
  fixed = fixed.replace(/logger\.error\([^)]+\)\s*\)\s*\)\s*;?/g, (match) => {
    return match.replace(/\)\s*\)\s*\)\s*;?$/, ');');
  });
  
  return fixed;
}

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixSyntaxErrors(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Traitement principal
const clientDir = path.join(__dirname, 'client', 'src');
const files = walkDir(clientDir);

console.log(`🔍 Found ${files.length} files to process...`);

let fixedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);