/**
 * ============================================================
 *  auth.js — NexusFlow Auth & Permissions (JWT-integrated)
 * ============================================================
 *  Provides role-based permission checks backed by the live
 *  JWT session managed by NexusJWT (js/jwtAuth.js).
 *
 *  IMPORTANT: jwtAuth.js must be loaded before auth.js.
 * ============================================================
 */

var NexusAuth = (function () {

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


  /**
   * getCurrentUser()
   * ─────────────────
   * Returns the current logged-in user decoded from the JWT.
   * Returns null if not authenticated.
   */
  function getCurrentUser() {
    return NexusJWT.getCurrentUser();
  }


  /**
   * checkPermission(userId, action)
   * ─────────────────────────────────
   * Checks whether the current JWT user has permission to
   * perform the specified action.
   *
   * Returns { allowed: true/false, reason: "..." }
   *
   * FIX: Previously returned null (stub). Now performs the
   * actual role lookup against the _permissions matrix using
   * the role embedded in the JWT payload.
   */
  function checkPermission(userId, action) {
    var user = NexusJWT.getCurrentUser();

    if (!user) {
      return { allowed: false, reason: "Not authenticated" };
    }

    var role    = user.role;
    var allowed = Array.isArray(_permissions[role]) &&
                  _permissions[role].indexOf(action) !== -1;

    return {
      allowed: allowed,
      reason: allowed
        ? "Permission granted for role: " + role
        : "Role '" + role + "' does not have permission: " + action
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


  // ── Public API ──────────────────────────────────────────────
  return {
    getCurrentUser:  getCurrentUser,
    checkPermission: checkPermission,
    getAllRoles:      getAllRoles
  };

})();
