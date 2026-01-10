import logger from '../utils/logger.js'; 

// Emit telemetry to specific robot room and all clients
export const emitTelemetry = (io, telemetry) => {
  if (!io || !telemetry || !telemetry.robot_id) {
    logger.error('Cannot emit telemetry: missing io or robot_id');
    return;
  }
  
  const room = `robot_${telemetry.robot_id}`;
  
  // Emit to specific robot room
  io.to(room).emit('telemetry', telemetry);
  
  // Also emit to all connected clients
  io.emit('telemetry', telemetry);
  
  logger.debug(`📡 Telemetry emitted to room ${room} and all clients`);
};

// Emit alert to specific robot room and all clients
export const emitAlert = (io, alert) => {
  if (!io || !alert || !alert.robot_id) {
    logger.error('Cannot emit alert: missing io or robot_id');
    return;
  }
  
  const room = `robot_${alert.robot_id}`;
  
  // Emit to specific robot room
  io.to(room).emit('threshold_alert', alert);
  
  // Also emit to all connected clients
  io.emit('threshold_alert', alert);
  
  logger.debug(`🚨 Alert emitted to room ${room} and all clients`);
};

// Simplified setup function for your main socket.io initialization
export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Handle room joining
    socket.on('join', (room) => {
      socket.join(room);
      logger.debug(`Client ${socket.id} joined room: ${room}`);
    });
    
    // Handle room leaving
    socket.on('leave', (room) => {
      socket.leave(room);
      logger.debug(`Client ${socket.id} left room: ${room}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error from ${socket.id}:`, error);
    });
  });
  
  return io;
};