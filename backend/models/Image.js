/**
 * Image model
 * Represents an image in the system with its metadata and pin information
 */

class Image {
  constructor(id, fileName, filePath, fileType, fileSize, ownerId, pins = []) {
    this.id = id;
    this.fileName = fileName;
    this.filePath = filePath;
    this.fileType = fileType;
    this.fileSize = fileSize;
    this.ownerId = ownerId;
    this.pins = pins;
    this.aspectRatio = null; // Store aspect ratio for correct display
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add a pin to the image
   * @param {Object} pin - The pin to add
   */
  addPin(pin) {
    this.pins.push(pin);
    this.updatedAt = new Date();
  }

  /**
   * Update a pin on the image
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
   * Remove a pin from the image
   * @param {string} pinId - The ID of the pin to remove
   * @returns {boolean} - Whether the pin was removed successfully
   */
  removePin(pinId) {
    const initialLength = this.pins.length;
    this.pins = this.pins.filter(pin => pin.id !== pinId);
    this.updatedAt = new Date();
    return this.pins.length !== initialLength;
  }

  /**
   * Set the aspect ratio of the image
   * @param {number} ratio - The aspect ratio (width/height)
   */
  setAspectRatio(ratio) {
    this.aspectRatio = ratio;
    this.updatedAt = new Date();
  }
}

module.exports = Image;