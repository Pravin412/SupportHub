import { Injectable } from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

@Injectable()
export class CryptoService {
  randomToken(bytes = 32) {
    return randomBytes(bytes).toString("base64url");
  }

  hashSecret(secret: string) {
    return bcrypt.hash(secret, 12);
  }

  compareSecret(secret: string, hash: string) {
    return bcrypt.compare(secret, hash);
  }

  signWebhook(secret: string, eventId: string, timestamp: string, payload: unknown) {
    const body = `${eventId}.${timestamp}.${JSON.stringify(payload)}`;
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
