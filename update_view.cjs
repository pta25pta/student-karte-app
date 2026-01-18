const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/StudentDetailView.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('import { StudentService }')) {
    content = content.replace(
        'import { ExternalDataService }',
        'import { StudentService } from \'../services/StudentService\';\nimport { ExternalDataService }'
    );
}

// 2. Modify handleUpdate
const handleUpdateRegex = /const handleUpdate = \(field, value\) => \{[\s\S]*?student\[field\] = value;\s*?\};/m;
const newHandleUpdate = `const handleUpdate = async (field, value) => {
    const updated = { ...localStudent, [field]: value };
    setLocalStudent(updated);
    // Optimistic update
    student[field] = value;
    
    // API Call
    try {
      await StudentService.updateStudent(updated);
      if (onNotify) onNotify('•Û‘¶‚µ‚Ü‚µ‚½', 'success');
    } catch (err) {
      console.error('Failed to save update', err);
      if (onNotify) onNotify('•Û‘¶‚ÉŽ¸”s‚µ‚Ü‚µ‚½', 'error');
    }
  };`;

content = content.replace(handleUpdateRegex, newHandleUpdate);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated StudentDetailView.jsx');
