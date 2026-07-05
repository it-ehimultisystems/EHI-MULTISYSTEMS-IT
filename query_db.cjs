const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');
console.log(content.match(/can_[a-z_]+/g));
