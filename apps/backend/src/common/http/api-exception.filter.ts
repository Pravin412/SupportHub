import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { FastifyReply } from "fastify";

type ErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const statusCode = this.getStatusCode(exception);
    const payload = this.getPayload(exception);
    const message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(exception);
    }

    response.status(statusCode).send({
      success: false,
      statusCode,
      message: message ?? this.messageFor(statusCode),
      error: payload.error ?? this.messageFor(statusCode)
    });
  }

  private getPayload(exception: unknown): ErrorPayload {
    if (!(exception instanceof HttpException)) return {};
    const response = exception.getResponse();
    return typeof response === "string" ? { message: response } : (response as ErrorPayload);
  }

  private getStatusCode(exception: unknown) {
    if (exception instanceof HttpException) return exception.getStatus();
    
    // Handle JWT errors as 401 Unauthorized
    if (exception instanceof Error && (exception.name === "TokenExpiredError" || exception.name === "JsonWebTokenError")) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (exception && typeof exception === "object" && "statusCode" in exception) {
      const statusCode = Number((exception as { statusCode?: number }).statusCode);
      if (statusCode >= 400 && statusCode < 600) return statusCode;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private messageFor(statusCode: number) {
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) return "Internal server error";
    return "Request failed";
  }
}
