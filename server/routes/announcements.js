const express = require('express');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

// GET /api/announcements - everyone can read
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await Announcement.find().populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json(list);
  })
);

// POST /api/announcements - HR only
router.post(
  '/',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const { title, message, type } = req.body;
    const item = await Announcement.create({ title, message, type, postedBy: req.user._id });
    res.status(201).json(await item.populate('postedBy', 'name'));
  })
);

// PUT /api/announcements/:id - HR only
router.put(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    ['title', 'message', 'type'].forEach((f) => {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    });
    await item.save();
    res.json(await item.populate('postedBy', 'name'));
  })
);

// DELETE /api/announcements/:id - HR only
router.delete(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  })
);

module.exports = router;
