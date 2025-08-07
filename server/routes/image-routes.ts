import { Router } from "express";
import { imageManager } from "../image-manager";
import { z } from "zod";
import { createLogger } from '../middleware/logging';

const router = Router();
const logger = createLogger('IMAGE_ROUTES');

// Schéma de validation pour l'ajout d'image
const addImageSchema = z.object({
  menuItemId: z.number()}),
  imageUrl: z.string().url(),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
  uploadMethod: z.enum(['url', 'upload', 'generated', 'pexels']).optional()
});

// GET /api/admin/images/:menuItemId - Récupérer les images d'un élément de menu
router.get("/:menuItemId", async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const images = await imageManager.getMenuItemImages(menuItemId);
    res.json({
        success: true,
        data: images
      });
  } catch (error) {
    logger.error("Erreur lors de la récupération des images:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/images - Ajouter une image
router.post("/", async (req, res) => {
  try {
    const validatedData = addImageSchema.parse(req.body);
    const newImage = await imageManager.addImage(validatedData);
    res.status(201).json(newImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Données invalides", details: error.errors });
    } else {
      logger.error("Erreur lors de l'ajout de l'image:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
});

// PUT /api/admin/images/:imageId - Mettre à jour une image
router.put("/:imageId", async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const updates = req.body;
    const updatedImage = await imageManager.updateImage(imageId, updates);
    
    if (!updatedImage) {
      return res.status(404).json({ error: "Image non trouvée" });
    }
    
    res.json({
        success: true,
        data: updatedImage
      });
  } catch (error) {
    logger.error("Erreur lors de la mise à jour de l'image:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/images/:imageId - Supprimer une image
router.delete("/:imageId", async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const deleted = await imageManager.deleteImage(imageId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Image non trouvée" });
    }
    
    res.json({
        success: true,
        data: { message: "Image supprimée avec succès" }
      });
  } catch (error) {
    logger.error("Erreur lors de la suppression de l'image:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/images/optimal/:menuItemId - Obtenir l'image optimale avec URL et altText
router.get("/optimal/:menuItemId", async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const categorySlug = req.query.category as string;
    const image = await imageManager.getOptimalImage(menuItemId, categorySlug);
    res.json({
        success: true,
        data: { imageUrl: image.url, altText: image.alt }
      });
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'image optimale:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/images/migrate - Migrer depuis IMAGE_MAPPING
router.post("/migrate", async (req, res) => {
  try {
    const { imageMapping } = req.body;
    await imageManager.migrateFromImageMapping(imageMapping);
    res.json({
        success: true,
        data: { message: "Migration terminée avec succès" }
      });
  } catch (error) {
    logger.error("Erreur lors de la migration:", { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;