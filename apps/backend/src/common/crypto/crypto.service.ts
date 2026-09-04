import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
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

  encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
  }

  decryptSecret(value: string) {
    if (!value.startsWith("enc:v1:")) return value;
    const [, , ivValue, tagValue, encryptedValue] = value.split(":");
    if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid encrypted secret format");
    const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final()
    ]).toString("utf8");
  }

  private encryptionKey() {
    const secret = process.env.SECRET_ENCRYPTION_KEY || process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("SECRET_ENCRYPTION_KEY is required to encrypt secrets");
    return createHash("sha256").update(secret).digest();
  }
}
