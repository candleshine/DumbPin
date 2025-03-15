/**
 * Map model
 * Represents a map with its configuration and pin information
 */

class Map {
  constructor(id, name, centerLat, centerLng, zoom, ownerId, pins = []) {
    this.id = id;
    this.name = name;
    this.centerLat = centerLat;
    this.centerLng = centerLng;
    this.zoom = zoom;
    this.ownerId = ownerId;
    this.pins = pins;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add a pin to the map
   * @param {Object} pin - The pin to add
   */
  addPin(pin) {
    this.pins.push(pin);
    this.updatedAt = new Date();
  }

  /**
   * Update a pin on the map
   * @param {string} pinId - The ID of the pin to update
   * @param {Object} updatedPin - The updated pin data
   * @returns {boolean} - Whether the pin was updated successfully
   */
  updatePin(pinId, updatedPin) {
    const pinIndex = this.pins.findIndex(pin => pin.id === pinId);
    if (pinIndex === -1) return false;
    
    this.pins[pinIndex] = { ...this.pins[pinIndex], ...updatedPin };
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Remove a pin from the map
   * @param {string} pinId - The ID of the pin to remove
   * @returns {boolean} - Whether the pin was removed successfully
   */
  removePin(pinId) {
    const initialLength = this.pins.length;
    this.pins = this.pins.filter(pin => pin.id !== pinId);
    this.updatedAt = new Date();
    return this.pins.length < initialLength;
  }

  /**
   * Update map configuration
   * @param {Object} config - The map configuration to update
   */
  updateConfig(config) {
    if (config.name !== undefined) this.name = config.name;
    if (config.centerLat !== undefined) this.centerLat = config.centerLat;
    if (config.centerLng !== undefined) this.centerLng = config.centerLng;
    if (config.zoom !== undefined) this.zoom = config.zoom;
    this.updatedAt = new Date();
  }
}

module.exports = Map;