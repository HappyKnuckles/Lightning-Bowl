/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { type, payload } = data;

  switch (type) {
    case 'CONVERT_TO_BASE64': {
      convertImageToBase64(payload.imageData)
        .then((base64) => {
          postMessage({ type: 'BASE64_RESULT', payload: base64 });
        })
        .catch((error) => {
          postMessage({ type: 'ERROR', payload: error.message });
        });
      break;
    }
    default:
      console.warn('Unknown worker message type:', type);
  }
});

function convertImageToBase64(imageData: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(imageData);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      resolve(base64);
    } catch (error) {
      reject(error);
    }
  });
}
