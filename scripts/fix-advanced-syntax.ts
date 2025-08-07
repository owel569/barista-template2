import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class AdvancedSyntaxFixer {
  private fixes: string[] = [];
  private errors: string[] = [];

  fixFile(filePath: string): FixResult {
    this.fixes = [];
    this.errors = [];

    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // 1. Corriger les erreurs de parenthèses manquantes dans les routes
      if (filePath.includes('/routes/')) {
        // Corriger les routes sans parenthèses fermantes
        const routeEndPattern = /router\.(get|post|put|delete|patch)\s*\([^)]*,\s*asyncHandler\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?\s*$/gm;
        if (routeEndPattern.test(content)) {
          content = content.replace(routeEndPattern, (match) => {
            if (!match.endsWith('}));')) {
              return match.replace(/\);?\s*$/, '}));');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Parenthèses de routes corrigées');
        }

        // Corriger les routes simples
        const simpleRouteEndPattern = /router\.(get|post|put|delete|patch)\s*\([^)]*,\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?\s*$/gm;
        if (simpleRouteEndPattern.test(content)) {
          content = content.replace(simpleRouteEndPattern, (match) => {
            if (!match.endsWith('}));')) {
              return match.replace(/\);?\s*$/, '}));');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Parenthèses de routes simples corrigées');
        }
      }

      // 2. Corriger les erreurs de JSX dans les composants React
      if (filePath.includes('.tsx') && filePath.includes('/components/')) {
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

        // Corriger les erreurs de template literals
        const templatePattern = /`([^`]*)`/g;
        if (templatePattern.test(content)) {
          content = content.replace(/`([^`]*)`/g, (match, content) => {
            if (content.includes('${'}) && !content.includes('}')) {
              return match.replace('${', '${)}');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Template literals corrigés');
        }
      }

      // 3. Corriger les erreurs de parenthèses dans les appels de fonction
      const functionCallPattern = /(\w+)\([^)]*\)/g;
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

      // 4. Corriger les erreurs de crochets dans les tableaux
      const arrayPattern = /\[[^\]]*\]/g;
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

      // 5. Corriger les erreurs de parenthèses dans les conditions
      const conditionPattern = /if\s*\([^)]*\)\s*\{/g;
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

      // 6. Corriger les erreurs de parenthèses dans les objets
      const objectPattern = /\{[^}]*\}/g;
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

      // 7. Corriger les erreurs de virgules manquantes
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

      // 8. Corriger les erreurs de parenthèses dans les imports
      const importPattern = /import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]/g;
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

      // 9. Corriger les erreurs de parenthèses dans les exports
      const exportPattern = /export\s*\{[^}]*\}/g;
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

      // 10. Corriger les erreurs de parenthèses dans les relations Drizzle
      if (filePath.includes('schema.ts')) {
        const relationPattern = /export const \w+Relations = relations\([^)]*,\s*\([^)]*\)\s*=>\s*\(\{[\s\S]*?\}\s*\)\s*;?\s*$/gm;
        if (relationPattern.test(content)) {
          content = content.replace(relationPattern, (match) => {
            if (!match.endsWith('}));')) {
              return match.replace(/\);?\s*$/, '}));');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Parenthèses de relations Drizzle corrigées');
        }
      }

      // 11. Corriger les erreurs de parenthèses dans les app.use
      if (filePath.includes('index.ts') && filePath.includes('server/')) {
        const appUsePattern = /app\.use\([^)]*\);?\s*$/gm;
        if (appUsePattern.test(content)) {
          content = content.replace(appUsePattern, (match) => {
            if (!match.endsWith('));')) {
              return match.replace(/\);?\s*$/, '));');
            }
            return match;
          });
          modified = true;
          this.fixes.push('🔧 Parenthèses app.use corrigées');
        }
      }

      // 12. Corriger les erreurs de parenthèses dans les try-catch
      const tryCatchPattern = /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{/g;
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

      // 13. Corriger les erreurs de parenthèses dans les arrow functions
      const arrowPattern = /\([^)]*\)\s*=>\s*\{/g;
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

      // 14. Corriger les erreurs de parenthèses dans les destructuring
      const destructuringPattern = /const\s*\{[^}]*\}\s*=/g;
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

      // 15. Corriger les erreurs de parenthèses dans les template literals
      const templateLiteralPattern = /\$\{[^}]*\}/g;
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

  findSourceFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) return files;

    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          files.push(...this.findSourceFiles(fullPath, extensions));
        }
      } else if (extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  fixAllFiles(): FixResult[] {
    const sourceFiles = this.findSourceFiles('.');
    const results: FixResult[] = [];

    console.log(`🔍 Recherche de fichiers à corriger...`);
    console.log(`📁 ${sourceFiles.length} fichiers trouvés`);

    for (const file of sourceFiles) {
      console.log(`🔧 Correction de ${file)}...`);
      const result = this.fixFile(file);
      results.push(result);
    }

    return results;
  }
}

// Exécution du script
async function main() {
  console.log('🚀 Début de la correction avancée des erreurs de syntaxe...\n');

  const fixer = new AdvancedSyntaxFixer();
  const results = fixer.fixAllFiles();

  console.log('\n📊 RÉSULTATS DE LA CORRECTION AVANCÉE:\n');

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
    console.log('\n🎉 Toutes les erreurs de syntaxe avancées ont été corrigées !');
  } else {
    console.log('\n⚠️  Certaines erreurs persistent et nécessitent une correction manuelle.');
  }
}

main().catch(console.error); 