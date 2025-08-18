import { Router } from "express";
import { imageManager } from "../image-manager";
import { z } from "zod";
import { createLogger } from '../middleware/logging';
import { validateRequest } from 'zod-express-middleware';

const router = Router();
const logger = createLogger('IMAGE_ROUTES');

// Schémas de validation
const ImageSchemas = {
  addImage: z.object({
    menuItemId: z.number().positive(),
    imageUrl: z.string().url().or(z.string().regex(/^data:image\/(png|jpeg|jpg|gif);base64,/)),
    altText: z.string().min(2).max(255).optional(),
    isPrimary: z.boolean().optional().default(false),
    uploadMethod: z.enum(['url', 'upload', 'generated', 'pexels']).optional().default('upload'),
    metadata: z.record(z.unknown()).optional()
  }),

  updateImage: z.object({
    imageUrl: z.string().url().or(z.string().regex(/^data:image\/(png|jpeg|jpg|gif);base64,/)).optional(),
    altText: z.string().min(2).max(255).optional(),
    isPrimary: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional()
  }),

  migrateImages: z.object({
    imageMapping: z.record(z.string().url())
  }),

  params: z.object({
    menuItemId: z.string().regex(/^\d+$/).transform(Number),
    imageId: z.string().regex(/^\d+$/).transform(Number)
  })
};

// Middleware de validation des paramètres
router.param('menuItemId', (req, res, next, value) => {
  const result = ImageSchemas.params.shape.menuItemId.safeParse(value);
  if (!result.success) {
    return res.status(400).json({ error: "ID d'élément de menu invalide" });
  }
  next();
});

router.param('imageId', (req, res, next, value) => {
  const result = ImageSchemas.params.shape.imageId.safeParse(value);
  if (!result.success) {
    return res.status(400).json({ error: "ID d'image invalide" });
  }
  next();
});

/**
 * @openapi
 * tags:
 *   name: Images
 *   description: Gestion des images des éléments de menu
 */

/**
 * @openapi
 * /api/admin/images/{menuItemId}:
 *   get:
 *     summary: Récupère les images d'un élément de menu
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des images
 */
router.get("/:menuItemId", async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const images = await imageManager.getMenuItemImages(menuItemId);

    res.json({
      success: true,
      data: images,
      count: images.length
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des images", { 
      error: error instanceof Error ? error.message : error,
      menuItemId: req.params.menuItemId
    });

    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des images"
    });
  }
});

/**
 * @openapi
 * /api/admin/images:
 *   post:
 *     summary: Ajoute une nouvelle image
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddImageInput'
 *     responses:
 *       201:
 *         description: Image ajoutée avec succès
 */
router.post("/", 
  validateRequest({ body: ImageSchemas.addImage }), 
  async (req, res) => {
    try {
      const newImage = await imageManager.addImage(req.body);

      res.status(201).json({
        success: true,
        data: newImage,
        message: "Image ajoutée avec succès"
      });
    } catch (error) {
      logger.error("Erreur lors de l'ajout de l'image", { 
        error: error instanceof Error ? error.message : error,
        body: req.body
      });

      res.status(500).json({ 
        success: false,
        error: "Erreur lors de l'ajout de l'image"
      });
    }
  }
);

/**
 * @openapi
 * /api/admin/images/{imageId}:
 *   put:
 *     summary: Met à jour une image existante
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateImageInput'
 *     responses:
 *       200:
 *         description: Image mise à jour avec succès
 */
router.put("/:imageId", 
  validateRequest({ body: ImageSchemas.updateImage }), 
  async (req, res) => {
    try {
      const { imageId } = req.params;
      const updatedImage = await imageManager.updateImage(imageId, req.body);

      if (!updatedImage) {
        return res.status(404).json({ 
          success: false,
          error: "Image non trouvée" 
        });
      }

      res.json({
        success: true,
        data: updatedImage,
        message: "Image mise à jour avec succès"
      });
    } catch (error) {
      logger.error("Erreur lors de la mise à jour de l'image", { 
        error: error instanceof Error ? error.message : error,
        imageId: req.params.imageId,
        updates: req.body
      });

      res.status(500).json({ 
        success: false,
        error: "Erreur lors de la mise à jour de l'image"
      });
    }
  }
);

/**
 * @openapi
 * /api/admin/images/{imageId}:
 *   delete:
 *     summary: Supprime une image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
 */
router.delete("/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    const deleted = await imageManager.deleteImage(imageId);

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        error: "Image non trouvée" 
      });
    }

    res.json({
      success: true,
      data: { imageId },
      message: "Image supprimée avec succès"
    });
  } catch (error) {
    logger.error("Erreur lors de la suppression de l'image", { 
      error: error instanceof Error ? error.message : error,
      imageId: req.params.imageId
    });

    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la suppression de l'image"
    });
  }
});

/**
 * @openapi
 * /api/admin/images/optimal/{menuItemId}:
 *   get:
 *     summary: Récupère l'image optimale pour un élément de menu
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image optimale trouvée
 */
router.get("/optimal/:menuItemId", async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const categorySlug = req.query.category as string;
    const image = await imageManager.getOptimalImage(menuItemId, categorySlug);

    res.json({
      success: true,
      data: {
        imageUrl: image.url,
        altText: image.alt,
        isPrimary: image.isPrimary,
        dimensions: image.dimensions
      }
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'image optimale", { 
      error: error instanceof Error ? error.message : error,
      menuItemId: req.params.menuItemId,
      category: req.query.category
    });

    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération de l'image optimale"
    });
  }
});

/**
 * @openapi
 * /api/admin/images/migrate:
 *   post:
 *     summary: Migre des images depuis un mapping existant
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MigrateImagesInput'
 *     responses:
 *       200:
 *         description: Migration terminée avec succès
 */
router.post("/migrate", 
  validateRequest({ body: ImageSchemas.migrateImages }), 
  async (req, res) => {
    try {
      const { imageMapping } = req.body;
      const result = await imageManager.migrateFromImageMapping(imageMapping);

      res.json({
        success: true,
        data: result,
        message: "Migration terminée avec succès"
      });
    } catch (error) {
      logger.error("Erreur lors de la migration des images", { 
        error: error instanceof Error ? error.message : error,
        body: req.body
      });

      res.status(500).json({ 
        success: false,
        error: "Erreur lors de la migration des images"
      });
    }
  }
);

export default router;