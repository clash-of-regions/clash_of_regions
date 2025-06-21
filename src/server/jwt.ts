import { jwtVerify } from "jose";
import {
  TokenPayload,
  TokenPayloadSchema,
  UserMeResponse,
  UserMeResponseSchema,
} from "../core/ApiSchemas";
import { getPool } from "./persistence/MySQLClient";
import { ServerConfig } from "../core/configuration/Config";

type TokenVerificationResult = {
  persistentId: string;
  claims: TokenPayload | null;
};

export async function verifyClientToken(
  token: string,
  config: ServerConfig,
): Promise<TokenVerificationResult> {
  if (token.length === 36) {
    return { persistentId: token, claims: null };
  }
  const issuer = config.jwtIssuer();
  const audience = config.jwtAudience();
  const key = await config.jwkPublicKey();
  const { payload, protectedHeader } = await jwtVerify(token, key, {
    algorithms: ["EdDSA"],
    issuer,
    audience,
    maxTokenAge: "6 days",
  });
  const claims = TokenPayloadSchema.parse(payload);
  const persistentId = claims.sub;
  return { persistentId, claims };
}

export async function getUserMe(
  token: string,
  config: ServerConfig,
): Promise<UserMeResponse | false> {
  if (process.env.PERSISTENT_WORLD === "1") {
    try {
      const { persistentId } = await verifyClientToken(token, config);
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT persistent_id, username FROM players WHERE persistent_id = ?",
        [persistentId],
      );
      const r = Array.isArray(rows) ? (rows as any[])[0] : null;
      if (!r) return false;
      const resp: UserMeResponse = {
        user: {
          id: persistentId,
          avatar: null,
          username: r.username,
          global_name: null,
          discriminator: "0",
          locale: undefined,
        },
        player: { publicId: persistentId, roles: [] },
      };
      return resp;
    } catch (e) {
      return false;
    }
  }
  try {
    // Get the user object
    const response = await fetch(config.jwtIssuer() + "/users/@me", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (response.status !== 200) return false;
    const body = await response.json();
    const result = UserMeResponseSchema.safeParse(body);
    if (!result.success) {
      console.error(
        "Invalid response",
        JSON.stringify(body),
        JSON.stringify(result.error),
      );
      return false;
    }
    return result.data;
  } catch (e) {
    return false;
  }
}
