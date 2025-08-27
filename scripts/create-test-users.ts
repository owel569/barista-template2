
import bcrypt from 'bcrypt';
import { db, getDb } from '../server/db';
import { users } from '../shared/schema';

const logger = console;

async function createTestUsers() {
  try {
    console.log('Création des utilisateurs de test...');
    
    // Vérifier si les utilisateurs existent déjà
    const existingUsers = await await getDb().select().from(users);
    
    if (existingUsers.length > 0) {
      console.log('Des utilisateurs existent déjà:', existingUsers.map(u => u.username));
      return;
    }

    // Hasher les mots de passe
    const adminPassword = await bcrypt.hash('admin123', 10);
    const employePassword = await bcrypt.hash('employe123', 10);

    // Créer les utilisateurs
    const testUsers = [
      {
        username: 'admin',
        password: adminPassword,
        role: 'directeur',
        firstName: 'Admin',
        lastName: 'Système',
        email: 'admin@barista-cafe.com'
      },
      {
        username: 'employe',
        password: employePassword,
        role: 'employe',
        firstName: 'Employé',
        lastName: 'Test',
        email: 'employe@barista-cafe.com'
      }
    ];

    await getDb().insert(users).values(testUsers);
    console.log('✅ Utilisateurs de test créés avec succès');
    
  } catch (error) {
    logger.error('❌ Erreur lors de la création des utilisateurs:', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
}

createTestUsers();
