const fs = require('fs');
let content = fs.readFileSync('src/components/EHIApp.tsx', 'utf8');

const importStr = `import { AirlineLogoManager } from './views/AirlineLogoManager';\n`;
if (!content.includes('AirlineLogoManager')) {
  content = content.replace("import { CreditDebit as CreditDebitRaw } from './views/CreditDebit';", "import { CreditDebit as CreditDebitRaw } from './views/CreditDebit';\n" + importStr);
}

const tabStr = `{currentTab === 'AirlineLogos' && <AirlineLogoManager user={user} onBack={() => setCurrentTab('More')} />}\n              {currentTab === 'More' && (`;
content = content.replace(`{currentTab === 'More' && (`, tabStr);

fs.writeFileSync('src/components/EHIApp.tsx', content);
