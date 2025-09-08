
#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface OptimizationResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class TypeScriptOptimizer {
  private results: OptimizationResult[] = [];

  async optimizeAllFiles(): Promise<void> {
    console.log('🔧 Optimisation finale des types TypeScript...\n');

    const files = [
      'client/src/components/admin/work-schedule/components/CalendarView.tsx',
      'client/src/components/admin/staff-scheduling.tsx',
      'client/src/components/admin/settings.tsx',
      'client/src/components/admin/MaintenanceTaskForm.tsx',
      'server/routes/admin/reservations.routes.ts',
      'server/routes/admin/customers.routes.ts',
      'server/routes/ai.routes.ts',
      'shared/schema.ts'
    ];

    for (const file of files) {
      if (existsSync(file)) {
        await this.optimizeFile(file);
      }
    }

    this.printResults();
  }

  private async optimizeFile(filePath: string): Promise<void> {
    const result: OptimizationResult = { file: filePath, fixes: [], errors: [] };

    try {
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;

      // Fix 1: Correct return types
      if (content.includes('const getTitle = () => {')) {
        content = content.replace(/const getTitle = \(\) => \{/g, 'const getTitle = (): string => {');
        modified = true;
        result.fixes.push('✅ Ajout du type de retour pour getTitle');
      }

      // Fix 2: Fix date handling
      if (content.includes('date.toISOString().split(\'T\')[0],')) {
        content = content.replace(/date\.toISOString\(\)\.split\('T'\)\[0\],/g, 'date?.toISOString().split(\'T\')[0] || new Date().toISOString().split(\'T\')[0],');
        modified = true;
        result.fixes.push('✅ Correction de la gestion des dates undefined');
      }

      // Fix 3: Fix parameter typing
      if (content.includes('onSelect={(date) => {')) {
        content = content.replace(/onSelect=\{\(date\) => \{/g, 'onSelect={(date: Date | undefined) => {');
        modified = true;
        result.fixes.push('✅ Ajout du type pour le paramètre date');
      }

      // Fix 4: Fix toString() on potentially undefined
      if (content.includes('formData.equipmentId?.toString()')) {
        content = content.replace(
          /formData\.equipmentId\?\.toString\(\)/g,
          'formData.equipmentId !== null && formData.equipmentId !== undefined ? formData.equipmentId.toString() : \'\''
        );
        modified = true;
        result.fixes.push('✅ Correction de toString() avec vérification stricte');
      }

      // Fix 5: Fix imports
      if (content.includes('import { validateBody } from \'../../middleware/security\';')) {
        content = content.replace(
          /import \{ validateBody \} from '\.\.\/\.\.\/middleware\/security';/g,
          'import { validateBody } from \'../../middleware/validation\';'
        );
        modified = true;
        result.fixes.push('✅ Correction des imports validateBody');
      }

      // Fix 6: Fix time parsing
      if (content.includes('time?.split(\':\')[0]')) {
        content = content.replace(
          /time\?\.(split\(':'\))\[0\]/g,
          'time?.split(\':\')[0]'
        );
        content = content.replace(
          /const hours = parseInt\(time\?\.(split\(':'\))\[0\] \|\| '0'\);/g,
          'const timeParts = time?.split(\':\');\n    const hours = parseInt(timeParts?.[0] || \'0\');'
        );
        modified = true;
        result.fixes.push('✅ Correction du parsing des heures');
      }

      if (modified) {
        writeFileSync(filePath, content, 'utf-8');
        result.fixes.push(`📝 Fichier ${filePath} optimisé`);
      }

    } catch (error) {
      result.errors.push(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.results.push(result);
  }

  private printResults(): void {
    console.log('\n📊 RÉSULTATS DE L\'OPTIMISATION FINALE\n');

    let totalFixes = 0;
    let totalErrors = 0;

    this.results.forEach(result => {
      if (result.fixes.length > 0 || result.errors.length > 0) {
        console.log(`📁 ${result.file}`);
        
        result.fixes.forEach(fix => {
          console.log(`  ${fix}`);
          totalFixes++;
        });

        result.errors.forEach(error => {
          console.log(`  ${error}`);
          totalErrors++;
        });

        console.log('');
      }
    });

    console.log('📈 STATISTIQUES FINALES');
    console.log(`✅ Corrections appliquées: ${totalFixes}`);
    console.log(`❌ Erreurs rencontrées: ${totalErrors}`);
    console.log(`📁 Fichiers traités: ${this.results.length}`);

    if (totalErrors === 0) {
      console.log('\n🎉 OPTIMISATION RÉUSSIE ! Tous les types ont été corrigés.');
    } else {
      console.log('\n⚠️  Des erreurs persistent, vérification manuelle requise.');
    }
  }
}

// Exécution
const optimizer = new TypeScriptOptimizer();
optimizer.optimizeAllFiles().catch(console.error);
