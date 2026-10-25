import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { LoginDto } from "./auth.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SkipAuth } from "../../common/decorators/skip-auth.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @SkipAuth()
  @Post("login")
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.login(dto.email, dto.password, reply);
  }

  @SkipAuth()
  @Post("refresh")
  refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    if (!req.cookies.refresh_token) throw new UnauthorizedException();
    return this.auth.refresh(req.cookies.refresh_token, reply);
  }

  @Post("logout")
  logout(@CurrentUser() userId: string, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.logout(userId, reply);
  }

  @Post("logout-all")
  logoutAll(@CurrentUser() userId: string, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.logout(userId, reply);
  }

  @Get("me")
  me(@CurrentUser() userId: string) {
    return this.auth.me(userId);
  }
}
