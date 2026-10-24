const express = require('express');
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { toDateString, monthPrefix } = require('../utils/dates');

const router = express.Router();
router.use(protect);

// GET /api/dashboard/stats - numbers depend on the logged-in role
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const today = toDateString();
    const { role, _id } = req.user;

    if (role === 'hr') {
      const [totalEmployees, pendingLeaves, presentToday, announcements, trainings] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Leave.countDocuments({ status: 'Pending' }),
        Attendance.countDocuments({ date: today }),
        Announcement.countDocuments(),
        Training.countDocuments(),
      ]);
      return res.json({ role, totalEmployees, pendingLeaves, presentToday, announcements, trainings });
    }

    if (role === 'manager') {
      const team = await User.find({ manager: _id }).select('_id');
      const ids = team.map((t) => t._id);
      const [pendingLeaves, presentToday, trainings] = await Promise.all([
        Leave.countDocuments({ employee: { $in: ids }, status: 'Pending' }),
        Attendance.countDocuments({ employee: { $in: ids }, date: today }),
        Training.countDocuments({ createdBy: _id }),
      ]);
      return res.json({ role, teamSize: ids.length, pendingLeaves, presentToday, trainings });
    }

    const [pendingLeaves, approvedLeaves, daysPresent, trainings] = await Promise.all([
      Leave.countDocuments({ employee: _id, status: 'Pending' }),
      Leave.countDocuments({ employee: _id, status: 'Approved' }),
      Attendance.countDocuments({ employee: _id, date: { $regex: `^${monthPrefix()}` } }),
      Training.countDocuments({ assignedTo: _id }),
    ]);
    res.json({ role, pendingLeaves, approvedLeaves, daysPresent, trainings });
  })
);

module.exports = router;
