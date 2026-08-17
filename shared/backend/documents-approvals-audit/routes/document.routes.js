'use strict';

const { Router } = require('express');
const multer = require('multer');
const authenticate = require('../../middlewares/auth.middleware');
const requireRole = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validation.middleware');
const { idParam } = require('../../validators/common.validator');
const { uploadDocument, entityQuery } = require('../validators/document.validator');
const documentController = require('../controllers/document.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB cap

const router = Router();
router.use(authenticate);
const idP = idParam('id');

/**
 * @openapi
 * tags:
 *   - name: Documents
 *     description: Polymorphic document metadata backed by private Supabase Storage (architecture Phase 5.15, Phase 12)
 */
router.get('/', validate(entityQuery, 'query'), documentController.listByEntity);
router.post('/', upload.single('file'), validate(uploadDocument), documentController.upload);
router.get('/:id', validate(idP, 'params'), documentController.getById);
router.get('/:id/signed-url', validate(idP, 'params'), documentController.getSignedUrl);
router.post('/:id/archive', validate(idP, 'params'), documentController.archive);

module.exports = router;
