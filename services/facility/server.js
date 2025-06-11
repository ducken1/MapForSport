const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const winston = require('winston');

const {
  createFacility,
  getFacility,
  updateFacility,
  deleteFacility,
  addAvailableTime,
  removeAvailableTime,
} = require('./controllers/facilityCon');


// Logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

// Load proto
const packageDefinition = protoLoader.loadSync('./facility.proto', {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/facilities';
mongoose.connect(mongoUri)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Start gRPC server
const server = new grpc.Server();
server.addService(facilityProto.FacilityService.service, {
  CreateFacility: createFacility,
  GetFacility: getFacility,
  UpdateFacility: updateFacility,
  DeleteFacility: deleteFacility,
  AddAvailableTime: addAvailableTime,
  RemoveAvailableTime: removeAvailableTime,
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  logger.info('gRPC server running on port 50051');
});
