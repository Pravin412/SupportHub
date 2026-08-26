import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map } from "rxjs";

type ApiResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data): ApiResponse<unknown> => ({
        success: true,
        statusCode: response.statusCode,
        message: this.messageFor(response.statusCode),
        data
      }))
    );
  }

  private messageFor(statusCode: number) {
    if (statusCode === 201) return "Created successfully";
    return "Request successful";
  }
}
