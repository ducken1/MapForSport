const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Facility = require('../models/facility');
const {
  createFacility,
  getFacility,
  updateFacility,
  deleteFacility,
  addAvailableTime,
  removeAvailableTime,
} = require('../controllers/facilityController');

const packageDefinition = protoLoader.loadSync('./facility.proto', {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;

describe('Facility Service Tests', () => {
  let server;
  let client;
  let testId;

  jest.setTimeout(20000);

  beforeAll(async () => {
    server = new grpc.Server();
    server.addService(facilityProto.FacilityService.service, {
      CreateFacility: createFacility,
      GetFacility: getFacility,
      UpdateFacility: updateFacility,
      DeleteFacility: deleteFacility,
      AddAvailableTime: addAvailableTime,
      RemoveAvailableTime: removeAvailableTime,
    });

    await new Promise((resolve, reject) =>
      server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) return reject(err);
        resolve(port);
      })
    );
    server.start();

    client = new facilityProto.FacilityService('localhost:50051', grpc.credentials.createInsecure());

    await mongoose.connect('mongodb://localhost:27017/facilities', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const facility = new Facility({ name: 'Test Facility', description: 'Test Description' });
    const saved = await facility.save();
    testId = saved._id.toString();
  });

  afterAll(async () => {
    await new Promise((resolve) => server.tryShutdown(resolve));
    await mongoose.connection.close();
  });

  it('should create a facility', (done) => {
    client.CreateFacility({ name: 'New Facility', description: 'Desc' }, (err, res) => {
      expect(err).toBeNull();
      expect(res.name).toBe('New Facility');
      expect(res.description).toBe('Desc');
      done();
    });
  });

  it('should get a facility', (done) => {
    client.GetFacility({ id: testId }, (err, res) => {
      expect(err).toBeNull();
      expect(res.id).toBe(testId);
      expect(res.name).toBeDefined();
      expect(res.description).toBeDefined();
      expect(res.availableTimes).toBeDefined();
      done();
    });
  });

  it('should update a facility', (done) => {
    client.UpdateFacility(
      { id: testId, name: 'Updated', description: 'Updated Desc' },
      (err, res) => {
        expect(err).toBeNull();
        expect(res.name).toBe('Updated');
        expect(res.description).toBe('Updated Desc');
        done();
      }
    );
  });

  it('should add available time', (done) => {
    const newTime = { start: '2025-06-11T14:00:00Z', end: '2025-06-11T15:00:00Z' };
    client.AddAvailableTime({ facilityId: testId, time: newTime }, (err, res) => {
      expect(err).toBeNull();
      expect(res.availableTimes).toEqual(
        expect.arrayContaining([expect.objectContaining(newTime)])
      );
      done();
    });
  });

  it('should remove available time', (done) => {
    const start = '2025-06-11T14:00:00Z';
    const end = '2025-06-11T15:00:00Z';

    client.RemoveAvailableTime({ facilityId: testId, start, end }, (err, res) => {
      expect(err).toBeNull();
      // Should no longer contain the removed time
      const removed = res.availableTimes.find((t) => t.start === start && t.end === end);
      expect(removed).toBeUndefined();
      done();
    });
  });

  it('should delete a facility', (done) => {
    client.DeleteFacility({ id: testId }, (err, res) => {
      expect(err).toBeNull();
      expect(res.success).toBe(true);
      done();
    });
  });
});
