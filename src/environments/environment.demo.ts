// Public demo round: static build served from the product's Hostinger address (base href /).
// The API is reached through the Tailscale Funnel edge; the backend CORS allows the demo origins.
export const environment = {
  production: true,
  apiUrl: 'https://code-at-cloud.tailef5a29.ts.net:10000/cliniva/api/v1',
  enableMock: false
};
