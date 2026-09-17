/**
 * ============================================================
 *  auth.js — NexusFlow Auth & Permissions  (Azure SSO Edition)
 * ============================================================
 *  Integrates Microsoft Authentication Library (MSAL) for
 *  Azure AD Single Sign-On.  Replaces the previous mock-user
 *  implementation.
 *
 *  Depends on (must be loaded before this file):
 *    1. msal-browser.min.js  (MSAL v2 CDN)
 *    2. js/msalConfig.js     (MSAL_CONFIG, LOGIN_REQUEST, NEXUSFLOW_ROLE_MAP, DEFAULT_ROLE)
 *    3. js/authGuard.js      (AuthGuard — provides the shared _msalInstance)
 *
 *  Bug fixes in this version
 *  ─────────────────────────
 *  FIX 1 — checkPermission() previously returned null, causing
 *           a TypeError ("Cannot read properties of null") in
 *           team.html when result.allowed was accessed.
 *           Now performs the actual role → permission lookup.
 *
 *  FIX 2 — getCurrentUser() previously returned a hardcoded
 *           mock object. Now derives identity from the live
 *           Azure AD ID-token claims via MSAL.
 * ============================================================
 */

var NexusAuth = (function () {

  /**
   * Role-permission matrix.
   * Each role maps to an array of allowed action strings.
   * This is the single source of truth for authorisation.
   */
  var _permissions = {
    admin:   ["create_project", "delete_project", "assign_role", "manage_invoices", "manage_settings"],
    manager: ["create_project", "assign_role", "manage_invoices"],
    member:  ["create_project"],
    viewer:  []
  };


  // ── Private helpers ──────────────────────────────────────

  /**
   * _getMsal()
   * ──────────
   * Returns the shared MSAL PublicClientApplication instance
   * that was created by authGuard.js.  Throws if authGuard.js
   * was not loaded first.
   */
  function _getMsal() {
    var instance = AuthGuard.getMsalInstance();
    if (!instance) {
      throw new Error("[NexusAuth] MSAL instance not initialised. " +
        "Ensure authGuard.js is loaded and AuthGuard.protect() has been called.");
    }
    return instance;
  }

  /**
   * _resolveRole(account)
   * ─────────────────────
   * Reads the "roles" claim from the Azure AD ID token and maps
   * the first matching value to a NexusFlow role name.
   * Falls back to DEFAULT_ROLE if no match is found.
   *
   * @param  {object} account  MSAL account object
   * @returns {string}         NexusFlow role name
   */
  function _resolveRole(account) {
    var claims     = (account && account.idTokenClaims) || {};
    var azureRoles = claims.roles || [];

    for (var i = 0; i < azureRoles.length; i++) {
      var mapped = NEXUSFLOW_ROLE_MAP[azureRoles[i]];
      if (mapped) return mapped;
    }
    return DEFAULT_ROLE;
  }


  // ── Public API ───────────────────────────────────────────

  /**
   * getCurrentUser()
   * ────────────────
   * Returns a NexusFlow user object built from the active
   * Azure AD account's ID-token claims.
   *
   * FIX: Previously returned a hardcoded mock object.
   *      Now reads live identity from MSAL.
   *
   * @returns {object|null}  User object or null if not signed in.
   */
  function getCurrentUser() {
    var account = AuthGuard.getActiveAccount();
    if (!account) return null;

    return {
      id:    account.localAccountId || account.homeAccountId || "unknown",
      name:  account.name           || account.username      || "User",
      email: account.username       || "",
      role:  _resolveRole(account)
    };
  }


  /**
   * checkPermission(userId, action)
   * ─────────────────────────────────
   * Checks whether the CURRENT signed-in user has permission
   * to perform the specified action.
   *
   * NOTE: The userId parameter is accepted for API compatibility
   * but the check is always performed against the signed-in
   * user's role (derived from the Azure AD token) to prevent
   * privilege-escalation by passing an arbitrary userId.
   *
   * FIX: Previously this function was a stub that returned null,
   *      causing a TypeError in team.html (result.allowed crash).
   *      Now performs the actual _permissions lookup.
   *
   * @param  {string} userId  (accepted but not used — see note above)
   * @param  {string} action  Action string to check (e.g. "assign_role")
   * @returns {{ allowed: boolean, reason: string }}
   */
  function checkPermission(userId, action) {
    var user = getCurrentUser();

    // Guard: user must be signed in
    if (!user) {
      return {
        allowed: false,
        reason:  "No authenticated user. Please sign in."
      };
    }

    var role        = user.role;
    var allowedList = _permissions[role];

    // Guard: role must exist in the matrix
    if (!allowedList) {
      return {
        allowed: false,
        reason:  "Unknown role '" + role + "'. Access denied."
      };
    }

    // Perform the actual permission lookup
    var allowed = allowedList.indexOf(action) !== -1;

    return {
      allowed: allowed,
      reason:  allowed
        ? "Permitted: role '" + role + "' has '" + action + "' access."
        : "Denied: role '" + role + "' does not have '" + action + "' access."
    };
  }


  /**
   * getAllRoles()
   * ────────────
   * Returns all available NexusFlow role names.
   *
   * @returns {string[]}
   */
  function getAllRoles() {
    return Object.keys(_permissions);
  }


  /**
   * login()
   * ───────
   * Triggers an Azure AD login redirect.
   * The user will be sent to Microsoft's login page and
   * redirected back to the app after authentication.
   *
   * @returns {Promise<void>}
   */
  function login() {
    return _getMsal().loginRedirect(LOGIN_REQUEST);
  }


  /**
   * logout()
   * ────────
   * Signs the current user out of Azure AD and clears
   * the local MSAL session cache.
   *
   * @returns {Promise<void>}
   */
  function logout() {
    var account = AuthGuard.getActiveAccount();
    return _getMsal().logoutRedirect({
      account: account || undefined,
      postLogoutRedirectUri: MSAL_CONFIG.auth.postLogoutRedirectUri
    });
  }


  /**
   * getAccessToken()
   * ────────────────
   * Silently acquires an access token for the scopes defined
   * in TOKEN_REQUEST (msalConfig.js).  Falls back to an
   * interactive redirect if the silent call fails (e.g. when
   * the refresh token has expired).
   *
   * Use this token to call Microsoft Graph or your own API.
   *
   * @returns {Promise<string>}  Resolves with the access token string.
   */
  function getAccessToken() {
    var msalInstance = _getMsal();
    var account      = AuthGuard.getActiveAccount();

    if (!account) {
      return Promise.reject(new Error("[NexusAuth] No active account. Call login() first."));
    }

    var silentRequest = Object.assign({}, TOKEN_REQUEST, { account: account });

    return msalInstance.acquireTokenSilent(silentRequest)
      .then(function (response) {
        return response.accessToken;
      })
      .catch(function (error) {
        // If silent acquisition fails, fall back to interactive redirect
        if (error instanceof msal.InteractionRequiredAuthError) {
          return msalInstance.acquireTokenRedirect(TOKEN_REQUEST);
        }
        throw error;
      });
  }


  // ── Expose public API ────────────────────────────────────
  return {
    getCurrentUser:  getCurrentUser,
    checkPermission: checkPermission,
    getAllRoles:      getAllRoles,
    login:           login,
    logout:          logout,
    getAccessToken:  getAccessToken
  };

})();
