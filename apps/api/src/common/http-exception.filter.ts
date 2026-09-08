import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ErrorCode } from "@dorham/shared";
import { getRequestId } from "./request-id";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<{ status: (n: number) => { send: (b: unknown) => void } }>();
    const req = ctx.getRequest<{ headers: Record<string, unknown> }>();
    const requestId = getRequestId(req);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = "INTERNAL";
    let message = "Something went wrong.";
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "object" && res && "code" in res) {
        const body = res as { code: ErrorCode; message?: string; details?: unknown };
        code = body.code;
        message = body.message ?? message;
        details = body.details ?? null;
      } else if (status === 401) {
        code = "AUTH_UNAUTHORIZED";
        message = "Sign in required.";
      } else if (status === 403) {
        code = "AUTH_FORBIDDEN";
        message = "You cannot do that.";
      } else if (status === 429) {
        code = "RATE_LIMITED";
        message = "Too many requests. Slow down.";
      } else if (status === 400) {
        code = "VALIDATION_FAILED";
        message = typeof res === "string" ? res : "Request is invalid.";
      }
    } else {
      this.logger.error(exception);
    }

    if (status >= 500 && process.env.NODE_ENV === "production") {
      details = null;
    }

    reply.status(status).send({
      error: { code, message, details, requestId },
    });
  }
}
