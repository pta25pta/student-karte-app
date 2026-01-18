const { getDoc } = require('./config/google-sheets');

class GoogleSheetsDatabase {
  constructor() {
    this.doc = null;
  }

  async init() {
    if (!this.doc) {
      this.doc = await getDoc();
    }
  }

  async getSheet(sheetTitle) {
    await this.init();
    let sheet = this.doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      sheet = await this.doc.addSheet({ title: sheetTitle, headerValues: ['id', 'data'] });
    }
    return sheet;
  }

  async findAll(collection) {
    const sheet = await this.getSheet(collection);
    const rows = await sheet.getRows();
    return rows.map(row => {
      try {
        const data = JSON.parse(row.get('data'));
        return { ...data, id: row.get('id') }; // Ensure ID matches
      } catch (e) {
        console.error('Failed to parse row data', e);
        return null;
      }
    }).filter(item => item !== null);
  }

  async findById(collection, id) {
    const items = await this.findAll(collection);
    return items.find(item => String(item.id) === String(id));
  }

  async create(collection, item) {
    const sheet = await this.getSheet(collection);
    const rowData = {
      id: String(item.id),
      data: JSON.stringify(item)
    };
    await sheet.addRow(rowData);
    return item;
  }

  async update(collection, id, updates) {
    const sheet = await this.getSheet(collection);
    const rows = await sheet.getRows();
    const row = rows.find(r => String(r.get('id')) === String(id));
    
    if (!row) return null;

    // Merge current data with updates
    const currentData = JSON.parse(row.get('data'));
    const newData = { ...currentData, ...updates };

    row.set('data', JSON.stringify(newData));
    await row.save();
    
    return newData;
  }

  async delete(collection, id) {
    const sheet = await this.getSheet(collection);
    const rows = await sheet.getRows();
    const row = rows.find(r => String(r.get('id')) === String(id));
    
    if (row) {
      await row.delete();
      return true;
    }
    return false;
  }
}

module.exports = GoogleSheetsDatabase;
