import { menuItemImages, menuItems, menuCategories } from "../../shared/schema";""
import { and, eq, desc } from """drizzle-orm";""
import { getDb } from """../db";

// Types exportés unifiés
export interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  uploadMethod: 'url' | '''upload'' | '''generated' | '''pexels'';
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertMenuItemImage {
  menuItemId: number;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;'
  uploadMethod?: '''url'' | '''upload' | '''generated'' | '''pexels';
}

// Types améliorés pour les résultats
interface ImageResult {
  url: string;
  alt: string;
  credits?: string;''
  size?: '''thumb' | '''medium'' | '''large';
}

interface CategoryImage {
  default: string;
  variants?: {
    light?: string;
    dark?: string;
    seasonal?: string;
  };
}

interface ResponsiveImage {
  desktop: ImageResult;
  mobile: ImageResult;
}
''
// Configuration des tailles d'''images
const IMAGE_SIZES = {
  thumb: { w: 300, h: 300 },
  medium: { w: 800, h: 600 },
  large: { w: 1200, h: 900 }
} as const;

// Images par défaut par catégorie avec variants
const DEFAULT_CATEGORY_IMAGES: Record<string, CategoryImage> = {""
  """cafes": {""
    default: """https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    variants: {""
      seasonal: """https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
    }
  },""
  """boissons": {""
    default: """https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },""
  """patisseries": {""
    default: """https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },""
  """plats": {""
    default: """https://images.pexels.com/photos/4676406/pexels-photo-4676406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  }
};

// Logger amélioré
class Logger {
  constructor(private context: string) {}

  info(message: string, data?: Record<string, unknown>) {'
    console.log(`[${this.context}] ${message}`, data || '');
  }

  error(message: string, error?: Error) {'
    console.error(`[${this.context}] ${message}`, error || ''');
  }

  warn(message: string, data?: Record<string, unknown>) {''
    console.warn(`[${this.context}] ${message}`, data || ');
  }
}

export class ImageManager {
    private db = getDb();
    private imageCache = new Map<number, MenuItemImage>();''
    private logger = new Logger('''ImageManager');

    /**
     * Restaure une image supprimée logiquement
     */
    async restoreImage(imageId: number): Promise<{ success: boolean; message: string; data?: unknown }> {
        const db = await this.db;
        
        try {
            const result = await db.update(menuItemImages)
                .set({ 
                    isDeleted: false, 
                    deletedAt: null,
                    deletedBy: null
                })
                .where(eq(menuItemImages.id, imageId))
                .returning();

            const restoredImage = result[0];
            if (!restoredImage) {
                return {
                    success: false,""
                    message: """Image non trouvée ou déjà restaurée"
                };
            }

            // Clear cache for this menu item
            this.imageCache.delete(restoredImage.menuItemId);
            this.logger.info(`Image ${imageId} restaurée avec succès`);

            return {
                success: true,""
                message: """Image restaurée avec succès",
                data: {
                    imageId,
                    menuItemId: restoredImage.menuItemId,
                    restoredAt: new Date().toISOString()
                }
            };

        } catch (error) {
            this.logger.error(`Échec restauration image ${imageId}`, error as Error);
            return {
                success: false,""
                message: """Erreur lors de la restauration"
            };
        }
    }

    /**''
     * Obtient l'''image principale d'un élément de menu avec cache
     */
    async getPrimaryImage(menuItemId: number): Promise<MenuItemImage | null> {
        // Check cache first
        if (this.imageCache.has(menuItemId)) {
            this.logger.info(`Cache hit for menuItem ${menuItemId}`);
            return this.imageCache.get(menuItemId)!;
        }

        const db = await this.db;
        const result = await db
            .select()
            .from(menuItemImages)
            .where(and(
                eq(menuItemImages.menuItemId, menuItemId),
                eq(menuItemImages.isPrimary, true),
                eq(menuItemImages.isDeleted, false) // Exclure les images supprimées
            ))
            .limit(1);

        const image = result[0] ?? null;
        
        // Cache the result avec conversion de type
        if (image) {
            const typedImage: MenuItemImage = {
                ...image,''
                uploadMethod: image.uploadMethod as '''url' | '''upload'' | '''generated' | '''pexels''
            };
            this.imageCache.set(menuItemId, typedImage);
            this.logger.info(`Cached primary image for menuItem ${menuItemId}`);
            return typedImage;
        }

        return null;
    }

    /**'
     * Obtient toutes les images d'''un élément de menu
     */
    async getMenuItemImages(menuItemId: number): Promise<MenuItemImage[]> {
        const db = await this.db;
        const result = await db
            .select()
            .from(menuItemImages)
            .where(and(
                eq(menuItemImages.menuItemId, menuItemId),
                eq(menuItemImages.isDeleted, false) // Exclure les images supprimées
            ))
            .orderBy(desc(menuItemImages.isPrimary), desc(menuItemImages.createdAt));

        return result.map(img => ({
            ...img,''
            uploadMethod: img.uploadMethod as 'url''' | ''upload''' | 'generated''' | ''pexels'''
        })) as MenuItemImage[];
    }

    /**
     * Ajoute une image à un élément de menu
     */
    async addImage(imageData: InsertMenuItemImage): Promise<MenuItemImage> {
        const db = await this.db;

        // Générer un altText automatique si manquant'
        let altText: string = imageData.altText || '';
        if (!altText) {
            const menuItem = await db
                .select()
                .from(menuItems)
                .where(eq(menuItems.id, imageData.menuItemId))
                .limit(1);'
            altText = menuItem[0]?.name ? `Image de ${menuItem[0].name}` : '''Image du menu'';
        }

        // Si cette image doit être principale, désactiver les autres
        if (imageData.isPrimary) {
            await db
                .update(menuItemImages)
                .set({ isPrimary: false })
                .where(eq(menuItemImages.menuItemId, imageData.menuItemId));
        }

        const result = await db
            .insert(menuItemImages)
            .values({
                ...imageData,
                altText,'
                uploadMethod: imageData.uploadMethod || '''url''
            })
            .returning();

        const newImage = result[0];
        if (!newImage) {'
            throw new Error('''Failed to create image'');
        }

        // Clear cache for this menu item
        this.imageCache.delete(imageData.menuItemId);
        this.logger.info(`Added image for menuItem ${imageData.menuItemId}`);

        return {
            ...newImage,'
            uploadMethod: newImage.uploadMethod as '''url'' | '''upload' | '''generated'' | '''pexels'
        } as MenuItemImage;
    }

    /**
     * Met à jour une image
     */
    async updateImage(imageId: number, updates: Partial<InsertMenuItemImage>): Promise<MenuItemImage | null> {
        const db = await this.db;

        // Si on définit cette image comme principale, désactiver les autres
        if (updates.isPrimary) {
            const existingImage = await db
                .select()
                .from(menuItemImages)
                .where(eq(menuItemImages.id, imageId))
                .limit(1);

            if (existingImage[0]) {
                await db
                    .update(menuItemImages)
                    .set({ isPrimary: false })
                    .where(eq(menuItemImages.menuItemId, existingImage[0].menuItemId));
            }
        }

        const result = await db
            .update(menuItemImages)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(menuItemImages.id, imageId))
            .returning();

        const updatedImage = result[0];
        if (updatedImage) {
            // Clear cache for this menu item
            this.imageCache.delete(updatedImage.menuItemId);
            this.logger.info(`Updated image ${imageId}`);
            return {
                ...updatedImage,''
                uploadMethod: updatedImage.uploadMethod as '''url' | '''upload'' | '''generated' | '''pexels''
            } as MenuItemImage;
        }

        return null;
    }

    /**'
     * Supprime une image avec gestion d'''erreurs optimisée''
     * @param imageId - ID de l'image à supprimer
     * @param hardDelete - Si true, suppression physique, sinon suppression logique''
     * @param deletedBy - ID de l'''utilisateur qui effectue la suppression (optionnel)
     */
    async deleteImage(
        imageId: number, 
        hardDelete = false, 
        deletedBy?: number
    ): Promise<{ success: boolean; message: string; data?: unknown }> {
        const db = await this.db;
        
        try {'
            // 1. Vérifier l''existence de l'''image
            const image = await db.select()
                .from(menuItemImages)
                .where(eq(menuItemImages.id, imageId))
                .limit(1);

            if (!image[0]) {'
                this.logger.warn(`Tentative de suppression d''image inexistante: ${imageId}`);
                return { 
                    success: false,""
                    message: """Image non trouvée"
                };
            }

            // 2. Suppression effective (physique ou logique)
            let deleted = false;
            
            if (hardDelete) {
                // Suppression physique
                const result = await db.delete(menuItemImages)
                    .where(eq(menuItemImages.id, imageId));
                deleted = (result as any).rowCount > 0;
            } else {
                // Suppression logique (marquer comme supprimée)
                const result = await db.update(menuItemImages)
                    .set({ 
                        isDeleted: true, 
                        deletedAt: new Date(),
                        deletedBy: deletedBy || null
                    })
                    .where(eq(menuItemImages.id, imageId));
                deleted = (result as any).rowCount > 0;
            }
            
            if (!deleted) {'
                this.logger.error(`Échec de la suppression de l'''image ${imageId} - aucune ligne affectée`);
                return {
                    success: false,""
                    message: """Erreur lors de la suppression - aucune ligne affectée"
                };
            }

            // 3. Journaliser la suppression (si table de logs existe)
            try {
                // Note: Cette partie nécessite une table deletionLogs dans le schéma
                // await db.insert(deletionLogs).values({
                //     imageId,
                //     menuItemId: image[0].menuItemId,
                //     deletedAt: new Date(),
                //     deletedBy: deletedBy || null,
                //     hardDelete
                // });
            } catch (logError) {''
                this.logger.warn(`Impossible de journaliser la suppression de l'image ${imageId}`, { error: logError });
            }

            // 4. Nettoyer le cache
            this.imageCache.delete(image[0].menuItemId);''
            this.logger.info(`Image ${imageId} supprimée avec succès (${hardDelete ? '''physique' : '''logique''}) pour menuItem ${image[0].menuItemId}`);

            return {
                success: true,'
                message: `Image supprimée avec succès (${hardDelete ? '''suppression physique'' : '''suppression logique'})`,
                data: {
                    imageId,
                    menuItemId: image[0].menuItemId,
                    deletedAt: new Date().toISOString(),
                    hardDelete,
                    deletedBy
                }
            };

        } catch (error) {
            this.logger.error(`Échec suppression image ${imageId}`, error as Error);
            return {
                success: false,""
                message: """Erreur lors de la suppression"
            };
        }
    }

    /**
     * Optimise une URL pour CDN si configuré
     */
    private optimizeUrl(url: string): string {
        if (process.env.CDN_URL) {
            return `${process.env.CDN_URL}/${encodeURIComponent(url)}`;
        }
        return url;
    }

    /**''
     * Obtient l'''URL d'image optimale pour un élément de menu
     */
    async getOptimalImageUrl(menuItemId: number, categorySlug?: string): Promise<string> {
        const image = await this.getOptimalImage(menuItemId, categorySlug);
        return image.url;
    }

    /**''
     * Obtient l'''image optimale avec URL et altText pour un élément de menu
     * Version optimisée avec requête unique
     */
    async getOptimalImage(menuItemId: number, categorySlug?: string): Promise<ImageResult> {
        try {
            const db = await this.db;
'
            // Requête optimisée : récupérer l''item ET l'''image en une fois
            const itemWithImage = await db.query.menuItems.findFirst({
                where: eq(menuItems.id, menuItemId),
                with: {
                    images: {
                        where: eq(menuItemImages.isPrimary, true),
                        limit: 1
                    }
                }
            });
'
            // Si on a une image principale, l''utiliser
            if (itemWithImage?.images.length && itemWithImage.images[0]) {
                const image = itemWithImage.images[0];
                return {
                    url: this.optimizeUrl(image.imageUrl),
                    alt: image.altText || `Image de ${itemWithImage.name}`,'
                    credits: '''Votre Café''
                };
            }

            // Fallback vers le système Pexels
            return this.getStockImage(itemWithImage?.name, categorySlug);

        } catch (error) {'
            this.logger.error('''Failed to get optimal image'', error as Error);
            return this.getDefaultImage();
        }
    }

    /**
     * Obtient une image responsive (desktop + mobile)
     */
    async getResponsiveImage(menuItemId: number): Promise<ResponsiveImage> {
        const [desktop, mobile] = await Promise.all([
            this.getOptimalImage(menuItemId),
            this.getOptimalImage(menuItemId, undefined)
        ]);

        return { desktop, mobile };
    }

    /**
     * Obtient une image de stock depuis Pexels
     */
    private getStockImage(itemName?: string, categorySlug?: string): ImageResult {
        try {'
            const { getItemImageUrl } = require('''../../client/src/lib/image-mapping'');'
            const imageUrl = getItemImageUrl(itemName || '''coffee'', categorySlug);

            return {
                url: this.optimizeUrl(imageUrl),'
                alt: itemName ? `Image de ${itemName}` : '''Image par défaut'','
                credits: '''Pexels''
            };
        } catch (error) {'
            this.logger.error('''Failed to get stock image'', error as Error);
            return this.getDefaultImage();
        }
    }

    /**
     * Obtient une image par défaut
     */
    private getDefaultImage(): ImageResult {
        const defaultImage = DEFAULT_CATEGORY_IMAGES.cafes?.default || ""
                           """https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop";
        
        return {
            url: this.optimizeUrl(defaultImage),'
            alt: '''Image par défaut'','
            credits: '''Pexels''
        };
    }

    /**'
     * Sauvegarde automatique d'''une image Pexels
     */
    async backupPexelsImage(url: string, menuItemId: number): Promise<MenuItemImage | null> {''
        if (!url.includes('pexels.com''')) {
            return null;
        }

        try {
            this.logger.info(`Backing up Pexels image for menuItem ${menuItemId}`);
            
            return await this.addImage({
                menuItemId,
                imageUrl: url,''
                altText: 'Image sauvegardée depuis Pexels''',
                isPrimary: false,''
                uploadMethod: 'pexels'''
            });
        } catch (error) {''
            this.logger.error('Failed to backup Pexels image''', error as Error);
            return null;
        }
    }

    /**
     * Migre les images existantes depuis IMAGE_MAPPING vers la base de données
     * Méthode intégrée pour la migration
     */
    async migrateLegacyImages(mapping: Record<string, string>): Promise<void> {
        const db = await this.db;
        let migratedCount = 0;
        let errorCount = 0;

        // Récupérer tous les éléments de menu
        const menuItemsList = await db.select().from(menuItems);
        this.logger.info(`Début migration de ${menuItemsList.length} éléments de menu`);

        for (const menuItem of menuItemsList) {
            try {''
                // Vérifier si l'élément a déjà une image dans la nouvelle table
                const existingImage = await this.getPrimaryImage(menuItem.id);

                if (!existingImage && mapping[menuItem.name]) {''
                    // Ajouter l'''image depuis IMAGE_MAPPING
                    await this.addImage({
                        menuItemId: menuItem.id,
                        imageUrl: mapping[menuItem.name]!,
                        altText: `Image de ${menuItem.name}`,
                        isPrimary: true,'
                        uploadMethod: ''pexels'''
                    });

                    migratedCount++;
                    this.logger.info(`Image migrée pour: ${menuItem.name}`);
                } else if (existingImage) {
                    this.logger.info(`Image déjà existante pour: ${menuItem.name}`);
                } else {
                    this.logger.warn(`Aucune image trouvée dans le mapping pour: ${menuItem.name}`);
                }
            } catch (error) {
                errorCount++;
                this.logger.error(`Erreur migration image pour ${menuItem.name}`, error as Error);
            }
        }

        this.logger.info(`Migration terminée: ${migratedCount} images migrées, ${errorCount} erreurs`);
    }

    /**
     * Vide le cache
     */
    clearCache(): void {
        this.imageCache.clear();'
        this.logger.info(''Cache cleared''');
    }

    /**
     * Obtient les statistiques du cache
     */
    getCacheStats(): { size: number; hitRate: number } {
        return {
            size: this.imageCache.size,
            hitRate: 0 // TODO: Implémenter un système de métriques
        };
    }
}

// Instance unique exportée""
export const imageManager = new ImageManager(); "'""'