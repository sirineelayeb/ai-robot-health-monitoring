import { spawn } from "child_process";

/**
 * Sends telemetry data to the Python ML model and gets prediction.
 * @param {Object} telemetryData - The telemetry data (battery, motor_temp, etc.)
 * @returns {Promise<Object>} - The ML prediction result
 */
export const predictAnomaly = (telemetryData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["./ml/predict.py", JSON.stringify(telemetryData)]);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (error) return reject(new Error(error));
      try {
        const json = JSON.parse(result);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
  });
};
