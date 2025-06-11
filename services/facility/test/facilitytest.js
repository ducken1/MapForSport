const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const { createFacility, getFacility, updateFacility, deleteFacility } = require('../controllers/facilityController');
const Facility = require('../models/facility');

const packageDefinition = protoLoader.loadSync('./facility.proto', {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;

describe('Facility Service Tests', () => {
  let server;
  let client;
  let testId;

  jest.setTimeout(15000);

  beforeAll(async () => {
    server = new grpc.Server();
    server.addService(facilityProto.FacilityService.service, {
      CreateFacility: createFacility,
      GetFacility: getFacility,
      UpdateFacility: updateFacility,
      DeleteFacility: deleteFacility,
    });

    await new Promise(resolve => server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), resolve));
    client = new facilityProto.FacilityService('localhost:50051', grpc.credentials.createInsecure());
    await mongoose.connect('mongodb://localhost:27017/facilities', { useNewUrlParser: true, useUnifiedTopology: true });

    const facility = new Facility({ name: 'Test Facility', description: 'Test Description' });
    const saved = await facility.save();
    testId = saved._id.toString();
  });

  afterAll(async () => {
    await new Promise(resolve => server.tryShutdown(resolve));
    await mongoose.connection.close();
  });

  it('should create a facility', done => {
    client.CreateFacility({ name: 'New Facility', description: 'Desc' }, (err, res) => {
      expect(err).toBeNull();
      expect(res.name).toBe('New Facility');
      expect(res.description).toBe('Desc');
      done();
    });
  });

  it('should get a facility', done => {
    client.GetFacility({ id: testId }, (err, res) => {
      expect(err).toBeNull();
      expect(res.id).toBe(testId);
      expect(res.name).toBeDefined();
      done();
    });
  });

  it('should update a facility', done => {
    client.UpdateFacility({ id: testId, name: 'Updated', description: 'Updated Desc' }, (err, res) => {
      expect(err).toBeNull();
      expect(res.name).toBe('Updated');
      expect(res.description).toBe('Updated Desc');
      done();
    });
  });

  it('should delete a facility', done => {
    client.DeleteFacility({ id: testId }, (err, res) => {
      expect(err).toBeNull();
      expect(res.success).toBe(true);
      done();
    });
  });
});
