import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export let db: Database;

const initializeDatabase = async () => {
  const databasePath = './database/database.db';
  const databaseDir = path.dirname(databasePath);
 
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  try {
    const database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    db = database;

    await db.exec('CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)');

    const count = await db.get('SELECT COUNT(*) as count FROM items');

    if (count.count < 1000000) {
      console.log('Populating database...');

      await db.exec('DELETE FROM items');

      const insert = await db.prepare('INSERT INTO items (id, name) VALUES (?, ?)');

      await db.run('BEGIN TRANSACTION');
      for (let i = 1; i <= 1000000; i++) {
        await insert.run(i, `Item ${i}`);
      }
      await db.run('COMMIT');
      
      await insert.finalize();
      console.log('Complete');
    }
  } catch (error) {
    console.error('Error initializing the database:', error);
  }
};

export default initializeDatabase;
