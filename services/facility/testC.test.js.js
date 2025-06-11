const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('./facility.proto', {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;

const client = new facilityProto.FacilityService('localhost:50051', grpc.credentials.createInsecure());

const createFacility = (name, description) => new Promise((resolve, reject) => {
  client.CreateFacility({ name, description }, (err, res) => {
    if (err) return reject(err);
    console.log('Facility created:', res);
    resolve(res.id);
  });
});

const getFacility = (id) => new Promise((resolve, reject) => {
  client.GetFacility({ id }, (err, res) => {
    if (err) return reject(err);
    console.log('Facility details:', res);
    resolve(res);
  });
});

const updateFacility = (id, name, description) => new Promise((resolve, reject) => {
  client.UpdateFacility({ id, name, description }, (err, res) => {
    if (err) return reject(err);
    console.log('Facility updated:', res);
    resolve(res);
  });
});

const deleteFacility = (id) => new Promise((resolve, reject) => {
  client.DeleteFacility({ id }, (err, res) => {
    if (err) return reject(err);
    console.log('Facility deleted:', res);
    resolve(res);
  });
});

const addAvailableTime = (facilityId, time) => new Promise((resolve, reject) => {
  client.AddAvailableTime({ facilityId, time }, (err, res) => {
    if (err) return reject(err);
    console.log('Available time added:', res);
    resolve(res);
  });
});

const removeAvailableTime = (facilityId, start, end) => new Promise((resolve, reject) => {
  client.RemoveAvailableTime({ facilityId, start, end }, (err, res) => {
    if (err) return reject(err);
    console.log('Available time removed:', res);
    resolve(res);
  });
});

const testFacilityMethods = async () => {
  try {
    const id = await createFacility('Facility 1', 'Opis facility');

    await getFacility(id);

    await updateFacility(id, 'Posodobljena Facility', 'Posodobljen opis facility');

    const newTime = { start: '2025-06-11T14:00:00Z', end: '2025-06-11T15:00:00Z' };
    await addAvailableTime(id, newTime);

    await removeAvailableTime(id, newTime.start, newTime.end);

    await deleteFacility(id);
  } catch (error) {
    console.error('Error during facility methods test:', error);
  }
};

testFacilityMethods();
