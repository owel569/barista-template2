/**
 * Script de correction automatique des erreurs de syntaxe
 * Version simplifiée et optimisée
 */

const fs = require('fs');
const path = require('path');

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Corrections spécifiques
    content = content
      // Correction des schémas Zod
      .replace(/z\.string\(\)\}\)\./g, 'z.string().')
      .replace(/z\.number\(\)\}\)\./g, 'z.number().')
      .replace(/z\.coerce\.number\(\)\}\)\./g, 'z.coerce.number().')
      .replace(/z\.boolean\(\)\}\)\./g, 'z.boolean().')
      .replace(/z\.enum\(\[.*?\]\)\}\)\./g, (match) => match.replace(/}\)\.$/, ').'))
      
      // Correction des dates
      .replace(/new Date\(}\)\./g, 'new Date().')
      .replace(/new Date\(.*?}\)\./g, (match) => match.replace(/}\)\.$/, ').'))
      
      // Correction des queryKey
      .replace(/queryKey: \['.*?'\] \)\}\)/g, (match) => match.replace(/ \)\}\)$/, ' }'))
      
      // Correction des paramètres
      .replace(/\(\{.*?\}\)\}\)/g, (match) => match.replace(/}\)\)$/, '})'))
      
      // Correction des templates
      .replace(/\$\{.*?\}\)/g, (match) => match.replace(/}\)$/, '}'))
      
      // Correction des tableaux
      .replace(/\[.*?\]\)/g, (match) => match.replace(/\]\)$/, ']'))
      
      // Correction des parenthèses mal fermées
      .replace(/\)\}\)/g, '})')
      .replace(/\)\}\)/g, '})')
      .replace(/\)\}\)/g, '})')
      
      // Correction des parenthèses dans les chaînes
      .replace(/'.*?'\)/g, (match) => match.replace(/\)$/, ''))
      
      // Correction des parenthèses dans les nombres
      .replace(/\d+\)/g, (match) => match.replace(/\)$/, ''))
      
      // Correction des parenthèses dans les variables
      .replace(/\w+\)/g, (match) => match.replace(/\)$/, ''));
    
    // Si le contenu a changé, écrire le fichier
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error);
    return false;
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, fileExtensions = ['.ts', '.tsx']) {
  const files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...walkDir(fullPath, fileExtensions));
    } else if (stat.isFile() && fileExtensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fonction principale
function main() {
  console.log('🔧 Début de la correction automatique des erreurs de syntaxe...');
  
  const clientDir = path.join(process.cwd(), 'client', 'src');
  const serverDir = path.join(process.cwd(), 'server');
  
  const clientFiles = walkDir(clientDir, ['.ts', '.tsx']);
  const serverFiles = walkDir(serverDir, ['.ts']);
  
  const allFiles = [...clientFiles, ...serverFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés`);
  
  let correctedCount = 0;
  
  for (const file of allFiles) {
    try {
      if (fixFile(file)) {
        correctedCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur avec ${file}:`, error);
    }
  }
  
  console.log(`✅ Correction terminée. ${correctedCount} fichiers modifiés.`);
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { fixFile, walkDir, main }; 