/**
 * ============================================================
 *  utils.js — NexusFlow Shared Utilities
 * ============================================================
 *  Common helper functions used across multiple pages.
 *  Imported via <script src="js/utils.js"></script>
 *
 *  Bug fixes in this version
 *  ─────────────────────────
 *  FIX 1 — formatCurrency(): callers may pass a string from
 *           form inputs. Calling .toFixed(2) on a string throws
 *           a TypeError. Fixed by parsing with parseFloat() first
 *           and returning "$0.00" for NaN/invalid values.
 *
 *  FIX 2 — searchFilter(): user query was passed directly into
 *           new RegExp() without sanitisation. Special regex
 *           characters like [, (, *, + threw a SyntaxError and
 *           crafted patterns could cause ReDoS.
 *           Fixed by escaping all special regex characters before
 *           constructing the RegExp.
 * ============================================================
 */

var NexusUtils = (function () {

  /**
   * formatCurrency(amount)
   * ─────────────────────
   * Formats a number (or numeric string) as a USD currency string.
   *
   * Examples:
   *   formatCurrency(1499.5)   →  "$1,499.50"
   *   formatCurrency("5000")   →  "$5,000.00"   (string input — now handled)
   *   formatCurrency("abc")    →  "$0.00"        (invalid input — safe fallback)
   *
   * FIX: Previously called amount.toFixed(2) directly, which threw
   *      TypeError when amount was a string (e.g. from a form input).
   *      Now coerces to a float first and falls back to 0 for NaN.
   *
   * @param  {number|string} amount  The monetary value to format.
   * @returns {string}               Formatted USD string.
   */
  function formatCurrency(amount) {
    // FIX: Coerce to float; guard against NaN / null / undefined
    var num = parseFloat(amount);
    if (isNaN(num)) num = 0;

    // Format with exactly 2 decimal places
    var fixed = num.toFixed(2);

    // Add thousands separator
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return "$" + parts.join(".");
  }


  /**
   * searchFilter(query, items, key)
   * ────────────────────────────────
   * Filters an array of objects by matching a search query
   * against a specified key (case-insensitive substring match).
   *
   * FIX: Previously passed the raw user query directly into
   *      new RegExp(), which:
   *        • Threw SyntaxError for inputs containing unescaped
   *          regex special characters (e.g. "[", "(", "*", "+").
   *        • Allowed ReDoS (Regular Expression Denial of Service)
   *          via crafted patterns.
   *      Fixed by escaping all special regex characters before
   *      constructing the RegExp.
   *
   * @param  {string}   query  User search string.
   * @param  {object[]} items  Array of objects to filter.
   * @param  {string}   key    Object property name to match against.
   * @returns {object[]}       Filtered array.
   */
  function searchFilter(query, items, key) {
    if (!query || !query.trim()) {
      return items;
    }

    // FIX: Escape all special regex metacharacters before building
    // the RegExp so that user input is treated as a literal string,
    // not as a regex pattern. This prevents SyntaxError and ReDoS.
    var safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    var pattern = new RegExp(safeQuery, "i");

    return items.filter(function (item) {
      return pattern.test(item[key]);
    });
  }


  /**
   * generateId(prefix)
   * ──────────────────
   * Generates a simple unique ID string.
   * No bugs — unchanged.
   *
   * @param  {string} [prefix="ID"]  Optional prefix.
   * @returns {string}               e.g. "PROJ-A3F9K2"
   */
  function generateId(prefix) {
    var random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return (prefix || "ID") + "-" + random;
  }


  /**
   * formatDate(dateStr)
   * ──────────────────
   * Formats a date string into a human-readable format.
   * No bugs — unchanged.
   *
   * @param  {string} dateStr  ISO date string (e.g. "2026-04-08").
   * @returns {string}         e.g. "Apr 8, 2026"
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
