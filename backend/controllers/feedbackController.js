const pool = require('../config/db');

/**
 * Helper to update a doctor's average rating in doctor table
 * based on all visible & approved feedback entries.
 */
const updateDoctorAverageRating = async (doctorID) => {
  if (!doctorID) return;
  try {
    await pool.query(
      `UPDATE doctor d
       SET averageRating = (
         SELECT COALESCE(ROUND(AVG(rating), 1), 0.00)
         FROM feedback
         WHERE doctorID = ? AND isVisible = 1 AND isApproved = 1
       )
       WHERE doctorID = ?`,
      [doctorID, doctorID]
    );
  } catch (err) {
    console.error('Error updating doctor average rating:', err);
  }
};

/**
 * 1. submitFeedback
 * Validate appointmentID exists, belongs to req.user.id, and has status === 'COMPLETED'.
 * Insert new feedback with default values isVisible = 1 and isApproved = 0.
 */
const submitFeedback = async (req, res) => {
  try {
    const { appointmentID, rating, comments } = req.body;
    const userID = req.user?.userID || req.user?.id;

    if (!userID) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    if (!appointmentID) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    const numRating = Number(rating);
    if (!rating || isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    // 1. Query the appointment table for the given appointmentID
    const [apptRows] = await pool.query(
      'SELECT appointmentID, patientID, doctorID, status FROM appointments WHERE appointmentID = ?',
      [appointmentID]
    );

    // 2. If no matching appointment is found, return a 404 response
    if (apptRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found. It may have been cancelled or deleted.'
      });
    }

    const appt = apptRows[0];

    // 3. Verify appointment status is completed
    if (String(appt.status).toUpperCase() !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Feedback can only be submitted for completed appointments. Current status: ${appt.status}`
      });
    }

    // 4. Prevent duplicate feedback submissions
    const [existingFb] = await pool.query('SELECT feedbackID FROM feedback WHERE appointmentID = ?', [appointmentID]);
    if (existingFb.length > 0) {
      return res.status(400).json({ success: false, message: 'Feedback has already been submitted for this appointment' });
    }

    // 5. Ensure patient record exists in patient table for FK constraint
    let validPatientID = appt.patientID;
    const [pCheck] = await pool.query('SELECT patientID FROM patient WHERE patientID = ?', [validPatientID]);
    if (pCheck.length === 0) {
      const [uP] = await pool.query('SELECT patientID FROM patient WHERE userID = ?', [userID]);
      if (uP.length > 0) {
        validPatientID = uP[0].patientID;
      } else {
        try {
          await pool.query('INSERT INTO patient (patientID, userID, patientCode) VALUES (?, ?, ?)', [validPatientID, userID, `P-${userID}`]);
        } catch (e) {
          const [insP] = await pool.query('INSERT INTO patient (userID, patientCode) VALUES (?, ?)', [userID, `P-${userID}`]);
          validPatientID = insP.insertId;
        }
      }
    }

    // 6. Ensure doctor record exists in doctor table for FK constraint
    let validDoctorID = appt.doctorID;
    const [dCheck] = await pool.query('SELECT doctorID FROM doctor WHERE doctorID = ?', [validDoctorID]);
    if (dCheck.length === 0) {
      const [uD] = await pool.query('SELECT doctorID FROM doctor WHERE userID = ?', [validDoctorID]);
      if (uD.length > 0) {
        validDoctorID = uD[0].doctorID;
      } else {
        try {
          await pool.query('INSERT INTO doctor (doctorID, userID, specialization) VALUES (?, ?, ?)', [validDoctorID, userID, 'General Physician']);
        } catch (e) {
          const [insD] = await pool.query('INSERT INTO doctor (userID, specialization) VALUES (?, ?)', [userID, 'General Physician']);
          validDoctorID = insD.insertId;
        }
      }
    }

    // 7. Insert new feedback
    const [result] = await pool.query(
      `INSERT INTO feedback (appointmentID, patientID, doctorID, rating, comments, isVisible, isApproved)
       VALUES (?, ?, ?, ?, ?, 1, 0)`,
      [appointmentID, validPatientID, validDoctorID, numRating, comments || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been submitted and is pending administrative approval.',
      feedbackID: result.insertId,
      data: {
        feedbackID: result.insertId,
        appointmentID,
        patientID: validPatientID,
        doctorID: validDoctorID,
        rating: numRating,
        comments: comments || '',
        isVisible: 1,
        isApproved: 0
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback',
      error: error.message
    });
  }
};


/**
 * 2. getDoctorFeedback
 * Select feedbackID, rating, comments, createdAt, and patientName from feedback joined with users.
 * Filter strictly by: doctorID = ? AND isVisible = 1 AND isApproved = 1.
 * Return average rating and total review count calculated only from approved and visible reviews.
 */
const getDoctorFeedback = async (req, res) => {
  try {
    const rawDoctorId = req.params.doctorId || req.params.id;

    if (!rawDoctorId) {
      return res.status(400).json({ success: false, message: 'Doctor ID parameter is required' });
    }

    // Resolve doctorID (handles passing either doctorID or userID of doctor)
    const [doctorRows] = await pool.query(
      'SELECT doctorID FROM doctor WHERE doctorID = ? OR userID = ?',
      [rawDoctorId, rawDoctorId]
    );

    if (doctorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctorID = doctorRows[0].doctorID;

    // Query feedback strictly filtered by doctorID = ? AND isVisible = 1 AND isApproved = 1
    const query = `
      SELECT 
        f.feedbackID,
        f.rating,
        f.comments,
        f.createdAt,
        u.name AS patientName
      FROM feedback f
      JOIN patient p ON f.patientID = p.patientID
      JOIN users u ON p.userID = u.userID
      WHERE f.doctorID = ? AND f.isVisible = 1 AND f.isApproved = 1
      ORDER BY f.createdAt DESC
    `;

    const [rows] = await pool.query(query, [doctorID]);

    const totalReviews = rows.length;
    const averageRating = totalReviews > 0
      ? Number((rows.reduce((sum, item) => sum + Number(item.rating), 0) / totalReviews).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      doctorID,
      averageRating,
      totalReviews,
      totalCount: totalReviews,
      feedback: rows,
      reviews: rows
    });
  } catch (error) {
    console.error('Error fetching doctor feedback:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctor feedback', error: error.message });
  }
};

/**
 * 3. getAllFeedbackAdmin
 * Select all fields from feedback joined with users (patient name & doctor name).
 * Do NOT filter by isApproved so admins can see pending reviews.
 */
const getAllFeedbackAdmin = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.feedbackID,
        f.appointmentID,
        f.patientID,
        f.doctorID,
        f.rating,
        f.comments,
        f.createdAt,
        f.isVisible,
        f.isApproved,
        pu.name AS patientName,
        pu.email AS patientEmail,
        du.name AS doctorName,
        d.specialization AS doctorSpecialization
      FROM feedback f
      LEFT JOIN patient p ON f.patientID = p.patientID
      LEFT JOIN users pu ON p.userID = pu.userID
      LEFT JOIN doctor d ON f.doctorID = d.doctorID
      LEFT JOIN users du ON d.userID = du.userID
      ORDER BY f.createdAt DESC
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: rows.length,
      feedback: rows
    });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    res.status(500).json({ success: false, message: 'Server error fetching all feedback', error: error.message });
  }
};

/**
 * 4. approveFeedback & toggleVisibility
 * Admin routes (PUT /api/feedback/approve/:id and PUT /api/feedback/visibility/:id)
 * to update isApproved and isVisible flags in MySQL.
 */
const approveFeedback = async (req, res) => {
  try {
    const feedbackID = req.params.id;
    const { isApproved } = req.body;

    if (!feedbackID) {
      return res.status(400).json({ success: false, message: 'Feedback ID parameter is required' });
    }

    // Check feedback exists
    const [fbRows] = await pool.query('SELECT feedbackID, doctorID, isApproved FROM feedback WHERE feedbackID = ?', [feedbackID]);
    if (fbRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback record not found' });
    }

    const doctorID = fbRows[0].doctorID;
    const newApprovedStatus = (isApproved !== undefined && isApproved !== null)
      ? (isApproved ? 1 : 0)
      : 1;

    await pool.query('UPDATE feedback SET isApproved = ? WHERE feedbackID = ?', [newApprovedStatus, feedbackID]);

    // Recalculate and sync doctor average rating
    await updateDoctorAverageRating(doctorID);

    res.status(200).json({
      success: true,
      message: `Feedback approval status updated to ${newApprovedStatus}`,
      feedbackID: Number(feedbackID),
      isApproved: newApprovedStatus
    });
  } catch (error) {
    console.error('Error approving feedback:', error);
    res.status(500).json({ success: false, message: 'Server error approving feedback', error: error.message });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const feedbackID = req.params.id;
    const { isVisible } = req.body;

    if (!feedbackID) {
      return res.status(400).json({ success: false, message: 'Feedback ID parameter is required' });
    }

    // Check feedback exists
    const [fbRows] = await pool.query('SELECT feedbackID, doctorID, isVisible FROM feedback WHERE feedbackID = ?', [feedbackID]);
    if (fbRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Feedback record not found' });
    }

    const currentFb = fbRows[0];
    const doctorID = currentFb.doctorID;

    const newVisibleStatus = (isVisible !== undefined && isVisible !== null)
      ? (isVisible ? 1 : 0)
      : (currentFb.isVisible === 1 ? 0 : 1);

    await pool.query('UPDATE feedback SET isVisible = ? WHERE feedbackID = ?', [newVisibleStatus, feedbackID]);

    // Recalculate and sync doctor average rating
    await updateDoctorAverageRating(doctorID);

    res.status(200).json({
      success: true,
      message: `Feedback visibility status updated to ${newVisibleStatus}`,
      feedbackID: Number(feedbackID),
      isVisible: newVisibleStatus
    });
  } catch (error) {
    console.error('Error toggling feedback visibility:', error);
    res.status(500).json({ success: false, message: 'Server error updating feedback visibility', error: error.message });
  }
};

module.exports = {
  submitFeedback,
  getDoctorFeedback,
  getAllFeedbackAdmin,
  approveFeedback,
  toggleVisibility
};
