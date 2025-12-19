// Copy this file to environment.ts and environment.prod.ts
// Fill in your Baserow credentials

export const environment = {
  production: false,
  baserow: {
    apiUrl: 'https://your-baserow-instance.com/api', // Base API URL only
    token: 'YOUR_BASEROW_API_TOKEN',
    databaseId: 1,
    tables: {
      nfcTags: 1, // Table ID for NFC Tags
      locations: 2, // Table ID for Storage Locations
      items: 3, // Table ID for Inventory Items
      scanEvents: 4, // Table ID for Scan Events
      users: 5, // Table ID for Users
    },
  },
};
