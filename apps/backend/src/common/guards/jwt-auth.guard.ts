import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/skip-auth.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = (request.headers.authorization as string | undefined)?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
