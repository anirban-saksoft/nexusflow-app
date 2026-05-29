/**
 * ============================================================
 *  jwtAuth.js — NexusFlow JWT Authentication Engine
 * ============================================================
 *  Handles JWT token creation, validation, storage, and
 *  session management. Uses HS256 (HMAC-SHA256) simulation
 *  via a base64-encoded signature for client-side demo.
 *
 *  NOTE: In production, token signing/verification MUST
 *  happen on the server. This is a frontend-only simulation.
 * ============================================================
 */

var NexusJWT = (function () {

  // ── Secret key (in production, this lives ONLY on the server) ──
  var SECRET_KEY = "nexusflow-secret-2024";
  var TOKEN_KEY  = "nexusflow_jwt";
  var TOKEN_TTL  = 60 * 60 * 1000; // 1 hour in milliseconds

  // ── Mock user database ──────────────────────────────────────────
  var USERS_DB = [
    { id: "USR-001", name: "Anirban Roy",  email: "anirban@ceptes.com", password: "admin123",   role: "admin"   },
    { id: "USR-002", name: "Jane Smith",   email: "jane@acme.com",      password: "manager123", role: "manager" },
    { id: "USR-003", name: "Mike Chen",    email: "mike@acme.com",      password: "member123",  role: "member"  },
    { id: "USR-004", name: "Sara Patel",   email: "sara@acme.com",      password: "member123",  role: "member"  },
    { id: "USR-005", name: "Tom Wilson",   email: "tom@acme.com",       password: "viewer123",  role: "viewer"  }
  ];


  // ── Base64 URL helpers ──────────────────────────────────────────

  function _base64UrlEncode(str) {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function _base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      return null;
    }
  }


  // ── Simple HMAC-like signature (demo only) ──────────────────────
  // In production: use crypto.subtle.sign() or a server endpoint.

  function _sign(header, payload) {
    var data = header + "." + payload + SECRET_KEY;
    var hash = 0;
    for (var i = 0; i < data.length; i++) {
      var chr = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }  
    return _base64UrlEncode(String(Math.abs(hash)));
  }


  // ── Token creation ──────────────────────────────────────────────

  function _createToken(user) {
    var header = _base64UrlEncode(JSON.stringify({
      alg: "HS256",
      typ: "JWT"
    }));

    var now = Date.now();
    var payload = _base64UrlEncode(JSON.stringify({
      sub:   user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      iat:   now,
      exp:   now + TOKEN_TTL
    }));

    var signature = _sign(header, payload);
    return header + "." + payload + "." + signature;
  }


  // ── Token parsing ───────────────────────────────────────────────

  function _parseToken(token) {
    if (!token || typeof token !== "string") return null;
    var parts = token.split(".");
    if (parts.length !== 3) return null;

    try {
      var header  = JSON.parse(_base64UrlDecode(parts[0]));
      var payload = JSON.parse(_base64UrlDecode(parts[1]));
      var sig     = parts[2];
      return { header: header, payload: payload, signature: sig, raw: parts };
    } catch (e) {
      return null;
    }
  }


  // ── Token validation ────────────────────────────────────────────

  function _validateToken(token) {
    var parsed = _parseToken(token);
    if (!parsed) return { valid: false, reason: "Malformed token" };

    // Verify signature
    var expectedSig = _sign(parsed.raw[0], parsed.raw[1]);
    if (expectedSig !== parsed.signature) {
      return { valid: false, reason: "Invalid signature" };
    }

    // Check expiry
    if (Date.now() > parsed.payload.exp) {
      return { valid: false, reason: "Token expired" };
    }

    return { valid: true, payload: parsed.payload };
  }


  // ── Public API ──────────────────────────────────────────────────

  /**
   * login(email, password)
   * ──────────────────────
   * Validates credentials, creates a JWT, stores it in
   * localStorage, and returns { success, token, user }.
   */
  function login(email, password) {
    var user = USERS_DB.find(function (u) {
      return u.email === email && u.password === password;
    });

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    var token = _createToken(user);
    localStorage.setItem(TOKEN_KEY, token);

    return {
      success: true,
      token: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }


  /**
   * logout()
   * ─────────
   * Clears the JWT from storage and redirects to login.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "login.html";
  }


  /**
   * getToken()
   * ──────────
   * Returns the raw JWT string from localStorage.
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }


  /**
   * getCurrentUser()
   * ─────────────────
   * Decodes the stored JWT and returns the user payload.
   * Returns null if no valid token exists.
   */
  function getCurrentUser() {
    var token = getToken();
    if (!token) return null;
    var result = _validateToken(token);
    if (!result.valid) return null;
    return result.payload;
  }


  /**
   * isAuthenticated()
   * ──────────────────
   * Returns true if a valid, non-expired JWT is stored.
   */
  function isAuthenticated() {
    var token = getToken();
    if (!token) return false;
    return _validateToken(token).valid;
  }


  /**
   * requireAuth()
   * ──────────────
   * Call at the top of every protected page.
   * Redirects to login.html if not authenticated.
   */
  function requireAuth() {
    if (!isAuthenticated()) {
      localStorage.setItem("nexusflow_redirect", window.location.href);
      window.location.href = "login.html";
    }
  }


  /**
   * getTokenInfo()
   * ───────────────
   * Returns decoded token details (for debugging/display).
   */
  function getTokenInfo() {
    var token = getToken();
    if (!token) return null;
    return _parseToken(token);
  }


  return {
    login:           login,
    logout:          logout,
    getToken:        getToken,
    getCurrentUser:  getCurrentUser,
    isAuthenticated: isAuthenticated,
    requireAuth:     requireAuth,
    getTokenInfo:    getTokenInfo
  };

})();
