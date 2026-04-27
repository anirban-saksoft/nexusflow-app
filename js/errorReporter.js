/**
 * ============================================================
 *  ErrorReporter.js — NexusFlow
 * ============================================================
 *  Catches errors and sends them to a webhook (like n8n) so
 *  an AI agent can analyze them.
 *
 *  SETUP: Edit the CONFIG section below with your details.
 * ============================================================
 */

var ErrorReporter = (function () {

  // ──────────────────────────────────────────────────
  //  CONFIG — Edit these values once for your project.
  // ──────────────────────────────────────────────────
  var CONFIG = {
    webhookUrl:  "https://demoapps4.app.n8n.cloud/webhook/triage-issue",
    appName:     "NexusFlow",
    environment: "production",
    repoOwner:   "anirban-ceptes",
    repoName:    "nexusflow-app"
  };
  // ──────────────────────────────────────────────────


  function _parseError(error) {
    if (typeof error === "string") {
      return {
        message: error,
        stack_trace: null,
        error_type: "StringError"
      };
    }
    return {
      message: error.message || String(error),
      stack_trace: error.stack || null,
      error_type: error.name || "Error"
    };
  }


  function _buildPayload(options) {
    var errorInfo = _parseError(options.error);

    return {
      error_type:    errorInfo.error_type,
      error_message: errorInfo.message,
      stack_trace:   errorInfo.stack_trace,
      source_file:   options.source_file || "unknown",
      title:         options.title || errorInfo.message,
      priority:      options.priority || "medium",
      context:       options.context || {},
      repo_owner:    CONFIG.repoOwner,
      repo_name:     CONFIG.repoName,
      app_name:      CONFIG.appName,
      environment:   CONFIG.environment,
      timestamp:     new Date().toISOString(),
      page_url:      window.location.href
    };
  }


  function _send(payload) {
    console.log(JSON.stringify(payload, null, 2));

    fetch(CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(function (response) {
      if (!response.ok) {
        console.error("[ErrorReporter] Webhook returned status: " + response.status);
      }
    })
    .catch(function (err) {
      console.error("[ErrorReporter] Could not reach webhook:", err.message);
    });
  }


  return {
    report: function (options) {
      if (!options || !options.error) {
        console.error("[ErrorReporter] You must pass an error. Example: ErrorReporter.report({ error: e })");
        return;
      }
      var payload = _buildPayload(options);
      _send(payload);
    }
  };

})();
