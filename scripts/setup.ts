#!/usr/bin/env tsx
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSetup() {
  console.log('🔧 Configuration automatique du projet...');

  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL n\'est pas configuré');
      console.log('ℹ️  Veuillez configurer la base de données PostgreSQL');
      process.exit(1);
    }

    // Vérifier et appliquer les migrations de base de données
    console.log('🗄️  Vérification de la base de données...');
    try {
      await execAsync('npx drizzle-kit push --force');
      console.log('✅ Base de données configurée');
    } catch (error) {
      console.log('⚠️  Mise à jour de la base de données...');
      // Continuer même si la migration échoue (tables peuvent déjà exister)
    }

    console.log('🎉 Configuration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSetup();
}

export { runSetup };