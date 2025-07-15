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
        const [image] = await db
            .select()
            .from(menuItemImages)
            .where(and(
                eq(menuItemImages.menuItemId, menuItemId),
                eq(menuItemImages.isPrimary, true)
            ))
            .limit(1);

        return image || null;
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

        // Si c'est une image principale, désactiver les autres images principales
        if (imageData.isPrimary) {
            await db
                .update(menuItemImages)
                .set({ isPrimary: false })
                .where(eq(menuItemImages.menuItemId, imageData.menuItemId));
        }

        const [newImage] = await db
            .insert(menuItemImages)
            .values({
                ...imageData,
                isPrimary: imageData.isPrimary ?? true
            })
            .returning();

        return newImage;
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

        const [updatedImage] = await db
            .update(menuItemImages)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(menuItemImages.id, imageId))
            .returning();

        return updatedImage || null;
    }

    /**
     * Supprime une image
     */
    async deleteImage(imageId: number): Promise<boolean> {
        const db = await this.db;
        const result = await db
            .delete(menuItemImages)
            .where(eq(menuItemImages.id, imageId));

        return result.rowCount !== null && result.rowCount > 0;
    }

    /**
     * Obtient l'URL d'image optimale pour un élément de menu
     * Cette fonction remplace l'ancien système IMAGE_MAPPING
     */
    async getOptimalImageUrl(menuItemId: number, categorySlug?: string): Promise<string> {
        // 1. Essayer d'abord l'image principale de la base de données
        const primaryImage = await this.getPrimaryImage(menuItemId);
        if (primaryImage) {
            return primaryImage.imageUrl;
        }

        // 2. Utiliser l'image par défaut de la catégorie
        if (categorySlug && DEFAULT_CATEGORY_IMAGES[categorySlug]) {
            return DEFAULT_CATEGORY_IMAGES[categorySlug];
        }

        // 3. Image par défaut générique
        return "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop";
    }

    /**
     * Migre les images existantes depuis IMAGE_MAPPING vers la base de données
     */
    async migrateFromImageMapping(imageMapping: Record<string, string>): Promise<void> {
        const db = await this.db;

        // Récupérer tous les éléments de menu
        const menuItemsList = await db.select().from(menuItems);

        for (const menuItem of menuItemsList) {
            // Vérifier si l'élément a déjà une image dans la nouvelle table
            const existingImage = await this.getPrimaryImage(menuItem.id);

            if (!existingImage && imageMapping[menuItem.name]) {
                // Ajouter l'image depuis IMAGE_MAPPING
                await this.addImage({
                    menuItemId: menuItem.id,
                    imageUrl: imageMapping[menuItem.name],
                    altText: menuItem.name,
                    isPrimary: true,
                    uploadMethod: 'url'
                });
            }
        }
    }
}
