export const environment = {
  production: false,
  baserow: {
    apiUrl: 'https://db.jollycares.com/api', // Base API URL only
    token: 'N7OzGYtyscWg1D9mmokf3k149JZB2diH',
    databaseId: 130,
    tables: {
      nfcTags: 576,
      locations: 575,
      items: 574,
      scanEvents: 577,
      users: 579,
      servers: 580, // TODO: Update with actual table ID after creating in Baserow
      software: 581, // TODO: Update with actual table ID after creating in Baserow
    },
  },
};
