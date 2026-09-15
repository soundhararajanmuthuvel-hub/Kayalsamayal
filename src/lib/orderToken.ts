import crypto from "crypto";

const ORDER_TOKEN_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "kayal-samayal-internal-token-secret-salt-2026";

export interface OrderTokenPayload {
  razorpayOrderId: string;
  expectedAmountPaise: number;
  customerMobile: string;
  couponCode?: string;
  timestamp: number;
}

/**
 * Creates an HMAC signature token for a server-created Razorpay order.
 * This ensures the client cannot tamper with or swap the order ID during verification.
 */
export function createOrderToken(payload: OrderTokenPayload): string {
  const cpn = payload.couponCode ? payload.couponCode.trim().toUpperCase() : "";
  const data = `${payload.razorpayOrderId}:${payload.expectedAmountPaise}:${payload.customerMobile}:${cpn}:${payload.timestamp}`;
  const signature = crypto
    .createHmac("sha256", ORDER_TOKEN_SECRET)
    .update(data)
    .digest("hex");
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature}`;
}

/**
 * Verifies and decodes the order token, returning the trusted server-created Razorpay order ID.
 */
export function verifyOrderToken(token: string): OrderTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const payloadStr = Buffer.from(encoded, "base64url").toString("utf8");
    const payload: OrderTokenPayload = JSON.parse(payloadStr);

    const cpn = payload.couponCode ? payload.couponCode.trim().toUpperCase() : "";
    const expectedData = `${payload.razorpayOrderId}:${payload.expectedAmountPaise}:${payload.customerMobile}:${cpn}:${payload.timestamp}`;
    const expectedSignature = crypto
      .createHmac("sha256", ORDER_TOKEN_SECRET)
      .update(expectedData)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    ) {
      return null;
    }

    // Token expires after 2 hours (plenty of time to complete checkout)
    const now = Date.now();
    if (now - payload.timestamp > 2 * 60 * 60 * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
