import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyReply } from "fastify";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PrismaService } from "../../common/database/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private db: PrismaService,
    private crypto: CryptoService,
    private jwt: JwtService
  ) {}

  async login(email: string, password: string, reply: FastifyReply) {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user || !(await this.crypto.compareSecret(password, user.passwordHash))) throw new UnauthorizedException();
    return this.issue(user.id, reply);
  }

  async issue(userId: string, reply: FastifyReply) {
    const token = this.crypto.randomToken();
    const session = await this.db.refreshSession.create({
      data: { userId, tokenHash: await this.crypto.hashSecret(token), expiresAt: new Date(Date.now() + 30 * 864e5) }
    });
    reply.setCookie("refresh_token", `${session.id}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/"
    });
    return {
      accessToken: await this.jwt.signAsync(
        { sub: userId },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "15m" }
      )
    };
  }

  async refresh(cookie: string, reply: FastifyReply) {
    const [sessionId, token] = cookie.split(".");
    if (!sessionId || !token) throw new UnauthorizedException();
    const session = await this.db.refreshSession.findUnique({ where: { id: sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) throw new UnauthorizedException();
    if (!(await this.crypto.compareSecret(token, session.tokenHash))) {
      await this.db.refreshSession.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw new UnauthorizedException();
    }
    await this.db.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issue(session.userId, reply);
  }

  async me(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        memberships: { select: { projectId: true, role: true } }
      }
    });
  }

  async logout(userId: string, reply: FastifyReply) {
    await this.db.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    reply.clearCookie("refresh_token", { path: "/" });
    reply.clearCookie("refresh_token", { path: "/auth/refresh" });
    return { ok: true };
  }
}
