/**
 * ============================================================
 *  auth.js — NexusFlow Auth & Permissions
 * ============================================================
 *  Simulates an authentication and role-permission system.
 *  In a real app this would call an API; here we use mock data.
 * ============================================================
 */

var NexusAuth = (function () {

  /**
   * Mock user session (simulates a logged-in admin user)
   */
  var _currentUser = {
    id: "USR-001",
    name: "Anirban Roy",
    email: "anirban@ceptes.com",
    role: "admin"
  };


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
   * Returns the current logged-in user object.
   * This function is clean — no bugs here.
   */
  function getCurrentUser() {
    return _currentUser;
  }


  /**
   * checkPermission(userId, action)
   * ─────────────────────────────────
   * Checks whether the given user has permission to perform
   * the specified action.
   *
   * Expected return value:
   *   { allowed: true/false, reason: "..." }
   *
   * BUG: This function was stubbed out during development and
   *      always returns null instead of performing the actual
   *      permission lookup against _permissions.
   *
   *      The calling code in team.html does:
   *        var result = NexusAuth.checkPermission(userId, action);
   *        if (result.allowed) { ... }
   *
   *      Since result is null, accessing result.allowed throws
   *      a TypeError.
   *
   *      The fix: look up the user's role, check _permissions,
   *      and return the proper { allowed, reason } object.
   */
  function checkPermission(userId, action) {
    // TODO: Implement actual permission check
    // Should look up user role and check _permissions matrix
    return null;
  }


  /**
   * getAllRoles()
   * ──────────────
   * Returns all available role names.
   * This function is clean — no bugs here.
   */
  function getAllRoles() {
    return Object.keys(_permissions);
  }


  // ── Public API ──────────────────────────────────
  return {
    getCurrentUser:  getCurrentUser,
    checkPermission: checkPermission,
    getAllRoles:      getAllRoles
  };

})();
