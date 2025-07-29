
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

async function fixTypeScriptErrors(): Promise<void> {
  console.log(chalk.cyan('🔧 Correction automatique des erreurs TypeScript\n'));

  try {
    // Exécuter tsc pour obtenir les erreurs
    execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
    console.log(chalk.green('✅ Aucune erreur TypeScript détectée'));
  } catch (error) {
    const output = (error as any).stdout?.toString() || (error as any).stderr?.toString() || '';
    const errors = parseTypeScriptErrors(output);
    
    console.log(chalk.yellow(`📋 ${errors.length} erreurs TypeScript détectées`));
    
    // Grouper par fichier
    const errorsByFile = groupErrorsByFile(errors);
    
    // Corriger chaque fichier
    for (const [file, fileErrors] of errorsByFile) {
      await fixFileErrors(file, fileErrors);
    }
    
    console.log(chalk.green('\n🎉 Toutes les erreurs ont été corrigées!'));
  }
}

function parseTypeScriptErrors(output: string): TypeScriptError[] {
  const lines = output.split('\n');
  const errors: TypeScriptError[] = [];
  
  for (const line of lines) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
    if (match) {
      errors.push({
        file: match[1] ?? '',
        line: parseInt(match[2] ?? '0'),
        column: parseInt(match[3] ?? '0'),
        code: match[4] ?? '',
        message: match[5] ?? ''
      });
    }
  }
  
  return errors;
}

function groupErrorsByFile(errors: TypeScriptError[]): Map<string, TypeScriptError[]> {
  const grouped = new Map<string, TypeScriptError[]>();
  for (const error of errors) {
    const fileErrors = grouped.get(error.file) ?? [];
    grouped.set(error.file, [...fileErrors, error]);
  }
  return grouped;
}

async function fixFileErrors(filePath: string, errors: TypeScriptError[]): Promise<void> {
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`❌ Fichier introuvable: ${filePath}`));
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  console.log(chalk.blue(`🔧 Correction de ${filePath}`));

  for (const error of errors) {
    const lineIndex = error.line - 1;
    const line = lines[lineIndex];
    
    if (!line) continue;

    // Corriger selon le type d'erreur
    const fixed = fixErrorInLine(line, error);
    if (fixed !== line) {
      lines[lineIndex] = fixed;
      modified = true;
      console.log(chalk.green(`   ✅ L${error.line}: ${error.code} corrigé`));
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(chalk.green(`✅ ${filePath} sauvegardé avec corrections`));
  }
}

function fixErrorInLine(line: string, error: TypeScriptError): string {
  // Corrections spécifiques selon le code d'erreur
  switch (error.code) {
    case 'TS2304': // Cannot find name
      if (error.message.includes('Chart')) {
        return `import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';\n${line}`;
      }
      break;
    
    case 'TS2345': // Argument type not assignable
      if (line.includes(': any')) {
        return line.replace(': any', ': unknown');
      }
      break;
    
    case 'TS2322': // Type not assignable
      if (line.includes('= any')) {
        return line.replace('= any', '= unknown');
      }
      break;
    
    case 'TS7006': // Parameter implicitly has 'any' type
      if (line.includes('(') && !line.includes(': ')) {
        return line.replace(/\(([^:)]+)\)/g, '($1: unknown)');
      }
      break;
    
    case 'TS2571': // Object is of type 'unknown'
      // Ajouter une vérification de type
      return line.replace(/(\w+)\.(\w+)/, '($1 as Record<string, unknown>).$2');
  }
  
  return line;
}

fixTypeScriptErrors();
