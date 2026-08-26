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
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = this.getPayload(exception);
    const message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;

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

  private messageFor(statusCode: number) {
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) return "Internal server error";
    return "Request failed";
  }
}
