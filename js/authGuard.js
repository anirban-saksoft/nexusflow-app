/**
 * ============================================================
 *  authGuard.js — NexusFlow Page-Level Authentication Guard
 * ============================================================
 *  Include this script on every protected page BEFORE other
 *  scripts. It checks for an active MSAL session and redirects
 *  unauthenticated users to Azure AD login automatically.
 *
 *  Usage (add to every HTML page <head> or top of <body>):
 *    <script src="https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js"></script>
 *    <script src="js/msalConfig.js"></script>
 *    <script src="js/authGuard.js"></script>
 *    <script src="js/auth.js"></script>
 * ============================================================
 */

var AuthGuard = (function () {

  /**
   * _msalInstance
   * ─────────────
   * Shared PublicClientApplication instance.
   * Created once here and reused by NexusAuth (auth.js).
   */
  var _msalInstance = null;

  /**
   * _init()
   * ───────
   * Initialises MSAL and handles the redirect response
   * that comes back from Azure AD after login.
   * Returns a Promise that resolves when ready.
   */
  function _init() {
    _msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);

    // Handle the redirect response (Azure AD sends the user back
    // here after a successful login with a code/token in the URL).
    return _msalInstance.handleRedirectPromise().then(function (response) {
      if (response && response.account) {
        // User just completed a login redirect — set the active account
        _msalInstance.setActiveAccount(response.account);
      }
    });
  }

  /**
   * protect()
   * ─────────
   * Call this at the top of every protected page.
   * - If a valid session exists → resolves with the account.
   * - If no session → triggers Azure AD login redirect.
   *
   * @returns {Promise<object>} Resolves with the MSAL account object.
   */
  function protect() {
    return _init().then(function () {
      var accounts = _msalInstance.getAllAccounts();

      if (accounts.length === 0) {
        // No active session — redirect to Azure AD login
        return _msalInstance.loginRedirect(LOGIN_REQUEST);
      }

      // Session found — set the first account as active
      _msalInstance.setActiveAccount(accounts[0]);
      return accounts[0];
    });
  }

  /**
   * getMsalInstance()
   * ─────────────────
   * Returns the shared MSAL PublicClientApplication instance
   * so that auth.js can reuse it without creating a second one.
   */
  function getMsalInstance() {
    return _msalInstance;
  }

  /**
   * getActiveAccount()
   * ──────────────────
   * Returns the currently active MSAL account, or null.
   */
  function getActiveAccount() {
    if (!_msalInstance) return null;
    return _msalInstance.getActiveAccount();
  }

  /**
   * renderUserBadge(containerId)
   * ────────────────────────────
   * Injects a small user identity badge (name + role + logout
   * button) into the element with the given ID.
   * Call this after protect() resolves.
   *
   * @param {string} containerId  ID of the DOM element to populate.
   */
  function renderUserBadge(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var account = getActiveAccount();
    if (!account) return;

    var name  = account.name  || account.username || "User";
    var email = account.username || "";

    // Determine NexusFlow role from Azure AD token claims
    var azureRoles = (account.idTokenClaims && account.idTokenClaims.roles) || [];
    var nexusRole  = DEFAULT_ROLE;
    for (var i = 0; i < azureRoles.length; i++) {
      if (NEXUSFLOW_ROLE_MAP[azureRoles[i]]) {
        nexusRole = NEXUSFLOW_ROLE_MAP[azureRoles[i]];
        break;
      }
    }

    container.innerHTML =
      '<div class="user-badge">' +
        '<div class="user-badge-avatar">' + name.charAt(0).toUpperCase() + '</div>' +
        '<div class="user-badge-info">' +
          '<div class="user-badge-name">'  + _escapeHtml(name)      + '</div>' +
          '<div class="user-badge-email">' + _escapeHtml(email)     + '</div>' +
          '<div class="user-badge-role">'  + _escapeHtml(nexusRole) + '</div>' +
        '</div>' +
        '<button class="btn btn-secondary btn-sm" onclick="NexusAuth.logout()">Sign Out</button>' +
      '</div>';
  }

  /**
   * _escapeHtml(str)
   * ────────────────
   * Safely escapes a string for insertion into HTML.
   * Prevents XSS from malicious display name values in tokens.
   */
  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#039;");
  }

  // ── Public API ──────────────────────────────────
  return {
    protect:          protect,
    getMsalInstance:  getMsalInstance,
    getActiveAccount: getActiveAccount,
    renderUserBadge:  renderUserBadge
  };

})();
