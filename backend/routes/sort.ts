import { Express } from 'express';
import { dynamicOrder } from '../globals/globals';

type ItemOrder = { id: number; orderNum: number };

const registerSort = (app: Express) => {
  app.post('/sort', (req, res) => {
    const { order } = req.body as { order?: ItemOrder[] };
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Expected order array' });
    }

    const sortedOrder = [...order].sort((a, b) => a.orderNum - b.orderNum);

    for (let i = 0; i < sortedOrder.length; i++) {
      const { id, orderNum } = sortedOrder[i];
      dynamicOrder.set(id, orderNum);
    }

    const allIds = Array.from(dynamicOrder.keys())
      .map((id) => ({ id, orderNum: dynamicOrder.get(id)! }))
      .sort((a, b) => a.orderNum - b.orderNum);

    let counter = 1;
    for (const item of allIds) {
      dynamicOrder.set(item.id, counter++);
    }

    res.json({ ok: true });
  });

  app.post('/sort/reset', (_req, res) => {
    dynamicOrder.clear();
    res.status(200).json({ ok: true });
  });
};

export default registerSort;
