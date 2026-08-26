import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import { IsEmail, IsString, MinLength } from "class-validator";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private auth: AuthService,
    private jwt: JwtService
  ) {}

  @Post("login")
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.login(dto.email, dto.password, reply);
  }

  @Post("refresh")
  refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    if (!req.cookies.refresh_token) throw new UnauthorizedException();
    return this.auth.refresh(req.cookies.refresh_token, reply);
  }

  @Post("logout")
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.auth.logout(await this.userId(req), reply);
  }

  @Post("logout-all")
  logoutAll(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    return this.logout(req, reply);
  }

  @Get("me")
  async me(@Req() req: FastifyRequest) {
    return this.auth.me(await this.userId(req));
  }

  private async userId(req: FastifyRequest) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException();
    return (await this.jwt.verifyAsync<{ sub: string }>(token, { secret: process.env.JWT_ACCESS_SECRET })).sub;
  }
}
