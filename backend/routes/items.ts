import { Express } from 'express';
import { db } from '../helpers/db';
import { dynamicOrder } from '../globals/globals';

type Item = {
  id: number;
  name: string;
  orderNum: number;
};

const registerItems = (app: Express) => {
  app.get('/items', async (req, res) => {
    try {
      const { offset = '0', limit = '20', search = '' } = req.query;
      const off = parseInt(offset as string, 10);
      const lim = parseInt(limit as string, 10);
      const searchStr = `%${search}%`;

      let orderCase = '';
      if (dynamicOrder.size > 0) {
        orderCase =
          'CASE id ' +
          Array.from(dynamicOrder.entries())
            .map(([id, order]) => `WHEN ${id} THEN ${order}`)
            .join(' ') +
          ' ELSE id END';
      } else {
        orderCase = 'id';
      }

      const rows = await db.all<{ id: number; name: string }[]>(
        `SELECT id, name
         FROM items
         WHERE name LIKE ?
         ORDER BY ${orderCase}
         LIMIT ? OFFSET ?`,
        [searchStr, lim, off]
      );

      if (dynamicOrder.size === 0) {
        rows.forEach((row, index) => {
          dynamicOrder.set(row.id, off + index + 1);
        });
      }

      const items: Item[] = rows.map((row) => ({
        ...row,
        orderNum: dynamicOrder.get(row.id) ?? row.id,
      }));

      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
};

export default registerItems;
