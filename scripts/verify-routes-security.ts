#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RouteSecurityCheck {
  file: string;
  issues: string[];
  recommendations: string[];
  securityScore: number;
}

interface SecurityIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  line?: number;
  recommendation: string;
}

class RouteSecurityVerifier {
  private issues: SecurityIssue[] = [];
  private totalRoutes = 0;
  private secureRoutes = 0;

  async verifyAllRoutes(): Promise<void> {
    console.log('🔒 Vérification de sécurité des routes...\n');

    const routeFiles = [
      'server/routes/index.ts',
      'server/routes/tables.ts',
      'server/routes/user-profile.ts',
      'server/routes/analytics.routes.ts',
      'server/routes/permissions.ts',
      'server/routes/loyalty-advanced.ts',
      'server/routes/delivery.ts',
      'server/routes/inventory-management.ts',
      'server/routes/ai.routes.ts',
      'server/routes/feedback.routes.ts',
      'server/routes/database.routes.ts',
      'server/routes/online-orders.ts',
      'server/routes/advanced-features.ts'
    ];

    for (const file of routeFiles) {
      if (existsSync(file)) {
        await this.verifyRouteFile(file);
      }
    }

    this.printSecurityReport();
  }

  private async verifyRouteFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      console.log(`📄 Vérification: ${filePath}`);
      
      // Vérifications de sécurité
      this.checkAuthentication(filePath, content, lines);
      this.checkAuthorization(filePath, content, lines);
      this.checkInputValidation(filePath, content, lines);
      this.checkErrorHandling(filePath, content, lines);
      this.checkLogging(filePath, content, lines);
      this.checkDataAccess(filePath, content, lines);
      this.checkTypeSafety(filePath, content, lines);
      this.checkBusinessLogic(filePath, content, lines);

      const securityScore = this.calculateSecurityScore();
      console.log(`  ✅ Score de sécurité: ${securityScore}/100\n`);

    } catch (error) {
      console.error(`❌ Erreur lors de la vérification de ${filePath)}:`, error);
    }
  }

  private checkAuthentication(filePath: string, content: string, lines: string[]): void {
    const routePatterns = [
      /router\.(get|post|put|delete|patch)\s*\(/g,
      /app\.(get|post|put|delete|patch)\s*\(/g
    ];

    let routeCount = 0;
    let authenticatedRoutes = 0;

    for (const line of lines) {
      for (const pattern of routePatterns) {
        if (pattern.test(line)) {
          routeCount++;
          this.totalRoutes++;

          // Vérifier si la route a une authentification
          if (line.includes('authenticateUser') || line.includes('requireRoles')) {
            authenticatedRoutes++;
            this.secureRoutes++;
          } else {
            // Routes publiques autorisées
            const publicRoutes = [
              '/health',
              '/auth/login',
              '/auth/register',
              '/test',
              '/api/public'
            ];

            const isPublicRoute = publicRoutes.some(route => line.includes(route));
            if (!isPublicRoute) {
              this.issues.push({
                type: 'high',
                description: `Route sans authentification: ${line.trim()})}`,
                line: lines.indexOf(line) + 1,
                recommendation: 'Ajouter authenticateUser middleware'
              });
            }
          }
        }
      }
    }

    if (routeCount > 0) {
      const authPercentage = (authenticatedRoutes / routeCount) * 100;
      if (authPercentage < 90) {
        this.issues.push({
          type: 'critical',
          description: `Taux d'authentification faible: ${authPercentage.toFixed(1)})}%`,
          recommendation: 'Augmenter la couverture d\'authentification'
        });
      }
    }
  }

  private checkAuthorization(filePath: string, content: string, lines: string[]): void {
    const adminRoutes = [
      '/admin/',
      '/api/admin/',
      'requireRoles',
      'permissions'
    ];

    for (const line of lines) {
      if (adminRoutes.some(route => line.includes(route))) {
        if (!line.includes('requireRoles') && !line.includes('permissions')) {
          this.issues.push({
            type: 'high',
            description: `Route admin sans autorisation: ${line.trim()})}`,
            line: lines.indexOf(line) + 1,
            recommendation: 'Ajouter requireRoles middleware'
          });
        }
      }
    }
  }

  private checkInputValidation(filePath: string, content: string, lines: string[]): void {
    const validationPatterns = [
      /validateBody/,
      /validateParams/,
      /validateQuery/,
      /z\.object/,
      /z\.string/,
      /z\.number/
    ];

    let routesWithValidation = 0;
    let totalRoutes = 0;

    for (const line of lines) {
      if (line.includes('router.') && (line.includes('post') || line.includes('put') || line.includes('patch'))) {
        totalRoutes++;
        
        if (validationPatterns.some(pattern => pattern.test(line))) {
          routesWithValidation++;
        } else {
          this.issues.push({
            type: 'medium',
            description: `Route sans validation: ${line.trim()})}`,
            line: lines.indexOf(line) + 1,
            recommendation: 'Ajouter validation Zod'
          });
        }
      }
    }

    if (totalRoutes > 0) {
      const validationPercentage = (routesWithValidation / totalRoutes) * 100;
      if (validationPercentage < 80) {
        this.issues.push({
          type: 'high',
          description: `Taux de validation faible: ${validationPercentage.toFixed(1)})}%`,
          recommendation: 'Augmenter la couverture de validation'
        });
      }
    }
  }

  private checkErrorHandling(filePath: string, content: string, lines: string[]): void {
    const errorHandlingPatterns = [
      /asyncHandler/,
      /try\s*{/,
      /catch\s*\(/,
      /logger\.error/
    )];

    let routesWithErrorHandling = 0;
    let totalRoutes = 0;

    for (const line of lines) {
      if (line.includes('router.') && line.includes('async')) {
        totalRoutes++;
        
        if (errorHandlingPatterns.some(pattern => pattern.test(line))) {
          routesWithErrorHandling++;
        } else {
          this.issues.push({
            type: 'medium',
            description: `Route sans gestion d'erreur: ${line.trim()})}`,
            line: lines.indexOf(line) + 1,
            recommendation: 'Ajouter asyncHandler et gestion d\'erreur'
          });
        }
      }
    }
  }

  private checkLogging(filePath: string, content: string, lines: string[]): void {
    const loggingPatterns = [
      /logger\.info/,
      /logger\.warn/,
      /logger\.error/,
      /createLogger/
    ];

    if (!loggingPatterns.some(pattern => pattern.test(content))) {
      this.issues.push({
        type: 'medium',
        description: 'Fichier sans logging',
        recommendation: 'Ajouter createLogger et logs appropriés'
      });
    }
  }

  private checkDataAccess(filePath: string, content: string, lines: string[]): void {
    const unsafePatterns = [
      /SELECT \*/,
      /db\.query\(/,
      /raw\(/,
      /sql\`/
    )];

    for (const line of lines) {
      if (unsafePatterns.some(pattern => pattern.test(line))) {
        this.issues.push({
          type: 'high',
          description: `Requête potentiellement dangereuse: ${line.trim()})}`,
          line: lines.indexOf(line) + 1,
          recommendation: 'Utiliser des requêtes préparées avec Drizzle ORM'
        });
      }
    }
  }

  private checkTypeSafety(filePath: string, content: string, lines: string[]): void {
    const typePatterns = [
      /interface/,
      /type\s+\w+\s*=/,
      /:\s*\w+/,
      /z\.object/
    ];

    let typeSafetyScore = 0;
    const totalLines = lines.length;

    for (const line of lines) {
      if (typePatterns.some(pattern => pattern.test(line))) {
        typeSafetyScore++;
      }
    }

    const typeSafetyPercentage = (typeSafetyScore / totalLines) * 100;
    if (typeSafetyPercentage < 20) {
      this.issues.push({
        type: 'medium',
        description: `Faible couverture de types: ${typeSafetyPercentage.toFixed(1)})}%`,
        recommendation: 'Ajouter plus d\'interfaces et types TypeScript'
      });
    }
  }

  private checkBusinessLogic(filePath: string, content: string, lines: string[]): void {
    const businessLogicPatterns = [
      /class.*Service/,
      /static.*async/,
      /validate.*Business/,
      /calculate.*/,
      /process.*/
    ];

    if (!businessLogicPatterns.some(pattern => pattern.test(content))) {
      this.issues.push({
        type: 'low',
        description: 'Logique métier manquante',
        recommendation: 'Ajouter des services métier centralisés'
      });
    }
  }

  private calculateSecurityScore(): number {
    if (this.totalRoutes === 0) return 0;
    
    const authScore = (this.secureRoutes / this.totalRoutes) * 40;
    const issuePenalty = this.issues.reduce((penalty, issue) => {
      switch (issue.type) {
        case 'critical': return penalty + 20;
        case 'high': return penalty + 10;
        case 'medium': return penalty + 5;
        case 'low': return penalty + 2;
        default: return penalty;
      }
    }, 0);

    return Math.max(0, Math.min(100, authScore - issuePenalty));
  }

  private printSecurityReport(): void {
    console.log('\n📊 RAPPORT DE SÉCURITÉ DES ROUTES');
    console.log('================================\n');

    console.log(`📈 Statistiques:`);
    console.log(`   - Routes totales: ${this.totalRoutes}`);
    console.log(`   - Routes sécurisées: ${this.secureRoutes}`);
    console.log(`   - Taux de sécurité: ${((this.secureRoutes / this.totalRoutes)}) * 100).toFixed(1)}%`);
    console.log(`   - Problèmes détectés: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 PROBLÈMES DÉTECTÉS:');
      
      const criticalIssues = this.issues.filter(i => i.type === 'critical');
      const highIssues = this.issues.filter(i => i.type === 'high');
      const mediumIssues = this.issues.filter(i => i.type === 'medium');
      const lowIssues = this.issues.filter(i => i.type === 'low');

      if (criticalIssues.length > 0) {
        console.log('\n🔴 CRITIQUES:');
        criticalIssues.forEach(issue => {
          console.log(`   - ${issue.description}`);
          console.log(`     Recommandation: ${issue.recommendation}`);
        });
      }

      if (highIssues.length > 0) {
        console.log('\n🟠 ÉLEVÉS:');
        highIssues.forEach(issue => {
          console.log(`   - ${issue.description}`);
          if (issue.line) console.log(`     Ligne: ${issue.line}`);
          console.log(`     Recommandation: ${issue.recommendation}`);
        });
      }

      if (mediumIssues.length > 0) {
        console.log('\n🟡 MOYENS:');
        mediumIssues.forEach(issue => {
          console.log(`   - ${issue.description}`);
          if (issue.line) console.log(`     Ligne: ${issue.line}`);
          console.log(`     Recommandation: ${issue.recommendation}`);
        });
      }

      if (lowIssues.length > 0) {
        console.log('\n🟢 FAIBLES:');
        lowIssues.forEach(issue => {
          console.log(`   - ${issue.description}`);
          console.log(`     Recommandation: ${issue.recommendation}`);
        });
      }
    }

    const overallScore = this.calculateSecurityScore();
    console.log(`\n🎯 SCORE GLOBAL DE SÉCURITÉ: ${overallScore}/100`);

    if (overallScore >= 90) {
      console.log('✅ EXCELLENT - Sécurité optimale');
    } else if (overallScore >= 80) {
      console.log('🟢 BON - Sécurité satisfaisante');
    } else if (overallScore >= 70) {
      console.log('🟡 MOYEN - Améliorations nécessaires');
    } else {
      console.log('🔴 CRITIQUE - Actions immédiates requises');
    }

    console.log('\n🚀 RECOMMANDATIONS FINALES:');
    console.log('1. Corriger tous les problèmes critiques et élevés');
    console.log('2. Augmenter la couverture d\'authentification');
    console.log('3. Améliorer la validation des entrées');
    console.log('4. Centraliser la logique métier');
    console.log('5. Implémenter des tests de sécurité');
  }
}

// Exécution du script
const verifier = new RouteSecurityVerifier();
verifier.verifyAllRoutes().catch(console.error); 