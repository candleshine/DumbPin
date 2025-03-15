/**
 * Pin model
 * Represents a pin placed on an image
 */

class Pin {
  constructor(id, x, y, color = '#ff6b6b', label = '', ownerId) {
    this.id = id;
    this.x = x; // X coordinate (percentage of image width)
    this.y = y; // Y coordinate (percentage of image height)
    this.color = color;
    this.label = label;
    this.ownerId = ownerId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Update pin position
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   */
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    this.updatedAt = new Date();
  }

  /**
   * Update pin style
   * @param {Object} style - Style properties to update
   */
  updateStyle(style) {
    if (style.color) this.color = style.color;
    if (style.label !== undefined) this.label = style.label;
    this.updatedAt = new Date();
  }
}

module.exports = Pin;