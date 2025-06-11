const express = require('express');
const cors = require('cors');
const axios = require('axios');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'web-gateway.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Service URLs
const AUTH_SERVICE_URL = 'http://localhost:8000';
const RESERVATION_SERVICE_URL = 'http://localhost:8080';
const FACILITY_GRPC_HOST = 'localhost:50051';

// Load gRPC proto for Facility Service
const PROTO_PATH = './facility.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;
const facilityClient = new facilityProto.FacilityService(
  FACILITY_GRPC_HOST,
  grpc.credentials.createInsecure()
);

// Middleware to log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Web Gateway`);
  next();
});



// ============= FACILITY ROUTES (gRPC) =============

// Get all facilities (web-specific endpoint)
app.get('/web/facilities', (req, res) => {
  // This would require a listFacilities method in your gRPC service
  // For now, returning a placeholder
  res.json({ message: 'List facilities endpoint - implement listFacilities in gRPC service' });
});

// Get facility by ID
app.get('/web/facilities/:id', (req, res) => {
  const request = { id: req.params.id };
  
  facilityClient.getFacility(request, (error, response) => {
    if (error) {
      logger.error(`Error getting facility: ${error.message}`);
      res.status(404).json({ error: 'Facility not found' });
    } else {
      logger.info(`Retrieved facility ${req.params.id} via web gateway`);
      res.json(response);
    }
  });
});

// Create facility
app.post('/web/facilities', (req, res) => {
  const request = {
    name: req.body.name,
    description: req.body.description
  };
  
  facilityClient.createFacility(request, (error, response) => {
    if (error) {
      logger.error(`Error creating facility: ${error.message}`);
      res.status(500).json({ error: 'Failed to create facility' });
    } else {
      logger.info(`Created facility via web gateway`);
      res.json(response);
    }
  });
});

// Update facility
app.put('/web/facilities/:id', (req, res) => {
  const request = {
    id: req.params.id,
    name: req.body.name,
    description: req.body.description
  };
  
  facilityClient.updateFacility(request, (error, response) => {
    if (error) {
      logger.error(`Error updating facility: ${error.message}`);
      res.status(404).json({ error: 'Facility not found' });
    } else {
      logger.info(`Updated facility ${req.params.id} via web gateway`);
      res.json(response);
    }
  });
});

// Delete facility
app.delete('/web/facilities/:id', (req, res) => {
  const request = { id: req.params.id };
  
  facilityClient.deleteFacility(request, (error, response) => {
    if (error) {
      logger.error(`Error deleting facility: ${error.message}`);
      res.status(404).json({ error: 'Facility not found' });
    } else {
      logger.info(`Deleted facility ${req.params.id} via web gateway`);
      res.json(response);
    }
  });
});

// Add available time to facility
app.post('/web/facilities/:id/available-times', (req, res) => {
  const request = {
    facilityId: req.params.id,
    time: req.body.time
  };
  
  facilityClient.addAvailableTime(request, (error, response) => {
    if (error) {
      logger.error(`Error adding available time: ${error.message}`);
      res.status(500).json({ error: 'Failed to add available time' });
    } else {
      logger.info(`Added available time to facility ${req.params.id} via web gateway`);
      res.json(response);
    }
  });
});

// Remove available time from facility
app.delete('/web/facilities/:id/available-times', (req, res) => {
  const request = {
    facilityId: req.params.id,
    start: req.body.start,
    end: req.body.end
  };
  
  facilityClient.removeAvailableTime(request, (error, response) => {
    if (error) {
      logger.error(`Error removing available time: ${error.message}`);
      res.status(500).json({ error: 'Failed to remove available time' });
    } else {
      logger.info(`Removed available time from facility ${req.params.id} via web gateway`);
      res.json(response);
    }
  });
});

// ============= RESERVATION ROUTES =============




app.listen(PORT, () => {
  logger.info(`Web API Gateway running on port ${PORT}`);
  console.log(`Web API Gateway running on port ${PORT}`);
});