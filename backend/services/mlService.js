import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import logger from "../utils/logger.js";

export const predictAnomaly = async (telemetry) => {
  return new Promise((resolve) => {
    const tmpFile = path.join(os.tmpdir(), `telemetry_${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(telemetry));

    const cmd = `python "ml/inference/predict.py" "${tmpFile}"`;
    exec(cmd, { shell: true }, (error, stdout, stderr) => {
      fs.unlinkSync(tmpFile); // cleanup temp file

      if (error) {
        logger.error("ML Prediction Error:", stderr || error.message);
        return resolve({ success: false });
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        logger.error("ML Prediction Parse Error:", e.message);
        resolve({ success: false });
      }
    });
  });
};
