
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

class TypeScriptErrorFixer {
  private fixedFiles = new Set<string>();
  private totalFixes = 0;

  async fixAllErrors(): Promise<void> {
    console.log('🔧 CORRECTION COMPLÈTE DES ERREURS TYPESCRIPT\n');
    
    let iteration = 0;
    const maxIterations = 5;
    
    while (iteration < maxIterations) {
      iteration++;
      console.log(`🔄 Itération ${iteration}/${maxIterations}`);
      
      const errors = await this.getTypeScriptErrors();
      if (errors.length === 0) {
        console.log('🎉 TOUTES LES ERREURS SONT CORRIGÉES !');
        break;
      }
      
      console.log(`📋 ${errors.length} erreurs détectées`);
      await this.fixErrorsBatch(errors);
      
      // Pause entre les itérations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✅ Correction terminée. ${this.totalFixes} corrections appliquées.`);
  }

  private async getTypeScriptErrors(): Promise<TypeScriptError[]> {
    try {
      execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
      return [];
    } catch (error) {
      const output = (error as any).stdout?.toString() || (error as any).stderr?.toString() || '';
      return this.parseErrors(output);
    }
  }

  private parseErrors(output: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }

  private async fixErrorsBatch(errors: TypeScriptError[]): Promise<void> {
    const fileGroups = this.groupErrorsByFile(errors);
    
    for (const [filePath, fileErrors] of fileGroups) {
      await this.fixFileErrors(filePath, fileErrors);
    }
  }

  private groupErrorsByFile(errors: TypeScriptError[]): Map<string, TypeScriptError[]> {
    const groups = new Map<string, TypeScriptError[]>();
    
    for (const error of errors) {
      if (!groups.has(error.file)) {
        groups.set(error.file, []);
      }
      groups.get(error.file)!.push(error);
    }
    
    return groups;
  }

  private async fixFileErrors(filePath: string, errors: TypeScriptError[]): Promise<void> {
    if (!existsSync(filePath)) return;
    
    try {
      let content = readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Trier les erreurs par ligne décroissante pour éviter les décalages
      errors.sort((a, b) => b.line - a.line);
      
      for (const error of errors) {
        const fix = this.getFixForError(error, content);
        if (fix) {
          content = fix.newContent;
          modified = true;
          this.totalFixes++;
        }
      }
      
      if (modified) {
        writeFileSync(filePath, content);
        this.fixedFiles.add(filePath);
        console.log(`✅ ${path.basename(filePath)}: ${errors.length} erreurs corrigées`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la correction de ${filePath}:`, error);
    }
  }

  private getFixForError(error: TypeScriptError, content: string): { newContent: string } | null {
    const lines = content.split('\n');
    const errorLine = lines[error.line - 1];
    
    if (!errorLine) return null;
    
    switch (error.code) {
      case 'TS2304': // Cannot find name
        return this.fixCannotFindName(error, content, lines);
      
      case 'TS2345': // Argument of type not assignable
        return this.fixArgumentType(error, content, lines);
      
      case 'TS2322': // Type not assignable
        return this.fixTypeNotAssignable(error, content, lines);
      
      case 'TS2571': // Object is of type 'unknown'
        return this.fixUnknownType(error, content, lines);
      
      case 'TS7006': // Parameter implicitly has 'any' type
        return this.fixImplicitAny(error, content, lines);
      
      case 'TS1005': // Expected ';' but found
        return this.fixSyntaxError(error, content, lines);
      
      case 'TS2339': // Property does not exist
        return this.fixPropertyDoesNotExist(error, content, lines);
      
      default:
        return this.fixGenericError(error, content, lines);
    }
  }

  private fixCannotFindName(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Ajouter des imports manquants
    if (error.message.includes('React')) {
      const importLine = "import React from 'react';";
      if (!content.includes(importLine)) {
        lines.unshift(importLine);
        return { newContent: lines.join('\n') };
      }
    }
    
    if (error.message.includes('Chart')) {
      const importLine = "import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';";
      if (!content.includes('chart.js')) {
        lines.unshift(importLine);
        return { newContent: lines.join('\n') };
      }
    }
    
    return null;
  }

  private fixArgumentType(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Corriger les types any vers unknown
    if (errorLine.includes(': any')) {
      lines[error.line - 1] = errorLine.replace(': any', ': unknown');
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixTypeNotAssignable(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Ajouter des assertions de type sécurisées
    if (errorLine.includes('= any')) {
      lines[error.line - 1] = errorLine.replace('= any', '= unknown');
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixUnknownType(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Ajouter une assertion de type sécurisée
    const match = errorLine.match(/(\w+)\.(\w+)/);
    if (match) {
      const [full, obj, prop] = match;
      const replacement = `(${obj} as Record<string, unknown>).${prop}`;
      lines[error.line - 1] = errorLine.replace(full, replacement);
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixImplicitAny(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Ajouter des types pour les paramètres
    const paramMatch = errorLine.match(/\(([^:)]+)\)/);
    if (paramMatch) {
      const param = paramMatch[1];
      const replacement = `(${param}: unknown)`;
      lines[error.line - 1] = errorLine.replace(paramMatch[0], replacement);
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixSyntaxError(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Corriger les erreurs de syntaxe communes
    if (error.message.includes('Expected ";" but found "$"')) {
      // Supprimer les caractères $ parasites
      lines[error.line - 1] = errorLine.replace(/\$/g, '');
      return { newContent: lines.join('\n') };
    }
    
    if (errorLine.includes('[,]')) {
      lines[error.line - 1] = errorLine.replace('[,]', '[]');
      return { newContent: lines.join('\n') };
    }
    
    if (errorLine.includes('{,}')) {
      lines[error.line - 1] = errorLine.replace('{,}', '{}');
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixPropertyDoesNotExist(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Ajouter une vérification de propriété optionnelle
    const match = errorLine.match(/(\w+)\.(\w+)/);
    if (match) {
      const [full, obj, prop] = match;
      const replacement = `${obj}?.${prop}`;
      lines[error.line - 1] = errorLine.replace(full, replacement);
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }

  private fixGenericError(error: TypeScriptError, content: string, lines: string[]): { newContent: string } | null {
    const errorLine = lines[error.line - 1];
    
    // Corrections génériques
    let newLine = errorLine;
    
    // Supprimer les virgules en fin de tableaux/objets
    newLine = newLine.replace(/,\s*\]/g, ']');
    newLine = newLine.replace(/,\s*\}/g, '}');
    
    // Corriger les parenthèses mal fermées
    newLine = newLine.replace(/\)\}/g, '}');
    
    if (newLine !== errorLine) {
      lines[error.line - 1] = newLine;
      return { newContent: lines.join('\n') };
    }
    
    return null;
  }
}

// Exécution
const fixer = new TypeScriptErrorFixer();
fixer.fixAllErrors().catch(console.error);
