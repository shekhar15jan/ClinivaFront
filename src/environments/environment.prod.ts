// Production: the app is served from hms.codeatcloud.com (Hostinger) and the API from the k3s VPS.
// The production workflow replaces this address with the PROD_API_URL repository variable when it is set.
export const environment = {
  production: true,
  apiUrl: 'https://api.codeatcloud.com/cliniva/api/v1',
  enableMock: false
};
