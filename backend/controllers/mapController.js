/**
 * Map Controller
 * Handles map creation, configuration, and pin management
 */

const { v4: uuidv4 } = require('uuid');
const Map = require('../models/Map');
const Pin = require('../models/Pin');
const fileStorage = require('../utils/fileStorage');

// In-memory storage for maps (to be replaced with a database in future phases)
const maps = {};

/**
 * Create a new map
 */
const createMap = (req, res) => {
  try {
    const { name, centerLat, centerLng, zoom } = req.body;
    
    // Validate required fields
    if (!name || !centerLat || !centerLng || !zoom) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, centerLat, centerLng, and zoom are required.' 
      });
    }
    
    // Validate coordinates and zoom
    if (typeof centerLat !== 'number' || typeof centerLng !== 'number' || 
        centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
      return res.status(400).json({ 
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' 
      });
    }
    
    if (typeof zoom !== 'number' || zoom < 1 || zoom > 20) {
      return res.status(400).json({ 
        message: 'Invalid zoom level. Zoom must be between 1 and 20.' 
      });
    }
    
    // Create new map
    const mapId = uuidv4();
    const map = new Map(
      mapId,
      name,
      centerLat,
      centerLng,
      zoom,
      req.user.id
    );
    
    // Store in memory
    maps[mapId] = map;
    
    // Auto-save map data
    fileStorage.saveMapData(mapId, map);
    
    // Return map data
    res.status(201).json({
      id: map.id,
      name: map.name,
      centerLat: map.centerLat,
      centerLng: map.centerLng,
      zoom: map.zoom,
      createdAt: map.createdAt
    });
  } catch (error) {
    console.error('Error creating map:', error);
    res.status(500).json({ message: 'Failed to create map' });
  }
};

/**
 * Get all maps for the authenticated user
 */
const getUserMaps = (req, res) => {
  try {
    const userMaps = Object.values(maps).filter(
      map => map.ownerId === req.user.id
    );
    
    // Map to response format
    const responseData = userMaps.map(map => ({
      id: map.id,
      name: map.name,
      centerLat: map.centerLat,
      centerLng: map.centerLng,
      zoom: map.zoom,
      pinCount: map.pins.length,
      createdAt: map.createdAt,
      updatedAt: map.updatedAt
    }));
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting user maps:', error);
    res.status(500).json({ message: 'Failed to retrieve maps' });
  }
};

/**
 * Get a single map by ID
 */
const getMapById = (req, res) => {
  try {
    const { mapId } = req.params;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Return map data with pins
    res.json({
      id: map.id,
      name: map.name,
      centerLat: map.centerLat,
      centerLng: map.centerLng,
      zoom: map.zoom,
      pins: map.pins,
      createdAt: map.createdAt,
      updatedAt: map.updatedAt
    });
  } catch (error) {
    console.error('Error getting map:', error);
    res.status(500).json({ message: 'Failed to retrieve map' });
  }
};

/**
 * Update map configuration
 */
const updateMap = (req, res) => {
  try {
    const { mapId } = req.params;
    const { name, centerLat, centerLng, zoom } = req.body;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Validate coordinates and zoom if provided
    if (centerLat !== undefined && (typeof centerLat !== 'number' || centerLat < -90 || centerLat > 90)) {
      return res.status(400).json({ 
        message: 'Invalid latitude. Must be between -90 and 90.' 
      });
    }
    
    if (centerLng !== undefined && (typeof centerLng !== 'number' || centerLng < -180 || centerLng > 180)) {
      return res.status(400).json({ 
        message: 'Invalid longitude. Must be between -180 and 180.' 
      });
    }
    
    if (zoom !== undefined && (typeof zoom !== 'number' || zoom < 1 || zoom > 20)) {
      return res.status(400).json({ 
        message: 'Invalid zoom level. Must be between 1 and 20.' 
      });
    }
    
    // Update map configuration
    map.updateConfig({
      name,
      centerLat,
      centerLng,
      zoom
    });
    
    // Auto-save map data
    fileStorage.saveMapData(mapId, map);
    
    res.json({
      id: map.id,
      name: map.name,
      centerLat: map.centerLat,
      centerLng: map.centerLng,
      zoom: map.zoom,
      updatedAt: map.updatedAt
    });
  } catch (error) {
    console.error('Error updating map:', error);
    res.status(500).json({ message: 'Failed to update map' });
  }
};

/**
 * Delete a map
 */
const deleteMap = (req, res) => {
  try {
    const { mapId } = req.params;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Delete map data
    fileStorage.deleteMapData(mapId);
    
    // Remove from memory store
    delete maps[mapId];
    
    res.json({ message: 'Map deleted successfully' });
  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({ message: 'Failed to delete map' });
  }
};

/**
 * Add a pin to a map
 */
const addPin = (req, res) => {
  try {
    const { mapId } = req.params;
    const { lat, lng, color, label } = req.body;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ 
        message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.' 
      });
    }
    
    // Create new pin (using the existing Pin model but with lat/lng instead of x/y)
    const pin = {
      id: uuidv4(),
      lat,
      lng,
      color: color || '#ff6b6b',
      label: label || '',
      ownerId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add pin to map
    map.addPin(pin);
    
    // Auto-save map data
    fileStorage.saveMapData(mapId, map);
    
    res.status(201).json(pin);
  } catch (error) {
    console.error('Error adding pin:', error);
    res.status(500).json({ message: 'Failed to add pin' });
  }
};

/**
 * Update a pin on a map
 */
const updatePin = (req, res) => {
  try {
    const { mapId, pinId } = req.params;
    const { lat, lng, color, label } = req.body;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Find pin
    const pin = map.pins.find(p => p.id === pinId);
    if (!pin) {
      return res.status(404).json({ message: 'Pin not found' });
    }
    
    // Validate coordinates if provided
    if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
      return res.status(400).json({ 
        message: 'Invalid latitude. Must be between -90 and 90.' 
      });
    }
    
    if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
      return res.status(400).json({ 
        message: 'Invalid longitude. Must be between -180 and 180.' 
      });
    }
    
    // Update pin
    const updatedPin = {
      lat: lat !== undefined ? lat : pin.lat,
      lng: lng !== undefined ? lng : pin.lng,
      color: color !== undefined ? color : pin.color,
      label: label !== undefined ? label : pin.label,
      updatedAt: new Date()
    };
    
    map.updatePin(pinId, updatedPin);
    
    // Auto-save map data
    fileStorage.saveMapData(mapId, map);
    
    // Find updated pin to return
    const resultPin = map.pins.find(p => p.id === pinId);
    res.json(resultPin);
  } catch (error) {
    console.error('Error updating pin:', error);
    res.status(500).json({ message: 'Failed to update pin' });
  }
};

/**
 * Delete a pin from a map
 */
const deletePin = (req, res) => {
  try {
    const { mapId, pinId } = req.params;
    const map = maps[mapId];
    
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    
    // Check ownership
    if (map.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Remove pin
    const removed = map.removePin(pinId);
    if (!removed) {
      return res.status(404).json({ message: 'Pin not found' });
    }
    
    // Auto-save map data
    fileStorage.saveMapData(mapId, map);
    
    res.json({ message: 'Pin deleted successfully' });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({ message: 'Failed to delete pin' });
  }
};

module.exports = {
  createMap,
  getUserMaps,
  getMapById,
  updateMap,
  deleteMap,
  addPin,
  updatePin,
  deletePin
};