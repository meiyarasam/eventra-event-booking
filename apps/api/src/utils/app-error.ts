export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message: string = 'Authentication required') {
    return new AppError(message, 401);
  }

  static forbidden(message: string = 'Access denied: Insufficient permissions') {
    return new AppError(message, 403);
  }

  static notFound(message: string = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string, details?: any) {
    return new AppError(message, 409, details);
  }

  static gone(message: string = 'Resource expired or no longer available') {
    return new AppError(message, 410);
  }

  static internal(message: string = 'Internal server error') {
    return new AppError(message, 500);
  }
}
