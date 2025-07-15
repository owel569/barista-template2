import { Router } from "express";
import { imageManager } from "../image-manager";
import { z } from "zod";

const router = Router();

// Schéma de validation pour l'ajout d'image
const addImageSchema = z.object({
  menuItemId: z.number(),
  imageUrl: z.string().url(),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
  uploadMethod: z.enum(['url', 'upload', 'generated']).optional()
});

// GET /api/admin/images/:menuItemId - Récupérer les images d'un élément de menu
router.get("/:menuItemId", async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const images = await imageManager.getMenuItemImages(menuItemId);
    res.json(images);
  } catch (error) {
    console.error("Erreur lors de la récupération des images:", error);
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
      console.error("Erreur lors de l'ajout de l'image:", error);
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
    
    res.json(updatedImage);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'image:", error);
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
    
    res.json({ message: "Image supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'image:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/images/optimal/:menuItemId - Obtenir l'URL optimale d'une image
router.get("/optimal/:menuItemId", async (req, res) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const categorySlug = req.query.category as string;
    const imageUrl = await imageManager.getOptimalImageUrl(menuItemId, categorySlug);
    res.json({ imageUrl });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'image optimale:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/images/migrate - Migrer depuis IMAGE_MAPPING
router.post("/migrate", async (req, res) => {
  try {
    const { imageMapping } = req.body;
    await imageManager.migrateFromImageMapping(imageMapping);
    res.json({ message: "Migration terminée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;