const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/views/*.tsx');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let newC = c.replace(/bg-\[#111827\]/g, 'bg-[var(--color-surface-card)]')
              .replace(/rgba\(255,255,255,0\.05\)/g, 'var(--color-border)')
              .replace(/rgba\(255,255,255,0\.1\)/g, 'var(--color-surface-2)')
              .replace(/rgba\(255,255,255,0\.03\)/g, 'var(--color-border)')
              .replace(/rgba\(255,255,255,0\.2\)/g, 'var(--color-muted)');
  if (c !== newC) {
    fs.writeFileSync(f, newC);
    console.log('Fixed', f);
  }
});
