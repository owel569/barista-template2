
import { Router } from 'express';
import { authenticateUser, requireRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler-enhanced';
import { createLogger } from '../middleware/logging';
import { z } from 'zod';

const router = Router();
const logger = createLogger('GALLERY_ROUTES');

// Schéma de validation pour les images de galerie
const GalleryImageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  category: z.enum(['intérieur', 'extérieur', 'plats', 'boissons']),
  imageUrl: z.string().url()
});

// Stockage temporaire en mémoire (en production, utiliser une base de données)
let galleryImages = [
  {
    id: 1,
    title: "Ambiance chaleureuse",
    description: "Notre salle principale avec vue panoramique",
    category: "intérieur",
    imageUrl: "https://images.pexels.com/photos/3021250/pexels-photo-3021250.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    createdAt: new Date()
  },
  {
    id: 2,
    title: "Terrasse vue mer",
    description: "Notre magnifique terrasse avec vue sur l'océan",
    category: "extérieur",
    imageUrl: "https://images.pexels.com/photos/30957991/pexels-photo-30957991.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    createdAt: new Date()
  }
];

// GET /api/gallery/images - Récupérer toutes les images
router.get('/images', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: galleryImages
  });
}));

// POST /api/gallery/images - Ajouter une nouvelle image (directeur seulement)
router.post('/images', 
  authenticateUser,
  requireRoles(['directeur']),
  asyncHandler(async (req, res) => {
    try {
      const validatedData = GalleryImageSchema.parse(req.body);
      
      const newImage = {
        id: galleryImages.length + 1,
        ...validatedData,
        createdAt: new Date()
      };
      
      galleryImages.push(newImage);
      
      logger.info('Image ajoutée à la galerie', {
        userId: req.user?.id,
        imageTitle: newImage.title,
        category: newImage.category
      });
      
      res.status(201).json({
        success: true,
        data: newImage,
        message: 'Image ajoutée avec succès'
      });
    } catch (error) {
      logger.error('Erreur ajout image galerie', { error });
      res.status(400).json({
        success: false,
        message: 'Données invalides'
      });
    }
  })
);

// DELETE /api/gallery/images/:id - Supprimer une image (directeur seulement)
router.delete('/images/:id',
  authenticateUser,
  requireRoles(['directeur']),
  asyncHandler(async (req, res) => {
    const imageIdParam = req.params.id;
    
    if (!imageIdParam) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'image requis'
      });
    }
    
    const imageId = parseInt(imageIdParam);
    
    if (isNaN(imageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'image invalide'
      });
    }
    
    const imageIndex = galleryImages.findIndex(img => img.id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }
    
    const deletedImage = galleryImages.splice(imageIndex, 1)[0];
    
    logger.info('Image supprimée de la galerie', {
      userId: req.user?.id,
      imageTitle: deletedImage?.title,
      imageId
    });
    
    return res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  })
);

export default router;
