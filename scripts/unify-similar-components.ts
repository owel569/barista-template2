
#!/usr/bin/env tsx

/**
 * Script pour détecter et unifier les composants similaires
 * Analyse le code pour trouver des patterns répétitifs et proposer des unifications
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface ComponentAnalysis {
  file: string;
  componentName: string;
  props: string[];
  imports: string[];
  patterns: string[];
  similarity: number;
}

class ComponentUnifier {
  private components: ComponentAnalysis[] = [];
  private similarityThreshold = 0.7;

  /**
   * Analyse un fichier pour extraire les informations du composant
   */
  private analyzeComponent(filePath: string): ComponentAnalysis | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Extraire le nom du composant
      const componentMatch = content.match(/(?:export\s+)?(?:const|function)\s+(\w+)/);
      if (!componentMatch) return null;

      const componentName = componentMatch[1];

      // Extraire les props
      const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
      const props = propsMatch ? 
        propsMatch[1].split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('//'))
          .map(line => line.split(':')[0]?.trim())
          .filter(Boolean) : [];

      // Extraire les imports
      const importMatches = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];
      const imports = importMatches.map(imp => imp.trim());

      // Détecter les patterns communs
      const patterns = [];
      if (content.includes('Card')) patterns.push('Card');
      if (content.includes('CardContent')) patterns.push('CardContent');
      if (content.includes('CardHeader')) patterns.push('CardHeader');
      if (content.includes('Badge')) patterns.push('Badge');
      if (content.includes('Skeleton')) patterns.push('Skeleton');
      if (content.includes('className')) patterns.push('Styling');
      if (content.includes('onClick')) patterns.push('Interactive');
      if (content.includes('loading')) patterns.push('Loading');
      if (content.includes('icon')) patterns.push('Icon');

      return {
        file: filePath,
        componentName,
        props,
        imports,
        patterns,
        similarity: 0
      };
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Calcule la similarité entre deux composants
   */
  private calculateSimilarity(comp1: ComponentAnalysis, comp2: ComponentAnalysis): number {
    // Similarité basée sur les patterns communs
    const commonPatterns = comp1.patterns.filter(p => comp2.patterns.includes(p));
    const patternScore = commonPatterns.length / Math.max(comp1.patterns.length, comp2.patterns.length);

    // Similarité basée sur les props communes
    const commonProps = comp1.props.filter(p => comp2.props.includes(p));
    const propsScore = commonProps.length / Math.max(comp1.props.length, comp2.props.length);

    // Similarité basée sur les imports communs
    const commonImports = comp1.imports.filter(i => comp2.imports.includes(i));
    const importsScore = commonImports.length / Math.max(comp1.imports.length, comp2.imports.length);

    // Score pondéré
    return (patternScore * 0.5) + (propsScore * 0.3) + (importsScore * 0.2);
  }

  /**
   * Trouve tous les fichiers de composants
   */
  private findComponentFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!existsSync(dir)) return files;

    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(item)) {
          files.push(...this.findComponentFiles(fullPath));
        } else if (item.endsWith('.tsx') && !item.includes('.test.') && !item.includes('.stories.')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de fichiers:', error);
    }
    
    return files;
  }

  /**
   * Analyse tous les composants et trouve les similitudes
   */
  public async analyzeProject(): Promise<void> {
    console.log('🔍 ANALYSE DES COMPOSANTS SIMILAIRES');
    console.log('=====================================\n');

    // Trouver tous les fichiers de composants
    const componentFiles = this.findComponentFiles('client/src/components');
    console.log(`📂 ${componentFiles.length} fichiers de composants trouvés\n`);

    // Analyser chaque composant
    for (const file of componentFiles) {
      const analysis = this.analyzeComponent(file);
      if (analysis) {
        this.components.push(analysis);
      }
    }

    console.log(`📊 ${this.components.length} composants analysés\n`);

    // Calculer les similarités
    const similarGroups: ComponentAnalysis[][] = [];
    const processed = new Set<string>();

    for (let i = 0; i < this.components.length; i++) {
      if (processed.has(this.components[i].file)) continue;

      const group = [this.components[i]];
      processed.add(this.components[i].file);

      for (let j = i + 1; j < this.components.length; j++) {
        if (processed.has(this.components[j].file)) continue;

        const similarity = this.calculateSimilarity(this.components[i], this.components[j]);
        
        if (similarity >= this.similarityThreshold) {
          group.push(this.components[j]);
          processed.add(this.components[j].file);
        }
      }

      if (group.length > 1) {
        similarGroups.push(group);
      }
    }

    // Afficher les résultats
    if (similarGroups.length === 0) {
      console.log('✅ Aucun composant similaire détecté');
    } else {
      console.log(`🔗 ${similarGroups.length} groupe(s) de composants similaires détectés:\n`);
      
      similarGroups.forEach((group, index) => {
        console.log(`📦 Groupe ${index + 1} (${group.length} composants):`);
        group.forEach(comp => {
          console.log(`   - ${comp.componentName} (${comp.file})`);
        });
        console.log(`   Patterns communs: ${group[0].patterns.join(', ')}\n`);
      });

      // Proposer des améliorations
      console.log('💡 RECOMMANDATIONS:\n');
      similarGroups.forEach((group, index) => {
        console.log(`🔧 Groupe ${index + 1}:`);
        console.log(`   - Créer un composant unifié basé sur les patterns: ${group[0].patterns.join(', ')}`);
        console.log(`   - Centraliser la logique commune`);
        console.log(`   - Utiliser des props génériques\n`);
      });
    }
  }
}

// Exécution du script
async function main() {
  const unifier = new ComponentUnifier();
  await unifier.analyzeProject();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
