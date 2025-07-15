import { DEFAULT_CATEGORY_IMAGES } from "@/lib/image-mapping";
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

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Obtient toutes les images d'un élément de menu
     */
    async getMenuItemImages(menuItemId: number): Promise<MenuItemImage[]> {
        const db = await this.db;
        return await db
            .select()
            .from(menuItemImages)
            .where(eq(menuItemImages.menuItemId, menuItemId))
            .orderBy(desc(menuItemImages.isPrimary), desc(menuItemImages.createdAt));
    }

    /**
     * Ajoute une image à un élément de menu
     */
    async addImage(imageData: InsertMenuItemImage): Promise<MenuItemImage> {
        const db = await this.db;

        // Récupérer le nom du menu item pour l'altText automatique si manquant
        let altText = imageData.altText;
        if (!altText) {
            const menuItem = await db
                .select()
                .from(menuItems)
                .where(eq(menuItems.id, imageData.menuItemId))
                .limit(1);
            
            if (menuItem.length > 0) {
                altText = `Image de ${menuItem[0].name}`;
            }
        }

        // Si c'est une image principale, désactiver les autres images principales
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
                altText,
                isPrimary: imageData.isPrimary ?? true
            })
            .returning();

        if (result.length === 0) {
            throw new Error('Échec de l\'ajout de l\'image');
        }

        return result[0];
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
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(menuItemImages.id, imageId))
            .returning();

        return result.length > 0 ? result[0] : null;
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

        // 2. Utiliser l'image par défaut de la catégorie
        if (categorySlug && DEFAULT_CATEGORY_IMAGES[categorySlug]) {
            return {
                url: DEFAULT_CATEGORY_IMAGES[categorySlug],
                alt: `Image par défaut pour ${menuItemName}`
            };
        }

        // 3. Image par défaut générique
        return {
            url: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
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
                console.error(`❌ Erreur migration image pour ${menuItem.name}:`, error);
            }
        }

        console.log(`✅ Migration terminée: ${migratedCount} images migrées, ${errorCount} erreurs`);
    }
}
