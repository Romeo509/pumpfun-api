export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class PumpPortalError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'PUMPPORTAL_ERROR');
    this.originalError = originalError?.message || null;
  }
}

export class TransactionError extends AppError {
  constructor(message, signature = null) {
    super(message, 500, 'TRANSACTION_ERROR');
    this.signature = signature;
  }
}

export class IPFSError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'IPFS_ERROR');
    this.originalError = originalError?.message || null;
  }
}

export class PriceFetchError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'PRICE_FETCH_ERROR');
    this.originalError = originalError?.message || null;
  }
}
