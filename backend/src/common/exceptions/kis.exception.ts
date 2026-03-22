import { HttpException, HttpStatus } from '@nestjs/common';

export class KisApiException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_GATEWAY, details?: any) {
    super(
      {
        success: false,
        message: `KIS API Error: ${message}`,
        details,
      },
      status,
    );
  }
}

export class KisRateLimitException extends KisApiException {
  constructor(details?: any) {
    super('API rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS, details);
  }
}

export class KisAuthException extends KisApiException {
  constructor(message: string, details?: any) {
    super(`Authentication failed: ${message}`, HttpStatus.UNAUTHORIZED, details);
  }
}

export class KisDataException extends KisApiException {
  constructor(stockCode: string, message: string) {
    super(`Invalid data for ${stockCode}: ${message}`, HttpStatus.NOT_FOUND);
  }
}
