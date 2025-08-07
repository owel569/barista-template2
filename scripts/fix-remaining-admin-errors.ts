import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class RemainingAdminErrorsFixer {
  private fixes: string[] = [];
  private errors: string[] = [];

  fixFile(filePath: string): FixResult {
    this.fixes = [];
    this.errors = [];

    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // 1. Corriger les erreurs de parenthèses manquantes dans les useState
      const useStatePattern = /const\s*\[([^\)]]*)\]\s*=\s*useState\s*\(([^)]*)\)/g;
      if (useStatePattern.test(content)) {
        content = content.replace(/const\s*\[([^\)]]*)\]\s*=\s*useState\s*\(([^)]*)\)/g, (match, destructuring, params) => {
          if (destructuring.includes('(') && !destructuring.includes(')')) {
            return `const [${destructuring})] = useState(${params})`;
          }
          if (params.includes('[']) && !params.includes(']')) {
            return `const [${destructuring}] = useState(${params}])`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses useState corrigées');
      }

      // 2. Corriger les erreurs de parenthèses dans les appels de fonction
      const functionCallPattern = /(\w+)\(([^)]*)\)/g;
      if (functionCallPattern.test(content)) {
        content = content.replace(/(\w+)\(([^)]*)\)/g, (match, func, args) => {
          if (args.includes('[']) && !args.includes(']')) {
            return `${func}(${args}])`;
          }
          if (args.includes('{'}) && !args.includes('}')) {
            return `${func}(${args}})`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses d\'appels de fonction corrigées');
      }

      // 3. Corriger les erreurs de crochets dans les tableaux
      const arrayPattern = /\[([^\)]]*)\]/g;
      if (arrayPattern.test(content)) {
        content = content.replace(/\[([^\)]]*)\]/g, (match, content) => {
          if (content.includes('(') && !content.includes(')')) {
            return `[${content})]`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Crochets de tableaux corrigés');
      }

      // 4. Corriger les erreurs de parenthèses dans les conditions
      const conditionPattern = /if\s*\(([^)]*)\)\s*\{/g;
      if (conditionPattern.test(content)) {
        content = content.replace(/if\s*\(([^])]*)\)\s*\{/g, (match, condition) => {
          if (condition.includes('[']) && !condition.includes(']')) {
            return `if (${condition}]) {`;
          }
          if (condition.includes('{'}) && !condition.includes('}')) {
            return `if (${condition)}}) {`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses de conditions corrigées');
      }

      // 5. Corriger les erreurs de parenthèses dans les objets
      const objectPattern = /\{([^)}]*)\}/g;
      if (objectPattern.test(content)) {
        content = content.replace(/\{([^)}]*)\}/g, (match, content) => {
          if (content.includes('(') && !content.includes(')')) {
            return `{${content})}`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses d\'objets corrigées');
      }

      // 6. Corriger les erreurs de virgules manquantes
      const commaPattern = /(\w+)\s*:\s*([^,}]+)([^,}])/g;
      if (commaPattern.test(content)) {
        content = content.replace(/(\w+)\s*:\s*([^,}]+)([^,}])/g, (match, key, value, end) => {
          if (end === ')}' || end === ']') {
            return `${key}: ${value},${end}`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Virgules manquantes corrigées');
      }

      // 7. Corriger les erreurs de parenthèses dans les imports
      const importPattern = /import\s*\{([^)}]*)\}\s*from\s*['"]([^'"]*)['"]/g;
      if (importPattern.test(content)) {
        content = content.replace(/import\s*\{([^)}]*)\}\s*from\s*['"]([^'"]*)['"]/g, (match, imports, path) => {
          if (imports.includes('(') && !imports.includes(')')) {
            return `import {${imports})} from '${path}'`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses d\'imports corrigées');
      }

      // 8. Corriger les erreurs de parenthèses dans les exports
      const exportPattern = /export\s*\{([^)}]*)\}/g;
      if (exportPattern.test(content)) {
        content = content.replace(/export\s*\{([^)}]*)\}/g, (match, exports) => {
          if (exports.includes('(') && !exports.includes(')')) {
            return `export {${exports})}`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses d\'exports corrigées');
      }

      // 9. Corriger les erreurs de parenthèses dans les try-catch
      const tryCatchPattern = /try\s*\{([\s\S]*?)\}\s*catch\s*\(([^)]*)\)\s*\{/g;
      if (tryCatchPattern.test(content)) {
        content = content.replace(/try\s*\{([\s\S]*?})\}\s*catch\s*\(([^)]*)\)\s*\{/g, (match, tryBlock, catchParam) => {
          if (catchParam.includes('(') && !catchParam.includes(')')) {
            return `try {${tryBlock}} catch (${catchParam}) {`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses try-catch corrigées');
      }

      // 10. Corriger les erreurs de parenthèses dans les arrow functions
      const arrowPattern = /\(([^)]*)\)\s*=>\s*\{/g;
      if (arrowPattern.test(content)) {
        content = content.replace(/\(([^])]*)\)\s*=>\s*\{/g, (match, params) => {
          if (params.includes('[']) && !params.includes(']')) {
            return `(${params}]) => {`;
          }
          if (params.includes('{'}) && !params.includes('}')) {
            return `(${params)}}) => {`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses arrow functions corrigées');
      }

      // 11. Corriger les erreurs de parenthèses dans les destructuring
      const destructuringPattern = /const\s*\{([^)}]*)\}\s*=/g;
      if (destructuringPattern.test(content)) {
        content = content.replace(/const\s*\{([^)}]*)\}\s*=/g, (match, destructuring) => {
          if (destructuring.includes('(') && !destructuring.includes(')')) {
            return `const {${destructuring})} =`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses destructuring corrigées');
      }

      // 12. Corriger les erreurs de parenthèses dans les template literals
      const templateLiteralPattern = /\$\{([^)}]*)\}/g;
      if (templateLiteralPattern.test(content)) {
        content = content.replace(/\$\{([^)}]*)\}/g, (match, expression) => {
          if (expression.includes('(') && !expression.includes(')')) {
            return `\${${expression})}`;
          }
          if (expression.includes('[']) && !expression.includes(']')) {
            return `\${${expression}]}`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses template literals corrigées');
      }

      // 13. Corriger les erreurs de JSX spécifiques
      if (filePath.includes('.tsx')) {
        // Corriger les balises JSX mal fermées
        const jsxPattern = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
        if (jsxPattern.test(content)) {
          content = content.replace(/<(\w+)[^>]*>([^<]*)<\/\1>/g, (match, tag, content) => {
            if (content.includes('{'}) && !content.includes('}')) {
              return match.replace(')}', '}}');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Balises JSX corrigées');
        }

        // Corriger les erreurs de template literals dans JSX
        const jsxTemplatePattern = /`([^`]*)`/g;
        if (jsxTemplatePattern.test(content)) {
          content = content.replace(/`([^`]*)`/g, (match, content) => {
            if (content.includes('${'}) && !content.includes('}')) {
              return match.replace('${', '${)}');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Template literals JSX corrigés');
        }

        // Corriger les erreurs de JSX avec des objets
        const jsxObjectPattern = /\{([^)}]*)\}/g;
        if (jsxObjectPattern.test(content)) {
          content = content.replace(/\{([^)}]*)\}/g, (match, content) => {
            if (content.includes('(') && !content.includes(')')) {
              return `{${content})}`;
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Objets JSX corrigés');
        }
      }

      // 14. Corriger les erreurs de parenthèses dans les hooks React
      const hookPattern = /use[A-Z]\w*\s*\(([^)]*)\)/g;
      if (hookPattern.test(content)) {
        content = content.replace(/use[A-Z]\w*\s*\(([^)]*)\)/g, (match, params) => {
          if (params.includes('[']) && !params.includes(']')) {
            return match.replace(params, `${params}]`);
          }
          if (params.includes('{'}) && !params.includes('}')) {
            return match.replace(params, `${params)}}`);
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses hooks React corrigées');
      }

      // 15. Corriger les erreurs de parenthèses dans les composants React
      const componentPattern = /React\.FC<([^>]*)>/g;
      if (componentPattern.test(content)) {
        content = content.replace(/React\.FC<([^>]*)>/g, (match, params) => {
          if (params.includes('(') && !params.includes(')')) {
            return `React.FC<${params})>`;
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses composants React corrigées');
      }

      // 16. Corriger les erreurs de parenthèses dans les interfaces
      const interfacePattern = /interface\s+\w+\s*\{([^)}]*)\}/g;
      if (interfacePattern.test(content)) {
        content = content.replace(/interface\s+\w+\s*\{([^)}]*)\}/g, (match, content) => {
          if (content.includes('(') && !content.includes(')')) {
            return match.replace(content, `${content})`);
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses interfaces corrigées');
      }

      // 17. Corriger les erreurs de parenthèses dans les types
      const typePattern = /type\s+\w+\s*=\s*([^;]+);/g;
      if (typePattern.test(content)) {
        content = content.replace(/type\s+\w+\s*=\s*([^;]+);/g, (match, typeDef) => {
          if (typeDef.includes('(') && !typeDef.includes(')')) {
            return match.replace(typeDef, `${typeDef})`);
          }
          return match;
        });
        modified = true;
        this.fixes.push('🔧 Parenthèses types corrigées');
      }

      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
      }

      return {
        file: filePath,
        fixes: this.fixes,
        errors: this.errors
      };
    } catch (error) {
      this.errors.push(`Erreur lors de la correction: ${error instanceof Error ? error.message : 'Erreur inconnue')}`);
      return {
        file: filePath,
        fixes: this.fixes,
        errors: this.errors
      };
    }
  }

  findAdminFiles(dir: string): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) return files;

    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          files.push(...this.findAdminFiles(fullPath));
        }
      } else if (item.includes('admin') && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  fixAllAdminFiles(): FixResult[] {
    const adminFiles = this.findAdminFiles('./client/src/components/admin');
    const results: FixResult[] = [];

    console.log(`🔍 Recherche de fichiers admin à corriger...`);
    console.log(`📁 ${adminFiles.length} fichiers trouvés`);

    for (const file of adminFiles) {
      console.log(`🔧 Correction de ${file)}...`);
      const result = this.fixFile(file);
      results.push(result);
    }

    return results;
  }
}

// Exécution du script
async function main() {
  console.log('🚀 Début de la correction des erreurs restantes admin...\n');

  const fixer = new RemainingAdminErrorsFixer();
  const results = fixer.fixAllAdminFiles();

  console.log('\n📊 RÉSULTATS DE LA CORRECTION RESTANTE ADMIN:\n');

  let totalFixes = 0;
  let totalErrors = 0;

  for (const result of results) {
    if (result.fixes.length > 0 || result.errors.length > 0) {
      console.log(`📄 ${result.file}`);
      
      if (result.fixes.length > 0) {
        console.log('  ✅ Corrections:');
        result.fixes.forEach(fix => console.log(`    - ${fix}`));
        totalFixes += result.fixes.length;
      }
      
      if (result.errors.length > 0) {
        console.log('  ❌ Erreurs:');
        result.errors.forEach(error => console.log(`    - ${error}`));
        totalErrors += result.errors.length;
      }
      
      console.log('');
    }
  }

  console.log(`🎯 RÉSUMÉ:`);
  console.log(`  ✅ Corrections totales: ${totalFixes}`);
  console.log(`  ❌ Erreurs totales: ${totalErrors}`);
  console.log(`  📄 Fichiers traités: ${results.length}`);

  if (totalErrors === 0) {
    console.log('\n🎉 Toutes les erreurs restantes admin ont été corrigées !');
  } else {
    console.log('\n⚠️  Certaines erreurs persistent et nécessitent une correction manuelle.');
  }
}

main().catch(console.error); 