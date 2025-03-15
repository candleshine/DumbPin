/**
 * Map Routes
 * Handles routes for map creation, configuration, and pin management
 */

const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Map routes
router.post('/', mapController.createMap);
router.get('/', mapController.getUserMaps);
router.get('/:mapId', mapController.getMapById);
router.put('/:mapId', mapController.updateMap);
router.delete('/:mapId', mapController.deleteMap);

// Pin routes
router.post('/:mapId/pins', mapController.addPin);
router.put('/:mapId/pins/:pinId', mapController.updatePin);
router.delete('/:mapId/pins/:pinId', mapController.deletePin);

module.exports = router;