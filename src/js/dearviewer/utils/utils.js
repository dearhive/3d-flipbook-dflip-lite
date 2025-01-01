/* globals requirejs, jQuery*/
import {DEARVIEWER} from "../defaults.js";

let DV = DEARVIEWER;
let jQuery = DEARVIEWER.jQuery;
/*VARIABLES*/
let has3d = 'WebKitCSSMatrix' in window
    || (document.body && 'MozPerspective' in document.body.style),
  hasMouse = 'onmousedown' in window;

let utils = DV.utils = {

  mouseEvents: (hasMouse)
    ? {type: "mouse", start: "mousedown", move: "mousemove", end: "mouseup"}
    : {type: "touch", start: "touchstart", move: "touchmove", end: "touchend"},

  html: {
    div: "<div></div>",
    a: "<a>",
    input: "<input type='text'/>",
    select: "<select></select>"
  },

  //functions or so
  getSharePrefix: function () {
    let prefixes = utils.getSharePrefixes();
    return prefixes[0];
  },

  /**
   *
   * @returns {array}
   */
  getSharePrefixes: function () {
    return (DV.defaults.sharePrefix + ',dflip-,flipbook-,dearflip-,dearpdf-').split(",").map(
      function (e) {return e.trim()}
    );
  },

  toRad: function (deg) {
    return deg * Math.PI / 180;
  },

  toDeg: function (rad) {
    return rad * 180 / Math.PI;
  },

  /**
   * Object Fallback when empty
   * @param {Object} checkVal Object to check if it's empty
   * @param {Object} ifEmpty Object to use if checkVal is empty
   * @returns {*}
   */
  ifdef: function (checkVal, ifEmpty = null) {
    if (checkVal === null || checkVal === void 0) {
      return ifEmpty;
    }
    return checkVal;
  },

  createBtn: function (name, icon, text) {

    // icon = options.icons[icon];
    // text = options.text[text];

    // noinspection CheckTagEmptyBody
    let btn = jQuery(utils.html.div, {
      class: "df-ui-btn df-ui-" + name,
      title: text,
      html: text !== void 0 ? '<span>' + text + '</span>' : ''
    });


    if (icon !== void 0 && icon.indexOf('<svg') > -1) {
      btn.html(icon.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" '));
    }
    else {
      btn.addClass(icon);
    }

    return btn;
  },

  transition: function (hasTransition, duration) {
    return hasTransition ? duration / 1000 + "s ease-out" : "0s none";
  },

  display: function (hasDisplay) {
    return hasDisplay ? "block" : "none";
  },

  resetTranslate: function () {
    return utils.translateStr(0, 0);
  },

  bgImage: function (src) {
    return (src == null || src === "blank" ? '' : ' url("' + src + '")');
  },

  translateStr: function (x, y) {
    return has3d ? ' translate3d(' + x + 'px,' + y + 'px, 0px) ' : ' translate(' + x + 'px, ' + y + 'px) ';
  },

  httpsCorrection: function (url) {
    try {
      if (url === null || url === void 0) return null;
      if (typeof url !== "string") return url;
      var location = window.location;
      if (location.href.split(".")[0] === url.split(".")[0]) return url;

      var urlHostName = url.split("://")[1].split("/")[0];
      var isSameDomain = urlHostName.replace("www.", "") === location.hostname.replace("www.", "");
      if (isSameDomain && url.indexOf(location.hostname.replace("www.", "")) > -1) {
        if (location.href.indexOf("https://") > -1) {
          url = url.replace("http://", "https://");
        }
        else if (location.href.indexOf("http://") > -1) {
          url = url.replace("https://", "http://");
        }

        //correct www and non www
        //match to www
        if (location.href.indexOf("://www.") > -1 && url.indexOf("://www.") === -1) {
          url = url.replace("://", "://www.");
        }
        //match to non www
        if (location.href.indexOf("://www.") === -1 && url.indexOf("://www.") > -1) {
          url = url.replace("://www.", "://");
        }
      }
    } catch (e) {
      console.log("Skipping URL correction: " + url)
    }
    return url;
  },

  rotateStr: function (deg) {
    return ' rotateZ(' + deg + 'deg) ';
  },

  lowerPowerOfTwo: function (value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
  },

  nearestPowerOfTwo: function (value, max) {
    return Math.min(max || 2048, Math.pow(2, Math.ceil(Math.log(value) / Math.LN2)));
  },

  getFullscreenElement: function () {
    //noinspection JSUnresolvedVariable
    return document.fullscreenElement
      || document.mozFullScreenElement
      || document.webkitFullscreenElement
      || document.msFullscreenElement;
  },

  hasFullscreenEnabled: function () {
    //noinspection JSUnresolvedVariable
    return document.fullscreenEnabled
      || document.mozFullScreenEnabled
      || document.webkitFullscreenEnabled
      || document.msFullscreenEnabled;
  },

  fixMouseEvent: function (event) {


    if (event) {
      let originalEvent = event.originalEvent || event;

      //noinspection JSUnresolvedVariable
      if (originalEvent.changedTouches && originalEvent.changedTouches.length > 0) {
        let _event = jQuery.event.fix(event);
        //noinspection JSUnresolvedVariable
        let touch = originalEvent.changedTouches[0];
        _event.clientX = touch.clientX;
        _event.clientY = touch.clientY;
        _event.pageX = touch.pageX;
        _event.touches = originalEvent.touches;
        _event.pageY = touch.pageY;
        _event.movementX = touch.movementX;
        _event.movementY = touch.movementY;
        return _event;
      }
      else {
        return event;
      }
    }
    else {
      return event;
    }

  },

  limitAt: function (x, min, max) {
    return x < min ? min : x > max ? max : x;
  },

  distOrigin: function (x, y) {
    return utils.distPoints(0, 0, x, y);
  },

  distPoints: function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  angleByDistance: function (distance, fullWidth) {
    let h = fullWidth / 2;
    let d = utils.limitAt(distance, 0, fullWidth);

    return d < h
      ? utils.toDeg(Math.asin(d / h))
      : 90 + utils.toDeg(Math.asin((d - h) / h));

  },

  calculateScale: function (startTouches, endTouches) {
    let startDistance = utils.distPoints(startTouches[0].x, startTouches[0].y, startTouches[1].x, startTouches[1].y),
      endDistance = utils.distPoints(endTouches[0].x, endTouches[0].y, endTouches[1].x, endTouches[1].y);
    return endDistance / startDistance;
  },
  /**
   * Calculates the average of multiple vectors (x, y values)
   */
  getVectorAvg: function (vectors) {
    return {
      x: vectors.map(function (v) {
        return v.x;
      }).reduce(utils.sum) / vectors.length,
      y: vectors.map(function (v) {
        return v.y;
      }).reduce(utils.sum) / vectors.length
    };
  },
  sum: function (a, b) {
    return a + b;
  },
  /**
   * Returns the touches of an event relative to the container offset
   * @param event
   * @param position
   * @return array touches
   */
  getTouches: function (event, position) {
    position = position || {left: 0, top: 0};
    return Array.prototype.slice.call(event.touches).map(function (touch) {
      return {
        x: touch.pageX - position.left,
        y: touch.pageY - position.top
      };
    });
  },
  getScriptCallbacks: [],
  getScript: function (source, callback, errorCallback, isModule) {
    let _callbacks = utils.getScriptCallbacks[source],
      script;

    function clean() {
      script.removeEventListener("load", load, false);
      script.removeEventListener("readystatechange", load, false);
      script.removeEventListener("complete", load, false);
      script.removeEventListener("error", onError, false);

      script.onload = script.onreadystatechange = null;

      script = null;
      script = null;
    }

    function load(_, isAbort) {
      if (script != null) { //IE 10 doesn't regard
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
          //console.log("aborted loading :" + source);
          if (!isAbort) {
            for (let i = 0; i < _callbacks.length; i++) {
              if (_callbacks[i]) _callbacks[i]();
              _callbacks[i] = null;
            }
            errorCallback = null;
          }
          clean();
        }
      }
    }

    function onError() {
      errorCallback();
      clean();
      errorCallback = null;
    }


    if (jQuery("script[src='" + source + "']").length === 0) {
      _callbacks = utils.getScriptCallbacks[source] = [];
      _callbacks.push(callback);
      script = document.createElement('script');
      let prior = document.body.getElementsByTagName('script')[0];
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      if (isModule === true) {
        script.setAttribute("type", "module");
      }
      if (prior != null) {
        prior.parentNode.insertBefore(script, prior);
        prior = null;
      }
      else { //sometimes if script are loaded in head and no scripts are present in body
        document.body.appendChild(script);
      }


      script.addEventListener("load", load, false);
      script.addEventListener("readystatechange", load, false);
      script.addEventListener("complete", load, false);

      if (errorCallback) {
        script.addEventListener("error", onError, false);
      }
      //Todo check if removing random(1) to random() has any effect
      script.src = source + (utils.prefix.dom === "MS" ? ("?" + Math.random()) : "");
    }
    else {
      _callbacks.push(callback);
    }
  },

  detectScriptLocation: function () {
    //Auto-detection if the folder structure is copied properly
    if (typeof window[DEARVIEWER.locationVar] == 'undefined') {
      jQuery("script").each(function () {
        let src = jQuery(this)[0].src;
        // noinspection HttpUrlsUsage
        if ((src.indexOf("/" + DEARVIEWER.locationFile + ".js") > -1 || src.indexOf("/" + DEARVIEWER.locationFile + ".min.js") > -1 || src.indexOf("js/" + DEARVIEWER.locationFile + ".") > -1)
          && (src.indexOf("https://") > -1 || src.indexOf("http://") > -1)) {
          let splits = src.split("/");
          window[DEARVIEWER.locationVar] = splits.slice(0, -2).join("/");
        }
      });
    }
    //if locationVar is relative, change it to absolute
    else if (window[DEARVIEWER.locationVar].indexOf(":") == -1) {
      let a = document.createElement("a");
      a.href = window[DEARVIEWER.locationVar];
      window[DEARVIEWER.locationVar] = a.href;
      a = null;
    }

    if (typeof window[DEARVIEWER.locationVar] !== 'undefined') {

      //add ending forward slash trail for safety
      if (window[DEARVIEWER.locationVar].length > 2 && window[DEARVIEWER.locationVar].slice(-1) !== "/") {
        window.window[DEARVIEWER.locationVar] += "/";
      }
    }

  },

  disposeObject(object) {
    if (object && object.dispose) {
      object.dispose();
    }
    object = null;
    return object;
  },

  log: function (...args) {
    if (DV.defaults.enableDebugLog === true && window.console)
      console.log(...args);
  },

  color: {
    getBrightness: function (hex) {
      let rgb = hex.replace("#", "").match(/.{1,2}/g).map(e => parseInt(e, 16));
      return (rgb[0] * .299 + rgb[1] * .587 + rgb[2] * .114);
    },
    isLight: function (hex) {
      return !utils.color.isDark(hex);
    },
    isDark: function (hex) {
      return utils.color.getBrightness(hex) < 128;
    }
  },
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

  isIOS: /(iPad|iPhone|iPod)/g.test(navigator.userAgent),
  isIPad: (function () {
    return navigator.platform === "iPad" ||
      (typeof navigator.maxTouchPoints !== "undefined" &&
        navigator.maxTouchPoints > 2 &&
        /Mac/.test(navigator.platform));
  })(),
  isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
  isSafari: (function () {
    // noinspection JSCheckFunctionSignatures
    return /constructor/i.test(window.HTMLElement) || (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || window['safari']['pushNotification']);
  })(),
  isIEUnsupported: !!navigator.userAgent.match(/(MSIE|Trident)/),
  isSafariWindows: function () {
    return !utils.isMac && utils.isSafari;
  },

  //self Execution
  hasWebgl: (function () {
    try {
      var canvas = document.createElement('canvas');
      //noinspection JSUnresolvedVariable
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  })(),
  hasES2022: (function () {
    return Array.prototype.at !== undefined
  })(),
  canSupport3D: function () {
    var canSupport = true;
    try {
      if (utils.hasWebgl == false) {
        canSupport = false;
        console.log("Proper Support for Canvas webgl 3D not detected!");
      }
      else if (utils.hasES2022 == false) {
        canSupport = false;
        console.log("Proper Support for 3D not extpected in older browser!");
      }
      else if (navigator.userAgent.indexOf('MSIE') !== -1
        || navigator.appVersion.indexOf('Trident/') > 0) {
        canSupport = false;
        console.log("Proper Support for 3D not detected for IE!");
      }
      else if (utils.isSafariWindows()) {
        canSupport = false;
        console.log("Proper Support for 3D not detected for Safari!");
      }
      else {
        var android = navigator.userAgent.toString().toLowerCase().match(/android\s([0-9\.]*)/i);
        android = android ? android[1] : undefined;
        if (android) {
          android = parseInt(android, 10);
          if (!isNaN(android) && android < 9) {
            canSupport = false;
            console.log("Proper Support for 3D not detected for Android below 9.0!")
          }
        }
      }
    } catch (error) {
    }
    return canSupport;
  },
  prefix: (function () {
    let styles = window.getComputedStyle(document.documentElement, ''),
      pre = (Array.prototype.slice
        .call(styles)
        .join('')
        .match(/-(moz|webkit|ms)-/))[1],
      dom = ('WebKit|Moz|MS').match(new RegExp('(' + pre + ')', 'i'))[1];
    return {
      dom: dom,
      lowercase: pre,
      css: '-' + pre + '-',
      js: pre[0].toUpperCase() + pre.substr(1)
    };
  })(),

  scrollIntoView: function (element, reference, align) {
    reference = reference || element.parentNode;
    reference.scrollTop = element.offsetTop +
      (align === false ? element.offsetHeight - reference.offsetHeight : 0);
    reference.scrollLeft = element.offsetLeft - reference.offsetLeft;
  },

  getVisibleElements: function (options) {
    let container = options.container;
    let elements = options.elements;
    let visible = options.visible || [];
    let top = container.scrollTop,
      bottom = top + container.clientHeight;
    if (bottom == 0) return visible;

    let minIndex = 0,
      maxIndex = elements.length - 1;
    let element = elements[minIndex];
    let elementBottom = element.offsetTop + element.clientTop + element.clientHeight;
    if (elementBottom < top) {//check first page
      while (minIndex < maxIndex) {
        let currentIndex = minIndex + maxIndex >> 1;
        element = elements[currentIndex];
        elementBottom = element.offsetTop + element.clientTop + element.clientHeight;

        if (elementBottom > top) {
          maxIndex = currentIndex;
        }
        else {
          minIndex = currentIndex + 1;
        }
      }
    }

    for (let i = minIndex; i < elements.length; i++) {
      element = elements[i];
      let elementTop = element.offsetTop + element.clientTop;
      if (elementTop <= bottom) {
        visible.push(i + 1);
      }
      else {
        break;
      }
    }
    return visible;
  },

  getMouseDelta(event) {
    let delta = 0;

    if (event['wheelDelta'] != null) { // WebKit / Opera / Explorer 9

      delta = event['wheelDelta'];

    }
    else if (event.detail != null) { // Firefox

      delta = -event.detail;

    }
    return delta;
  },

  pan(viewer, point, reset = false) {
    let origin = viewer.startPoint;
    let scale = viewer.app.zoomValue;

    let left = (viewer.left + (reset === true ? 0 : (point.raw.x - origin.raw.x))),
      top = (viewer.top + (reset === true ? 0 : (point.raw.y - origin.raw.y)));

    //round removes blur due to decimal value in transform.
    viewer.left = Math.ceil(utils.limitAt(left, -viewer.shiftWidth, viewer.shiftWidth));
    viewer.top = Math.ceil(utils.limitAt(top, -viewer.shiftHeight, viewer.shiftHeight));

    if (scale === 1) {
      viewer.left = 0;
      viewer.top = 0;
    }

    if (reset === false) {
      viewer.startPoint = point;
    }

    //requires updatePan to update in DOM
  }
};
utils.isChromeExtension = function () {
  return window.location.href.indexOf("chrome-extension://") === 0;
}
var NullCharactersRegExp = /\x00+/g;
var InvisibleCharactersRegExp = /[\x01-\x1F]/g;

utils.removeNullCharacters = function (str) {
  var replaceInvisible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (typeof str !== "string") {
    warn("The argument for removeNullCharacters must be a string.");
    return str;
  }

  if (replaceInvisible) {
    str = str.replace(InvisibleCharactersRegExp, " ");
  }

  return str.replace(NullCharactersRegExp, "");
}

DEARVIEWER.hashFocusBookFound = false;
utils.detectHash = function () {
  DEARVIEWER.preParseHash = window.location.hash;
  //parse hash and check if any exists

  /**
   * @type {boolean} - Introduced due to a user case where the same hash was detected twice and clicked twice.
   */

  let prefixes = utils.getSharePrefixes();
  if (prefixes.indexOf("") == -1)
    prefixes.push("");
  Array.prototype.forEach.call(prefixes, function (prefix) {
    let hash = DEARVIEWER.preParseHash;
    if (hash && hash.indexOf(prefix) >= 0 && DEARVIEWER.hashFocusBookFound === false) {
      if (prefix.length > 0) {
        hash = hash.split(prefix)[1];
      }
      let id = hash.split('/')[0].replace("#", "");
      if (id.length > 0) {
        let page = hash.split('/')[1];
        if (page != null) {
          page = page.split('/')[0];
        }
        let book;
        //first check for slug pattern
        book = jQuery("[data-df-slug=" + id + "]");
        //then check for old slug pattern
        if (book.length === 0) book = jQuery("[data-slug=" + id + "]");
        //then id pattern
        if (book.length === 0) book = jQuery('#df-' + id + ",#" + id);
        //then _slug pattern
        if (book.length === 0) book = jQuery("[data-_slug=" + id + "]");

        if (book.length > 0 && book.is("._df_thumb,._df_button,._df_custom,._df_link,._df_book,.df-element,.dp-element")) {
          book = jQuery(book[0]);
          DEARVIEWER.hashFocusBookFound = true;

          page = parseInt(page, 10);

          utils.focusHash(book);

          //case : flipbook is already created, in-page links are clicked, thus link moves the page
          let app = (DEARVIEWER.activeLightBox && DEARVIEWER.activeLightBox.app) || book.data("df-app");
          if (app != null) {
            app.gotoPage(page);
            app.hashNavigationEnabled = true;
            utils.focusHash(app.element);
            return false;
          }
          else if (page != null) {
            book.attr("data-hash-page", page);  //data-has-page shall be removed after it is used
            //data added attribues cannot be searched or fetched using selectors annd attr()
            //when shortcode specifies page 1, but url says page 5, page 1 is added using attr data-df-page
          }

          book.addClass("df-hash-focused", true);

          if (book.data('lightbox') != null || book.data('df-lightbox') != null) {
            book.trigger("click");
          }
          else if (book.attr("href") != null && book.attr("href").indexOf(".pdf") > -1) {
            book.trigger("click");
          }
        }
      }
    }
  });
};

utils.focusHash = function (element) {
  element[0].scrollIntoView?.({behavior: "smooth", block: "nearest", inline: "nearest"});
}

/**
 * Conserve aspect ratio of the original region. Useful when shrinking/enlarging
 * images to fit into a certain area.
 *
 * @param {Number} srcWidth width of source image
 * @param {Number} srcHeight height of source image
 * @param {Number} maxWidth maximum available width
 * @param {Number} maxHeight maximum available height
 * @return {Object} { width, height }
 */
utils.contain = function (srcWidth, srcHeight, maxWidth, maxHeight) {

  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

  return {width: srcWidth * ratio, height: srcHeight * ratio};
}
utils.containUnStretched = function (srcWidth, srcHeight, maxWidth, maxHeight) {

  var ratio = Math.min(1, maxWidth / srcWidth, maxHeight / srcHeight);

  return {width: srcWidth * ratio, height: srcHeight * ratio};
}

utils.fallbackOptions = function (options) {

  //todo this could work without fallback
  if (options.share['mail'] === undefined) {
    options.share['mail'] = 'mailto:?subject=' + options.text.mailSubject + '&body=' + options.text.mailBody;
  }
  if (options.openPage) {
    options.openPage = parseInt(options.openPage, 10);
  }
  return options;

};

let getAttributes = function (element) {

  let attrOptions = {};

  let attrKeys = {
    'id': '',
    'thumb': '',
    'openPage': 'data-hash-page,df-page,data-df-page,data-page,page',
    'target': '',
    'height': '',
    'showDownloadControl':'data-download',
    'source': 'pdf-source,df-source,source',
    'is3D': 'webgl,is3d',
    'viewerType': 'viewertype,viewer-type',
    'pagemode': ''
  };

  for (let key in attrKeys) {
    let aliases = (key + "," + attrKeys[key]).split(",");
    for (let i = 0; i < aliases.length; i++) {
      let alias = aliases[i];
      if (alias !== '') {
        let val = element.data(alias);
        if (val !== null && val !== "" && val !== void 0) {
          attrOptions[key] = val;
          break;
        }
        val = element.attr(alias);
        if (val !== null && val !== "" && val !== void 0) {
          attrOptions[key] = val;
          break;
        }
      }
    }
  }

  //clear temporary attributes
  element.removeAttr('data-hash-page');

  return attrOptions;
};

//getOptions of a specific book in DOM and merge with respective variable
utils.getOptions = function (element) {

  element = jQuery(element);

  if (element.data("df-option") == void 0 & element.data("option") == void 0) {
    element.data("df-option", "option_" + element.attr("id"));
  }
  if (element.attr("source") !== void 0) {
    element.data("df-source", element.attr("source"));
  }

  //GetOption Variable
  let optionVar = element.data("df-option") || element.data("option");
  let options = void 0;
  if (typeof optionVar === "object") {
    options = optionVar;
  }
  else {
    options = (optionVar == null || optionVar === "" || window[optionVar] == null)
      ? {}
      : window[optionVar];
  }
  //get all options defined in attributes
  let attrOptions = getAttributes(element);

  //merge options, attribute options override variable options
  options = jQuery.extend(true, {}, options, attrOptions);

  return options;

};

utils.isTrue = function (val) {
  return val === "true" || val === true;
};
utils.parseInt = function (option) {
  return parseInt(option, 10);
}
utils.parseFloat = function (option) {
  return parseFloat(option);
}
utils.parseIntIfExists = function (option) {
  if (option !== void 0) {
    option = parseInt(option, 10);
  }
  return option;
}
utils.parseFloatIfExists = function (option) {
  if (option !== void 0) {
    option = parseFloat(option);
  }
  return option;
}
utils.parseBoolIfExists = function (option) {
  if (option !== void 0) {
    option = utils.isTrue(option);
  }
  return option;
}

utils.getCurveAngle = function(isRight,angle,threshold = 0){
  var cangle;
  if(isRight){if(angle>135)
    cangle = 180 - (180-angle) * 2;
  else if(angle > 45 )
    cangle = angle - 45;
  else
    cangle = 0;
    cangle=utils.limitAt(cangle,threshold,180);
  }else{
    if(angle<45)
      cangle = angle * 2;
    else if(angle < 135 )
      cangle = angle + 45;
    else
      cangle = 180;
    cangle=utils.limitAt(cangle,0,180-threshold);
  }
  return cangle;
}
utils.sanitizeOptions = function (options) {


  options.showDownloadControl = utils.parseBoolIfExists(options.showDownloadControl);
  options.showSearchControl = utils.parseBoolIfExists(options.showSearchControl);
  options.showPrintControl = utils.parseBoolIfExists(options.showPrintControl);

  options.flipbook3DTiltAngleLeft = utils.parseIntIfExists(options.flipbook3DTiltAngleLeft);
  options.flipbook3DTiltAngleUp = utils.parseIntIfExists(options.flipbook3DTiltAngleUp);
  options.paddingLeft = utils.parseIntIfExists(options.paddingLeft);
  options.paddingRight = utils.parseIntIfExists(options.paddingRight);
  options.paddingTop = utils.parseIntIfExists(options.paddingTop);
  options.paddingBottom = utils.parseIntIfExists(options.paddingBottom);
  options.duration = utils.parseIntIfExists(options.duration);
  options.rangeChunkSize = utils.parseIntIfExists(options.rangeChunkSize);
  options.maxTextureSize = utils.parseIntIfExists(options.maxTextureSize);
  options.linkTarget = utils.parseIntIfExists(options.linkTarget);
  options.zoomRatio = utils.parseFloatIfExists(options.zoomRatio);

  // options.is3D = utils.parseBoolIfExists(options.is3D); //is3D is not a boolean
  options.enableAnalytics = utils.parseBoolIfExists(options.enableAnalytics);
  options.autoPlay = utils.parseBoolIfExists(options.autoPlay);
  options.autoPlayStart = utils.parseBoolIfExists(options.autoPlayStart);
  options.autoPlayDuration = utils.parseIntIfExists(options.autoPlayDuration);

  if (options.loadMoreCount !== void 0) {
    options.loadMoreCount = utils.parseInt(options.loadMoreCount);
    if (isNaN(options.loadMoreCount) || options.loadMoreCount === 0)
      options.loadMoreCount = -1;
  }
  if (options.source != null && (Array === options.source.constructor || Array.isArray(options.source) || options.source instanceof Array)) {
    for (var _correct = 0; _correct < options.source.length; _correct++) {
      options.source[_correct] = utils.httpsCorrection(options.source[_correct]);
    }
  }
  else {
    options.source = utils.httpsCorrection(options.source);
  }
  return options;
}

utils.finalizeOptions = function (options) {
  return options;
}
//Possible improvements: https://www.npmjs.com/package/linkifyjs
utils.urlify = function (text) {
  let myRegexp = /[a-zA-Z0-9][^\s,]{3,}\.[^\s,]+[a-zA-Z0-9]/gi;
  let result, urlLowCase, hits = [];
  while (result = myRegexp.exec(text)) {
    let url = result[0];
    if ((url.match(/@/g) || []).length == 1) { //@ match has to be exactly 1, two occurances creates infinite loop in below regex https://github.com/deepak-ghimire/dearviewer/issues/524
      if (url.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,7})+/gi)) {//cannot have $ end of string. take what matches https://github.com/deepak-ghimire/dearviewer/issues/546
        hits.push({index: result.index, length: url.length, text: url});
      }
    }
    else if (url.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*/g)) {
      urlLowCase = url.toLowerCase();
      if (urlLowCase.indexOf('http:') === 0 || urlLowCase.indexOf('https:') === 0 || urlLowCase.indexOf('www.') === 0) {
        hits.push({index: result.index, length: url.length, text: url});
      }
    }
  }
  return hits;
  //can have multiple match in a text
  return text.replace(myRegexp, function (url, a, b) {
    if (url.indexOf("@") > -1) {
      //this is a mail just verify if valid
      if (url.match(/^((?!\.)[\w_.-]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/gi)) {
        var url2 = url.toLowerCase();
        if (url.indexOf("mailto:" === -1)) url2 = "mailto:" + url;
        utils.log("AutoLink: " + url2 + " for " + url);
        return '<a href="' + url2 + '" ' +
          'class="df-autolink" target="_blank">' + url + '</a>';
      }
    }
    else {
      //this is a domain like just verify if valid
      if (url.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&//=]*/g)) {
        var url2 = url;
        if (url.indexOf('www.') === 0) {
          url2 = 'http://' + url;
        }
        else if (url2.indexOf('http:') === -1 && url2.indexOf('https:') === -1) {
          return url;
        }
        utils.log("AutoLink: " + url2 + " for " + url);
        return '<a href="' + url2 + '" class="df-autolink" target="_blank">' + url + '</a>';
      }
    }
    return url;
  });
}
;

utils.oldurlify = function (text) {

  //https://regex101.com/r/cX0pJ8/1
  var urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/g;
  // urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  // noinspection HttpUrlsUsage
  return text.replace(urlRegex, function (url, b, c, d, e) {
    url = url.toLowerCase();
    var url2 = url;
    if (url.indexOf(':') > 0 && url.indexOf('http:') === -1 && url.indexOf('https:') === -1) {
      utils.log("AutoLink Rejected: " + url2 + " for " + url);
      return url;
    }
    else if (url.indexOf('www.') === 0) {
      url2 = 'http://' + url;
    }
    else if ((url.indexOf('http://') === 0) || (url.indexOf('https://') === 0)) {

    }
    else if (url.indexOf('mailto:') === 0) {

    }
    else if (url.indexOf('@') > 0) {
      url2 = 'mailto:' + url;
      var mailformat = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
      if (url.match(mailformat) === null) {
        utils.log("AutoLink Rejected: " + url2 + " for " + url);
        return url;
      }
    }
    utils.log("AutoLink: " + url2 + " for " + url);
    return '<a href="' + url2 + '" class="df-autolink" target="_blank">' + url + '</a>';
  })

}

// Test via a getter in the options object to see if the passive property is accessed
utils.supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function () {
      utils.supportsPassive = true;
    }
  });
  window.addEventListener("testPassive", null, opts);
  window.removeEventListener("testPassive", null, opts);
} catch (e) {}

function getDataFromClass(el, prefix = "dvcss_e_") {

  let classList = el.classList, className;

  for (let i = 0; i < classList.length; i++) {
    className = classList[i];
    if (className.indexOf(prefix) === 0) return className;
  }

  return null;

}

DEARVIEWER.parseCSSElements = function () {
  jQuery(".dvcss").each(function () {
    let el = jQuery(this);
    let cssData = getDataFromClass(el[0]);
    el.removeClass(cssData).removeClass("dvcss");
    cssData = cssData.replace("dvcss_e_", "");

    let data;
    try {
      data = JSON.parse(atob(cssData));
    } catch (e) {}
    if (data) {
      let option_id = "df_option_" + data.id;
      window[option_id] = jQuery.extend(
        true,
        {},
        window[option_id],
        data);
      el.addClass("df-element");
      if (data.lightbox !== "none") {
        el.attr("data-df-lightbox", data.lightbox === void 0 ? "custom" : data.lightbox);
        if (data.lightbox == "thumb")
          el.attr("data-df-thumb", data.pdfThumb);
        if (data.thumbLayout)
          el.attr("data-df-thumb-layout", data.thumbLayout);
        if (data.apl)
          el.attr("apl", data.apl);
      }
      el.data("df-option", option_id);
      //attr is required, data("slug") cannot be used in selector
      el.attr("data-df-slug", data.slug);
      el.attr("id", "df_" + data.id);
    }
  });
}

DEARVIEWER.parseThumbs = function (args) {

  args.element.html("");

  if (args.thumbURL == null || args.thumbURL.toString().trim() == '') {
    args.element.addClass("df-thumb-not-found");
    args.thumbURL = DEARVIEWER.defaults.popupThumbPlaceholder;
  }

  let titleElement = jQuery("<span class='df-book-title'>").html(args.title);
  let wrapperElement = jQuery("<div class='df-book-wrapper'>").appendTo(args.element);
  wrapperElement.append(jQuery("<div class='df-book-page1'>"));
  wrapperElement.append(jQuery("<div class='df-book-page2'>"));
  let coverElement = jQuery("<div class='df-book-cover'>").append(titleElement).appendTo(wrapperElement);

  let image = jQuery('<img width="210px" height="297px" class="df-lazy" alt="' + args.title + '"/>');
  image.attr('data-src', args.thumbURL);
  image.attr('src', DEARVIEWER.defaults.popupThumbPlaceholder);
  coverElement.prepend(image);
  DEARVIEWER.addLazyElement(image[0]);

  if (DEARVIEWER.defaults.displayLightboxPlayIcon === true)
    coverElement.addClass("df-icon-play-popup");
  if (args.thumbLayout === "book-title-top"){
    titleElement.prependTo(args.element);
  }
  else if (args.thumbLayout === "book-title-bottom" || args.thumbLayout === "cover-title") {
    if (args.hasShelf) {
      args.thumbLayout = "book-title-fixed";
    }
    else {
      titleElement.appendTo(args.element);
    }
    if (DEARVIEWER.defaults.displayLightboxPlayIcon === true) {
      args.element.removeClass("df-icon-play-popup");
      wrapperElement.addClass("df-icon-play-popup");
    }
  }
  args.element.addClass("df-tl-" + args.thumbLayout);
  args.element.attr("title", args.title);
}

DEARVIEWER.initId = 10;
DEARVIEWER.embeds = [];
DEARVIEWER.activeEmbeds = [];
DEARVIEWER.removeEmbeds = [];
DEARVIEWER.removeEmbedsLimit = (utils.isMobile ? 1 : 2);

DEARVIEWER.parseNormalElements = function () {

  jQuery('.df-posts').each(function () {
    if (DEARVIEWER.defaults.loadMoreCount === false || DEARVIEWER.defaults.loadMoreCount === -1) return;

    var postsWrapper = jQuery(this);
    var parsed = postsWrapper.data("df-parsed");

    //skip if already parsed or failed
    if (parsed !== "true") {
      postsWrapper.data("df-parsed", "true");
      postsWrapper.attr("df-parsed", "true"); //backward-compatibility - issue #374 https://github.com/deepak-ghimire/dearviewer/issues/374

      var count = 0;
      var books = postsWrapper.find('.df-element');

      var totalBooks = books.length;
      books.each(function () {
        //skip first n books
        count++;
        if (count > DEARVIEWER.defaults.loadMoreCount)
          jQuery(this).attr("skip-parse", "true");

      })
      if (totalBooks > DEARVIEWER.defaults.loadMoreCount) {
        postsWrapper.append("<div class='df-load-more-button-wrapper'><div class='df-load-more-button'>Load More..</div></div>");
      }
    }

  });

  DEARVIEWER.triggerId = 10;
  jQuery('.df-element').each(function () {
    let element = jQuery(this);
    if (element.attr("skip-parse") === "true") return;

    let isParsed = element.data("df-parsed");

    if (isParsed !== "true") {
      element.data("df-parsed", "true");
      element.attr("df-parsed", "true"); //backward-compatibility

      let lightboxType = element.data("df-lightbox") || element.data("lightbox");
      if (lightboxType === void 0) {
        element.addClass("df-lazy-embed");
        DEARVIEWER.addLazyElement(element[0]);
        //element.dearviewer();
      }
      else {
        element.addClass("df-popup-" + lightboxType);
        if (lightboxType === "thumb") {

          let thumbLayout = element.data("df-thumb-layout") || DEARVIEWER.defaults.thumbLayout;
          let thumbURL = utils.httpsCorrection(element.data("df-thumb"));
          element.removeAttr("data-thumb").removeAttr("data-thumb-layout");
          let innerText = element.html().trim();
          if (innerText === undefined || innerText === "") {
            innerText = "Click to Open";
          }
          let hasShelf = element.parent().hasClass('df-has-shelf');

          DEARVIEWER.parseThumbs({
            element: element,
            thumbURL: thumbURL,
            title: innerText,
            thumbLayout: thumbLayout,
            hasShelf: hasShelf,
          });

          if (hasShelf)
            element.after(jQuery("<df-post-shelf>"));
        }
        else if (lightboxType === "button") {
          if (DEARVIEWER.defaults.buttonClass) {
            element.addClass(DEARVIEWER.defaults.buttonClass);
          }
        }
      }

      let triggers = element.attr("data-trigger");
      if (triggers != null && triggers.length > 1) {
        triggers = triggers.split(",");
        DEARVIEWER.triggerId++;
        triggers.forEach(function (trigger) {
          element.attr("df-trigger-id", DEARVIEWER.triggerId);
          jQuery("#" + trigger).addClass("df-trigger").attr("df-trigger", DEARVIEWER.triggerId);
        });

      }

    }
  });

  DEARVIEWER.handleLazy = function () {
    //remove removeembeds
    let appId;

    if (DEARVIEWER.removeEmbeds.length > DEARVIEWER.removeEmbedsLimit) {
      appId = DEARVIEWER.removeEmbeds.shift();

      if (appId) {
        let element = jQuery("[initID='" + appId + "']");
        if (element.length > 0) {
          let app = element.data("df-app");
          if (app) {
            element.attr("data-df-page", app.currentPageNumber);
            utils.log("Removed app id " + appId);
            app.dispose();
            app = null;
            var _ind = DEARVIEWER.activeEmbeds.indexOf(appId);
            if( _ind> -1){
              DEARVIEWER.activeEmbeds.splice(_ind,1);
            }
          }
        }
      }
    }
    //add embeds
    appId = DEARVIEWER.embeds.shift();
    if (appId) {
      let element = jQuery("[initID='" + appId + "']");
      if (element.length > 0) {
        if (element.is("img")) {
          if (element.hasClass("df-lazy")) {
            element.attr("src", element.attr("data-src"));
            element.removeAttr("data-src");
            element.removeClass("df-lazy");
            DEARVIEWER.lazyObserver.unobserve(element[0]);
            DEARVIEWER.handleLazy();
          }
          else {
            utils.log("Prevent this");
            DEARVIEWER.handleLazy();
          }
        }
        else {
          let app = element.data("df-app");
          if (app == null) {
            element.dearviewer();
          }
          else {
            app.softInit();
          }
          utils.log("Created app id " + appId);
          DEARVIEWER.activeEmbeds.push(appId);
        }
      }
    }

    if (DEARVIEWER.removeEmbeds.length <= DEARVIEWER.removeEmbedsLimit && DEARVIEWER.embeds.length == 0) {
      DEARVIEWER.checkRequestQueue = null;
    }
  };

}

/** Then we set up an intersection observer watching over those images and whenever any of those becomes visible on the view then replace the placeholder image with actual one, remove the non-loaded class and then unobserve for that element **/
DEARVIEWER.lazyObserver = {
  observe: function (element) {
    element = jQuery(element);
    if (element.is("img")) {
      if (element.hasClass("df-lazy")) {
        element.attr("src", element.attr("data-src"));
        element.removeAttr("data-src");
        element.removeClass("df-lazy");
      }
    }
    else {
      element.dearviewer();
    }
  }
};

if (typeof IntersectionObserver === 'function') {
  DEARVIEWER.lazyObserver = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {

      var lazyImage = jQuery(entry.target);

      let initId = lazyImage.attr("initID"), index;
      if (entry.isIntersecting) {
        if (!lazyImage.attr("initID")) {
          lazyImage.attr("initID", DEARVIEWER.initId);
          initId = DEARVIEWER.initId.toString();
          DEARVIEWER.initId++;
        }
        index = DEARVIEWER.removeEmbeds.indexOf(initId);
        if (index > -1) { // only splice array when item is found
          DEARVIEWER.removeEmbeds.splice(index, 1); // 2nd parameter means remove one item only
          utils.log("Removed id " + initId + "from Removal list");
        }
        else {
          index = DEARVIEWER.embeds.indexOf(initId);
          if (index == -1) {
            DEARVIEWER.embeds.push(initId);
            utils.log("Added id " + initId + "to Add list");
          }
        }
      }
      else {

        if (initId) {
          index = DEARVIEWER.embeds.indexOf(initId);
          if (index > -1) { // only splice array when item is found
            DEARVIEWER.embeds.splice(index, 1); // 2nd parameter means remove one item only
            utils.log("Removed id " + initId + " from Add list");
          }
          else {
            index = DEARVIEWER.removeEmbeds.indexOf(initId);
            if (index == -1) {
              DEARVIEWER.removeEmbeds.push(initId);
              utils.log("Added id " + initId + " to Removal list");
            }
          }
        }
      }
      requestCount = 0;

      if ((DEARVIEWER.removeEmbeds.length > DEARVIEWER.removeEmbedsLimit || DEARVIEWER.embeds.length > 0) && DEARVIEWER.checkRequestQueue == null) {
        //start the requestQueue
        DEARVIEWER.checkRequestQueue = function () {
          requestCount++;
          if (DEARVIEWER.checkRequestQueue) {
            requestAnimationFrame(function () {
              if (DEARVIEWER && DEARVIEWER.checkRequestQueue)
                DEARVIEWER.checkRequestQueue();
            });
          }
          if (requestCount > 20) {
            requestCount = 0;
            DEARVIEWER.handleLazy();
          }
        }
        DEARVIEWER.checkRequestQueue();
      }

    });
  });
}
let requestCount = 0;
DEARVIEWER.addLazyElement = function (element) {
  DEARVIEWER.lazyObserver.observe(element);
};

//scan the whole document for un-parsed PDFs and convert them to viewer and flipbooks
DEARVIEWER.parseElements = utils.parseElements = function () {

  DEARVIEWER.parseCSSElements();
  DEARVIEWER.parseNormalElements();

};
//jQuery events
DEARVIEWER.initUtils = function () {

  utils.detectScriptLocation();

  let body = jQuery('body');

  //assign webkit so that thumbs and other functions can be optimized
  if (utils.isSafari || utils.isIOS) {
    body.addClass("df-ios");
  }

  body.on('click', function () {

  });

  body.on('click', '.df-posts .df-load-more-button', function () {
    var postsWrapper = jQuery(this).closest(".df-posts");
    if (postsWrapper.length > 0) {
      var count = 0;
      var posts = postsWrapper.find('.df-element');
      posts.each(function () {
        var post = jQuery(this);
        if (post.attr("skip-parse") === "true") {
          //skip first 10
          if (count < DEARVIEWER.defaults.loadMoreCount)
            post.removeAttr("skip-parse");

          count++;
        }
      });
      DEARVIEWER.parseNormalElements();
    }
  });
  if (DEARVIEWER.defaults.shelfImage && DEARVIEWER.defaults.shelfImage != '') {
    body.append("<style>.df-has-shelf df-post-shelf:before, .df-has-shelf df-post-shelf:after{background-image: url('" + DEARVIEWER.defaults.shelfImage + "');}</style>");
  }

};

export
{
  utils
};
