// Run with: npm run seed  (wipes the collections and inserts demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');
const { toDateString } = require('./utils/dates');

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    User.deleteMany(), Leave.deleteMany(), Attendance.deleteMany(),
    Announcement.deleteMany(), Training.deleteMany(),
  ]);

  const hr = await User.create({
    name: 'Priya Sharma', email: 'hr@staffsync.com', password: 'hr12345', role: 'hr',
    department: 'Human Resources', designation: 'HR Manager', phone: '9876500001', salary: 80000,
  });
  const manager = await User.create({
    name: 'Rahul Verma', email: 'manager@staffsync.com', password: 'manager123', role: 'manager',
    department: 'Engineering', designation: 'Engineering Manager', phone: '9876500002', salary: 120000,
  });
  const emp1 = await User.create({
    name: 'Anita Singh', email: 'employee@staffsync.com', password: 'employee123', role: 'employee',
    department: 'Engineering', designation: 'Software Engineer', phone: '9876500003',
    salary: 60000, manager: manager._id,
  });
  const emp2 = await User.create({
    name: 'Karan Patel', email: 'karan@staffsync.com', password: 'employee123', role: 'employee',
    department: 'Engineering', designation: 'QA Engineer', phone: '9876500004',
    salary: 50000, manager: manager._id,
  });

  await Announcement.create([
    {
      title: 'Welcome to StaffSync',
      message: 'StaffSync is now live. Use it to apply for leaves, mark attendance and stay updated.',
      type: 'Announcement', postedBy: hr._id,
    },
    {
      title: 'Diwali holidays',
      message: 'The office will remain closed from 1st to 3rd November for Diwali. Happy Diwali!',
      type: 'News', postedBy: hr._id,
    },
  ]);

  await Leave.create([
    {
      employee: emp1._id, leaveType: 'Casual', fromDate: day(3), toDate: day(4), days: 2,
      reason: 'Family function',
    },
    {
      employee: emp2._id, leaveType: 'Sick', fromDate: day(-5), toDate: day(-4), days: 2,
      reason: 'Fever', status: 'Approved', reviewedBy: manager._id, reviewedAt: day(-6),
      reviewComment: 'Take rest, get well soon',
    },
  ]);

  const checkIn = new Date();
  checkIn.setHours(9, 30, 0, 0);
  await Attendance.create({ employee: emp2._id, date: toDateString(), checkIn });

  await Training.create({
    title: 'React Advanced Patterns', description: 'Hooks, performance and testing best practices.',
    trainer: 'Neha Gupta', mode: 'Online', startDate: day(7), endDate: day(9),
    assignedTo: [emp1._id, emp2._id], createdBy: manager._id,
  });

  console.log('Seed complete. Demo logins:');
  console.log('  HR        hr@staffsync.com        / hr12345');
  console.log('  Manager   manager@staffsync.com   / manager123');
  console.log('  Employee  employee@staffsync.com  / employee123');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
