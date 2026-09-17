/**
 * ============================================================
 *  msalConfig.js — Azure AD / MSAL Configuration
 * ============================================================
 *  Replace the placeholder values below with your real
 *  Azure App Registration details from the Azure Portal.
 *
 *  Steps to obtain these values:
 *  1. Go to Azure Portal → Azure Active Directory → App Registrations
 *  2. Create a new registration (or open an existing one)
 *  3. Copy the "Application (client) ID"  → AZURE_CLIENT_ID
 *  4. Copy the "Directory (tenant) ID"    → AZURE_TENANT_ID
 *  5. Under "Authentication", add a Single-Page Application
 *     redirect URI matching your hosted URL (or localhost for dev)
 *  6. Under "App roles", create roles: admin, manager, member, viewer
 *  7. Enable "ID tokens" under Authentication → Implicit grant
 * ============================================================
 */

var MSAL_CONFIG = {

  /**
   * auth — Core Azure AD identity settings
   */
  auth: {
    // ⚠️  Replace with your Azure App Registration Client ID
    clientId: "YOUR_AZURE_CLIENT_ID",

    // ⚠️  Replace with your Azure Tenant ID
    //     Use "common" to support multi-tenant / personal accounts
    authority: "https://login.microsoftonline.com/YOUR_AZURE_TENANT_ID",

    // ⚠️  Must exactly match a Redirect URI registered in Azure Portal
    //     For local dev: "http://localhost:3000"
    //     For production: "https://your-app.example.com"
    redirectUri: window.location.origin,

    // After logout, redirect back to the app root
    postLogoutRedirectUri: window.location.origin
  },

  /**
   * cache — Token storage strategy
   *   "sessionStorage" — tokens cleared when tab closes (more secure)
   *   "localStorage"   — tokens persist across tabs/sessions
   */
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false   // Set true only if you need IE11 support
  },

  /**
   * system — MSAL logging (disable or reduce in production)
   */
  system: {
    loggerOptions: {
      loggerCallback: function (level, message, containsPii) {
        if (containsPii) return;  // Never log PII
        switch (level) {
          case msal.LogLevel.Error:   console.error("[MSAL]", message); break;
          case msal.LogLevel.Warning: console.warn("[MSAL]",  message); break;
          case msal.LogLevel.Info:    console.info("[MSAL]",  message); break;
          case msal.LogLevel.Verbose: console.debug("[MSAL]", message); break;
        }
      },
      piiLoggingEnabled: false
    }
  }
};

/**
 * LOGIN_REQUEST — Scopes requested at login time.
 * "openid", "profile", "email" give us the user's
 * basic identity claims from the ID token.
 */
var LOGIN_REQUEST = {
  scopes: ["openid", "profile", "email"]
};

/**
 * TOKEN_REQUEST — Scopes for acquiring an access token
 * after login (e.g. to call Microsoft Graph API).
 * Add "User.Read" to fetch the user's profile photo,
 * manager, or group memberships from Graph.
 */
var TOKEN_REQUEST = {
  scopes: ["openid", "profile", "email", "User.Read"]
};

/**
 * NEXUSFLOW_ROLE_MAP
 * ──────────────────
 * Maps Azure AD App Role values (defined in your App Registration
 * manifest under "appRoles") to NexusFlow internal role names.
 *
 * The Azure role value is what appears in the "roles" claim
 * of the ID token. Make sure these strings match exactly what
 * you configured in the Azure Portal App Roles.
 */
var NEXUSFLOW_ROLE_MAP = {
  "NexusFlow.Admin":   "admin",
  "NexusFlow.Manager": "manager",
  "NexusFlow.Member":  "member",
  "NexusFlow.Viewer":  "viewer"
};

/**
 * DEFAULT_ROLE
 * ────────────
 * Fallback role assigned to authenticated users who have
 * no matching App Role assigned in Azure AD.
 */
var DEFAULT_ROLE = "viewer";
