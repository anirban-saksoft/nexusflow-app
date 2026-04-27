/**
 * ============================================================
 *  utils.js — NexusFlow Shared Utilities
 * ============================================================
 *  Common helper functions used across multiple pages.
 *  Imported via <script src="js/utils.js"></script>
 * ============================================================
 */

var NexusUtils = (function () {

  /**
   * formatCurrency(amount)
   * ───────────────────────
   * Formats a number as a USD currency string.
   *
   * Expected usage:
   *   NexusUtils.formatCurrency(1499.5)  →  "$1,499.50"
   *
   * BUG: This function assumes `amount` is always a number,
   *      but callers may pass a string from form inputs.
   *      Calling .toFixed(2) on a string throws a TypeError.
   *      The correct fix would be to parse the input first:
   *        var num = parseFloat(amount);
   */
  function formatCurrency(amount) {
    // Attempt to format with 2 decimal places
    var fixed = amount.toFixed(2);

    // Add thousands separator
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return "$" + parts.join(".");
  }


  /**
   * searchFilter(query, items, key)
   * ────────────────────────────────
   * Filters an array of objects by matching a regex against
   * a specified key.
   *
   * VULNERABILITY: The user's search query is passed directly
   *   into `new RegExp()` without sanitization. Special regex
   *   characters like [, (, *, + will throw a SyntaxError.
   *   An attacker could also craft ReDoS patterns.
   *
   *   The safe approach would be to escape special characters:
   *     query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   */
  function searchFilter(query, items, key) {
    if (!query || !query.trim()) {
      return items;
    }

    // BUG: Unsanitized user input goes directly into RegExp
    var pattern = new RegExp(query, "i");

    return items.filter(function (item) {
      return pattern.test(item[key]);
    });
  }


  /**
   * generateId(prefix)
   * ───────────────────
   * Generates a simple unique ID string.
   * This function is clean — no bugs here.
   */
  function generateId(prefix) {
    var random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return (prefix || "ID") + "-" + random;
  }


  /**
   * formatDate(dateStr)
   * ────────────────────
   * Formats a date string into a readable format.
   * This function is clean — no bugs here.
   */
  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }


  // ── Public API ──────────────────────────────────
  return {
    formatCurrency: formatCurrency,
    searchFilter:   searchFilter,
    generateId:     generateId,
    formatDate:     formatDate
  };

})();
