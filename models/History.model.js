const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  or_number: {
    type: String,
    required: false,
  },
  email_client: {
    type: String,
    required: false,
  },
  track_file_one: {
    type: String,
    required: false,
  },
  track_file_two: {
    type: String,
    required: false,
  },
  employe_in_charge: {
    type: String,
    required: false,
  },
  created_At: {
    type: Date,
    required: false,
    default: Date.now
  }
});

module.exports = mongoose.model('History', historySchema);