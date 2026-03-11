import express from 'express';
import { db, DEFAULT_USER_ID } from '../db';

const router = express.Router();

router.get('/monthly', (req: any, res) => {
  const { month, year } = req.query;

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  const logs = db.prepare(`
    SELECT l.status, count(*) as count
    FROM logs l
    JOIN medicines m ON l.medicine_id = m.id
    WHERE m.user_id = ? AND l.scheduled_time BETWEEN ? AND ?
    GROUP BY l.status
  `).all(DEFAULT_USER_ID, startDate, endDate);

  res.json(logs);
});

export default router;
