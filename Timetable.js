// Timetable.js
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({

   
        subject_code: String,
        subject_name: String,
        staff_incharge: String,
        room_no: String,
        semester_year:String
    

});

module.exports = mongoose.model('Timetable', timetableSchema);
