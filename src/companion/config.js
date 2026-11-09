// Stage 1 local development only: trusted private Wi-Fi, never port-forward.
// Replace with a certificate-validated wss:// endpoint for production.
export const companionConfig={url:'ws://192.168.1.4:8790/companion',localDevelopment:true};
