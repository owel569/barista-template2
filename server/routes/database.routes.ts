
import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Route pour forcer la création des tables manquantes
router.post('/force-init', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Initialisation forcée de la base de données...');
    
    // Importation dynamique du module de base de données
    const { getDb } = await import('../db');
    const db = await getDb();
    
    // Vérification que les tables existent
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tables existantes:', tables.rows?.map(t => t.table_name) || []);
    
    res.json({ 
      message: 'Vérification de la base de données terminée',
      tables: tables.rows?.map(t => t.table_name) || [],
      status: 'success'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation forcée:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'initialisation', 
      error: error.message,
      status: 'error'
    });
  }
}));

// Route pour recréer les tables SQLite si nécessaire
router.post('/recreate-tables', authenticateToken, requireRole('directeur'), asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Recréation des tables SQLite...');
    
    // Exécuter le script de setup universel
    const { execSync } = await import('child_process');
    const result = execSync('node setup-universal.js', { encoding: 'utf8' });
    
    console.log('✅ Tables recréées avec succès');
    
    res.json({ 
      message: 'Tables recréées avec succès',
      output: result,
      status: 'success'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la recréation des tables:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la recréation des tables', 
      error: error.message,
      status: 'error'
    });
  }
}));

export default router;
