# Services - Barista Café

## Structure des Services

### ImageManager
Service unifié pour la gestion des images du menu.

**Fichier :** `server/services/ImageManager.ts`

#### Fonctionnalités
- ✅ Cache intelligent avec invalidation automatique
- ✅ Requêtes optimisées avec relations Drizzle
- ✅ Support CDN configurable
- ✅ Images responsive (desktop/mobile)
- ✅ Migration automatique depuis l'ancien système
- ✅ Sauvegarde automatique des images Pexels
- ✅ Logging professionnel
- ✅ Gestion d'erreurs robuste
- ✅ Suppression logique/physique avec journalisation
- ✅ Restauration d'images supprimées logiquement
- ✅ Retours API structurés avec codes d'erreur appropriés
- ✅ Validation des données d'entrée
- ✅ Support suppression multiple en lot

#### Utilisation

```typescript
import { imageManager } from './services/ImageManager';

// Image optimale avec cache
const image = await imageManager.getOptimalImage(123);

// Image responsive
const responsive = await imageManager.getResponsiveImage(123);

// Suppression d'image avec gestion d'erreurs
const result = await imageManager.deleteImage(123);
if (result.success) {
    console.log('Image supprimée:', result.data);
} else {
    console.error('Erreur:', result.message);
}

// Suppression logique (recommandée)
const softDelete = await imageManager.deleteImage(123, false, userId);

// Suppression physique (irréversible)
const hardDelete = await imageManager.deleteImage(123, true, userId);

// Restauration d'image supprimée logiquement
const restore = await imageManager.restoreImage(123);

// Migration des anciennes images
await imageManager.migrateLegacyImages(mapping);

// Stats du cache
const stats = imageManager.getCacheStats();
```

#### Types Exportés

```typescript
interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  uploadMethod: 'url' | 'upload' | 'generated' | 'pexels';
  createdAt: Date;
  updatedAt: Date;
}

interface InsertMenuItemImage {
  menuItemId: number;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  uploadMethod?: 'url' | 'upload' | 'generated' | 'pexels';
}
```

#### Configuration

Variables d'environnement supportées :
- `CDN_URL` : URL du CDN pour optimiser les images
- `NODE_ENV` : Environnement (production/development)

#### Logique de Suppression

**Suppression Logique (Recommandée)**
- Marque l'image comme `isDeleted: true`
- Garde l'historique avec `deletedAt` et `deletedBy`
- Permet la restauration ultérieure
- Conforme aux bonnes pratiques RGPD
- Utilisation : `deleteImage(id, false, userId)`

**Suppression Physique (Irréversible)**
- Supprime définitivement l'enregistrement de la base
- Libère l'espace disque
- Impossible à restaurer
- Utilisation : `deleteImage(id, true, userId)`

**Restauration**
- Remet `isDeleted: false`
- Efface `deletedAt` et `deletedBy`
- L'image redevient visible dans les requêtes
- Utilisation : `restoreImage(id)`

#### Migration

Pour migrer depuis l'ancien système :

```bash
# Exécuter le script de migration
chmod +x scripts/migrate-images.ts
./scripts/migrate-images.ts
```

## Organisation

```
server/
├── services/
│   ├── ImageManager.ts    # Service unifié d'images
│   └── README.md         # Documentation
├── middleware/           # Middlewares Express
├── routes/              # Routes API
└── db.ts               # Configuration base de données
```

## Avantages de la Nouvelle Structure

1. **Unification** : Un seul service pour toutes les opérations d'images
2. **Performance** : Cache intelligent et requêtes optimisées
3. **Maintenabilité** : Code centralisé et bien documenté
4. **Sécurité** : Validation et sanitisation des données
5. **Scalabilité** : Support CDN et images responsive
6. **Monitoring** : Logging détaillé et métriques

## Migration depuis l'Ancien Système

### Avant
```typescript
// Ancien import
import { imageManager } from './image-manager';
```

### Après
```typescript
// Nouvel import
import { imageManager } from './services/ImageManager';
```

### Script de Migration
Le script `scripts/migrate-images.ts` migre automatiquement toutes les images depuis l'ancien système `IMAGE_MAPPING` vers la nouvelle base de données. 