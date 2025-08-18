
#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as glob from 'fast-glob';

interface RouteInfo {
  file: string;
  method: string;
  path: string;
  middleware: string[];
  line: number;
}

interface RouteIssue {
  type: 'duplicate' | 'missing_auth' | 'business_logic' | 'import_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  line?: number;
  suggestion: string;
}

class RouteVerifier {
  private routes: RouteInfo[] = [];
  private issues: RouteIssue[] = [];

  async analyze(): Promise<void> {
    console.log('🔍 Analyse complète des routes...\n');

    await this.scanRoutes();
    this.detectDuplicates();
    this.checkBusinessLogic();
    this.checkAuthentication();
    this.checkImports();
    this.printReport();
  }

  private async scanRoutes(): Promise<void> {
    const routeFiles = await glob('server/routes/**/*.ts');
    
    for (const file of routeFiles) {
      this.analyzeRouteFile(file);
    }

    console.log(`📊 ${this.routes.length} routes analysées dans ${routeFiles.length} fichiers\n`);
  }

  private analyzeRouteFile(filePath: string): void {
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Détecter les routes Express
      const routeMatch = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/);
      
      if (routeMatch) {
        const [, method, path] = routeMatch;
        const middleware = this.extractMiddleware(line);
        
        this.routes.push({
          file: filePath,
          method: method.toUpperCase(),
          path,
          middleware,
          line: index + 1
        });
      }
    });
  }

  private extractMiddleware(line: string): string[] {
    const middleware: string[] = [];
    
    if (line.includes('authenticateUser')) middleware.push('authenticateUser');
    if (line.includes('requireRoles')) middleware.push('requireRoles');
    if (line.includes('validateBody')) middleware.push('validateBody');
    if (line.includes('validateParams')) middleware.push('validateParams');
    if (line.includes('asyncHandler')) middleware.push('asyncHandler');
    
    return middleware;
  }

  private detectDuplicates(): void {
    const routeMap = new Map<string, RouteInfo[]>();
    
    // Grouper par méthode + chemin
    this.routes.forEach(route => {
      const key = `${route.method} ${route.path}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, []);
      }
      routeMap.get(key)!.push(route);
    });

    // Détecter les doublons
    routeMap.forEach((routes, key) => {
      if (routes.length > 1) {
        this.issues.push({
          type: 'duplicate',
          severity: 'high',
          description: `Route dupliquée: ${key}`,
          file: routes.map(r => r.file).join(', '),
          suggestion: 'Fusionner ou supprimer les routes dupliquées'
        });
      }
    });
  }

  private checkBusinessLogic(): void {
    const businessRoutes = this.routes.filter(route => 
      route.path.includes('/orders') ||
      route.path.includes('/menu') ||
      route.path.includes('/reservations') ||
      route.path.includes('/inventory') ||
      route.path.includes('/analytics')
    );

    businessRoutes.forEach(route => {
      // Vérifier l'authentification sur les routes métier critiques
      if (!route.middleware.includes('authenticateUser')) {
        this.issues.push({
          type: 'business_logic',
          severity: 'critical',
          description: `Route métier sans authentification: ${route.method} ${route.path}`,
          file: route.file,
          line: route.line,
          suggestion: 'Ajouter authenticateUser middleware'
        });
      }

      // Vérifier la validation sur les routes POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(route.method) && 
          !route.middleware.includes('validateBody')) {
        this.issues.push({
          type: 'business_logic',
          severity: 'medium',
          description: `Route de modification sans validation: ${route.method} ${route.path}`,
          file: route.file,
          line: route.line,
          suggestion: 'Ajouter validateBody middleware'
        });
      }
    });
  }

  private checkAuthentication(): void {
    const publicRoutes = ['/health', '/test', '/auth/login', '/auth/register'];
    
    this.routes.forEach(route => {
      const isPublic = publicRoutes.some(pr => route.path.includes(pr));
      
      if (!isPublic && !route.middleware.includes('authenticateUser')) {
        this.issues.push({
          type: 'missing_auth',
          severity: 'high',
          description: `Route sans authentification: ${route.method} ${route.path}`,
          file: route.file,
          line: route.line,
          suggestion: 'Ajouter authenticateUser middleware'
        });
      }
    });
  }

  private checkImports(): void {
    const routeFiles = ['server/routes/feedback.routes.ts', 'server/routes/events.routes.ts'];
    
    routeFiles.forEach(file => {
      if (!existsSync(file)) return;
      
      const content = readFileSync(file, 'utf-8');
      
      // Vérifier les imports manquants
      if (content.includes('staffMembers') && !content.includes('export.*staffMembers')) {
        this.issues.push({
          type: 'import_error',
          severity: 'critical',
          description: `Import manquant: staffMembers dans ${file}`,
          file,
          suggestion: 'Corriger ou supprimer l\'import staffMembers'
        });
      }
    });
  }

  private printReport(): void {
    console.log('📋 RAPPORT D\'ANALYSE DES ROUTES\n');
    console.log('=' .repeat(50));

    // Statistiques générales
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');

    console.log(`🔴 Problèmes critiques: ${criticalIssues.length}`);
    console.log(`🟠 Problèmes importants: ${highIssues.length}`);
    console.log(`🟡 Problèmes moyens: ${mediumIssues.length}\n`);

    // Détail des problèmes par sévérité
    ['critical', 'high', 'medium'].forEach(severity => {
      const severityIssues = this.issues.filter(i => i.severity === severity);
      
      if (severityIssues.length > 0) {
        console.log(`\n${this.getSeverityIcon(severity)} PROBLÈMES ${severity.toUpperCase()}:`);
        console.log('-'.repeat(30));
        
        severityIssues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   📁 Fichier: ${issue.file}`);
          if (issue.line) console.log(`   📍 Ligne: ${issue.line}`);
          console.log(`   💡 Solution: ${issue.suggestion}\n`);
        });
      }
    });

    // Résumé des routes par fichier
    console.log('\n📊 RÉSUMÉ PAR FICHIER:');
    console.log('-'.repeat(30));
    
    const fileStats = new Map<string, number>();
    this.routes.forEach(route => {
      const count = fileStats.get(route.file) || 0;
      fileStats.set(route.file, count + 1);
    });

    Array.from(fileStats.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([file, count]) => {
        console.log(`${file}: ${count} routes`);
      });
  }

  private getSeverityIcon(severity: string): string {
    const icons = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '⚪';
  }
}

// Exécution
const verifier = new RouteVerifier();
verifier.analyze().catch(console.error);
