// SQLite database initialization and management
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from '@/database/schema';

export class DatabaseManager {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('setlistfm.db');
      await this.createTables();
      this.initialized = true;
      console.warn('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.execAsync(CREATE_TABLES_SQL);
      await this.runMigrations();
      console.warn('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;
    // Add imageUrl to artists if missing (existing installs)
    const cols = await this.db.getAllAsync<{ name: string }>(`PRAGMA table_info(artists)`);
    const hasImageUrl = cols.some((c) => c.name === 'imageUrl');
    if (!hasImageUrl) {
      await this.db.execAsync(`ALTER TABLE artists ADD COLUMN imageUrl TEXT`);
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.warn('Database closed');
    }
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();
