export const environment = {
  production: false,
  ocrEndpoint: 'https://ocr.lightningbowl.de/api/server',
  bowwwlEndpoint: 'https://proxy.lightningbowl.de/api/',
  emailTemplateID: 'template_qwl4l46',
  emailServiceID: 'service_4zwqeji',
  emailUserID: 'mkI2Kqg6m34U7GL8m',
  patternEndpoint: 'http://localhost:5000/api/',
  analyticsEndpoint: 'https://analytics.nicolas-hoffmann.dev/api/',
  imagesUrl: 'https://images.lightningbowl.de/',
  branch: 'development',
  googleDriveClientId: '712735063879-0fc2cnqto0omthr28gm4vlgiae28trt0.apps.googleusercontent.com', // Using Google Identity Services (GIS)
  dropboxClientId: '0qi0957d7m0b2e8', // Using Dropbox SDK with PKCE - Set redirect URI: http://localhost:4200/auth/dropbox-callback
  oneDriveClientId: 'f0ca305e-341a-4aac-946c-4a39c047ccb2', // Using MSAL.js - Add redirect URI in Azure: Platform = SPA, URI = http://localhost:4200
};
