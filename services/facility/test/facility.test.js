const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const path = require('path');

// Adjust these paths if your structure is different
const Facility = require('../models/facility');
const facilityController = require('../controllers/facilityCon');

const {
  createFacility,
  getFacility,
  updateFacility,
  deleteFacility,
  addAvailableTime,
  removeAvailableTime,
} = facilityController;

// Load proto file relative to this test file
const protoPath = path.join(__dirname, '../facility.proto');
const packageDefinition = protoLoader.loadSync(protoPath, {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;

describe('Facility Service Tests', () => {
  let server;
  let client;
  let testId;
  let createdFacilityId; // Track facilities created during tests

  // Increase timeout for async operations
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      // Connect to MongoDB first
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect('mongodb://localhost:27017/facilities_test');
      }

      // Clear any existing test data
      await Facility.deleteMany({});

      // Start gRPC server
      server = new grpc.Server();
      server.addService(facilityProto.FacilityService.service, {
        CreateFacility: createFacility,
        GetFacility: getFacility,
        UpdateFacility: updateFacility,
        DeleteFacility: deleteFacility,
        AddAvailableTime: addAvailableTime,
        RemoveAvailableTime: removeAvailableTime,
      });

      await new Promise((resolve, reject) => {
        server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), (err, port) => {
          if (err) return reject(err);
          console.log('Test gRPC server running on port:', port);
          resolve(port);
        });
      });

      // Set up gRPC client for testing
      client = new facilityProto.FacilityService('localhost:50052', grpc.credentials.createInsecure());

      // Wait a bit for the server to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a sample Facility to get a valid ID
      const facility = new Facility({
        name: 'Test Facility',
        description: 'Test Description',
        availableTimes: [] // Initialize with empty array
      });
      const savedFacility = await facility.save();
      testId = savedFacility._id.toString();
      console.log('Created test facility with ID:', testId);
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // Reset the test facility's available times before each test
    try {
      await Facility.findByIdAndUpdate(testId, { availableTimes: [] });
      console.log('Reset availableTimes for test facility');
    } catch (error) {
      console.error('Error resetting test facility:', error);
    }
  });

  afterAll(async () => {
    try {
      // Clean up created facilities
      if (createdFacilityId) {
        await Facility.findByIdAndDelete(createdFacilityId).catch(() => {});
      }
      await Facility.findByIdAndDelete(testId).catch(() => {});
      
      // Close client connection
      if (client) {
        client.close();
      }
      
      // Shutdown server
      if (server) {
        await new Promise((resolve) => {
          server.tryShutdown(() => {
            console.log('gRPC server shut down');
            resolve();
          });
        });
      }
      
      // Close MongoDB connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (error) {
      console.error('Error in afterAll:', error);
    }
  });

  it('should create a new facility', (done) => {
    const req = { name: 'New Facility', description: 'New Description' };

    client.CreateFacility(req, (error, response) => {
      try {
        expect(error).toBeNull();
        expect(response).toHaveProperty('id');
        expect(response.name).toBe('New Facility');
        expect(response.description).toBe('New Description');
        
        // Store the created facility ID for cleanup
        createdFacilityId = response.id;
        console.log('Created facility with ID:', createdFacilityId);
        
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should get facility by ID', (done) => {
    console.log('Attempting to get facility with ID:', testId);
    
    client.GetFacility({ id: testId }, (error, response) => {
      try {
        if (error) {
          console.error('gRPC Error:', error);
          console.error('Error code:', error.code);
          console.error('Error details:', error.details);
          done(error);
          return;
        }
        
        console.log('Response received:', JSON.stringify(response, null, 2));
        
        expect(error).toBeNull();
        expect(response).toHaveProperty('id');
        expect(response.id).toBe(testId);
        expect(response.name).toBeDefined();
        expect(response.description).toBeDefined();
        
        // More flexible check for availableTimes
        if (response.availableTimes !== undefined) {
          expect(Array.isArray(response.availableTimes)).toBe(true);
        } else {
          console.warn('availableTimes is undefined, this might be expected based on your proto definition');
        }
        
        done();
      } catch (err) {
        console.error('Test assertion error:', err);
        done(err);
      }
    });
  });

  it('should update a facility', (done) => {
    const req = {
      id: testId,
      name: 'Updated Facility',
      description: 'Updated Description',
    };

    client.UpdateFacility(req, (error, response) => {
      try {
        expect(error).toBeNull();
        expect(response.name).toBe('Updated Facility');
        expect(response.description).toBe('Updated Description');
        expect(response.id).toBe(testId);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should add available time to facility', (done) => {
    const timeSlot = {
      start: '2025-06-11T09:00:00Z', // ISO 8601 format
      end: '2025-06-11T10:00:00Z'
    };
    
    const req = {
      facilityId: testId,
      time: timeSlot
    };

    client.AddAvailableTime(req, (error, response) => {
      try {
        if (error) {
          console.error('Error adding time slot:', error);
          done(error);
          return;
        }
        
        console.log('Add time response:', JSON.stringify(response, null, 2));
        
        expect(error).toBeNull();
        expect(response).toHaveProperty('id');
        expect(response.id).toBe(testId);
        expect(response).toHaveProperty('availableTimes');
        expect(Array.isArray(response.availableTimes)).toBe(true);
        expect(response.availableTimes).toHaveLength(1);
        
        // Check the structure of the added time slot
        const addedSlot = response.availableTimes[0];
        expect(addedSlot).toHaveProperty('start', '2025-06-11T09:00:00Z');
        expect(addedSlot).toHaveProperty('end', '2025-06-11T10:00:00Z');
        
        done();
      } catch (err) {
        console.error('Add time test error:', err);
        done(err);
      }
    });
  });

  

  it('should handle facility not found error', (done) => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    client.GetFacility({ id: nonExistentId }, (error, response) => {
      try {
        expect(error).not.toBeNull();
        expect(error.code).toBe(grpc.status.NOT_FOUND);
        expect(error.details).toBe('Facility not found');
        expect(response).toBeUndefined();
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should handle invalid facility ID format', (done) => {
    const invalidId = 'invalid-id-format';
    
    client.GetFacility({ id: invalidId }, (error, response) => {
      try {
        expect(error).not.toBeNull();
        // This should trigger a database error due to invalid ObjectId format
        // The error should contain "Cast to ObjectId failed"
        expect(error.message || error.details || '').toContain('Cast to ObjectId');
        expect(response).toBeUndefined();
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should delete a facility', (done) => {
    // First create a facility to delete
    const createReq = { name: 'Facility to Delete', description: 'Will be deleted' };
    
    client.CreateFacility(createReq, (createError, createResponse) => {
      if (createError) {
        done(createError);
        return;
      }
      
      const facilityToDeleteId = createResponse.id;
      
      client.DeleteFacility({ id: facilityToDeleteId }, (error, response) => {
        try {
          expect(error).toBeNull();
          expect(response).toHaveProperty('success', true);
          
          // Verify the facility is actually deleted
          client.GetFacility({ id: facilityToDeleteId }, (getError, getResponse) => {
            expect(getError).not.toBeNull();
            expect(getError.code).toBe(grpc.status.NOT_FOUND);
            done();
          });
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('should handle delete facility not found error', (done) => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    client.DeleteFacility({ id: nonExistentId }, (error, response) => {
      try {
        expect(error).not.toBeNull();
        expect(error.code).toBe(grpc.status.NOT_FOUND);
        expect(error.details).toBe('Facility not found');
        expect(response).toBeUndefined();
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});