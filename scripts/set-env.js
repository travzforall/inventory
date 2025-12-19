const fs = require('fs');
const path = require('path');

// Read environment variables from Netlify
const envConfig = `export const environment = {
  production: ${process.env.PRODUCTION || 'true'},
  baserow: {
    apiUrl: '${process.env.BASEROW_API_URL || ''}',
    token: '${process.env.BASEROW_TOKEN || ''}',
    databaseId: ${process.env.BASEROW_DATABASE_ID || '1'},
    tables: {
      nfcTags: ${process.env.BASEROW_TABLE_NFC_TAGS || '1'},
      locations: ${process.env.BASEROW_TABLE_LOCATIONS || '2'},
      items: ${process.env.BASEROW_TABLE_ITEMS || '3'},
      scanEvents: ${process.env.BASEROW_TABLE_SCAN_EVENTS || '4'},
      users: ${process.env.BASEROW_TABLE_USERS || '5'},
    },
  },
};
`;

const envDir = path.join(__dirname, '..', 'src', 'environments');

// Ensure directory exists
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Write environment files
fs.writeFileSync(path.join(envDir, 'environment.ts'), envConfig);
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), envConfig.replace('production: false', 'production: true'));

console.log('Environment files generated successfully');
