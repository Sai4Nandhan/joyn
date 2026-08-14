import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadProfilePhoto } from '../middleware/upload.middleware.js';
import * as photoController from '../controllers/photo.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', uploadProfilePhoto, photoController.uploadPhoto);
router.delete('/:photoId', photoController.deletePhoto);
router.patch('/:photoId/primary', photoController.setPrimaryPhoto);
router.put('/reorder', photoController.reorderPhotos);

export default router;
