const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('./facility.proto', {});
const facilityProto = grpc.loadPackageDefinition(packageDefinition).facility;


const client = new facilityProto.FacilityService('localhost:50051', grpc.credentials.createInsecure());


const createFacility = (name, description) => {
  return new Promise((resolve, reject) => {
    client.CreateFacility({ name, description }, (error, response) => {
      if (error) {
        reject('Error creating Facility: ' + error);
      } else {
        console.log('Facility created:', response);
        resolve(response.id); 
      }
    });
  });
};


const getFacility = (facilityId) => {
  return new Promise((resolve, reject) => {
    client.GetFacility({ id: facilityId }, (error, response) => {
      if (error) {
        reject('Error getting Facility: ' + error);
      } else {
        console.log('Facility details:', response);
        resolve(response); 
      }
    });
  });
};


const updateFacility = (facilityId, name, description) => {
  return new Promise((resolve, reject) => {
    client.UpdateFacility({ id: facilityId, name, description }, (error, response) => {
      if (error) {
        reject('Error updating Facility: ' + error);
      } else {
        console.log('Facility updated:', response);
        resolve(response); 
      }
    });
  });
};


const deleteFacility = (facilityId) => {
  return new Promise((resolve, reject) => {
    client.DeleteFacility({ id: facilityId }, (error, response) => {
      if (error) {
        reject('Error deleting Facility: ' + error);
      } else {
        console.log('Facility deleted:', response);
        resolve(response); 
      }
    });
  });
};


const testFacilityMethods = async () => {
  try {
    
    const facilityId = await createFacility('Facility 1', 'Opis facility');

    const facility2Id = await createFacility('Facility 2', 'Opis facility 2');
    
    //CRUD
    await getFacility(facilityId);


    await getFacility(facility2Id);

    await updateFacility(facilityId, 'Posodobljena Facility', 'Posodobljen opis facility');
    

    await deleteFacility(facilityId);
  } catch (error) {
    console.error('Napaka med izvajanjem metod:', error);
  }
};

testFacilityMethods();
