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
   * Formats a number or numeric string as a USD currency string.
   *
   * FIX: Previously assumed `amount` was always a Number.
   *      Callers (e.g. invoices.html) pass a string from form
   *      inputs, causing .toFixed(2) to throw a TypeError.
   *      Now safely parses the input with parseFloat() first.
   *
   * Expected usage:
   *   NexusUtils.formatCurrency(1499.5)   →  "$1,499.50"
   *   NexusUtils.formatCurrency("5000")   →  "$5,000.00"
   */
  function formatCurrency(amount) {
    // FIX: Parse to float first so string inputs work correctly
    var num = parseFloat(amount);
    if (isNaN(num)) {
      return '$0.00';
    }

    // Format with 2 decimal places
    var fixed = num.toFixed(2);

    // Add thousands separator
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return '$' + parts.join('.');
  }


  /**
   * searchFilter(query, items, key)
   * ────────────────────────────────
   * Filters an array of objects by matching a regex against
   * a specified key.
   *
   * FIX: The user's search query is now escaped before being
   *   passed into `new RegExp()`. This prevents SyntaxErrors
   *   from special regex characters like [, (, *, + and also
   *   mitigates ReDoS (Regular Expression Denial of Service).
   */
  function searchFilter(query, items, key) {
    if (!query || !query.trim()) {
      return items;
    }

    // FIX: Escape special regex characters in user input
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var pattern = new RegExp(escaped, 'i');

    return items.filter(function (item) {
      return pattern.test(item[key]);
    });
  }


  /**
   * generateId(prefix)
   * ───────────────────
   * Generates a simple unique ID string.
   */
  function generateId(prefix) {
    var random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return (prefix || 'ID') + '-' + random;
  }


  /**
   * formatDate(dateStr)
   * ────────────────────
   * Formats a date string into a readable format.
   */
  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }


  // ── Public API ──────────────────────────────────
  return {
    formatCurrency: formatCurrency,
    searchFilter  : searchFilter,
    generateId    : generateId,
    formatDate    : formatDate
  };

})();
