import { Express } from 'express';
import registerItems from '../routes/items';
import registerSort from '../routes/sort';
import registerSelect from '../routes/select';

const registerRoutes = (app: Express) => {
  registerItems(app);
  registerSort(app);
  registerSelect(app);
};

export default registerRoutes;
