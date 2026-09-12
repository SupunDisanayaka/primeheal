const { getPool } = require('../config/db');

/**
 * 1. submitComplaint
 * Allows patients (or users) to submit a formal complaint.
 * Status starts at 'open'.
 */
const submitComplaint = async (req, res) => {
  const { complaintType, description } = req.body;
  const userID = req.user?.userID || req.user?.id;

  if (!userID) {
    return res.status(401).json({ success: false, message: 'Authentication required to submit complaint' });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ success: false, message: 'Complaint description is required' });
  }

  const validTypes = ['service', 'billing', 'technical', 'staff', 'other'];
  const type = validTypes.includes(complaintType) ? complaintType : 'other';

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      `INSERT INTO complaint (userID, complaintType, description, status, createdAt)
       VALUES (?, ?, ?, 'open', NOW())`,
      [userID, type, description.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Our hospital administration will review it.',
      complaintID: result.insertId,
      status: 'open'
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    return res.status(500).json({ success: false, message: 'Server error while submitting complaint', error: error.message });
  }
};

/**
 * 2. getMyComplaints
 * Allows a patient to view their complaints and track live resolution status.
 */
const getMyComplaints = async (req, res) => {
  const userID = req.user?.userID || req.user?.id;

  if (!userID) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT 
        c.complaintID,
        c.complaintType,
        c.description,
        c.status,
        c.resolution,
        c.createdAt,
        c.resolvedAt
       FROM complaint c
       WHERE c.userID = ?
       ORDER BY c.createdAt DESC`,
      [userID]
    );

    return res.json({
      success: true,
      complaints: rows
    });
  } catch (error) {
    console.error('Error fetching patient complaints:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching complaints', error: error.message });
  }
};

/**
 * 3. getAllComplaintsAdmin
 * For Administrators to monitor all complaints across the system, with filters.
 */
const getAllComplaintsAdmin = async (req, res) => {
  try {
    const pool = await getPool();
    const { status, type } = req.query;

    let query = `
      SELECT 
        c.complaintID,
        c.userID,
        u.name AS patientName,
        u.email AS patientEmail,
        u.phone AS patientPhone,
        c.complaintType,
        c.description,
        c.status,
        c.assignedToAdminID,
        adminUser.name AS assignedStaffName,
        c.resolution,
        c.createdAt,
        c.resolvedAt
      FROM complaint c
      JOIN users u ON c.userID = u.userID
      LEFT JOIN admin a ON c.assignedToAdminID = a.adminID
      LEFT JOIN users adminUser ON a.userID = adminUser.userID
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (type && type !== 'all') {
      query += ' AND c.complaintType = ?';
      params.push(type);
    }

    query += ' ORDER BY c.createdAt DESC';

    const [rows] = await pool.query(query, params);

    // Also get list of available staff/admins for assignment dropdown
    const [adminList] = await pool.query(
      `SELECT a.adminID, u.name, u.email 
       FROM admin a 
       JOIN users u ON a.userID = u.userID 
       WHERE u.isActive = 1`
    );

    return res.json({
      success: true,
      complaints: rows,
      admins: adminList
    });
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching complaints', error: error.message });
  }
};

/**
 * 4. updateComplaintStatus
 * Allows Admin to assign staff, change status ('open', 'in-progress', 'resolved', 'closed'),
 * and record resolution details.
 */
const updateComplaintStatus = async (req, res) => {
  const { complaintId } = req.params;
  const { status, assignedToAdminID, resolution } = req.body;

  if (!complaintId) {
    return res.status(400).json({ success: false, message: 'Complaint ID is required' });
  }

  const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const pool = await getPool();

    // Check existing
    const [existing] = await pool.query('SELECT * FROM complaint WHERE complaintID = ?', [complaintId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const current = existing[0];
    const newStatus = status || current.status;
    const newAssigned = assignedToAdminID !== undefined ? (assignedToAdminID ? Number(assignedToAdminID) : null) : current.assignedToAdminID;
    const newResolution = resolution !== undefined ? resolution : current.resolution;

    // Set resolvedAt timestamp if marking resolved
    let resolvedAt = current.resolvedAt;
    if (newStatus === 'resolved' && current.status !== 'resolved') {
      resolvedAt = new Date();
    } else if (newStatus !== 'resolved' && current.status === 'resolved') {
      resolvedAt = null;
    }

    await pool.query(
      `UPDATE complaint
       SET status = ?, assignedToAdminID = ?, resolution = ?, resolvedAt = ?
       WHERE complaintID = ?`,
      [newStatus, newAssigned, newResolution, resolvedAt, complaintId]
    );

    return res.json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: {
        complaintID: Number(complaintId),
        status: newStatus,
        assignedToAdminID: newAssigned,
        resolution: newResolution,
        resolvedAt
      }
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return res.status(500).json({ success: false, message: 'Server error updating complaint', error: error.message });
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getAllComplaintsAdmin,
  updateComplaintStatus
};
