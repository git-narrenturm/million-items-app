import { Express } from 'express';
import { db } from '../helpers/db';

import { selectedItems, sortOrder } from '../globals/globals';

const registerRoutes = (app: Express) => {
  app.get('/items', async (req, res) => {
    const { search = '', offset = '0', limit = '20' } = req.query;
    const searchStr = `%${search}%`;
    const off = parseInt(offset as string, 10);
    const lim = parseInt(limit as string, 10);

    const sortedPageIds = sortOrder.slice(off, off + lim);

    try {
      let pageItems: number[] = [];

      if (sortedPageIds.length > 0) {

        const placeholders = sortedPageIds.map(() => '?').join(',');
        const caseExpr = sortedPageIds
          .map((id, i) => `WHEN ${id} THEN ${i}`)
          .join(' ');

        const sqlSorted = `
          SELECT * FROM items
          WHERE name LIKE ? AND id IN (${placeholders})
          ORDER BY CASE id ${caseExpr} END
        `;
        pageItems = await db.all(sqlSorted, [searchStr, ...sortedPageIds]);
      }

      if (pageItems.length < lim) {
        const rem = lim - pageItems.length;
        const servedIds = sortedPageIds;
        const skipCount = Math.max(0, off - sortOrder.length);

        const notInPlaceholders = servedIds.map(() => '?').join(',');
        const sqlFallback = `
          SELECT * FROM items
          WHERE name LIKE ?
            ${servedIds.length ? `AND id NOT IN (${notInPlaceholders})` : ''}
          ORDER BY id
          LIMIT ? OFFSET ?
        `;
        const params = [
          searchStr,
          ...servedIds,
          rem,
          skipCount
        ].filter((v) => v !== undefined);

        const fallback = await db.all(sqlFallback, params);
        pageItems = pageItems.concat(fallback);
      }

      res.json(pageItems);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/state', (req, res) => {
    res.json({ selected: Array.from(selectedItems), sorted: sortOrder });
  });

  app.post('/select', (req, res) => {
    const { selected } = req.body;
    if (Array.isArray(selected)) {
      selectedItems.clear();
      selected.forEach(id => selectedItems.add(id));
      res.status(200).json({ ok: true });
    } else {
      res.status(400).json({ error: 'Invalid payload. Expected to be an array.' });
    }
  });

  app.post('/sort', (req, res) => {
    const { order } = req.body;
    if (Array.isArray(order)) {
      sortOrder.length = 0;
      sortOrder.push(...order);
      res.json({ ok: true });
    }
    else {
      res.status(400).json({ error: 'Invalid payload. Expected to be an array.' });
    }
  });
};

export default registerRoutes;
