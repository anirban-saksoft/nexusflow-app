/**
 * ============================================================
 *  auth.js — NexusFlow Auth & Permissions (JWT-based)
 * ============================================================
 *  Implements JWT authentication with role-based permissions.
 *  Uses a lightweight browser-compatible JWT implementation.
 *  In a real app, token signing/verification would happen
 *  server-side. Here we simulate it with a secret key.
 * ============================================================
 */

var NexusAuth = (function () {

  // ── Config ──────────────────────────────────────
  var JWT_SECRET = "nexusflow-secret-key-2024"; // In prod: store server-side only
  var TOKEN_EXPIRY_HOURS = 8;
  var TOKEN_KEY = "nexusflow_jwt";

  /**
   * Role-permission matrix.
   * Each role maps to an array of allowed actions.
   */
  var _permissions = {
    admin:   ["create_project", "delete_project", "assign_role", "manage_invoices", "manage_settings"],
    manager: ["create_project", "assign_role", "manage_invoices"],
    member:  ["create_project"],
    viewer:  []
  };


  // ── JWT Helpers ─────────────────────────────────

  /**
   * _base64UrlEncode(str)
   * Encodes a string to Base64URL format (JWT-safe).
   */
  function _base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /**
   * _base64UrlDecode(str)
   * Decodes a Base64URL string.
   */
  function _base64UrlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return atob(str);
  }

  /**
   * _simpleSign(data, secret)
   * Simulates HMAC signing using a basic hash (browser-safe).
   * NOTE: In production, use SubtleCrypto or a server-side JWT library.
   */
  function _simpleSign(data, secret) {
    var hash = 0;
    var combined = data + secret;
    for (var i = 0; i < combined.length; i++) {
      var char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit int
    }
    return _base64UrlEncode(Math.abs(hash).toString(36));
  }

  /**
   * _generateToken(payload)
   * Creates a JWT-style token: header.payload.signature
   */
  function _generateToken(payload) {
    var header = _base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    var body   = _base64UrlEncode(JSON.stringify(payload));
    var sig    = _simpleSign(header + "." + body, JWT_SECRET);
    return header + "." + body + "." + sig;
  }

  /**
   * _verifyToken(token)
   * Verifies signature and expiry. Returns decoded payload or null.
   */
  function _verifyToken(token) {
    try {
      var parts = token.split(".");
      if (parts.length !== 3) return null;

      // Verify signature
      var expectedSig = _simpleSign(parts[0] + "." + parts[1], JWT_SECRET);
      if (expectedSig !== parts[2]) {
        console.warn("[NexusAuth] Invalid token signature.");
        return null;
      }

      // Decode payload
      var payload = JSON.parse(_base64UrlDecode(parts[1]));

      // Check expiry
      if (payload.exp && Date.now() > payload.exp) {
        console.warn("[NexusAuth] Token has expired.");
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }

      return payload;

    } catch (e) {
      console.error("[NexusAuth] Token verification failed:", e);
      return null;
    }
  }


  // ── Public API ───────────────────────────────────

  /**
   * login(user)
   * ────────────
   * Accepts a user object, generates a JWT, and stores it
   * in localStorage. Call this on successful credential check.
   *
   * @param {Object} user - { id, name, email, role }
   * @returns {string} The generated JWT token
   *
   * Usage:
   *   NexusAuth.login({ id: "USR-001", name: "Anirban Roy",
   *                     email: "anirban@ceptes.com", role: "admin" });
   */
  function login(user) {
    var payload = {
      sub:   user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      iat:   Date.now(),
      exp:   Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    };
    var token = _generateToken(payload);
    localStorage.setItem(TOKEN_KEY, token);
    console.info("[NexusAuth] User logged in:", user.email);
    return token;
  }

  /**
   * logout()
   * ─────────
   * Clears the JWT from localStorage.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    console.info("[NexusAuth] User logged out.");
  }

  /**
   * getCurrentUser()
   * ─────────────────
   * Decodes and returns the current user from the stored JWT.
   * Returns null if no valid token exists.
   */
  function getCurrentUser() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    var payload = _verifyToken(token);
    if (!payload) return null;

    return {
      id:    payload.sub,
      name:  payload.name,
      email: payload.email,
      role:  payload.role
    };
  }

  /**
   * isAuthenticated()
   * ──────────────────
   * Returns true if a valid, non-expired JWT exists.
   */
  function isAuthenticated() {
    return getCurrentUser() !== null;
  }

  /**
   * checkPermission(userId, action)
   * ─────────────────────────────────
   * Checks whether the current JWT user has permission to
   * perform the specified action.
   *
   * @returns {{ allowed: boolean, reason: string }}
   *
   * FIX: Previously returned null (causing TypeError in team.html).
   *      Now correctly resolves role from JWT and checks _permissions.
   */
  function checkPermission(userId, action) {
    var user = getCurrentUser();

    if (!user) {
      return { allowed: false, reason: "User is not authenticated." };
    }

    if (user.id !== userId) {
      return { allowed: false, reason: "User ID mismatch." };
    }

    var rolePermissions = _permissions[user.role];
    if (!rolePermissions) {
      return { allowed: false, reason: "Unknown role: " + user.role };
    }

    var allowed = rolePermissions.indexOf(action) !== -1;
    return {
      allowed: allowed,
      reason: allowed
        ? "Permission granted for role '" + user.role + "'."
        : "Role '" + user.role + "' is not allowed to perform '" + action + "'."
    };
  }

  /**
   * getAllRoles()
   * ──────────────
   * Returns all available role names.
   */
  function getAllRoles() {
    return Object.keys(_permissions);
  }

  /**
   * getToken()
   * ───────────
   * Returns the raw JWT string (useful for attaching to API headers).
   *
   * Usage:
   *   fetch("/api/data", {
   *     headers: { "Authorization": "Bearer " + NexusAuth.getToken() }
   *   });
   */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }


  // ── Auto-seed a session for demo purposes ────────
  // Remove this block in production — login should be triggered
  // by a real credential form.
  (function _seedDemoSession() {
    if (!isAuthenticated()) {
      login({
        id:    "USR-001",
        name:  "Anirban Roy",
        email: "anirban@ceptes.com",
        role:  "admin"
      });
    }
  })();


  return {
    login:           login,
    logout:          logout,
    getCurrentUser:  getCurrentUser,
    isAuthenticated: isAuthenticated,
    checkPermission: checkPermission,
    getAllRoles:      getAllRoles,
    getToken:        getToken
  };

})();
