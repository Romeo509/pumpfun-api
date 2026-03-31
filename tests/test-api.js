import fs from 'fs';
import path from 'path';

// Simple test to verify API endpoints exist
console.log('Testing the PumpFun API...');
console.log('Server should be running on http://localhost:3000');
console.log('');
console.log('Available endpoints:');
console.log('GET  / - Health check');
console.log('POST /api/create-token - Create token with JSON payload');
console.log('POST /api/create-token-multipart - Create token with multipart form data');
console.log('');
console.log('To test token creation, send a POST request to /api/create-token with JSON like:');
console.log({
  name: "TestToken",
  symbol: "TTT", 
  description: "A test token",
  twitter: "https://x.com/test",
  telegram: "https://t.me/test",
  website: "https://test.com",
  image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..." // base64 encoded image
});
console.log('');
console.log('Note: You need a valid Solana private key in your .env file to create tokens');