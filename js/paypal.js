/**
 * ============================================================
 *  paypal.js — NexusFlow PayPal Payment Gateway Integration
 * ============================================================
 *  Handles all PayPal-related logic:
 *    - Loading the PayPal JS SDK dynamically
 *    - Rendering the PayPal Smart Payment Button
 *    - Creating and capturing PayPal orders
 *    - Exposing a clean public API via NexusPayPal
 *
 *  USAGE:
 *    NexusPayPal.init({
 *      clientId: 'YOUR_PAYPAL_CLIENT_ID',   // from PayPal Developer Dashboard
 *      currency: 'USD',                      // default: 'USD'
 *      intent:   'capture'                   // default: 'capture'
 *    });
 *
 *    NexusPayPal.renderButton({
 *      containerId: 'paypal-button-container',
 *      amount:      '99.00',
 *      description: 'Invoice INV-0042 — Web Development',
 *      onSuccess:   function(details) { ... },
 *      onError:     function(err)     { ... },
 *      onCancel:    function()        { ... }
 *    });
 *
 *  CONFIGURATION:
 *    Replace PAYPAL_CLIENT_ID below with your actual Sandbox
 *    or Live Client ID from https://developer.paypal.com
 * ============================================================
 */

var NexusPayPal = (function () {

  /* ── Internal State ──────────────────────────────── */
  var _config = {
    clientId : 'YOUR_PAYPAL_CLIENT_ID',   // ← Replace with real Client ID
    currency  : 'USD',
    intent    : 'capture',
    sdkLoaded : false
  };

  var _sdkLoadPromise = null;


  /* ══════════════════════════════════════════════════
   *  init(options)
   * ══════════════════════════════════════════════════
   *  Call once on page load to configure the module.
   *  Must be called before renderButton().
   *
   *  @param {Object} options
   *    clientId  {string}  PayPal App Client ID
   *    currency  {string}  ISO 4217 currency code (default: 'USD')
   *    intent    {string}  'capture' | 'authorize'  (default: 'capture')
   * ══════════════════════════════════════════════════ */
  function init(options) {
    if (!options || !options.clientId) {
      console.error('[NexusPayPal] init() requires a clientId.');
      return;
    }
    _config.clientId = options.clientId;
    _config.currency  = options.currency  || 'USD';
    _config.intent    = options.intent    || 'capture';
    console.log('[NexusPayPal] Initialized. Currency:', _config.currency, '| Intent:', _config.intent);
  }


  /* ══════════════════════════════════════════════════
   *  _loadSDK()
   * ══════════════════════════════════════════════════
   *  Dynamically injects the PayPal JS SDK <script>
   *  tag into the document. Returns a Promise that
   *  resolves when the SDK is ready.
   *
   *  The SDK URL format:
   *    https://www.paypal.com/sdk/js
   *      ?client-id=<CLIENT_ID>
   *      &currency=<CURRENCY>
   *      &intent=<INTENT>
   *
   *  Caches the promise so the SDK is only loaded once
   *  even if renderButton() is called multiple times.
   * ══════════════════════════════════════════════════ */
  function _loadSDK() {
    if (_config.sdkLoaded && window.paypal) {
      return Promise.resolve();
    }

    if (_sdkLoadPromise) {
      return _sdkLoadPromise;
    }

    _sdkLoadPromise = new Promise(function (resolve, reject) {
      var existingScript = document.getElementById('paypal-sdk-script');
      if (existingScript) {
        existingScript.parentNode.removeChild(existingScript);
      }

      var script = document.createElement('script');
      script.id  = 'paypal-sdk-script';
      script.src =
        'https://www.paypal.com/sdk/js' +
        '?client-id=' + encodeURIComponent(_config.clientId) +
        '&currency='  + encodeURIComponent(_config.currency) +
        '&intent='    + encodeURIComponent(_config.intent);

      script.onload = function () {
        _config.sdkLoaded = true;
        _sdkLoadPromise   = null;
        console.log('[NexusPayPal] SDK loaded successfully.');
        resolve();
      };

      script.onerror = function () {
        _sdkLoadPromise = null;
        var err = new Error('[NexusPayPal] Failed to load PayPal SDK. Check your Client ID and network.');
        console.error(err.message);
        reject(err);
      };

      document.head.appendChild(script);
    });

    return _sdkLoadPromise;
  }


  /* ══════════════════════════════════════════════════
   *  renderButton(options)
   * ══════════════════════════════════════════════════
   *  Loads the PayPal SDK (if not already loaded) and
   *  renders the Smart Payment Button into the given
   *  container element.
   *
   *  @param {Object} options
   *    containerId  {string}    ID of the DOM element to render into
   *    amount       {string}    Payment amount, e.g. '99.00'
   *    description  {string}    Item/invoice description
   *    onSuccess    {Function}  Called with PayPal order details on success
   *    onError      {Function}  Called with Error on failure
   *    onCancel     {Function}  Called when user cancels the payment
   * ══════════════════════════════════════════════════ */
  function renderButton(options) {
    if (!options || !options.containerId) {
      console.error('[NexusPayPal] renderButton() requires a containerId.');
      return;
    }

    var containerId  = options.containerId;
    var amount       = options.amount       || '0.00';
    var description  = options.description  || 'NexusFlow Payment';
    var onSuccess    = options.onSuccess    || function () {};
    var onError      = options.onError      || function () {};
    var onCancel     = options.onCancel     || function () {};

    /* Clear any previously rendered button */
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('[NexusPayPal] Container #' + containerId + ' not found in DOM.');
      return;
    }
    container.innerHTML = '';

    /* Show loading state while SDK loads */
    container.innerHTML = '<div class="paypal-loading">Loading PayPal...</div>';

    _loadSDK()
      .then(function () {
        container.innerHTML = '';

        window.paypal.Buttons({

          /* ── Style ─────────────────────────────── */
          style: {
            layout : 'vertical',
            color  : 'gold',
            shape  : 'rect',
            label  : 'pay',
            height : 45
          },

          /* ── Create Order ───────────────────────
           *  Called when the user clicks the button.
           *  Sends order details to PayPal and returns
           *  an order ID.
           *
           *  In production, the createOrder call should
           *  go through YOUR backend server to keep the
           *  Client Secret safe. Here we use the
           *  client-side actions.order.create() for
           *  sandbox/demo purposes.
           * ─────────────────────────────────────── */
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                description: description,
                amount: {
                  currency_code : _config.currency,
                  value         : parseFloat(amount).toFixed(2)
                }
              }]
            });
          },

          /* ── On Approve ─────────────────────────
           *  Called after the user approves payment
           *  in the PayPal popup. Captures the order
           *  and calls the onSuccess callback.
           *
           *  In production, the capture step should
           *  also be done server-side via:
           *    POST /v2/checkout/orders/{id}/capture
           * ─────────────────────────────────────── */
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              console.log('[NexusPayPal] Payment captured:', details.id);
              onSuccess(details);
            });
          },

          /* ── On Error ───────────────────────────
           *  Called when an error occurs during the
           *  payment flow (network issues, etc.).
           * ─────────────────────────────────────── */
          onError: function (err) {
            console.error('[NexusPayPal] Payment error:', err);
            onError(err);
          },

          /* ── On Cancel ──────────────────────────
           *  Called when the user closes the PayPal
           *  popup without completing payment.
           * ─────────────────────────────────────── */
          onCancel: function (data) {
            console.log('[NexusPayPal] Payment cancelled by user.');
            onCancel(data);
          }

        }).render('#' + containerId);
      })
      .catch(function (err) {
        container.innerHTML =
          '<div class="paypal-error">⚠ Could not load PayPal. Please refresh and try again.</div>';
        onError(err);
      });
  }


  /* ══════════════════════════════════════════════════
   *  getConfig()
   * ══════════════════════════════════════════════════
   *  Returns a read-only copy of the current config.
   *  Useful for debugging.
   * ══════════════════════════════════════════════════ */
  function getConfig() {
    return {
      clientId : _config.clientId,
      currency  : _config.currency,
      intent    : _config.intent,
      sdkLoaded : _config.sdkLoaded
    };
  }


  /* ── Public API ──────────────────────────────────── */
  return {
    init        : init,
    renderButton: renderButton,
    getConfig   : getConfig
  };

})();
