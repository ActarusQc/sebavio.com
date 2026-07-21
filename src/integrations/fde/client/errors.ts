export type FdeFuelPricesErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type FdeFuelPricesErrorBody = {
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
  readonly details?: Readonly<Record<string, unknown>>;
};

export class FdeFuelPricesError extends Error {
  readonly code: FdeFuelPricesErrorCode;
  readonly status: number;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly body?: FdeFuelPricesErrorBody;

  constructor(input: {
    readonly code: FdeFuelPricesErrorCode;
    readonly message: string;
    readonly status: number;
    readonly requestId?: string;
    readonly retryable?: boolean;
    readonly retryAfterSeconds?: number;
    readonly body?: FdeFuelPricesErrorBody;
    readonly cause?: unknown;
  }) {
    super(
      input.message,
      input.cause !== undefined ? { cause: input.cause } : undefined,
    );
    this.name = "FdeFuelPricesError";
    this.code = input.code;
    this.status = input.status;
    if (input.requestId !== undefined) {
      this.requestId = input.requestId;
    }
    this.retryable = input.retryable ?? false;
    if (input.retryAfterSeconds !== undefined) {
      this.retryAfterSeconds = input.retryAfterSeconds;
    }
    if (input.body !== undefined) {
      this.body = input.body;
    }
  }
}

export class FdeFuelPricesUnauthorizedError extends FdeFuelPricesError {
  constructor(input: {
    readonly message: string;
    readonly requestId?: string;
    readonly body?: FdeFuelPricesErrorBody;
  }) {
    super({
      code: "UNAUTHORIZED",
      message: input.message,
      status: 401,
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      retryable: false,
    });
    this.name = "FdeFuelPricesUnauthorizedError";
  }
}

export class FdeFuelPricesForbiddenError extends FdeFuelPricesError {
  constructor(input: {
    readonly message: string;
    readonly requestId?: string;
    readonly body?: FdeFuelPricesErrorBody;
  }) {
    super({
      code: "FORBIDDEN",
      message: input.message,
      status: 403,
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      retryable: false,
    });
    this.name = "FdeFuelPricesForbiddenError";
  }
}

export class FdeFuelPricesNotFoundError extends FdeFuelPricesError {
  constructor(input: {
    readonly message: string;
    readonly requestId?: string;
    readonly body?: FdeFuelPricesErrorBody;
  }) {
    super({
      code: "NOT_FOUND",
      message: input.message,
      status: 404,
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      retryable: false,
    });
    this.name = "FdeFuelPricesNotFoundError";
  }
}

export class FdeFuelPricesRateLimitError extends FdeFuelPricesError {
  constructor(input: {
    readonly message: string;
    readonly requestId?: string;
    readonly retryAfterSeconds?: number;
    readonly body?: FdeFuelPricesErrorBody;
  }) {
    super({
      code: "RATE_LIMITED",
      message: input.message,
      status: 429,
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: input.retryAfterSeconds }
        : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      retryable: true,
    });
    this.name = "FdeFuelPricesRateLimitError";
  }
}

export class FdeFuelPricesResponseValidationError extends FdeFuelPricesError {
  constructor(input: {
    readonly message: string;
    readonly requestId?: string;
    readonly cause?: unknown;
  }) {
    super({
      code: "VALIDATION_ERROR",
      message: input.message,
      status: 200,
      ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
      ...(input.cause !== undefined ? { cause: input.cause } : {}),
      retryable: false,
    });
    this.name = "FdeFuelPricesResponseValidationError";
  }
}
