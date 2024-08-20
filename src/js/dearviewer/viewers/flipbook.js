import {DEARVIEWER} from "../defaults.js";
import {BaseViewer} from "./base-viewer.js";
import {Page2D} from "./page.js";

let utils = DEARVIEWER.utils;

class BaseFlipBookViewer extends BaseViewer {
  constructor(options, appContext) {
    options.viewerClass = "df-flipbook " + (options.viewerClass || "");
    super(options, appContext);
    this.isFlipBook = true;
    this.sheets = [];
    this.isRTL = this.app.isRTL;
    this.foldSense = 50;
    this.isOneSided = false;
    this.stackCount = options.stackCount ?? 6;
    this.annotedPage = null;
    this.pendingAnnotations = [];
    this.seamPosition = 0;
    this.dragSheet = null;
    this.drag = null;

    this.soundOn = options.enableSound === true;
    this.soundFile = null;

    this.minZoom = 1;
    this.maxZoom = 4;
    this.pureMaxZoom = 4;

    if (this.app.options.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.AUTO || this.app.options.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL) {
      this.app.checkSecondPage = true;
    }

    // if (this.app.options.pageScale === null) {
    this.app.pageScaling = DEARVIEWER.PAGE_SCALE.PAGE_FIT;
    // }
    options.viewerClass = "";
    this.zoomViewer = new ZoomViewer(options, appContext);
  }

  init() {
    super.init();
    this.initSound();
    let app = this.app;
    this.pageMode = app.options.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.AUTO
      ? ((utils.isMobile || app.pageCount <= 2)
        ? DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE
        : DEARVIEWER.FLIPBOOK_PAGE_MODE.DOUBLE)
      : app.options.pageMode;

    this.singlePageMode = app.options.singlePageMode
      || (utils.isMobile
        ? DEARVIEWER.FLIPBOOK_SINGLE_PAGE_MODE.BOOKLET
        : DEARVIEWER.FLIPBOOK_SINGLE_PAGE_MODE.ZOOM);

    this.updatePageMode();
    this.rightSheetHeight = this.leftSheetHeight = this._defaultPageSize.height;
    this.leftSheetWidth = this.rightSheetWidth = this._defaultPageSize.width;
    this.leftSheetTop = this.rightSheetTop = (this.availablePageHeight() - this._defaultPageSize.height) / 2;
    this.zoomViewer.rightSheetHeight = this.zoomViewer.leftSheetHeight = this._defaultPageSize.height;
    this.zoomViewer.leftSheetWidth = this.zoomViewer.rightSheetWidth = this._defaultPageSize.width;
  }

  determineHeight() {

  }

  initCustomControls() {
    super.initCustomControls();

    let viewer = this;
    let app = this.app;
    let ui = app.ui;
    let controls = ui.controls;
    let text = app.options.text,
      icons = app.options.icons;
    //region Sound Button
    controls.sound = utils.createBtn('sound', icons['sound'], text.toggleSound)
      .on("click", function () {
        viewer.soundOn = !viewer.soundOn;
        ui.updateSound();

      });

    //Updates sound on click of sound button
    ui.updateSound = function () {

      if (viewer.soundOn === false)
        controls.sound.addClass("disabled");
      else
        controls.sound.removeClass("disabled");

    };

    //immediate check
    ui.updateSound();

  }

  dispose() {
    super.dispose();

    for (var count = 0; count < this.sheets.length; count++) {
      var sheet = this.sheets[count];
      if (sheet && sheet.currentTween) {
        sheet.currentTween.stop();
        sheet.currentTween = null;
      }
    }

    this.zoomViewer.dispose();
    this.soundFile = null;
  }

  determinePageMode() {
    let app = this.app;
    let oldPageMode = this.pageMode;
    if (this.app.pageCount < 3) {
      this.pageMode = DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    }
    else if (this.app.options.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.AUTO && this.pageModeChangedManually != true) {

      if (utils.isMobile === true) { // using this only in phone so that orientation change can be supported
        if (this.app.dimensions.isAutoHeight && this.app.dimensions.isFixedHeight == false) {
          //when the flipbook is autoheight but the fullscreen mode is fixed height
          let singlePageModeHeight = this._calculateInnerHeight(true);
          let doublePageModeHeight = this._calculateInnerHeight(false);
          let compareWidth = app.dimensions.stage.innerWidth + (app.options.sideMenuOverlay != true && app.isSideMenuOpen
            ? 220 : 0)
          this.pageMode = singlePageModeHeight > doublePageModeHeight * 1.1 && compareWidth < 768
            ? DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE : DEARVIEWER.FLIPBOOK_PAGE_MODE.DOUBLE;
          //calculating innerheight affects other calculations, like this._defaultPageSize, so if the end result is not single page mode, calculate normally.
          this._calculateInnerHeight();

        }
        else {
          let compareWidth = app.dimensions.stage.innerWidth + (app.options.sideMenuOverlay != true && app.isSideMenuOpen
            ? 220 : 0)
          this.pageMode = app.dimensions.stage.innerHeight > compareWidth * 1.1 && compareWidth < 768
            ? DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE : DEARVIEWER.FLIPBOOK_PAGE_MODE.DOUBLE;
        }
      }
      if (this.pageMode != oldPageMode) {
        this.setPageMode({isSingle: this.pageMode == DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE});
      }
    }
  }

  initSound() {
    this.soundFile = document.createElement("audio");
    this.soundFile.setAttribute("src", this.app.options.soundFile + "?ver=" + DEARVIEWER.version);
    this.soundFile.setAttribute("type", "audio/mpeg");
  }

  playSound() {
    let viewer = this;
    try {
      if (viewer.app.userHasInteracted === true && viewer.soundOn === true) {
        viewer.soundFile.currentTime = 0;
        viewer.soundFile.play();
      }
    } catch (error) {

    }
  }

  checkDocumentPageSizes() {
    let provider = this.app.provider;
    if (provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.AUTO) {
      if (provider._page2Ratio && provider._page2Ratio > provider.defaultPage.pageRatio * 1.5) {
        provider.pageSize = DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL;
      }
      else {
        provider.pageSize = DEARVIEWER.FLIPBOOK_PAGE_SIZE.SINGLE;
      }
    }

    if (provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL) {
      provider.pageCount = provider.numPages === 1 ? 1 : (provider.numPages * 2 - 2);
    }

    if (provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_COVER_BACK || provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE) {
      provider.pageCount = provider.numPages * 2;
    }
  }

  getViewerPageNumber(pageNumber) {
    //case double internal
    if (this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL && pageNumber > 2) {
      pageNumber = pageNumber * 2 - 1;
    }
    if (this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_COVER_BACK && pageNumber > 2) {
      pageNumber = pageNumber * 2 - 1; //todo not sure, we don't have a document yet with links. Since this layout is only intended with printing
    }
    return pageNumber;
  }

  getDocumentPageNumber(pageNumber) {
    //case double internal
    if (this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL && pageNumber > 2)
      return Math.ceil((pageNumber - 1) / 2) + 1;

    //case double page
    if (this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_COVER_BACK && pageNumber > 1) {
      //case double page last page, it's on page 1
      if (pageNumber === this.app.pageCount) return 1;

      //case double page
      return Math.ceil((pageNumber - 1) / 2) + 1;
    }

    return pageNumber;
  }

  getViewPort(pageNumber, fallback = false, filter) {
    return this.filterViewPort(super.getViewPort(pageNumber, fallback), pageNumber, filter);
  }

  isDoubleInternal() {
    return this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_INTERNAL;
  }

  isDoubleCoverBack() {
    return this.app.provider.pageSize === DEARVIEWER.FLIPBOOK_PAGE_SIZE.DOUBLE_COVER_BACK;
  }

  isDoubleInternalPage(pageNumber) {
    return this.isDoubleInternal() && pageNumber > 1 && pageNumber < this.app.provider.pageCount;
  }

  getDoublePageWidthFix(pageNumber) {
    return this.isDoubleInternalPage(pageNumber) || this.isDoubleCoverBack() ? 2 : 1;
  }

  isDoublePageFix(pageNumber) {
    let fix = false;
    if (this.isDoubleCoverBack() || this.isDoubleInternalPage(pageNumber)) {
      if (this.app.isRTL) {
        if (pageNumber % 2 === 0) {
          fix = true;
        }
      }
      else {
        // canvas.width = canvas.width / doublePageWidthFix;
        if (pageNumber % 2 === 1) {
          fix = true;
        }
      }
    }
    return fix;
  }

  finalizeAnnotations(element, pageNumber) {
    // element.parentNode.classList.toggle('df-double-internal', this.isDoubleInternalPage(pageNumber));
    // element.parentNode.classList.toggle('df-double-internal-fix', this.isDoublePageFix(pageNumber));
  }

  finalizeTextContent(element, pageNumber) {
    // element.parentNode.classList.toggle('df-double-internal', this.isDoubleInternalPage(pageNumber));
    // element.parentNode.classList.toggle('df-double-internal-fix', this.isDoublePageFix(pageNumber));
    if(this.app.zoomValue>this.app.viewer.pureMaxZoom){
      if(this.zoomViewer.leftViewPort)this.zoomViewer.leftPage.contentLayer[0].style.setProperty('--scale-factor', this.zoomViewer.leftSheetHeight/this.zoomViewer.leftViewPort.height);
      if(this.zoomViewer.rightViewPort)this.zoomViewer.rightPage.contentLayer[0].style.setProperty('--scale-factor', this.zoomViewer.rightSheetHeight/this.zoomViewer.rightViewPort.height);
    }
  }

  isActivePage(pageNumber) {
    return this.visiblePagesCache !== void 0 && this.visiblePagesCache.includes(pageNumber);
  }

  isSheetCover(sheetNumber) {
    let isBooklet = this.isBooklet;
    return sheetNumber === 0 || (isBooklet && sheetNumber === 1)  //front cover is 0
      || sheetNumber === (Math.ceil(this.app.pageCount / (isBooklet ? 1 : 2)) - (isBooklet ? 0 : 1)); //start with 0 so 1 minus
  }

  isSheetHard(sheetNumber) {

    let config = this.app.options.flipbookHardPages,
      isBooklet = this.isBooklet;

    if (config === "cover") {
      return this.isSheetCover(sheetNumber);
    }
    else if (config === "all") {
      return true;
    }
    else {
      let baseTest = ("," + config + ",").indexOf("," + (sheetNumber * 2 + 1) + ",") > -1;
      let nextTest = ("," + config + ",").indexOf("," + (sheetNumber * 2 + 2) + ",") > -1;
      return baseTest || nextTest;

    }
  };

  sheetsIndexShift(oldBasePageNumber, basePageNumber, stackCount) {
    if (oldBasePageNumber > basePageNumber) {
      this.sheets[stackCount - 1].skipFlip = true;
      this.sheets.unshift(this.sheets.pop());
    }
    else if (oldBasePageNumber < basePageNumber) {
      this.sheets[0].skipFlip = true;
      this.sheets.push(this.sheets.shift());
    }
  }

  checkSwipe(point, event) {
    let viewer = this;
    if (viewer.pinchZoomDirty === true) return;
    if (viewer.app.zoomValue === 1 && viewer.canSwipe === true) { //todo only if touch is available
      let swipe_dist = viewer.orientation == 'vertical' ? point.y - viewer.lastPosY : point.x - viewer.lastPosX;
      if (Math.abs(swipe_dist) > viewer.swipeThreshold) {
        //swipe has triggered
        if (swipe_dist < 0) {
          viewer.app.openRight();
        }
        else {
          viewer.app.openLeft();
        }

        viewer.canSwipe = false;
        event.preventDefault();
      }
      viewer.lastPosX = point.x;
      viewer.lastPosY = point.y;
    }
  }

  checkCenter(flag = false) {

    let viewer = this,
      app = this.app,
      SHIFT = DEARVIEWER.FLIPBOOK_CENTER_SHIFT;

    let
      centerShift,
      isEven = app.currentPageNumber % 2 === 0,
      basePage = viewer.getBasePage(),
      isRTL = viewer.isRTL,
      isSingle = viewer.isSingle;

    if (basePage === 0 || viewer.isBooklet) {
      centerShift = viewer.isRTL ? SHIFT.RIGHT : SHIFT.LEFT;
    }
    else if (basePage === app.pageCount) {
      centerShift = isRTL ? SHIFT.LEFT : SHIFT.RIGHT;
    }
    else {
      centerShift = isSingle
        ? isRTL
          ? (isEven ? SHIFT.LEFT : SHIFT.RIGHT)
          : (isEven ? SHIFT.RIGHT : SHIFT.LEFT)
        : SHIFT.NONE;
    }

    if (viewer.centerNeedsUpdate !== true) {//in-case centerNeedsUpdate needs to be forced
      viewer.centerNeedsUpdate = viewer.centerShift !== centerShift;
    }
    if (viewer.centerNeedsUpdate) {
      viewer.centerShift = centerShift;
      viewer.updateCenter(flag);
      viewer.centerNeedsUpdate = false;
    }

  }

  updateCenter() {
    console.log("UpdateCenter: missing implementation.");
  }

  reset() {
    let sheet;
    for (let count = 0; count < this.sheets.length; count++) {
      sheet = this.sheets[count];
      sheet.reset();
      sheet.pageNumber = -1;
      if (sheet.frontPage) sheet.frontPage.pageNumber = -1;
      if (sheet.backPage) sheet.backPage.pageNumber = -1;
      sheet.resetTexture();
    }
    this.annotedPage = null;
    this.oldBasePageNumber = -1;
    this.centerShift = null;
    this.refresh();
  }

  handleZoom() {
    let app = this.app,
      dimensions = app.dimensions;

    //these dimension require raw values not the ones rouded up or newreast power of two, using isAnnnotation returns raw value.
    let leftDimen = this.getLeftPageTextureSize({zoom: false, isAnnotation: true}),
      rightDimen = this.getRightPageTextureSize({zoom: false, isAnnotation: true});

    let wasMaxZoomed = this.maxZoom === app.zoomValue;
    this.pureMaxZoom = app.dimensions.maxTextureSize / Math.max(leftDimen.height, leftDimen.width, rightDimen.height, rightDimen.width);
    let maxZoom = this.maxZoom = app.options.fakeZoom * this.pureMaxZoom,
      zoomValue = app.zoomValue,
      zoomChanged = false,
      exitZoom = false,
      enterZoom = false;

    if (maxZoom < this.minZoom) {//this happens when the texture height is smaller than window height
      maxZoom = this.maxZoom = this.minZoom;
    }

    if (app.pendingZoom === true && app.zoomDelta != null) {
      let delta = app.zoomDelta;
      zoomValue = delta > 0 ? zoomValue * app.options.zoomRatio : zoomValue / app.options.zoomRatio;
    }
    else if (this.lastScale != null) {
      zoomValue *= this.lastScale;
      this.lastScale = null;
    }
    // else if (wasMaxZoomed === true) {
    //   zoomValue = app.zoomValue = maxZoom;
    //   console.log("Zoom value4: " + app.zoomValue);
    // }
    // While using maxZoomed, If the flipbook maxTexture is smaller than fullscreen page size. MaxZoomed is auto triggered and zoomValue is auto set to maxZoom value instead of original zoomValue 1

    zoomValue = utils.limitAt(zoomValue, this.minZoom, maxZoom);
    app.zoomValueChange = zoomValue / app.zoomValue;
    zoomChanged = app.zoomChanged = app.zoomValue !== zoomValue;

    if (zoomChanged && (zoomValue === 1 || app.zoomValue === 1)) {
      exitZoom = zoomValue === 1;
      enterZoom = app.zoomValue === 1;
    }

    app.zoomValue = zoomValue;


    if (enterZoom || exitZoom) {
      app.container.toggleClass("df-zoom-active", zoomValue !== 1);
      enterZoom && this.enterZoom();
      exitZoom && this.exitZoom();
    }

  }

  refresh() {
    let viewer = this,
      app = this.app;

    let stackCount = viewer.stackCount,
      isRTL = viewer.isRTL,
      isBooklet = viewer.isBooklet;

    let basePageNumber = viewer.getBasePage(),
      pageDivisor = isBooklet ? 1 : 2;

    if (isRTL) basePageNumber = app.pageCount - basePageNumber;

    let oldBasePageNumber = viewer.oldBasePageNumber,
      totalSheets = Math.ceil(app.pageCount / pageDivisor),
      _sheetCount,
      midPoint = Math.floor(stackCount / 2);

    if (basePageNumber !== viewer.oldBasePageNumber) {
      viewer.pageNumberChanged = true;
      this.updatePendingStatusClass(true);
      viewer.zoomViewer.reset();
    }

    //Pages index shifting
    viewer.sheetsIndexShift(oldBasePageNumber, basePageNumber, stackCount);
    let baseSheetNumber = Math.ceil(basePageNumber / pageDivisor);

    for (_sheetCount = 0; _sheetCount < stackCount; _sheetCount++) {
      let _sheet,
        sheetNumber = (baseSheetNumber - midPoint + _sheetCount);

      if (isRTL) sheetNumber = totalSheets - sheetNumber - 1;

      _sheet = viewer.sheets[_sheetCount];
      if (_sheet == null) continue;
      _sheet.targetSide = _sheetCount < midPoint ? DEARVIEWER.TURN_DIRECTION.LEFT : DEARVIEWER.TURN_DIRECTION.RIGHT;


      let sideChanged = _sheet.side !== _sheet.targetSide,
        pageChanged = sheetNumber !== _sheet.pageNumber,
        needsFlip = sideChanged && _sheet.skipFlip === false && app.zoomValue === 1;
      if (!sideChanged && pageChanged && _sheet.isFlipping && _sheet.currentTween) {
        _sheet.currentTween.stop();
      }

      _sheet.isHard = viewer.isSheetHard(sheetNumber);
      _sheet.isCover = viewer.isSheetCover(sheetNumber);

      //Determine Page Situation
      if (pageChanged) {

        //texture reset
        _sheet.resetTexture();
        let firstPage = this.app.isRTL ? _sheet.backPage : _sheet.frontPage;
        firstPage.pageNumber = this.isBooklet ? sheetNumber : sheetNumber * 2 + 1;
        let secondPage = this.app.isRTL ? _sheet.frontPage : _sheet.backPage;
        secondPage.pageNumber = this.isBooklet ? -1 : sheetNumber * 2 + 2;

        app.textureRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;
      }
      _sheet.pageNumber = sheetNumber;

      viewer.refreshSheet({
        sheet: _sheet,
        sheetNumber: sheetNumber,
        totalSheets: totalSheets,
        zIndex: this.stackCount + (_sheetCount < midPoint ? (_sheetCount - midPoint) : (midPoint - _sheetCount)),
        visible: isBooklet
          ? (isRTL
            ? (_sheetCount < midPoint || _sheet.isFlipping || needsFlip)
            : (_sheetCount >= midPoint || _sheet.isFlipping || needsFlip))

          : ((sheetNumber >= 0 && sheetNumber < totalSheets) || (isBooklet && sheetNumber === totalSheets)),
        index: _sheetCount,
        needsFlip: needsFlip,
        midPoint: midPoint
      });

    }

    viewer.requestRefresh(false);
    app.textureRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;

    viewer.oldBasePageNumber = basePageNumber;

    this.checkCenter();
    this.zoomViewer.refresh();
    viewer.pageNumberChanged = false;
  }

  validatePageChange(pageNumber) {
    if (pageNumber === this.app.currentPageNumber)
      return false;

    let app = this.app,
      valid = !this.isFlipping() || app.oldPageNumber === undefined;

    //for continuos same direction flip, even when flipping is not completed
    valid = valid || (app.currentPageNumber < pageNumber && app.oldPageNumber < app.currentPageNumber);
    valid = valid || (app.currentPageNumber > pageNumber && app.oldPageNumber > app.currentPageNumber);

    return valid;
  }

  getVisiblePages() {
    let viewer = this,
      visible = [];
    let page = viewer.getBasePage();
    let count = viewer.app.zoomValue > 1
      ? 1
      : (viewer.isBooklet && utils.isMobile
        ? Math.min(viewer.stackCount / 2, 2)
        : viewer.stackCount / 2);

    for (let _count = 0; _count < count; _count++) {
      visible.push(page - _count);
      visible.push(page + _count + 1);
    }
    this.visiblePagesCache = visible;
    return {main: visible, buffer: []};
  }

  getBasePage(pageNumber) {

    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;

    if (this.isBooklet)
      return pageNumber;
    else
      return Math.floor(pageNumber / 2) * 2
  }

  getRightPageNumber() {
    return this.getBasePage() + (this.isBooklet ? 0 : (this.isRTL ? 0 : 1))
  }

  getLeftPageNumber() {
    return this.getBasePage() + (this.isBooklet ? 0 : (this.isRTL ? 1 : 0))
  }

  afterFlip(skip = false) {
    if (this.isAnimating() !== true) {
      this.pagesReady();
      this.updatePendingStatusClass();
    }
  }

  isFlipping() {
    let isFlipping = false;
    this.sheets.forEach(function (sheet) {
      if (sheet.isFlipping === true)
        isFlipping = true;
    });
    return isFlipping;
  }

  isAnimating() {
    return this.isFlipping();
  }

  mouseWheel(event) {

    if (this.app.options.mouseScrollAction === DEARVIEWER.MOUSE_SCROLL_ACTIONS.ZOOM) {

      this.zoomViewer.mouseWheel(event);

    }
    else {
      super.mouseWheel(event);
    }
  }

  checkRequestQueue() {

    if (this.app.zoomValue > 1)
      this.zoomViewer.checkRequestQueue();
    else
      super.checkRequestQueue();

  }

  updatePan() {

  }

  resetPageTween() {

  }

  gotoPageCallBack() {
    this.resetPageTween();

    // this.app.options.resetZoomBeforeFlip = true;
    if (this.app.zoomValue !== 1 && this.app.options.resetZoomBeforeFlip === true) {
      this.app.resetZoom();
    }

    this.beforeFlip();

    this.requestRefresh();
  }

  beforeFlip() {
    let viewer = this;

    //callback for before flip
    viewer.app.executeCallback('beforeFlip');

    if (viewer.app.zoomValue === 1) viewer.playSound();
  }

  onFlip() {
    let viewer = this;
    //callback for after flip
    viewer.app.executeCallback('onFlip');
  }

  //todo should be handled properly by zoomviewer directly
  getAnnotationElement(pageNumber, clean = false,isZoomViewer = false) {
    let annotationEl = undefined;
    if (this.app.zoomValue > 1 || isZoomViewer === true)
      annotationEl = this.zoomViewer.getAnnotationElement(pageNumber, clean);
    else
      annotationEl = super.getAnnotationElement(pageNumber, clean);
    if (annotationEl) {
      annotationEl.parentNode.classList.toggle('df-double-internal', this.isDoubleInternalPage(pageNumber));
      annotationEl.parentNode.classList.toggle('df-double-internal-fix', this.isDoublePageFix(pageNumber));
    }
    return annotationEl;
  }

  getTextElement(pageNumber, clean = false,isZoomViewer = false) {
    if (this.app.zoomValue > 1 || isZoomViewer === true)
      return this.zoomViewer.getTextElement(pageNumber, clean);
    else
      return super.getTextElement(pageNumber, clean);
  }

  enterZoom() {
    this.exchangeTexture(this, this.zoomViewer);
  }

  exitZoom() {
    this.exchangeTexture(this.zoomViewer, this);
  }

  exchangeTexture(from, to) {
    let basePage = this.getBasePage();
    let fromPage = from.getPageByNumber(basePage);
    let toPage = to.getPageByNumber(basePage);
    if (toPage && toPage.textureStamp === "-1") {
      toPage.textureStamp = fromPage.textureStamp;
      toPage.loadTexture({texture: fromPage.getTexture(true)});
      utils.log("Texture Exchanging at " + basePage);
    }
    else {
      utils.log("Texture Exchanging Bypassed at " + (basePage));
    }

    if (!this.isBooklet) {
      let fromPage = from.getPageByNumber(basePage + 1);
      let toPage = to.getPageByNumber(basePage + 1);
      if (toPage && toPage.textureStamp === "-1") {
        toPage.textureStamp = fromPage.textureStamp;
        toPage.loadTexture({texture: fromPage.getTexture(true)});
        utils.log("Texture Exchanging at " + (basePage + 1));
      }
      else {
        utils.log("Texture Exchanging Bypassed at " + (basePage + 1));
      }
    }
    to.pagesReady();
  }

  setPageMode(args) {
    let app = this.app;
    let isSingle = args.isSingle === true;
    this.pageMode = isSingle ? DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE : DEARVIEWER.FLIPBOOK_PAGE_MODE.DOUBLE;
    this.updatePageMode();
    app.resizeRequestStart();
    // this.requestRefresh();

    if (app.viewer.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.DOUBLE && app.ui.controls.pageMode) {
      app.ui.controls.pageMode.removeClass(app.options.icons['doublepage']).addClass(app.options.icons['singlepage'])
        .attr('title', app.options.text.singlePageMode)
        .html('<span>' + app.options.text.singlePageMode + '</span>');
    }
    else {
      app.ui.controls.pageMode.addClass(app.options.icons['doublepage']).removeClass(app.options.icons['singlepage'])
        .attr('title', app.options.text.doublePageMode)
        .html('<span>' + app.options.text.doublePageMode + '</span>');
    }

  }

  updatePageMode() {
    if (this.app.pageCount < 3) this.pageMode = DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;

    this.isSingle = this.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    this.isBooklet = this.isSingle && this.singlePageMode === DEARVIEWER.FLIPBOOK_SINGLE_PAGE_MODE.BOOKLET;
    this.app.jumpStep = this.isSingle ? 1 : 2;
    this.totalSheets = Math.ceil(this.app.pageCount / (this.isBooklet ? 1 : 2));
    if (this.sheets.length > 0)
      this.reset();
  }

  setPage(param) {
    if (param.textureTarget === DEARVIEWER.TEXTURE_TARGET.ZOOM) {
      return this.zoomViewer.setPage(param);
    }
    else {
      return super.setPage(param);
    }
  }

  _calculateInnerHeight(singleMode = void 0) {
    if (singleMode === void 0) {
      singleMode = this.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    }
    let viewPort = this.app.dimensions.defaultPage.viewPort;
    let appWidth = this.availablePageWidth(false, true, singleMode),
      appHeightMax = this.app.dimensions.maxHeight - this.app.dimensions.padding.height;
    if (this.orientation == 'vertical' && singleMode == false) {
      appHeightMax /= 2;
    }
    this._defaultPageSize = utils.contain(viewPort.width, viewPort.height, appWidth, appHeightMax);
    this._pageFitArea = {width: appWidth, height: appHeightMax};//do not use this value as reference, it's a midvalue
    //_pageFitArea is not the size of flipbook. It the size of possible viewport inside a browser when auto height. In short, it's the restricted area iside which flipbook lies
    /// ------------
    /// |      |     |
    /// --------------  this is flibpok size
    /// ______________  this is pagefit area, flipbook cannot go beyond the pagefit area

    let innerHeight = this.app.dimensions.isFixedHeight ? appHeightMax : this._pageFitArea.height;
    if (this.app.dimensions.isAutoHeight && this.app.dimensions.isFixedHeight == false) {
      //when the flipbook is autoheight but the fullscreen mode is fixed height
      innerHeight = Math.floor(this._defaultPageSize.height);
    }
    return innerHeight;
  }

  _getInnerHeight() {

    let innerHeight = this._calculateInnerHeight();

    this.app.dimensions.stage.width = this.app.dimensions.stage.innerWidth + this.app.dimensions.padding.width;
    this.app.dimensions.stage.height = innerHeight + this.app.dimensions.padding.height;

    return innerHeight;
  }

  availablePageWidth(zoom = true, ignoreSidemenuOverlay = false, singleMode = void 0) {
    if (singleMode === void 0) {
      singleMode = this.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    }
    var extraWidth = ignoreSidemenuOverlay === true ? this.app.dimensions.offset.width : 0;
    var pageWidth = (this.app.dimensions.stage.innerWidth + extraWidth);
    pageWidth /= singleMode === true || this.orientation == 'vertical' ? 1 : 2;

    return Math.floor(pageWidth * (zoom ? this.app.zoomValue : 1));
  }

  availablePageHeight(zoom = true, singleMode = void 0) {
    if (singleMode === void 0) {
      singleMode = this.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    }
    var pageHeight = (this.app.dimensions.stage.innerHeight);
    if (singleMode === false && this.orientation == 'vertical') {
      pageHeight /= 2;
    }
    return Math.floor(pageHeight * (zoom ? this.app.zoomValue : 1));
  }

  getTextureSize(param) {

    let viewport = this.getViewPort(param.pageNumber, true);
    let pixelRatio = this.app.options.pixelRatio;

    let dimen = utils.contain(
      viewport.width,
      viewport.height,
      pixelRatio * this.availablePageWidth(param.zoom),
      pixelRatio * this.availablePageHeight(param.zoom));
    dimen = utils.containUnStretched(
      dimen.width,
      dimen.height,
      this.app.options.maxTextureSize,
      this.app.options.maxTextureSize
    );

    return {height: dimen.height, width: dimen.width};
  }

  getLeftPageTextureSize(param = {}) {
    param.pageNumber = this.getLeftPageNumber();
    return this.getTextureSize(param);
  }

  getRightPageTextureSize(param = {}) {
    param.pageNumber = this.getRightPageNumber();
    return this.getTextureSize(param);
  }

  filterViewPort(viewport, pageNumber, filter = true) {

    if (viewport === undefined) return undefined;
    if (filter != true) return viewport;
    let _viewport = viewport.clone();
    _viewport.width = _viewport.width / this.getDoublePageWidthFix(pageNumber);
    return _viewport;

  }

  filterViewPortCanvas(viewport, canvas, pageNumber) {

    if (this.isDoublePageFix(pageNumber)) {
      viewport.transform[4] = viewport.transform[4] - Math.floor(Math.min(canvas.width, viewport.width * 2 - canvas.width));
    }
    viewport.widthFix = this.isDoubleInternalPage(pageNumber) ? 2 : 1;
  }

  isClosedPage(pageNumber) {
    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;
    return pageNumber === 1 || (pageNumber === this.app.jumpStep * Math.ceil(this.app.pageCount / this.app.jumpStep) && !this.isBooklet);
    //Booklets never close on the end
  }

  isLeftPage(pageNumber) {
    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;

    if (this.isBooklet) {
      return this.isRTL;
    }
    else {
      return pageNumber % 2 === (this.isRTL ? 1 : 0);
    }
  }

  cleanPage(pageNumber) {
    if (this.isDoubleInternalPage(pageNumber)) {
      var otherPage = pageNumber + (pageNumber % 2 === 1 ? -1 : 1);
      return this.app.provider.requestedPages[pageNumber] === false && this.app.provider.requestedPages[otherPage] === false;
    }
    else {
      return super.cleanPage(pageNumber);
    }
  }

  onReady() {
    super.onReady();
  }

  searchPage(pageNumber) {
    return {
      include: !this.isDoublePageFix(pageNumber),
      label: this.app.provider.getLabelforPage(pageNumber) + (this.isDoubleInternalPage(pageNumber)
        ? "-" + this.app.provider.getLabelforPage(pageNumber + 1)
        : "")
    }
  }
}

class ZoomViewer extends BaseViewer {
  constructor(options, appContext) {
    options.viewerClass = "df-zoomview " + (options.viewerClass || "");
    super(options, appContext);
    this.viewer = this.app.viewer;
    this.events = {};
    this.init();
    this.initEvents();

    this.left = 0;
    this.top = 0;
  }

  init() {
    this.leftPage = new Page2D();
    this.rightPage = new Page2D();
    this.pages.push(this.leftPage);
    this.pages.push(this.rightPage);
    this.leftPage.element.addClass('df-page-back');
    this.rightPage.element.addClass('df-page-front');

    this.wrapper.append(this.leftPage.element);
    this.wrapper.append(this.rightPage.element);

    this.bookShadow = jQuery('<div>', {class: 'df-book-shadow'});
    this.wrapper.append(this.bookShadow);
    this.wrapper.addClass("df-sheet");

  }


  initEvents() {
    this.stageDOM = this.element[0];
    super.initEvents();
  }

  dispose() {
    this.element.remove();
  }

  resize() {

    let viewer = this;
    let dimensions = viewer.app.dimensions;
    let padding = dimensions.padding;

    let zoomHeight = this.app.viewer.availablePageHeight(),
      zoomWidth = this.app.viewer.availablePageWidth(),
      zoomFullWidth = viewer.fullWidth = zoomWidth * (this.app.viewer.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE
        ? 1 : 2),
      stageWidth = dimensions.stage.innerWidth,
      stageHeight = dimensions.stage.innerHeight;

    let shiftHeight = viewer.shiftHeight = Math.ceil(utils.limitAt((zoomHeight - stageHeight) / 2, 0, zoomHeight)),
      shiftWidth = viewer.shiftWidth = Math.ceil(utils.limitAt((zoomFullWidth - stageWidth) / 2, 0, zoomFullWidth));

    if (viewer.app.zoomValue === 1) {
      viewer.left = 0;
      viewer.top = 0;
    }

    viewer.element.css({
      top: -shiftHeight,
      bottom: -shiftHeight,
      right: -shiftWidth,
      left: -shiftWidth,
      paddingTop: padding.top,
      paddingRight: padding.right,
      paddingBottom: padding.bottom,
      paddingLeft: padding.left,
      transform: "translate3d(" + viewer.left + "px," + viewer.top + "px,0)"
    });

    viewer.wrapper.css({
      width: zoomFullWidth,
      height: zoomHeight,
      //marginTop when the flipbook is smaller than the ViewArea it has to center align vertically
      marginTop: (dimensions.height - zoomHeight - padding.height) > 0
        ? (dimensions.height - padding.height - zoomHeight) / 2
        : 0
    });

    this.wrapper.height(zoomHeight).width(zoomFullWidth - (zoomFullWidth % 2));

    if (viewer.app.pendingZoom === true) {
      viewer.zoom();
    }
    this.app.viewer.annotedPage = null;
    this.pagesReady();
  }

  zoom() {
    let viewer = this,
      app = this.app;

    if (app.zoomChanged) {

      let origin = app.dimensions.origin,
        dz = app.zoomValueChange;

      //fix zoom to previous center
      if (app.zoomValue === 1) {
        viewer.left = 0;
        viewer.top = 0;
      }
      else {
        viewer.left *= dz;
        viewer.top *= dz;


        if (!app.viewer.zoomCenter) {
          app.viewer.zoomCenter = {
            x: origin.x,
            y: origin.y
          };
        }

        let pointOld = {raw: app.viewer.zoomCenter},
          pointNew = {raw: {}};
        // pointOld.raw.x -= app.dimensions.offset.left / 2;

        //fix zoom to previous pointer
        let dx = (pointOld.raw.x - origin.x) * dz,
          dy = (pointOld.raw.y - origin.y) * dz;

        pointNew.raw.x = origin.x + dx;
        pointNew.raw.y = origin.y + dy;

        viewer.startPoint = pointNew;

        viewer.pan(pointOld);

        viewer.startPoint = null;
      }
    }

    app.viewer.zoomCenter = null;
  }

  reset() {
    this.leftPage.resetTexture();
    this.rightPage.resetTexture();
  }

  refresh() {
    let app = this.app,
      viewer = app.viewer;
    let basePageNumber = viewer.getBasePage(),
      isLeftBase = viewer.isBooklet
        ? !app.isRTL
        : app.isRTL,
      basePage = isLeftBase ? this.rightPage : this.leftPage,
      nextPage = isLeftBase ? this.leftPage : this.rightPage;

    basePage.pageNumber = basePageNumber;
    nextPage.pageNumber = basePageNumber + 1;

    basePage.updateCSS({
      display: basePageNumber === 0 ? "none" : "block"
    });
    nextPage.updateCSS({
      display: nextPage.pageNumber > app.pageCount || viewer.isBooklet
        ? "none" : "block"
    });
  }

  updateCenter() {
    let viewer = this;
    if (viewer === null || viewer.app.viewer === null) return;
    let centerShift = viewer.app.viewer.centerShift,
      isRTL = viewer.app.viewer.isRTL,
      width = (!isRTL && viewer.app.currentPageNumber > 1) || (isRTL && viewer.app.currentPageNumber < viewer.app.pageCount)
        ? viewer.leftSheetWidth : viewer.rightSheetWidth;

    let end = centerShift * width / 2;
    viewer.wrapper[0].style.left = end + "px";

  }

  isDoubleInternalPage(pageNumber) {
    return this.app.viewer.isDoubleInternalPage(pageNumber);
  }

  pagesReady() {
    if (this.app.viewer.isFlipping()) return;
    if (this.app.zoomValue !== 1)
      this.app.viewer.updatePendingStatusClass(false);
    if (this.app.options.flipbookFitPages === false) {

      let basePage = this.app.viewer.getBasePage();
      let leftViewPort = this.leftViewPort
          = this.app.viewer.getViewPort(basePage
          + (this.app.viewer.isBooklet ? 0 : (this.app.viewer.isRTL ? 1 : 0))),
        rightViewPort = this.rightViewPort
          = this.app.viewer.getViewPort(basePage
          + (this.app.viewer.isBooklet ? 0 : (this.app.viewer.isRTL ? 0 : 1)));

      if (leftViewPort) {
        let leftDimen = utils.contain(leftViewPort.width, leftViewPort.height, this.app.viewer.availablePageWidth(), this.app.viewer.availablePageHeight());
        this.leftSheetWidth = Math.floor(leftDimen.width);
        this.leftSheetHeight = Math.floor(leftDimen.height);
        this.leftSheetTop = (this.app.viewer.availablePageHeight() - this.leftSheetHeight) / 2;
        if(this.app.zoomValue>this.app.viewer.pureMaxZoom)this.leftPage.contentLayer[0].style.setProperty('--scale-factor', this.leftSheetHeight/leftViewPort.height);
      }
      if (rightViewPort) {
        let rightDimen = utils.contain(rightViewPort.width, rightViewPort.height, this.app.viewer.availablePageWidth(), this.app.viewer.availablePageHeight());
        this.rightSheetWidth = Math.floor(rightDimen.width);
        this.rightSheetHeight = Math.floor(rightDimen.height);
        this.rightSheetTop = (this.app.viewer.availablePageHeight() - this.rightSheetHeight) / 2;
        if(this.app.zoomValue>this.app.viewer.pureMaxZoom)this.rightPage.contentLayer[0].style.setProperty('--scale-factor', this.rightSheetHeight/rightViewPort.height);
      }
      if (leftViewPort != void 0 || rightViewPort != void 0) {
        this.totalSheetsWidth = this.leftSheetWidth + this.rightSheetWidth;
        this.leftPage.element.height(Math.floor(this.leftSheetHeight)).width(Math.floor(this.leftSheetWidth))
          .css({transform: 'translateY(' + Math.floor(this.leftSheetTop) + 'px)'});
        this.rightPage.element.height(Math.floor(this.rightSheetHeight)).width(Math.floor(this.rightSheetWidth))
          .css({transform: 'translateY(' + Math.floor(this.rightSheetTop) + 'px)'});
      }
    }
  }

  textureLoadedCallback(param) {
    let page = this.getPageByNumber(param.pageNumber);
    //page.element.toggleClass("df-odd", param.oddPage === true);
    this.pagesReady();
  }

}

class BookSheet {
  constructor(options) {
    this.parentElement = options.parentElement;
    this.isFlipping = false;
    this.isOneSided = false;
    this.viewer = options.viewer;
    this.frontPage = null;
    this.backPage = null;
    this.pageNumber = void 0;
    this.animateToReset = null;
  }

  init() {

  }

  flip() {

  }

  frontImage(param) {
    this.frontPage.loadTexture({texture: param.texture, callback: param.callback});
  }

  backImage(param) {
    this.backPage.loadTexture({texture: param.texture, callback: param.callback});
  }

  resetTexture() {

    this.frontPage.resetTexture();
    this.backPage.resetTexture();
  }

  reset() {
    let sheet = this;
    sheet.animateToReset = null;
    sheet.isFlipping = false;
    // page.element[0].style.opacity = 1;
    sheet.currentTween = null;
    sheet.pendingPoint = null;
    sheet.magnetic = false;
    sheet.skipFlip = true;
    sheet.animateToReset = null;
    sheet.viewer.dragPage = null;
    sheet.viewer.flipPage = null;
    sheet.viewer.corner = DEARVIEWER.TURN_CORNER.NONE;
  };


}

export {BaseFlipBookViewer, BookSheet};
