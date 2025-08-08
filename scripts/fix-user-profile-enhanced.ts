#!/usr/bin/env tsx

import fs from 'fs';

async function fixUserProfileEnhanced() {
  console.log('🔧 Correction du fichier UserProfileEnhanced.tsx...\n');

  const filePath = 'client/src/components/admin/user-profile-enhanced.tsx';
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // 1. Corriger les imports dupliqués
    if (content.includes('import { exportToExcel, exportCustomerProfiles, exportStatistics } from \'@/lib/excel-export\';;')) {
      content = content.replace(
        /import \{ exportToExcel, exportCustomerProfiles, exportStatistics \} from '\/lib\/excel-export';;/g,
        'import { exportCustomerProfiles } from \'@/lib/excel-export\';'
      );
      hasChanges = true;
      console.log('✅ Imports dupliqués corrigés');
    }

    // 2. Ajouter l'import usePermissions
    if (!content.includes('import { usePermissions }')) {
      const importIndex = content.indexOf('import { useAuth }');
      if (importIndex !== -1) {
        const insertIndex = content.indexOf('\n', importIndex) + 1;
        content = content.slice(0, insertIndex) + 
                 'import { usePermissions } from \'@/hooks/usePermissions\';\n' +
                 content.slice(insertIndex);
        hasChanges = true;
        console.log('✅ Import usePermissions ajouté');
      }
    }

    // 3. Corriger les erreurs de syntaxe dans les mutations
    const mutationPatterns = [
      {
        old: /mutationFn: async \(data: \{ id: number; updates: Partial<UserProfile> \}\)\) => \{/g,
        new: 'mutationFn: async (data: { id: number; updates: Partial<UserProfile> }) => {'
      },
      {
        old: /mutationFn: async \(data: \{ userId: number; address: Omit<Address, 'id'> \}\)\) => \{/g,
        new: 'mutationFn: async (data: { userId: number; address: Omit<Address, \'id\'> }) => {'
      },
      {
        old: /mutationFn: async \(addressId: number\}\)\) => \{/g,
        new: 'mutationFn: async (addressId: number) => {'
      }
    ];

    mutationPatterns.forEach(pattern => {
      if (content.includes(pattern.old.source)) {
        content = content.replace(pattern.old, pattern.new);
        hasChanges = true;
        console.log('✅ Erreurs de syntaxe dans les mutations corrigées');
      }
    });

    // 4. Corriger les parenthèses mal fermées
    content = content.replace(/\)\)/g, ')');
    content = content.replace(/\(\{/g, '{');
    content = content.replace(/\}\)/g, '}');

    // 5. Ajouter l'utilisation du hook usePermissions dans le composant
    if (!content.includes('const permissions = usePermissions();')) {
      const componentStart = content.indexOf('export default function UserProfileEnhanced()');
      if (componentStart !== -1) {
        const hookStart = content.indexOf('const { user } = useAuth();', componentStart);
        if (hookStart !== -1) {
          const insertIndex = content.indexOf('\n', hookStart) + 1;
          content = content.slice(0, insertIndex) + 
                   '  const permissions = usePermissions();\n' +
                   content.slice(insertIndex);
          hasChanges = true;
          console.log('✅ Hook usePermissions ajouté dans le composant');
        }
      }
    }

    // 6. Corriger les utilisations de toast
    content = content.replace(/toast\.success\(/g, 'toast.success(');
    content = content.replace(/toast\.error\(/g, 'toast.error(');

    // 7. Ajouter la fonction d'export Excel optimisée
    const exportFunction = `
  // Fonction d'export Excel optimisée
  const handleExportExcel = useCallback(async () => {
    try {
      const exportData = filteredProfiles.map((profile) => ({
        'Prénom': profile.firstName,
        'Nom': profile.lastName,
        'Email': profile.email,
        'Téléphone': profile.phone,
        'Niveau Fidélité': profile.loyalty?.level || '',
        'Points Fidélité': profile.loyalty?.points || 0,
        'Total Dépensé (€)': profile.loyalty?.totalSpent || 0,
        'Commandes': profile.orderHistory?.length || 0,
        'Panier Moyen (€)': profile.loyalty?.totalSpent / (profile.orderHistory?.length || 1),
        'Dernière Visite': profile.lastActivity || '',
        'Date d\\'Inscription': profile.loyalty?.joinDate || '',
        'Statut': profile.isActive ? 'Actif' : 'Inactif',
      }));

      await exportCustomerProfiles(exportData);
      toast.success('Export Excel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\\'export Excel:', error);
      toast.error('Échec de l\\'export Excel');
    }
  }, [filteredProfiles, toast]);`;

    if (!content.includes('const handleExportExcel')) {
      const componentStart = content.indexOf('export default function UserProfileEnhanced()');
      if (componentStart !== -1) {
        const insertIndex = content.indexOf('return (', componentStart);
        if (insertIndex !== -1) {
          content = content.slice(0, insertIndex) + 
                   exportFunction + '\n\n  ' +
                   content.slice(insertIndex);
          hasChanges = true;
          console.log('✅ Fonction d\'export Excel ajoutée');
        }
      }
    }

    // 8. Corriger les erreurs de syntaxe dans les JSX
    content = content.replace(/key=\{([^}]+)\)/g, 'key={$1}');
    content = content.replace(/className=\{([^}]+)\)/g, 'className={$1}');

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Fichier corrigé: ${filePath}`);
    } else {
      console.log('ℹ️  Aucune correction nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécution
fixUserProfileEnhanced()
  .then(() => {
    console.log('\n🎉 Correction terminée!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }); 