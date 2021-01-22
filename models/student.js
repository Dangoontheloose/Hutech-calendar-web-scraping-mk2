const mongoose = require('mongoose');
const { Schema } = mongoose;


const studentSchema = new Schema({
  username: String,
  password: String,
  schedule: [{
    subject: String,
    thu_1: String,
    thu_2: String,
    tiet_bd: Number,
    so_tiet: Number,
    phong: String,
    tg_hoc_1: String,
    tg_hoc_2: String,
    so_tuan_hoc_1: String,
    so_tuan_hoc_2: String,
  }],
});

Student = mongoose.model('students', studentSchema);
module.exports = Student;