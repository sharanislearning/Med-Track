import express from 'express';
import { db, DEFAULT_USER_ID } from '../db';

const router = express.Router();

// Get logs for a specific date range
router.get('/', (req: any, res) => {
  const { start_date, end_date } = req.query;
  const logs = db.prepare(`
    SELECT l.*, m.name as medicine_name 
    FROM logs l
    JOIN medicines m ON l.medicine_id = m.id
    WHERE m.user_id = ? AND l.scheduled_time BETWEEN ? AND ?
  `).all(DEFAULT_USER_ID, start_date, end_date);

  res.json(logs);
});

// Create or update a log entry (mark as taken/missed)
router.post('/', (req: any, res) => {
  const { medicine_id, scheduled_time, status, notes } = req.body;

  // Verify ownership
  const med = db.prepare('SELECT user_id FROM medicines WHERE id = ?').get(medicine_id) as any;
  if (!med || med.user_id !== DEFAULT_USER_ID) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const stmt = db.prepare(`
    INSERT INTO logs (medicine_id, scheduled_time, status, action_timestamp, notes)
    VALUES (?, ?, ?, datetime('now'), ?)
  `);

  try {
    stmt.run(medicine_id, scheduled_time, status, notes);
    res.json({ message: 'Log updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log action' });
  }
});

export default router;
