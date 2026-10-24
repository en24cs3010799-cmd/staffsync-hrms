const express = require('express');
const Training = require('../models/Training');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

const populateTraining = (q) =>
  q.populate('assignedTo', 'name email department').populate('createdBy', 'name');

// Managers may only assign trainings to people in their own team
const sanitizeAssignees = async (user, ids = []) => {
  if (user.role === 'hr') return ids;
  const team = await User.find({ manager: user._id }).select('_id');
  const allowed = new Set(team.map((t) => String(t._id)));
  return ids.filter((id) => allowed.has(String(id)));
};

// GET /api/training
//  HR: all, Manager: the ones they created, Employee: the ones assigned to them
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.user.role === 'manager') filter = { createdBy: req.user._id };
    if (req.user.role === 'employee') filter = { assignedTo: req.user._id };
    res.json(await populateTraining(Training.find(filter).sort({ startDate: -1 })));
  })
);

// POST /api/training
router.post(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const { title, description, trainer, mode, startDate, endDate, assignedTo } = req.body;
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    const training = await Training.create({
      title, description, trainer, mode, startDate, endDate,
      assignedTo: await sanitizeAssignees(req.user, assignedTo),
      createdBy: req.user._id,
    });
    res.status(201).json(await populateTraining(Training.findById(training._id)));
  })
);

// PUT /api/training/:id
router.put(
  '/:id',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    if (req.user.role === 'manager' && String(training.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit trainings you created' });
    }
    ['title', 'description', 'trainer', 'mode', 'startDate', 'endDate'].forEach((f) => {
      if (req.body[f] !== undefined) training[f] = req.body[f];
    });
    if (req.body.assignedTo) {
      training.assignedTo = await sanitizeAssignees(req.user, req.body.assignedTo);
    }
    if (training.endDate < training.startDate) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    await training.save();
    res.json(await populateTraining(Training.findById(training._id)));
  })
);

// DELETE /api/training/:id
router.delete(
  '/:id',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const training = await Training.findById(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    if (req.user.role === 'manager' && String(training.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete trainings you created' });
    }
    await training.deleteOne();
    res.json({ message: 'Training deleted' });
  })
);

module.exports = router;
