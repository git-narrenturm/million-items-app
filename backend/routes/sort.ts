import { Express } from 'express';
import { dynamicOrder } from '../globals/globals';

type ItemOrder = { id: number; orderNum: number };

const registerSort = (app: Express) => {
  app.post('/sort', (req, res) => {
    const { order, movedId } = req.body as { order?: ItemOrder[]; movedId?: number };
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Expected order array' });
    }

    for (const { id, orderNum } of order) {
      dynamicOrder.set(id, orderNum);
    }

    if (movedId !== undefined) {
      const movedOrderNum = dynamicOrder.get(movedId);
      if (movedOrderNum !== undefined) {
        for (const [id, num] of dynamicOrder.entries()) {
          if (id !== movedId && num >= movedOrderNum) {
            dynamicOrder.set(id, num + 1);
          }
        }
      }
    }

    const allItems = Array.from(dynamicOrder.entries())
      .map(([id, orderNum]) => ({ id, orderNum }))
      .sort((a, b) => a.orderNum - b.orderNum);

    let counter = 1;
    for (const item of allItems) {
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
