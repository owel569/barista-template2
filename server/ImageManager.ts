// Images par défaut par catégorie
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "cafes": "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "boissons": "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "patisseries": "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
  "plats": "https://images.pexels.com/photos/4676406/pexels-photo-4676406.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
};
import { menuItemImages, menuItems } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { MenuItemImage, InsertMenuItemImage } from "./image-manager";


export class ImageManager {
    private db = getDb();

    /**
     * Obtient l'image principale d'un élément de menu
     */
    async getPrimaryImage(menuItemId: number): Promise<MenuItemImage | null> {
        const db = await this.db;
        const result = await db
            .select()
            .from(menuItemImages)
            .where(and(
                eq(menuItemImages.menuItemId, menuItemId),
                eq(menuItemImages.isPrimary, true)
            ))
            .limit(1);

        return result.length > 0 ? (result[0] as unknown as MenuItemImage) : null;
    }

    /**
     * Obtient toutes les images d'un élément de menu
     */
    async getMenuItemImages(menuItemId: number): Promise<MenuItemImage[]> {
        const db = await this.db;
        const rows = await db
            .select()
            .from(menuItemImages)
            .where(eq(menuItemImages.menuItemId, menuItemId))
            .orderBy(desc(menuItemImages.isPrimary), desc(menuItemImages.createdAt));
        return rows as unknown as MenuItemImage[];
    }

    /**
     * Ajoute une image à un élément de menu
     */
    async addImage(imageData: InsertMenuItemImage): Promise<MenuItemImage> {
        const db = await this.db;

        // Générer un altText automatique si manquant
        let altText: string = imageData.altText || '';
        if (!altText) {
            const menuItem = await db
                .select()
                .from(menuItems)
                .where(eq(menuItems.id, imageData.menuItemId))
                .limit(1);
            altText = menuItem.length > 0 ? `Image de ${menuItem[0].name}` : 'Image du menu';
        }

        // Si cette image doit être principale, désactiver les autres
        if (imageData.isPrimary) {
            await db
                .update(menuItemImages)
                .set({ isPrimary: false })
                .where(eq(menuItemImages.menuItemId, imageData.menuItemId));
        }

        const [newImage] = await db
            .insert(menuItemImages)
            .values({
                menuItemId: imageData.menuItemId,
                imageUrl: imageData.imageUrl,
                altText,
                isPrimary: imageData.isPrimary ?? false,
                sortOrder: 0
            })
            .returning();
        return newImage as unknown as MenuItemImage;
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

            if (existingImage.length > 0) {
                await db
                    .update(menuItemImages)
                    .set({ isPrimary: false })
                    .where(eq(menuItemImages.menuItemId, existingImage[0].menuItemId));
            }
        }

        const result = await db
            .update(menuItemImages)
            .set({
                ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
                ...(updates.altText !== undefined ? { altText: updates.altText ?? null } : {}),
                ...(updates.isPrimary !== undefined ? { isPrimary: updates.isPrimary } : {}),
            })
            .where(eq(menuItemImages.id, imageId))
            .returning();
        return (result[0] as unknown as MenuItemImage) || null;
    }

    /**
     * Supprime une image
     */
    async deleteImage(imageId: number): Promise<boolean> {
        const db = await this.db;
        const result = await db
            .delete(menuItemImages)
            .where(eq(menuItemImages.id, imageId));

        return (result as any).rowCount !== undefined && (result as any).rowCount > 0;
    }

    /**
     * Obtient l'URL d'image optimale pour un élément de menu
     * Cette fonction remplace l'ancien système IMAGE_MAPPING
     */
    async getOptimalImageUrl(menuItemId: number, categorySlug?: string): Promise<string> {
        const image = await this.getOptimalImage(menuItemId, categorySlug);
        return image.url;
    }

    /**
     * Obtient l'image optimale avec URL et altText pour un élément de menu
     */
    async getOptimalImage(menuItemId: number, categorySlug?: string): Promise<{ url: string; alt: string }> {
        const db = await this.db;

        // Récupérer les informations du menu item pour le fallback altText
        const menuItem = await db
            .select()
            .from(menuItems)
            .where(eq(menuItems.id, menuItemId))
            .limit(1);

        const menuItemName = menuItem.length > 0 ? menuItem[0].name : 'Élément de menu';

        // 1. Essayer d'abord l'image principale de la base de données
        const primaryImage = await this.getPrimaryImage(menuItemId);
        if (primaryImage) {
            return {
                url: primaryImage.imageUrl,
                alt: primaryImage.altText || `Image de ${menuItemName}`
            };
        }

        // 2. Fallback vers le nouveau système IMAGE_MAPPING Pexels
        const { getItemImageUrl } = await import('../client/src/lib/image-mapping');
        const imageUrl = getItemImageUrl(menuItemName, categorySlug);

        return {
            url: imageUrl,
            alt: `Image de ${menuItemName}`
        };
    }

    /**
     * Migre les images existantes depuis IMAGE_MAPPING vers la base de données
     */
    async migrateFromImageMapping(imageMapping: Record<string, string>): Promise<void> {
        const db = await this.db;
        let migratedCount = 0;
        let errorCount = 0;

        // Récupérer tous les éléments de menu
        const menuItemsList = await db.select().from(menuItems);
        console.log(`🔄 Début migration de ${menuItemsList.length} éléments de menu`);

        for (const menuItem of menuItemsList) {
            try {
                // Vérifier si l'élément a déjà une image dans la nouvelle table
                const existingImage = await this.getPrimaryImage(menuItem.id);

                if (!existingImage && imageMapping[menuItem.name]) {
                    // Ajouter l'image depuis IMAGE_MAPPING
                    await this.addImage({
                        menuItemId: menuItem.id,
                        imageUrl: imageMapping[menuItem.name],
                        altText: `Image de ${menuItem.name}`,
                        isPrimary: true,
                        uploadMethod: 'pexels'
                    });

                    migratedCount++;
                    console.log(`✅ Image migrée pour: ${menuItem.name}`);
                } else if (existingImage) {
                    console.log(`⏭️ Image déjà existante pour: ${menuItem.name}`);
                } else {
                    console.log(`⚠️ Aucune image trouvée dans le mapping pour: ${menuItem.name}`);
                }
            } catch (error) {
                errorCount++;
                logger.error(`❌ Erreur migration image pour ${menuItem.name}:`, { error: error instanceof Error ? error.message : 'Erreur inconnue' });
            }
        }

        console.log(`✅ Migration terminée: ${migratedCount} images migrées, ${errorCount} erreurs`);
    }
}