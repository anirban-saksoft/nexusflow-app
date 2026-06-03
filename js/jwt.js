/**
 * ============================================================
 *  jwt.js — NexusFlow JWT Authentication Module
 * ============================================================
 *  Provides a lightweight, browser-side JWT implementation:
 *    - NexusJWT.sign(payload, secret)   → token string
 *    - NexusJWT.verify(token, secret)   → payload or null
 *    - NexusJWT.decode(token)           → payload (no verify)
 *    - NexusJWT.isExpired(token)        → boolean
 *
 *  ⚠️  NOTE: This uses HMAC-SHA256 via the Web Crypto API.
 *      In production, JWT signing/verification should always
 *      happen server-side. Never expose your secret in
 *      client-side code in a real application.
 * ============================================================
 */

var NexusJWT = (function () {

  // ── Helpers ──────────────────────────────────────────────

  /** Base64URL-encode a string or ArrayBuffer */
  function _b64urlEncode(input) {
    var str;
    if (input instanceof ArrayBuffer) {
      str = String.fromCharCode.apply(null, new Uint8Array(input));
    } else {
      str = input;
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /** Base64URL-decode to a string */
  function _b64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return atob(str);
  }

  /** Encode an object to a Base64URL JSON string */
  function _encodeSegment(obj) {
    return _b64urlEncode(JSON.stringify(obj));
  }

  /** Decode a Base64URL segment back to an object */
  function _decodeSegment(seg) {
    try {
      return JSON.parse(_b64urlDecode(seg));
    } catch (e) {
      return null;
    }
  }

  /**
   * _hmacSHA256(message, secret) → Promise<string>
   * Computes HMAC-SHA256 using the Web Crypto API and
   * returns the result as a Base64URL-encoded string.
   */
  async function _hmacSHA256(message, secret) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    var signature = await crypto.subtle.sign(
      "HMAC",
      keyMaterial,
      enc.encode(message)
    );
    return _b64urlEncode(signature);
  }

  /**
   * _verifyHmac(message, secret, expectedSig) → Promise<boolean>
   * Verifies an HMAC-SHA256 signature using the Web Crypto API.
   */
  async function _verifyHmac(message, secret, expectedSig) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    // Decode the expected signature back to ArrayBuffer
    var sigStr = _b64urlDecode(expectedSig);
    var sigBytes = new Uint8Array(sigStr.length);
    for (var i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }
    return crypto.subtle.verify(
      "HMAC",
      keyMaterial,
      sigBytes,
      enc.encode(message)
    );
  }


  // ── Public API ───────────────────────────────────────────

  /**
   * sign(payload, secret, [expiresInSeconds])
   * ──────────────────────────────────────────
   * Creates a signed JWT token.
   *
   * @param {Object} payload          - Claims to embed (e.g. { sub, role })
   * @param {string} secret           - HMAC signing secret
   * @param {number} [expiresInSeconds=3600] - Token TTL in seconds (default 1 hour)
   * @returns {Promise<string>}       - Signed JWT string
   *
   * Example:
   *   var token = await NexusJWT.sign({ sub: "USR-001", role: "admin" }, "my-secret");
   */
  async function sign(payload, secret, expiresInSeconds) {
    if (!payload || typeof payload !== "object") {
      throw new Error("JWT payload must be a plain object.");
    }
    if (!secret || typeof secret !== "string") {
      throw new Error("JWT secret must be a non-empty string.");
    }

    var ttl = typeof expiresInSeconds === "number" ? expiresInSeconds : 3600;
    var now = Math.floor(Date.now() / 1000);

    var header = { alg: "HS256", typ: "JWT" };
    var claims = Object.assign({}, payload, {
      iat: now,
      exp: now + ttl
    });

    var headerSeg  = _encodeSegment(header);
    var payloadSeg = _encodeSegment(claims);
    var signingInput = headerSeg + "." + payloadSeg;

    var signature = await _hmacSHA256(signingInput, secret);
    return signingInput + "." + signature;
  }


  /**
   * verify(token, secret)
   * ──────────────────────
   * Verifies a JWT's signature and expiry.
   *
   * @param {string} token  - JWT string to verify
   * @param {string} secret - HMAC signing secret
   * @returns {Promise<Object|null>} - Decoded payload if valid, null otherwise
   *
   * Example:
   *   var payload = await NexusJWT.verify(token, "my-secret");
   *   if (payload) { console.log(payload.role); }
   */
  async function verify(token, secret) {
    if (!token || typeof token !== "string") return null;
    if (!secret || typeof secret !== "string") return null;

    var parts = token.split(".");
    if (parts.length !== 3) return null;

    var headerSeg  = parts[0];
    var payloadSeg = parts[1];
    var sigSeg     = parts[2];

    // 1. Verify signature
    var signingInput = headerSeg + "." + payloadSeg;
    var valid = await _verifyHmac(signingInput, secret, sigSeg);
    if (!valid) return null;

    // 2. Decode payload
    var payload = _decodeSegment(payloadSeg);
    if (!payload) return null;

    // 3. Check expiry
    var now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;

    return payload;
  }


  /**
   * decode(token)
   * ──────────────
   * Decodes a JWT payload WITHOUT verifying the signature.
   * Use only for reading non-sensitive display data.
   *
   * @param {string} token - JWT string
   * @returns {Object|null} - Decoded payload or null
   */
  function decode(token) {
    if (!token || typeof token !== "string") return null;
    var parts = token.split(".");
    if (parts.length !== 3) return null;
    return _decodeSegment(parts[1]);
  }


  /**
   * isExpired(token)
   * ─────────────────
   * Returns true if the token's `exp` claim is in the past.
   *
   * @param {string} token - JWT string
   * @returns {boolean}
   */
  function isExpired(token) {
    var payload = decode(token);
    if (!payload || !payload.exp) return true;
    return Math.floor(Date.now() / 1000) > payload.exp;
  }


  // ── Public API ──────────────────────────────────
  return {
    sign:      sign,
    verify:    verify,
    decode:    decode,
    isExpired: isExpired
  };

})();
