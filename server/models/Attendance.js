const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    workHours: { type: Number, default: 0 },
    status: { type: String, enum: ['Present', 'Half Day'], default: 'Present' },
  },
  { timestamps: true }
);

// one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
