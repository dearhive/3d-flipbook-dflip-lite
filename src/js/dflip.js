/* globals jQuery, pdfjsLib, THREE */
import {DEARVIEWER} from "./dearviewer/defaults.js";
import {utils} from "./dearviewer/utils/utils.js";
import "./dearviewer/viewers/viewers-lite.js";
import {PDFDocumentProvider} from "./dearviewer/utils/provider.js";
import {ImageDocumentProvider} from "./dearviewer/utils/image-provider.js";
import "./dearviewer/app.js";

let jQuery = DEARVIEWER.jQuery;
let DEARFLIP = window.DFLIP = window.DEARFLIP = DEARVIEWER;
DEARFLIP.defaults.viewerType = 'flipbook';

DEARFLIP.slug = 'dflip';
DEARFLIP.locationVar = 'dFlipLocation';
DEARFLIP.locationFile = "dflip";

//region old Constants
//These are depreciated , so do not use them anymore
DEARFLIP.PAGE_MODE = {SINGLE: 1, DOUBLE: 2, AUTO: null};
DEARFLIP.SINGLE_PAGE_MODE = {ZOOM: 1, BOOKLET: 2, AUTO: null};
DEARFLIP.CONTROLSPOSITION = {HIDDEN: 'hide', TOP: 'top', BOTTOM: 'bottom'};
DEARFLIP.DIRECTION = {LTR: 1, RTL: 2};
DEARFLIP.PAGE_SIZE = {AUTO: 0, SINGLE: 1, DOUBLEINTERNAL: 2};
//endregion

DEARFLIP.parseFallBack = function () {
  //region pre-parse fix for DFLIP
  jQuery('.df-posts').addClass("dflip-books");//backward-compatibity
  jQuery('.dflip-books').addClass("df-posts");//backward-compatibity

  jQuery('._df_button, ._df_thumb, ._df_book').each(function () {
    let app = jQuery(this);
    let isParsed = app.data("df-parsed");

    if (isParsed !== "true") {
      app.addClass("df-element");
      if (app.hasClass("_df_book")) {

      }
      else {
        if (app.hasClass("_df_thumb")) {
          app.attr("data-df-lightbox", "thumb");
          if (app.attr("thumb") !== void 0) {
            app.data("df-thumb", app.attr("thumb"));
          }
        }
        else{
          app.attr("data-df-lightbox", "button");
        }
      }

    }
  });
  //todo update this so that - this is also done in ajax calls, better use in getOptions fallback
  //endregion
}
DEARFLIP.parseBooks = function () {
  DEARFLIP.parseFallBack();
  DEARFLIP.parseElements();
}
let updateOptions = function (options) {

  if (options.source != null && (Array === options.source.constructor || Array.isArray(options.source) || options.source instanceof Array)) {
    options.providerType = "image";
  }
  //Replaced with cover3DType
  //options.has3DCover = utils.isTrue(options.has3DCover);
  if (options.cover3DType != null) {
    if (options.cover3DType == true || options.cover3DType == "true") {
      options.cover3DType = DEARFLIP.FLIPBOOK_COVER_TYPE.BASIC;
    }
    else if (options.cover3DType == false || options.cover3DType == "false") {
      options.cover3DType = DEARFLIP.FLIPBOOK_COVER_TYPE.NONE;
    }
  }

  //existing but modified
  if (options.pageSize !== void 0) {
    if (options.pageSize === "1" || options.pageSize === 1 || options.pageSize === DEARFLIP.FLIPBOOK_PAGE_SIZE.SINGLE) {
      options.pageSize = DEARFLIP.FLIPBOOK_PAGE_SIZE.SINGLE;
    }
    else if (options.pageSize === "2" || options.pageSize === 2 || options.pageSize === DEARFLIP.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL) {
      options.pageSize = DEARFLIP.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL;
    }
    else if (options.pageSize === DEARFLIP.FLIPBOOK_PAGE_SIZE.DOUBLE_COVER_BACK) {

    }
    else {
      options.pageSize = DEARFLIP.FLIPBOOK_PAGE_SIZE.AUTO;
    }
  }
  if (options.pageMode !== void 0) {
    if (options.pageMode === "1" || options.pageMode === 1 || options.pageMode === DEARFLIP.FLIPBOOK_PAGE_MODE.SINGLE) {
      options.pageMode = DEARFLIP.FLIPBOOK_PAGE_MODE.SINGLE;
    }
    else if (options.pageMode === "2" || options.pageMode === 2 || options.pageMode === DEARFLIP.FLIPBOOK_PAGE_MODE.DOUBLE) {
      options.pageMode = DEARFLIP.FLIPBOOK_PAGE_MODE.DOUBLE;
    }
    else {
      options.pageMode = DEARFLIP.FLIPBOOK_PAGE_MODE.AUTO;
    }
  }
  if (options.singlePageMode !== void 0) {
    if (options.singlePageMode === "1" || options.singlePageMode === 1 || options.singlePageMode === DEARFLIP.FLIPBOOK_SINGLE_PAGE_MODE.ZOOM) {
      options.singlePageMode = DEARFLIP.FLIPBOOK_SINGLE_PAGE_MODE.ZOOM;
    }
    else if (options.singlePageMode === "2" || options.singlePageMode === 2 || options.singlePageMode === DEARFLIP.FLIPBOOK_SINGLE_PAGE_MODE.BOOKLET) {
      options.singlePageMode = DEARFLIP.FLIPBOOK_SINGLE_PAGE_MODE.BOOKLET;
    }
    else {
      options.singlePageMode = DEARFLIP.FLIPBOOK_SINGLE_PAGE_MODE.AUTO;
    }
  }
  if (options.controlsPosition !== void 0) {
    if (options.controlsPosition === "hide") {
      options.controlsPosition = DEARFLIP.CONTROLS_POSITION.HIDDEN;
    }
  }
  if (options.overwritePDFOutline !== void 0) {
    options.overwritePDFOutline = utils.isTrue(options.overwritePDFOutline);
  }

  //replaced
  if (options.webgl !== void 0) {
    options.is3D = options.webgl = options.webgl;
    delete options.webgl;
  }
  if (options.webglShadow !== void 0) {
    options.has3DShadow = utils.isTrue(options.webglShadow);
    delete options.webglShadow;
  }
  if (options.scrollWheel !== void 0) {
    if (utils.isTrue(options.scrollWheel)) {
      options.mouseScrollAction = DEARFLIP.MOUSE_SCROLL_ACTIONS.ZOOM;
    }
    delete options.scrollWheel;
  }
  if (options.stiffness !== void 0) {
    delete options.stiffness;
  }
  if (options.soundEnable !== void 0) {
    options.enableSound = utils.isTrue(options.soundEnable);
    delete options.soundEnable;
  }
  if (options.enableDownload !== void 0) {
    options.showDownloadControl = utils.isTrue(options.enableDownload);
    delete options.enableDownload;
  }
  if (options.autoEnableOutline !== void 0) {
    options.autoOpenOutline = utils.isTrue(options.autoEnableOutline);
    delete options.autoEnableOutline;
  }
  if (options.autoEnableThumbnail !== void 0) {
    options.autoOpenThumbnail = utils.isTrue(options.autoEnableThumbnail);
    delete options.autoEnableThumbnail;
  }
  if (options.direction !== void 0) {
    if (options.direction === "2" || options.direction === 2 || options.direction === DEARFLIP.READ_DIRECTION.RTL) {
      options.readDirection = DEARFLIP.READ_DIRECTION.RTL;
    }
    else {
      options.readDirection = DEARFLIP.READ_DIRECTION.LTR;
    }
    delete options.direction;
  }
  if (options.hard !== void 0) {
    options.flipbookHardPages = options.hard;
    if (options.flipbookHardPages === "hard") {
      options.flipbookHardPages = "all";
    }
    delete options.hard;
  }

  //removed
  //forcefit is no longer required in DearFlip
  if (options.forceFit !== void 0) {
    delete options.forceFit;
  }

  return utils.sanitizeOptions(options);
};

//region jQuery Extension and Triggers
//jQuery Extension
jQuery.fn.extend({
  flipBook: function (source, options) {
    if (options == null)
      options = {};
    options.source = source;
    options.element = jQuery(this);
    return new DEARVIEWER.Application(options);
  },
});

//jQuery events
jQuery(document).ready(function () {
  //Lightbox Trigger
  let body = jQuery('body');
  DEARFLIP.executeCallback("beforeDearFlipInit");

  if (typeof window['dFlipWPGlobal'] !== 'undefined') {

    jQuery.extend(true, DEARFLIP.defaults, updateOptions(window['dFlipWPGlobal']));
  }

  DEARFLIP.initUtils();
  DEARFLIP.initControls();

  body.on('click', '.df-element[data-df-lightbox],.df-element[data-lightbox]', function (event) {

    let element = jQuery(this);
    event.preventDefault();
    event.stopPropagation();
    DEARFLIP.openLightBox(element);

  });

  DEARFLIP.checkBrowserURLforDefaults();

  DEARFLIP.parseCSSElements();

  DEARFLIP.parseFallBack();

  utils.detectHash();

  DEARFLIP.parseNormalElements();

  DEARFLIP.checkBrowserURLforPDF(true);

  DEARFLIP.executeCallback("afterDearFlipInit");

});

utils.finalizeOptions = function (options) {
  return updateOptions(options);
}

DEARFLIP.executeCallback("onDearFlipLoad");

export default DEARFLIP;
