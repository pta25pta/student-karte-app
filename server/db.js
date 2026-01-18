const fs = require('fs');
const path = require('path');

class Database {
  constructor(filename) {
    this.filename = filename;
    this.data = { students: [] };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filename)) {
        const raw = fs.readFileSync(this.filename, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save(); // Initialize file if not exists
      }
    } catch (err) {
      console.error('Error loading database:', err);
      this.data = { students: [] };
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Generic CRUD Operations

  findAll(collection) {
    return this.data[collection] || [];
  }

  findById(collection, id) {
    const list = this.data[collection] || [];
    return list.find(item => item.id === id);
  }

  create(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    this.data[collection].push(item);
    this.save();
    return item;
  }

  update(collection, id, updates) {
    if (!this.data[collection]) return null;
    
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;

    // Merge updates
    this.data[collection][index] = { ...this.data[collection][index], ...updates };
    this.save();
    return this.data[collection][index];
  }

  delete(collection, id) {
    if (!this.data[collection]) return false;

    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    
    if (this.data[collection].length !== initialLength) {
      this.save();
      return true;
    }
    return false;
  }
}

module.exports = Database;
