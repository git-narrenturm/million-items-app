import express from 'express';
import cors from 'cors';

import initializeDatabase from './helpers/db';
import registerRoutes from './srv/service';

initializeDatabase();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

registerRoutes(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
