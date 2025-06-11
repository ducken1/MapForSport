const mongoose = require('mongoose');
const winston = require('winston');
const Facility = require('../models/facility');
const grpc = require('@grpc/grpc-js');

// Winston logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'facilityController.log' })
  ]
});

const createFacility = async (call, callback) => {
  const { name, description } = call.request;
  const facility = new Facility({ name, description });

  try {
    await facility.save();
    logger.info(`Facility created: ${name}`);
    callback(null, { id: facility._id.toString(), name, description });
  } catch (error) {
    logger.error(`Error creating facility: ${error.message}`);
    callback(error);
  }
};

const getFacility = async (call, callback) => {
  const { id } = call.request;
  try {
    const facility = await Facility.findById(id);
    if (!facility) {
      logger.warn(`Facility not found with ID: ${id}`);
      callback({ code: grpc.status.NOT_FOUND, details: 'Facility not found' });
    } else {
      logger.info(`Retrieved facility with ID: ${id}`);
      callback(null, {
        id: facility._id.toString(),
        name: facility.name,
        description: facility.description,
        availableTimes: facility.availableTimes,  
      });
    }
  } catch (error) {
    logger.error(`Error fetching facility: ${error.message}`);
    callback(error);
  }
};

const updateFacility = async (call, callback) => {
  const { id, name, description } = call.request;
  try {
    const facility = await Facility.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!facility) {
      logger.warn(`Facility not found for update with ID: ${id}`);
      callback({ code: grpc.status.NOT_FOUND, details: 'Facility not found' });
    } else {
      logger.info(`Updated facility with ID: ${id}`);
      callback(null, { id: facility._id.toString(), name: facility.name, description: facility.description });
    }
  } catch (error) {
    logger.error(`Error updating facility: ${error.message}`);
    callback(error);
  }
};

const deleteFacility = async (call, callback) => {
  const { id } = call.request;
  try {
    const facility = await Facility.findByIdAndDelete(id);
    if (facility) {
      logger.info(`Deleted facility with ID: ${id}`);
      callback(null, { success: true });
    } else {
      logger.warn(`Facility not found for deletion with ID: ${id}`);
      callback({ code: grpc.status.NOT_FOUND, details: 'Facility not found' });
    }
  } catch (error) {
    logger.error(`Error deleting facility: ${error.message}`);
    callback({ code: grpc.status.INTERNAL, details: 'Error deleting facility' });
  }
};


const addAvailableTime = async (call, callback) => {
  const { facilityId, time } = call.request;

  try {
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Facility not found' });
    }

    facility.availableTimes.push(time);
    await facility.save();

    callback(null, {
      id: facility._id.toString(),
      name: facility.name,
      description: facility.description,
      availableTimes: facility.availableTimes,
    });
  } catch (error) {
    logger.error(`Error adding available time: ${error.message}`);
    callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
  }
};

const removeAvailableTime = async (call, callback) => {
  const { facilityId, start, end } = call.request;

  try {
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return callback({ code: grpc.status.NOT_FOUND, details: 'Facility not found' });
    }

    facility.availableTimes = facility.availableTimes.filter(
      (t) => t.start !== start || t.end !== end
    );

    await facility.save();

    callback(null, {
      id: facility._id.toString(),
      name: facility.name,
      description: facility.description,
      availableTimes: facility.availableTimes,
    });
  } catch (error) {
    logger.error(`Error removing available time: ${error.message}`);
    callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
  }
};

module.exports = {
  createFacility,
  getFacility,
  updateFacility,
  deleteFacility,
  addAvailableTime,
  removeAvailableTime,
};

