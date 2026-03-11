import express from 'express';
import { db, DEFAULT_USER_ID } from '../db';

const router = express.Router();

// Get all medicines for the default user
router.get('/', (req: any, res) => {
  const medicines = db.prepare('SELECT * FROM medicines WHERE user_id = ?').all(DEFAULT_USER_ID);
  const medicinesWithSchedules = medicines.map((med: any) => {
    const schedules = db.prepare('SELECT time FROM schedules WHERE medicine_id = ?').all(med.id);
    return { ...med, schedules: schedules.map((s: any) => s.time) };
  });
  res.json(medicinesWithSchedules);
});

// Add medicine
router.post('/', (req: any, res) => {
  const { name, dosage, frequency, start_date, end_date, notes, schedules } = req.body;

  const insertMed = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO medicines (user_id, name, dosage, frequency, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(DEFAULT_USER_ID, name, dosage, frequency, start_date, end_date, notes);
    const medId = info.lastInsertRowid;

    const scheduleStmt = db.prepare('INSERT INTO schedules (medicine_id, time) VALUES (?, ?)');
    for (const time of schedules) {
      scheduleStmt.run(medId, time);
    }
    return medId;
  });

  try {
    const medId = insertMed();
    res.json({ id: medId, message: 'Medicine added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

// Delete medicine
router.delete('/:id', (req: any, res) => {
  const { id } = req.params;
  const med = db.prepare('SELECT user_id FROM medicines WHERE id = ?').get(id) as any;
  if (!med || med.user_id !== DEFAULT_USER_ID) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
  res.json({ message: 'Medicine deleted' });
});

export default router;
