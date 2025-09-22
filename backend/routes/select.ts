import { Express } from 'express';
import { selectedItems } from '../globals/globals';

const registerSelect = (app: Express) => {
  app.post('/select', (req, res) => {
    const { selected } = req.body;
    if (!Array.isArray(selected)) {
      return res.status(400).json({ error: 'Expected array' });
    }

    selectedItems.clear();
    selected.forEach((id) => selectedItems.add(id));

    res.json({ ok: true });
  });

   app.post('/select/reset', (_req, res) => {
    selectedItems.clear();
    res.status(200).json({ ok: true });
  });

  app.get('/state', (req, res) => {
    res.json({ selected: Array.from(selectedItems) });
  });
};

export default registerSelect;
