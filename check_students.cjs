const { getDoc } = require('./server/config/google-sheets');
(async () => {
    try {
        console.log('Testing sheet access...');
        const doc = await getDoc();
        console.log('Connected to sheet:', doc.title);
        const sheet = doc.sheetsByTitle['students'];
        if (!sheet) {
            console.log('Error: Sheet "students" NOT FOUND');
            return;
        }
        const rows = await sheet.getRows();
        console.log('Sheet "students" found. Row count:', rows.length);
        if (rows.length > 0) {
            console.log('Sample Row 1 - ID:', rows[0].get('id'), 'Name:', rows[0].get('name'));
            console.log('Headers:', sheet.headerValues);
        }
    } catch (e) {
        console.error('Error during verification:', e);
    }
})();
