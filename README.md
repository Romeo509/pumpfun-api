# PumpFun API

A Node.js API for creating and buying tokens on the Pump.fun platform.

## Features

- Create tokens on the Solana blockchain via Pump.fun
- Buy existing tokens on the Solana blockchain via Pump.fun
- Supports both JSON and multipart form data for image uploads
- Proper error handling and response formatting
- Environment-based configuration
- Interactive API documentation with Swagger UI

## API Endpoints

### GET /

Health check endpoint.

**Response:**
```json
{
  "message": "PumpFun API is running!"
}
```

### Swagger UI

Interactive API documentation is available at:

```
GET /api-docs
```

This provides a user-friendly interface to test all API endpoints and view detailed documentation.

### POST /api/create-token

Create a new token on Pump.fun.

**Request Body (JSON):**
```json
{
  "name": "TokenName",
  "symbol": "SYMBOL",
  "description": "Token description",
  "twitter": "https://x.com/username",
  "telegram": "https://t.me/groupname",
  "website": "https://example.com",
  "image": "data:image/jpeg;base64,...",
  "privateKey": "your_private_key_base58",
  "amount": 0.050  // Required: dev buy amount in SOL
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token created successfully",
  "data": {
    "signature": "transaction_signature",
    "mintAddress": "mint_public_key",
    "creatorAddress": "creator_public_key",
    "transactionUrl": "https://solscan.io/tx/transaction_signature",
    "metadataUri": "ipfs_metadata_uri"
  }
}
```

### POST /api/create-token-multipart

Create a new token with multipart form data (for image upload).

**Form Data:**
- `name` (required)
- `symbol` (required)
- `description` (optional)
- `twitter` (optional)
- `telegram` (optional)
- `website` (optional)
- `image` (file, required)
- `privateKey` (required)
- `amount` (required)

**Response:**
Same as above.

### POST /api/buy-token

Buy tokens on Pump.fun.

**Request Body (JSON):**
```json
{
  "mintAddress": "token_mint_address",
  "privateKey": "your_private_key_base58",
  "amount": 0.050,  // Required: amount in SOL to spend
  "slippage": 10    // Optional: slippage percentage (default: 10)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token purchase successful",
  "data": {
    "success": true,
    "signature": "transaction_signature",
    "transactionUrl": "https://solscan.io/tx/transaction_signature",
    "mintAddress": "mint_public_key",
    "amountSpent": 0.05
  }
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Security Notes

- Keep your private key secure and never expose it in client-side code
- The private key is now passed as a parameter to the API instead of being stored in environment variables
- Be cautious when using this API in production - consider implementing authentication and additional security measures
- The API does not implement authentication - add authentication middleware as needed for production use

