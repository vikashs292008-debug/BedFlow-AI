// backend/config/db.js
const mongoose = require('mongoose');

async function seedInitialDataIfNeeded() {
  try {
    const Bed = require('../models/Bed');
    const User = require('../models/User');
    const Hospital = require('../models/Hospital');
    const bcrypt = require('bcryptjs');

    const bedCount = await Bed.countDocuments();
    if (bedCount === 0) {
      console.log('🌱 Seeding initial beds data...');
      const beds = [];
      // ICU beds
      ['A', 'B'].forEach(row => {
        for (let i = 1; i <= 12; i++) {
          beds.push({ bedId: `i${row}${i}`, ward: 'ICU', status: 'available' });
        }
      });
      // General Ward beds
      ['A', 'B', 'C', 'D'].forEach(row => {
        for (let i = 1; i <= 21; i++) {
          beds.push({ bedId: `${row}${i}`, ward: 'General', status: 'available' });
        }
      });
      // Emergency beds
      ['E', 'F', 'G', 'H'].forEach(row => {
        for (let i = 1; i <= 21; i++) {
          beds.push({ bedId: `${row}${i}`, ward: 'Emergency', status: 'available' });
        }
      });
      await Bed.insertMany(beds);
      console.log(`✅ Seeded ${beds.length} beds.`);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding default users...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const managerPassword = await bcrypt.hash('manager123', salt);
      const staffPassword = await bcrypt.hash('staff123', salt);
      const erPassword = await bcrypt.hash('er123', salt);

      const defaultUsers = [
        {
          name: 'Admin User',
          email: 'admin@hospital.com',
          password: hashedPassword,
          role: 'technical_team',
          department: 'IT',
        },
        {
          name: 'Dr. Sarah Chen',
          email: 'sarah.chen@hospital.com',
          password: hashedPassword,
          role: 'hospital_admin',
          department: 'Administration',
        },
        {
          name: 'Anuradha Patel',
          email: 'anuradha@hospital.com',
          password: managerPassword,
          role: 'manager',
          ward: 'ICU',
          assignedWards: ['ICU', 'Cardiology'],
        },
        {
          name: 'ICU Staff 1',
          email: 'staff.icu1@hospital.com',
          password: staffPassword,
          role: 'ward_staff',
          ward: 'ICU',
        },
        {
          name: 'General Staff 1',
          email: 'staff.general1@hospital.com',
          password: staffPassword,
          role: 'ward_staff',
          ward: 'General',
        },
        {
          name: 'ER Staff 1',
          email: 'er.staff1@hospital.com',
          password: erPassword,
          role: 'er_staff',
          ward: 'Emergency',
        }
      ];
      await User.insertMany(defaultUsers);
      console.log(`✅ Seeded ${defaultUsers.length} default users.`);
    }

    const hospitalCount = await Hospital.countDocuments();
    if (hospitalCount === 0) {
      console.log('🌱 Seeding default hospitals...');
      const defaultHospitals = [
        {
          name: 'Apollo Hospitals',
          address: 'Sarita Vihar, Delhi-Mathura Road, New Delhi',
          location: { latitude: 28.5355, longitude: 77.2808 },
          distance: 2.5,
          contactNumber: '+91-11-2692-5858',
          emergencyContact: '+91-11-2692-5801',
          rating: 4.5,
          wards: [
            { wardType: 'ICU', totalBeds: 30, availableBeds: 5, occupiedBeds: 25 },
            { wardType: 'Emergency', totalBeds: 20, availableBeds: 8, occupiedBeds: 12 },
            { wardType: 'General', totalBeds: 100, availableBeds: 15, occupiedBeds: 85 }
          ],
          isActive: true
        },
        {
          name: 'Fortis Hospital',
          address: 'Sector 62, Noida, Uttar Pradesh',
          location: { latitude: 28.6139, longitude: 77.3589 },
          distance: 5.2,
          contactNumber: '+91-120-247-2222',
          emergencyContact: '+91-120-247-2200',
          rating: 4.3,
          wards: [
            { wardType: 'ICU', totalBeds: 25, availableBeds: 3, occupiedBeds: 22 },
            { wardType: 'Emergency', totalBeds: 15, availableBeds: 5, occupiedBeds: 10 },
            { wardType: 'General', totalBeds: 80, availableBeds: 20, occupiedBeds: 60 }
          ],
          isActive: true
        }
      ];
      await Hospital.insertMany(defaultHospitals);
      console.log(`✅ Seeded ${defaultHospitals.length} hospitals.`);
    }
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
}

async function connectDB() {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bedmanager';

  try {
    console.log(`🔄 Attempting to connect to MongoDB at ${uri}...`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log('✅ MongoDB connected successfully!');
    await seedInitialDataIfNeeded();
    return mongoose;
  } catch (err) {
    console.warn('⚠️ Local MongoDB connection failed or timed out:', err.message);
    console.log('⚡ Fallback: Starting In-Memory MongoDB Server...');

    try {
      const path = require('path');
      const fs = require('fs');
      const { MongoMemoryServer } = require('mongodb-memory-server');

      const dataDir = path.join(__dirname, '../data/db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dataDir,
          storageEngine: 'wiredTiger'
        }
      });
      uri = mongoServer.getUri();
      console.log(`🔄 Connecting to Persistent Local Database at ${uri} (Storage: ./backend/data/db)...`);
      await mongoose.connect(uri);
      console.log('✅ Connected to Persistent Local Database successfully!');
      await seedInitialDataIfNeeded();
      return mongoose;
    } catch (memErr) {
      console.error('❌ Persistent DB creation error, fallback to memory-only:', memErr.message);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
        await mongoose.connect(uri);
        console.log('✅ Connected to In-Memory MongoDB fallback successfully!');
        await seedInitialDataIfNeeded();
        return mongoose;
      } catch (err2) {
        console.error('❌ Failed to start database server:', err2.message);
        return null;
      }
    }
  }
}

module.exports = connectDB;