import { DEFAULT_THRESHOLDS } from '../config/thresholds.js';

class ThresholdService {
  // Get thresholds for a robot (always returns defaults)
  async getThresholds(robotId = "default") {
    console.log(`Using default thresholds for ${robotId}`);
    return DEFAULT_THRESHOLDS;
  }

  // Get default values
  getDefaultValues() {
    return { ...DEFAULT_THRESHOLDS };
  }

  async updateThreshold() {
    console.warn('Threshold updates disabled - using hardcoded defaults');
    return null;
  }

  async initializeDefaultThresholds() {
    console.log('Using hardcoded threshold defaults');
    return true;
  }
}

// Create and export singleton instance
const thresholdService = new ThresholdService();
export default thresholdService;