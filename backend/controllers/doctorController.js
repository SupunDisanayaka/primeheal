const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// @route   GET /api/doctors
// @desc    Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const query = `
      SELECT u.userID as _id, u.name, u.email, u.profileImage as image,
             d.doctorID, d.specialization as speciality, d.licenseNumber, d.qualifications as degree, 
             d.bio as about, d.consultationFee as fees, d.averageRating, d.totalPatients, d.isAvailable as available,
             d.experience, d.addressLine1, d.addressLine2
      FROM doctor d
      JOIN users u ON d.userID = u.userID
      WHERE u.isActive = 1
    `;
    const [doctors] = await pool.query(query);
    
    const formattedDoctors = doctors.map(doc => ({
      ...doc,
      experience: doc.experience || "5 Years",
      address: {
        line1: doc.addressLine1 || "PrimeHeal Specialist Center",
        line2: doc.addressLine2 || "Colombo 03, Sri Lanka"
      }
    }));

    res.json({ success: true, doctors: formattedDoctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID (using userID as it maps to _id in frontend)
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.userID as _id, u.name, u.email, u.profileImage as image,
             d.doctorID, d.specialization as speciality, d.licenseNumber, d.qualifications as degree, 
             d.bio as about, d.consultationFee as fees, d.averageRating, d.totalPatients, d.isAvailable as available,
             d.experience, d.addressLine1, d.addressLine2
      FROM doctor d
      JOIN users u ON d.userID = u.userID
      WHERE u.userID = ? AND u.isActive = 1
    `;
    const [doctors] = await pool.query(query, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doc = doctors[0];
    const formattedDoc = {
      ...doc,
      experience: doc.experience || "5 Years",
      address: {
        line1: doc.addressLine1 || "PrimeHeal Specialist Center",
        line2: doc.addressLine2 || "Colombo 03, Sri Lanka"
      }
    };

    res.json({ success: true, doctor: formattedDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   POST /api/doctors
// @desc    Add a new doctor (Admin only)
const addDoctor = async (req, res) => {
  const { name, email, password, speciality, degree, experience, fees, about, address1, address2, image } = req.body;

  if (!name || !email || !password || !speciality || !degree || !fees || !about) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if user exists
    const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, password, userType, profileImage, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'doctor', image || null, 1]
    );
    
    const userId = userResult.insertId;
    const licenseNumber = `SLMC-${String(userId).padStart(5, '0')}`;

    // Insert doctor
    await connection.query(
      'INSERT INTO doctor (userID, specialization, licenseNumber, qualifications, bio, consultationFee) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, speciality, licenseNumber, degree, about, fees]
    );

    // We could store experience and address in the bio as JSON, or ignore for now since they are not in schema.
    
    await connection.commit();

    res.status(201).json({ success: true, message: 'Doctor added successfully' });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// @route   PUT /api/doctors/:id
// @desc    Update doctor profile
const updateDoctor = async (req, res) => {
  const { id } = req.params; // userID
  const { fees, about, available, address, name, email } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE userID = ? AND userType = "doctor"', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const updates = {};
    if (fees !== undefined) updates.consultationFee = fees;
    if (about !== undefined) updates.bio = about;
    if (available !== undefined) updates.isAvailable = available ? 1 : 0;

    if (Object.keys(updates).length > 0) {
      const setString = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      await pool.query(`UPDATE doctor SET ${setString} WHERE userID = ?`, [...values, id]);
    }

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;

    if (Object.keys(userUpdates).length > 0) {
      const setString = Object.keys(userUpdates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(userUpdates);
      await pool.query(`UPDATE users SET ${setString} WHERE userID = ?`, [...values, id]);
    }

    res.json({ success: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @route   PUT /api/doctors/:id/availability
// @desc    Toggle doctor availability
const toggleAvailability = async (req, res) => {
  const { id } = req.params; // userID

  try {
    const [doctors] = await pool.query('SELECT isAvailable FROM doctor WHERE userID = ?', [id]);
    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const currentStatus = doctors[0].isAvailable;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await pool.query('UPDATE doctor SET isAvailable = ? WHERE userID = ?', [newStatus, id]);

    res.json({ success: true, message: 'Availability updated', available: newStatus === 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = String(timeStr).trim().split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const suffixParts = String(timeStr).trim().match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?$/i);
    if (suffixParts && suffixParts[4]) {
      const ampm = suffixParts[4].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  }
  return null;
};

// @route   GET /api/doctors/:id/slots
// @desc    Get weekly slot availability based on database doctoravailability and bookings
const getDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params; // userID of doctor
    const [docs] = await pool.query('SELECT doctorID FROM doctor WHERE userID = ?', [id]);
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const doctorID = docs[0].doctorID;

    // Generate dates for next 7 days starting today
    const slotsByDate = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      const dayName = weekdays[date.getDay()];

      // Get availability for this date
      const [availabilities] = await pool.query(
        `SELECT * FROM doctoravailability 
         WHERE doctorID = ? AND isActive = 1 AND (
           (specificDate = ?) OR 
           (dayOfWeek = ? AND specificDate IS NULL)
         )`,
        [doctorID, formattedDate, dayName]
      );

      // Get existing appointments for this date
      const [appointments] = await pool.query(
        `SELECT appointmentTime FROM appointments 
         WHERE doctorID = ? AND appointmentDate = ? AND status NOT IN ('Cancelled', 'Expired')`,
        [doctorID, formattedDate]
      );
      const bookedTimes = appointments.map(a => a.appointmentTime.trim().toUpperCase());

      const slots = [];
      for (const avail of availabilities) {
        const slotDuration = avail.slotDuration || 30;
        const startMin = timeToMinutes(avail.startTime);
        const endMin = timeToMinutes(avail.endTime);

        if (startMin === null || endMin === null) continue;

        for (let min = startMin; min + slotDuration <= endMin; min += slotDuration) {
          const hh = Math.floor(min / 60);
          const mm = min % 60;
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const displayH = hh % 12 === 0 ? 12 : hh % 12;
          const displayM = String(mm).padStart(2, '0');
          const timeStr = `${displayH}:${displayM} ${ampm}`;

          slots.push({
            time: timeStr,
            available: !bookedTimes.includes(timeStr.toUpperCase())
          });
        }
      }

      slotsByDate.push({
        date: formattedDate,
        dayName,
        slots
      });
    }

    res.json({ success: true, slotsByDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  addDoctor,
  updateDoctor,
  toggleAvailability,
  getDoctorSlots,
  timeToMinutes
};
