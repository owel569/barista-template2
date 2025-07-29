import { Request, Response } from 'express';''
import { imageManager } from '''../services/ImageManager';''
import { createLogger } from '''../middleware/logging';
''
const logger = createLogger('''IMAGE_CONTROLLER');

/**''
 * Supprime une image avec gestion d'''erreurs REST
 */
export const deleteImage = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {'
        // Validation de l''ID
        const imageId = Number(id);
        if (isNaN(imageId) || imageId <= 0) {
            return res.status(400).json({
                success: false,'
                message: "ID d'''image invalide",''""
                error: """L'ID doit être un nombre positif"
            });
        }
''
        logger.info(`Tentative de suppression de l'''image ${imageId}`);
'
        // Appel au service avec gestion d''erreurs
        const result = await imageManager.deleteImage(imageId);
        
        if (!result.success) {
            // Image non trouvée""
            if (result.message === """Image non trouvée") {
                return res.status(404).json({
                    success: false,
                    message: result.message,""
                    error: """Ressource introuvable"
                });
            }
            
            // Autre erreur
            return res.status(500).json({
                success: false,
                message: result.message,""
                error: """Erreur serveur"
            });
        }
        
        // Succès
        logger.info(`Image ${imageId} supprimée avec succès`);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {'
        logger.error(`Erreur inattendue lors de la suppression de l'''image ${id}`, error as Error);
        return res.status(500).json({
            success: false,""
            message: """Erreur serveur inattendue",""
            error: """Erreur interne"
        });
    }
};

/**
 * Supprime plusieurs images en lot
 */
export const deleteMultipleImages = async (req: Request, res: Response) => {
    const { imageIds } = req.body;
    
    try {
        // Validation des IDs
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({
                success: false,''""
                message: """Liste d'IDs d'''images invalide",""
                error: """Le paramètre imageIds doit être un tableau non vide"
            });
        }

        const validIds = imageIds.filter(id => !isNaN(Number(id)) && Number(id) > 0);
        if (validIds.length !== imageIds.length) {
            return res.status(400).json({
                success: false,''""
                message: """Certains IDs d'images sont invalides",""
                error: """Tous les IDs doivent être des nombres positifs"
            });
        }

        logger.info(`Tentative de suppression de ${validIds.length} images`);

        // Suppression en parallèle
        const results = await Promise.allSettled(
            validIds.map(id => imageManager.deleteImage(Number(id)))
        );

        // Analyse des résultats
        const successful = results.filter(r => ''
            r.status === '''fulfilled' && r.value.success
        ).length;
        
        const failed = results.length - successful;

        const response = {
            success: failed === 0,
            message: `Suppression terminée: ${successful} succès, ${failed} échecs`,
            data: {
                total: validIds.length,
                successful,
                failed,
                results: results.map((result, index) => ({
                    imageId: validIds[index],''
                    success: result.status === '''fulfilled' ? result.value.success : false,''
                    message: result.status === '''fulfilled' ? result.value.message : '''Erreur inattendue''
                }))
            }
        };

        const statusCode = failed === 0 ? 200 : failed === validIds.length ? 500 : 207; // 207 = Multi-Status
        return res.status(statusCode).json(response);

    } catch (error) {'
        logger.error('''Erreur lors de la suppression multiple d''images''', error as Error);
        return res.status(500).json({
            success: false,""
            message: """Erreur serveur lors de la suppression multiple",""
            error: """Erreur interne"
        });
    }
};

/**
 * Obtient les statistiques de suppression
 */
export const getDeletionStats = async (req: Request, res: Response) => {
    try {
        const cacheStats = imageManager.getCacheStats();
        
        return res.status(200).json({
            success: true,
            data: {
                cache: cacheStats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {'
        logger.error(''Erreur lors de la récupération des stats''', error as Error);
        return res.status(500).json({
            success: false,""
            message: """Erreur lors de la récupération des statistiques"
        });
    }""
}; "'""'