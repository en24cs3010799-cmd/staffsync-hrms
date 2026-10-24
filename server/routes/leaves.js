const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

const DAY = 24 * 60 * 60 * 1000;

// POST /api/leaves - apply for leave (any logged-in user)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    const days = Math.round((to - from) / DAY) + 1;
    const leave = await Leave.create({
      employee: req.user._id, leaveType, fromDate: from, toDate: to, days, reason,
    });
    res.status(201).json(leave);
  })
);

// GET /api/leaves/my - my own leave history
router.get(
  '/my',
  asyncHandler(async (req, res) => {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  })
);

// GET /api/leaves - HR: all requests, Manager: requests from own team
router.get(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      filter = { employee: { $in: team.map((t) => t._id) } };
    }
    const leaves = await Leave.find(filter)
      .populate('employee', 'name email department role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  })
);

// PUT /api/leaves/:id/status - approve / reject
router.put(
  '/:id/status',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const { status, comment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (String(leave.employee._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot review your own leave request' });
    }
    if (req.user.role === 'manager' && String(leave.employee.manager) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This employee is not in your team' });
    }
    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: `This request is already ${leave.status}` });
    }

    leave.status = status;
    leave.reviewComment = comment || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    res.json(await Leave.findById(leave._id)
      .populate('employee', 'name email department role')
      .populate('reviewedBy', 'name'));
  })
);

// DELETE /api/leaves/:id - cancel own pending request
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    await leave.deleteOne();
    res.json({ message: 'Leave request cancelled' });
  })
);

module.exports = router;
