/* globals pdfjsLib,THREE  */
import {DEARVIEWER} from "./defaults.js";
import "./utils/tween.js";
import {UI, Sidemenu, ThumbList, BookMarkViewer} from "./utils/controls.js";

let DV = DEARVIEWER;
let jQuery = DEARVIEWER.jQuery;
let REQUEST_STATUS = DEARVIEWER.REQUEST_STATUS,
  utils = DEARVIEWER.utils;

class App {

  constructor(options) {

    this.options = options;

    this.viewerType = this.options.viewerType;
    this.startPage = 1;
    this.endPage = 1;
    this.element = jQuery(this.options.element);

    options.maxTextureSize = options.maxTextureSize ?? 2048;
    if (utils.isMobile) {
      options.maxTextureSize = options.maxTextureSize === 4096 ? 3200
        : options.maxTextureSize;
    }

    this.dimensions = {
      padding: {},
      offset: {},
      pageFit: {},
      stage: {},
      isAutoHeight: options.height === "auto",
      maxTextureSize: options.maxTextureSize
    };
    this.is3D = options.is3D;
    this.options.pixelRatio = utils.limitAt(this.options.pixelRatio, 1, this.options.maxDPI);
    this.options.fakeZoom = this.options.fakeZoom ?? 1;

    this.events = {};
    this.links = options.links;

    this.thumbSize = 128;
    this.pendingZoom = true;

    this.currentPageNumber = this.options.openPage || this.startPage;
    this.hashNavigationEnabled = this.options.hashNavigationEnabled === true;

    this.pendingZoom = true;
    this.zoomValue = 1;
    this.pageScaling = DEARVIEWER.PAGE_SCALE.MANUAL;
    this.isRTL = options.readDirection === DEARVIEWER.READ_DIRECTION.RTL;
    this.jumpStep = 1;

    this.resizeRequestStatus = REQUEST_STATUS.OFF;
    this.refreshRequestStatus = REQUEST_STATUS.OFF;

    this.refreshRequestCount = 0;
    this.resizeRequestCount = 0;

    this.fullscreenSupported = utils.hasFullscreenEnabled();
    this.thumbRequestCount = 0;

    this.isExternalReady = this.options.isExternalReady ?? true; //used when external document viewer or logic needs to wait
    this.init();

    if (this.options.autoLightBoxFullscreen === true && this.options.isLightBox === true)
      this.switchFullscreen(); //doesn't work properly https://github.com/deepak-ghimire/dearviewer/issues/332

    this.executeCallback('onCreate');
    this.target = this;
  }

  init() {
    let options = this.options,
      app = this;
    app.initDOM();
    app.initResourcesLocation();
    app.initInfo();

    //region Source Validation
    if ((options.source == null || options.source.length === 0) && options.pdfParameters == null) {
      app.updateInfo("ERROR: Set a Valid Document Source.", DEARVIEWER.INFO_TYPE.ERROR);
      app.container.removeClass('df-loading').addClass("df-error");
      return;
    }
    //endregion

    //region Old Browsers
    if (utils.isIEUnsupported) {
      app.updateInfo("Your browser (Internet Explorer) is out of date! <br><a href='https://browsehappy.com/'>Upgrade to a new browser.</a>", "df-old-browser");
      app.container.removeClass('df-loading').addClass("df-error");
      return;
    }
    //endregion

    app.commentPopup = jQuery('<div class="df-comment-popup">').appendTo(app.container);
    app.viewer = new app.viewerType(options, this);

    app.sideMenu = new Sidemenu({
      parentElement: this.container
    }, app);

    app.provider = new DEARVIEWER.providers[options.providerType](options, app);
    app.state = 'loading';
    app.checkRequestQueue();
  }

  initDOM() {

    this.element.addClass("df-app").removeClass("df-container df-loading");
    this.container = jQuery("<div>").appendTo(this.element);
    // Q. Why are this.element and this.container defined separately?
    // A. In IOS when fullscreen is used, then the whole this.container can be transferred to the pseudo fullscreen container that stays at the last of the DOM.

    this.container.addClass('df-container df-loading df-init'
      + " df-controls-" + this.options.controlsPosition
      + (this.options.controlsFloating === true ? " df-float" : " df-float-off")
      + (this.options.backgroundColor === 'transparent' ? " df-transparent" : "")
      + (this.isRTL === true ? " df-rtl" : "")
      + ((utils.isIOS === true || utils.isIPad === true) ? " df-ios" : "")
    );
    this._offsetParent = this.container[0].offsetParent;

    this.backGround = jQuery("<div class='df-bg'>").appendTo(this.container)
      .css({
        "backgroundColor": this.options.backgroundColor,
        "backgroundImage": this.options.backgroundImage ? "url('" + this.options.backgroundImage + "')" : ''
      });

    this.viewerContainer = jQuery("<div>").appendTo(this.container);
    this.viewerContainer.addClass('df-viewer-container');

  }

  /**
   * Prepares Resource location based on the window[DEARVIEWER.locationVar]
   */
  initResourcesLocation() {
    let options = this.options;
    if (typeof window[DEARVIEWER.locationVar] !== 'undefined') {
      options.pdfjsSrc = window[DEARVIEWER.locationVar] + "js/libs/pdf.min.js";
      options.threejsSrc = window[DEARVIEWER.locationVar] + "js/libs/three.min.js";
      options.pdfjsWorkerSrc = window[DEARVIEWER.locationVar] + "js/libs/pdf.worker.min.js";
      options.soundFile = window[DEARVIEWER.locationVar] + options.soundFile;
      options.imagesLocation = window[DEARVIEWER.locationVar] + options.imagesLocation;
      options.imageResourcesPath = window[DEARVIEWER.locationVar] + options.imageResourcesPath;
      options.cMapUrl = window[DEARVIEWER.locationVar] + options.cMapUrl;
      if (options.pdfVersion !== undefined) {
        let pdfDir = "";
        if (options.pdfVersion == "latest" || options.pdfVersion == "beta") {
          pdfDir = "latest";
        }
        else if (options.pdfVersion == "stable") { //old stable version
          pdfDir = "stable";
        }

        //region checking if browser supports latest versions
        if (options.pdfVersion == "latest" || options.pdfVersion == "default") {
          let supports37 = Array.prototype.at !== undefined;
          //if browser doesn't support pdf.js 3.7 it fallsback to stable version
          //3.7 supported by 15.1+
          //3.2 supported by 13.1+
          //2.5 supported by most
          if (Array.prototype.at === undefined) { //Array.prototype.at was introduced at ES2022 which 3.7 requires
            pdfDir = "stable";
            console.log("Proper Support for Latest version PDF.js 3.7 not available. Switching to PDF.js 2.5!");
          }
        }
        //endregion

        if (pdfDir !== "default" && pdfDir !== "") {
          options.pdfjsSrc = window[DEARVIEWER.locationVar] + "js/libs/pdfjs/" + pdfDir + "/pdf.min.js";
          options.pdfjsWorkerSrc = window[DEARVIEWER.locationVar] + "js/libs/pdfjs/" + pdfDir + "/pdf.worker.min.js";
        }
        if(pdfDir === "stable"){
          this.options.fakeZoom = 1;
        }
      }
    }
    else {
      console.warn("DEARVIEWER locationVar not found!");
    }
    this.executeCallback('onInitResourcesLocation');
  }

  initEvents() {

    let app = this,
      containerDOM = this.container[0];
    // Use our detect's results. passive applied if supported, capture will be false either way.
    // let opts = utils.supportsPassive ? {passive: true} : false;
    let opts = false;  //passive is not possible. like it's in https://www.google.com/maps/
    window.addEventListener("resize", app.events.resize = app.resetResizeRequest.bind(app), false);
    containerDOM.addEventListener("mousemove", app.events.mousemove = app.mouseMove.bind(app), false);
    containerDOM.addEventListener("mousedown", app.events.mousedown = app.mouseDown.bind(app), false);
    window.addEventListener("mouseup", app.events.mouseup = app.mouseUp.bind(app), false);
    containerDOM.addEventListener("touchmove", app.events.touchmove = app.mouseMove.bind(app), opts);
    containerDOM.addEventListener("touchstart", app.events.touchstart = app.mouseDown.bind(app), opts);
    window.addEventListener("touchend", app.events.touchend = app.mouseUp.bind(app), false);

  }

  mouseMove(event) {
    if (event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
    if (this.viewer.acceptAppMouseEvents === true)
      this.viewer.mouseMove(event);
  }

  mouseDown(event) {
    this.userHasInteracted = true;
    if (this.viewer.acceptAppMouseEvents === true && jQuery(event.srcElement).closest(".df-sidemenu").length === 0)
      this.viewer.mouseDown(event);
  }

  mouseUp(event) {
    if (this.viewer && this.viewer.acceptAppMouseEvents === true)
      this.viewer.mouseUp(event);
  }

  softDispose() {
    let app = this;
    app.softDisposed = true;
    app.provider.dispose();
    app.viewer.dispose();
  }

  softInit() {
    let app = this;
    app.viewer = new app.viewerType(app.options, this);
    app.provider = new DEARVIEWER.providers[app.options.providerType](app.options, app);
    app.softDisposed = false;
  }

  dispose() {
    let app = this,
      containerDOM = this.container[0];

    clearInterval(this.autoPlayTimer);
    this.autoPlayTimer = null;
    this.autoPlayFunction = null;

    app.provider = utils.disposeObject(app.provider);
    app.contentProvider = null;
    app.target = null;

    app.viewer = utils.disposeObject(app.viewer);
    app.sideMenu = utils.disposeObject(app.sideMenu);
    app.ui = utils.disposeObject(app.ui);
    app.thumblist = utils.disposeObject(app.thumblist);
    app.outlineViewer = utils.disposeObject(app.outlineViewer);

    if (this.events) {
      window.removeEventListener("resize", app.events.resize, false);
      containerDOM.removeEventListener("mousemove", app.events.mousemove, false);
      containerDOM.removeEventListener("mousedown", app.events.mousedown, false);
      window.removeEventListener("mouseup", app.events.mouseup, false);
      containerDOM.removeEventListener("touchmove", app.events.touchmove, false);
      containerDOM.removeEventListener("touchstart", app.events.touchstart, false);
      window.removeEventListener("touchend", app.events.touchend, false);
    }

    app.events = null;

    app.options = null;

    app.element.removeClass("df-app");
    app.viewerType = null;
    app.checkRequestQueue = null;

    app.info?.remove();
    app.info = null;
    app.loadingIcon?.remove();
    app.loadingIcon = null;
    app.backGround?.remove();
    app.backGround = null;
    app.outlineContainer?.remove();
    app.outlineContainer = null;
    app.commentPopup?.remove();
    app.commentPopup = null;

    app.viewerContainer.off();
    app.viewerContainer.remove();
    app.viewerContainer = null;

    app.container.off();
    app.container.remove();
    app.container = null;

    app.element.off();
    app.element.data("df-app", null);
    app.element = null;

    app._offsetParent = null;
    app.dimensions = null;

  }

  resetResizeRequest() {
    this.resizeRequestStatus = REQUEST_STATUS.COUNT;
    this.resizeRequestCount = 0;
    this.container.addClass("df-pendingresize");
    this.pendingResize = true;
  }

  /**
   * Prepares the element for displaying Loading icon
   */
  initInfo() {
    this.info = jQuery('<div>', {class: 'df-loading-info'});
    this.container.append(this.info);
    this.info.html(this.options.text.loading + "...");
    this.loadingIcon = jQuery('<div>', {class: 'df-loading-icon'}).appendTo(this.container);
  }

  // noinspection JSUnusedLocalSymbols
  updateInfo(message, className) {
    utils.log(message);
    if (this.info !== void 0) {
      this.info.html(message);
    }
  }

  _documentLoaded() {
    utils.log("Document Loaded");
    this.isDocumentReady = true;
    this.contentProvider = this.provider;
    this.executeCallback('onDocumentLoad');

    this.endPage = this.pageCount = this.provider.pageCount;
    this.currentPageNumber = this.getValidPage(this.currentPageNumber);
  }

  _viewerPrepared() {
    utils.log("Viewer Prepared");
    this.isViewerPrepared = true;
    this.executeCallback('onViewerLoad');
  }

  requestFinalize() {
    if (this.isDocumentReady !== true || this.isViewerPrepared !== true || this.isExternalReady !== true || this.finalizeRequested === true)
      return;
    this.finalizeRequested = true;
    this.finalize();
  }

  finalizeComponents() {
    this.ui = new UI({}, this);
    this.ui.init();

    this.calculateLayout();

    this.viewer.init();

  }

  finalize() {

    this.resize();
    this.ui.update();
    this.initEvents();

    if (this.options.isLightBox == true) {
      this.analytics({
        eventAction: this.options.analyticsViewerOpen,
        options: this.options
      });
    }

    this.container.removeClass('df-loading df-init');

    this.viewer.onReady();
    this.analytics({
      eventAction: this.options.analyticsViewerReady,
      options: this.options
    });
    this.executeCallback('onReady');

    if (this.options.dataElement.hasClass("df-hash-focused") === true) {
      utils.focusHash(this.options.dataElement);
      this.options.dataElement.removeClass("df-hash-focused");
    }

    if (this.hashNavigationEnabled === true)
      this.getURLHash();

    utils.log("App Finalized");

  }

  initOutline() {

    let app = this;

    let outlineContainer = jQuery('<div>').addClass("df-outline-container df-sidemenu");
    outlineContainer.append('<div class="df-sidemenu-title">'+this.options.text.outlineTitle+'</div>');
    let outlineWrapper = jQuery('<div>').addClass("df-wrapper");

    outlineContainer.append(outlineWrapper);
    app.sideMenu.element.append(outlineContainer);
    app.outlineContainer = outlineContainer;

    app.outlineViewer = new BookMarkViewer({
      container: outlineWrapper[0],
      linkService: app.provider.linkService,
      outlineItemClass: "df-outline-item",
      outlineToggleClass: "df-outline-toggle",
      outlineToggleHiddenClass: "df-outlines-hidden"
    });

    app.outlineViewer.render({outline: app.provider.outline});

  }

  initThumbs() {
    let app = this;

    app.thumblist = new ThumbList({
      app: app,
      addFn: function (row) {

      },
      scrollFn: function () {
        app.thumbRequestStatus = REQUEST_STATUS.ON;
      },
      itemHeight: app.thumbSize,
      itemWidth: utils.limitAt(Math.floor(app.dimensions.defaultPage.ratio * app.thumbSize), 32, 180),
      totalRows: app.pageCount,
    });

    app.thumblist.lastScrolled = Date.now();
    app.thumbRequestStatus = REQUEST_STATUS.ON;

    let thumbContainer = jQuery('<div>').addClass("df-thumb-container df-sidemenu");
    thumbContainer.append('<div class="df-sidemenu-title">'+this.options.text.thumbTitle+'</div>');
    thumbContainer.append(jQuery(app.thumblist.container).addClass("df-wrapper"));
    app.thumbContainer = thumbContainer;
    app.sideMenu.element.append(thumbContainer);

    app.container.on('click', '.df-thumb-container .df-thumb', function (e) {
      e.stopPropagation();
      let id = jQuery(this).attr("id").replace("df-thumb", "");
      app.gotoPage(parseInt(id, 10));
    });

  }

  initSearch() {
    let app = this;
    let searchContainer = jQuery('<div>').addClass("df-search-container df-sidemenu");
    searchContainer.append('<div class="df-sidemenu-title">'+this.options.text.searchTitle+'</div>');
    app.searchForm = jQuery('<div class="df-search-form">').appendTo(searchContainer);
    app.searchBox = jQuery('<input type="text" class="df-search-text" placeholder="'+this.options.text.searchPlaceHolder+'">')
      .on("keyup", function (event) {
        if (event.keyCode === 13) {
          app.search();
        }
      }).appendTo(app.searchForm);
    app.searchButton = jQuery('<div class="df-ui-btn df-search-btn df-icon-search">')
      .on("click", function (event) {
        app.search();
      })
      .appendTo(app.searchForm);

    app.clearButton = jQuery('<a class="df-search-clear">Clear</a>')
      .on("click", function (event) {
        app.clearSearch();
      })
      .appendTo(app.searchForm);
    app.searchInfo = jQuery('<div class="df-search-info">').appendTo(searchContainer);
    app.searchResults = jQuery('<div class="df-wrapper df-search-results">').appendTo(searchContainer);
    app.searchContainer = searchContainer;
    app.sideMenu.element.append(searchContainer);

    app.container.on('click', '.df-search-result', function (e) {
      e.stopPropagation();
      let element = jQuery(this);
      let id = element.data("df-page");
      app.gotoPage(parseInt(id, 10));
    });
  }

  search(text) {
    if (text == void 0) {
      text = this.searchBox.val();
    }
    this.provider.search(text.trim());
  }

  clearSearch() {
    this.searchBox.val("");
    this.searchInfo.html("");
    this.provider.clearSearch();
  }

  updateSearchInfo(message) {
    utils.log(message);
    if (this.searchInfo !== void 0) {
      this.searchInfo.html(message);
    }
  }

  checkRequestQueue() {
    let app = this;
    if (app.checkRequestQueue) {
      requestAnimationFrame(function () {
        if (app && app.checkRequestQueue)
          app.checkRequestQueue();
      })
    }
    if (app.softDisposed) return;

    //region loading & initiaization
    if (app.state != 'ready') {

      if (app.state === 'loading' && this.isDocumentReady === true && this.isViewerPrepared === true && this.isExternalReady === true) {
        app.state = 'finalizing'; //need to add ahead else it can keep running multiple times if the funcion throws error.
        this.finalizeComponents();
      }
      if (app.state === 'finalizing') {
        app.state = 'ready';
        app.finalize();
      }
      return;
    }
    //endregion

    //offsetParent changes when display : none to block changes, scenarios in tab
    if (app.container && app.container[0]
      // && app.options.isLightBox !== true
      && app._offsetParent !== app.container[0].offsetParent) {
      app._offsetParent = app.container[0].offsetParent;
      if (app._offsetParent !== null) {
        app.resize();
        app.resizeRequestStatus = REQUEST_STATUS.OFF;
      }
      utils.log("Visibility Resize Detected");

    }
    if (app._offsetParent === null && !app.isFullscreen) return;

    // Removed since stage.render() is called from app.viewer.render(); - encapsulated
    // if (app.viewer.stage && app.viewer.stage.render)
    //   app.viewer.stage.render();

    if (TWEEN.getAll().length > 0) {
      TWEEN.update();
      app.renderRequestStatus = REQUEST_STATUS.ON;
    }

    if (app.resizeRequestStatus === REQUEST_STATUS.ON) {
      app.resizeRequestStatus = REQUEST_STATUS.OFF;
      app.resize();
    }
    else if (app.resizeRequestStatus === REQUEST_STATUS.COUNT) {
      app.resizeRequestCount++;
      if (app.resizeRequestCount > 10) {
        app.resizeRequestCount = 0;
        app.resizeRequestStatus = REQUEST_STATUS.ON;
      }
    }

    if (app.refreshRequestStatus === REQUEST_STATUS.ON) {
      app.refreshRequestStatus = REQUEST_STATUS.OFF;
      app.pendingResize = false;
      app.viewer.refresh();
      this.container.removeClass("df-pendingresize");
    }
    else if (app.refreshRequestStatus === REQUEST_STATUS.COUNT) {
      app.refreshRequestCount++;
      if (app.refreshRequestCount > 3) {
        app.refreshRequestCount = 0;
        app.refreshRequestStatus = REQUEST_STATUS.ON;
      }
    }

    if (app.textureRequestStatus === REQUEST_STATUS.ON) {
      app.processTextureRequest();
    }

    if (app.thumbRequestStatus === REQUEST_STATUS.ON)
      app.processThumbRequest();
    else if (app.thumbRequestStatus === REQUEST_STATUS.COUNT) {
      app.thumbRequestCount++;
      if (app.thumbRequestCount > 3) {
        app.thumbRequestCount = 0;
        app.thumbRequestStatus = REQUEST_STATUS.ON;
      }
    }
    if (app.renderRequestStatus === REQUEST_STATUS.ON) {
      app.viewer.render();
      app.renderRequestStatus = REQUEST_STATUS.OFF;
    }
    app.provider.checkRequestQueue();
    app.viewer.checkRequestQueue();

  }

  processTextureRequest() {
    // utils.log("Texture Request Preparing");
    let app = this,
      viewer = this.viewer,
      provider = this.provider;

    let visible = viewer.getVisiblePages().main,
      page,
      textureSize,
      requestCount = 0,
      zoomView = app.zoomValue > 1; //this should be independent of zoomview

    if (!viewer.isAnimating() || DEARFLIP.defaults.instantTextureProcess === true) {
      utils.log("Texture Request Working");
      for (let i = 0; i < visible.length; i++) {
        requestCount = 0;

        let pageNumber = visible[i];
        if (pageNumber > 0 && pageNumber <= app.pageCount) {
          page = zoomView ? viewer.zoomViewer.getPageByNumber(pageNumber) : viewer.getPageByNumber(pageNumber);
          if (page) {
            textureSize = viewer.getTextureSize({pageNumber: pageNumber});
            if (page.changeTexture(pageNumber, Math.floor(textureSize.height))) {
              provider.processPage({
                pageNumber: pageNumber,
                textureTarget: zoomView ? DEARVIEWER.TEXTURE_TARGET.ZOOM
                  : DEARVIEWER.TEXTURE_TARGET.VIEWER
              });
              requestCount++;
              app.viewer.getAnnotationElement(pageNumber, true)
            }
          }

          if (requestCount > 0) break;
        }
      }
      if (requestCount === 0) {
        app.textureRequestStatus = REQUEST_STATUS.OFF;
      }
    }
    else {
      app.textureRequestStatus = REQUEST_STATUS.ON;
    }
  }

  applyTexture(canvas, param) {
    let app = this;
    let isCanvas = canvas.toDataURL !== void 0;
    if (param.textureTarget === DEARVIEWER.TEXTURE_TARGET.THUMB) {
      param.height = canvas.height;
      param.width = canvas.width;
      if (!isCanvas) { //case of direct image
        param.texture = canvas.src;
      }
      else {
        let src = canvas.toDataURL('image/png');
        app.provider.setCache(param.pageNumber, src, app.thumbSize);
        param.texture = src;
      }
      app.thumblist.setPage(param);
    }
    else {
      param.texture = isCanvas ? canvas : canvas.src;
      let set = app.viewer.setPage(param);
      if (set === true) {
        app.provider.processAnnotations(param.pageNumber, app.viewer.getAnnotationElement(param.pageNumber, true));
        app.provider.processTextContent(param.pageNumber, app.viewer.getTextElement(param.pageNumber, true));
      }
    }
  }

  processThumbRequest() {
    if (this.thumblist !== null && this.thumblist !== undefined)
      this.thumblist.processThumbRequest();
  }

  refreshRequestStart() {
    this.refreshRequestStatus = REQUEST_STATUS.COUNT;
    this.refreshRequestCount = 0;
  }

  renderRequestStart() {
    this.renderRequestStatus = REQUEST_STATUS.ON;
  }

  resizeRequestStart() {
    this.resizeRequestStatus = REQUEST_STATUS.ON;
  }

  zoom(delta) {
    let app = this;

    app.pendingZoom = true;
    app.zoomDelta = delta;

    app.resize();
  }

  resetZoom() {
    if (this.zoomValue !== 1) {
      this.zoomValue = 1.001;
      this.zoom(-1);
    }
  }

  calculateLayout() {

    let app = this,
      isSideMenuOpen = app.isSideMenuOpen = app.container.hasClass("df-sidemenu-open"),
      dimensions = app.dimensions,
      padding = app.dimensions.padding,
      windowHeight = jQuery(window).height();

    // region Calculation of Offset and Padding
    dimensions.offset = {
      top: 0,
      left: !app.options.sideMenuOverlay && isSideMenuOpen && !app.isRTL ? 220 : 0,
      right: !app.options.sideMenuOverlay && isSideMenuOpen && app.isRTL ? 220 : 0,
      bottom: 0,
      width: !app.options.sideMenuOverlay && isSideMenuOpen ? 220 : 0
    };
    app.viewerContainer.css({left: dimensions.offset.left, right: dimensions.offset.right});

    let controlsHeight = dimensions.controlsHeight = app.container.find(".df-ui").height();

    padding.top = app.options.paddingTop
      + (app.options.controlsPosition === DEARVIEWER.CONTROLS_POSITION.TOP
        ? controlsHeight : 0);
    padding.left = app.options.paddingLeft;
    padding.right = app.options.paddingRight;
    padding.bottom = app.options.paddingBottom
      + (app.options.controlsPosition === DEARVIEWER.CONTROLS_POSITION.BOTTOM
        ? controlsHeight : 0);
    padding.height = padding.top + padding.bottom;
    padding.width = padding.left + padding.right;
    padding.heightDiff = padding.top - padding.bottom;
    padding.widthDiff = padding.left - padding.right;
    //endregion

    //Priority: (isFullSize|isLockedHeight > isLockedHeight) > autoHeight
    dimensions.isFullSize = app.isFullscreen === true;
    dimensions.isFixedHeight = dimensions.isFullSize || !dimensions.isAutoHeight;

    dimensions.containerWidth = dimensions.isFullSize
      ? jQuery(window).width()
      : this.element.width();
    app.container.toggleClass('df-xs', dimensions.containerWidth < 400).toggleClass('df-xss', dimensions.containerWidth < 320);

    //region Determine MaxHeight
    dimensions.maxHeight = windowHeight
      - (dimensions.containerWidth > 600
        ? (jQuery(app.options.headerElementSelector ?? "#wpadminbar").height() ?? 0)
        : 0);

    if (dimensions.isFixedHeight) {
      if (dimensions.isFullSize) {
        dimensions.maxHeight = windowHeight;
      }
      else {
        //locked height but not in fullsize
        //incase height is restricted by value provided by user, we need to determine that first
        //test height on element, but apply on container.
        app.element.height(app.options.height);
        let _height = app.element.height();
        dimensions.maxHeight = Math.min(_height, dimensions.maxHeight);
      }
    }
    else {

    }
    //endregion

    //Reference size is not the cover page. IT IS THE VIRTUAL AVAILABLE ZONE
    //we have outerWidth, it gives innerwidth
    //with innerwidth we get innerheight and then outerHeight
    //app should only store outerWidth and outerHeight
    let outerWidth = dimensions.width,
      innerWidth = dimensions.stage.innerWidth = this.viewer._getInnerWidth(), // innerwidth finalized by viewers
      innerHeight = dimensions.stage.innerHeight = this.viewer._getInnerHeight(),
      outerHeight = this.viewer._getOuterHeight(innerHeight + dimensions.padding.height);

    dimensions.containerHeight = dimensions.isFullSize
      ? windowHeight
      : outerHeight;

    app.element.height(dimensions.containerHeight);

    //Case when User sets height through CSS override.  #199
    let testHeight = app.element.height();
    if (!dimensions.isFullSize && testHeight != dimensions.containerHeight) {
      dimensions.containerHeight = testHeight;
      dimensions.stage.innerHeight = testHeight - dimensions.padding.height;
      dimensions.stage.height = testHeight;
    }

    /*ZOOM values*/
    dimensions.origin = { //required in zoom
      x: (padding.widthDiff + dimensions.containerWidth - dimensions.offset.left - dimensions.offset.right) / 2,
      y: (padding.heightDiff + dimensions.containerHeight) / 2
    };

    app.viewer.determinePageMode();

  }

  resize(textureRefresh = true) {

    utils.log("Resize Request Initiated");

    let app = this;
    this.calculateLayout();

    app.viewer.handleZoom();

    app.viewer.resize();

    if (textureRefresh === false) return;

    if (app.pendingZoom) {
      this.viewer.refresh();
      utils.log("Pending Zoom updated");
    }
    else
      this.refreshRequestStart();

    this.ui.update();

    this.renderRequestStatus = REQUEST_STATUS.ON;

    app.zoomChanged = false;
    app.pendingZoom = false;

    this.executeCallback('afterResize');
  }

  hasOutline() {
    if (this.provider.outline.length > 0) return true;
  }

  switchFullscreen() {
    let app = this;
    // ui = viewer.ui;

    let element = app.container[0];

    app.container.toggleClass("df-fullscreen", app.isFullscreen !== true);
    if (app?.ui?.controls?.fullscreen)
      app.ui.controls.fullScreen.toggleClass(app.options.icons["fullscreen-off"], app.isFullscreen !== true);

    if (app.isFullscreen !== true) {

      let _promise = null;
      //noinspection JSUnresolvedVariable
      if (element['requestFullscreen']) {
        _promise = element['requestFullscreen']();
      }
      else if (element['msRequestFullscreen']) {
        _promise = element['msRequestFullscreen']();
      }
      else if (element['mozRequestFullScreen']) {
        _promise = element['mozRequestFullScreen']();
      }
      else if (element['webkitRequestFullscreen']) {
        _promise = element['webkitRequestFullscreen']();
      }
      if (_promise && _promise["then"]) {
        _promise.then(function () {
          app.refreshRequestStatus === REQUEST_STATUS.ON;
          app.resize();
        })
      }
      app.isFullscreen = true;

    }
    else {

      app.isFullscreen = false;

      if (document['exitFullscreen']) {
        if (document.fullscreenElement)
          document['exitFullscreen']();
      }
      else if (document['msExitFullscreen']) {
        document['msExitFullscreen']();
      }
      else if (document['mozCancelFullScreen']) {
        document['mozCancelFullScreen']();
      }
      else if (document['webkitExitFullscreen']) {
        document['webkitExitFullscreen']();
      }
      // if (app.options.autoLightBoxFullscreen === true && app.options.isLightBox === true) {
      //   DEARFLIP.activeLightBox.close();
      // }
      if (!utils.hasFullscreenEnabled()) {
        app.container[0].scrollIntoView();
      }
    }

    if (!utils.hasFullscreenEnabled()) {
      app.resizeRequestStatus = REQUEST_STATUS.ON;
    }
  }

  //region Navigation
  next() {
    this.jumpBy(this.jumpStep);
  }

  prev() {
    this.jumpBy(-this.jumpStep);
  }

  jumpBy(step) {
    let nextPage = this.currentPageNumber + step;
    nextPage = utils.limitAt(nextPage, this.startPage, this.endPage);

    if (this.anyFirstPageChanged != true) {
      this.analytics({
        eventAction: this.options.analyticsFirstPageChange,
        options: this.options
      });
      this.anyFirstPageChanged = true;
    }

    this.gotoPage(nextPage);
    this.ui.update();
  }

  openRight() {
    this.isRTL ? this.prev() : this.next();
  }

  openLeft() {
    this.isRTL ? this.next() : this.prev();
  }

  start() {
    this.gotoPage(this.startPage);
  }

  end() {
    this.gotoPage(this.endPage);
  }

  gotoPage(pageNumber) {
    let app = this;
    pageNumber = app.getValidPage(parseInt(pageNumber, 10));

    if (app.viewer === null || app.viewer.validatePageChange(pageNumber) === false)
      return;

    this.executeCallback('beforePageChanged');

    app.requestDestRefKey = undefined;
    app.container.removeClass('df-fetch-pdf');

    app.oldPageNumber = app.currentPageNumber;
    app.currentPageNumber = pageNumber;

    app.thumbRequestStatus = REQUEST_STATUS.ON;

    if (app.viewer.gotoPageCallBack)
      app.viewer.gotoPageCallBack();

    app.ui.update();

    if (this.autoPlay == true) {
      this.setAutoPlay(this.autoPlay);
    }

    if (this.hashNavigationEnabled === true)
      this.getURLHash();

    this.executeCallback('onPageChanged');

  }

  gotoPageLabel(pageLabel) {
    this.gotoPage(this.provider.getPageNumberForLabel(pageLabel.toString().trim()));
  }

  getCurrentLabel() {
    return this.provider.getLabelforPage(this.currentPageNumber);
  }

  autoPlayFunction() {
    if (this && this.autoPlay) {
      let nextPage = utils.limitAt(this.currentPageNumber + this.jumpStep, this.startPage, this.endPage);
      if (nextPage !== this.currentPageNumber) {
        this.next();
      }
      else {
        this.setAutoPlay(false);
      }
    }
  }

  setAutoPlay(isPlay) {
    if (this.options.autoPlay) {
      isPlay = isPlay == true;
      var text = isPlay ? this.options.text.pause : this.options.text.play;
      this.ui.controls.play.toggleClass(this.options.icons['pause'], isPlay);
      this.ui.controls.play.html("<span>" + text + "</span>");
      this.ui.controls.play.attr("title", text);

      clearInterval(this.autoPlayTimer);
      if (isPlay) {
        this.autoPlayTimer = setInterval(this.autoPlayFunction.bind(this), this.options.autoPlayDuration);
      }

      this.autoPlay = isPlay;
    }
  }

  //endregion

  isValidPage(pageNumber) {
    return this.provider._isValidPage(pageNumber);
  }

  getValidPage(pageNumber) {
    let app = this;
    if (isNaN(pageNumber)) pageNumber = app.currentPageNumber;
    else if (pageNumber < 1) pageNumber = 1;
    else if (pageNumber > app.pageCount) pageNumber = app.pageCount;
    return pageNumber;

  }

  getURLHash() {

    if (this.options.id != null) {
      let hash = utils.getSharePrefix(this.options.sharePrefix) + (this.options.slug != null ? this.options.slug
        : this.options.id) + "/";
      if (this.currentPageNumber != null) {
        hash += this.currentPageNumber + "/";
      }
      history.replaceState(undefined, undefined, "#" + hash)
    }
    return window.location.href;

  }

  executeCallback(callbackName) {

  }

  analytics(eventData) {

  }

}

DEARVIEWER.prepareOptions = function (options) {

  //convert the element to jQuery Element
  if (!(options.element instanceof jQuery))
    options.element = jQuery(options.element);

  let element = options.element;
  /**
   * @type {jQuery|HTMLElement} - is useful when lightbox is displayed in one location but the options are pulled from another button or thumb element. Used by internal lightbox. No external use.
   */
  if (options.dataElement == null) {
    options.dataElement = element;
  }
  let dataElement = options.dataElement;

  //region Merge Options
  let elementOptions = DEARVIEWER.utils.getOptions(dataElement);
  let customOptions = jQuery.extend(
    true,               //deep scan and merge
    {},                 //an empty object – this is to keep from overriding our "defaults" object
    DEARVIEWER.defaults,
    options,
    elementOptions
  );

  customOptions = utils.fallbackOptions(customOptions);
  utils.log(customOptions);

  //Note: ... spread will overwrite undefined variables too and won't perform deep scan
  let opts = jQuery.extend(  // Extend our default options with those provided.
    true,               //deep scan and merge
    {},                 //an empty object – this is to keep from overriding our "defaults" object
    DEARVIEWER._defaults,
    customOptions);

  //endregion

  //check for mobile ViewerType
  if (utils.isMobile && typeof DEARVIEWER.viewers[opts.mobileViewerType] == "function") {
    opts.viewerType = opts.mobileViewerType;
  }
  if (typeof DEARVIEWER.viewers[opts.viewerType] !== "function") {
    console.warn("Invalid Viewer Type! " + opts.viewerType + " | Using default Viewer!");
    opts.viewerType = DEARVIEWER.viewers.default;
  }
  else {
    opts.viewerType = DEARVIEWER.viewers[opts.viewerType];
  }
  opts = utils.finalizeOptions(utils.sanitizeOptions(opts));
  return opts;
}

DEARVIEWER.Application = function (options) {
  var opts = DEARVIEWER.prepareOptions(options);
  let app = new App(opts);
  options.element.data("df-app", app);
  if (opts.id != null && opts.isLightBox !== true) {
    window[opts.id.toString()] = app;
  }
  return app;
};

//region jQuery Extension and Triggers
//jQuery Extension
jQuery.fn.extend({
  dearviewer_options: function (options) {
    if (options == null)
      options = {};
    options.element = jQuery(this);
    return new DEARVIEWER.prepareOptions(options);
  },
  dearviewer: function (options) {
    if (options == null)
      options = {};
    options.element = jQuery(this);
    return new DEARVIEWER.Application(options);
  },
});


export {App};
