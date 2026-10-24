const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(protect);

// PUT /api/users/me - update own profile (name, phone, address, password)
router.put(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    const { name, phone, address, currentPassword, newPassword } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (newPassword) {
      if (!currentPassword || !(await user.matchPassword(currentPassword))) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }
    await user.save();
    const updated = await User.findById(user._id).populate('manager', 'name email');
    res.json(updated);
  })
);

// GET /api/users/managers - list of managers (HR uses it in the employee form)
router.get(
  '/managers',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    res.json(await User.find({ role: 'manager', isActive: true }).select('name email department'));
  })
);

// GET /api/users - HR: everyone, Manager: own team
router.get(
  '/',
  authorize('hr', 'manager'),
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'hr' ? {} : { manager: req.user._id };
    const users = await User.find(filter).populate('manager', 'name').sort({ createdAt: -1 });
    res.json(users);
  })
);

// POST /api/users - HR creates a user
router.post(
  '/',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const exists = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (exists) return res.status(400).json({ message: 'A user with this email already exists' });
    const body = { ...req.body };
    if (!body.manager) body.manager = null;
    if (!body.password) body.password = 'Welcome@123';
    const user = await User.create(body);
    res.status(201).json(await User.findById(user._id).populate('manager', 'name'));
  })
);

// PUT /api/users/:id - HR updates a user
router.put(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const fields = [
      'name', 'email', 'role', 'department', 'designation',
      'phone', 'address', 'dateOfJoining', 'salary', 'isActive',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    if (req.body.manager !== undefined) user.manager = req.body.manager || null;
    if (req.body.password) user.password = req.body.password;

    await user.save();
    res.json(await User.findById(user._id).populate('manager', 'name'));
  })
);

// DELETE /api/users/:id - HR removes a user
router.delete(
  '/:id',
  authorize('hr'),
  asyncHandler(async (req, res) => {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  })
);

module.exports = router;
