export const emitTelemetry = (io, telemetry) => {
  io.emit("telemetry", telemetry);
};
