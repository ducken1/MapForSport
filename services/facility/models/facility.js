const mongoose = require('mongoose');

const availableTimeSchema = new mongoose.Schema({
  start: String,
  end: String
}, { _id: false });

const facilitySchema = new mongoose.Schema({
  name: String,
  description: String,
  availableTimes: [availableTimeSchema]
});

module.exports = mongoose.model('Facility', facilitySchema);
