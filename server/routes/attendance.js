const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { toDateString } = require('../utils/dates');

const router = express.Router();
router.use(protect);

// GET /api/attendance/today - my record for today (or null)
router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const record = await Attendance.findOne({ employee: req.user._id, date: toDateString() });
    res.json(record);
  })
);

// POST /api/attendance/checkin
router.post(
  '/checkin',
  asyncHandler(async (req, res) => {
    const date = toDateString();
    const existing = await Attendance.findOne({ employee: req.user._id, date });
    if (existing) return res.status(400).json({ message: 'You have already checked in today' });
    const record = await Attendance.create({
      employee: req.user._id, date, checkIn: new Date(), status: 'Present',
    });
    res.status(201).json(record);
  })
);

// POST /api/attendance/checkout
router.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const record = await Attendance.findOne({ employee: req.user._id, date: toDateString() });
    if (!record) return res.status(400).json({ message: 'Please check in first' });
    if (record.checkOut) return res.status(400).json({ message: 'You have already checked out today' });

    record.checkOut = new Date();
    record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
    record.status = record.workHours < 4 ? 'Half Day' : 'Present';
    await record.save();
    res.json(record);
  })
);

// GET /api/attendance/my - my last 60 records
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    res.json(await Attendance.find({ employee: req.user._id }).sort({ date: -1 }).limit(60));
  })
);

// GET /api/attendance?date=YYYY-MM-DD - HR: everyone, Manager: own team
router.get(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const date = req.query.date || toDateString();
    const filter = { date };
    if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      filter.employee = { $in: team.map((t) => t._id) };
    }
    const records = await Attendance.find(filter)
      .populate('employee', 'name email department designation')
      .sort({ checkIn: 1 });
    res.json(records);
  })
);

module.exports = router;
