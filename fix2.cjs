const fs = require('fs');
const path = require('path');

const dir = 'src/components/views/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));
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
