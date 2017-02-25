(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var fetchJsonp = require('fetch-jsonp');
var roundTo = require('round-to');
var ta = require('./ta');
window.ta = ta;

function getHistoricalData() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      symbol = _ref.symbol,
      from = _ref.from,
      to = _ref.to;

  var url = 'https://query.yahooapis.com/v1/public/yql?q=select * from yahoo.finance.historicaldata where symbol = "' + symbol + '" and startDate = "' + from + '" and endDate = "' + to + '"&env=store://datatables.org/alltableswithkeys&format=json';
  return fetchJsonp(url).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var data = json.query.results.quote;
    return {
      date: data.map(function (entry) {
        return entry.Date;
      }),
      open: data.map(function (entry) {
        return Number.parseFloat(entry.Open);
      }),
      close: data.map(function (entry) {
        return Number.parseFloat(entry.Close);
      }),
      high: data.map(function (entry) {
        return Number.parseFloat(entry.High);
      }),
      low: data.map(function (entry) {
        return Number.parseFloat(entry.Low);
      }),
      volume: data.map(function (entry) {
        return Number.parseFloat(entry.Volume);
      }),
      adjClose: data.map(function (entry) {
        return Number.parseFloat(entry.Adj_Close);
      })
    };
  });
}

function getIndicators(_ref2) {
  var symbol = _ref2.symbol,
      options = _ref2.options;

  var opts = Object.assign({
    symbol: symbol,
    period: 'd'
  }, options);

  function padMonthDate(num) {
    return ('0' + num).slice(-2);
  }

  var ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  if (opts.from == null) {
    opts.from = ninetyDaysAgo.getFullYear() + '-' + padMonthDate(ninetyDaysAgo.getMonth() + 1) + '-' + padMonthDate(ninetyDaysAgo.getDate());
  }
  var today = new Date();
  if (opts.to == null) {
    opts.to = today.getFullYear() + '-' + padMonthDate(today.getMonth() + 1) + '-' + padMonthDate(today.getDate());
  }

  return getHistoricalData(opts).then(function (data) {
    return {
      options: opts,
      close: data.close,
      high: data.high,
      low: data.low,
      ema20: ta.EMA({ data: data.close, period: 10 }),
      ema50: ta.EMA({ data: data.close, period: 50 }),
      bbands: ta.BBANDS({ data: data.close }),
      kelt: ta.KELT({ high: data.high, low: data.low, close: data.close }),
      macd: ta.MACD({ data: data.close }),
      atr: ta.ATR({ high: data.high, low: data.low, close: data.close }),
      aroon: ta.AROON({ high: data.high, low: data.low }),
      rsi: ta.RSI({ data: data.close }),
      stochrsi: ta.StochRSI({ data: data.close }),
      stochrsiema5: ta.EMA({ data: ta.StochRSI({ data: data.close }).filter(function (num) {
          return !Number.isNaN(num);
        }), period: 5 }),
      adx: ta.ADX({ high: data.high, low: data.low, close: data.close })
    };
  });
}

function padMonthDate(num) {
  return ('0' + num).slice(-2);
}

function dateToLabel(date) {
  return date.getFullYear() + '-' + padMonthDate(date.getMonth() + 1) + '-' + padMonthDate(date.getDate());
}

function getStockDatesInRange(from, to) {
  var myDate = new Date(from.getTime());
  myDate.setHours(0, 0, 0);
  var arr = [];
  while (myDate.getTime() < to.getTime()) {
    myDate.setDate(myDate.getDate() + 1);
    if (myDate.getDay() !== 0 && myDate.getDay() !== 6) {
      arr.push(new Date(myDate.getTime()));
    }
  }
  return arr;
}

function padData(data, length) {
  while (data.length < length) {
    data.push(null);
  }
  return data;
}

var fromEl = document.getElementById('from');
var toEl = document.getElementById('to');

var ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
fromEl.value = ninetyDaysAgo.getFullYear() + '-' + padMonthDate(ninetyDaysAgo.getMonth() + 1) + '-' + padMonthDate(ninetyDaysAgo.getDate());
var today = new Date();
toEl.value = today.getFullYear() + '-' + padMonthDate(today.getMonth() + 1) + '-' + padMonthDate(today.getDate());

var optionsEl = document.getElementById('options');
document.getElementById('options-toggle').addEventListener('click', function () {
  optionsEl.classList.toggle('hidden');
});

var searchEl = document.getElementById('search');

var symbolInput = document.getElementById('symbol');
symbolInput.addEventListener('input', function () {
  symbolInput.value = symbolInput.value.toUpperCase();
});
symbolInput.addEventListener('keypress', function (e) {
  if (e.which === 13 || e.keyCode === 13) {
    searchEl.click();
  }
});

searchEl.addEventListener('click', function () {
  if (!symbol.value.length) return;
  var from = fromEl.value;
  var to = toEl.value;
  getIndicators({ symbol: symbol.value, options: {
      from: from, to: to
    } }).then(function (data) {
    console.log(data);

    var chartsEl = document.getElementById('charts');
    while (chartsEl.firstChild) {
      chartsEl.removeChild(chartsEl.firstChild);
    }

    var labels = getStockDatesInRange(new Date(Date.parse(data.options.from)), new Date(Date.parse(data.options.to))).map(dateToLabel);
    while (labels.length > data.close.length) {
      labels.shift();
    }

    var charts = [{
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Close',
          data: data.close.reverse(),
          borderColor: 'white',
          backgroundColor: 'white',
          lineTension: 0.1
        }, {
          label: 'EMA(20)',
          data: padData(data.ema20, data.close.length).reverse(),
          borderColor: 'grey',
          backgroundColor: 'grey'
        }, {
          label: 'EMA(50)',
          data: padData(data.ema50, data.close.length).reverse(),
          borderColor: 'black',
          backgroundColor: 'black'
        }, {
          label: 'KELT Upper',
          data: padData(data.kelt.upper, data.close.length).reverse(),
          borderColor: 'red',
          borderDash: [8, 4],
          backgroundColor: 'red'
        }, {
          label: 'KELT Lower',
          data: padData(data.kelt.lower, data.close.length).reverse(),
          borderColor: 'red',
          borderDash: [8, 4],
          backgroundColor: 'red'
        }]
      },
      options: {
        title: {
          text: 'Price & Bands'
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Up',
          data: padData(data.aroon.up, data.close.length).reverse(),
          borderColor: 'green',
          backgroundColor: 'green'
        }, {
          label: 'Down',
          data: padData(data.aroon.down, data.close.length).reverse(),
          borderColor: 'red',
          backgroundColor: 'red'
        }, {
          data: Array(data.close.length).fill(50),
          borderColor: 'black',
          borderDash: [4, 4],
          backgroundColor: 'black',
          pointHoverRadius: 0
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              max: 100,
              min: 0,
              stepSize: 10
            }
          }]
        },
        title: {
          text: 'AROON'
        },
        tooltips: {
          filter: function filter(item) {
            return item.datasetIndex === 0 || item.datasetIndex === 1;
          }
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'AROON Osc',
          data: padData(data.aroon.oscillator, data.close.length).reverse(),
          fill: true,
          borderColor: 'blue',
          backgroundColor: 'rgba(200,200,200,0.35)'
        }, {
          data: Array(data.close.length).fill(90),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }, {
          data: Array(data.close.length).fill(-90),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }]
      },
      options: {
        title: {
          text: 'AROON Osc'
        },
        scales: {
          yAxes: [{
            ticks: {
              max: 100,
              min: -100,
              stepSize: 50
            }
          }]
        },
        tooltips: {
          filter: function filter(item) {
            return item.datasetIndex === 0;
          }
        }
      }
    }, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'MACD',
          type: 'line',
          data: padData(data.macd.macd, data.close.length).reverse(),
          borderColor: 'lightblue',
          backgroundColor: 'lightblue'
        }, {
          label: 'MACD Signal',
          type: 'line',
          data: padData(data.macd.signal, data.close.length).reverse(),
          borderColor: 'orange',
          backgroundColor: 'orange'
        }, {
          label: 'MACD Histogram',
          data: padData(data.macd.histogram, data.close.length).reverse(),
          borderColor: 'grey',
          backgroundColor: 'grey'
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              max: roundTo.up(Math.max(Math.max.apply(Math, _toConsumableArray(data.macd.signal.map(Math.abs))), Math.max.apply(Math, _toConsumableArray(data.macd.macd.map(Math.abs)))), 1),
              min: -1 * roundTo.up(Math.max(Math.max.apply(Math, _toConsumableArray(data.macd.signal.map(Math.abs))), Math.max.apply(Math, _toConsumableArray(data.macd.macd.map(Math.abs)))), 1)
            }
          }]
        },
        title: {
          text: 'MACD'
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'RSI',
          data: padData(data.rsi, data.close.length).reverse(),
          borderColor: 'white',
          backgroundColor: 'white'
        }, {
          data: Array(data.close.length).fill(70),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }, {
          data: Array(data.close.length).fill(30),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }]
      },
      options: {
        title: {
          text: 'RSI'
        },
        scales: {
          yAxes: [{
            ticks: {
              max: 100,
              min: 0,
              stepSize: 10
            }
          }]
        },
        tooltips: {
          filter: function filter(item) {
            return item.datasetIndex === 0;
          }
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'StochRSI',
          data: padData(data.stochrsi, data.close.length).reverse(),
          borderColor: 'white',
          backgroundColor: 'white'
        }, {
          label: 'EMA(5)',
          data: padData(data.stochrsiema5, data.close.length).reverse(),
          borderColor: 'grey',
          backgroundColor: 'grey'
        }, {
          data: Array(data.close.length).fill(0.8),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }, {
          data: Array(data.close.length).fill(0.2),
          borderColor: 'grey',
          backgroundColor: 'grey',
          pointHoverRadius: 0
        }, {
          data: Array(data.close.length).fill(0.5),
          borderColor: 'black',
          borderDash: [4, 4],
          backgroundColor: 'black',
          pointHoverRadius: 0
        }]
      },
      options: {
        title: {
          text: 'StochRSI'
        },
        scales: {
          yAxes: [{
            ticks: {
              max: 1,
              min: 0,
              stepSize: 0.1
            }
          }]
        },
        tooltips: {
          filter: function filter(item) {
            return item.datasetIndex === 0 || item.datasetIndex === 1;
          }
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ATR',
          data: padData(data.atr, data.close.length).reverse(),
          borderColor: 'white',
          backgroundColor: 'white'
        }]
      },
      options: {
        title: {
          text: 'ATR'
        }
      }
    }, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '+DI',
          data: padData(data.adx.pDI, data.close.length).reverse(),
          borderColor: 'green',
          backgroundColor: 'green'
        }, {
          label: '-DI',
          data: padData(data.adx.mDI, data.close.length).reverse(),
          borderColor: 'red',
          backgroundColor: 'red'
        }, {
          label: 'ADX',
          data: padData(data.adx.adx, data.close.length).reverse(),
          borderColor: 'black',
          backgroundColor: 'black'
        }, {
          data: Array(data.close.length).fill(20),
          borderColor: 'blue',
          borderWidth: 1,
          backgroundColor: 'blue',
          pointHoverRadius: 0
        }]
      },
      options: {
        title: {
          text: 'ADX'
        },
        tooltips: {
          filter: function filter(item) {
            var include = [0, 1, 2];
            return include.indexOf(item.datasetIndex) !== -1;
          }
        }
      }
    }];

    var row = void 0;
    for (var i = 0; i < charts.length; i++) {
      if (i % 2 === 0) {
        row = document.createElement('div');
        row.classList = 'row';
        chartsEl.appendChild(row);
      }
      var col = document.createElement('div');
      // TODO: probably need custom breakpoints or minimum chart sizes to make this more responsive
      col.classList = 'col-lg-6';
      var canvas = document.createElement('canvas');
      col.appendChild(canvas);
      row.appendChild(col);
      new Chart(canvas, charts[i]);
    }
  }).catch(function (err) {
    console.error(err);
  });
});

},{"./ta":211,"fetch-jsonp":3,"round-to":11}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod);
    global.fetchJsonp = mod.exports;
  }
})(this, function (exports, module) {
  'use strict';

  var defaultOptions = {
    timeout: 5000,
    jsonpCallback: 'callback',
    jsonpCallbackFunction: null
  };

  function generateCallbackFunction() {
    return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
  }

  // Known issue: Will throw 'Uncaught ReferenceError: callback_*** is not defined'
  // error if request timeout
  function clearFunction(functionName) {
    // IE8 throws an exception when you try to delete a property on window
    // http://stackoverflow.com/a/1824228/751089
    try {
      delete window[functionName];
    } catch (e) {
      window[functionName] = undefined;
    }
  }

  function removeScript(scriptId) {
    var script = document.getElementById(scriptId);
    document.getElementsByTagName('head')[0].removeChild(script);
  }

  function fetchJsonp(_url) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    // to avoid param reassign
    var url = _url;
    var timeout = options.timeout || defaultOptions.timeout;
    var jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

    var timeoutId = undefined;

    return new Promise(function (resolve, reject) {
      var callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
      var scriptId = jsonpCallback + '_' + callbackFunction;

      window[callbackFunction] = function (response) {
        resolve({
          ok: true,
          // keep consistent with fetch API
          json: function json() {
            return Promise.resolve(response);
          }
        });

        if (timeoutId) clearTimeout(timeoutId);

        removeScript(scriptId);

        clearFunction(callbackFunction);
      };

      // Check if the user set their own params, and if not add a ? to start a list of params
      url += url.indexOf('?') === -1 ? '?' : '&';

      var jsonpScript = document.createElement('script');
      jsonpScript.setAttribute('src', '' + url + jsonpCallback + '=' + callbackFunction);
      jsonpScript.id = scriptId;
      document.getElementsByTagName('head')[0].appendChild(jsonpScript);

      timeoutId = setTimeout(function () {
        reject(new Error('JSONP request to ' + _url + ' timed out'));

        clearFunction(callbackFunction);
        removeScript(scriptId);
      }, timeout);
    });
  }

  // export as global function
  /*
  let local;
  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }
  local.fetchJsonp = fetchJsonp;
  */

  module.exports = fetchJsonp;
});
},{}],4:[function(require,module,exports){
'use strict';

module.exports = Response;

/**
 * A response from a web request
 *
 * @param {Number} statusCode
 * @param {Object} headers
 * @param {Buffer} body
 * @param {String} url
 */
function Response(statusCode, headers, body, url) {
  if (typeof statusCode !== 'number') {
    throw new TypeError('statusCode must be a number but was ' + (typeof statusCode));
  }
  if (headers === null) {
    throw new TypeError('headers cannot be null');
  }
  if (typeof headers !== 'object') {
    throw new TypeError('headers must be an object but was ' + (typeof headers));
  }
  this.statusCode = statusCode;
  this.headers = {};
  for (var key in headers) {
    this.headers[key.toLowerCase()] = headers[key];
  }
  this.body = body;
  this.url = url;
}

Response.prototype.getBody = function (encoding) {
  if (this.statusCode >= 300) {
    var err = new Error('Server responded with status code '
                    + this.statusCode + ':\n' + this.body.toString());
    err.statusCode = this.statusCode;
    err.headers = this.headers;
    err.body = this.body;
    err.url = this.url;
    throw err;
  }
  return encoding ? this.body.toString(encoding) : this.body;
};

},{}],5:[function(require,module,exports){
//! moment.js
//! version : 2.14.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        return Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        var k;
        for (k in obj) {
            // even if its not own property I'd still call it non-empty
            return false;
        }
        return true;
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            m._isValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                m._isValid = m._isValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    function isUndefined(input) {
        return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (utils_hooks__hooks.deprecationHandler != null) {
                utils_hooks__hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(arguments).join(', ') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (utils_hooks__hooks.deprecationHandler != null) {
            utils_hooks__hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
        if (mom.isValid()) {
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = create_utc__createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return units_month__handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (typeof value !== 'number') {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        //the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = create_utc__createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = create_utc__createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        ordinalParse: defaultOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    // treat as if there is no base config
                    deprecateSimple('parentLocaleUndefined',
                            'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, parentConfig = baseConfig;
            // MERGE
            if (locales[name] != null) {
                parentConfig = locales[name]._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function locale_locales__listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(utils_hooks__hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (isDate(input)) {
            config._d = input;
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!valid__isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date(utils_hooks__hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = local__createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return valid__createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = ((string || '').match(matcher) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
            } else if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(matchOffset, this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : local__createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            delta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 local__createLocal(time).isValid())) {
            return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = lists__get(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = locale_locales__getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return lists__get(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = lists__get(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes <= 1           && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   <= 1           && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    <= 1           && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  <= 1           && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   <= 1           && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.14.1';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],6:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

},{}],7:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":6,"./parse":8,"./stringify":9}],8:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    parameterLimit: 1000,
    plainObjects: false,
    strictNullHandling: false
};

var parseValues = function parseValues(str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos));
            val = options.decoder(part.slice(pos + 1));
        }
        if (has.call(obj, key)) {
            obj[key] = [].concat(obj[key]).concat(val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function parseObject(chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = parseObject(chain, val, options);
        }
    }

    return obj;
};

var parseKeys = function parseKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":10}],9:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var formats = require('./formats');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var toISO = Date.prototype.toISOString;

var defaults = {
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, formatter) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder ? encoder(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            return [formatter(encoder(prefix)) + '=' + formatter(encoder(obj))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        } else {
            values = values.concat(stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = encode ? (typeof options.encoder === 'function' ? options.encoder : defaults.encoder) : null;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    if (typeof options.format === 'undefined') {
        options.format = formats.default;
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter
        ));
    }

    return keys.join(delimiter);
};

},{"./formats":6,"./utils":10}],10:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = exports.merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (obj[i] && typeof obj[i] === 'object') {
                compacted.push(exports.compact(obj[i], refs));
            } else if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    keys.forEach(function (key) {
        obj[key] = exports.compact(obj[key], refs);
    });

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],11:[function(require,module,exports){
'use strict';

function round(fn, val, precision) {
	if (typeof val !== 'number') {
		throw new TypeError('Expected value to be a number');
	}

	if (!Number.isInteger(precision)) {
		throw new TypeError('Expected precision to be an integer');
	}

	const exponent = precision > 0 ? 'e' : 'e-';
	const exponentNeg = precision > 0 ? 'e-' : 'e';
	precision = Math.abs(precision);

	if (fn === 'round') {
		return Number(Math.sign(val) * (Math.round(Math.abs(val) + exponent + precision) + exponentNeg + precision));
	}

	return Number(Math[fn](val + exponent + precision) + exponentNeg + precision);
}

module.exports = round.bind(null, 'round');
module.exports.up = round.bind(null, 'ceil');
module.exports.down = round.bind(null, 'floor');

},{}],12:[function(require,module,exports){
'use strict';

var Response = require('http-response-object');
var handleQs = require('then-request/lib/handle-qs.js');

module.exports = doRequest;
function doRequest(method, url, options) {
  var xhr = new XMLHttpRequest();

  // check types of arguments

  if (typeof method !== 'string') {
    throw new TypeError('The method must be a string.');
  }
  if (typeof url !== 'string') {
    throw new TypeError('The URL/path must be a string.');
  }
  if (options === null || options === undefined) {
    options = {};
  }
  if (typeof options !== 'object') {
    throw new TypeError('Options must be an object (or null).');
  }
  
  method = method.toUpperCase();
  options.headers = options.headers || {};

  // handle cross domain

  var match;
  var crossDomain = !!((match = /^([\w-]+:)?\/\/([^\/]+)/.exec(options.uri)) && (match[2] != location.host));
  if (!crossDomain) options.headers['X-Requested-With'] = 'XMLHttpRequest';

  // handle query string
  if (options.qs) {
    url = handleQs(url, options.qs);
  }

  // handle json body
  if (options.json) {
    options.body = JSON.stringify(options.json);
    options.headers['content-type'] = 'application/json';
  }

  // method, url, async
  xhr.open(method, url, false);

  for (var name in options.headers) {
    xhr.setRequestHeader(name.toLowerCase(), options.headers[name]);
  }

  // avoid sending empty string (#319)
  xhr.send(options.body ? options.body : null);


  var headers = {};
  xhr.getAllResponseHeaders().split('\r\n').forEach(function (header) {
    var h = header.split(':');
    if (h.length > 1) {
      headers[h[0].toLowerCase()] = h.slice(1).join(':').trim();
    }
  });
  return new Response(xhr.status, headers, xhr.responseText);
}

},{"http-response-object":4,"then-request/lib/handle-qs.js":13}],13:[function(require,module,exports){
'use strict';

var parse = require('qs').parse;
var stringify = require('qs').stringify;

module.exports = handleQs;
function handleQs(url, query) {
  url = url.split('?');
  var start = url[0];
  var qs = (url[1] || '').split('#')[0];
  var end = url[1] && url[1].split('#').length > 1 ? '#' + url[1].split('#')[1] : '';

  var baseQs = parse(qs);
  for (var i in query) {
    baseQs[i] = query[i];
  }
  qs = stringify(baseQs);
  if (qs !== '') {
    qs = '?' + qs;
  }
  return start + qs + end;
}

},{"qs":7}],14:[function(require,module,exports){
module.exports = require('./lib/ubique.js');
},{"./lib/ubique.js":208}],15:[function(require,module,exports){
/**
 * Constants properties
 */
module.exports = function($u) {
/**
 * Constants values
 * @type {number}
 */
 $u.Inf = Number.POSITIVE_INFINITY;
 $u.maxval = Number.MAX_VALUE;
 $u.minval = Number.MIN_VALUE;
 $u.PI = Math.PI;
 $u.E = Math.E;
 $u.LN2 = Math.LN2;
 $u.LN10 = Math.LN10;
 $u.LOG2E = Math.LOG2E;
 $u.LOG10E = Math.LOG10E;
 $u.SQRT1_2 = Math.SQRT1_2;
 $u.SQRT2 = Math.SQRT2;
 $u.eps = 2.2204460492503130808472633361816E-16;
 $u.phi = 1.618033988749894848204586834;
}

},{}],16:[function(require,module,exports){
/**
 * Datafeed
 */
 module.exports = function ($u) {
/**
 * @method yahoo
 * @summary Download CSV Yahoo Finance historical (async request)
 * @description Download CSV Yahoo Finance historical. Returns an object:
 * 
 * {
 *   'symbol': options.symbol,
 *   'from': options.from,
 *   'to': options.to,
 *   'period': options.period,
 *   'date': nDate,
 *   'open': nOpen,
 *   'high': nHigh,
 *   'low': nLow,
 *   'close': nClose,
 *   'volume': nVolume,
 *   'adjclose': nAdjClose
 * }
 *
 * @param {object} options options with fields:
 *                         .symbol Yahoo symbol name
 *                         .from start date
 *                         .to last date
 *                         .period period "d","w","m"
 *                         .fmt date format (def: "YYYY-MM-DD")
 * 
 * @return {object} 
 *
 * @example
 * // var options = {'symbol': 'AAPL','from': '2015-01-02','to': '2015-01-08','period': 'd'};
 * // ubique.yahoo.historical(options,function(err,data) {
 * // console.log(data)
 * // });
 * //
 * // { symbol: 'AAPL',
 * //     from: '2015-01-02',
 * //       to: '2015-01-08',
 * //   period: 'd',
 * //     date: [ '2015-01-02',
 * //             '2015-01-05',
 * //             '2015-01-06',
 * //             '2015-01-07',
 * //             '2015-01-08' ],
 * //             open: [ 111.39, 108.29, 106.54, 107.2, 109.23 ],
 * //             high: [ 111.44, 108.65, 107.43, 108.2, 112.15 ],
 * //             low: [ 107.35, 105.41, 104.63, 106.7, 108.7 ],
 * //             close: [ 109.33, 106.25, 106.26, 107.75, 111.89 ],
 * //             volume: [ 53204600, 64285500, 65797100, 40105900, 59364500 ],
 * //             adjclose: [ 108.44723, 105.3921, 105.40202, 106.87998, 110.98656 ] }
 */
 $u.yahoo = {
  histurl: 'http://real-chart.finance.yahoo.com/table.csv?',
  ip: '',
  port: '',
  historical: function(options,callback) {
    options = options || {};
    options.symbol = options.symbol || null;
    options.from = options.from || null;
    options.to = options.to || $u.datestr($u.today(),'YYYY-MM-DD');
    options.period = options.period || 'd';
    options.fmt = options.fmt || 'YYYY-MM-DD';
    callback = callback || function() {};

    var D = {};
    var dates = [];
    var values = [];
    var sdt = $u.datevec(options.from,options.fmt);
    var edt = $u.datevec(options.to,options.fmt);

  // set URL string
  var cvsdata = {};
  var urlxp = '&ignore=.csv';
  var urlsym = '&s=' + options.symbol.toUpperCase();
  var urlfrom = '&a=' + (sdt[1] - 1) + '&b=' + sdt[2] + '&c=' + sdt[0];
  var urlto = '&d=' + (edt[1] -1) + '&e=' + edt[2] + '&f=' + edt[0];
  var urlperiod = '&g=' + options.period;
  var URL = this.histurl + urlsym + urlfrom + urlto + urlperiod;

  $u.__request(URL,function(err,res,body) {

    cvsdata =  body.trim().split('\n');
    var header = cvsdata.shift().split(',');
    var nDate = [];
    var nOpen = [];
    var nHigh = [];
    var nLow = [];
    var nClose = [];
    var nVolume = [];
    var nAdjClose = [];

    cvsdata.sort().map(function(el) {
      var temp = el.split(',');
      nDate.push(temp[0]);
      nOpen.push(Number(temp[1]));
      nHigh.push(Number(temp[2]));
      nLow.push(Number(temp[3]));
      nClose.push(Number(temp[4]));
      nVolume.push(Number(temp[5]));
      nAdjClose.push(Number(temp[6]));
    });

    D = {
      'symbol': options.symbol,
      'from': options.from,
      'to': options.to,
      'period': options.period,
      'date': nDate,
      'open': nOpen,
      'high': nHigh,
      'low': nLow,
      'close': nClose,
      'volume': nVolume,
      'adjclose': nAdjClose
    };
    callback(null,D);
  });

}
}

}
},{}],17:[function(require,module,exports){
/**
 * Datafeed
 */
 module.exports = function ($u) {
/**
 * @method yahooSync
 * @summary Download CSV Yahoo Finance historical (sync request)
 * @description Download CSV Yahoo Finance historical. Returns an object:
 * 
 * {
 *   'symbol': options.symbol,
 *   'from': options.from,
 *   'to': options.to,
 *   'period': options.period,
 *   'date': nDate,
 *   'open': nOpen,
 *   'high': nHigh,
 *   'low': nLow,
 *   'close': nClose,
 *   'volume': nVolume,
 *   'adjclose': nAdjClose
 * }
 *
 * @param {object} options options with fields:
 *                         .symbol Yahoo symbol name
 *                         .from start date
 *                         .to last date
 *                         .period period "d","w","m"
 *                         .fmt date format (def: "YYYY-MM-DD")
 * 
 * @return {object} 
 *
 * @example
 * var options = { 'symbol': 'AAPL', 'from': '2015-01-02', 'to': '2015-01-08', 'period': 'd', 'fmt': 'YYYY-MM-DD' };
 * 
 * ubique.yahooSync.historical(options);
 * //
 * // { symbol: 'AAPL',
 * //     from: '2015-01-02',
 * //       to: '2015-01-08',
 * //   period: 'd',
 * //     date: [ '2015-01-02',
 * //             '2015-01-05',
 * //             '2015-01-06',
 * //             '2015-01-07',
 * //             '2015-01-08' ],
 * //             open: [ 111.39, 108.29, 106.54, 107.2, 109.23 ],
 * //             high: [ 111.44, 108.65, 107.43, 108.2, 112.15 ],
 * //             low: [ 107.35, 105.41, 104.63, 106.7, 108.7 ],
 * //             close: [ 109.33, 106.25, 106.26, 107.75, 111.89 ],
 * //             volume: [ 53204600, 64285500, 65797100, 40105900, 59364500 ],
 * //             adjclose: [ 108.44723, 105.3921, 105.40202, 106.87998, 110.98656 ] }
 */
 $u.yahooSync = {
  histurl: 'http://real-chart.finance.yahoo.com/table.csv?',
  ip: '',
  port: '',
  historical: function(options) {
    options = options || {};
    options.symbol = options.symbol || null;
    options.from = options.from || null;
    options.to = options.to || $u.datestr($u.today(),'YYYY-MM-DD');
    options.period = options.period || 'd';
    options.fmt = options.fmt || 'YYYY-MM-DD';

    var D = {};
    var dates = [];
    var values = [];
    var sdt = $u.datevec(options.from,options.fmt);
    var edt = $u.datevec(options.to,options.fmt);

  // set URL string
  var cvsdata = {};
  var urlxp = '&ignore=.csv';
  var urlsym = '&s=' + options.symbol.toUpperCase();
  var urlfrom = '&a=' + (sdt[1] - 1) + '&b=' + sdt[2] + '&c=' + sdt[0];
  var urlto = '&d=' + (edt[1] - 1) + '&e=' + edt[2] + '&f=' + edt[0];
  var urlperiod = '&g=' + options.period;
  var URL = this.histurl + urlsym + urlfrom + urlto + urlperiod;

  var res = $u.__syncrequest('GET',URL);

  cvsdata =  res.body.toString().trim().split('\n');
  var header = cvsdata.shift().split(',');
  var nDate = [];
  var nOpen = [];
  var nHigh = [];
  var nLow = [];
  var nClose = [];
  var nVolume = [];
  var nAdjClose = [];

  cvsdata.sort().map(function(el) {
    var temp = el.split(',');
    nDate.push(temp[0]);
    nOpen.push(Number(temp[1]));
    nHigh.push(Number(temp[2]));
    nLow.push(Number(temp[3]));
    nClose.push(Number(temp[4]));
    nVolume.push(Number(temp[5]));
    nAdjClose.push(Number(temp[6]));
  });

  D = {
    'symbol': options.symbol,
    'from': options.from,
    'to': options.to,
    'period': options.period,
    'date': nDate,
    'open': nOpen,
    'high': nHigh,
    'low': nLow,
    'close': nClose,
    'volume': nVolume,
    'adjclose': nAdjClose
  };
  return D;

}
}

}
},{}],18:[function(require,module,exports){
/**
 * Structures
 */
 module.exports = function($u) {
/**
 * @method arrayfun
 * @summary Apply function to each element of an array or matrix
 * @description Apply function to each element of an array or matrix. First arg is input element, the second one the function to apply, 
 * then the parameters of the function.
 * 
 * @param  {number|string|boolean|...} args variable input arguments
 * @return {number|string|boolean|...}     
 *
 * @example
 * ubique.arrayfun([1.4,2.3,3],Math.log);
 * // [ 0.336472, 0.832909, 1.098612 ]
 * 
 * ubique.arrayfun([1.4,0,-10],ubique.sign);
 * // [ 1, 0, -1 ]
 * 
 * ubique.arrayfun([[5,6],[1,3]],Math.pow,3);
 * // [ [ 125, 216 ], [ 1, 27 ] ]
 *
 * ubique.arrayfun([['cat','concat'],['cattle','catch the catfish']],ubique.strfind,'cat');
 * // [ [ [ 0 ], [ 3 ] ], [ [ 0 ], [ 0, 10 ] ] ]
 *
 * ubique.arrayfun([null,true,'hello',5,NaN],ubique.isnull);
 * // [ true, false, false, false, false ]
 *
 * ubique.arrayfun([null,true,'hello',5,NaN],ubique.islogical);
 * // [ false, true, false, false, false ]
 *
 * ubique.arrayfun([null,true,'hello',5,NaN],ubique.isstring);
 * // [ false, false, true, false, false ]
 *
 * ubique.arrayfun([null,true,'hello',5,NaN],ubique.isnumber);
 * // [ false, false, false, true, true ]
 *
 * ubique.arrayfun([null,true,'hello',5,{},undefined,'NaN',NaN],ubique.isnan);
 * // [ false, false, false, false, false, false, false, true ]
 */
 $u.arrayfun = function() {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var args = $u.argsarray.apply(null,arguments);
  var x = args[0];
  var fun = args[1];
  if (!$u.isfunction(fun)) {
    throw new Error('second input argument must be a function');
  }
  if ($u.isarray(x)) {
    return x.map(function(a) {
      return fun.apply(null,[].concat(a,args.slice(2,args.length)));
    });
  }
  if ($u.ismatrix(x)) {
    return x.map(function(a) {
      return a.map(function(b) {
        return fun.apply(null,[].concat(b,args.slice(2,args.length)));
      });
    });
  }
  return fun.apply(null,[].concat(x,args.slice(2,args.length)));
}

}
},{}],19:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method clock
 * @summary Current date and time as date vector
 * @description Current date and time as date vector. Returns an array:
 * [year month day hour minute seconds]
 * 
 * @param {empty} empty no arguments
 * @return {array}
 * 
 * @example
 * ubique.clock();
 * // [ 2015, 5, 28, 11, 51, 0, 801 ]
 */
 $u.clock = function() {
  var now = $u.__moment().toArray();
  now[1] = now[1] + 1;
  return now;
}
}
},{}],20:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method datevec
 * @summary Convert date and time to vector of components
 * @description Convert date and time to vector of components. Based on [moment.js](http://momentjs.com)
 * 
 * |Identifier| Example          | Description |
 * | ----------- | ---------------- | ----------- |
 * | `YYYY`      | `2014`           | 4 digit year |
 * | `YY`        | `14`             | 2 digit year |
 * | `Q`         | `1..4`           | Quarter of year. Sets month to first month in quarter. |
 * | `M MM`      | `1..12`          | Month number |
 * | `MMM MMMM`  | `January..Dec`   | Month name in locale set by `moment.locale()` |
 * | `D DD`      | `1..31`          | Day of month |
 * | `Do`        | `1st..31st`      | Day of month with ordinal |
 * | `DDD DDDD`  | `1..365`         | Day of year |
 * | `X`         | `1410715640.579` | Unix timestamp |
 * | `x`         | `1410715640579`  | Unix ms timestamp |
 * |
 * | `gggg`   | `2014`  | Locale 4 digit week year |
 * | `gg`     | `14`    | Locale 2 digit week year |
 * | `w ww`   | `1..53` | Locale week of year |
 * | `e`      | `1..7`  | Locale day of week |
 * | `GGGG`   | `2014`  | ISO 4 digit week year |
 * | `GG`     | `14`    | ISO 2 digit week year |
 * | `W WW`   | `1..53` | ISO week of year |
 * | `E`      | `1..7`  | ISO day of week |
 * |
 * | `H HH`         | `0..23`  | 24 hour time |
 * | `h hh`         | `1..12`  | 12 hour time used with `a A`. |
 * | `a A`          | `am pm`  | Post or ante meridiem |
 * | `m mm`         | `0..59`  | Minutes |
 * | `s ss`         | `0..59`  | Seconds |
 * | `S`            | `0..9`   | Tenths of a second |
 * | `SS`           | `0..99`  | Hundreds of a second |
 * | `SSS`          | `0..999` | Thousandths of a second |
 * | `Z ZZ`         | `+12:00` | Offset from UTC as `+-HH:mm`, `+-HHmm`, or `Z` |
 *
 * @param  {string|number|array|matrix} d string or number (unix) 
 * @param  {string} fmt format string
 * @return {array|matrix}
 *
 * @example
 * ubique.datevec('2015-01-01 03:34:05','YYYY-MM-DD HH:mm:ss');
 * // [ 2015, 1, 1, 3, 34, 5, 0 ]
 * 
 * ubique.datevec(['31-12-2014','31-01-2015'],'DD-MM-YYYY');
 * // [ [ 2014, 12, 31, 0, 0, 0, 0 ], [ 2015, 1, 31, 0, 0, 0, 0 ] ]
 * 
 * ubique.datevec([['31-12-2014','31-01-2015'],['15-02-2015','01-03-2015']],'DD-MM-YYYY');
 * // [ [ [ 2014, 12, 31, 0, 0, 0, 0 ], [ 2015, 1, 31, 0, 0, 0, 0 ] ],
 * //   [ [ 2015, 2, 15, 0, 0, 0, 0 ], [ 2015, 3, 1, 0, 0, 0, 0 ] ] ]
 *
 * // from '2015-04-05 12:20:30' to Unix 1428236430
 * ubique.datevec(1428236430);
 * // [ 2015, 4, 5, 12, 20, 30, 0 ]
 */
 $u.datevec= function(d,fmt) {
  if (arguments.length < 1) {
    throw new Error('not enough input arguments');
  }
  if ($u.isstring(d)) {
    if (!fmt) {
      throw new Error('insert format for date string');
    }
  }
  // Note: because this mirrors the native Date parameters,
  // months, hours, minutes, seconds, and milliseconds are all zero indexed.
  // Years and days of the month are 1 indexed.
  var _datevec = function(a,fmt) {
    if ($u.isstring(a)) {
      var dv = $u.__moment(a,fmt).toArray();
    } else 
    if ($u.isnumber(a)) {
      var dv = $u.__moment.utc(a,'X').toArray();
    } else {
      throw new Error('input must be a string or unix timestamp');
    }
    dv[1] = dv[1] + 1;
    return dv;
  }
  return $u.arrayfun(d,_datevec,fmt);
}
}

},{}],21:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method datenum
 * @summary Convert date and time to serial date number (Unix)
 * @description Convert date and time to serial date number (Unix). Based on [moment.js](http://momentjs.com)
 * 
 * |Identifier| Example          | Description |
 * | ----------- | ---------------- | ----------- |
 * | `YYYY`      | `2014`           | 4 digit year |
 * | `YY`        | `14`             | 2 digit year |
 * | `Q`         | `1..4`           | Quarter of year. Sets month to first month in quarter. |
 * | `M MM`      | `1..12`          | Month number |
 * | `MMM MMMM`  | `January..Dec`   | Month name in locale set by `moment.locale()` |
 * | `D DD`      | `1..31`          | Day of month |
 * | `Do`        | `1st..31st`      | Day of month with ordinal |
 * | `DDD DDDD`  | `1..365`         | Day of year |
 * | `X`         | `1410715640.579` | Unix timestamp |
 * | `x`         | `1410715640579`  | Unix ms timestamp |
 * |
 * | `gggg`   | `2014`  | Locale 4 digit week year |
 * | `gg`     | `14`    | Locale 2 digit week year |
 * | `w ww`   | `1..53` | Locale week of year |
 * | `e`      | `1..7`  | Locale day of week |
 * | `GGGG`   | `2014`  | ISO 4 digit week year |
 * | `GG`     | `14`    | ISO 2 digit week year |
 * | `W WW`   | `1..53` | ISO week of year |
 * | `E`      | `1..7`  | ISO day of week |
 * |
 * | `H HH`         | `0..23`  | 24 hour time |
 * | `h hh`         | `1..12`  | 12 hour time used with `a A`. |
 * | `a A`          | `am pm`  | Post or ante meridiem |
 * | `m mm`         | `0..59`  | Minutes |
 * | `s ss`         | `0..59`  | Seconds |
 * | `S`            | `0..9`   | Tenths of a second |
 * | `SS`           | `0..99`  | Hundreds of a second |
 * | `SSS`          | `0..999` | Thousandths of a second |
 * | `Z ZZ`         | `+12:00` | Offset from UTC as `+-HH:mm`, `+-HHmm`, or `Z` |
 *
 * @param  {string|array|matrix} d string vector of components
 * @param  {string} fmt format string
 * @return {string|array|matrix}
 *
 * @example
 * ubique.datenum('31-12-2014','DD-MM-YYYY');
 * // 1419984000
 * 
 * ubique.datenum(['31-12-2014','31-01-2015'],'DD-MM-YYYY');
 * // [ 1419984000, 1422662400 ]
 * 
 * ubique.datenum([['31-12-2014','31-01-2015'],['15-02-2015','01-03-2015']],'DD-MM-YYYY');
 * // [ [ 1419984000, 1422662400 ], [ 1423958400, 1425168000 ] ]
 *
 * ubique.datenum([ 2015, 4, 5, 12, 20, 30, 0 ]);
 * // 1428236430
 *
 * ubique.datenum([ [ 2013, 1, 31, 0, 0, 0, 0 ],[ 2014, 2, 28, 0, 0, 0, 0 ],[ 2015, 4, 30, 0, 0, 0, 0 ] ]);
 * // [ 1359590400, 1393545600, 1430352000 ]
 */
 $u.datenum = function(d,fmt) {
  if (arguments.length < 1) {
    throw new Error('not enough input arguments');
  }
  if ($u.isstring(d)) {
    if (!fmt) {
      throw new Error('insert format for date string');
    }
  }
  var _datenum = function(a,fmt) {
    return $u.__moment.utc(a,fmt).unix();
  }
  if ($u.isstring(d)) {
    return _datenum(d,fmt);
  }
  if ($u.isarray(d)) {
    var checknum = d.filter(function(el) {
      return $u.isnumber(el);
    });
    if (checknum.length === d.length) {
      return $u.__moment.utc(d,'YYYYMMDDhhmmss').unix();
    } else {
      return $u.arrayfun(d,_datenum,fmt);
    }
  }

  if ($u.ismatrix(d)) {
    if ($u.isarray(d[0])) {
     return d.map(function(a) {
      return $u.datenum(a,fmt);
    });
   }
   return $u.arrayfun(d,_datenum,fmt);
 }
 
}
}

},{}],22:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method datestr
 * @summary Convert serial date number (Unix) to string format
 * @description Convert serial date number (Unix) to string format. Based on [moment.js](http://momentjs.com)
 *
 * |Identifier| Example          | Description |
 * | ----------- | ---------------- | ----------- |
 * | `YYYY`      | `2014`           | 4 digit year |
 * | `YY`        | `14`             | 2 digit year |
 * | `Q`         | `1..4`           | Quarter of year. Sets month to first month in quarter. |
 * | `M MM`      | `1..12`          | Month number |
 * | `MMM MMMM`  | `January..Dec`   | Month name in locale set by `moment.locale()` |
 * | `D DD`      | `1..31`          | Day of month |
 * | `Do`        | `1st..31st`      | Day of month with ordinal |
 * | `DDD DDDD`  | `1..365`         | Day of year |
 * | `X`         | `1410715640.579` | Unix timestamp |
 * | `x`         | `1410715640579`  | Unix ms timestamp |
 * |
 * | `gggg`   | `2014`  | Locale 4 digit week year |
 * | `gg`     | `14`    | Locale 2 digit week year |
 * | `w ww`   | `1..53` | Locale week of year |
 * | `e`      | `1..7`  | Locale day of week |
 * | `GGGG`   | `2014`  | ISO 4 digit week year |
 * | `GG`     | `14`    | ISO 2 digit week year |
 * | `W WW`   | `1..53` | ISO week of year |
 * | `E`      | `1..7`  | ISO day of week |
 * |
 * | `H HH`         | `0..23`  | 24 hour time |
 * | `h hh`         | `1..12`  | 12 hour time used with `a A`. |
 * | `a A`          | `am pm`  | Post or ante meridiem |
 * | `m mm`         | `0..59`  | Minutes |
 * | `s ss`         | `0..59`  | Seconds |
 * | `S`            | `0..9`   | Tenths of a second |
 * | `SS`           | `0..99`  | Hundreds of a second |
 * | `SSS`          | `0..999` | Thousandths of a second |
 * | `Z ZZ`         | `+12:00` | Offset from UTC as `+-HH:mm`, `+-HHmm`, or `Z` |
 * 
 * @param  {number|array|matrix} d ISO Unix datetime
 * @param  {string} fmt format string (def: 'YYYY-MM-DD')
 * @return {number|array|matrix}
 *
 * @example
 * ubique.datestr(1419984000);
 * // 2014-12-31
 * 
 * ubique.datestr([ 1419984000, 1422662400 ],'DD-MMM-YY');
 * // [ '31-Dec-14', '31-Jan-15' ]
 * 
 * ubique.datestr([ [ 1419984000, 1422662400 ], [ 1423958400, 1425168000 ] ],'YY-MM-DD hh:mm:ss');
 * // [ [ '14-12-31 12:00:00', '15-01-31 12:00:00' ],
 * // [ '15-02-15 12:00:00', '15-03-01 12:00:00' ] ]
 */
 $u.datestr = function(d,fmt) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  fmt = fmt == null ? 'YYYY-MM-DD' : fmt;
  var _datestr = function(a,fmt) {
    return $u.__moment.utc(a,'X').format(fmt);
  }
  return $u.arrayfun(d,_datestr,fmt);

}
}
},{}],23:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method isarray
 * @summary True for array
 * @description  True for array
 * 
 * @param  {array} x input element
 * @return {boolean}   
 *
 * @example
 * ubique.isarray([1.4,2.3,3]);
 * // true
 */
 $u.isarray = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return Array.isArray(x) && !Array.isArray(x[0]);
}

}

},{}],24:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method isempty
 * @summary True for empty array or matrix
 * @description  True for empty array or matrix
 *              
 * @param  {array|matrix} x input matrix
 * @return {Boolean}   
 *
 * @example
 * ubique.isempty([]);
 * // true
 * 
 * ubique.isempty([[]]);
 * // true
 */
 $u.isempty = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if ($u.isarray(x) && x.length === 0) {
   return true;
 }
 if ($u.ismatrix(x) && x[0].length === 0) {
   return true;
 }
 return false;
}

}
},{}],25:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
/**
* @method isfunction
* @summary True for function
* @description true for function
* 
* @param  {function} x function
* @return {Boolean}   
*
* @example
* ubique.isfunction(function(a){return console.log(a);});
* // true
* 
* ubique.isfunction(Math.log);
* // true
*/
$u.isfunction = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return typeof x === 'function';
}

}
},{}],26:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
/**
* @method isinteger
* @summary True for integer
* @description  True for integer
* 
* @param  {number} x element
* @return {boolean}
*
* @example
* ubique.isinteger(5);
* // true
*/
$u.isinteger = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return $u.isnumber(x) && Math.round(x) === x;
}

}
},{}],27:[function(require,module,exports){
/**
 * Logical Operations
 */
 module.exports = function($u) {
/**
 * @method islogical
 * @summary True for logical input
 * @description True for logical input
 *              
 * @param  {boolean} x element
 * @return {boolean}   
 *
 * @example
 * ubique.islogical(true);
 * // true
 */
 $u.islogical = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return typeof x === 'boolean';
}

}
},{}],28:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method ismatrix
 * @summary True for matrix
 * @description True for array of array (matrix)
 * 
 * @param  {matrix} x matrix
 * @return {Boolean}  
 *
 * @example
 * ubique.ismatrix([[1,3,4]]);
 * // true
 * 
 * ubique.ismatrix([[1],[3],[4]]);
 * // true
 */
 $u.ismatrix = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	} 
 	if ($u.isundefined(x) || $u.isnull(x) || !$u.isarray(x[0])) {
 		return false;
 	}
 	return $u.isarray(x[0]);
 }

}
},{}],29:[function(require,module,exports){
/**
 * Numeric Types
 */
 module.exports = function($u) {
/**
 * @method isnan
 * @summary True only for NaN input
 * @description True only for NaN input. For [null,true,'hello',5,{},undefined,'NaN'] returns False.
 *              
 * @param  {NaN} x element
 * @return {boolean}   
 *
 * @example
 * ubique.isnan(NaN);
 * // true
 */
 $u.isnan = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return x != x;
}

}
},{}],30:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
/**
 * @method isnull
 * @summary True for null values
 * @description  True for null values
 * 
 * @param  {null} x element
 * @return {boolean}   
 *
 * @example
 * ubique.isnull(null);
 * // true
 */
 $u.isnull = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return x === null;
}

}
},{}],31:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
/**
 * @method isnumber
 * @summary True for number
 * @description  True for number or NaN value
 * 
 * @param  {number} x element
 * @return {boolean}   
 *
 * @example
 * ubique.isnumber(5);
 * // true
 * ubique.isnumber(NaN);
 * // true 
 */
 $u.isnumber = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
 	return typeof x === 'number';
 }

}
},{}],32:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method isscalar
 * @summary True for scalar input
 * @description True for scalar input
 *              
 * @param  {number|array|matrix} x input 
 * @return {Boolean}   
 *
 * @example
 * ubique.isscalar(2);
 * // true
 * 
 * ubique.isscalar([2]);
 * // true
 * 
 * ubique.isscalar([[2]]);
 * // true
 */
 $u.isscalar = function(x) {
 	if ($u.nrows(x) === 1 && $u.ncols(x) === 1) {
 		return true;
 	}
 	return false;
 }

}
},{}],33:[function(require,module,exports){
/**
 * Matrix Types
 */
 module.exports = function($u) {
/**
 * @method issingular
 * @summary True for singular matrix
 * @description True for singular matrix. A square matrix which does not have an inverse. A matrix is singular if and only if its determinant is zero.
 * 
 * @param  {matrix} x input matrix
 * @return {boolean}     
 *
 * @example
 * ubique.issingular([[2,6],[1,3]]);
 * // false
 */
 $u.issingular = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if ($u.isnumber(x) || $u.isarray(x)) {
    throw new Error('input must be a matrix');
  }
  if (!$u.issquare(x)) {
    throw new Error('input must be a square matrix');
  }
  var n = $u.ncols(x);
  for (var i = 0;i < n;i++) {
    if (x[i][i] === 0) {
      return true;
    }
  }
  return false;
}

}

},{}],34:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
/**
 * @method isstring
 * @summary True for string values
 * @description  True for string values
 * 
 * @param  {string} x element
 * @return {boolean|array}   
 *
 * @example
 * ubique.isstring('test');
 * // true
 */
 $u.isstring = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return typeof x === 'string';
}

}
},{}],35:[function(require,module,exports){
/**
 * Data Type Identification
 */
 module.exports = function($u) {
 /**
 * @method isundefined
 * @summary True for undefined values
 * @description  True for undefined values
 * 
 * @param  {undefined} x element
 * @return {boolean}   
 *
 * @example
 * ubique.isundefined(undefined);
 * // true
 */
 $u.isundefined = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return x === undefined;
}

}
},{}],36:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method isvector
 * @summary True for vector input
 * @description True for vector input. Vector can have the same dimension of array but array is array and vector
 * is an array of array (= matrix with 1 column or row)
 *              
 * @param  {matrix} x matrix with dimension Mx1 or 1xN
 * @return {boolean}   
 *
 * @example
 * ubique.isvector([[5,6,7]]);
 * // true
 * 
 * ubique.isvector([[5],[6],[7]]);
 * // true
 */
 $u.isvector = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.ismatrix(x)) {
 		if (($u.iscolumn(x) === true) || ($u.isrow(x) === true)) {
 			return true;
 		}
 		return false;
 	}
 	return false;
 }
}
},{}],37:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method month
 * @summary Month of date
 * @description Returns a number representing the month for each element in X.
 * Months are 0 indexed, Jan is 0 and Dec is 11.
 * Based on [moment.js](http://momentjs.com)
 * 
 * @param  {number|array|matrix} x serial date number (Unix)
 * @return {number|array|matrix}
 *
 * @example
 * ubique.month(1424708525);
 * // 1
 * 
 * ubique.month([1414886399,1414972799]);
 * // [ 10, 10 ]
 * 
 * ubique.month([[1414886399,1414972799],[1415059199,1415145599]]);
 * // [ [ 10, 10 ], [ 10, 10 ] ]
 */
 $u.month = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var _month = function(a) {
    return $u.__moment.unix(a).month();
  }
  return $u.arrayfun(x,_month);
}
}

},{}],38:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method now
 * @summary Current date and time as date number (unix)
 * @description Current date and time as date number (unix)
 * 
 * @param {empty} empty no arguments
 *
 * @example
 * ubique.now();
 * // 1430759861
 */
 $u.now = function() {
  return $u.datenum($u.clock());
}
}

},{}],39:[function(require,module,exports){
/**
 * Create and Concatenate Strings
 */
 module.exports = function($u) {
/**
 * @method randchar
 * @summary Generate a random alpha-numeric string
 * @description Generate a random alpha-numeric string
 * 
 * @param  {number} n number of characters to generate (def: 6)
 * @param  {string} strset character set to get random sample
 * @return {string}        
 *
 * @example
 * ubique.randchar(12,'ABCD!-|/%&$\1234567890');
 * // D&80%BB/C%B
 * 
 * ubique.randchar(16,'ABCDEFGHILMNOPQRSTUVZ-1234567890');
 * // U68MP-U7ZI26T2HS
 */
 $u.randchar = function(n,strset) {
  if (arguments.length === 0) {
    return '';
  }
  strset = strset == null ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' : strset;
  return Array.apply(0, Array(n)).map(function() {
    return (function(charset) {
      return charset.charAt(Math.floor(Math.random() * charset.length))
    }(strset));
  }).join('')
}

}
},{}],40:[function(require,module,exports){
/**
 * Parse Strings
 */
 module.exports = function ($u) {
/**
 * @method strfind
 * @summary Find one string within another
 * @description Find one string within another. If pattern length > text length returns null.
 * 
 * @param  {string} str data to be searched
 * @param  {string} pattern search pattern
 * @return {array} indices of occurrences of pattern
 *  
 * @example
 * var mystr = 'find indices in the string';
 *
 * ubique.strfind(mystr,'in');
 * // [ 1, 5, 13, 23 ]
 */
 $u.strfind = function (str,pattern) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  if ($u.isstring(str) && $u.isstring(pattern) && (str.length >= pattern.length)) {
    var i = str.indexOf(pattern);
    var posidx = [];
    while(i >= 0) {
      posidx.push(i);
      i = str.indexOf(pattern, i + 1);
    }
    return posidx;
  } else {
    throw new Error('unknown arguments');
  }
}
}
},{}],41:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method today
 * @summary Current date
 * @description Current date
 * 
 * @param {empty} empty no arguments
 *
 * @example
 * ubique.today();
 * // 1430697600
 */
 $u.today = function() {
  var t = $u.clock();
  return $u.datenum([t[0],t[1],t[2]]);
}
}

},{}],42:[function(require,module,exports){
/**
 * Structures
 */
 module.exports = function($u) {
/**
 * @method  vectorfun
 * @summary Apply a function to each vector column or row of a matrix 
 * @description Apply a function to each vector column or row of a matrix. The syntax is:
 * 
 * vectorfun(dim,x,func,arg1,arg2....)
 * 
 * @param  {number|string|boolean|...} args variable input arguments
 * @return {number|string|boolean|...}  
 *
 * @example
 * var testfun = function(a,b,c){return ubique.mean(a)*b+c;};
 * 
 * ubique.vectorfun(0,[[5,6,5],[7,8,-1]],testfun,5,10)
 * // [ [ 36.666667 ], [ 33.333333 ] ]
 * 
 * ubique.vectorfun(1,[[5,6,5],[7,8,-1]],testfun,5,10)
 * // [ [ 40, 45, 20 ] ]
 */
 $u.vectorfun = function() {
 	if (arguments.length < 3) {
 		throw new Error('not enough input arguments');
 	}
  var args = $u.argsarray.apply(null,arguments);
  var argslen = args.length;
  var dim = args[0];
  var x = args[1];
  var fun = args[2];
  var varargin = args.slice(3,args.length);
  if (dim !== 0 && dim !== 1) {
    throw new Error('dimension must be 0 (rows) or 1 (columns)');
  }
  if (!$u.isfunction(fun)) {
    throw new Error('third input argument must be a function');
  }
  if (dim === 1) {
    var ndim = $u.ncols(x);
    var narray = $u.getcol;
  }
  if (dim === 0) {
    var ndim = $u.nrows(x);
    var narray = $u.getrow;
  }
  if ($u.isarray(x)) {
    if ($u.isempty(varargin)) {
      return fun.apply(null,[x]);
    } 
    return fun.apply(null,[].concat([x]).concat(varargin));
  }
  var v = [];
  if ($u.ismatrix(x)) {
    for (var i = 0; i < ndim; i++) {
      var d = narray(x,i);
      var temp = fun.apply(null,[].concat([d]).concat(varargin));
      v.push(temp);
    }
  }
  if (dim === 1) {
    if ($u.isarray(v)) {
      return [v];
    }
    return $u.squeeze($u.transpose(v));
  }
  if (dim === 0) {
    if ($u.isarray(v)) {
      return $u.transpose(v);
    }
  }
  return $u.squeeze(v);
}
}
},{}],43:[function(require,module,exports){
/**
 * Dates and Time
 */
 module.exports = function($u) {
/**
 * @method weekday
 * @summary Day of week
 * @description Returns a number representing the day of the week for each element in X.
 * The ISO day of the week begins with 1 Monday, 2 Tuesday ... 7 Sunday.
 * Based on [moment.js](http://momentjs.com)
 * 
 * @param  {number|array|matrix} x serial date number (Unix)
 * @return {number|array|matrix}
 *
 * @example
 * ubique.weekday(1426636800);
 * // 3
 * 
 * ubique.weekday([ 1424908800, 1426636800 ]);
 * // [ 4, 3 ]
 * 
 * ubique.weekday([ [ 1424908800, 1426636800 ], [ 1427328000, 1429315200 ] ]);
 * // [ [ 4, 3 ], [ 4, 6 ] ]
 */
 $u.weekday = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var _weekday = function(a) {
    return $u.__moment.utc(a,'X').isoWeekday();
  }
  return $u.arrayfun(x,_weekday);
}
}

},{}],44:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
 	/**
 * @method ceil
 * @summary Round toward positive infinity
 * @description Round toward positive infinity
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number} x number of decimals
 * @return {number|array|matrix}
 *
 * @example
 * ubique.ceil(Math.PI,12);
 * // 3.141593
 * 
 * ubique.ceil(3.78);
 * // 4
 * 
 * ubique.ceil([4.51,-1.4]);
 * // [ 5, -1 ]
 * 
 * ubique.ceil([[4.5134,-1.4345],[3.7809,0.0134]],2);
 * // [ [ 4.52, -1.43 ], [ 3.79, 0.02 ] ]
 */
 $u.ceil = function(x,n) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	n = n == null ? 0 : n;
 	var p = Math.pow(10,n);
  var _ceil = function(a) {
    return Math.ceil(a * p) / p;
  }
  return $u.arrayfun(x,_ceil);
}
}

},{}],45:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method cumdev
 * @summary Cumulative mean deviation
 * @description  Cumulative mean deviation of the values in array X
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * var b = [[-1,3,-1],[4,5,9]];
 * var c = [5,6,3];
 *
 * ubique.cumdev([5,6,3]);
 * // [ 0.333333, 1.666667, -0 ]
 * 
 * ubique.cumdev([[-1,3,-1],[4,5,9]],0);
 * // [ [ -1.333333, 1.333333, 0 ], [ -2, -3, 0 ] ]
 * 
 * ubique.cumdev([[-1,3,-1],[4,5,9]]);
 * // [ [ -2.5, -1, -5 ], [ 0, 0, 0 ] ]
 */
 $u.cumdev = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim = dim == null ? 1 : dim;
 	var _cumdev = function(a) {
 		return $u.cumsum($u.minus(a,$u.mean(a)));
 	}
   return $u.vectorfun(dim,x,_cumdev);
 }

}
},{}],46:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method cummax
 * @summary Cumulative max of array elements
 * @description Cumulative max of array elements
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * ubique.cummax([5,6,3]);
 * // [ 5, 6, 6 ]
 * 
 * ubique.cummax([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 6, 5 ], [ 7, 8, 5 ] ]
 * 
 * ubique.cummax([[5,6,5],[7,8,-1]],0);
 * // [ [ 5, 6, 6 ], [ 7, 8, 8 ] ]
 */
 $u.cummax = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 1 : dim;
  var _cummax =  function(a) {
    var v = [];
    v[0] = a[0];
    for (var i = 1;i < a.length;i++) {
      if (a[i] >= v[i - 1]) {
        v[i] = a[i];
      } else { 
        v[i] = v[i - 1];
      }
    }
    return v;
  }
  return $u.vectorfun(dim,x,_cummax);
}

}
},{}],47:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
 /**
 * @method cummin
 * @summary Cumulative min of array elements
 * @description Cumulative min of array elements
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * ubique.cummin([5,6,3]);
 * // [ 5, 5, 3 ]
 * 
 * ubique.cummin([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 6, 5 ], [ 5, 6, -1 ] ]
 * 
 * ubique.cummin([[5,6,5],[7,8,-1]],0);
 * // [ [ 5, 5, 5 ], [ 7, 7, -1 ] ]
 */
 $u.cummin = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 1 : dim;
  var _cummin =  function(a) {
    var v = [];
    v[0] = a[0];
    for (var i = 1;i < a.length;i++) {
      if (a[i] < v[i - 1]) {
        v[i] = a[i];
      } else { 
        v[i] = v[i - 1];
      }
    }
    return v;
  }
  return $u.vectorfun(dim,x,_cummin);
}

}
},{}],48:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
 /**
 * @method cumprod
 * @summary Cumulative product of array elements
 * @description Cumulative product of array elements
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * ubique.cumprod([5,6,3]);
 * // [ 5, 30, 90 ]
 * 
 * ubique.cumprod([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 6, 5 ], [ 35, 48, -5 ] ]
 * 
 * ubique.cumprod([[5,6,5],[7,8,-1]],0);
 * // [ [ 5, 30, 150 ], [ 7, 56, -56 ] ]
 */
 $u.cumprod = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 1 : dim;
  var _cumprod =  function(a) {
    var v = [];
    v[0] = a[0];
    for (var i = 1;i < a.length;i++) {
      v[i] = v[i - 1] * a[i];
    }
    return v;
  }
  return $u.vectorfun(dim,x,_cumprod);
}

}
},{}],49:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method cumsum
 * @summary Cumulative sum of array elements
 * @description Cumulative sum of array elements
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * ubique.cumsum([5,6,3]);
 * // [5, 11, 14]
 * 
 * ubique.cumsum([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 6, 5 ], [ 12, 14, 4 ] ]
 * 
 * ubique.cumsum([[5,6,5],[7,8,-1]],0);
 * // [ [ 5, 11, 16 ], [ 7, 15, 14 ] ]
 */
 $u.cumsum = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 1 : dim;
  var _cumsum =  function(a) {
    var v = [];
    v[0] = a[0];
    for (var i = 1;i < a.length;i++) {
      v[i] = v[i - 1] + a[i];
    }
    return v;
  }
  return $u.vectorfun(dim,x,_cumsum);
}

}
},{}],50:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method diff
 * @summary Differences between adjacent elements in array 
 * @description Differences between adjacent elements in array or matrix 
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {array|matrix}   
 *
 * @example
 * ubique.diff([5,6,3]);
 * // [1, -3]
 * 
 * ubique.diff([[5,6,5],[7,8,-1]]);
 * // [ [ 2, 2, -6 ] ]
 * 
 * ubique.diff([[5,6,5],[7,8,-1]],0);
 * // [ [ 1, -1 ], [ 1, -9 ] ]
 */
 $u.diff = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
   dim = dim == null ? 1 : dim;
   var _diff =  function(a) {
    var v = [];
     for (var i = 1;i < a.length;i++) {
      v[i - 1] = a[i] - a[i - 1];
    }
    return v;
  }
  return $u.vectorfun(dim,x,_diff);
}

}
},{}],51:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method dot
 * @summary Arrays dot product X * Y
 * @description Arrays dot product X * Y. X and Y must be arrays of the same length
 * 
 * @param  {array} x number or array of values
 * @param  {array} y number or array of values
 * @return {array}   
 *
 * @example
 * ubique.dot([5,6,3],[0.5,-3,2.3]);
 * // -8.6
 */
 $u.dot = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
    if ($u.size(x)[0] !== $u.size(y)[0] || $u.size(x)[1] !== $u.size(y)[1]) {
    	throw new Error('input size mismatch');
    }
    return $u.sum($u.times(x,y));
 }
}

},{}],52:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method eq
 * @summary Equality X === Y
 * @description Equality X === Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.eq(5,5);
 * // true
 * 
 * ubique.eq(5,[5,6,3]);
 * // [ true, false, false ]
 * 
 * ubique.eq(5,[[5,6],[3,5]]);
 * // [ [ true, false ], [ false, true ] ]
 * 
 * ubique.eq([5,6,3],5);
 * // [ true, false, false ]
 * 
 * ubique.eq([[5,6],[3,5]],5);
 * // [ [ true, false ], [ false, true ] ]
 * 
 * ubique.eq([5,6,3],[2,6,0]);
 * // [ false, true, false ]
 * 
 * ubique.eq([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ true, true ], [ false, false ] ]
 */
 $u.eq = function(x,y) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var _eq = function(el) {
    return el === 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_eq);
}
}

},{}],53:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
 	/**
 * @method floor
 * @summary Round toward negative infinity
 * @description Round toward negative infinity
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number} x number of decimals
 * @return {number|array|matrix}
 *
 * @example
 * ubique.floor(Math.PI,12);
 * // 3.141592653589
 * 
 * ubique.floor(3.78);
 * // 3
 * 
 * ubique.floor([4.51,-1.4]);
 * // [ 4, -2 ]
 * 
 * ubique.floor([[4.5134,-1.4345],[3.7809,0.0134]],2);
 * //[ [ 4.51, -1.43 ], [ 3.78, 0.01 ] ]
 */
 $u.floor = function(x,n) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  n = n == null ? 0 : n;
  var p = Math.pow(10,n);
  var _floor = function(a) {
    return Math.round(a * p) / p;
  }
  return $u.arrayfun(x,_floor);
}
}

},{}],54:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method ge
 * @summary Greater than or equal to X >= Y
 * @description Greater than or equal to X >= Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.ge(5,5);
 * // true
 * 
 * ubique.ge(5,[5,6,3]);
 * // [ true, false, true ]
 * 
 * ubique.ge(5,[[5,6],[3,5]]);
 * // [ [ true, false ], [ false, true ] ]
 * 
 * ubique.ge([5,6,3],5);
 * // [ true, true, false ]
 * 
 * ubique.ge([[5,6],[3,5]],5);
 * // [ [ true, true ], [ false, true ] ]
 * 
 * ubique.ge([5,6,3],[2,6,0]);
 * // [ false, true, false ]
 * 
 * ubique.ge([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ true, true ], [ false, false ] ]
 */
 $u.ge = function(x,y) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var _ge = function(el) {
    return el >= 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_ge);
}
}
},{}],55:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method gt
 * @summary Greater than X > Y
 * @description Greater than X > Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.gt(5,5);
 * // false
 * 
 * ubique.gt(5,[5,6,3]);
 * // [ false, false, true ]
 * 
 * ubique.gt(5,[[5,6],[3,5]]);
 * // [ [ false, false ], [ true, false ] ]
 * 
 * ubique.gt([5,6,3],5);
 * // [ false, true, false ]
 * 
 * ubique.gt([[5,6],[3,5]],5);
 * // [ [ false, true ], [ false, false ] ]
 * 
 * ubique.gt([5,6,3],[2,6,0]);
 * // [ true, false, true ]
 * 
 * ubique.gt([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ false, false ], [ false, false ] ]
 */
 $u.gt = function(x,y) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var _gt = function(el) {
    return el > 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_gt);
}
}
},{}],56:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method ldivide
 * @summary Left array division X. \ Y
 * @description Divides each element of Y by the corresponding element of X. Inputs X and Y
 * must have the same size
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.ldivide(5,6);
 * // 1.2
 * 
 * ubique.ldivide([5,6,7],3);
 * // [ 0.6, 0.5, 0.428571 ]
 * 
 * ubique.ldivide(3,[-1,-2,-3]);
 * // [ -0.333333, -0.666667, -1 ]
 * 
 * ubique.ldivide([5,6,3],[0.5,-3,2.3]);
 * // [ 0.1, -0.5, 0.766667 ]
 * 
 * ubique.ldivide([[9, 5], [6, 1]],[[3, 2], [5, 2]]);
 * // [ [ 0.333333, 0.4 ], [ 0.833333, 2 ] ]
 * 
 * ubique.ldivide([[9, 5], [6, 1]],3);
 * // [ [ 0.333333, 0.6 ], [ 0.5, 3 ] ]
 */
 $u.ldivide = function(y,x) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return x / y;
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return x / val;});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return x / val;})
 	}
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return val / y;});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return val / y;})
 	}
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = x[i] / y[i];
 		}
 		return v;
 	}
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
 		var v = [];
 		for (var i = 0;i < $u.nrows(x);i++) {
 			var vx = $u.getrow(x,i),
 			vy = $u.getrow(y,i);
 			v[i] = $u.rdivide(vx,vy);
 		}
 		return v;
 	}
 }
}
},{}],57:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method le
 * @summary Less than or equal to X <= Y
 * @description Less than or equal to X <= Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.le(5,5);
 * // true
 * 
 * ubique.le(5,[5,6,3]);
 * // [ true, true, false ]
 * 
 * ubique.le(5,[[5,6],[3,5]]);
 * // [ [ true, true ], [ false, true ] ]
 * 
 * ubique.le([5,6,3],5);
 * // [ true, false, true ]
 * 
 * ubique.le([[5,6],[3,5]],5);
 * // [ [ true, false ], [ true, true ] ]
 * 
 * ubique.le([5,6,3],[2,6,0]);
 * // [ false, true, false ]
 * 
 * ubique.le([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ true, true ], [ true, true ] ]
 */
 $u.le = function(x,y) {
  if (arguments.lenleh < 2) {
    throw new Error('not enough input arguments');
  }
  var _le = function(el){
    return el <= 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_le);
}
}
},{}],58:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method lt
 * @summary Less than X < Y
 * @description Less than X < Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.lt(5,5);
 * // false
 * 
 * ubique.lt(5,[5,6,3]);
 * // [ false, true, false ]
 * 
 * ubique.lt(5,[[5,6],[3,5]]);
 * // [ [ false, true ], [ false, false ] ]
 * 
 * ubique.lt([5,6,3],5);
 * // [ false, false, true ]
 * 
 * ubique.lt([[5,6],[3,5]],5);
 * // [ [ false, false ], [ true, false ] ]
 * 
 * ubique.lt([5,6,3],[2,6,0]);
 * // [ false, false, false ]
 * 
 * ubique.lt([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ false, false ], [ true, true ] ]
 */
 $u.lt = function(x,y) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var _lt = function(el){ 
    return el < 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_lt);
}
}
},{}],59:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method minus
 * @summary Subtraction X - Y
 * @description Subtraction X - Y. X and Y must have the same dimension unless one is a number
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.minus(5,6);
 * // -1
 * 
 * ubique.minus([5,6,4],[3,-1,0]);
 * // [ 2, 7, 4 ]
 * 
 * ubique.minus([5,6,4],10);
 * // [-5, -4, -6]
 * 
 * ubique.minus([[5,6,5],[7,8,-1]],[[-1,3,-1],[4,5,9]]);
 * // [[ 6, 3, 6 ], [ 3, 3, -10 ]]
 */
 $u.minus = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return x - y;
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return x - val;});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return x - val;})
 	}
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return val - y;});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return val - y;})
 	}
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = x[i] - y[i];
 		}
 		return v;
 	}
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
    if (($u.nrows(x) === $u.nrows(y)) && ($u.ncols(x) === $u.ncols(y))) {
     var v = [];
     for (var i = 0;i < $u.nrows(x);i++) {
      var vx = $u.getrow(x,i),
      vy = $u.getrow(y,i);
      v[i] = $u.minus(vx,vy);
    }
    return v;
  } else {
    throw new Error('input dimensions must agree');
  }
}
}

}
},{}],60:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
  /**
  * @method mldivide
  * @summary Matrix division X \ Y
  * @description Matrix division X \ Y. If X is NxN and Y is NxM, then
  * returns a matrix NxM. Y is multiplied with the inverse of X. X must be square.
  * 
  * @param  {number|array|matrix} x number or array of values
  * @param  {number|array|matrix} y number or array of values
  * @return {number|array|matrix}   
  *
  * @example 
  * ubique.mldivide(5,6);
  * // 1.2
  * 
  * ubique.mldivide([[9, 5],[6, 1]],[[3, 2],[5, 2]]);
  * // [ [ 1.047619, 0.380952 ], [ -1.285714, -0.285714 ] ]
  * 
  * ubique.mldivide(5,[[9, 5],[6, 1]]);
  * // [ [ 1.8, 1 ], [ 1.2, 0.2 ] ]
  * 
  * ubique.mldivide([[9, 5],[6, 1]],[[5,6,5],[7,8,-1]]);
  * // [ [ 1.428571, 1.619048, -0.47619 ],[ -1.571429, -1.714286, 1.857143 ] ]
  */
  $u.mldivide = function(y,x) {
    if (arguments.length < 2) {
      throw new Error('not enough input arguments');
    }
    if ($u.isnumber(x) && $u.isnumber(y)) {
      return x/y;
    } else
    if ($u.isnumber(y)) {
      return $u.ldivide(y,x);
    } else 
    if ($u.issquare(y)) {
      if ($u.ncols(y) !== $u.nrows(x)) {
        throw new Error('matrix dimensions mismatch');
      }
      return $u.mtimes($u.inv(y),x);
    } else {
      throw new Error('first argument must be square');
    }
  }

}
},{}],61:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method mod
 * @summary Modulus after division
 * @description Modulus after division. Element-wise for matrix
 * 
 * @param  {number|array|matrix} x dividend
 * @param  {number|array|matrix} y divisor
 * @return {number|array|matrix}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var b = [[-1,3,-1],[4,5,9]];
 * 
 * ubique.mod([13,-7],2.2);
 * // [ 2, 1.8 ]
 * 
 * ubique.mod([13,-7],[5,6]);
 * // [ 3, 5 ]
 * 
 * ubique.mod(a,b);
 * // [[ 0, 0, 0 ], [ 3, 3, 8 ]]
 */
 $u.mod = function(x,y) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	var n = $u.floor($u.rdivide(x,y));
 	return $u.minus(x,$u.times(n,y));
 }

}
},{}],62:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method mpower
 * @summary Matrix power X ^ Y
 * @description Matrix power X ^ Y. X is the square input matrix and y is the scalar exponent.
 * 
 * @param  {matrix} x base 
 * @param  {number} y exponent 
 * @return {matrix}   
 *
 * @example
 * ubique.mpower([[1,1,-1],[1,-2,3],[2,3,1]],3);
 * // [ [ -2, 11, -11 ], [ 11, -35, 33 ], [ 22, 33, -2 ] ]
 */
 $u.mpower = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if (!$u.issquare(x)) {
 		throw new Error('input must be a square matrix');
 	}
 	if (!$u.isnumber(y)) {
 		throw new Error('exponent must be a scalar value');
 	}
 	var out = x,
 	t = 1;
 	while (t < y) {
 		out = $u.mtimes(x,out);
 		t++;
 	}
 	return out;
 }
}
},{}],63:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
  /**
  * @method mrdivide
  * @summary Matrix division X / Y
  * @description Matrix division X / Y. If X is MxN and Y is NxN, then
  * it returns a matrix MxN. X is multiplied with the inverse of Y. Y must be square.
  * 
  * @param  {number|array|matrix} x number or array of values
  * @param  {number|array|matrix} y number or array of values
  * @return {number|array|matrix}   
  *
  * @example
  * ubique.mrdivide(5,6);
  * // 0.833333
  * 
  * ubique.mrdivide([5,6,3],6);
  * // [ 0.833333, 1, 0.5 ]
  * 
  * ubique.mrdivide([[9, 5], [6, 1]],5);
  * // [ [ 1.8, 1 ], [ 1.2, 0.2 ] ]
  * 
  * ubique.mrdivide([[9, 5], [6, 1]],[[3, 2], [5, 2]]);
  * // [ [ 1.75, 0.75 ], [ -1.75, 2.25 ] ]
  * 
  * ubique.mrdivide([[5,6,5],[7,8,-1]],[[1,1,-1],[1,-2,3],[2,3,1]]);
  * // [ [ -0.769231, 0.538462, 2.615385 ],[ 3.384615, 0.230769, 1.692308 ] ]
  */
  $u.mrdivide = function(x,y) {
    if (arguments.length < 2) {
      throw new Error('not enough input arguments');
    }
    if ($u.isnumber(x) && $u.isnumber(y)) {
      return x/y;
    } else
    if ($u.isnumber(y)) {
      return $u.rdivide(x,y);
    } else 
    if ($u.issquare(y)) {
      if ($u.ncols(x) !== $u.nrows(y)) {
        throw new Error('matrix dimensions mismatch');
      }
      return $u.mtimes(x,$u.inv(y));
    } else {
      throw new Error('second argument must be square');
    }
  }

}
},{}],64:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method mtimes
 * @summary Matrix multiplication X * Y
 * @description  Matrix multiplication X * Y. If X is MxP and Y is PxN, returns a matrix MxN
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.mtimes(5,6);
 * // 30
 * 
 * ubique.mtimes([5,6,3],3);
 * // [ 15, 18, 9 ]
 * 
 * ubique.mtimes([[5,6,5],[7,8,-1]],3);
 * // [ [ 15, 18, 15 ], [ 21, 24, -3 ] ]
 * 
 * ubique.mtimes([[5,6,3]],[[3],[4],[5]]);
 * // [ [ 54 ] ]
 * 
 * ubique.mtimes([[5,6,5],[7,8,-1]],[[5],[6],[3]]);
 * // [ [ 76 ], [ 80 ] ]
 */
 $u.mtimes = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if (!$u.isnumber(x) && !$u.isnumber(y)) {
 		var xsize = $u.size(x);
 		var ysize = $u.size(y);
 		if (xsize[1] !== ysize[0]) {
 			throw new Error('inner dimension mismatch');
 		}
 		var out = $u.matrix(xsize[0],ysize[1]);
 		for (var i = 0;i < xsize[0];i++) {
 			var xx = $u.getrow(x,i);
 			for (var j = 0;j < ysize[1];j++) {
 				var yy = $u.getcol(y,j);
 				out[i][j] = $u.squeeze($u.dot(xx,yy));
 			}
 		}
 		return out;
 	}
 	return $u.times(x,y);
 }
}

},{}],65:[function(require,module,exports){
/**
 * Relational Operations
 */
 module.exports = function($u) {
/**
 * @method ne
 * @summary Inequality X !== Y
 * @description Inequality X !== Y
 *
 * @param  {number|array|matrix} x left array
 * @param  {number|array|matrix} y right array
 * @return {number|array|matrix}
 *
 * @example
 * ubique.ne(5,5);
 * // false
 * 
 * ubique.ne(5,[5,6,3]);
 * // [ false, true, true ]
 * 
 * ubique.ne(5,[[5,6],[3,5]]);
 * // [ [ false, true ], [ true, false ] ]
 * 
 * ubique.ne([5,6,3],5);
 * // [ false, true, true ]
 * 
 * ubique.ne([[5,6],[3,5]],5);
 * // [ [ false, true ], [ true, false ] ]
 * 
 * ubique.ne([5,6,3],[2,6,0]);
 * // [ true, false, true ]
 * 
 * ubique.ne([[5,6],[-1,2]],[[5,6],[3,5]]);
 * // [ [ false, false ], [ true, true ] ]
 */
 $u.ne = function(x,y) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var _ne = function(el) { 
    return el !== 0;
  }
  var d = $u.minus(x,y);
  return $u.arrayfun(d,_ne);
}
}
},{}],66:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method plus
 * @summary Addition X + Y
 * @description Addition X + Y
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var b = [[-1,3,-1],[4,5,9]];
 * 
 * ubique.plus(5,6);
 * // 11
 * 
 * ubique.plus([5,6,4],[3,-1,0]);
 * // [ 8, 5, 4 ]
 * 
 * ubique.plus([5,6,4],10);
 * // [ 15, 16, 14 ]
 * 
 * ubique.plus(a,b);
 * // [[ 4, 9, 4 ], [ 11, 13, 8 ]]
 */
 $u.plus = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return x + y;
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return x + val;});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return x + val;})
 	}
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return val + y;});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return val + y;})
 	}
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = x[i] + y[i];
 		}
 		return v;
 	}
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
     if (($u.nrows(x) === $u.nrows(y)) && ($u.ncols(x) === $u.ncols(y))) {
       var v = [];
       for (var i = 0;i < $u.nrows(x);i++) {
        var vx = $u.getrow(x,i),
        vy = $u.getrow(y,i);
        v[i] = $u.plus(vx,vy);
      }
      return v;
    } else {
      throw new Error('input dimensions must agree');
    }
  }
}

}
},{}],67:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method power
 * @summary Element-wise power X. ^ Y
 * @description Element-wise power X. ^ Y
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var b = [[-1,3,-1],[4,5,9]];
 * var c = [5,6,3];
 * var d = [0.5,-3,2.3];
 * 
 * ubique.power(5,4);
 * // 625
 * 
 * ubique.power(c,5);
 * // [ 3125, 7776, 243 ]
 * 
 * ubique.power(5,c);
 * // [ 3125, 15625, 125 ]
 * 
 * ubique.power(a,5);
 * // [[ 3125, 7776, 3125 ], [ 16807, 32768, -1 ]]
 * 
 * ubique.power(5,a);
 * // [[ 3125, 15625, 3125 ], [ 78125, 3.90625e+5, 0.2 ]]
 * 
 * ubique.power(c,d);
 * // [ 2.23607, 0.00462963, 12.5135 ]
 * 
 * ubique.power(a,b);
 * // [[ 0.2, 216, 0.2 ], [ 2401, 32768, -1 ]]
 */
 $u.power = function(x,y) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return Math.pow(x,y);
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return Math.pow(x,val);});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return Math.pow(x,val);})
 	}
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return Math.pow(val,y);});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return Math.pow(val,y);})
 	}
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = Math.pow(x[i],y[i]);
 		}
 		return v;
 	}
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
 		var v = [];
 		for (var i = 0;i < $u.nrows(x);i++) {
 			var vx = $u.getrow(x,i),
 			vy = $u.getrow(y,i);
 			v[i] = $u.power(vx,vy);
 		}
 		return v;
 	}
 }

}
},{}],68:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method prod
 * @summary Product of array elements
 * @description Product of array elements
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension, 1: column 0: row (def: 1)
 * @return {number|array}   
 *
 * @example
 * ubique.prod([5,6,3]);
 * // 90
 * 
 * ubique.prod([[5,6,5],[7,8,-1]],0);
 * // [ [ 150 ], [ -56 ] ]
 * 
 * ubique.prod([[5,6,5],[7,8,-1]],1);
 * // [ [ 35, 48, -5 ] ]
 */
 $u.prod = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  dim = dim == null ? 1 : dim;
  var _prod = function(a) {
    var prod = 1;
    for (var i = 0;i < a.length;i++) {
      prod *= a[i];
    }
    return prod;
  }
  return $u.vectorfun(dim,x,_prod);
}
}
},{}],69:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method rdivide
 * @summary Right array division X. / Y
 * @description Divides each element of X by the corresponding element of Y. Inputs X and Y
 * must have the same size
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var b = [-1,-2,-3];
 * var e = [[9, 5], [6, 1]];
 * var f = [[3, 2], [5, 2]];
 * 
 * ubique.rdivide(5,6);
 * // 0.833333
 * 
 * ubique.rdivide(a,3);
 * // [[ 1.66667, 2, 1.66667 ], [ 2.33333, 2.66667, -0.333333 ]]
 * 
 * ubique.rdivide(3,[-1,-2,-3]);
 * // [ -3, -1.5, -1 ]
 * 
 * ubique.rdivide([5,6,7],[-1,-2,-3]);
 * // [ -5, -3, -2.33333 ]
 * 
 * ubique.rdivide(e,f);
 * // [[ 3, 2.5 ], [ 1.2, 0.5 ]]
 * 
 * ubique.rdivide(e,3);
 * // [[ 3, 1.66667 ], [ 2, 0.333333 ]]
 */
 $u.rdivide = function(x,y) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return x / y;
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return x / val;});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return x / val;})
 	}
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return val / y;});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return val / y;})
 	}
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = x[i] / y[i];
 		}
 		return v;
 	}
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
 		var v = [];
 		for (var i = 0;i < $u.nrows(x);i++) {
 			var vx = $u.getrow(x,i),
 			vy = $u.getrow(y,i);
 			v[i] = $u.rdivide(vx,vy);
 		}
 		return v;
 	}
 }
}
},{}],70:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method rem
 * @summary Remainder after division
 * @description Remainder after division. Element-wise for matrix
 * 
 * @param  {number|array|matrix} x dividend
 * @param  {number|array|matrix} y divisor
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.rem([13,-7],2.2);
 * // [ 2, -0.4 ]
 * 
 * ubique.rem([13,-7],[5,6]);
 * // [ 3, -1 ]
 * 
 * ubique.rem([[5,6,5],[7,8,-1]],[[-1,3,-1],[4,5,9]]);
 * // [ [ 0, 0, 0 ], [ 3, 3, -1 ] ]
 */
 $u.rem = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var n = $u.fix($u.rdivide(x,y));
 	return $u.minus(x,$u.times(n,y));
 }

}
},{}],71:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
 	/**
 * @method round
 * @summary Round to nearest integer
 * @description Round to nearest integer. Element-wise for matrix
 * 
 * @param  {number|array|matrix} x values
 * @param  {number} n number of decimal (def: 0)
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.round(Math.PI,12);
 * // 3.14159265359
 * 
 * ubique.round([-1.4543,4.5234],2);
 * // [ -1.45, 4.52 ]
 * 
 * ubique.round([-1.9,-0.2,3.4,5.6,7.0]);
 * // [ -2, -0, 3, 6, 7 ]
 * 
 * ubique.round([[1.45,-2.3],[1.1,-4.3]]);
 * // [ [ 1, -2 ], [ 1, -4 ] ]
 */
 $u.round = function(x,n) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	n = n == null ? 0 : n;
 	var p = Math.pow(10,n);
 	var _round = function(a) {
    return Math.round(a * p) / p;
  }
  return $u.arrayfun(x,_round);
}

}
},{}],72:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method sum
 * @summary Sum of array elements
 * @description Sum of array elements
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension, 1: column 0: row (def: 0)
 * @return {number|array}   
 *
 * @example
 * ubique.sum([5,6,3]);
 * // 14
 * 
 * ubique.sum([[5,6,5],[7,8,-1]],0);
 * // [ [ 16 ], [ 14 ] ]
 * 
 * ubique.sum([[5,6,5],[7,8,-1]],1);
 * // [ [ 12, 14, 4 ] ]
 */
 $u.sum = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim = dim == null ? 0 : dim;
 	var _sum = function(a) {
 		var sum = 0;
 		for (var i = 0;i < a.length;i++) {
 			sum += a[i];
 		}
 		return sum;
 	}
 	return $u.vectorfun(dim,x,_sum);
 }

}
},{}],73:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method times
 * @summary Array multiply X. * Y
 * @description  Element-by-element multiplication. X and Y must have the same dimensions unless ones is a number
 * 
 * @param  {number|array|matrix} x number or array of values
 * @param  {number|array|matrix} y number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.times(5,6);
 * // 30
 * 
 * ubique.times([5,6,4],[3,-1,0]);
 * // [ 15, -6, 0 ]
 * 
 * ubique.times([5,6,4],10);
 * // [ 50, 60, 40 ]
 * 
 * ubique.times([[5,6,5],[7,8,-1]],[[-1,3,-1],[4,5,9]]);
 * // [ [ -5, 18, -5 ], [ 28, 40, -9 ] ]
 */
 $u.times = function(x,y) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		if ($u.isnumber(y)) {
 			return x * y;
 		}
 		if ($u.ismatrix(y)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(y);i++) {
 				var vec = $u.getrow(y,i);
 				v[i] = $u.arrayfun(vec,function(val){return x * val;});
 			}
 			return v;
 		}
 		return $u.arrayfun(y,function(val){return x * val;})
 	} else
 	if ($u.isnumber(y)) {
 		if ($u.ismatrix(x)) {
 			var v = [];
 			for (var i = 0;i < $u.nrows(x);i++) {
 				var vec = $u.getrow(x,i);
 				v[i] = $u.arrayfun(vec,function(val){return val * y;});
 			}
 			return v;
 		}
 		return $u.arrayfun(x,function(val){return val * y;})
 	} else
 	if ($u.isarray(x) && $u.isarray(y)) {
 		var v = [];
 		for (var i = 0;i < x.length;i++) {
 			v[i] = x[i] * y[i];
 		}
 		return v;
 	} else
 	if ($u.ismatrix(x) && $u.ismatrix(y)) {
 		var v = [];
 		for (var i = 0;i < $u.nrows(x);i++) {
 			var vx = $u.getrow(x,i),
 			vy = $u.getrow(y,i);
 			v[i] = $u.times(vx,vy);
 		}
 		return v;
 	} else {
 		throw new Error('unknown input arguments');
 	}
 }

}
},{}],74:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method uminus
 * @summary Unary minus -X
 * @description Unary minus -X
 * 
 * @param  {number|array|matrix} x number or array of values
 * @return {number|array|matrix}
 *
 * @example
 * ubique.uminus(-5);
 * // 5
 * 
 * ubique.uminus([5,6]);
 * // [ -5, -6 ]
 * 
 * ubique.uminus([[5,6],[-1,-3]]);
 * // [ [ -5, -6 ], [ 1, 3 ] ]
 */
 $u.uminus = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  return $u.arrayfun(x,function(a){return -1 * a;});
}

}
},{}],75:[function(require,module,exports){
/**
 * Set Operations
 */
 module.exports = function($u) {
/**
 * @method unique
 * @summary Unique values in array or matrix
 * @description Unique values in array or matrix. Use mergsort to sort values, returns
 * a matrix with 2 array, the unique values and the unique indexes.
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {boolean} flag flag 0: export unique values, 1: export values and indexes(def: 0)
 * @return {array|matrix}
 *
 * @example
 * ubique.unique([9,-3,2,-12,0,1,0,1,2,3,4,5]);
 * // [ -3, -3, 0, 1, 2, 3, 4, 5, 9 ]
 *
 * ubique.unique([9,-3,2,-12,0,1,0,1,2,3,4,5],1);
 * // [ [ -3, -3, 0, 1, 2, 3, 4, 5, 9 ], [ 3, 1, 4, 5, 2, 9, 10, 11, 0 ] ]
 * 
 * ubique.unique([[5,4],[5,3],[6,3]]);
 * // [ 3, 4, 5, 6 ]
 *
 * ubique.unique([[5,4],[5,3],[6,3]],1);
 * // [ [ 3, 4, 5, 6 ], [ 3, 1, 0, 4 ] ]
 */
 $u.unique = function(x,flag) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  flag = flag == null ? 0 : flag;
  if ($u.ismatrix) {
    x = $u.flatten(x); // flatten by rows
  }
  var sorted = $u.mergesort(x);
  var uvalue = [sorted[0][1]];
  var uindex = [sorted[1][0]];

  for (var i = 1;i < sorted[0].length; i++) {
    if (sorted[0][i] !== sorted[0][i - 1]) {
      uvalue.push(sorted[0][i]);
      uindex.push(sorted[1][i]);
    }
  }
  if (flag === 0) {
    return uvalue;
  } else
  if (flag === 1) {
    return [uvalue,uindex];
  } else {
    throw new Error('flag can be only 0 (default) or 1');
  }
}
}

},{}],76:[function(require,module,exports){
/**
 * Complex Numbers
 */
 module.exports = function($u) {
/**
 * @method abs
 * @summary Absolute value
 * @description Absolute value
 * 
 * @param  {number|array|matrix} x number or array of values
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.abs(-0.5);
 * // -1
 * 
 * ubique.abs([0.1,-0.5]);
 * // [0.1, 0.5]
 * 
 * ubique.abs([[5,-2],[-3,4]]);
 * // [[5, 2], [3, 4]]
 */
 $u.abs = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var fun = Math.abs;
 	if ($u.isnumber(x)) {
 		return fun(x);
 	}
 	return $u.arrayfun(x,fun);
 }

}
},{}],77:[function(require,module,exports){
/**
 * Special Functions
 */
 module.exports = function($u) {
/**
 * @method  erf
 * @summary Error function
 * @description Error function
 * 
 * Approximation with maximal error 1.2x10^-7
 * erf(x) = 2/sqrt(pi) * integral from 0 to x of exp(-t^2) dt
 * 
 * @param  {number} x real value
 * @return {number}
 * 
 * @example
 * ubique.erf(0.5);
 * // 0.5204999077232426
 */
 $u.erf = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return 1 - $u.erfc(x);
}

}
},{}],78:[function(require,module,exports){
/**
 * Special Functions
 */
 module.exports = function($u) {
/**
 * @method erfc
 * @summary Complementary error function
 * @description Complementary error function
 *
 * erfc(x) = 2/sqrt(pi) * integral from x to inf of exp(-t^2) dt
 * erfc(x) = 1 - erf(x)
 * 
 * @param  {number} x must be real
 * @return {number}
 * 
 * @example
 * ubique.erfc(0.5);
 * // 0.47950009227675744
 */
 $u.erfc = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var z = Math.abs(x),
  t = 1 / (0.5 * z + 1),
  a1 = t * 0.17087277 + -0.82215223,
  a2 = t * a1 + 1.48851587,
  a3 = t * a2 + -1.13520398,
  a4 = t * a3 + 0.27886807,
  a5 = t * a4 + -0.18628806,
  a6 = t * a5 + 0.09678418,
  a7 = t * a6 + 0.37409196,
  a8 = t * a7 + 1.00002368,
  a9 = t * a8,
  a10 = -z * z - 1.26551223 + a9,
  a = t * Math.exp(a10);

  if (x < 0) {a = 2 - a;}
  return a;
}

}
},{}],79:[function(require,module,exports){
/**
 * Special Functions
 */
 module.exports = function($u) {
/**
 * @method  erfcinv
 * @summary Inverse complementary error function
 * @description Inverse complementary error function
 * 
 * It satisfies y = erfc(x) for 2 >= y >= 0 with -Inf <= x <= Inf
 * 
 * @param  {number} y real value in range [2,0]
 * @return {number}   
 *
 * @example
 * ubique.erfcinv(1.5);
 * // -0.476936236121904
 */
 $u.erfcinv = function(y) {
    if (arguments.length === 0) {
        throw new Error('not enough input arguments');
    }
    if (y >= 2) {return -Infinity;}
    if (y <= 0) {return Infinity;}
    var z = 0,
    _y = (y < 1) ? y : 2 - y,
    t = Math.sqrt(-2 * Math.log(_y / 2));
    x = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
    for (var i = 0; i < 2; i++) {
        z = $u.erfc(x) - _y;
        x += z / (1.12837916709551257 * Math.exp(-x * x) - x * z);
    }
    return (y < 1) ? x : -x;
}

}
},{}],80:[function(require,module,exports){
/**
 * Special Functions
 */
 module.exports = function($u) {
/**
 * @method  erfinv
 * @summary Inverse error function
 * @description Inverse error function
 * 
 * The inverse error function satisfies y = erf(x), for -1 <= y <= 1 and -inf <= x <= inf
 * 
 * @param  {number} y real value in range [-1,1]
 * @return {number}   
 *
 * @example
 * ubique.erfinv(0.1);
 * // 0.08885596505119545
 */
 $u.erfinv = function(y) {
    if (arguments.length === 0) {
        throw new Error('not enough input arguments');
    }
    var x,x1,x2,x3,x4,x5,x6,x7,x8,x9,z,z1,z2,z3
    if (y <= -1) {x = -Infinity;return x;}
    else if (y >= 1) {x = Infinity;return x;}
    else if (y < -0.7) {
        z1 = (1 + y) / 2;
        z2 = Math.log(z1) / Math.log(Math.E);
        z3 = Math.sqrt(-z2);
        z = z3;
        x1 = 1.641345311 * z + 3.429567803;
        x2 = x1 * z + -1.624906493;
        x3 = x2 * z + -1.970840454;
        x4 = 1.637067800 * z + 3.543889200;
        x5 = x4 * z + 1;
        x6 = -x3 / x5;
        x = x6;
    } else if (y < 0.7) {
        z = y * y;
        x1 = -0.140543331 * z + 0.914624893;
        x2 = x1 * z + -1.645349621;
        x3 = x2 * z + 0.886226899;
        x4 = 0.012229801 * z + -0.329097515;
        x5 = x4 * z + -0.329097515;
        x6 = x5 * z + 1.442710462;
        x7 = x6 * z + -2.118377725;
        x8 = x7 * z + 1;
        x9 = y * x3 / x8;
        x = x9;
    } else {
        z1 = (1 + y) / 2;
        z2 = Math.log(z1);
        z3 = Math.sqrt(-z2);
        z = z3;
        x1 = 1.641345311 * z + 3.429567803;
        x2 = x1 * z + -1.624906493;
        x3 = x2 * z + -1.970840454;
        x4 = 1.637067800 * z +  3.543889200;
        x5 = x4 * z + 1;
        x6 = x3 / x5;
        x = x6;
    }
    x = x - ($u.erf(x) - y) / (2/Math.sqrt(Math.PI) * Math.exp(-x*x));
    x = x - ($u.erf(x) - y) / (2/Math.sqrt(Math.PI) * Math.exp(-x*x));

    return x;
}

}
},{}],81:[function(require,module,exports){
/**
 * Exponents and Logarithms
 */
 module.exports = function($u) {
/**
 * @method exp
 * @summary Exponential value
 * @description Exponential value
 * 
 * @param  {number|array|matrix} x element
 * @return {number|array|matrix}   
 *
 * @example  
 * ubique.exp(6);
 * // 403.429
 * 
 * ubique.exp([5,6,3]);
 * // [148.413, 403.429, 20.0855]
 * 
 * ubqie.exp([[5,6,5],[7,8,-1]]);
 * // [[148.413, 403.429, 148.413], [1096.63, 2980.96, 0.367879]]
 */
 $u.exp = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var fun = Math.exp;
 	if ($u.isnumber(x)) {
 		return fun(x);
 	}
 	return $u.arrayfun(x,fun)
 }

}
},{}],82:[function(require,module,exports){
/**
 * Exponents and Logarithms
 */
 module.exports = function($u) {
/**
 * @method log
 * @summary Natural logarithm
 * @description Natural logarithm
 * 
 * @param  {number|array|matrix} x element
 * @return {number|array|matrix}   
 *
 * @example  
 * ubique.log(6);
 * // 1.79176
 * 
 * ubique.log([5,6,3]);
 * // [ 1.60944, 1.79176, 1.09861 ]
 * 
 * ubique.log([[5,6,5],[7,8,2]]);
 * // [ [ 1.6094, 1.7918, 1.6094 ], [ 1.9459, 2.0794, 0.6931 ] ]
 */
 $u.log = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var fun = Math.log;
 	if ($u.isnumber(x)) {
 		return fun(x);
 	}
 	return $u.arrayfun(x,fun)
 }

}
},{}],83:[function(require,module,exports){
/**
 * Complex Numbers
 */
 module.exports = function($u) {
/**
 * @method sign
 * @summary Signum function
 * @description Signum function
 * 
 * @param  {number|array|matrix} x element
 * @return {number|array|matrix}   
 *
 * @example
 * ubique.sign(-0.5);
 * // -1
 * 
 * ubique.sign([0.1,-0.5]);
 * // [1, -1]
 * 
 * ubique.sign([[5,-2],[-3,4]]);
 * // [[1, -1], [-1, 1]]
 */
 $u.sign = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var _sign = function(val) {
 		if ($u.isnumber(val)) {
 			if (val > 0) {
 				return 1;
 			} else
 			if (val < 0) {
 				return -1;
 			}
 			return 0;
 		} else {
 			return NaN;
 		}
 	}
 	if ($u.isnumber(x)) {
 		return _sign(x);
 	}
 	return $u.arrayfun(x,_sign)
 }

}
},{}],84:[function(require,module,exports){
/**
 * Exponents and Logarithms
 */
 module.exports = function($u) {
/**
 * @method log
 * @summary Square root
 * @description Square root
 * 
 * @param  {number|array|matrix} x element
 * @return {number|array|matrix}   
 *
 * @example  
 * ubique.sqrt(6);
 * // 2.44949
 * ubique.sqrt([5,6,3]);
 * // [ 2.23607, 2.44949, 1.73205 ]
 * ubique.sqrt([[5,6,5],[7,8,2]]);
 * // [ [ 2.2361, 2.4495, 2.2361 ], [ 2.6458, 2.8284, 1.4142 ] ]
 */
 $u.sqrt = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var fun = Math.sqrt;
 	if ($u.isnumber(x)) {
 		return fun(x);
 	}
 	return $u.arrayfun(x,fun)
 }

}
},{}],85:[function(require,module,exports){
/**
 * External Library
 */
module.exports = function($u) {
 // moment.js - Parse, validate, manipulate, and display dates in JavaScript (http://momentjs.com/)
 $u.__moment = require('moment');
 // request.js - Simplified HTTP request client (https://github.com/request/request)
 $u.__request = require('request');
 // sync-request.js  - Make synchronous web requests with cross platform support (https://github.com/ForbesLindesay/sync-request)
 $u.__syncrequest = require('sync-request');
}

},{"moment":5,"request":2,"sync-request":12}],86:[function(require,module,exports){
/**
 * Matrix Analysis
 */
 module.exports = function($u) {
/**
 * @method det
 * @summary Matrix determinant
 * @description Matrix determinant with LU decomposition method
 *
 * @param  {matrix} x square matrix
 * @return {number}   
 * 
 * @example
 * ubique.det([[1,5],[6,2]]);
 * // -28
 * 
 * ubique.det([[2,2],[2,3]]);
 * // 2
 */
 $u.det = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x) || $u.isarray(x)) {
 		throw new Error('input must be a matrix');
 	}
 	if (!$u.issquare(x)) {
 		throw new Error('matrix must be square')
 	}
 	if ($u.issingular(x)) {
 		throw new Error('matrix is singular');
 	}
 	var n = $u.ncols(x),
 	lumat = $u.lu(x),
    out = lumat.S;
 	for (var i = 0;i < n;i++) {
 		out = out * lumat.LU[i][i];
 	}
 	return out;
 }

}
},{}],87:[function(require,module,exports){
/**
 * Linear Equations
 */
 module.exports = function($u) {
  /**
  * @method inv
  * @summary Matrix inverse
  * @description Inverse of a square matrix
  * 
  * @param  {number|array|matrix} x number or array of values
  * @return {number|array|matrix}   
  *
  * @example
  * ubique.inv([[3, 2], [5, 2]]);
  * // [ [ -0.5, 0.5 ], [ 1.25, -0.75 ] ]
  * 
  * ubique.inv([[1,1,-1],[1,-2,3],[2,3,1]]);
  * // [ [ 0.846154, 0.307692, -0.076923 ], [ -0.384615, -0.230769, 0.307692 ], [ -0.538462, 0.076923, 0.230769 ] ]
  */
  $u.inv = function(x) {
    if (arguments.length === 0) {
      throw new Error('not enough input arguments');
    }
    if (!$u.issquare(x)) {
      throw new Error('matrix must be square');
    }
    if ($u.isnumber(x)) {
      return 1/x;
    }
    var m = $u.nrows(x);
    var I = $u.eye(m);
    return $u.linsolve(x,I);

  }

}
},{}],88:[function(require,module,exports){
/**
 * Linear Equations
 */
 module.exports = function($u) {
  /**
  * @method linsolve
  * @summary Solve linear system of equations Ax = b
  * @description Solve linear system of equations Ax = b using LU factorization with 
  * rows pivoting
  * 
  * @param  {matrix} A square matrix
  * @param  {array|matrix} b vector or matrix
  * @return {array|matrix}   
  *
  * @example
  * var transp = ubique.transpose;
  *
  * ubique.linsolve([[1,1,-1],[1,-2,3],[2,3,1]],transp([5,6,3]));
  * [ 5.846154, -2.384615, -1.538462 ]
  * 
  * ubique.linsolve([[1,1,-1],[1,-2,3],[2,3,1]],[[4],[-6],[7]]);
  * // [1, 2, -1]
  * 
  * ubique.linsolve([[1,1,-1],[1,-2,3],[2,3,1]],ubique.eye(3));
  * // [[0.846154, 0.307692, -0.0769231], [-0.384615, -0.230769, 0.307692], [-0.538462, 0.0769231, 0.230769]]
  */
  $u.linsolve = function(A,b) {
    if (arguments.length <= 1) {
      throw new Error('not enough input arguments');
    }
    if ($u.nrows(A) !== $u.nrows(b)) {
    	throw new Error('matrix dimensions must agree');
    }
    if (!$u.issquare(A)) {
      throw new Error('matrix must be square');
    }
    if ($u.isnumber(A) && $u.isnumber(b)) {
      return b/A;
    }
    var lud = $u.lu(A);
    if ($u.issingular(lud.LU)) {
    	throw new Error('matrix is singular');
    }
    var LU = lud.LU;
    var m = $u.nrows(LU);
    var bn = $u.ncols(b);
    var bidx = $u.colon(0,bn - 1);

    if ($u.isarray(b)) {
      x = $u.subset(b,lud.P);
    } else
    if ($u.ismatrix(b)) {
      x = $u.subset(b,lud.P,bidx);
    }
    
    var solve = function(LU,m,x) {
      sum = 0;
      // Solve Ly = b using forward substitution
      for (var i = 1;i < m;i++) {
        sum = x[i];
        for (var j = 0;j < i;j++){
          sum -= LU[i][j] * x[j];
        }
        x[i] = sum;
      }

      // Solve Ux = y using back substitution
      x[m-1] /= LU[m-1][m-1];
      for (var i = m-2;i >= 0;i--) {
        sum = x[i];
        for (var j = i+1;j < m;j++) {
          sum -= LU[i][j] * x[j];
        }
        x[i] = sum / LU[i][i];
      }
      return x;
    }
    
    for (var h = 0;h < bn;h++) {
      var tcol = $u.getcol(x,h);
      if (h === 0) {
        out = $u.transpose(solve(LU,m,tcol));
      } else {
        out = $u.cat(1,out,$u.transpose(solve(LU,m,tcol)));
      }
    }
    return out;
  }
}
},{}],89:[function(require,module,exports){
/**
 * Matrix Decomposition
 */
 module.exports = function($u) {
/**
 * @method lu
 * @summary LU matrix factorization
 * @description LU matrix factorization based on Doolittle algorithm. The LU decomposition with pivoting always exists, even if the matrix is singular.  
 * Returns an object:  
 * 
 * LU (lu matrix) 
 * L (lower triangular matrix)
 * U (upper triangular matrix)
 * P (pivot vector)
 * S (pivot sign) +1 or -1
 * 
 * @param  {matrix} x input matrix
 * @return {object}    .LU (lu matrix) 
 *                     .L (lower triangular matrix)
 *                     .U (upper triangular matrix)
 *                     .P (pivot vector)
 *                     .S (pivot sign) +1 or -1
 *
 * @example
 * ubique.lu([[5,6,5],[7,8,-1]]);
 * // { LU: [ [ 7, 8, -1 ], [ 0.714286, 0.285714, 5.714286 ] ],
 * //    L: [ [ 1, 0 ], [ 0.714286, 1 ] ],
 * //    U: [ [ 7, 8, -1 ], [ 0, 0.285714, 5.714286 ] ],
 * //    P: [ 1, 0 ],
 * //    S: -1;}
 *
 * ubique.lu([[0, 5], [6, 0]]);
 * // { LU: [ [ 6, 0 ], [ 0, 5 ] ],
 * //    L: [ [ 1, 0 ], [ 0, 1 ] ],
 * //    U: [ [ 6, 0 ], [ 0, 5 ] ],
 * //    P: [ 1, 0 ],
 * //    S: -1;}
 */
 $u.lu = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}

 	// LU decomposition
 	var lud = function(a) {
 		var _a = $u.clone(a);
 		var m = $u.nrows(_a);
 		var n = $u.ncols(_a);
 		var piv = $u.colon(0,m - 1);
 		var pivsign = 1;
 		var _arow = [];
 		var _acol = [];

 		for (var j = 0; j < n; j++) {

 			_acol = $u.getcol(_a,j);

 			for (var i = 0; i < m; i++) {

 				_arow = $u.getrow(_a,i);

 				var kmax = Math.min(i, j);
 				var s = 0;
 				for (var k = 0; k < kmax; k++) {
 					s += _arow[k] * _acol[k];
 				}
 				_arow[j] = _acol[i] -= s;
 			}

 			var p = j;
 			for (var i = j + 1; i < m; i++) {
 				if (Math.abs(_acol[i]) > Math.abs(_acol[p])) {
 					p = i;
 				}
 			}
 			if (p !== j) {
 				for (var k = 0; k < n; k++) {
 					var t = _a[p][k];
 					_a[p][k] = _a[j][k];
 					_a[j][k] = t;
 				}
 				var k = piv[p];
 				piv[p] = piv[j];
 				piv[j] = k;
 				pivsign = -pivsign;
 			}

 			if (j < m && _a[j][j] !== 0) {
 				for (var i = j + 1; i < m; i++) {
 					_a[i][j] /= _a[j][j];
 				}
 			}
 		}
 		return {'Y':_a,'P':piv,'S':pivsign};
 	}

 	// Lower triangular matrix L
 	var ltm = function(L) {
 		var m = $u.nrows(L),
 		n = $u.ncols(L);
 		if (m < n) {
 			var _L = $u.zeros(m,m);
 		} else {
 			var _L = $u.zeros(m,n);
 		}
 		for (var i = 0; i < $u.nrows(_L); i++) {
 			for (var j = 0; j < $u.ncols(_L); j++) {
 				if (i > j) {
 					_L[i][j] = L[i][j];
 				} else 
 				if (i == j) {
 					_L[i][j] = 1;
 				}
 			}
 		}
 		return _L;
 	}

    // Upper triangular matrix U
    var utm = function(U) {
    	var m = $u.nrows(U),
    	n = $u.ncols(U);
    	if (m < n) {
    		var _U = $u.zeros(m,n);
    	} else {
    		var _U = $u.zeros(n,n);
    	}
    	for (var i = 0; i < m; i++) {
    		for (var j = 0; j < n; j++) {
    			if (i <= j) {
    				_U[i][j] = U[i][j];
    			}
    		}
    	}
    	return _U;
    }

    // LU matrix
    var _LU = lud(x);
    return {'LU':_LU.Y,'L':ltm(_LU.Y),'U':utm(_LU.Y),'P':_LU.P,'S':_LU.S};
}



}
},{}],90:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method array
 * @summary Create an array with custom elements
 * @description Create an array with custom elements
 * 
 * @param  {number} n number of elements
 * @param  {number|string|boolean} val values of the array 
 * @return {array}       
 *
 * @example
 * ubique.array(3);
 * // [ null, null, null ]
 * 
 * ubique.array(3,-1);
 * // [-1, -1, -1]
 * 
 * ubique.array(3,'y');
 * // [ 'y', 'y', 'y' ]
 * 
 * ubique.array(4,true);
 * // [ true, true, true, true ]
 */
 $u.array = function(n,val) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if (!$u.isnumber(n)) {
    throw new Error('number of elements must be a positive integer');
  }
  val = val == null ? null : val;
  var arr = [];
  for (var i = 0; i < n; i++) {
    arr[i] = val;
  }
  return arr;
}
}
},{}],91:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method cat
 * @summary Concatenate arrays and matrices
 * @description Concatenate arrays and matrices along specified dimension as first argument.
 * Number size 1x1, Array size 1xN, Matrix size MxN
 *              
 * @param  {number|array|matrix...} args variable arguments (0:rows, 1:columns)
 * @return {array|matrix}     
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var b = [[-1,3,-1],[4,5,9]];
 * var c = [5,6,3];
 * var d = [0.5,-3,2.3];
 * var f = [[3, 2], [5, 2]];
 *
 * // Vertical Concatenation (DIM = 0)
 * 
 * ubique.cat(0,1,2,3,4);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(0,1,2,[3],4);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(0,1,2,[[3],[4]]);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(0,[1],2,3,[4]);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(0,c,d);
 * // [ [ 5, 6, 3 ], [ 0.5, -3, 2.3 ] ]
 *
 * ubique.cat(0,c,d,a);
 * // [ [ 5, 6, 3 ], [ 0.5, -3, 2.3 ], [ 5, 6, 5 ], [ 7, 8, -1 ] ]
 *
 * ubique.cat(0,[[1]],[2],3,4);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(0,a,c);
 * // [ [ 5, 6, 5 ], [ 7, 8, -1 ], [ 5, 6, 3 ] ]
 *
 * // Horizontal Concatenation (DIM = 1)
 *
 * ubique.cat(1,1,2,3,4);
 * // [ [ 1, 2, 3, 4 ] ]
 *
 * ubique.cat(1,1,2,[3],4);
 * // [ [ 1, 2, 3, 4 ] ]
 *
 * ubique.cat(1,1,2,[3,4]);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 *
 * ubique.cat(1,[1],2,3,4);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 * 
 * ubique.cat(1,[[1]],2,3,4);
 * // [ [ 1 ], [ 2 ], [ 3 ], [ 4 ] ]
 * 
 * ubique.cat(1,c,5);
 * // [ [ 5, 6, 3, 5 ] ]
 * 
 * ubique.cat(1,c,d);
 * // [ [ 5, 6, 3, 0.5, -3, 2.3 ] ]
 * 
 * ubique.cat(1,[[2,3,4,5]],c,d);
 * // [ [ 2, 3, 4, 5, 5, 6, 3, 0.5, -3, 2.3 ] ]
 */
 $u.cat = function() {
 	var _args = arguments;
 	var nargs = arguments.length;
  var out = [];
  if (nargs < 2) {
    throw new Error('not enough input arguments');
  }
  var dim = _args[0];
  if (dim !== 0 && dim !== 1) {
    throw new Error('dimension must be 0 (rows) or 1 (columns)');
  }

  if (dim === 0) {
    for (var i = 1;i < nargs - 1;i++) {
     var tmp = _args[i + 1];
     if ($u.isnumber(_args[1])) {  // number
      if (i === 1) {
        out = [[_args[1]]];
      }
      if ($u.isnumber(tmp)) {
        out.push([tmp]);
      } else
      if ($u.isarray(tmp) && $u.ncols(tmp) === 1) {
        out.push(tmp);
      } else
      if ($u.ismatrix(tmp) && $u.ncols(tmp) === 1) {
        out = out.concat(tmp);
      } else {
        throw new Error('concatenation dimension mismatch');
      }
    } else 
    if ($u.isarray(_args[1])) { // array
      if (i === 1) {
        out = [_args[1]]; 
      }
      if ($u.isnumber(tmp) && $u.ncols(out) === 1) {
        out.push([tmp]);
      } else
      if ($u.isarray(tmp) && $u.ncols(tmp) === $u.ncols(out)) {
        out.push(tmp);
      } else
      if ($u.ismatrix(tmp) && $u.ncols(tmp) === $u.ncols(out)) {
        out = out.concat(tmp);
      } else {
        throw new Error('concatenation dimension mismatch');
      }
    } else 
    if ($u.ismatrix(_args[1])) { // matrix
      if (i === 1) {
        out = _args[1]; 
      }
      if ($u.isnumber(tmp) && $u.ncols(out) === 1) {
        out.push([tmp]);
      } else
      if ($u.isarray(tmp) && $u.ncols(tmp) === $u.ncols(out)) {
        out.push(tmp);
      } else
      if ($u.ismatrix(tmp) && $u.ncols(tmp) === $u.ncols(out)) {
        out = out.concat(tmp);
      } else {
        throw new Error('concatenation dimension mismatch');
      }
    } else {
      throw new Error('unknown input arguments');
    }
  }
  return out;
}

if (dim === 1) {
  var out = [];
  for (var i = 0;i < nargs - 1;i++) {
    var tmp = _args[i + 1];
    if ($u.isnumber(tmp)) {
      tmp = [[tmp]];
    }
    if ($u.isarray(tmp)) {
      tmp = [tmp];
    }
    if (i === 0) {
      out = $u.clone(tmp);
    } else {
      for (var j = 0;j < $u.nrows(out);j++) {
        var row = out[j];
        row = row.concat(tmp[j]);
        out[j] = row;
      }
    }
  }
  return out;
}
}

}
},{}],92:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method clone
 * @summary Create a clone of the input array or matrix
 * @description Create a clone of the input array or matrix
 * 
 * @param  {array|matrix} x array or matrix
 * @return {array|matrix}       
 *
 * @example
 * ubique.clone([[-1,3,-1],[4,5,9]]);
 * // [ [ -1, 3, -1 ], [ 4, 5, 9 ] ]
 * 
 * ubique.clone([5,6,3]);
 * // [ 5, 6, 3 ]
 */
 $u.clone = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x)) {
 		return x;
 	}
 	if ($u.isarray(x)) {
 		var out = new Array(x.length);
 		for (var i = 0; i < x.length; i++) {
 			out[i] = x[i];
 		}
 		return out;
 	}
 	if ($u.ismatrix(x)) {
 		var size = $u.size(x),
 		out = new Array(size[0]);
 		for (var i = 0;i < size[0];i++) {
 			out[i] = new Array(size[1]);
 			for (j = 0; j < size[1]; j++) {
 				out[i][j] = x[i][j];
 			}
 		}
 		return out;
 	}

 }
}
},{}],93:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method colon
 * @summary Array of numbers from L to U with step S
 * @description Array of numbers from L to U with step S
 * 
 * @param  {number} l lower value of the array
 * @param  {number} u upper value of the array
 * @param  {number} s step value (def: 1)
 * @return {array}
 *
 * @example
 * ubique.colon(1,10,1);
 * // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * 
 * ubique.colon(10,1,1);
 * //  []
 * 
 * ubique.colon(-5,5,2);
 * // [-5, -3, -1, 1, 3, 5]
 * 
 * ubique.colon(-7,14,2);
 * // [-7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13]
 */
 $u.colon = function(l,u,s) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	s = s == null ? 1 : s;
 	if (s === 0 || (s > 0 && l > u) || (s < 0 && l < u)) {
 		return [];
 	}
 	var t = $u.fix((u - l) / s);
 	var out = [];
 	out[0] = l;
 	for (var i = 1; i <= t; i++ ) {
 		out[i] = out[i - 1] + s;
 	}
 	return out;
 }

}
},{}],94:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
 /**
 * @method diag
 * @summary Diagonal matrix and get diagonals of a matrix
 * @description  Diagonal matrix (for array) and get diagonals of a matrix (for matrix)
 * 
 * @param  {array|matrix} x array or matrix values
 * @param  {number} k k-th diagonal. 0: main diagonal, k > 0 above, k < 0 below (def: 0)
 * @return {array|matrix}   
 *
 * @example
 * // build diag matrix
 * ubique.diag([5,6,-3]);
 * // [ [ 5, 0, 0 ], [ 0, 6, 0 ], [ 0, 0, -3 ] ]
 * 
 * ubique.diag([5,6,-3],1);
 * // [ [ 0, 5, 0, 0 ],[ 0, 0, 6, 0 ],[ 0, 0, 0, -3 ],[ 0, 0, 0, 0 ] ]
 * 
 * ubique.diag([5,6,-3],-1);
 * // [ [ 0, 0, 0, 0 ],[ 5, 0, 0, 0 ],[ 0, 6, 0, 0 ],[ 0, 0, -3, 0 ] ]
 *
 * // get diag values from matrix
 * ubique.diag([[5, 0, 0], [0, 6, 0], [0, 0, -3]]);
 * // [ 5, 6, -3 ]
 * 
 * ubique.diag([[0, 5, 0, 0], [0, 0, 6, 0], [0, 0, 0, -3], [0, 0, 0, 0]],1);
 * // [ 5, 6, -3 ]
 * 
 * ubique.diag([[0, 0, 0, 0], [5, 0, 0, 0], [0, 6, 0, 0], [0, 0, -3, 0]],-1);
 * // [ 5, 6, -3 ]
 * 
 * ubique.diag([[5, 0, 0], [0, 6, 0], [0, 0, -3]],2);
 * // [0]
 */
 $u.diag = function(x,k) {
  if (arguments.length < 1) {
    throw new Error('not enough input arguments');
  }
  k = k == null ? 0 : k;
  var abs = Math.abs;
  if ($u.isarray(x)) {
    var n = x.length;
    var out = $u.zeros(n + abs(k),n + abs(k));
    for (var i = 0;i < n;i++) {
      if (k >= 0) {
       out[i][i + abs(k)] = x[i];
     }
     if (k < 0) {
       out[i + abs(k)][i] = x[i];
     }
   }
   return out;
 } else
 if ($u.ismatrix(x)) {
  var out = [];
  for (var i = 0;i < $u.nrows(x) - abs(k);i++) {
    if (k >= 0) {
      out.push(x[i][i + abs(k)]);
    }
    if (k < 0) {
      out.push(x[i + abs(k)][i]);
    }
  }
  return out;
} else {
  throw new Error('unknown input');
}
}

}
},{}],95:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method end
 * @summary Last index in array or matrix
 * @description Last index in array or matrix. Indexing is in the range [0...N-1]
 *  
 * @param  {array|matrix} x values
 * @param  {number} dim	(only for matrix) -1: [rows,columns], 0: rows, 1: column (def: -1)
 * @return {number|array}   
 * 
 * @example
 * ubique.end([5,6,3]);
 * // 2
 * 
 * ubique.end([[4,5,0],[-1,2,-3]]);
 * // [1, 2]
 * 
 * ubique.end([[4,5,0],[-1,2,-3]],0);
 * // 1
 */
 $u.end = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim = dim == null ? -1 : dim;
 	if ($u.isnumber(x)) {
 		return x;
 	} else 
 	if ($u.isarray(x)) {
 		return x.length - 1;
 	} else
 	if ($u.ismatrix(x)) {
 		if (!$u.isinteger(dim) || (dim < -1 || dim > 1)) {
 			throw new Error('dimension must be -1,0,1');
 		}
 		var idx = [$u.nrows(x) - 1,$u.ncols(x) - 1];
 		if (dim === -1) {
 			return idx;
 		} else {
 			return idx[dim];
 		}
 	} else 
 	throw new Error('unkown input arguments'); 	
 }

}


},{}],96:[function(require,module,exports){
/**
* Array Creation and Concatenation
*/
module.exports = function($u) {
/**
 * @method eye
 * @summary Identity matrix
 * @description Identity matrix
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}     
 *
 * @example
 * ubique.eye(0);
 * // []
 * 
 * ubique.eye(1);
 * // [ [ 1 ] ]
 * 
 * ubique.eye(2);
 * // [ [ 1, 0 ], [ 0, 1 ] ]
 * 
 * ubique.eye([2,1]);
 * // [ [ 1 ], [ 0 ] ]
 * 
 * ubique.eye(2,3);
 * // [ [ 1, 0, 0 ], [ 0, 1, 0 ] ]
 */
 $u.eye = function() {
  if (arguments.length === 0 ) {
    throw new Error('not enough input arguments');
  }
  var _args = $u.argsarray.apply(null,arguments);
  if ($u.ismatrix(_args)) {
    _args = _args[0];
  }
  if (_args.length === 1) {
    _args = [_args[0],_args[0]];
  }
  var matrix =  $u.matrix(_args,0);
  if ($u.isnumber(matrix)) {
    return 1;
  }
  for (var i = 0;i < Math.min.apply(Math,$u.size(matrix));i++) {
   matrix[i][i] = 1;
 }
 return matrix;
}
}
},{}],97:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method falses
 * @summary Create array of all false
 * @description Create array of all false
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}     
 *
 * @example
 * ubique.falses(0);
 * // []
 * 
 * ubique.falses(1);
 * // [ [ false ] ]
 * 
 * ubique.falses(2);
 * // [ [ false, false ], [ false, false ] ]
 * 
 * ubique.falses([2,1]);
 * // [ [ false ], [ false ] ]
 * 
 * ubique.falses(2,3);
 * // [ [ false, false, false ], [ false, false, false ] ]
 */
 $u.falses = function() {
  if (arguments.length === 0 ) {
    throw new Error('not enough input arguments');
  }
  var _args = $u.argsarray.apply(null,arguments);
  if ($u.ismatrix(_args)) {
    _args = _args[0];
  }
  if (_args.length === 1) {
    _args = [_args[0],_args[0]];
  }
  return $u.matrix(_args,false);
}

}
},{}],98:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method find
 * @summary Find indices of nonzero elements
 * @description Find indices of nonzero elements
 *
 * @param  {array|matrix} x values
 * @return {array|matrix}   
 *
 * @example
 * ubique.find([0.3,-0.4,0.5,0.9].map(function(a){return a > 0}));
 * // [ 0, 2, 3 ]
 * 
 * ubique.find([[true,true],[false,true]]);
 * // [ 0, 1, 3 ]
 */
 $u.find = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if ($u.isnumber(x)) {
    throw Error('input must be an array or matrix');
  }
  if ($u.ismatrix(x)) {
    x = $u.flatten(x); // flatten by rows
  }
  var dummy = $u.colon(0,x.length);
  return dummy.filter(function(el) {
    return x[el] === true;
  })
}
}
},{}],99:[function(require,module,exports){
/**
 * Arithmetic Operations
 */
 module.exports = function($u) {
/**
 * @method fix
 * @summary Round toward zero
 * @description Round toward zero
 * 
 * @param  {number|array|matrix} x number or array of values
 * @return {number|array|matrix}
 *
 * @example
 * ubique.fix(3.78);
 * // 3
 * 
 * ubique.fix([4.51,-1.4]);
 * // [ 4, -1 ]
 * 
 * ubique.fix([[4.51,-1.4],[3.78,0.01]]);
 * // [ [ 4, -1 ], [ 3, 0 ] ]
 */
 $u.fix = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var _fix = function(a) {
 		return a < 0 ? Math.ceil(a) : Math.floor(a);
 	}
 	return $u.arrayfun(x,_fix);
 }

}
},{}],100:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method flatten
 * @summary Flatten a matrix
 * @description Flatten a matrix and returns an array. The concatenation is made by columns (default)
 * 
 * @param  {matrix} x matrix of elements
 * @param  {number} dim dimension selected, 1: column 0: row (def: 0)
 * @return {array}  
 *
 * @example
 * ubique.flatten([[5,6],[7,8]]);
 * // [ 5, 7, 6, 8 ]
 *
 * // flatten by rows
 * ubique.flatten([[1,1,-1],[1,-2,3],[2,3,1]]);
 * // [ 1, 1, -1, 1, -2, 3, 2, 3, 1 ]
 *
 * // flatten by columns
 * ubique.flatten([[1,1,-1],[1,-2,3],[2,3,1]],1);
 * // [ 1, 1, 2, 1, -2, 3, -1, 3, 1 ]
 * 
 */
 $u.flatten = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim = dim == null ? 0 : dim;
 	if ($u.isnumber(x) || $u.isarray(x)) {
 		return x;
 	}
 	if ($u.ismatrix(x)) {
 		if (dim === 1) {
 			x = $u.transpose(x);
 		}
 		x = Array.prototype.concat.apply([], x);
 		if (x.some(Array.isArray)) {
 			return this.flatten(x);
 		} else {
 			return x;
 		}
 	} else {
 		throw new Error('unknown input arguments');
 	}
 }
}
},{}],101:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method flipdim
 * @summary Flip order of elements in array or matrix
 * @description Flip order of elements in array or matrix
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} dim dimension to apply reverse ordering 0: rows, 1: column (def: 1)
 * @return {array|matrix}     
 * 
 * @example
 * ubique.flipdim([5,6,3],1);
 * // [3, 6, 5]
 * 
 * ubique.flipdim([5,6,3],0);
 * // [5, 6, 3]
 * 
 * ubique.flipdim([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 6, 5 ], [ -1, 8, 7 ] ]
 * 
 * ubique.flipdim([[5,6,5],[7,8,-1]],0);
 * // [ [ 7, 8, -1 ], [ 5, 6, 5 ] ]
 */
 $u.flipdim = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 1 : dim;
  var _flipdim = function(a) {
    return $u.clone(a.reverse());
  }
  if ($u.isnumber(x)) {
    return x;
  } else 
  if ($u.isarray(x)) {
    if (dim === 1) {
      return _flipdim(x);
    } else {
      return x;
    }
  } else 
  if ($u.ismatrix(x)) {
    return $u.vectorfun(1-dim,x,_flipdim)
  } else {
    throw new Error('unknown input arguments');
  }

}
}
},{}],102:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method fliplr
 * @summary Flip matrix left to right
 * @description Flip matrix left to right
 * 
 * @param  {array|matrix} x array or matrix of lements
 * @return {array|matrix}   
 *
 * @example
 * ubique.fliplr([[1,4],[2,5],[3,6]]);
 * // [ [ 4, 1 ], [ 5, 2 ], [ 6, 3 ] ]
 */
 $u.fliplr = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	return $u.flipdim(x,1);
 }

}

},{}],103:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method flipud 
 * @summary Flip matrix up to down
 * @description Flip matrix up to down
 * 
 * @param  {array|matrix} x array or matrix of lements
 * @return {array|matrix}   
 *
 * @example
 * ubique.flipud([[1,4],[2,5],[3,6]]);
 * // [ [ 3, 6 ], [ 2, 5 ], [ 1, 4 ] ]
 */
 $u.flipud = function(x) {
  if (arguments.length === 0) {
   throw new Error('not enough input arguments');
 }
 return $u.flipdim(x,0);
}

}
},{}],104:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method getcol
 * @summary Get a column of a matrix
 * @description Get a column of a matrix
 * 
 * @param  {matrix} x matrix of elements
 * @param  {number} n column number (indexing from 0 to n - 1)
 * @return {array}   
 *
 * @example
 * ubique.getcol([[5,6,5],[7,8,-1]],0);
 * // [ 5, 7 ]
 * 
 * ubique.getcol([[5,6,5],[7,8,-1]],2);
 * // [ 5, -1 ]
 */
 $u.getcol = function(x,n) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 0 : n;
  if ($u.isarray(x)) {
    throw new Error('input must be a matrix');
  }
  if (!$u.isinteger(n) || n < 0 || n >= $u.ncols(x)) {
    throw new Error('col must be an integer between 0 and N - 1 columns');
  }
  var v = [];
  for (var i = 0;i < x.length;i++) {
    v[i] = x[i][n];
  }
  return v;
}

}
},{}],105:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method getrow
 * @summary Get a row of matrix
 * @description  Get a row of a matrix
 * 
 * @param  {matrix} x matrix of elements
 * @param  {number} n row number (indexing from 0 to n - 1)
 * @return {array}   
 *
 * @example
 * ubique.getrow([[5,6,5],[7,8,-1]],0);
 * // [ 5, 6, 5 ]
 * 
 * ubique.getrow([[5,6,5],[7,8,-1]],1);
 * // [ 7, 8, -1 ]
 */
 $u.getrow = function(x,n) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 0 : n;
  if ($u.isarray(x)) {
   throw new Error('input must be a matrix');
  }
  if (!$u.isinteger(n) || n < 0 || n >= $u.nrows(x)) {
    throw new Error('row must be an integer between 0 and N - 1 rows');
  }
  return x[n];
 }

}
},{}],106:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method horzcat
 * @summary Concatenate arrays or matrices horizontally
 * @description Concatenate arrays or matrices horizontally
 *              
 * @param  {array|matrix|...} args variable arguments (args1,args2,...)
 * @return {array|matrix}     
 *
 * @example
 * ubique.horzcat([[5,6,5],[7,8,-1]],[[-1,3,-1],[4,5,9]]);
 * // [ [ 5, 6, 5, -1, 3, -1 ], [ 7, 8, -1, 4, 5, 9 ] ]
 * 
 * ubique.horzcat(5,6,7);
 * // [ [ 5, 6, 7 ] ]
 * 
 */
 $u.horzcat = function() {
   var _args = $u.argsarray.apply(null,arguments);
   return $u.cat.apply(null,[].concat(1,_args));
 }

}
},{}],107:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method ind2sub
 * @summary Multiple subscripts from linear index
 * @description Multiple subscripts from linear index. Returns an array or matrix with 
 * the equivalent row and column of the corresponding index. 
 * 
 * @param  {array|matrix} size size of array or matrix
 * @param  {number|array} index linear indexing [0...N-1]
 * @return {array|matrix}       
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * 
 * ubique.ind2sub(ubique.size(a),5);
 * // [1, 2]
 * 
 * ubique.ind2sub(ubique.size(a),[0,1,2]);
 * // [[0, 0], [1, 0], [0, 1]]
 * 
 * ubique.ind2sub(ubique.size([5,6,3]),2);
 * // [2, 0]
 */
 $u.ind2sub = function(size,index) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var _ind2sub = function(siz,idx) {
    var v = $u.rem(idx, siz[0]);
    return [v ,(idx - v) / siz[0]];
  }
  if ($u.isarray(index)) {
    var out = [];
    for (var i = 0;i < index.length;i++) {
      out.push(_ind2sub(size,index[i]));
    }
    return out;
  }
  return _ind2sub(size,index);
}

}
},{}],108:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method iscolumn
 * @summary True for column vector
 * @description True for column vector
 *              
 * @param  {matrix} x input matrix
 * @return {Boolean}   
 *
 * @example
 * ubique.iscolumn([[2],[2]]);
 * // true
 */
 $u.iscolumn = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.nrows(x) > 1 && $u.ncols(x) === 1) {
 		return true;
 	}
 	return false;
 }

}
},{}],109:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method isrow
 * @summary True for row vector
 * @description True for row vector
 *              
 * @param  {matrix} x input matrix
 * @return {Boolean}   
 *
 * @example
 * ubique.isrow([[2,2]]);
 * // true
 */
 $u.isrow = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.nrows(x) === 1 && $u.ncols(x) > 1) {
 		return true;
 	}
 	return false;
 }

}
},{}],110:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method issquare
 * @summary True for square matrix
 * @description True for square matrix
 *              
 * @param  {matrix} x input matrix
 * @return {Boolean}   
 *
 * @example
 * ubique.issquare([[9, 5], [6, 1]]);
 * // true
 */
 $u.issquare = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.nrows(x) === $u.ncols(x)) {
 		return true;
 	}
 	return false;
 }

}
},{}],111:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
* @method length
* @summary length of vector or largest array dimension
* @description  length of vector or largest array dimension
* 
* @param  {array|matrix} x array of elements
* @return {number}
*
* @example
* ubique.length([3,5,6]);
* // 3
* 
* ubique.length(5);
* // 1
* 
* ubique.length([[5,4],[-1,2]]);
* // 2
*/
$u.length = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return Math.max.apply(null,$u.size(x));
}

}
},{}],112:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method linspace
 * @summary Create linearly spaced arrays
 * @description  Create linearly spaced arrays
 *            
 * @param  {number} a lower bound
 * @param  {number} b upper bound
 * @param  {number} n number of points
 * @return {array}
 *
 * @example
 * ubique.linspace(1,10,5);
 * // [ 1, 3.25, 5.5, 7.75, 10 ]
 */
 $u.linspace = function(a,b,n) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 10 : n;
  var v = [];
  var step = (b - a) / (n - 1);
  v[0] = a;
  v[n - 1] = b;
  for (var i = 0;i < n;i++) {
   v[i] = a + step * i;
 }
 return v;
}

}
},{}],113:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method logspace
 * @summary Create logarithmically spaced arrays
 * @description  Create logarithmically spaced arrays
 *            
 * @param  {number} a lower bound
 * @param  {number} b upper bound
 * @param  {number} n number of points
 * @return {array}
 *
 * @example
 * ubique.logspace(0,1,5);
 * // [ 1, 1.778279, 3.162278, 5.623413, 10 ]
 */
 $u.logspace = function(a,b,n) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 10 : n;
  return $u.linspace(a,b,n).map(function(val){return Math.pow(10,val)});
}

}
},{}],114:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method matrix
 * @summary Create a matrix object
 * @description Create a matrix object with minimum 1 argument, max 3 arguments. The first arg can be a number or array, the last one is the value to
 * replicate in the matrix. Default value is NULL. Example: a matrix(2) returns an array of array with dimension 2x2, a matrix(2,3) or matrix([2,3]) a matrix 
 * with dimension 2x3 and values equal to NULL.
 * 
 * @param  {number|string|boolean|array|...} args variable input arguments (max 3)
 * @return {matrix}       
 *
 * @example
 * ubique.matrix(0);
 * // [ [] ]
 *
 * ubique.matrix([0,0]);
 * // [ [] ]
 * 
 * ubique.matrix(2);
 * // [ [ null, null ], [ null, null ] ]
 * 
 * ubique.matrix([2,3]);
 * // [ [ null, null, null ], [ null, null, null ] ]
 * 
 * ubique.matrix(2,3);
 * // [ [ null, null, null ], [ null, null, null ] ]
 * 
 * ubique.matrix([2,3],-1);
 * // [ [ -1, -1, -1 ], [ -1, -1, -1 ] ]
 * 
 *
 * ubique.matrix(3,1,'matrix');
 * // [ [ 'matrix' ], [ 'matrix' ], [ 'matrix' ] ]
 *
 * ubique.matrix(0,5,true);
 * // [ [] ]
 */
 $u.matrix = function() {
 	if (arguments.length === 0 ) {
 		throw new Error('not enough input arguments');
 	}
  var args = $u.argsarray.apply(null,arguments);
  var nargs = args.length;

  var _matrix = function(x,y,val) {
    var mat = [];
    for (var i = 0; i < x; i++) {
      mat[i] = [];
      for (var j = 0; j < y; j++) {
        mat[i][j] = val;
      }
    }
    return mat;
  }
  if ($u.isempty(args)) {
    return [[]];
  }
  if (nargs === 1) {
    if ($u.isnumber(args[0])) {
      if (args[0] === 0) {
        return [[]];
      }
      return _matrix(args[0],args[0],null);
    } else
    if ($u.isarray(args[0])) {
      if (args[0].length === 1) {
        if (args[0][0] === 0) {
          return [[]];
        } else {
          return _matrix(args[0][0],args[0][0],null);
        }
      }
      if (args[0][0] === 0 || args[0][1] === 0) {
        return [[]];
      }
      return _matrix(args[0][0],args[0][1],null);
    } else {
      throw new Error('unknwon input type');
    }
  } else
  if (nargs === 2) {
    if ($u.isnumber(args[0]) && $u.isnumber(args[1])) {
      return _matrix(args[0],args[1],null);
    }
    return _matrix(args[0][0],args[0][1],args[1]);
  } else
  if (nargs === 3) {
    if (args[0] === 0 || args[1] === 0) {
      return [[]];
    }
    return _matrix(args[0],args[1],args[2]);
  } else {
    throw new Error('too manny input arguments');
  }
}

}

},{}],115:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method mergesort
 * @summary Sort array in ascending/descending order
 * @description  Mergesort is a divide and conquer algorithm that was invented by John von Neumann.
 * A merge sort works as follows:
 * 
 * 1 - Divide the unsorted list into n sublists, each containing 1 element (a list of 1 element is considered sorted).
 * 2 - Repeatedly merge sublists to produce new sorted sublists until there is only 1 sublist remaining. This will be the sorted list.
 * 
 * Source: [Merge sort](http://en.wikipedia.org/wiki/Merge_sort)
 *
 * Returns sorted values with sorted indexes as array of array (matrix)
 * 
 * @param  {array} x array of elements
 * @param  {string} mode sorting direction, "ascend" (default) or "descend"
 * @return {matrix}   
 *
 * @example
 * // mergesort with input values and indexes
 * ubique.mergesort([[9,-3,2,-12,0,1],[0,1,2,3,4,5]]);
 * // [ [ -12, -3, 0, 1, 2, 9 ], [ 3, 1, 4, 5, 2, 0 ] ]
 *
 * // with only an array of input values
 * ubique.mergesort([9,-3,2,-12,0,1]);
 * // [ [ -12, -3, 0, 1, 2, 9 ], [ 3, 1, 4, 5, 2, 0 ] ]
 * 
 * ubique.mergesort([9,-3,2,-12,0,1],'descend');
 * // [ [ 9, 2, 1, 0, -3, -12 ], [ 0, 2, 5, 4, 1, 3 ] ]
 */
 $u.mergesort = function(x,mode) {
  var self = this;
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if ($u.isarray(x)) {
    x = [x,$u.colon(0,x.length-1)];
  }
  var len = x[0].length;
  mode = mode || 'ascend';
  if (len < 2) {
    return x;
  }
  var cx = parseInt(len / 2);
  var sx = x[0].slice(0, cx);
  var sxi = x[1].slice(0,cx);
  var dx  = x[0].slice(cx, len);
  var dxi = x[1].slice(cx,len);
  var _sx = [sx,sxi];
  var _dx = [dx,dxi];

  var merge = function(sxarr,dxarr,mode) {
    var sorted = [];
    var idx = [];
    while (sxarr[0].length && dxarr[0].length) {
      if (mode === 'ascend') {
        var compare = sxarr[0][0] <= dxarr[0][0];
      } else 
      if (mode === 'descend') {
        var compare = sxarr[0][0] >= dxarr[0][0];
      } else {
        throw new Error('sorting must be "ascend" or "descend"');
      }
      if (compare) {
        sorted.push(sxarr[0].shift());
        idx.push(sxarr[1].shift());
      } else {
        sorted.push(dxarr[0].shift());
        idx.push(dxarr[1].shift());
      }
    }
    while (sxarr[0].length) {
      sorted.push(sxarr[0].shift());
      idx.push(sxarr[1].shift());
    }
    while (dxarr[0].length) {
      sorted.push(dxarr[0].shift());
      idx.push(dxarr[1].shift());
    }
    return [sorted,idx];
  }
  return merge(self.mergesort(_sx,mode),self.mergesort(_dx,mode),mode);
}
}

},{}],116:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method ncols
 * @summary Number of columns in vector|matrix MxN
 * @description Number of columns in vector|matrix. Array ~ Row vector, returns N.
 * 
 * @param  {array|matrix} x array of elements
 * @return {number}   
 *
 * @example
 * ubique.ncols([5,6,7]);
 * // 3
 * 
 * ubique.ncols([[3,2,7],[4,5,6]]);
 * //  3
 */
 $u.ncols = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return $u.size(x)[1];
}

}
},{}],117:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
* @method ndims
* @summary Number of array dimensions
* @description Number of array dimensions
* 
* @param  {array|matrix} x array of elements
* @return {number}  
*
* @example
* ubique.ndims([3,5,6]);
* // 2
* 
* ubique.ndims([[3,2,7],[4,5,6]]);
* // 2
*/
$u.ndims = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return $u.length($u.size(x));
}

}
},{}],118:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method nrows
 * @summary Number of rows in vector|matrix MxN
 * @description Number of rows in vector|matrix. Array ~ Row vector, returns 1.
 * 
 * @param  {array|matrix} x array of elements
 * @return {number}  
 *
 * @example
 * ubique.nrows([5,6,7]);
 * // 1
 * 
 * ubique.nrows([[3,2,7],[4,5,6]]);
 * // 2
 */
 $u.nrows = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  return $u.size(x)[0];
}

}
},{}],119:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
	/**
 * @method numel
 * @summary Number of elements in an array
 * @description Number of elements in an array
 * 
 * @param  {array|matrix} x array of elements
 * @return {number} 
 *
 * @example
 * ubique.numel([3,5,6]);
 * // 3
 * 
 * ubique.numel([[3,2,7],[4,5,6]]);
 * // 6
 */
 $u.numel = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var size = $u.size(x);
  return size[0] * size[1];
}

}
},{}],120:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method ones
 * @summary Create array of all ones
 * @description Create array of all ones
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}     
 *
 * @example
 * ubique.ones(0);
 * // []
 * 
 * ubique.ones(1);
 * // [ [ 1 ] ]
 * 
 * ubique.ones(2);
 * // [ [ 1, 1 ], [ 1, 1 ] ]
 * 
 * ubique.ones([2,1]);
 * // [ [ 1 ], [ 1 ] ]
 * 
 * ubique.ones(2,3);
 * // [ [ 1, 1, 1 ], [ 1, 1, 1 ] ]
 */
 $u.ones = function() {
 if (arguments.length === 0 ) {
    throw new Error('not enough input arguments');
  }
  var _args = $u.argsarray.apply(null,arguments);
  if ($u.ismatrix(_args)) {
    _args = _args[0];
  }
  if (_args.length === 1) {
    _args = [_args[0],_args[0]];
  }
  return $u.matrix(_args,1);
}

}
},{}],121:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method rand
 * @summary Uniformly distribuited pseudorandom numbers
 * @description Uniformly distribuited pseudorandom numbers
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}    
 *
 * @example
 * ubique.rand();
 * // 0.1455961789470166
 * ubique.rand(0);
 * // []
 * ubique.rand(1);
 * // [[0.12391899712383747]]
 * ubique.rand(2);
 * // [[0.33334478829056025, 0.09839745867066085],[0.6006140187382698, 0.3131265211850405]]
 * ubique.rand([2,1]);
 * // [[0.40439655422233045], [0.7663801296148449]]
 * ubique.rand(1,2);
 * // [[0.16782891773618758, 0.5958379742223769]]
 * ubique.rand(2,3);
 * // [[0.890318026766181, 0.7398379456717521, 0.6165686929598451], [0.7234933257568628, 0.9895968120545149, 0.875643968814984]]
 */
 $u.rand = function() {
 	var _args = arguments,
 	nargs = arguments.length;
 	var _rand = function(x,y) {
 		var out = new Array(x);
 		for (var i = 0;i < x;i++) {
 			out[i] = new Array(y);
 			for (j = 0; j < y; j++) {
 				out[i][j] = Math.random();
 			}
 		}
 		return out;
 	}
 	if (nargs === 0) {
 		return Math.random();
 	} else
 	if (nargs === 1) {
 		if ($u.isnumber(_args[0])) {
 			return _rand(_args[0],_args[0]);
 		} else 
 		if ($u.isarray(_args[0])) {
 			return _rand(_args[0][0],_args[0][1]);
 		} else {
 			throw new Error('unknwon input type');
 		}
 	} else
 	if (nargs === 2) {
 		if ($u.isnumber(_args[0]) && $u.isnumber(_args[1])) {
 			return _rand(_args[0],_args[1]);
 		}
 		return _rand(_args[0][0],_args[0][1],_args[1]);
 	} else
 	if (nargs === 3) {
 		return _rand(_args[0],_args[1],_args[2]);
 	} else
 	throw new Error('too manny input arguments');
 }
}
},{}],122:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method  repmat
 * @summary Replicate and tile array
 * @description  Replicate and tile array
 *
 * @param  {number|array|matrix|boolean} x value assigned to every elements of array or matrix
 * @param  {number} m number of matrix rows
 * @param  {number} n number of matrix columns
 * @return {matrix}     
 *
 * @example
 * var l = [[1,1,-1],[1,-2,3],[2,3,1]];
 * 
 * ubique.repmat(10,3);
 * // [ [ 10, 10, 10 ], [ 10, 10, 10 ], [ 10, 10, 10 ] ]
 * 
 * ubique.repmat(0.5,3,2);
 * // [ [ 0.5, 0.5 ], [ 0.5, 0.5 ], [ 0.5, 0.5 ] ]
 * 
 * ubique.repmat([5,6,3],1,2);
 * // [ [ 5, 6, 3, 5, 6, 3 ] ]
 * 
 * ubique.repmat([[9, 5],[6, 1]],2);
 * // [ [ 9, 5, 9, 5 ], [ 6, 1, 6, 1 ], [ 9, 5, 9, 5 ], [ 6, 1, 6, 1 ] ]
 */
 $u.repmat = function(x,m,n) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	if (arguments.length === 2) {
 		n = m;
 	}
 	if ($u.isnumber(x) || $u.isarray(x) || $u.islogical(x)) {
 		x = $u.tomat(x);
 	}
 	var size = $u.size(x);
 	var out = $u.matrix(size[0]*m,size[1]*n);
 	for (var i = 0; i < m; i++) {
 		for (var j = 0; j < n; j++) {
 			for (var ii = 0; ii < size[0]; ii++) {
 				for (var jj = 0; jj < size[1]; jj++) {
 					out[(i * size[0]) + ii][(j * size[1]) + jj] = x[ii][jj];
 				}
 			}
 		}
 	}
 	return out;
 }

}
},{}],123:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
 /**
 * @method  reshape
 * @summary Reshape array or matrix with custom values
 * @description  Reshape array or matrix with custom values based on rows values of X
 *
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} m number of rows for the new matrix
 * @param  {number} n number of cols for the new matrix
 * @param  {number} flag flag 0: rowwise element, 1: columnwise (def: 0)
 * @return {matrix}     
 *
 * @example 
 * ubique.reshape([5,6,3],3,1);
 * // [ [ 5 ], [ 6 ], [ 3 ] ]
 *
 * ubique.reshape([5,6,3],1,3);
 * // [ 5, 6, 3 ]
 * 
 * ubique.reshape([[-1,3,-1],[4,5,9]],3,2);
 * // [ [ -1, 4 ], [ 3, 5 ], [ -1, 9 ] ]
 *
 * ubique.reshape([[-1,3,-1],[4,5,9]],3,2,1);
 * // [ [ -1, 5 ], [ 4, -1 ], [ 3, 9 ] ]
 * 
 * ubique.reshape([[-1,3,-1],[4,5,9]],6,1);
 * // [ [ -1 ], [ 3 ], [ -1 ], [ 4 ], [ 5 ], [ 9 ] ]
 *
 * ubique.reshape([[-1,3,-1],[4,5,9]],6,1,1);
 * // [ [ -1 ], [ 4 ], [ 3 ], [ 5 ], [ -1 ], [ 9 ] ]
 */
 $u.reshape = function(x,m,n,flag) {
 	if (arguments.length < 3) {
 		throw new Error('not enough input arguments');
 	}
  flag = flag == null ? 0 : flag;
 	if (!$u.isinteger(m) || !$u.isinteger(n)) {
 		throw new Error('dimensions must be integer numbers');
 	}
 	var nrows = $u.nrows(x);
 	var ncols = $u.ncols(x);
 	var totsiz = nrows * ncols;
 	if ((m * n) !== totsiz ) {
 		throw new Error('total number of elements must be the same');
 	}
 	if ($u.isnumber(x)) {
 		return x;
 	} else 
 	if ($u.isarray(x)) {
 		if (m === nrows && n === ncols) {
 			return x;
 		} else {
 			return $u.transpose(x);
 		}
 	} else 
 	if ($u.ismatrix(x)) {
 		var out = $u.matrix(m,n,NaN);
 		var vec = $u.flatten(x,flag); // flatten by rows
 		for (var i = 0;i < m * n;i++) {
 			var idx = $u.ind2sub([m,n],i);
 			out[idx[0]][idx[1]] = vec[i];
 		}
 		return out;
 	} else {
 		throw new Error('unknown input arguments');
 	}

 }
}
},{}],124:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method setcol
 * @summary Set a column of a matrix
 * @description Set a column of a matrix. If X is an array, it is auto-converted to
 * a column vector.
 * 
 * @param  {array|vector} x array or vector Mx1
 * @param  {matrix} mat matrix MxN of values
 * @param  {number} n column number (indexing from 0 to n - 1)
 * @return {matrix}   
 *
 * @example
 * ubique.setcol([2,0],[[5,6,5],[7,8,-1]],0);
 * // [ [ 2, 6, 5 ], [ 0, 8, -1 ] ]
 *
 * ubique.setcol([9,21],[[5,6,5],[7,8,-1]],2);
 * // [ [ 5, 6, 9 ], [ 7, 8, 21 ] ]
 */
 $u.setcol = function(x,mat,n) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 0 : n;
  if ($u.isarray(x)) {
    x = $u.transpose(x);
  }
  if (!$u.isinteger(n) || n < 0 || n >= $u.ncols(mat)) {
    throw new Error('col must be an integer between 0 and N - 1 columns');
  }
  for (var i = 0;i < $u.nrows(mat);i++) {
    mat[i][n] = x[i][0];
  }
  return mat;
}

}
},{}],125:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method setrow
 * @summary Set a row of matrix
 * @description Set a row of a matrix.If X is an array, it is auto-converted to
 * a row vector.
 * 
 * @param  {array|vector} x array or vector 1xN
 * @param  {matrix} mat matrix MxN of values
 * @param  {number} n column number (indexing from 0 to n - 1)
 * @return {matrix}   
 *
 * @example
 * ubique.setrow([2,0,-2],[[5,6,5],[7,8,-1]],0);
 * // [ [ 2, 0, -2 ], [ 7, 8, -1 ] ]
 *
 * ubique.setrow([9,21,57],[[5,6,5],[7,8,-1]],1);
 * // [ [ 5, 6, 5 ], [ 9, 21, 57 ] ]
 */
 $u.setrow = function(x,mat,n) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  n = n == null ? 0 : n;
  if ($u.isarray(x)) {
   x = [x];
  }
  if (!$u.isinteger(n) || n < 0 || n >= $u.nrows(mat)) {
    throw new Error('row must be an integer between 0 and N - 1 rows');
  }
  for (var i = 0;i < $u.ncols(mat);i++) {
    mat[n][i] = x[0][i];
  }
  return mat;
 }

}
},{}],126:[function(require,module,exports){
/**
 * Array Dimensions
 */
 module.exports = function($u) {
/**
 * @method size
 * @summary Size of N-D array
 * @description Size of N-D array. N-D array is equal to MxN matrix, 
 * 1-D Array is equal to 1xN, Number is equal to 1x1 array
 * 
 * @param  {string|number|array|matrix} x array of elements
 * @return {array}  
 *
 * @example
 * ubique.size([[[[5,6,5],[7,8,-1]]]]);
 * // [ 1, 1, 2, 3 ]
 * 
 * ubique.size([[3,2,7],[4,5,6]]);
 * //  [ 2, 3 ]
 * 
 * ubique.size([5,4,4]);
 * // [ 1, 3 ]
 * 
 * ubique.size(5);
 * // [ 1, 1 ]
 * 
 * ubique.size('ubique');
 * // [ 1, 6 ]
 * 
 * ubique.size([['first','second']]);
 * // [ 1, 2 ]
 */
 $u.size = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnull(x) || $u.isundefined(x)) {
 		throw new Error('unknown input type');
 	}
  if ($u.isstring(x)) {
    return [1,x.length];
  }
  if ($u.isnumber(x)) {
    return [1, 1];
  }
  if ($u.isarray(x)) {
    return [1,x.length];
  }
  var siz = x.length;
  var _siz = [];
  while (!$u.isundefined(siz) && !$u.isstring(x)) {
   _siz.push(siz);
   x = x[0];
   siz = x.length;
 } 
 return _siz;
}

}
},{}],127:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method sort
 * @summary Sort array elements in ascending/descending order
 * @description Sort array elements in ascending/descending order. For matrix it is possibile to sort
 * along a dimension. Based on Merge Sort algorithm
 * 
 * @param   {array|matrix} x array of elements
 * @param   {string} mode sorting direction, 'ascend' (default) or 'descend'
 * @param   {number} dim dimension along which to sort, 0: rows, 1: colums (def: 1)
 * @return  {array}      
 *
 * @example
 * ubique.sort([0,5,-1,3,-4,9,0],'ascend');
 * // [ -4, -1, 0, 0, 3, 5, 9 ]
 *
 * ubique.sort([[-1,3,-1],[4,5,9]],'descend');
 * // [ [ 4, 5, 9 ], [ -1, 3, -1 ] ]
 * 
 * ubique.sort([[-1,3,-1],[4,5,9]],'descend',0);
 * // [ [ 3, -1, -1 ], [ 9, 5, 4 ] ]
 */
 $u.sort = function(x,mode,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  mode = mode == null ? 'ascend' : mode;
  dim = dim == null ? 1 : dim;
  var _sort = function(a,mode) {
    var out = $u.mergesort(a,mode);
    return out[0];
  }
  if ($u.isnumber(x)) {
    return x;
  }
  if ($u.isarray(x)) {
   return _sort(x,mode);
 }
 return $u.vectorfun(dim,x,_sort,mode);
}

}
},{}],128:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method squeeze
 * @summary Remove singleton dimensions from N-D arrays (matrices)
 * @description Remove singleton dimensions N_D arrays (matrices).
 * Number returns number and 1-D array returns 1-D array.
 * 
 * @param  {string|number|array|matrix} x elements of X
 * @return {string|number|array|matrix}   
 *
 * @example
 * ubique.squeeze([[[[[8]]]]]);
 * // [ [ 8 ] ]
 * 
 * ubique.squeeze([[[[3,4,5]]]]); 
 * // [ [3, 4, 5] ]
 * 
 * ubique.squeeze([[[[[['31-12-2014','31-01-2015'],['15-02-2015','01-03-2015']]]]]]);
 * // [ [ '31-12-2014', '31-01-2015' ],[ '15-02-2015', '01-03-2015' ] ]
 */
 $u.squeeze = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if (arguments.length > 1) {
 		throw new Error('too many input arguments');
 	}
 	if ($u.isnumber(x) || $u.isstring(x)) {
 		return x;
 	}
 	var size = $u.size(x);
 	while (size.length > 2) {
 		x = x[0];
 		size = $u.size(x);
 	}
 	return x;
 }

}
},{}],129:[function(require,module,exports){
/**
 * Indexing
 */
 module.exports = function($u) {
/**
 * @method sub2ind
 * @summary Subscripts to linear indices
 * @description Subscripts to linear indices. Convert a 2D coordinates X,Y of a matrix into linear indices
 * 
 * @param  {array|matrix} size  size of array or matrix
 * @param  {array|matrix} index X,Y coordinates for 2D matrices in the range [0...N-1]
 * @return {number|array}       
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * 
 * ubique.sub2ind(ubique.size(a),[1, 2]);
 * // 5
 * 
 * ubique.sub2ind(ubique.size(a),[[0, 0], [1, 0], [0, 1]]);
 * // [0, 1, 2]
 * 
 * ubique.sub2ind(ubique.size([5,6,3]),[2, 0]);
 * // 2
 */
 $u.sub2ind = function(size,index) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isarray(index)) {
 		index = [index];
 	}
 	var x = $u.getcol(index,0);
 	var y = $u.getcol(index,1);
 	var v = [];
 	for (var i = 0;i < x.length;i++) {
 		v[i] = (x[i]) + (y[i]) * size[0];
 	}
 	if ($u.numel(v) === 1) {
 		return $u.squeeze(v)[0];
 	}  else {
 		return $u.squeeze(v);
 	}
 }
}

},{}],130:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
 /**
  * @method subset
  * @summary Subset of array or matrix based on X,Y coordinates
  * @description Subset of array or matrix based on X,Y coordinates.
  * Extract a single column or row with the symbols ':'
  * 
  * @param  {array|matrix} m array or matrix of elements
  * @param  {number|array|string} r indexing for rows or ':' for all rows
  * @param  {number|array|string} c indexing for columns or ':' for all columns
  * @return {number|array|matrix}
  *
  * @example
  * var a = [[5,6,5],[7,8,-1]];
  * var c = [5,6,3];
  *
  * ubique.subset(c,1);
  * // 6
  * 
  * ubique.subset(c,[1,2]);
  * // [ 6, 3 ]
  * 
  * ubique.subset(c,ubique.end(c));
  * // 3
  * 
  * ubique.subset(a,0,1); 
  * // [ [ 6 ] ]
  * 
  * ubique.subset(a,[0,1],[1,2]); 
  * // [ [ 6, 5 ], [ 8, -1 ] ]
  * 
  * ubique.subset(a,0,':');
  * [ [ 5, 6, 5 ] ]
  * 
  * ubique.subset(a,':',0);
  * [ [ 5 ], [ 7 ] ]
  */
  $u.subset = function(m,r,c) {
    if (arguments.length === 0) {
      throw new Error('not enough input arguments');
    }
    if (arguments.length > 3) {
      throw new Error('too many input arguments');
    }
    if (arguments.length === 1) {
      return m;
    } 
    if (arguments.length === 2) {
      if ($u.isnumber(m)) {
        return m;
      }
      if ($u.isarray(m)) {
        if ($u.isnumber(r)) {
          return m[r];
        } else {
          return r.map(function(val) {return m[val];});
        }
      }
    }
    if (arguments.length === 3) {
      if ($u.ismatrix(m)) {
        if (r === ':') {
          r = $u.colon(0,$u.nrows(m) - 1);
        }
        if (c === ':') {
          c = $u.colon(0,$u.ncols(m) - 1);
        }
        if ($u.isnumber(r)) {
          r = [r];
        }
        if ($u.isnumber(c)) {
          c = [c];
        }
        if (r.length  === 1 && c.length === 1) {
          out = [[0]];
        } else {
          out = $u.zeros(r.length,c.length);
        }
        for (var i = 0;i < r.length;i++) {
          var tmp = r[i];
          for (var j = 0;j < c.length;j++) {
            out[i][j] = m[tmp][c[j]];
          }
        }
        return $u.squeeze(out);
      } else {
        throw new Error('input must be a matrix');
      }
    }
  }
}


},{}],131:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
  /**
   * @method  substelin
   * @summary Subset of array or matrix based on linear indexing
   * @description Subset of array or matrix based on linear indexing by rows (default)
   *              
   * @param  {array|matrix} m   array or matrix of elements 
   * @param  {numer|array|matrix} idx linear indexing
   * @param  {number} flag flag 0: rowwise element, 1: columnwise (def: 0)
   * @return {numner|array|matrix}     
   *
   * @example
   * var a = [[5,6,5],[7,8,-1]];
   * var c = [5,6,3];
   *
   * ubique.subsetlin(a,1);
   * // [ 6 ]
   *
   * // subset by rows
   * ubique.subsetlin(a,[0,1,2,3]);
   * // [ 5, 6, 5, 7 ]
   *
   * // subset by columns
   * ubique.subsetlin(a,[0,1,2,3],1);
   * // [ 5, 7, 6, 8 ]
   * 
   * ubique.subsetlin(a,[[0,1,2],[2,3,4]],1);
   *  // [ [ 5, 7, 6 ], [ 6, 8, 5 ] ]
   *  
   * ubique.subsetlin(c,[0,1]);
   * // [ 5, 6 ]
   * 
   * ubique.subsetlin(c,[[0,1],[1,2]]);
   * // [ [ 5, 6 ], [ 6, 3 ] ]
   */
   $u.subsetlin = function(m,idx,flag) {
    if (arguments.length === 0) {
      throw new Error('not enough input arguments');
    }
    if (arguments.length === 1 || $u.isnumber(m)) {
      return m;
    } 
    flag = flag == null ? 0 : flag;
    if ($u.isnumber(idx)) {
      idx = [idx];
    }
    var _m = $u.flatten(m,flag);
    return $u.squeeze($u.arrayfun(idx,function(val){return _m[val]}));
  }
}
},{}],132:[function(require,module,exports){
/**
* Array Creation and Concatenation
*/
module.exports = function($u) {
/**
 * @method tomat
 * @summary Convert number or array to matrix
 * @description Convert number or array to matrix
 *              
 * @param  {number|array|boolean} x input
 * @return {matrix}     
 *
 * @example
 * ubique.tomat(5);
 * // [ [ 5 ] ]
 * 
 * ubique.tomat([5,6,3]);
 * // [ [ 5, 6, 3 ] ]
 * 
 */
 $u.tomat = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if ($u.isnumber(x) || $u.islogical(x)) {
 		return [[x]];
 	} else
 	if ($u.isarray(x)) {
    return [x];
  } else 
  if ($u.ismatrix(x)) {
   return x;
 } else {
   throw new Error('unknown input arguments');
 }

}

}
},{}],133:[function(require,module,exports){
/**
 * Sorting and Reshaping Arrays
 */
 module.exports = function($u) {
/**
 * @method transpose
 * @summary Transpose X.'
 * @description Transpose of matrix X. Array is 1xN as default. 
 * Transpose of Array is Nx1 matrix.
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @return {matrix}
 *
 * @example
 * ubique.transpose([[5,6,5],[7,8,-1]]);
 * // [ [ 5, 7 ], [ 6, 8 ], [ 5, -1 ] ]
 * 
 * ubique.transpose([5,6,3]);
 * // [ [ 5 ], [ 6 ], [ 3 ] ]
 */
 $u.transpose = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  var _transpose = function(a,acols,arows) {
    var out = $u.matrix(acols,arows);
    for (var i = 0;i < acols; i++) {
      for (var j = 0;j < arows; j++) {
        out[i][j] = a[j][i];
      }
    }
    return out;
  }
  if ($u.isnumber(x)) {
    return x;
  }
  if ($u.isarray(x)) {
    return _transpose([x],x.length,1);
  }
  return _transpose(x,$u.ncols(x),$u.nrows(x));
}

}
},{}],134:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method trues
 * @summary Create array of all true
 * @description Create array of all true
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}     
 *
 * @example
 * ubique.trues(0);
 * // []
 * 
 * ubique.trues(1);
 * // [ [ true ] ]
 * 
 * ubique.trues(2);
 * // [ [ true, true ], [ true, true ] ]
 * 
 * ubique.trues([2,1]);
 * // [ [ true ], [ true ] ]
 * 
 * ubique.trues(2,3);
 * // [ [ true, true, true ], [ true, true, true ] ]
 */
 $u.trues = function() {
  if (arguments.length === 0 ) {
    throw new Error('not enough input arguments');
  }
  var _args = $u.argsarray.apply(null,arguments);
  if ($u.ismatrix(_args)) {
    _args = _args[0];
  }
  if (_args.length === 1) {
    _args = [_args[0],_args[0]];
  }
  return $u.matrix(_args,true);
}

}
},{}],135:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method vertcat
 * @summary Concatenate arrays or matrices vertically
 * @description Concatenate arrays or matrices vertically
 *              
 * @param  {array|matrix|...} args variable arguments (args1,args2,...)
 * @return {array|matrix}     
 *
 * @example
 * ubique.vertcat([[5,6,5],[7,8,-1]],[[-1,3,-1],[4,5,9]]);
 * // [ [ 5, 6, 5 ], [ 7, 8, -1 ], [ -1, 3, -1 ], [ 4, 5, 9 ] ]
 * 
 * ubique.vertcat(5,7,9,8);
 * // [ 5, 7, 9, 8 ]
 */
 $u.vertcat = function() {
  var _args = $u.argsarray.apply(null,arguments);
  return $u.cat.apply(null,[].concat(0,_args));
}

}
},{}],136:[function(require,module,exports){
/**
 * Array Creation and Concatenation
 */
 module.exports = function($u) {
/**
 * @method zeros
 * @summary Create array or matrix of all zeros
 * @description Create array or matrix of all zeros
 * 
 * @param  {number|array|...} args variable input arguments (max 2)
 * @return {number|matrix}     
 *
  * @example
 * ubique.zeros(0);
 * // []
 * 
 * ubique.zeros(1);
 * // [ [ 0 ] ]
 * 
 * ubique.zeros(2);
 * // [ [ 0, 0 ], [ 0, 0 ] ]
 * 
 * ubique.zeros([2,1]);
 * // [ [ 0 ], [ 0 ] ]
 * 
 * ubique.zeros(2,3);
 * // [ [ 0, 0, 0 ], [ 0, 0, 0 ] ]
 */
 $u.zeros = function() {
 if (arguments.length === 0 ) {
    throw new Error('not enough input arguments');
  }
  var _args = $u.argsarray.apply(null,arguments);
  if ($u.ismatrix(_args)) {
    _args = _args[0];
  }
  if (_args.length === 1) {
    _args = [_args[0],_args[0]];
  }
  return $u.matrix(_args,0);
}

}
},{}],137:[function(require,module,exports){
/**
 * Distribution Tests
 */
 module.exports = function($u) {
/**
 * @method  jbtest
 * @summary Jarque-Bera test
 * @description  A test decition for the null hypothesis that the data 
 * in array X comes from a normal distribution with an unknown mean and variance
 * 
 * @param  {array} x array of values
 * @return {number}   
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * 
 * ubique.jbtest(x);
 * // 0.6360604293924916
 */
 $u.jbtest = function(x) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  var n = x.length;
  var s = $u.skewness(x);
  var xk = $u.xkurtosis(x);
  return (n/6) * (Math.pow(s,2) + Math.pow(xk,2)/4);
}

}
},{}],138:[function(require,module,exports){
/**
 * Normal Distributions
 */
 module.exports = function($u) {
/**
 * @method normcdf
 * @summary Normal cumulative distribution function (cdf)
 * @description The Standard Normal Distribution: mu = 0 and sigma = 1
 *
 * @param  {number} x number to calculate cdf
 * @param  {number} mu mean of  the array of elements
 * @param  {number} sigma standarf deviaton of array of elements
 * @return {number}
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * 
 * ubique.normcdf(2);
 * // 0.97725
 * 
 * ubique.normcdf(0,ubique.mean(x),ubique.std(x));
 * // 0.22049
 */
 $u.normcdf = function(x,mu,sigma) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mu = mu == null ? 0 : mu;
  sigma = sigma == null ? 1 : sigma;
  return 0.5 * (1 + $u.erf((x - mu) / Math.sqrt(2 * sigma * sigma)));
}

}
},{}],139:[function(require,module,exports){
/**
 * Normal Distributions
 */
 module.exports = function($u) {
/**
 * @method norminv
 * @summary Inverse of the normal cumulative distribution function (cdf)
 * @description Returns the inverse cdf for the normal distribution with mean MU
 * and standard deviation SIGMA at P value
 *
 * Default values: MU = 0, SIGMA = 1
 * 
 * @param  {number} p probability value in range [0,1]
 * @param  {number} mu mean value
 * @param  {number} sigma standard deviation 
 * @return {number}       
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 *
 * ubique.norminv(0.05);
 * // -1.64485
 * 
 * ubique.norminv(0.01,ubique.mean(x),ubique.std(x));
 * // -0.0361422
 */
 $u.norminv = function(p,mu,sigma) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mu = mu == null ? 0 : mu;
  sigma = sigma == null ? 1 : sigma;
  if (p <= 0 || p >= 1) {
    throw new Error('invalid input argument');
  }
  var x0 = -Math.sqrt(2) * $u.erfcinv(2 * p);
  return x0 * sigma + mu;
}

}
},{}],140:[function(require,module,exports){
/**
 * Normal Distributions
 */
 module.exports = function($u) {
/**
 * @method normpdf
 * @summary Normal probability density function (pdf)
 * @description  Normal probability density function (pdf).
 * Returns the pdf of the normal distribution with
 * mean MU and standard deviation SIGMA, evaluated at the values in X
 *
 * Default values: MU = 0, SIGMA = 1
 * 
 * @param  {number} x real value
 * @param  {number} mu mean value (def: 0)
 * @param  {number} sigma standard deviation (def: 1)
 * @return {number}       
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * 
 * ubique.normpdf(1);
 * // 0.241971
 * 
 * ubique.normpdf(0,ubique.mean(x),ubique.std(x));
 * // 12.7622
 */
 $u.normpdf = function(x,mu,sigma) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mu = mu == null ? 0 : mu;
  sigma = sigma == null ? 1 : sigma;
  return Math.exp(-0.5 * Math.pow((x - mu)/sigma,2)) / (Math.sqrt(2 * Math.PI) * sigma);
}

}
},{}],141:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method activereturn
 * @summary Active return
 * @description Asset/Portfolio annualized return minus Benchmark annualized return
 * 
 * @param  {array|matrix} x asset/portfolio returns 
 * @param  {array} y benchmark returns
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily
 * @param  {string} mode 'geometric' or 'simple' (def: 'geometric')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 *
 * ubique.activereturn(x,z,12);
 * // 0.041979
 *
 * ubique.activereturn(cat(0,x,y),z,12);
 * // [ [ 0.041979], [ -0.046746 ] ]
 */
 $u.activereturn = function(x,y,t,mode,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  t = t == null ? 252 : t;
  mode = mode == null ? 'geometric' : mode;
  dim = dim == null ? 0 : dim;
  
  var _activereturn = function(a,y,t,mode) {
    return $u.annreturn(a,t,mode) - $u.annreturn(y,t,mode);
  }
  if ($u.isnumber(x) || $u.isnumber(y)) {
    throw new Error('input must be an array or matrix');
  }
  return $u.vectorfun(dim,x,_activereturn,y,t,mode);
}
}

},{}],142:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method adjsharpe
 * @summary Adjusted Sharpe Ratio
 * @description Sharpe Ratio adjusted for skewness and kurtosis with a penalty factor 
 * for negative skewness and excess kurtosis.
 *
 * Adjusted Sharpe ratio = SR x [1 + (S/6) x SR - ((K-3) / 24) x SR^2]
 * SR = sharpe ratio
 * K = kurtosis
 * S = skewness
 * 
 * @param  {array|matrix} x array of value
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.adjsharpe(x,0.02/12);
 * // 0.748134
 * 
 * ubique.adjsharpe(cat(0,x,y));
 * // [ [ 0.830583, 0.245232 ] ]
 */
 $u.adjsharpe = function(x,frisk,dim) {
  if (arguments.length === 0) {
   throw new Error('not enough input arguments');
 }
 frisk = frisk == null ? 0 : frisk;
 dim = dim == null ? 0 : dim;

 var _asharpe = function(a,frisk) {
   var sr = $u.sharpe(a,frisk);
   var sk = $u.skewness(a);
   var ku = $u.kurtosis(a);
   return sr * (1 + (sk/6) * sr - ((ku - 3)/24) * Math.sqrt(sr));
 }
 if ($u.isnumber(x)) {
   return NaN;
 }
 return $u.vectorfun(dim,x,_asharpe,frisk);
}
}

},{}],143:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method annadjsharpe
 * @summary Annualized Adjusted Sharpe Ratio
 * @description Sharpe Ratio adjusted for skewness and kurtosis with a penalty factor 
 * for negative skewness and excess kurtosis.
 *
 * Adjusted Sharpe ratio = SR x [1 + (S/6) x SR - ((K-3) / 24) x SR^2]
 * SR = sharpe ratio with annualized return/risk
 * K = kurtosis
 * S = skewness
 * 
 * @param  {array|matrix} x array of value
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequency 252: daily (default), 52: weekly, 12: monthly, 4: quarterly
 * @param  {string} mode 'geometric' or 'simple' (def: 'geometric')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.annadjsharpe(x,0.02,12,'geometric');
 * // 3.376724
 * 
 * ubique.annadjsharpe(cat(0,x,y),0,12);
 * // [ [ 3.766555, 0.827757 ] ]
 */
 $u.annadjsharpe = function(x,frisk,t,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  mode = mode == null ? 'geometric' : mode;
  dim = dim == null ? 0 : dim;

  var _asharpe = function(a,frisk,t,mode) {
   var aret = $u.annreturn(a,t,mode),
   arisk = $u.annrisk(a,t),
   sr = (aret - frisk) / arisk,
   sk = $u.skewness(a),
   ku = $u.kurtosis(a);
   return sr * (1 + (sk/6) * sr - ((ku - 3)/24) * Math.sqrt(sr));
 }
 if ($u.isnumber(x)) {
   throw NaN;
 }
 return $u.vectorfun(dim,x,_asharpe,frisk,t,mode);
}
}

},{}],144:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method annreturn
 * @summary Annualized Return
 * @description Average annualized returns over a period, convenient when comparing returns.
 * It can be an Arithmetic or Geometric (default) average return: if compounded with itself the
 * geometric average will be equal to the cumulative return
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily
 * @param  {string} mode 'geometric' or 'simple' (def: 'geometric')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}   
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.annreturn(x,12);
 * // 0.233815
 *
 * ubique.annreturn(cat(0,x,y),12);
 * // [ [ 0.233815 ], [ 0.14509 ] ]
 */
 $u.annreturn = function(x,t,mode,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	t = t == null ? 252 : t;
  mode = mode == null ? 'geometric' : mode;
  dim = dim == null ? 0 : dim;

  var _annreturn = function(arr,t,mode) {
    var n = arr.length;
    if (mode === 'geometric') {
      return $u.power($u.prod($u.plus(1,arr)),(t/n)) - 1;
    } else
    if (mode === 'simple') {
      return $u.mean(arr) * t;
    } else {
      throw new Error('unknown mode');
    }
  }
 	 if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_annreturn,t,mode);
 }

}

},{}],145:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method annrisk
 * @summary Annualized Risk
 * @description Annualized standard deviation of asset/portfolio returns
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}   
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.annrisk(x,12);
 * // 0.080473
 *
 * ubique.annrisk(cat(0,x,y),12);
 * // [ [ 0.080473 ], [ 0.182948 ] ]
 */
 $u.annrisk = function(x,t,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	t = t == null ? 252 : t;
  dim = dim == null ? 0 : dim;

 	var _annrisk = function(a,t) {
 		return Math.sqrt(t) * $u.std(a);
 	}
 	if ($u.isnumber(x)) {
 		return NaN;
 	}
 	return $u.vectorfun(dim,x,_annrisk,t);
 }
}

},{}],146:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method avgdrawdown
 * @summary Average drawdown
 * @description Average drawdown or average K-largest drawdown
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} k largest drawdown. k = 0 for all continuous drawdown (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {object}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * // average drawdown
 * ubique.avgdrawdown(x);
 * // 0.0115
 *
 * // 1-largest drawdown
 * ubique.avgdrawdown(x,1);
 * // 0.014
 * 
 * ubique.avgdrawdown(cat(0,x,y));
 * // [ [ 0.0115 ], [ 0.056571 ] ]
 */
 $u.avgdrawdown = function(x,k,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  k = k == null ? 0 : k;
  dim = dim == null ? 0 : dim;
  
  var avgdd = function(a,k) {
    var cdd =  $u.cdrawdown(a);
    if (k === 0) {
      return $u.mean(cdd);
    } else
    if (k > 0 && k <= cdd.length) {
      var cdds = $u.sort(cdd,'descend');
      return $u.mean($u.subsetlin(cdds,$u.colon(0,k - 1)));
    } else {
      return NaN;
    }
  }
  if ($u.isnumber(x)) {
    return 0;
  }
  return $u.vectorfun(dim,x,avgdd,k);
}

}
},{}],147:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method burkeratio
 * @summary Burke Ratio
 * @description A risk-adjusted measure with free risk and drawdowns.
 * For the 'simple' mode the excess return over free risk is divided by the square root of 
 * the sum of the square of the drawdowns. For the 'modified' mode the Burke Ratio is multiplied
 * by the square root of the number of datas.
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequency 252: daily (default), 52: weekly, 12: monthly, 4: quarterly
 * @param  {string} mode 'simple' or 'modified' (def: 'simple')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 *
 * ubique.burkeratio(x,0,12);
 * // 14.048563
 *
 * ubique.burkeratio(x,0,12,'modified');
 * // 44.425456
 *
 * ubique.burkeratio(cat(0,x,y),0,12);
 * // [ [ 14.048563 ], [ 1.228487 ] ]
 */
 $u.burkeratio = function(x,frisk,t,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  mode = mode == null ? 'simple' : mode;
  dim = dim == null ? 0 : dim;
  
  var _burkeratio = function(a,frisk,t,mode) {
    var annret = $u.annreturn(a,t),
    dd = $u.sqrt($u.sum($u.power($u.cdrawdown(a),2)));
    if (mode === 'simple') {
      return (annret - frisk) / dd;
    } else
    if (mode === 'modified') {
      return (annret - frisk) / dd * $u.sqrt(a.length);
    } else {
      throw new Error('unknown mode');
    }
  }
  if ($u.isnumber(x)) {
    throw new Error('input arguments must be an array or matrix');
  }
  return $u.vectorfun(dim,x,_burkeratio,frisk,t,mode);
}

}
},{}],148:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method cagr
 * @summary Compound annual growth rate
 * @description Compound annual growth rate
 * 
 * @param  {number|array|matrix} x portfolio/assets returns 
 * @param  {number} p number of years (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 *
 * // CAGR for 10 months on 12 or 0.83 years
 * ubique.cagr(x,x.length/12);
 * // 0.229388
 *
 * ubique.cagr(cat(0,x,y),x.length/12);
 * // [ [ 0.229388 ], [ 0.151999 ] ]
 */
 $u.cagr = function(x,p,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  p = p == null ? 1 : p;
  dim = dim == null ? 0 : dim;

  var _cagr = function(a,p) {
    return $u.power(1 + $u.ror(a,'ret'),(1 / p)) - 1;
  }
  if ($u.isnumber(x)) {
   return $u.power(a,(1 / p)) - 1;
  }
  return $u.vectorfun(dim,x,_cagr,p);
 }
}
},{}],149:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method calmarratio
 * @summary Calmar Ratio
 * @description A risk-adjusted measure like Sharpe ratio that uses maximum drawdown instead of
 * standard deviation for risk.
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily (def: 252)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.calmarratio(x,0,12);
 * // 16.701049
 *
 * ubique.calmarratio(cat(0,x,y),0,12);
 * // [ [ 16.701049 ], [ 1.32768 ] ]
 */
 $u.calmarratio = function(x,frisk,t,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  dim = dim == null ? 0 : dim;

  var _calmarratio = function(a,frisk,t) {
    var annret = $u.annreturn(a,t),
    maxdd = $u.drawdown(a).maxdd;
    return (annret - frisk) / maxdd;
  }
  if ($u.isnumber(x)) {
    throw new Error('input arguments must be an array or matrix');
  }
  return $u.vectorfun(dim,x,_calmarratio,frisk,t);
}

}
},{}],150:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method cdrawdown
 * @summary Continuous Drawdown
 * @description Continuous Drawdown
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {array|matrix}
 * 
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.cdrawdown(x);
 * // [ 0.009, 0.014 ]
 * 
 * ubique.cdrawdown(ubique.cat(0,x,y));
 * // [ [ 0.009, 0.014 ], [ 0.005, 0.095743, 0.068971 ] ]
 */
 $u.cdrawdown = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 0 : dim;

  var _cdown = function(a) {
    var cdd = [], tmp = 0, t = 0;
    for (var i = 0; i < a.length; i++) {
      if (i === 0 && a[i] < 0) {
        tmp = 1 + a[i];
      }
      if (i > 0) {
        if (a[i] < 0) {
          if (tmp === 0) {
            tmp = 1 + a[i];
          } else {
            tmp = tmp * (1 + a[i]);
          }
        }
        if (a[i] >=0) {
          if (tmp !== 0) {
            cdd[t] = 1 - tmp;
            t++;
            tmp = 0;
          }
        }
      }
    }
    if (tmp !== 0) {
      cdd.push(1 - tmp);
      tmp = 0;
    }
    return cdd;
  }
  if ($u.isnumber(x)) {
    return 0;
  }
  return $u.vectorfun(dim,x,_cdown);

}
}
},{}],151:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method downsidepot
 * @summary Downside potential
 * @description Downside potential
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.downsidepot(x,0.1/100);
 * // 0.0025
 * 
 * ubique.downsidepot(ubique.cat(0,x,y));
 * // [ [ 0.0023 ], [ 0.0173 ] ]
 */
 $u.downsidepot = function(x,mar,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
   mar = mar == null ? 0 : mar;
   dim = dim == null ? 0 : dim;
   
   var _ddp = function(a,mar) {
    var z = 0;
    for (var i = 0;i < a.length;i++) {
      z += Math.max(mar - a[i],0) / a.length;
    }
    return z;
  }
  if ($u.isnumber(x)) {
   return x;
 }
 return $u.vectorfun(dim,x,_ddp,mar);
}
}

},{}],152:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method downsiderisk
 * @summary Downside Risk
 * @description Downside Risk or Semi-Standard Deviation. 
 * Measures  the  variability  of  underperformance  below  a  minimum  target   rate 
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.downsiderisk(x,0.1/100);
 * // 0.00570088
 * 
 * ubique.downsiderisk(ubique.cat(0,x,y));
 * // [ [ 0.005263 ], [ 0.028208 ] ]
 */
 $u.downsiderisk = function(x,mar,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mar = mar == null ? 0 : mar;
  dim = dim == null ? 0 : dim;
  
  var _dsrisk = function(a,mar) {
    var z = 0;
    for (var i = 0; i < a.length; i++) {
      z += Math.pow(Math.min(a[i] - mar,0),2) / a.length;
    }
    return Math.sqrt(z);
  }
  if ($u.isnumber(x)) {
    return x;
  }
  return $u.vectorfun(dim,x,_dsrisk,mar);
}
}

},{}],153:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method drawdown
 * @summary Drawdown
 * @description Drawdowon from Peak.Any continuous losing return period.
 * Return drawdown from peak and time to recovery array.
 *
 * Returns an object with:
 *
 * dd (drawdown array)
 * ddrecov (drawdown recovery index)
 * maxdd (max drawdown)
 * maxddrecov (max drawdown recovery period): [start period, end period]
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {string} mode drawdown calculation. 'return','geometric' (def: 'return')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {object}  
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 *
 * ubique.drawdown(x);
 * // { dd: [ 0, 0, 0, 0.009, 0, 0, 0, 0, 0.014, 0 ], ddrecov: [ 0, 0, 0, 4, 0, 0, 0, 0, 9, 0 ],
 * //   maxdd: 0.014, maxddrecov: [ 8, 9 ] }
 */
 $u.drawdown = function(x,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'return' : mode;
  dim = dim == null ? 0 : dim;
  
  var ddown = function(a,mode) {
    if (mode === 'return') {
      _a = $u.cumprod($u.plus(a,1));
    } else
    if (mode === 'geometric') {
      _a = $u.log($u.cumprod($u.plus(a,1)));
    } else {
      throw new Error('unknown drawdown mode');
    }
    var highest = _a[0],
    highestidx = 1,
    _dd = $u.array(_a.length,0),
    _recov = $u.array(_a.length,0),
    _maxdd = 0,
    _maxddidx = [1,_a.length],
    _cdd = [],
    t = 0;
    _cdd[t] = 0;
    for (var i = 0; i < _a.length; i++) {
      if (highest <= _a[i]) {
        highest = _a[i];
        highestidx = i + 1;
      }
      if (mode === 'return') {
        _dd[i] = (highest - _a[i]) / highest;
      } else 
      if (mode === 'geometric') {
        _dd[i] = (highest - _a[i]);
      }
      if (_dd[i] !== 0) {
        _recov[i] = i + 1;
      }
      if (_dd[i] > _maxdd) {
        _maxdd = _dd[i];
        _maxddidx[0] = highestidx;
        _maxddidx[1] = i + 1;
      }
    }
    return {dd: _dd, ddrecov: _recov, maxdd: _maxdd, maxddrecov: _maxddidx};
  }
  if ($u.isnumber(x)) {
    return 0;
  }
  return $u.vectorfun(dim,x,ddown,mode);
}

}
},{}],154:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method histcondvar
 * @summary Historical Conditional Value-At-Risk
 * @description Historical Conditional Value-At-Risk. Univariate historical simulation.Single asset
 * 
 * @param  {array|matrix} x array or matrix of values    
 * @param  {number} p confidence level in the range [0,1] (def: 0.95)
 * @param  {number} amount amount (def: 1)
 * @param  {period} period time horizon (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)    
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * // historical daily conditional VaR at 95% conf level
 * ubique.histcondvar(ubique.cat(0,x,y),0.95);
 * // [ [ 0.014 ], [ 0.061 ] ]
 *
 * // historical daily conditional VaR at 99% for 100k GBP asset over 10 days 
 * ubique.histcondvar(ubique.cat(0,x,y),0.99,100000,10);
 * // [ [ 4427.188724 ], [ 19289.893727 ] ]
 */
 $u.histcondvar = function(x,p,amount,period,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  p = p == null ? 0.95 : p;
  amount = amount == null ? 1 : amount;
  period = period == null ? 1 : period;
  dim = dim == null ? 0 : dim;

  var _hcvar = function(a,p,amount,period) {
    var _VaR = -$u.histvar(a,p),
    z = [],
    t = 0;
    for (var i = 0; i < a.length; i++) {
      if (a[i] <= _VaR) {
        z[t] = a[i];
        t++;
      }
    }
    return -$u.mean(z) * Math.sqrt(period) * amount;
  }
  if ($u.isnumber(x)) {
   return x;
 }
 return $u.vectorfun(dim,x,_hcvar,p,amount,period);
}
}

},{}],155:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method histvar
 * @summary Historical Value-At-Risk
 * @description Univariate historical simulation. Single asset
 * 
 * @param  {array|matrix} x array or matrix of values    
 * @param  {number} p confidence level in the range [0,1] (def: 0.95)
 * @param  {number} amount amount (def: 1)
 * @param  {period} period time horizon (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)    
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * // historical daily VaR at 95% conf level
 * ubique.histvar(ubique.cat(0,x,y),0.95);
 * // [ [ 0.014 ], [ 0.061 ] ]
 *
 * // historical daily VaR at 99% for 100k GBP asset over 10 days 
 * ubique.histvar(ubique.cat(0,x,y),0.99,100000,10);
 * // [ [ 4427.188724 ], [ 19289.893727 ] ]
 */
 $u.histvar = function(x,p,amount,period,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  p = p == null ? 0.95 : p;
  amount = amount == null ? 1 : amount;
  period = period == null ? 1 : period;
  dim = dim == null ? 0 : dim;

  var _histvar = function(a,p,amount,period) {
    return -$u.quantile(a,1 - p) * Math.sqrt(period) * amount;
  }
  if ($u.isnumber(x)) {
   return x;
 }
 return $u.vectorfun(dim,x,_histvar,p,amount,period);
}
}
},{}],156:[function(require,module,exports){
/**
 * Time Series Analysis
 */
 module.exports = function($u) {
/**
 * @method hurst
 * @summary Hurst index/exponent
 * @description It's a useful statistic for detecting if a time series is mean reverting (anti-persistent), totally random or persistent.
 * A value in the range [0.5) indicates mean-reverting (anti-persistent)
 * A value of 0.5 indicate a random walk
 * A value H in the range (0.5,1] indicates momentum (persistent)
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} flag normalization value 0: population, 1:sample (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.hurst(x);
 * // 0.344059
 * 
 * ubique.hurst(x,1);
 * // 0.3669383
 * 
 * ubique.hurst(ubique.cat(0,x,y));
 * // [ [ 0.344059 ], [ 0.51531 ] ]
 */
 $u.hurst = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  flag = flag == null ? 1 : flag;
  dim = dim == null ? 0 : dim;
  var _hurst = function(a,flag) {
    var cdev = $u.cumdev(a);
    var rs = ($u.max(cdev) - $u.min(cdev)) / $u.std(a,flag);
    return Math.log(rs) / Math.log(a.length);
  }
  if ($u.isnumber(x)) {
   return 0;
 }
 return $u.vectorfun(dim,x,_hurst,flag); 

}

}
},{}],157:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method inforatio
 * @summary Information Ratio
 * @description Information Ratio
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {array} y benchmark returns
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|matrix}      
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 *
 * ubique.inforatio(x,y);
 * // 0.0936915
 * 
 * ubique.inforatio(ubique.cat(0,x,y),z);
 * // [ [ 0.026302 ], [ -0.059705 ] ]
 */
 $u.inforatio = function(x,y,dim) {
   if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 0 : dim;
  var _ir = function(a,b) {
    return $u.mean($u.minus(a,b)) / $u.std($u.minus(a,b));
  }
  if ($u.isarray(x) && $u.isarray(y)) {
    return  _ir(x,y);
  } else
  if ($u.ismatrix(x) && $u.isarray(y)) {
    return $u.vectorfun(dim,x,_ir,y);
  } else {
   throw new Error('first input must be an array/matrix, the second one an array');
 }
}
}

},{}],158:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method irr
 * @summary Internal rate of return on an investment based on a series of periodic cash flows
 * @description Calculates the internal rate of return on an investment
 * based on a series of regularly/irregurarly periodic cash flows.
 * 
 * @param  {array} cf income or payments associated with the investment. Must contain at least one negative and one positive cash flow to calculate rate of return, and the first amount must be negative
 * @param  {array} cfd number of calendar days from the beginning of the period that cash flow occurs
 * @param  {number} cd total number of calendar days in the measurement period
 * @param  {number} guess estimate for what the internal rate of return will be (def: 0.1)
 * @return {number}       
 *
 * @example
 * //Simple IRR
 * ubique.irr([250000,25000,-10000,-285000]);
 * // 0.024712563094781776
 * 
 * ubique.irr([74.2,37.1,-104.4],[0,1,2],2);
 * // -0.07410820570460687
 *
 * //Modified IRR
 * ubique.irr([250000,25000,-10000,-285000],[0,45,69,90],90);
 * // 0.07692283872311274
 * 
 * ubique.irr([74.2,37.1,-104.4],[0,14,31],31);
 * // -0.07271456460699813
 */
 $u.irr = function(cf,cfd,cd,guess) {
   if (arguments.length < 1) {
    throw new Error('not enough input arguments');
  }
  var _npv = function(cf,cfd,cd,guess) {
    var npv = 0;
    for (var i = 0;i < cf.length;i++) {
      npv += cf[i] / Math.pow((1 + guess),cfd[i]/cd);
    }
    return npv;
  }
  var _npvd = function(cf,cfd,cd,guess) {
    var npv = 0;
    for (var i = 0;i < cf.length;i++) {
      npv -= cfd[i]/cd * cf[i] / Math.pow((1 + guess),cfd[i]/cd)
    }
    return npv;
  }
  if (arguments.length === 1) {
    cfd = $u.colon(0,cf.length-1,1);
    cd = 1;
    guess = 0.1;
  }
  if (arguments.length === 2) {
    cd = 1;
    guess = 0.1;
  }
  if (arguments.length === 3) {
    guess = 0.1;
  }
  var rate = guess,
  maxeps = 1e-6,
  maxiter = 50,
  newrate = 0,
  epsrate = 0,
  npv = 0,
  cnt = 0,
  cntv = true;
  do {
    npv = _npv(cf,cfd,cd,rate);
    newrate = rate - npv / _npvd(cf,cfd,cd,rate);
    epsrate = Math.abs(newrate - rate);
    rate = newrate;
    cntv = (epsrate > maxeps) && (Math.abs(npv) > maxeps);
  } while (cntv && (cnt++ < maxiter));
  if (cntv) {
    throw new Error('number error');
  }
  return rate;
}

}
},{}],159:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method jensenalpha
 * @summary Jensen alpha
 * @description  Ex-post alpha calculated with regression line. Free-risk is the avereage free-risk for the timeframe selected.
 *
 * @param  {array|matrix} x asset/portfolio values
 * @param  {array} y benchmark values
 * @param  {number} frisk  free-risk (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|matrix}      
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 * 
 * ubique.jensenalpha(x,y);
 * // 0.017609
 * 
 * ubique.jensenalpha(cat(0,x,y),z);
 * // [ [ 0.020772 ], [ 0.006256 ] ]
 */
 $u.jensenalpha = function(x,y,frisk,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  dim = dim == null ? 0 : dim;

  var _ja = function(a,b,frisk) {
    var beta = $u.linearreg(a,b).beta;
    return $u.mean(a) - frisk - beta * ($u.mean(b) - frisk);
  }
  if ($u.isarray(x) && $u.isarray(y)) {
    return  _ja(x,y,frisk);
  } else
  if ($u.ismatrix(x) && $u.isarray(y)) {
    return $u.vectorfun(dim,x,_ja,y,frisk);
  } else {
    throw new Error('first input must be an array/matrix, the second one an array');
  }
}
}
},{}],160:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method m2sortino
 * @summary M-squared for Sortino
 * @description M2 calculated for Downside risk instead of Total Risk
 *  
 * @param  {array|matrix} x asset/portfolio values
 * @param  {array} y benchmark values
 * @param  {number} frisk free-risk rate (def: 0)
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily (def: 252)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|matrix}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 * 
 * ubique.m2sortino(x,y,0,0,12);
 * // 0.103486
 * 
 * ubique.m2sortino(cat(0,x,y),z,0,0,12);
 * // [ [ 0.527018 ], [ 0.148094 ] ]
 */
 $u.m2sortino = function(x,y,frisk,mar,t,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  mar = mar == null ? 0 : mar;
  t = t == null ? 252 : t;
  dim = dim == null ? 0 : dim;

  var _m2sortino = function(a,b,frisk,mar,t) {
    return $u.annreturn(a,t) + $u.sortino(a,frisk,mar) * ($u.downsiderisk(b,mar) * $u.sqrt(t) - $u.downsiderisk(a,mar) * $u.sqrt(t));
  }
  if ($u.isarray(x) && $u.isarray(y)) {
    return  _m2sortino(x,y,frisk,mar,t);
  } else
  if ($u.ismatrix(x) && $u.isarray(y)) {
    return $u.vectorfun(dim,x,_m2sortino,y,frisk,mar,t);
  } else {
    throw new Error('first input must be an array/matrix, the second one an array');
  }
}
}
},{}],161:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method martinratio
 * @summary Martin Ratio
 * @description A risk-adjusted measure with free risk and Ulcer index.
 * 
 * Martin Ratio = (Portfolio Return - RiskFree) / Ulcer Index
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily (def: 252)
 * @param  {string} mode drawdown calculation. 'return','geometric' (def: 'return')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 *
 * ubique.martinratio(x,0,12);
 * // 44.425456
 *
 * ubique.martinratio(cat(0,x,y),0,12);
 * // [ [ 44.425456 ], [ 2.438364 ] ]
 */
 $u.martinratio = function(x,frisk,t,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  mode = mode == null ? 'return' : mode;
  dim = dim == null ? 0 : dim;

  var _martinratio = function(a,frisk,t,mode) {
    var annret = $u.annreturn(a,t),
    dd = $u.sqrt($u.sum($u.power($u.cdrawdown(a),2)));
    return (annret - frisk) /$u.ulcerindex(a,mode);
  }
  if ($u.isnumber(x)) {
    throw new Error('input arguments must be an array or matrix');
  }
  return $u.vectorfun(dim,x,_martinratio,frisk,t,mode);
}

}
},{}],162:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method mdietz
 * @summary Historical performance of an investment portfolio with external cash flows
 * @description Historical performance of an investment portfolio with external cash flows
 * 
 * @param  {number} ev ending value
 * @param  {number} bv beginning market value
 * @param  {number|array} cf external cashflows (inflows/outflows)
 * @param  {number|array} cfd number of calendar days from the beginning of the period that cash flow occurs
 * @param  {number} cd total number of calendar days in the measurement period
 * @return {number}
 *
 * @example
 * var ev = 104.4,bv = 74.2,cf = 37.1,cfd = 14, cd = 31;
 * ubique.mdietz(ev,bv,cf,cfd,cd);
 * // -0.07298099559862156
 *
 * var ev = 1200,bv = 1000,cf = [10,50,35,20],cfd = [15,38,46,79],cd = 90;
 * ubique.mdietz(ev,bv,cf,cfd,cd);
 * // 0.0804
 */
 $u.mdietz = function(ev,bv,cf,cfd,cd) {
  if (arguments.length < 5) {
    throw new Error('not enough input arguments');
  }
  var md = -99999;
  var w = [];
  if ($u.isnumber(cf)) {
    md = (ev - bv - cf) / (bv + (cf * (1 - cfd / cd)));
  } else {
    if (cd <= 0) {
      throw new Error('actual number of days in the period negative or zero');
    }
    for (var i = 0;i < cf.length;i++) {
      if (cfd[i] < 0) {
        throw new Error('number of days negative or zero');
      }
      w[i] = (1 - cfd[i] / cd);
    }
      var ttwcf = 0; //total weighted cash flows
      for (var i = 0;i < cf.length;i++) {
        ttwcf += w[i] * cf[i];
      }
      var tncf = 0; //total net cash flows
      for (var i = 0;i < cf.length;i++) {
        tncf += cf[i];
      }
      md = (ev - bv - tncf) / (bv + ttwcf);
    }
    return md;
  }
}
},{}],163:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method modigliani
 * @summary Modigliani index for risk-adjusted return
 * @description Modigliani index for risk-adjusted return
 *  
 * @param  {array|matrix} x asset/portfolio values
 * @param  {array} y benchmark values
 * @param  {number} frisk free-risk rate (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|matrix}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 * 
 * ubique.modigliani(x,y);
 * // 0.0406941
 * 
 * ubique.modigliani(cat(0,x,y),z);
 * // [ [ 0.042585 ], [ 0.013185 ] ]
 */
 $u.modigliani = function(x,y,frisk,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  dim = dim == null ? 0 : dim;

  var _m2 = function(a,b,frisk) {
    return $u.mean(a) + $u.sharpe(a,frisk) * ($u.std(b) - $u.std(a));
  }
  if ($u.isarray(x) && $u.isarray(y)) {
    return  _m2(x,y,frisk);
  } else
  if ($u.ismatrix(x) && $u.isarray(y)) {
    return $u.vectorfun(dim,x,_m2,y,frisk);
  } else {
    throw new Error('first input must be an array/matrix, the second one an array');
  }
}
}
},{}],164:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method  montecarlovar
 * @summary Montecarlo Value-at-Risk
 * @description Montecarlo VaR for single asset. Based on geometric Brownian motion.
 *
 * @param  {number|array} x array of returns or standard deviation of returns
 * @param  {number} p confidence level in the range [0,1] (def: 0.95)
 * @param  {number} t holding period (def: 1)
 * @param  {number} fr free-risk rate (def: 0)
 * @param  {number} v asset/portfolio start value (def: 1)
 * @param  {number} iter number of iterations
 * @return {number}  
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 *
 * // ex-ante simulated VaR at 95% confidence for t = 1, free risk zero, start capital one
 * ubique.montecarlovar(x,0.95,1,0,1,10000);
 * // 0.073219
 * 
 * // historical simulated daily VaR at 99% for 100k GBP asset over 10 days 
 * ubique.montecarlovar(ubique.std(x),0.99,10,0,100000);
 * // 25254.640005
 */
 $u.montecarlovar = function(x,p,t,fr,v,iter) {
   if (arguments.length === 0) {
    return null;
  }
  p = p == null ? 0.95 : p;
  t = t == null ? 1 : t;
  fr = fr == null ? 0 : fr;
  v = v == null ? 1 : v;
  iter = iter == null ? 10000 : iter;
  if ($u.isnumber(x)) {
    s = $u.clone(x);
  } else 
  if ($u.isarray(x)) {
    s = $u.std(x);
  } else {
    throw new Error('first argument must be a number or array');
  }
  var mcvar = [];
  for (var i = 0;i < iter;i++) {
    mcvar[i] = Math.exp((fr - 0.5 * Math.pow(s,2)) + s * $u.norminv(Math.random(),0,1)) - 1;
  }
  return - Math.pow(t,0.5) * $u.prctile(mcvar, 1 - p) * v;
}

}
},{}],165:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method omegaratio
 * @summary Omega ratio
 * @description Omega ratio
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.omegaratio(x);
 * // 8.782609
 * 
 * ubique.omegaratio(ubique.cat(0,x,y));
 * // [ [ 8.782609 ], [ 1.728324 ] ]
 */
 $u.omegaratio = function(x,mar,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mar = mar == null ? 0 : dim;
  dim = dim == null ? 0 : dim;
  var _or = function(a,mar) {
    return $u.upsidepot(a,mar) / $u.downsidepot(a,mar);
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_or,mar);
}
}

},{}],166:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method painindex
 * @summary Pain Index
 * @description Mean value of the drawdowns, similar to Ulcer Index.
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {string} mode drawdown calculation. 'return','geometric' (def: 'return')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array} 
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.painindex(x);
 * // 0.0023
 * 
 * ubique.painindex(cat(0,x,y));
 * // [ [ 0.0023 ], [ 0.042955 ] ]
 */
 $u.painindex = function(x,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'return' : mode;
  dim = dim == null ? 0 : dim;

  var _painindex = function(a,mode) {
    dd = $u.drawdown(a,mode).dd,
    n = a.length;
    return $u.sum(dd) / n;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_painindex,mode);
}

}
},{}],167:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method painratio
 * @summary Pain Ratio
 * @description A risk-adjusted measure with free risk and Pain index.
 * 
 * Pain Ratio = (Portfolio Return - RiskFree) / Pain Index
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily (def: 252)
 * @param  {string} mode drawdown calculation. 'return','geometric' (def: 'return')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 *
 * ubique.painratio(x,0,12);
 * // 101.044955
 *
 * ubique.painratio(cat(0,x,y),0,12);
 * // [ [ 101.044955 ], [ 3.235687 ] ]
 */
 $u.painratio = function(x,frisk,t,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  mode = mode == null ? 'geometric' : mode;
  dim = dim == null ? 0 : dim;
 
  var _painratio = function(a,frisk,t,mode) {
    var annret = $u.annreturn(a,t);
    var dd = $u.sqrt($u.sum($u.power($u.cdrawdown(a),2)));
    return (annret - frisk) /$u.painindex(a,mode);
  }
  if ($u.isnumber(x)) {
    throw new Error('input arguments must be an array or matrix');
  }
  return $u.vectorfun(dim,x,_painratio,frisk,t,mode);
}

}
},{}],168:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method paramcondvar
 * @summary Parametric Conditional Value-At-Risk
 * @description Parametric Conditional Value-At-Risk. More sensitive to the shape of the loss distribution in the tails
 * Also known as Expected Shortfall (ES), Expected Tail Loss (ETL).
 * 
 * @param  {number|array} mu mean value (def: 0)
 * @param  {number|array} sigma standard deviation (def: 1)
 * @param  {number} p cVaR confidende level in range [0,1] (def: 0.95)
 * @param  {number} amount portfolio/asset amount (def: 1)
 * @param  {number} period time horizon (def: 1)
 * @return {number}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * // parametric daily Var at 95% conf level
 * ubique.paramcondvar(ubique.mean(x),ubique.std(x));
 * // 0.030018
 *
 * //parametric daily VaR at 99% for 100k GBP asset over 10 days (two assets)
 * ubique.paramcondvar(ubique.mean(ubique.cat(0,x,y)),ubique.std(ubique.cat(0,x,y)),0.99,100000,10);
 * // [ [ 19578.980844 ], [ 44511.107219 ] ]
 */
 $u.paramcondvar = function(mu,sigma,p,amount,period) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  p = p == null ? 0.95 : p;
  amount = amount == null ? 1 : amount;
  period = period == null ? 1 : period;
  
  var _pcvar = function(_mu,_sigma,p,amount,period) {
    return _sigma * $u.normpdf($u.norminv(1 - p))/(1 - p) * amount * Math.sqrt(period) - _mu;
  }
  if ($u.isnumber(mu)) {
    return _pcvar(mu,sigma,p,amount,period);
  }
  var temp = $u.flatten(mu);
  var out = temp.map(function(el,idx) {
    return _pcvar(mu[idx],sigma[idx],p,amount,period);
  });
  if ($u.ismatrix(mu) && $u.isrow(mu)) {
    return [out];
  }
  if ($u.ismatrix(mu) && $u.iscolumn(mu)) {
    return $u.transpose(out);
  }
  return out;
}
}

},{}],169:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method paramvar
 * @summary Parametric Value-At-Risk
 * @description Parametric Value-At-Risk. Assets or portfolio returns are normally distributed.
 * It manages numbers, arrays, row vectors [[a,b,...,n]] and column vectors [[a],[b],...,[n]]
 * 
 * @param  {number|array} mu mean value (def: 0)
 * @param  {number|array} sigma standard deviation (def: 1)
 * @param  {number} p VaR confidende level in range [0,1] (def: 0.95)
 * @param  {number} amount portfolio/asset amount (def: 1)
 * @param  {number} period time horizon (def: 1)
 * @return {number}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * // VaR with numbers
 * ubique.paramvar(0,1);
 * // 1.644854
 *
 * // VaR with arrays
 * ubique.paramvar([0,0,0],[1,2,3]);
 * [ 1.644854, 3.289707, 4.934561 ]
 * 
 * // parametric VaR at 95% conf level
 * ubique.paramvar(ubique.mean(x),ubique.std(x));
 * // 0.020311
 * 
 * ubique.paramvar(ubique.mean(ubique.cat(0,x,y)),ubique.std(ubique.cat(0,x,y)));
 * // [ [ 0.020311 ], [ 0.074269 ] ]
 *
 * //parametric VaR at 99% for 100k GBP asset over 10 days (two assets)
 * ubique.paramvar(ubique.mean(ubique.cat(0,x,y)),ubique.std(ubique.cat(0,x,y)),0.99,100000,10);
 * // [ [ 11429.165523 ], [ 34867.319072 ] ]
 */
 $u.paramvar = function(mu,sigma,p,amount,period) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	p = p == null ? 0.95 : p;
  amount = amount == null ? 1 : amount;
  period = period == null ? 1 : period;

  var _pvar = function(_mu,_sigma,p,amount,period) {
    return (-$u.norminv(1 - p) * _sigma - _mu) * Math.sqrt(period) * amount; 
  }
  if ($u.isnumber(mu)) {
    return _pvar(mu,sigma,p,amount,period);
  }
  var temp = $u.flatten(mu);
  var out = temp.map(function(el,idx) {
    return _pvar(mu[idx],sigma[idx],p,amount,period);
  });
  if ($u.ismatrix(mu) && $u.isrow(mu)) {
    return [out];
  }
  if ($u.ismatrix(mu) && $u.iscolumn(mu)) {
    return $u.transpose(out);
  }
  return out;
}
}

},{}],170:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method percpos
 * @summary Percentage of positive values in array or matrix
 * @description Percentage of positive values in array or matrix
 * 
 * @param  {array|matrix} x array of elements
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.percpos(x);
 * // 0.8
 * 
 * ubique.percpos(ubique.cat(0,x,y));
 * // [ [ 0.8 ], [ 0.5 ] ]
 * 
 * ubique.percpos(ubique.cat(0,x,y),1);
 * // [ [ 0.5, 1, 1, 0, 0.5, 1, 0.5, 0.5, 0.5, 1 ] ]
 */
 $u.percpos = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 0 : dim;

  var _percpos = function(a) {
    var count = 0;
    for (var i = 0;i < a.length;i++) {
      if (a[i] >= 0) {
        count++;
      } 
    }
    return count / a.length;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_percpos);
}
}
},{}],171:[function(require,module,exports){
/**
 * Data Transformation
 */
 module.exports = function($u) {
/**
 * @method ret2tick
 * @summary Convert a return series to a value series with a start value
 * @description  Convert a return series to a value series with a start value
 * 
 * @param  {array|matrix} x array of elements
 * @param  {string} mode method to compute returns. 'simple','continuous' (def: simple)
 * @param  {number} sval start value (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {array|matrix}     
 *
 * @example
 * ubique.ret2tick([0.5,-3,2.3],'simple',100);
 * // [ 100, 150, -300, -990 ]
 * 
 * ubique.ret2tick([[9, 5], [6, 1]],'simple',100);
 * // [ [ 100, 1000, 6000 ], [ 100, 700, 1400 ] ]
 */
 $u.ret2tick = function(x,mode,sval,dim) {
   if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'simple' : mode;
  sval = sval == null ? 1 : sval;
  dim = dim == null ? 0 : dim;
  
  var _ret2tick = function(a,mode,sval) {
    if ($u.isnumber(a)) {
      a = [a];
    }
    var r = [];
    r[0] = sval;
    if (mode === 'simple') {
      for (var i = 1; i <= a.length; i++) {
        r[i] = r[i - 1] * (1 + a[i - 1]);
      }
    } else 
    if (mode === 'continuous') {
      for (var i = 1; i <= a.length; i++) {
        r[i] = r[i - 1] * Math.exp(a[i - 1]);
      }
    } else {
      throw new Error('unknown return method');
    }
    return r;
  }
  return $u.vectorfun(dim,x,_ret2tick,mode,sval);
  
}

}
},{}],172:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method ror
 * @summary Simple rate of return
 * @description Simple rate of return calculated from the last and the first value of 
 * an array of numbers.
 * 
 * @param  {array|matrix} x array or matrix of returns or values
 * @param  {string} mode mode of values, 'ret' for returns, 'cum' for cumulative (def: 'ret')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.ror(x);
 * // 0.187793
 * 
 * ubique.ror([100,101,99,98,97,102,103,104],'cum');
 * // 0.04
 * 
 * ubique.ror(cat(0,x,y),'ret');
 * // [ [ 0.187793 ], [ 0.125149 ] ]
 */
 $u.ror = function(x,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'ret' : mode;
  dim = dim == null ? 0 : dim;

  var _ror = function(a,mode) {
    if (mode === 'ret') {
      var eq = $u.cumprod($u.plus(1,a));
    } else
    if (mode === 'cum') {
      var eq = $u.clone(a);
    } else {
      throw  new Error('unknown value');
    }
    return eq[eq.length - 1] / eq[0] - 1;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_ror,mode);
}
}
},{}],173:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method sharpe
 * @summary Sharpe Ratio
 * @description Sharpe Ratio.Compute Sharpe ratio for an array X of values (daily, weekly, etc) and
 * a free-risk rate. Annual free-risk must be divided to match the right timeframe.
 * 
 * @param  {array|matrix} x array of value
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.sharpe(x,0.02/12);
 * // 0.698794
 * 
 * ubique.sharpe(ubique.cat(0,x,y));
 * // [ [ 0.770539 ], [ 0.23858 ] ]
 */
 $u.sharpe = function(x,frisk,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  frisk = frisk == null ? 0 : frisk;
  dim = dim == null ? 0 : dim;
 
 	var _sharpe = function(a,frisk) {
 		return ($u.mean(a) - frisk) / $u.std(a);
 	}
 	if ($u.isnumber(x)) {
 		return NaN;
 	}
 	return $u.vectorfun(dim,x,_sharpe,frisk);
 }

}
},{}],174:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method sortino
 * @summary Sortino ratio
 * @description  Sortino ratio
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk free-risk rate (def: 0)
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 1)
 * @return {number|arrray}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.sortino(x,0.02/12);
 * // 3.08438
 * 
 * ubique.sortino(ubique.cat(0,x,y),0.01/12,0.5);
 * // [ [ 0.035364 ], [ 0.024015 ] ]
 */
 $u.sortino = function(x,frisk,mar,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  mar = mar == null ? 0 : mar;
  dim = dim == null ? 0 : dim;
  
  var _sr = function(a,frisk,mar) {
    return ($u.mean(a) - frisk) / $u.downsiderisk(a,mar);
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_sr,frisk,mar);
}
}

},{}],175:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method sterlingratio
 * @summary Sterling Ratio
 * @description A risk-adjusted measure like Calmar ratio but the denominator is 
 * the largest consecutive drawdown (excluded the 10% excess in the original formula)
 * 
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {number} frisk annual free-risk rate (def: 0)
 * @param  {number} t frequencey of data. 1: yearly, 4: quarterly, 12: monthly, 52: weekly, 252: daily (def: 252)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var cat = ubique.cat;
 * 
 * ubique.sterlingratio(x,0,12);
 * // 16.701049
 *
 * ubique.sterlingratio(cat(0,x,y),0,12);
 * // [ [ 16.701049 ], [ 1.515412 ] ]
 */
 $u.sterlingratio = function(x,frisk,t,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  t = t == null ? 252 : t;
  dim = dim == null ? 0 : dim;

  var _sterlingratio = function(a,frisk,t) {
    var annret = $u.annreturn(a,t);
    var ldd = $u.max($u.cdrawdown(a));
    return (annret - frisk) / ldd;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_sterlingratio,frisk,t);
}

}
},{}],176:[function(require,module,exports){
/**
 * Data Transformation
 */
 module.exports = function($u) {
/**
 * @method tick2ret
 * @summary Convert a value series to a return series
 * @description  Convert a value series to a return series. 'simple' (default) for simple returns, 'continuous' for continuously compounded
 * 
 * @param  {array|matrix} x array of elements
 * @param  {string} mode method to compute returns. 'simple','continuous' (def: simple)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {array|matrix}     
 *
 * @example
 * ubique.tick2ret([0.5,-3,2.3]);
 * // [ -7, -1.766667 ]
 * 
 * ubique.tick2ret([[9, 5], [6, 1]]);
 * // [ [ -0.444444 ], [ -0.833333 ] ]
 */
 $u.tick2ret = function(x,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'simple' : mode;
  dim = dim == null ? 0 : dim;
  
  if ($u.numel(x) < 2) {
    throw new Error('insert at least two values');
  }
  var _tick2ret = function(a,mode) {
    var r = [];
    if (mode === 'simple') {
      for (var i = 1;i < a.length;i++) {
        r[i - 1] = a[i] / a[i - 1] - 1;
      }
    } else 
    if (mode === 'continuous') {
      for (var i = 1;i < a.length;i++) {
        r[i - 1] = Math.log(a[i] / a[i - 1]);
      }
    } else {
      throw new Error('unkwon retun method');
    }
    return r;
  }
  return $u.vectorfun(dim,x,_tick2ret,mode);
  
}

}

},{}],177:[function(require,module,exports){
/**
 * Time Series Analysis
 */
 module.exports = function($u) {
/**
 * @method tomonthly
 * @summary Convert a time series to a monthly frequency
 * @description Convert a time series to a monthly frequency. Default: all days
 * in the range.
 *
 * @param  {array} nd array of unix dates
 * @param  {array|matrix} nv array or matrix of values
 * @return {matrix}
 *
 * @example
 * ubique.tomonthly(ubique.datenum(['15-01-18','15-02-28','15-03-05','15-03-24','15-04-27'],'YY-MM-DD'),[100,99,102,103,98]);
 * // [ [ 1421539200, 1425081600, 1427155200, 1430092800 ], [ 100, 99, 103, 98 ] ]
 */
 $u.tomonthly = function(nd,nv) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  // basic mode: all data, exact on last day of month
  var md = $u.month(nd);
  var df = $u.diff(md);
  df[0] = 1;
  df = $u.cat(1,df,1)[0];
  var idx = $u.find(df.map(function(el){return el !== 0;}));
  if ($u.isarray(nv)) {
    var newv = $u.subset(nv,idx);
  }
  if ($u.ismatrix(nv)) {
    var newv = $u.subset(nv,idx,':');
  }
  return [$u.subset(nd,idx),newv];

}
}
},{}],178:[function(require,module,exports){
/**
 * Time Series Analysis
 */
 module.exports = function($u) {
/**
 * @method toweekly
 * @summary Convert a time series to a weekly frequency
 * @description Convert a time series to a weekly frequency. Default: all days
 * in the range. Example: daily dates [Wed,...Fri,...Mon,...Fri,...Thu] will become 
 * [Wed,...,Fri...,Fri...,Thu]
 *
 * @param  {array} nd array of unix dates
 * @param  {array|matrix} nv array or matrix of values
 * @return {matrix}
 *
 * @example
 * ubique.toweekly(ubique.datenum(['15-01-15','15-01-23','15-01-30','15-02-04'],'YY-MM-DD'),[100,99,102,103,98]);
 * // [ [ 1421280000, 1421971200, 1422576000, 1423008000 ],[ 100, 99, 102, 103 ] ]
 */
 $u.toweekly = function(nd,nv) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var wd = $u.weekday(nd);

  // basic mode: all data, exact on Friday
  var idx = $u.find(wd.map(function(a) {return a === 5;}));
  if (wd[0] !== 5) {
    idx = $u.cat(1,0,idx);
  }
  if (wd[wd.length - 1] !== 5) {
    idx = $u.cat(1,idx,nd.length - 1)[0];
  }
  if ($u.isarray(nv)) {
    var newv = $u.subset(nv,idx);
  }
  if ($u.ismatrix(nv)) {
    var newv = $u.subset(nv,idx,':');
  }
  return [$u.subset(nd,idx),newv];

}
}
},{}],179:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method trackerr
 * @summary Tracking Error (ex-post)
 * @description  Ex-post tracking error
 * 
 * @param  {array|matrix} x array or matrix of X values
 * @param  {array} y array of Y values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}   
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 * 
 * ubique.trackerr(x,z);
 * // 0.068436
 *
 * ubique.trackerr(cat(0,x,y),z);
 * // [ [ 0.068436 ], [ 0.058622 ] ]
 */
 $u.trackerr = function(x,y,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  dim = dim == null ? 0 : dim;
  var _te = function(a,b) {
    return $u.std($u.minus(a,b));
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_te,y);
}
}
},{}],180:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method treynor
 * @summary Treynor Ratio
 * @description Compute the Treynor ratio for an array X of values (daily, weekly, etc) and
 * a free-risk rate. Annual free-risk must be divided to match the right timeframe.
 * 
 * @param  {array} x array of X values
 * @param  {array} y array of Y values
 * @param  {number} frisk  free-risk rate (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number}       
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * var z = [0.04,-0.022,0.043,0.028,-0.078,-0.011,0.033,-0.049,0.09,0.087];
 * var cat = ubique.cat;
 * 
 * ubique.treynor(x,z,0.01/12);
 * // -0.095687
 *
 * ubique.treynor(cat(0,x,y),z,0.01/12);
 * // [ [ -0.095687 ], [ 0.029863 ] ]
 */
 $u.treynor = function(x,y,frisk,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  frisk = frisk == null ? 0 : frisk;
  dim = dim == null ? 0 : dim;
  var _treynor = function(a,b,frisk) {
    var beta = $u.linearreg(a,b).beta;
    return ($u.mean(a) - frisk) / beta;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_treynor,y,frisk);

}
}
},{}],181:[function(require,module,exports){
/**
 * Performance metrics
 */
 module.exports = function($u) {
/**
 * @method twr
 * @summary True Time-weighted return measures the returns of the assets irrespective of the amount invested
 * @description rue Time-weighted return measures the returns of the assets irrespective of the amount invested
 * 
 * @param  {array} mv array of market values
 * @param  {array} cf array of external cashflows (inflows/outflows)
 * @return {number}    
 *
 * @example
 * var mv = [250000,255000,257000,288000,293000,285000], cf = [0,0,25000,0,-10000,0];
 * 
 * ubique.twr(mv,cf);
 * // 0.07564769566198049
 */
 $u.twr = function(mv,cf) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if (arguments.length === 1) {
    cf = 0;
  }
  if (mv.length !== cf.length) {
    throw new Error('market value and cash flows must be of the same size');
  }
  var _twr = [1];
  for (var i = 1; i < mv.length; i++) {
    _twr[i] = mv[i] / (mv[i - 1] + cf[i - 1]);
  }
  return $u.prod(_twr) - 1;
}

}
},{}],182:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method ulcerindex
 * @summary Ulcer Index
 * @description Ulcer Index of Peter G. Martin (1987). The impact of long, deep drawdowns will have significant
 * impact because the underperformance since the last peak is squared.
 *  
 * @param  {array|matrix} x asset/portfolio returns
 * @param  {string} mode drawdown calculation. 'return','geometric' (def: 'return')
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array} 
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var xt = [[0.003,0.026],[0.015,-0.009],[0.014,0.024],[0.015,0.066],[-0.014,0.039]];
 * ubique.ulcerindex(x);
 * // 0.005263
 * 
 * ubique.ulcerindex(xt,'return',1);
 * // [ [ 0.006261, 0.004025 ] ]
 */
 $u.ulcerindex = function(x,mode,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'return' : mode;
  dim = dim == null ? 0 : dim;

  var _uidx = function(a,mode) {
    var dd = $u.drawdown(a,mode).dd;
    var n = a.length;
    return $u.sqrt($u.sum($u.power(dd,2)) / n);
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_uidx,mode);
}

}
},{}],183:[function(require,module,exports){
/**
 * Risk metrics
 */
 module.exports = function($u) {
/**
 * @method upsidepot
 * @summary Upside potential
 * @description Upside potential
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} mar minimum acceptable return (def: 0)
 * @param  {number} dim dimension 0: row, 1: column (def: 1)
 * @return {number|array}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.upsidepot(x,0.1/100);
 * // 0.0194
 * 
 * ubique.upsidepot(ubique.cat(0,x,y));
 * // [ [ 0.0202 ], [ 0.0299 ] ]
 */
 $u.upsidepot = function(x,mar,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  mar = mar == null ? 0 : mar;
  dim = dim == null ? 0 : dim;

  var _usp = function(a,mar) {
    var z = 0;
    for (var i = 0;i < a.length;i++) {
      z += Math.max(a[i] - mar,0) / a.length;
    }
    return z;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_usp,mar);
}
}
},{}],184:[function(require,module,exports){
/**
 * Interpolation
 */
 module.exports = function($u) {
/**
 * @method interp1
 * @summary Linear interpolation
 * @description Linear interpolation. Returns the 1-D value of Y, given Xi query points. 
 * 
 * @param  {array} x sample points
 * @param  {array} y corresponding values of sample points
 * @param  {number|array} new query points. For values outside [min(X),max(X)] NaN is returned.
 * @return {array}
 *
 * @example
 * var x = [1,2,3,4,5,6];
 * var y = [2,4,6,8,10,12];
 * var xnew = [2,4,6];
 *
 * ubique.interp1(x,y,xnew);
 * // [ 4, 8, 12 ]
 */
 $u.interp1 = function(x,y,xnew) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if (x.length !== y.length) {
    throw new Error('input dimension mismatch');
  }
  if ($u.isnumber(xnew)) {
    xnew = [xnew];
  }
  var ynew = new Array(xnew.length),
  n = x.length,
  dx = new Array(n),
  dy = new Array(n),
  slope = new Array(n),
  intercept = new Array(n);

  for (var i = 0; i < n; i++) {
    if (i < n - 1) {
      dx[i] = x[i + 1] - x[i];
      dy[i] = y[i + 1] - y[i];
      slope[i] = dy[i] / dx[i];
      intercept[i] = y[i] - x[i] * slope[i];
    } else {
      dx[i] = dx[i - 1];
      dy[i] = dy[y - 1];
      slope[i] = slope[i - 1];
      intercept[i] = intercept[i - 1];      
    }
  }

  for (var j = 0; j < xnew.length; j++) {
    if (xnew[j] < $u.min(x) || xnew[j] > $u.max(x)) {
      ynew[j] = NaN;
    } else {
      var idx = findneighb(xnew[j],x);
      ynew[j] = slope[idx] * xnew[j] + intercept[idx];
    }
  }
  if ($u.numel(ynew) === 1) {
    return ynew[0];
  } else {
    return ynew;
  }
}
var findneighb = function(value,arr) {
  var dist = $u.maxval,
  idx = -1;
  for (var i = 0; i < arr.length; i++) {
    var newdist = value - arr[i];
    if (newdist > 0 && newdist < dist) {
      dist = newdist;
      idx = i;
    }
  }
  return idx;
}

}

},{}],185:[function(require,module,exports){
/**
 * Linear Regression
 */
 module.exports = function($u) {
/**
 * @method  linearreg
 * @summary Linear regression of Y on X
 * @description Return an object with fields: Beta, Alpha, R-squared, function
 * 
 * @param  {array} y array of elements in Y
 * @param  {array} x array of elements in X
 * @return {object} 
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.linearreg(x,y);
 * // { beta: 0.02308942571228251, alpha: 0.017609073236025237, rsq: 0.0027553853574994254, fun: [Function] }
 * 
 * ubique.linearreg([100,101,99,102,105],[1,2,3,4,5])
 * // { beta: 1.1, alpha: 98.1, rsq: 0.5707547169811321, fun: [Function] }
 * 
 * ubique.linearreg([100,101,99,102,105],[1,2,3,4,5]).fun(6);
 * // 104.69
 * 
 */
 $u.linearreg = function(y,x) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  var n = y.length,
  sx = $u.sum(x),
  sy = $u.sum(y),
  sxy = $u.sum($u.times(x,y)),
  sxx = $u.sum($u.times(x,x)),
  syy = $u.sum($u.times(y,y)),
  beta = (n * sxy - sx * sy) / (n * sxx - sx * sx),
  alpha = (sy - beta * sx) / n,
  rsq = Math.pow((n *sxy - sx * sy)/Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy)),2);
  return {beta: beta,alpha: alpha, rsq: rsq,fun: function (x) {return beta * x + alpha;} }
}

}
},{}],186:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method corrcoef
 * @summary Correlation coefficients of two arrays X,Y
 * @description Correlation coefficients of two arrays X,Y
 *
 * @param  {array|matrix} x array or matrix of elemnts X
 * @param  {array|matrix} y array or matrix of elements Y
 * @param  {number} flag Bessel's correction 0: population, 1: sample (def: 1)
 * @return {matrix}
 *
 * @example
 * var c = [5,6,3];
 * var d = [0.5,-3,2.3];
 * var l = [[1,1,-1],[1,-2,3],[2,3,1]];
 *
 * ubique.corrcoef(l);
 * // [ [ 1, 0.802955, 0 ],[ 0.802955, 1, -0.59604 ],[ 0, -0.59604, 1 ] ]
 * 
 * ubique.corrcoef(c,d);
 * // [ [ 1, -0.931151 ], [ -0.931151, 1 ] ]
 */
 $u.corrcoef = function(x) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	var _args = [x];
 	for (var i = 1; i < arguments.length; i++) {
 		_args.push(arguments[i]);
 	}
 	var covm = $u.cov.apply(null,_args);
 	var sigma = $u.transpose($u.sqrt($u.diag(covm)));
 	var m = sigma.length;
 	covm = $u.rdivide(covm,$u.repmat(sigma,1,m));
 	covm = $u.rdivide(covm,$u.repmat($u.transpose(sigma),m,1));
 	return covm;
 }

}

},{}],187:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method cov
 * @summary Covariance matrix
 * @description Covariance matrix
 *
 * @param  {array|matrix} x array or matrix of elemnts X
 * @param  {array|matrix} y array or matrix of elements Y
 * @param  {number} flag Bessel's correction 0: population, 1: sample (def: 1)
 * @return {number|array}
 *
 * @example
 * var c = [5,6,3];
 * var d = [0.5,-3,2.3];
 * var e = [[9, 5], [6, 1]];
 * var f = [[3, 2], [5, 2]];
 * var l = [[1,1,-1],[1,-2,3],[2,3,1]];
 *
 * ubique.cov(c);
 * // 2.33333
 * 
 * ubique.cov(c,d);
 * // [ [ 2.333333, -3.833333 ], [ -3.833333, 7.263333 ] ]
 * 
 * ubique.cov(c,d,0);
 * // [ [ 1.555556, -2.555556 ], [ -2.555556, 4.842222 ] ]

 * ubique.cov(e,f);
 * // [ [ 10.916667, 2 ], [ 2, 2 ] ]
 * 
 * ubique.cov(l);
 * // [ [ 0.333333, 1.166667, 0 ],[ 1.166667, 6.333333, -3 ],[ 0, -3, 4 ] ]
 */
 $u.cov = function(x) {
  var arglen = arguments.length;
 	if (arglen === 0) {
 		throw new Error('not enough input arguments');
 	}
 	if (arglen > 3) {
 		throw new Error('too many input arguments');
 	}
 	if (arglen === 3) {
 		flag = arguments[arglen - 1];
 		var flagrule = $u.isscalar(flag) && (flag === 0 || flag === 1);
 		if (!flagrule) {
 			throw new Error('third input must be 0 or 1');
 		}
 		arglen = arglen - 1;
 	} else
 	if (arglen === 2 && $u.isscalar(arguments[arglen - 1]) && (arguments[arglen - 1] === 0 || arguments[arglen - 1] === 1)) {
 			flag = arguments[arglen - 1];
 			arglen = arglen - 1;
 	} else {
 		flag = 1;
 	}

    if (arglen === 1 && ($u.isarray(x) || $u.isvector(x))) {
    	x = $u.flatten(x);
    	return $u.varc(x);
    }
 	if (arglen === 2) {
 		y = arguments[1];
 		x = $u.transpose($u.flatten(x));
 		y = $u.transpose($u.flatten(y));
 		if (x.length !== y.length) {
 			throw new Error('input dimension must agree');
 		}
 		x = $u.cat(1,x,y);
 	}
 	var m = $u.nrows(x);
 	var mu = $u.mean(x,1);
 	var z = $u.minus(x,$u.repmat(mu,m,1));
 	return $u.rdivide($u.mtimes($u.transpose(z),z), m - flag);
 }

}


},{}],188:[function(require,module,exports){
/**
 * Basic Statistic
 */
 module.exports = function($u) {
/**
 * @method histc
 * @summary Histogram count
 * @description  For array X counts the number of values in X that fall between the elements in the BINS array. Values outside the range in BINS are not counted.
 * 
 * Returns an object with:
 * 
 * bins - number of bins
 * count - number of matched elements
 * freq - frequency 
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number|array} bins number of bins (as NUMBER) or array of edges (as ARRAY) (def: 10)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {aray|matrix}       
 *
 * @example
 * var A = [87,27,45,62,3,52,20,43,74,61];
 * var B = [12,34,57,43,88,75,89,2,27,29];
 * 
 * ubique.histc(A,[0,20,40,60,80,100]);
 * // [ { bins: 0, count: 1, freq: 0.1 },
 * //   { bins: 20, count: 2, freq: 0.2 },
 * //   { bins: 40, count: 3, freq: 0.3 },
 * //   { bins: 60, count: 3, freq: 0.3 },
 * //   { bins: 80, count: 1, freq: 0.1 },
 * //   { bins: 100, count: 0, freq: 0 } ]
 *
 * ubique.histc(ubique.cat(0,A,B),[0,50,100]);
 * // [ [ { bins: 0, count: 5, freq: 0.5 },
 * //     { bins: 50, count: 5, freq: 0.5 },
 * //     { bins: 100, count: 0, freq: 0 } ],
 * //   [ { bins: 0, count: 6, freq: 0.6 },
 * //     { bins: 50, count: 4, freq: 0.4 },
 * //     { bins: 100, count: 0, freq: 0 } ] ]
 */
 $u.histc = function(x,bins,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  bins = bins == null ? 10 : bins;
  dim  = dim == null ? 0 : dim;

  var _histc = function(a,bins) {
    var y = [];
    var h = []; 
    var out = [];
    if ($u.isnumber(bins)) {
      var xmin = $u.min(a),
      xmax = $u.max(a),
      binw = (xmax - xmin) / bins,
      anum = $u.colon(0,bins);
      y = $u.plus($u.times(anum,binw),xmin);
    } else {
      y = bins;
    }

    for (var k = 0; k < y.length; k++) {
      h[k] = 0;
      for (var i = 0; i < a.length; i++) {
        if (y[k] <= a[i] && a[i] < y[k + 1]) {
          h[k] += 1;
        } else 
        if (a[i] === y[k]) {
          h[k] += 1;
        }
      }
      out.push({bins: y[k], count: h[k], freq: h[k]/a.length})
    }
    return out;
  }

  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_histc,bins);
}
}
},{}],189:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method iqr
 * @summary Interquartile range
 * @description Return the interquartile (Q3 - Q1 quartiles)
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.iqr(x);
 * // 0.023
 * 
 * ubique.iqr(ubique.cat(0,x,y));
 * // [ [ 0.023 ], [ 0.095 ] ]
 */
 $u.iqr = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim  = dim == null ? 0 : dim;

 	var _iqr = function(a) {
 		return $u.prctile(a,75) - $u.prctile(a,25);
 	}
 	if ($u.isnumber(x)) {
 		return NaN;
 	}
 	return $u.vectorfun(dim,x,_iqr);
 }

}
},{}],190:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method kurtosis
 * @summary Kurtosis
 * @description Kurtosis
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} flag 0: bias correction, 1: simple (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.kurtosis(x);
 * // 3.037581
 * 
 * ubique.kurtosis(ubique.cat(0,x,y));
 * // [ [ 3.037581 ], [ 1.397642 ] ]
 */
 $u.kurtosis = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  flag = flag == null ? 1 : flag;
  dim  = dim == null ? 0 : dim;

  var _kurtosis = function(a,flag) {
    var n = a.length;
    var mom4 = $u.moment(a,4) / Math.pow($u.moment(a,2),2);
    return flag === 1 ? mom4: ((n + 1) * mom4 - 3 * (n - 1)) * (n - 1) / ((n - 2) *(n - 3)) + 3;
  }
  if ($u.isnumber(x)) {
   return NaN;
 }
 return $u.vectorfun(dim,x,_kurtosis,flag);
}

}
},{}],191:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method mad
 * @summary Mean absolute deviation
 * @description Mean absolute deviation
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var c = [5,6,3];
 *
 * ubique.mad(c);
 * // 1.11111
 * 
 * ubique.mad(a,1);
 * // [ [ 1, 1, 3 ] ]
 * 
 * ubique.mad(a);
 * // [ [ 0.444444 ], [ 3.777778 ] ]
 */
 $u.mad = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  dim  = dim == null ? 0 : dim;

  var _mad = function(a) {
   return $u.mean($u.arrayfun($u.minus(a,$u.mean(a)),Math.abs));
 }
 if ($u.isnumber(x)) {
   return 0;
 }
 return $u.vectorfun(dim,x,_mad);
}

}
},{}],192:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method max
 * @summary Largest element in array
 * @description Largest element in array
 * 
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 1)
 * @return {number|array|matrix}
 *
 * @example 
 * ubique.max([5,6,-1]);
 * // 6
 * 
 * ubique.max([[-1,3,-1],[4,5,9]]);
 * // [ [ 3 ], [ 9 ] ]
 * 
 * ubique.max([[-1,3,-1],[4,5,9]],1);
 * // [ [ 4, 5, 9 ] ]
 */
 $u.max = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  dim  = dim == null ? 0 : dim;
  var _max = function(a) {
    return Math.max.apply(null,a);
  }
  if ($u.isnumber(x)) {
   return x;
 }
 return $u.vectorfun(dim,x,_max);
}
}

},{}],193:[function(require,module,exports){
 /**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method mean
 * @summary Average value of array
 * @description Average value of array
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var c = [5,6,3];
 *
 * ubique.mean(c);
 * // 4.66667
 * 
 * ubique.mean([[5,6,5],[7,8,-1]]);
 * // [ [ 5.333333 ], [ 4.666667 ] ]
 * 
 * ubique.mean([[5,6,5],[7,8,-1]],1);
 * // [ [ 6, 7, 2 ] ]
 */
 $u.mean = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  dim = dim == null ? 0 : dim;
 	if ($u.isnumber(x)) {
 		return x;
 	}
 	if ($u.isarray(x)) {
 		return  $u.sum(x,dim) / $u.numel(x);
 	}
 	return $u.rdivide($u.sum(x,dim),$u.size(x)[1 - dim]);
 }

}
},{}],194:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method median
 * @summary Median value of array
 * @description Median value of array
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * ubique.median([5,6,3]);
 * // 4.66667
 * 
 * ubique.median([[5,6,5],[7,8,-1]]);
 * // [ [ 5 ], [ 7 ] ]
 * 
 * ubique.median([[5,6,5],[7,8,-1]],1);
 * // [ [ 6, 7, 2 ] ]
 */
 $u.median = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim  = dim == null ? 0 : dim;

 	var _median = function(a) {
 		var n = a.length - 1;
 		var idx = $u.max(1,Math.floor(n / 2));
 		var _a = $u.sort(a);
 		if( n % 2 === 0 ) {
 			return _a[idx];
 		} else {
 			return (_a[idx - 1] + _a[idx]) / 2;
 		}
 	}
 	if ($u.isnumber(x)) {
 		return x;
 	}
 	return $u.vectorfun(dim,x,_median);
 }

}

},{}],195:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method min
 * @summary Smallest element in array
 * @description Smallest element in array
 *
 * @param  {array|matrix} x array or matrix of values
 * @param  {number} dim dimension selected, 1: column 0: row (def: 0)
 * @return {number|array|matrix}
 *
 * @example 
 * ubique.min([5,6,-1]);
 * // -1
 * 
 * ubique.min([[-1,3,-1],[4,5,9]]);
 * // [ [ -1 ], [ 4 ] ]
 * 
 * ubique.min([[-1,3,-1],[4,5,9]],1);
 * // [ [ -1, 3, -1 ] ]
 */
 $u.min = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim  = dim == null ? 0 : dim;
  var _min = function(a) {
    return Math.min.apply(null,a);
  }
  if ($u.isnumber(x)) {
   return 0;
 }
 return $u.vectorfun(dim,x,_min);
}
}

},{}],196:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method mode
 * @summary Most frequent value in an array of elements 
 * @description Most frequent value in an array of elements (Unimodal)
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * ubique.mode([5,6,3]);
 * // 3
 * 
 * ubique.mode([[5,6,5],[7,8,-1]]);
 * // [ [ 5 ], [ -1 ] ]
 * 
 * ubique.mode([[5,6,5],[7,8,-1]],1);
 * // [ [ 5, 6, -1 ] ]
 */
 $u.mode = function(x,dim) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  dim  = dim == null ? 0 : dim;

  var _mode = function(a) {
    var counter = {};
    var mode = [];
    var max = 0;
    var _a = $u.sort(a);
    for (var i = 0; i < x.length; i++) {
      if (!(_a[i] in counter)) {
        counter[_a[i]] = 0;
      } else {
        counter[_a[i]]++;
      }
      if (counter[_a[i]] === max) {
        mode.push(_a[i]);
      } else 
      if (counter[_a[i]] > max) {
        max = counter[_a[i]];
        mode = [_a[i]];
      }
    }
    return mode[0];
  }
  if ($u.isnumber(x)) {
    return x;
  }
  return $u.vectorfun(dim,x,_mode);

}

}
},{}],197:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method moment
 * @summary Central moments
 * @description Central moments. First moment is zero, second is variance.
 * 
 * @param  {array|matrix} x array or amatrix of elements
 * @param  {number} k k-th central sample moment
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.moment(x,3);
 * // 0.000007
 * 
 * ubique.moment(x,1);
 * // 0
 * 
 * ubique.moment(ubique.cat(0,x,y),2);
 * // [ [ 0.000486 ], [ 0.00251 ] 
 */
 $u.moment = function(x,k,dim) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
   dim  = dim == null ? 0 : dim;

   var _moment = function(a,k) {
     var mu = $u.mean(a);
     return $u.mean(a.map(function(b) {return Math.pow(b - mu,k)}));
   }
   if ($u.isnumber(x)) {
     return NaN;
   }
   return $u.vectorfun(dim,x,_moment,k);

 }

}
},{}],198:[function(require,module,exports){
/**
 * Distance metrics
 */
module.exports = function($u) {
/**
 * @method pdist
 * @summary Pairwise distance between two sets of observations
 * @description  Compute distance between two array with differente methods:
 * euclidean, manhattan, chebycheb, hamming
 * 
 * @param  {array} x array of values in X
 * @param  {array} y array of values in Y
 * @param  {string} mode methods: 'euclidean','manhattan','chebychev','hamming' (def: 'euclidean')
 * @return {number}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.pdist(x,y,'euclidean');
 * // 0.170532
 * 
 * ubique.pdist(x,y,'manhattan');
 * // 0.471
 * 
 * ubique.pdist(x,y,'chebychev');
 * // 0.087
 * 
 * ubique.pdist(x,y,'hamming');
 * // 10
 */
$u.pdist = function(x,y,mode) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  mode = mode == null ? 'euclidean' : mode;
  var len = x.length;
  var out = 0;
  switch (mode) {
    case "euclidean":
      out = $u.sqrt($u.sum($u.power($u.minus(x,y),2)));
      return out;
      break;
    case "manhattan": 
      out = $u.sum($u.abs($u.minus(x,y)));
      return out;
      break;
    case "chebychev": 
      out = $u.max($u.abs($u.minus(x,y)));
      return out;
      break;
    case "hamming": 
      for (var i=0;i<len;i++) {
        if (x[i] !== y[i]) {
          out++;
        }
      }
      return out;
      break;
    default:
      throw new Error('Invalid method');
    }
}

}
},{}],199:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method prctile
 * @summary Percentiles of a sample
 * @description Percentiles of a sample, inclusive
 * 
 * @param  {array|matrix} x array of emlements
 * @param  {number} p p-th percentile in the range [0,100]
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.prctile(x,5);
 * // -0.014
 * 
 * ubique.prctile(x,33);
 * // 0.0118
 * 
 * ubique.prctile(ubique.cat(0,x,y),5);
 * // [ [ -0.014, -0.061 ] ]
 */
 $u.prctile = function(x,p,dim) {
  if (arguments.length < 2) {
    throw new Error('not enough input arguments');
  }
  if (p < 0 || p > 100) {
    throw new Error('p-th percentile must be a real value between 0 and 100 inclusive');
  }
  dim = dim == null ? 0 : dim;
  var _prctile = function(a,pr) {
    var arrnum= $u.colon(0.5,a.length - 0.5);
    var _a = $u.sort(a);
    var pq = $u.rdivide($u.times(arrnum,100),a.length);
    
    pq = pq.concat(0,pq,100);
    _a = _a.concat(_a[0],_a,_a[_a.length - 1]);
    return $u.interp1(pq,_a,pr);
  }
  if ($u.isnumber(x)) {
    return x;
  }
  return $u.vectorfun(dim,x,_prctile,p);
}

}
},{}],200:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method quantile
 * @summary Quantilies of a sample 
 * @description Quantilies of a sample 
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} p p-th quantile in the range [0,1]
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.quantile(x,0.25);
 * // 0.003
 * 
 * ubique.quantile(ubique.cat(0,x,y),0.33);
 * // [ [ 0.0118, -0.0242 ] ]
 */
 $u.quantile = function(x,p,dim) {
 	if (arguments.length < 2) {
 		throw new Error('not enough input arguments');
 	}
 	if (p < 0 || p > 1) {
 		throw new Error('p-th percentile must be a real value between 0 and 1 inclusive');
 	}
 	dim = dim == null ? 0 : dim;
 	return $u.prctile(x,p*100,dim);
 }

}
},{}],201:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method quartile
 * @summary Quartilies of a sample
 * @description Quartilies of a sample
 *
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var x = [ 0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 *
 * ubique.quartile(x);
 * // [ 0.003, 0.015, 0.026 ]
 * 
 * ubique.quartile(ubique.cat(0,x,y));
 * // [ [ 0.003, 0.015, 0.026 ], [ -0.037, 0.0175, 0.058 ] ]
 */
 $u.quartile = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  dim = dim == null ? 0 : dim;

  var _quartile = function(a) {
    return [$u.prctile(a,25),$u.prctile(a,50),$u.prctile(a,75)];
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_quartile);
}

}
},{}],202:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method range
 * @summary Range of values
 * @description Range of values
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var c = [5,6,3];
 *
 * ubique.range([5,6,3]);
 * // 3
 * 
 * ubique.range([[5,6,5],[7,8,-1]]);
 * // [ [ 1 ], [ 9 ] ]
 * 
 * ubique.range([[5,6,5],[7,8,-1]],1);
 * // [ [ 2, 2, 6 ] ]
 */
 $u.range = function(x,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	dim = dim == null ? 0 : dim;

 	var _range = function(a) {
 		return $u.max(a) - $u.min(a);
 	}
 	if ($u.isnumber(x)) {
 		return 0;
 	}
 	return $u.vectorfun(dim,x,_range);
 }

}
},{}],203:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method skewness
 * @summary Skewness
 * @description Skewness
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} flag 0: bias correction, 1: simple (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.skewness(x);
 * // 0.617481
 * 
 * ubique.skewness(ubique.cat(0,x,y));
 * // [ [ 0.617481 ], [ -0.118909 ] ]
 */
 $u.skewness = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	flag = flag == null ? 1 : flag;
  dim  = dim == null ? 0 : dim;

  var _skewness = function(a,flag) {
    var n = a.length;
    var mom3 = $u.moment(a,3) / Math.pow($u.moment(a,2),1.5);
    return flag === 1 ? mom3: Math.sqrt((n - 1) / n) * (n / (n - 2)) * mom3;
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_skewness,flag);
}
}
},{}],204:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method std
 * @summary Standard deviation
 * @description Standard deviation
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} flag normalization value 0: population, 1:sample (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var c = [5,6,3];
 *
 * ubique.std(c);
 * // 1.52753
 * 
 * ubique.std(c,0);
 * // 1.24722 
 * 
 * ubique.std(a,0);
 * // [ [ 0.471405 ], [ 4.027682 ] ]
 * 
 * ubique.std(a,0,1);
 * // [ [ 1, 1, 3 ] ]
 */
 $u.std = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	flag = flag == null ? 1 : flag;
  dim = dim == null ? 0 : dim;

 	var variance = $u.varc(x,flag,dim);
 	return $u.sqrt(variance);
 }

}

},{}],205:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method varc
 * @summary Variance
 * @description  Variance
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} flag normalization value 0: population, 1:sample (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * var a = [[5,6,5],[7,8,-1]];
 * var c = [5,6,3];
 *
 * ubique.varc(c);
 * // 2.33333
 * 
 * ubique.varc(c,0);
 * // 1.55556 
 * 
 * ubique.varc(a,0);
 * // [ [ 0.222222 ], [ 16.222222 ] ]
 * 
 * ubique.varc(a,0,1);
 * // [ [ 1, 1, 9 ] ]
 */
 $u.varc = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
  flag = flag == null ? 1 : flag;
  dim = dim == null ? 0 : dim;

  var _varc = function(a,flag) {
    var mu = $u.mean(a);
    return ($u.sum($u.power($u.abs($u.minus(a,mu)),2))) / (a.length - flag);
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_varc,flag);
}

}

},{}],206:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method xkurtosis
 * @summary Excess kurtosis
 * @description Excess kurtosis
 * 
 * @param  {array|matrix} x array or matrix of elements
 * @param  {number} flag 0: bias correction, 1: simple (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array|matrix}
 *
 * @example
 * var x = [0.003,0.026,0.015,-0.009,0.014,0.024,0.015,0.066,-0.014,0.039];
 * var y = [-0.005,0.081,0.04,-0.037,-0.061,0.058,-0.049,-0.021,0.062,0.058];
 * 
 * ubique.xkurtosis(x);
 * // 0.037581
 * 
 * ubique.xkurtosis(ubique.cat(0,x,y));
 * // [ [ 0.037581 ], [ -1.602358 ] ]
 */
 $u.xkurtosis = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	flag = flag == null ? 1 : flag;
  dim  = dim == null ? 0 : dim;

  var kurt = $u.kurtosis(x,flag,dim);
  if ($u.isnumber(kurt)) {
    return kurt - 3;
  }
  return $u.arrayfun(kurt,function(a) {return a - 3;});
}

}
},{}],207:[function(require,module,exports){
/**
 * Descriptive Statistic
 */
 module.exports = function($u) {
/**
 * @method zscore
 * @summary Standardized Z score
 * @description Standardized Z score
 * 
 * @param  {array|matrix} x array of values
 * @param  {number} flag normalization value 0: population, 1:sample (def: 1)
 * @param  {number} dim dimension 0: row, 1: column (def: 0)
 * @return {number|array}   
 *
 * @example
 * ubique.zscore([5,6,3]);
 * // [ 0.218218, 0.872872, -1.091089 ]
 * 
 * ubique.zscore([[5,6,5],[7,8,-1]]);
 * // [ [ -0.57735, 1.154701, -0.57735 ],[ 0.473016, 0.675737, -1.148754 ] ]
 * 
 * ubique.zscore([[5,6,5],[7,8,-1]],0,1);
 * // [ [ -1, -1, 1 ], [ 1, 1, -1 ] ]
 */
 $u.zscore = function(x,flag,dim) {
 	if (arguments.length === 0) {
 		throw new Error('not enough input arguments');
 	}
 	flag = flag == null ? 1 : flag;
  dim  = dim == null ? 0 : dim;

  var _zscore = function(a,flag) {
    return $u.rdivide($u.minus(a,$u.mean(a)),$u.std(a,flag));
  }
  if ($u.isnumber(x)) {
    return NaN;
  }
  return $u.vectorfun(dim,x,_zscore,flag);
}

}
},{}],208:[function(require,module,exports){
/**
 * name: ubique
 * version: 0.5.1
 * update date: 2015-09-23
 * 
 * author: Max Todaro <m.todaro.ge@gmail.com>
 * homepage: http://maxto.github.io/index.html
 * 
 * description: A mathematical and quantitative library for Javascript and Node.js
 * 
 *
 * The MIT License (MIT)
 * 
 * Copyright© 2014-2015 Max Todaro
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var ubique = {};
require('./constants.js')(ubique);
require('./extlib.js')(ubique);
require('./datatype/arrayfun.js')(ubique);
require('./datatype/clock.js')(ubique);
require('./datatype/datavec.js')(ubique);
require('./datatype/datenum.js')(ubique);
require('./datatype/datestr.js')(ubique);
require('./datatype/isarray.js')(ubique);
require('./datatype/isempty.js')(ubique);
require('./datatype/isfunction.js')(ubique);
require('./datatype/isinteger.js')(ubique);
require('./datatype/islogical.js')(ubique);
require('./datatype/ismatrix.js')(ubique);
require('./datatype/isnan.js')(ubique);
require('./datatype/isnull.js')(ubique);
require('./datatype/isnumber.js')(ubique);
require('./datatype/isscalar.js')(ubique);
require('./datatype/issingular.js')(ubique);
require('./datatype/isstring.js')(ubique);
require('./datatype/isundefined.js')(ubique);
require('./datatype/isvector.js')(ubique);
require('./datatype/month.js')(ubique);
require('./datatype/now.js')(ubique);
require('./datatype/randchar.js')(ubique);
require('./datatype/strfind.js')(ubique);
require('./datatype/today.js')(ubique);
require('./datatype/vectorfun.js')(ubique);
require('./datatype/weekday.js')(ubique);
require('./elemop/ceil.js')(ubique);
require('./elemop/cumdev.js')(ubique);
require('./elemop/cummax.js')(ubique);
require('./elemop/cummin.js')(ubique);
require('./elemop/cumprod.js')(ubique);
require('./elemop/cumsum.js')(ubique);
require('./elemop/diff.js')(ubique);
require('./elemop/dot.js')(ubique);
require('./elemop/eq.js')(ubique);
require('./elemop/floor.js')(ubique);
require('./elemop/ge.js')(ubique);
require('./elemop/gt.js')(ubique);
require('./elemop/ldivide.js')(ubique);
require('./elemop/le.js')(ubique);
require('./elemop/lt.js')(ubique);
require('./elemop/minus.js')(ubique);
require('./elemop/mldivide.js')(ubique);
require('./elemop/mod.js')(ubique);
require('./elemop/mpower.js')(ubique);
require('./elemop/mrdivide.js')(ubique);
require('./elemop/mtimes.js')(ubique);
require('./elemop/ne.js')(ubique);
require('./elemop/plus.js')(ubique);
require('./elemop/power.js')(ubique);
require('./elemop/prod.js')(ubique);
require('./elemop/rdivide.js')(ubique);
require('./elemop/rem.js')(ubique);
require('./elemop/round.js')(ubique);
require('./elemop/sum.js')(ubique);
require('./elemop/times.js')(ubique);
require('./elemop/uminus.js')(ubique);
require('./elemop/unique.js')(ubique);
require('./elmath/abs.js')(ubique);
require('./elmath/erf.js')(ubique);
require('./elmath/erfc.js')(ubique);
require('./elmath/erfcinv.js')(ubique);
require('./elmath/erfinv.js')(ubique);
require('./elmath/exp.js')(ubique);
require('./elmath/log.js')(ubique);
require('./elmath/sign.js')(ubique);
require('./elmath/sqrt.js')(ubique);
require('./linalgebra/det.js')(ubique);
require('./linalgebra/inv.js')(ubique);
require('./linalgebra/linsolve.js')(ubique);
require('./linalgebra/lu.js')(ubique);
require('./matarrs/array.js')(ubique);
require('./matarrs/cat.js')(ubique);
require('./matarrs/clone.js')(ubique);
require('./matarrs/colon.js')(ubique);
require('./matarrs/diag.js')(ubique);
require('./matarrs/end.js')(ubique);
require('./matarrs/eye.js')(ubique);
require('./matarrs/falses.js')(ubique);
require('./matarrs/find.js')(ubique);
require('./matarrs/fix.js')(ubique);
require('./matarrs/flatten.js')(ubique);
require('./matarrs/flipdim.js')(ubique);
require('./matarrs/fliplr.js')(ubique);
require('./matarrs/flipud.js')(ubique);
require('./matarrs/getcol.js')(ubique);
require('./matarrs/getrow.js')(ubique);
require('./matarrs/horzcat.js')(ubique);
require('./matarrs/ind2sub.js')(ubique);
require('./matarrs/iscolumn.js')(ubique);
require('./matarrs/isrow.js')(ubique);
require('./matarrs/issquare.js')(ubique);
require('./matarrs/length.js')(ubique);
require('./matarrs/linspace.js')(ubique);
require('./matarrs/logspace.js')(ubique);
require('./matarrs/matrix.js')(ubique);
require('./matarrs/mergesort.js')(ubique);
require('./matarrs/ncols.js')(ubique);
require('./matarrs/ndims.js')(ubique);
require('./matarrs/nrows.js')(ubique);
require('./matarrs/numel.js')(ubique);
require('./matarrs/ones.js')(ubique);
require('./matarrs/rand.js')(ubique);
require('./matarrs/repmat.js')(ubique);
require('./matarrs/reshape.js')(ubique);
require('./matarrs/setcol.js')(ubique);
require('./matarrs/setrow.js')(ubique);
require('./matarrs/size.js')(ubique);
require('./matarrs/sort.js')(ubique);
require('./matarrs/squeeze.js')(ubique);
require('./matarrs/sub2ind.js')(ubique);
require('./matarrs/subset.js')(ubique);
require('./matarrs/subsetlin.js')(ubique);
require('./matarrs/tomat.js')(ubique);
require('./matarrs/transpose.js')(ubique);
require('./matarrs/trues.js')(ubique);
require('./matarrs/vertcat.js')(ubique);
require('./matarrs/zeros.js')(ubique);
require('./probdistr/jbtest.js')(ubique);
require('./probdistr/normcdf.js')(ubique);
require('./probdistr/norminv.js')(ubique);
require('./probdistr/normpdf.js')(ubique);
require('./quants/activereturn.js')(ubique);
require('./quants/adjsharpe.js')(ubique);
require('./quants/annadjsharpe.js')(ubique);
require('./quants/annreturn.js')(ubique);
require('./quants/annrisk.js')(ubique);
require('./quants/avgdrawdown.js')(ubique);
require('./quants/burkeratio.js')(ubique);
require('./quants/cagr.js')(ubique);
require('./quants/calmarratio.js')(ubique);
require('./quants/cdrawdown.js')(ubique);
require('./quants/downsidepot.js')(ubique);
require('./quants/downsiderisk.js')(ubique);
require('./quants/drawdown.js')(ubique);
require('./quants/histcondvar.js')(ubique);
require('./quants/histvar.js')(ubique);
require('./quants/hurst.js')(ubique);
require('./quants/inforatio.js')(ubique);
require('./quants/irr.js')(ubique);
require('./quants/jensenalpha.js')(ubique);
require('./quants/m2sortino.js')(ubique);
require('./quants/martinratio.js')(ubique);
require('./quants/mdietz.js')(ubique);
require('./quants/modigliani.js')(ubique);
require('./quants/montecarlovar.js')(ubique);
require('./quants/omegaratio.js')(ubique);
require('./quants/painindex.js')(ubique);
require('./quants/painratio.js')(ubique);
require('./quants/paramcondvar.js')(ubique);
require('./quants/paramvar.js')(ubique);
require('./quants/percpos.js')(ubique);
require('./quants/ret2tick.js')(ubique);
require('./quants/ror.js')(ubique);
require('./quants/sharpe.js')(ubique);
require('./quants/sortino.js')(ubique);
require('./quants/sterlingratio.js')(ubique);
require('./quants/tick2ret.js')(ubique);
require('./quants/tomonthly.js')(ubique);
require('./quants/toweekly.js')(ubique);
require('./quants/trackerr.js')(ubique);
require('./quants/treynor.js')(ubique);
require('./quants/twr.js')(ubique);
require('./quants/ulcerindex.js')(ubique);
require('./quants/upsidepot.js')(ubique);
require('./reglin/interp1.js')(ubique);
require('./reglin/linearreg.js')(ubique);
require('./stats/corrcoef.js')(ubique);
require('./stats/cov.js')(ubique);
require('./stats/histc.js')(ubique);
require('./stats/iqr.js')(ubique);
require('./stats/kurtosis.js')(ubique);
require('./stats/mad.js')(ubique);
require('./stats/max.js')(ubique);
require('./stats/mean.js')(ubique);
require('./stats/median.js')(ubique);
require('./stats/min.js')(ubique);
require('./stats/mode.js')(ubique);
require('./stats/moment.js')(ubique);
require('./stats/pdist.js')(ubique);
require('./stats/prctile.js')(ubique);
require('./stats/quantile.js')(ubique);
require('./stats/quartile.js')(ubique);
require('./stats/range.js')(ubique);
require('./stats/skewness.js')(ubique);
require('./stats/std.js')(ubique);
require('./stats/varc.js')(ubique);
require('./stats/xkurtosis.js')(ubique);
require('./stats/zscore.js')(ubique);
require('./util/argsarray.js')(ubique);
require('./util/format.js')(ubique);
require('./datafeed/yahoo.js')(ubique);
require('./datafeed/yahooSync.js')(ubique);
module.exports = ubique;
},{"./constants.js":15,"./datafeed/yahoo.js":16,"./datafeed/yahooSync.js":17,"./datatype/arrayfun.js":18,"./datatype/clock.js":19,"./datatype/datavec.js":20,"./datatype/datenum.js":21,"./datatype/datestr.js":22,"./datatype/isarray.js":23,"./datatype/isempty.js":24,"./datatype/isfunction.js":25,"./datatype/isinteger.js":26,"./datatype/islogical.js":27,"./datatype/ismatrix.js":28,"./datatype/isnan.js":29,"./datatype/isnull.js":30,"./datatype/isnumber.js":31,"./datatype/isscalar.js":32,"./datatype/issingular.js":33,"./datatype/isstring.js":34,"./datatype/isundefined.js":35,"./datatype/isvector.js":36,"./datatype/month.js":37,"./datatype/now.js":38,"./datatype/randchar.js":39,"./datatype/strfind.js":40,"./datatype/today.js":41,"./datatype/vectorfun.js":42,"./datatype/weekday.js":43,"./elemop/ceil.js":44,"./elemop/cumdev.js":45,"./elemop/cummax.js":46,"./elemop/cummin.js":47,"./elemop/cumprod.js":48,"./elemop/cumsum.js":49,"./elemop/diff.js":50,"./elemop/dot.js":51,"./elemop/eq.js":52,"./elemop/floor.js":53,"./elemop/ge.js":54,"./elemop/gt.js":55,"./elemop/ldivide.js":56,"./elemop/le.js":57,"./elemop/lt.js":58,"./elemop/minus.js":59,"./elemop/mldivide.js":60,"./elemop/mod.js":61,"./elemop/mpower.js":62,"./elemop/mrdivide.js":63,"./elemop/mtimes.js":64,"./elemop/ne.js":65,"./elemop/plus.js":66,"./elemop/power.js":67,"./elemop/prod.js":68,"./elemop/rdivide.js":69,"./elemop/rem.js":70,"./elemop/round.js":71,"./elemop/sum.js":72,"./elemop/times.js":73,"./elemop/uminus.js":74,"./elemop/unique.js":75,"./elmath/abs.js":76,"./elmath/erf.js":77,"./elmath/erfc.js":78,"./elmath/erfcinv.js":79,"./elmath/erfinv.js":80,"./elmath/exp.js":81,"./elmath/log.js":82,"./elmath/sign.js":83,"./elmath/sqrt.js":84,"./extlib.js":85,"./linalgebra/det.js":86,"./linalgebra/inv.js":87,"./linalgebra/linsolve.js":88,"./linalgebra/lu.js":89,"./matarrs/array.js":90,"./matarrs/cat.js":91,"./matarrs/clone.js":92,"./matarrs/colon.js":93,"./matarrs/diag.js":94,"./matarrs/end.js":95,"./matarrs/eye.js":96,"./matarrs/falses.js":97,"./matarrs/find.js":98,"./matarrs/fix.js":99,"./matarrs/flatten.js":100,"./matarrs/flipdim.js":101,"./matarrs/fliplr.js":102,"./matarrs/flipud.js":103,"./matarrs/getcol.js":104,"./matarrs/getrow.js":105,"./matarrs/horzcat.js":106,"./matarrs/ind2sub.js":107,"./matarrs/iscolumn.js":108,"./matarrs/isrow.js":109,"./matarrs/issquare.js":110,"./matarrs/length.js":111,"./matarrs/linspace.js":112,"./matarrs/logspace.js":113,"./matarrs/matrix.js":114,"./matarrs/mergesort.js":115,"./matarrs/ncols.js":116,"./matarrs/ndims.js":117,"./matarrs/nrows.js":118,"./matarrs/numel.js":119,"./matarrs/ones.js":120,"./matarrs/rand.js":121,"./matarrs/repmat.js":122,"./matarrs/reshape.js":123,"./matarrs/setcol.js":124,"./matarrs/setrow.js":125,"./matarrs/size.js":126,"./matarrs/sort.js":127,"./matarrs/squeeze.js":128,"./matarrs/sub2ind.js":129,"./matarrs/subset.js":130,"./matarrs/subsetlin.js":131,"./matarrs/tomat.js":132,"./matarrs/transpose.js":133,"./matarrs/trues.js":134,"./matarrs/vertcat.js":135,"./matarrs/zeros.js":136,"./probdistr/jbtest.js":137,"./probdistr/normcdf.js":138,"./probdistr/norminv.js":139,"./probdistr/normpdf.js":140,"./quants/activereturn.js":141,"./quants/adjsharpe.js":142,"./quants/annadjsharpe.js":143,"./quants/annreturn.js":144,"./quants/annrisk.js":145,"./quants/avgdrawdown.js":146,"./quants/burkeratio.js":147,"./quants/cagr.js":148,"./quants/calmarratio.js":149,"./quants/cdrawdown.js":150,"./quants/downsidepot.js":151,"./quants/downsiderisk.js":152,"./quants/drawdown.js":153,"./quants/histcondvar.js":154,"./quants/histvar.js":155,"./quants/hurst.js":156,"./quants/inforatio.js":157,"./quants/irr.js":158,"./quants/jensenalpha.js":159,"./quants/m2sortino.js":160,"./quants/martinratio.js":161,"./quants/mdietz.js":162,"./quants/modigliani.js":163,"./quants/montecarlovar.js":164,"./quants/omegaratio.js":165,"./quants/painindex.js":166,"./quants/painratio.js":167,"./quants/paramcondvar.js":168,"./quants/paramvar.js":169,"./quants/percpos.js":170,"./quants/ret2tick.js":171,"./quants/ror.js":172,"./quants/sharpe.js":173,"./quants/sortino.js":174,"./quants/sterlingratio.js":175,"./quants/tick2ret.js":176,"./quants/tomonthly.js":177,"./quants/toweekly.js":178,"./quants/trackerr.js":179,"./quants/treynor.js":180,"./quants/twr.js":181,"./quants/ulcerindex.js":182,"./quants/upsidepot.js":183,"./reglin/interp1.js":184,"./reglin/linearreg.js":185,"./stats/corrcoef.js":186,"./stats/cov.js":187,"./stats/histc.js":188,"./stats/iqr.js":189,"./stats/kurtosis.js":190,"./stats/mad.js":191,"./stats/max.js":192,"./stats/mean.js":193,"./stats/median.js":194,"./stats/min.js":195,"./stats/mode.js":196,"./stats/moment.js":197,"./stats/pdist.js":198,"./stats/prctile.js":199,"./stats/quantile.js":200,"./stats/quartile.js":201,"./stats/range.js":202,"./stats/skewness.js":203,"./stats/std.js":204,"./stats/varc.js":205,"./stats/xkurtosis.js":206,"./stats/zscore.js":207,"./util/argsarray.js":209,"./util/format.js":210}],209:[function(require,module,exports){
/**
 * Utility
 */
 module.exports = function ($u) {
/**
 * @method argsarray
 * @summary Converting arguments to an array
 * @description Converting arguments to an array.  test case http://jsperf.com/converting-arguments-to-an-array/18
 * 
 * @param  {number|string|boolean|...} args variable input arguments
 * @return {array}
 *  
 * @example
 * ubique.argsarray(99,true,'test',null);
 * // [ 99, true,'test', null ]
 */
 $u.argsarray = function() {
  var arr = [];
  for (var i = 0,len = arguments.length; i < len; i++) {
     arr[i] = arguments[i];
  }
  return arr;
}
}
},{}],210:[function(require,module,exports){
/**
 * Utility
 */
 module.exports = function ($u) {
/**
 * @method format
 * @summary Set display format for output (numbers)
 * @description Set display format for output (numbers)
 * 
 * @param  {number|array|matrix} x input element
 * @param  {number} k number of decimals (def: 6 decimals)
 * @return {nuber|array|matrix}
 *  
 * @example
 * ubique.format(5.6677798348349,0);
 * // 6
 * 
 * ubique.format([[-1000.47748,0.000002],[0.1483478,10.111100]],2);
 * // [ [ -1000.48, 0 ], [ 0.15, 10.11 ] ]
 */
 $u.format = function (x,k) {
  if (arguments.length === 0) {
    throw new Error('not enough input arguments');
  }
  if (!$u.isnumber(k)) {
    k = 6;
  }
  var _format = function(a,k) {
    return parseFloat(a.toFixed(k));
  }
  return $u.arrayfun(x,_format,k);
}
}
},{}],211:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ubique = require('ubique');

// See http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators for indicators
// TODO: ADX
// TODO: STO

var ta = module.exports = {
  /** Simple moving average */
  SMA: function SMA() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref.data,
        period = _ref.period;

    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var numMA = data.length - period + 1;
    if (numMA <= 0) {
      return [];
    }
    return Array(numMA).fill(0).map(function (_, i) {
      // Slice the last `period` data points from this index and calculate the moving average for this subarray
      return data.slice(i, i + period).reduce(function (a, b) {
        return a + b;
      }, 0) / period;
    });
  },


  /** Exponential moving average */
  EMA: function EMA() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref2.data,
        period = _ref2.period,
        multiplier = _ref2.multiplier;

    if (multiplier === undefined && period === undefined) {
      throw new TypeError('One of period or multiplier must be specified');
    }
    if (multiplier !== undefined && period !== undefined) {
      throw new TypeError('Only one of period or multiplier can be specified');
    }
    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (period !== undefined && typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }
    if (multiplier !== undefined && typeof multiplier !== 'number') {
      throw new TypeError('multiplier must be a number');
    }

    if (period !== undefined) {
      multiplier = 2 / (period + 1);
    } else if (multiplier !== undefined) {
      period = 2 / multiplier - 1;
    }
    var numMA = data.length - period + 1;
    if (numMA <= 0) {
      return [];
    }
    var arr = data.slice().reverse();
    var ema = [ta.SMA({ data: arr.slice(0, period), period: period })[0]];
    for (var i = 1; i < numMA; i++) {
      // EMA = (Close - EMA(previous day)) * multiplier + EMA(previous day)
      ema[i] = multiplier * (arr[period + i - 1] - ema[i - 1]) + ema[i - 1];
    }
    ema.reverse();
    return ema;
  },


  /** Moving Average Convergence Divergence */
  MACD: function MACD() {
    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref3.data,
        _ref3$lowEMAPeriod = _ref3.lowEMAPeriod,
        lowEMAPeriod = _ref3$lowEMAPeriod === undefined ? 12 : _ref3$lowEMAPeriod,
        _ref3$highEMAPeriod = _ref3.highEMAPeriod,
        highEMAPeriod = _ref3$highEMAPeriod === undefined ? 26 : _ref3$highEMAPeriod,
        _ref3$signalEMAPeriod = _ref3.signalEMAPeriod,
        signalEMAPeriod = _ref3$signalEMAPeriod === undefined ? 9 : _ref3$signalEMAPeriod;

    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (lowEMAPeriod >= highEMAPeriod) {
      throw new TypeError('lowEMAPeriod must be less than highEMAPeriod');
    }

    var twelveDayEMA = ta.EMA({ data: data, period: lowEMAPeriod });
    // Remove extra EMA from <period>-day calculation
    twelveDayEMA.splice(-(highEMAPeriod - lowEMAPeriod), highEMAPeriod - lowEMAPeriod);
    var twentySixDayEMA = ta.EMA({ data: data, period: highEMAPeriod });

    // MACD
    var macd = twelveDayEMA.map(function (val, index) {
      return val - twentySixDayEMA[index];
    });
    // MACD Signal
    var signal = ta.EMA({ data: macd, period: signalEMAPeriod });
    // Histogram
    var macdShort = macd.slice();
    macdShort.splice(-(signalEMAPeriod - 1), signalEMAPeriod - 1);
    var histogram = macdShort.map(function (val, index) {
      return val - signal[index];
    });

    // Return all three
    return {
      macd: macd,
      signal: signal,
      histogram: histogram
    };
  },


  /** Bollinger Bands */
  BBANDS: function BBANDS() {
    var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref4.data,
        _ref4$period = _ref4.period,
        period = _ref4$period === undefined ? 20 : _ref4$period,
        _ref4$k = _ref4.k,
        k = _ref4$k === undefined ? 2 : _ref4$k,
        _ref4$useEMA = _ref4.useEMA,
        useEMA = _ref4$useEMA === undefined ? false : _ref4$useEMA;

    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }
    if (typeof k !== 'number') {
      throw new TypeError('k must be a number');
    }
    if (typeof useEMA !== 'boolean') {
      throw new TypeError('useEMA must be a boolean');
    }

    // <period>-day standard deviation
    var stddev = Array(data.length - period + 1).fill(0).map(function (_, i) {
      return ubique.std(data.slice(i, i + period), 0);
    });
    // <period>-day SMA/EMA
    var ma = void 0;
    if (useEMA) {
      ma = ta.EMA({ data: data, period: period });
    } else {
      ma = ta.SMA({ data: data, period: period });
    }

    var lower = ma.map(function (val, index) {
      return val - k * stddev[index];
    });
    var middle = ma;
    var upper = ma.map(function (val, index) {
      return val + k * stddev[index];
    });

    return {
      lower: lower,
      middle: middle,
      upper: upper,
      BandWidth: Array(lower.length).fill(0).map(function (_, i) {
        return (upper[i] - lower[i]) / middle[i] * 100;
      })
    };
  },


  /** True Range */
  TR: function TR() {
    var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        high = _ref5.high,
        low = _ref5.low,
        close = _ref5.close;

    if (!Array.isArray(high)) {
      throw new TypeError('high must be an array');
    }
    if (!Array.isArray(low)) {
      throw new TypeError('low must be an array');
    }
    if (!Array.isArray(close)) {
      throw new TypeError('close must be an array');
    }
    if (high.length !== low.length || low.length !== close.length) {
      throw new TypeError('high, low, and close must be the same length');
    }

    var highR = high.slice().reverse();
    var lowR = low.slice().reverse();
    var closeR = close.slice().reverse();
    var tr = [highR[0] - lowR[0]];
    for (var i = 1; i < highR.length; i++) {
      tr[i] = Math.max(highR[i] - lowR[i], Math.abs(highR[i] - closeR[i - 1]), Math.abs(lowR[i] - closeR[i - 1]));
    }
    tr.reverse();
    return tr;
  },


  /** Average True Range */
  ATR: function ATR() {
    var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        high = _ref6.high,
        low = _ref6.low,
        close = _ref6.close,
        _ref6$period = _ref6.period,
        period = _ref6$period === undefined ? 14 : _ref6$period;

    if (!Array.isArray(high)) {
      throw new TypeError('high must be an array');
    }
    if (!Array.isArray(low)) {
      throw new TypeError('low must be an array');
    }
    if (!Array.isArray(close)) {
      throw new TypeError('close must be an array');
    }
    if (high.length !== low.length || low.length !== close.length) {
      throw new TypeError('high, low, and close must be the same length');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var tr = ta.TR({ high: high, low: low, close: close });
    tr.reverse();
    var highR = high.slice().reverse();
    var lowR = low.slice().reverse();
    var closeR = close.slice().reverse();
    var atr = [ubique.mean(tr.slice(0, period))];
    for (var i = 1; i < highR.length - period + 1; i++) {
      atr[i] = (atr[i - 1] * (period - 1) + tr[period + i - 1]) / period;
    }
    atr.reverse();
    return atr;
  },


  /** Keltner Channels */
  KELT: function KELT() {
    var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        high = _ref7.high,
        low = _ref7.low,
        close = _ref7.close,
        _ref7$periodEMA = _ref7.periodEMA,
        periodEMA = _ref7$periodEMA === undefined ? 20 : _ref7$periodEMA,
        _ref7$periodATR = _ref7.periodATR,
        periodATR = _ref7$periodATR === undefined ? 10 : _ref7$periodATR,
        _ref7$k = _ref7.k,
        k = _ref7$k === undefined ? 2 : _ref7$k;

    if (!Array.isArray(high)) {
      throw new TypeError('high must be an array');
    }
    if (!Array.isArray(low)) {
      throw new TypeError('low must be an array');
    }
    if (!Array.isArray(close)) {
      throw new TypeError('close must be an array');
    }
    if (high.length !== low.length || low.length !== close.length) {
      throw new TypeError('high, low, and close must be the same length');
    }
    if (typeof periodEMA !== 'number') {
      throw new TypeError('periodEMA must be a number');
    }
    if (typeof periodATR !== 'number') {
      throw new TypeError('periodATR must be a number');
    }
    if (typeof k !== 'number') {
      throw new TypeError('k must be a number');
    }

    var ema = ta.EMA({ data: close, period: periodEMA });
    var atr = ta.ATR({ high: high, low: low, close: close, period: periodATR });
    return {
      lower: ema.map(function (val, index) {
        return val - k * atr[index];
      }),
      middle: ema,
      upper: ema.map(function (val, index) {
        return val + k * atr[index];
      })
    };
  },


  /** Aroon */
  AROON: function AROON() {
    var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        high = _ref8.high,
        low = _ref8.low,
        _ref8$period = _ref8.period,
        period = _ref8$period === undefined ? 25 : _ref8$period;

    if (!Array.isArray(high)) {
      throw new TypeError('high must be an array');
    }
    if (!Array.isArray(low)) {
      throw new TypeError('low must be an array');
    }
    if (high.length !== low.length) {
      throw new TypeError('high and low must be the same length');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var up = Array(high.length).fill(0).map(function (_, i) {
      // Aroon-Up = ((25 - Days Since 25-day High)/25) x 100
      var subarr = high.slice(i, i + period);
      return (period - subarr.reduce(function (iMax, val, index, arr) {
        return val > arr[iMax] ? index : iMax;
      }, 0)) / period * 100;
    });
    var down = Array(low.length).fill(0).map(function (_, i) {
      // Aroon-Down = ((25 - Days Since 25-day Low)/25) x 100
      var subarr = low.slice(i, i + period);
      return (period - subarr.reduce(function (iMin, val, index, arr) {
        return val < arr[iMin] ? index : iMin;
      }, 0)) / period * 100;
    });

    return {
      up: up,
      down: down,
      oscillator: up.map(function (val, index) {
        return val - down[index];
      })
    };
  },


  /** Relative Strength Index */
  RSI: function RSI() {
    var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref9.data,
        _ref9$period = _ref9.period,
        period = _ref9$period === undefined ? 14 : _ref9$period;

    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var dataR = data.slice().reverse();
    var change = [0].concat(_toConsumableArray(dataR.slice(1).map(function (val, index) {
      return val - dataR[index];
    })));
    var losses = change.map(function (val) {
      return val < 0 ? -val : 0;
    });
    var gains = change.map(function (val) {
      return val > 0 ? val : 0;
    });

    var avgGains = [ubique.mean(gains.slice(0, period))];
    var avgLosses = [ubique.mean(losses.slice(0, period))];
    for (var i = 1; i < change.length - period + 1; i++) {
      avgGains[i] = (avgGains[i - 1] * (period - 1) + gains[period + i - 1]) / period;
      avgLosses[i] = (avgLosses[i - 1] * (period - 1) + losses[period + i - 1]) / period;
    }

    var rsi = Array(change.length - period + 1).fill(0).map(function (_, i) {
      return 100 - 100 / (1 + avgGains[i] / avgLosses[i]);
    });
    rsi.reverse();

    return rsi;
  },


  /** Stochastic Relative Strength Index */
  StochRSI: function StochRSI() {
    var _ref10 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        data = _ref10.data,
        _ref10$period = _ref10.period,
        period = _ref10$period === undefined ? 14 : _ref10$period;

    if (!Array.isArray(data)) {
      throw new TypeError('data must be an array');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var rsi = ta.RSI({ data: data, period: period });
    return Array(rsi.length).fill(0).map(function (_, i) {
      // Slice the last `period` RSI points from this index and calculate the StochRSI for this subarray
      var rsiSlice = rsi.slice(i, i + period);
      var highestHigh = Math.max.apply(Math, _toConsumableArray(rsiSlice));
      var lowestLow = Math.min.apply(Math, _toConsumableArray(rsiSlice));
      return (rsi[i] - lowestLow) / (highestHigh - lowestLow);
    });
  },


  /** Average Directional Index */
  ADX: function ADX() {
    var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        high = _ref11.high,
        low = _ref11.low,
        close = _ref11.close,
        _ref11$period = _ref11.period,
        period = _ref11$period === undefined ? 14 : _ref11$period;

    if (!Array.isArray(high)) {
      throw new TypeError('high must be an array');
    }
    if (!Array.isArray(low)) {
      throw new TypeError('low must be an array');
    }
    if (!Array.isArray(close)) {
      throw new TypeError('close must be an array');
    }
    if (typeof period !== 'number') {
      throw new TypeError('period must be a number');
    }

    var tr = ta.TR({ high: high, low: low, close: close });
    var pDM1 = high.map(function (val, i) {
      if (high[i] - high[i + 1] > low[i + 1] - low[i]) {
        return Math.max(high[i] - high[i + 1], 0);
      }
      return 0;
    });
    var mDM1 = high.map(function (val, i) {
      if (low[i + 1] - low[i] > high[i] - high[i + 1]) {
        return Math.max(low[i + 1] - low[i], 0);
      }
      return 0;
    });

    var numSmooth = close.length - period + 1;
    function wildersSmoothing(data) {
      var arr = data.slice().reverse();
      var smoothed = [ubique.sum(arr.slice(0, period))];
      for (var i = 1; i < numSmooth; i++) {
        smoothed[i] = smoothed[i - 1] - smoothed[i - 1] / period + arr[period + i - 1];
      }
      smoothed.reverse();
      return smoothed;
    }

    var trSmooth = wildersSmoothing(tr);
    var pDMSmooth = wildersSmoothing(pDM1);
    var mDMSmooth = wildersSmoothing(mDM1);

    var pDI = ubique.rdivide(pDMSmooth, trSmooth).map(function (val) {
      return 100 * val;
    });
    var mDI = ubique.rdivide(mDMSmooth, trSmooth).map(function (val) {
      return 100 * val;
    });

    var dx = Array(pDI.length).fill(0).map(function (_, i) {
      return Math.abs(pDI[i] - mDI[i]) / (pDI[i] + mDI[i]) * 100;
    });
    var adx = ta.SMA({ data: dx, period: period });

    return {
      adx: adx,
      pDI: pDI,
      mDI: mDI
    };
  },


  signals: {
    extrema: function extrema() {
      var _ref12 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          data = _ref12.data;

      if (!Array.isArray(data)) {
        throw new TypeError('data must be an array');
      }

      // Map data to coordinate pairs (prevents incorrect indexing of extrema with indexOf)
      var points = data.map(function (value) {
        return {
          index: data.indexOf(value),
          value: value
        };
      });

      // TODO: consider moving the sensitivity of this to a parameter (currently +/- 2)
      return {
        minima: points.filter(function (point, index, arr) {
          if (index - 2 < 0 || index - 1 < 0 || index + 2 > arr.length - 1 || index + 1 > arr.length - 1) {
            return false;
          }
          return point.value < arr[index - 2].value && point.value < arr[index - 1].value && point.value < arr[index + 1].value && point.value < arr[index + 2].value;
        }),
        maxima: points.filter(function (point, index, arr) {
          if (index - 2 < 0 || index - 1 < 0 || index + 2 > arr.length - 1 || index + 1 > arr.length - 1) {
            return false;
          }
          return point.value > arr[index - 2].value && point.value > arr[index - 1].value && point.value > arr[index + 1].value && point.value > arr[index + 2].value;
        })
      };
    },
    trendlines: function trendlines() {
      var _ref13 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          data = _ref13.data;

      if (!Array.isArray(data)) {
        throw new TypeError('data must be an array');
      }

      // Find all local extrema of the data

      var _ta$signals$extrema = ta.signals.extrema({ data: data }),
          lowPoints = _ta$signals$extrema.minima,
          highPoints = _ta$signals$extrema.maxima;

      // Define the function to find trendlines from those points


      var trendlinesFromPoints = function trendlinesFromPoints() {
        var _ref14 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            points = _ref14.points,
            direction = _ref14.direction;

        var trendingPoints = [];
        // For each pair of points

        var _loop = function _loop(i) {
          var point1 = points[i];

          var _loop2 = function _loop2(j) {
            var point2 = points[j];
            // Create the function for the straight line between the two points
            // f(x) = (y2-y1)/(x2-x2) (x1-x) + y1
            var fn = function fn(x) {
              return (point2.value - point1.value) / (point2.index - point1.index) * (x - point1.index) + point1.value;
            };
            // For each point spanned by this straight line, ensure that the trendline is above/below
            var clearsGraph = true;
            for (var x = Math.min(point1.index, point2.index), max = Math.max(point1.index, point2.index); x < max; x++) {
              if (direction > 0 && fn(x) < data[x] || direction < 0 && fn(x) > data[x]) {
                clearsGraph = false;
                break;
              }
            }
            // If the straight line between the two highs lies entirely above the line, it is a divergence line
            if (clearsGraph) {
              trendingPoints.push([point1, point2]);
            }
          };

          for (var j = i + 1; j < points.length; j++) {
            _loop2(j);
          }
        };

        for (var i = 0; i < points.length; i++) {
          _loop(i);
        }
        return trendingPoints;
      };

      // Find the lower and upper trendlines
      var lowerTrendlines = trendlinesFromPoints({ points: lowPoints, direction: -1 });
      var upperTrendlines = trendlinesFromPoints({ points: highPoints, direction: 1 });

      return {
        lower: lowerTrendlines,
        upper: upperTrendlines
      };
    },
    crossovers: function crossovers() {
      var _ref15 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          data = _ref15.data,
          threshold = _ref15.threshold;

      if (!Array.isArray(data)) {
        throw new TypeError('data must be an array');
      }
      if (typeof threshold !== 'number' && !Array.isArray(threshold)) {
        throw new TypeError('threshold must be a number or array');
      }
      if (Array.isArray(threshold) && data.length !== threshold.length) {
        throw new TypeError('threshold must be the same length as data');
      }

      return data.map(function (_, i) {
        var value1 = threshold;
        var value2 = threshold;
        if (Array.isArray(threshold)) {
          value1 = threshold[i];
          value2 = threshold[i + 1];
        }
        // 1 for negative-to-positive crossovers
        if (data[i + 1] <= value2 && data[i] > value1) {
          return 1;
        }
        // -1 for positive-to-negative crossovers
        if (data[i + 1] >= value2 && data[i] < value1) {
          return -1;
        }
        // 0 for no crossover
        return 0;
      }).map(function (value, index) {
        return {
          index: index,
          value: value
        };
      }).filter(function (point) {
        return point.value !== 0;
      });
    },


    MA: {
      doubleCrossovers: function doubleCrossovers(_ref16) {
        var ma1 = _ref16.ma1,
            ma2 = _ref16.ma2;

        if (!Array.isArray(ma1)) {
          throw new TypeError('ma1 must be an array');
        }
        if (!Array.isArray(ma2)) {
          throw new TypeError('ma2 must be an array');
        }

        var ma1Temp = ma1.slice();
        var ma2Temp = ma2.slice();

        var minLen = Math.min(ma1.length, ma2.length);
        if (ma1.length > minLen) {
          ma1Temp = ma1Temp.slice(0, ma1.length - (ma1.length - minLen));
        }
        if (ma2.length > minLen) {
          ma2Temp = ma2Temp.slice(0, ma2.length - (ma2.length - minLen));
        }

        return ta.signals.crossovers({ data: ma1Temp, threshold: ma2Temp });
      }
    },

    BBANDS: {
      squeeze: function squeeze() {
        var _ref17 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            BandWidth = _ref17.BandWidth,
            _ref17$globalMinClose = _ref17.globalMinCloseness,
            globalMinCloseness = _ref17$globalMinClose === undefined ? 0.25 : _ref17$globalMinClose,
            _ref17$lowMovementTol = _ref17.lowMovementTolerance,
            lowMovementTolerance = _ref17$lowMovementTol === undefined ? 0.05 : _ref17$lowMovementTol;

        if (!Array.isArray(BandWidth)) {
          throw new TypeError('BandWidth must be an array');
        }
        if (typeof globalMinCloseness !== 'number') {
          throw new TypeError('globalMinCloseness must be a number');
        }
        if (typeof lowMovementTolerance !== 'number') {
          throw new TypeError('lowMovementTolerance must be a number');
        }

        var _ta$signals$extrema2 = ta.signals.extrema({ data: BandWidth }),
            minima = _ta$signals$extrema2.minima;

        var globalMin = Math.min.apply(Math, _toConsumableArray(minima.map(function (minimum) {
          return minimum.value;
        })));

        var squeezes = [];
        var isMeasuringSqueeze = false;
        var startIndex = void 0;
        for (var i = BandWidth.length - 1; i >= 0; i--) {
          var closeToGlobalMin = Math.abs(BandWidth[i] - globalMin) < globalMin * globalMinCloseness;
          if (isMeasuringSqueeze) {
            var hasLowMovement = Math.abs(BandWidth[i] - BandWidth[i + 1]) < BandWidth[i] * lowMovementTolerance;
            if (!hasLowMovement || !closeToGlobalMin) {
              squeezes.push({
                start: startIndex,
                end: i
              });
              isMeasuringSqueeze = false;
            }
          } else {
            if (closeToGlobalMin) {
              startIndex = i;
              isMeasuringSqueeze = true;
            }
          }
        }

        // TODO: THIS COULD STILL BE BROKEN
        squeezes.sort(function (a, b) {
          return b.start - a.start;
        });

        var mergedSqueezes = squeezes.filter(function (squeeze, index) {
          var next = squeezes[index + 1];
          if (!next) {
            return true;
          }
          if (next.start >= squeeze.end - 1) {
            next.start = squeeze.start;
            return false;
          }
          return true;
        });

        return mergedSqueezes.reverse();
      },
      extremeClosings: function extremeClosings() {
        var _ref18 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            close = _ref18.close,
            lowerBand = _ref18.lowerBand,
            upperBand = _ref18.upperBand,
            _ref18$autoSlice = _ref18.autoSlice,
            autoSlice = _ref18$autoSlice === undefined ? false : _ref18$autoSlice;

        if (!Array.isArray(close)) {
          throw new TypeError('close must be an array');
        }
        if (!Array.isArray(lowerBand)) {
          throw new TypeError('lowerBand must be an array');
        }
        if (!Array.isArray(upperBand)) {
          throw new TypeError('upperBand must be an array');
        }
        if (lowerBand.length !== upperBand.length) {
          throw new TypeError('lowerBand and upperBand must be the same length');
        }
        var closeTemp = close.slice();
        if (autoSlice === true) {
          closeTemp = close.slice(0, close.length - (close.length - lowerBand.length));
        }
        if (closeTemp.length !== lowerBand.length) {
          throw new TypeError('close, lowerBand, and upperBand must be the same length');
        }

        return close.map(function (value, index) {
          return {
            index: index,
            value: value
          };
        }).map(function (entry) {
          if (entry.value > upperBand[entry.index]) {
            return { index: entry.index, value: 1 };
          }
          if (entry.value < lowerBand[entry.index]) {
            return { index: entry.index, value: -1 };
          }
          return null;
        }).filter(function (entry) {
          return entry !== null;
        });
      }
    },

    MACD: {
      signalLineCrossover: function signalLineCrossover() {
        var _ref19 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            histogram = _ref19.histogram;

        if (!Array.isArray(histogram)) {
          throw new TypeError('histogram must be an array');
        }

        return ta.signals.crossovers({ data: histogram, threshold: 0 });
      },
      centerlineCrossover: function centerlineCrossover() {
        var _ref20 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            macd = _ref20.macd;

        if (!Array.isArray(macd)) {
          throw new TypeError('macd must be an array');
        }

        return ta.signals.crossovers({ data: macd, threshold: 0 });
      },
      divergences: function divergences() {
        var _ref21 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            macd = _ref21.macd;

        if (!Array.isArray(macd)) {
          throw new TypeError('macd must be an array');
        }

        var trendlines = ta.signals.trendlines({ data: macd });

        // Filter for increasing, negative lower trendlines
        trendlines.lower = trendlines.lower.filter(function (endpoints) {
          var increasing = (endpoints[1].value - endpoints[0].value) / (endpoints[0].index - endpoints[1].index) > 0;
          return increasing && endpoints[0].value < 0 && endpoints[1].value < 0;
        });

        // Filter for decreasing, positive upper trendlines
        trendlines.upper = trendlines.upper.filter(function (endpoints) {
          var decreasing = (endpoints[1].value - endpoints[0].value) / (endpoints[0].index - endpoints[1].index) < 0;
          return decreasing && endpoints[0].value > 0 && endpoints[1].value > 0;
        });

        return [].concat(trendlines.lower).concat(trendlines.upper).map(function (endpoints) {
          return {
            start: endpoints[1].index,
            end: endpoints[0].index,
            change: endpoints[0].value - endpoints[1].value
          };
        }).sort(function (a, b) {
          if (a.end < b.end) return -1;
          if (a.end > b.end) return 1;
          if (a.start < b.start) return -1;
          if (a.start > b.start) return 1;
          return 0;
        });
      }
    },

    KELT: {
      extremeClosings: function extremeClosings() {
        var _ref22 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            close = _ref22.close,
            lowerChannel = _ref22.lowerChannel,
            upperChannel = _ref22.upperChannel,
            _ref22$autoSlice = _ref22.autoSlice,
            autoSlice = _ref22$autoSlice === undefined ? false : _ref22$autoSlice;

        if (!Array.isArray(close)) {
          throw new TypeError('close must be an array');
        }
        if (!Array.isArray(lowerChannel)) {
          throw new TypeError('lowerChannel must be an array');
        }
        if (!Array.isArray(upperChannel)) {
          throw new TypeError('upperChannel must be an array');
        }
        if (lowerChannel.length !== upperChannel.length) {
          throw new TypeError('lowerChannel and upperChannel must be the same length');
        }
        var closeTemp = close.slice();
        if (autoSlice === true) {
          closeTemp = close.slice(0, close.length - (close.length - lowerChannel.length));
        }
        if (closeTemp.length !== lowerChannel.length) {
          throw new TypeError('close, lowerChannel, and upperChannel must be the same length');
        }

        return close.map(function (value, index) {
          return {
            index: index,
            value: value
          };
        }).map(function (entry) {
          if (entry.value > upperChannel[entry.index]) {
            return { index: entry.index, value: 1 };
          }
          if (entry.value < lowerChannel[entry.index]) {
            return { index: entry.index, value: -1 };
          }
          return null;
        }).filter(function (entry) {
          return entry !== null;
        });
      }
    },

    AROON: {
      emergingTrend: function emergingTrend() {
        var _ref23 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            up = _ref23.up,
            down = _ref23.down,
            _ref23$cross50Range = _ref23.cross50Range,
            cross50Range = _ref23$cross50Range === undefined ? 10 : _ref23$cross50Range,
            _ref23$reach100Range = _ref23.reach100Range,
            reach100Range = _ref23$reach100Range === undefined ? 5 : _ref23$reach100Range;

        if (!Array.isArray(up)) {
          throw new TypeError('up must be an array');
        }
        if (!Array.isArray(down)) {
          throw new TypeError('down must be an array');
        }
        if (typeof cross50Range !== 'number') {
          throw new TypeError('cross50Range must be a number');
        }
        if (typeof reach100Range !== 'number') {
          throw new TypeError('reach100Range must be a number');
        }

        // Stage 1: Aroon lines will cross
        var stageOneCrossovers = ta.signals.crossovers({ data: up, threshold: down });

        // Stage 2: Aroon lines will cross above/below 50
        var upCenterCrossovers = ta.signals.crossovers({ data: up, threshold: 50 });
        var downCenterCrossovers = ta.signals.crossovers({ data: down, threshold: 50 });
        var stageTwoCrossovers = stageOneCrossovers.filter(function (crossover) {
          var positiveCenterCrossExpected = void 0;
          var negativeCenterCrossExpected = void 0;
          if (crossover.value > 0) {
            positiveCenterCrossExpected = upCenterCrossovers;
            negativeCenterCrossExpected = downCenterCrossovers;
          }
          if (crossover.value < 0) {
            positiveCenterCrossExpected = downCenterCrossovers;
            negativeCenterCrossExpected = upCenterCrossovers;
          }
          return positiveCenterCrossExpected.some(function (centerCrossover) {
            return centerCrossover.value > 0 && Math.abs(centerCrossover.index - crossover.index) < cross50Range;
          }) && negativeCenterCrossExpected.some(function (centerCrossover) {
            return centerCrossover.value < 0 && Math.abs(centerCrossover.index - crossover.index) < cross50Range;
          });
        });

        // Stage 3: The trending Aroon line reaches 100
        var stageThreeCrossovers = stageTwoCrossovers.filter(function (crossover) {
          var lineToCheck = void 0;
          var reached100 = false;
          if (crossover.value > 0) {
            lineToCheck = up;
          }
          if (crossover.value < 0) {
            lineToCheck = down;
          }
          for (var i = crossover.index; i >= crossover.index - reach100Range; i--) {
            if (lineToCheck[i] === 100) {
              reached100 = true;
              break;
            }
          }
          return reached100;
        });

        return {
          stageOne: stageOneCrossovers,
          stageTwo: stageTwoCrossovers,
          stageThree: stageThreeCrossovers
        };
      }
    },

    RSI: {
      overbought: function overbought() {
        var _ref24 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            rsi = _ref24.rsi,
            _ref24$overboughtThre = _ref24.overboughtThreshold,
            overboughtThreshold = _ref24$overboughtThre === undefined ? 70 : _ref24$overboughtThre;

        if (!Array.isArray(rsi)) {
          throw new TypeError('rsi must be an array');
        }
        if (typeof overboughtThreshold !== 'number') {
          throw new TypeError('overboughtThreshold must be a number');
        }

        var overboughtCrossovers = ta.signals.crossovers({ data: rsi, threshold: overboughtThreshold }).reverse();

        // Account for the fact that RSI might start overbought
        if (rsi[rsi.length - 1] > overboughtThreshold) {
          overboughtCrossovers.splice(0, 0, { index: rsi.length - 1, value: 1 });
        }

        var overbought = [];
        for (var i = 0; i < overboughtCrossovers.length; i += 2) {
          overbought.push({
            start: overboughtCrossovers[i].index,
            end: overboughtCrossovers[i + 1] ? overboughtCrossovers[i + 1].index : 0
          });
        }

        return overbought.reverse();
      },
      oversold: function oversold() {
        var _ref25 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            rsi = _ref25.rsi,
            _ref25$oversoldThresh = _ref25.oversoldThreshold,
            oversoldThreshold = _ref25$oversoldThresh === undefined ? 30 : _ref25$oversoldThresh;

        if (!Array.isArray(rsi)) {
          throw new TypeError('rsi must be an array');
        }
        if (typeof oversoldThreshold !== 'number') {
          throw new TypeError('oversoldThreshold must be a number');
        }

        var oversoldCrossovers = ta.signals.crossovers({ data: rsi, threshold: oversoldThreshold }).reverse();

        // Account for the fact that RSI might start oversold
        if (rsi[rsi.length - 1] < oversoldThreshold) {
          oversoldCrossovers.splice(0, 0, { index: rsi.length - 1, value: -1 });
        }

        var oversold = [];
        for (var i = 0; i < oversoldCrossovers.length; i += 2) {
          oversold.push({
            start: oversoldCrossovers[i].index,
            end: oversoldCrossovers[i + 1] ? oversoldCrossovers[i + 1].index : 0
          });
        }

        return oversold.reverse();
      }
    }
  }
};

},{"ubique":14}]},{},[1]);
