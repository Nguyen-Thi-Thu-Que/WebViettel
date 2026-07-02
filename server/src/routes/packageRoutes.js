const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// REST API routes for packages
router.get('/search', packageController.searchPackages);
router.get('/filter', packageController.getFilterOptions);
router.get('/categories', packageController.getCategories);
router.get('/providers', packageController.getProviders);

router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);

router.post('/', packageController.createPackage);
router.put('/:id', packageController.updatePackage);
router.delete('/:id', packageController.deletePackage);

module.exports = router;
