import {DEARVIEWER} from "../defaults.js";

let DV = DEARVIEWER;
let utils = DEARVIEWER.utils;

class BaseViewer {

  constructor(options, appContext) {

    this.pages = [];
    this.app = appContext;
    this.parentElement = this.app.viewerContainer;
    let viewerClass = "df-viewer " + (options.viewerClass || "");
    this.element = jQuery('<div>', {class: viewerClass});
    this.parentElement.append(this.element);
    this.wrapper = jQuery('<div>', {class: 'df-viewer-wrapper'});
    this.element.append(this.wrapper);
    this.oldBasePageNumber = 0;
    this.pages = [];
    this.minZoom = 1;
    this.maxZoom = 4;

    this.swipeThreshold = 20;
    this.stageDOM = null;
    this.events = {};

    this.arrowKeysAction = options.arrowKeysAction;
    this.clickAction = options.clickAction;
    this.scrollAction = options.scrollAction;
    this.dblClickAction = options.dblClickAction;

    this.pageBuffer = [];
    this.pageBufferSize = 10;

  }

  init() {

  }

  softDispose() {

  }

  updateBuffer(page) {

  }

  pageResetCallback(page) {

  }

  initCustomControls() {

  }

  _getInnerWidth() {
    return this.app.dimensions.containerWidth - this.app.dimensions.padding.width - this.app.dimensions.offset.width;
  }

  _getInnerHeight() {
    //individual viewers don't calculate on maxHeight
    return this.app.dimensions.maxHeight - this.app.dimensions.padding.height;
  }

  _getOuterHeight(height) {
    return height;
  }


  dispose() {
    if (this.stageDOM) {
      this.stageDOM.removeEventListener("mousemove", this.events.mousemove, false);
      this.stageDOM.removeEventListener("mousedown", this.events.mousedown, false);
      this.stageDOM.removeEventListener("mouseup", this.events.mouseup, false);
      this.stageDOM.removeEventListener("touchmove", this.events.mousemove, false);
      this.stageDOM.removeEventListener("touchstart", this.events.mousedown, false);
      this.stageDOM.removeEventListener("touchend", this.events.mouseup, false);
      this.stageDOM.removeEventListener("dblclick", this.events.dblclick, false);
      this.stageDOM.removeEventListener("scroll", this.events.scroll, false);
      this.stageDOM.removeEventListener("mousewheel", this.events.mousewheel, false);
      this.stageDOM.removeEventListener("DOMMouseScroll", this.events.mousewheel, false);
    }
    this.events = null;
    this.stageDOM = null;
    this.element.remove();
  }

  /**
   * Verify page size differences in the document
   */
  checkDocumentPageSizes() {

  }

  /**
   * Determines which page to jump in viewer when a PDF link is clicked. Pagenumber passed from PDF provider.
   * Clicked link provides absolute number but a number relatiev to viewer is required.
   * @param pageNumber
   * @returns {number}
   */
  getViewerPageNumber(pageNumber) {
    return pageNumber;
  }

  /**
   * Determines which page to render from PDF document. Pagenumber passed from viewer.
   * PDF document page and viewer page numbers are different in some cases.
   * @param pageNumber
   * @returns {number}
   */
  getDocumentPageNumber(pageNumber) {
    return pageNumber;
  }

  getRenderContext(pdfPage, param) {
    let app = this.app,
      provider = app.provider,
      pageNumber = param.pageNumber,
      textureTarget = utils.ifdef(param.textureTarget, DEARVIEWER.TEXTURE_TARGET.VIEWER);

    let pageFit = app.dimensions.pageFit;

    let pageViewport = provider.viewPorts[pageNumber];

    let dimen = app.viewer.getTextureSize(param);

    let textureCacheIndex = null;
    if (textureTarget === DEARVIEWER.TEXTURE_TARGET.THUMB) {
      textureCacheIndex = app.thumbSize;
    }
    else {
      textureCacheIndex = Math.floor(dimen.height);
    }

    if (provider.getCache(pageNumber, textureCacheIndex) !== undefined) {
      return;
    }

    let scale = dimen.height / pageViewport.height;

    let canvas = document.createElement('canvas'),
      viewport = this.filterViewPort(pdfPage.getViewport({
        scale: scale,
        rotation: pdfPage._pageInfo.rotate + app.options.pageRotation
      }), pageNumber);

    if (textureTarget === DEARVIEWER.TEXTURE_TARGET.THUMB) {
      // in-case the thumb size is wider
      if (((viewport.width) / viewport.height) > (180 / app.thumbSize)) {
        scale = scale * 180 / (viewport.width);
      }
      else {
        scale = scale * app.thumbSize / viewport.height;
      }
      viewport = this.filterViewPort(pdfPage.getViewport({
        scale: scale,
        rotation: pdfPage._pageInfo.rotate + app.options.pageRotation
      }), pageNumber);
    }

    canvas.height = Math.floor(viewport.height);
    canvas.width = Math.floor(viewport.width);

    // if (app.pageScaling === DEARVIEWER.PAGE_SCALE.PAGE_FIT) {
    let error = Math.abs(canvas.width - dimen.width) / dimen.width * 100;
    if (error > 0.001 && error < 2) { //1px error in upto 5000px is detected
      canvas.width = Math.floor(dimen.width);
      canvas.height = Math.floor(dimen.height);
    }
    // }
    app.viewer.filterViewPortCanvas(viewport, canvas, pageNumber);

    return {
      canvas: canvas,
      canvasContext: canvas.getContext('2d', {willReadFrequently: DEARVIEWER.defaults.canvasWillReadFrequently === true}),
      viewport: viewport
    }
  }

  filterViewPort(viewport, pageNumber) {
    return viewport;
  }

  getViewPort(pageNumber, fallback = false) {
    let viewPort = this.app.provider.viewPorts[pageNumber];
    if (fallback)
      return viewPort ?? this.app.provider.defaultPage.viewPort;
    return viewPort;
  }

  pagesReady() {

  }

  onReady() {

  }

  filterViewPortCanvas(viewport) {

  }

  finalizeAnnotations() {

  }

  finalizeTextContent() {

  }

  updateTextContent(pageNumber) {
    if (pageNumber == void 0) {
      pageNumber = this.getBasePage(pageNumber);
    }
    this.app.provider.processTextContent(pageNumber, this.getTextElement(pageNumber, true));
  }

  isActivePage(pageNumber) {
    return pageNumber === this.app.currentPageNumber;
  }

  initEvents() {
    let viewer = this;
    let stageDOM = viewer.stageDOM = utils.ifdef(viewer.stageDOM, viewer.parentElement[0]);
    if (stageDOM) {
      // Use our detect's results. passive applied if supported, capture will be false either way.
      // let opts = utils.supportsPassive ? {passive: true} : false; //passive is not possible. like it's in https://www.google.com/maps/
      let opts = false;

      stageDOM.addEventListener("mousemove", viewer.events.mousemove = viewer.mouseMove.bind(viewer), false);
      stageDOM.addEventListener("mousedown", viewer.events.mousedown = viewer.mouseDown.bind(viewer), false);
      stageDOM.addEventListener("mouseup", viewer.events.mouseup = viewer.mouseUp.bind(viewer), false);
      stageDOM.addEventListener("touchmove", viewer.events.mousemove = viewer.mouseMove.bind(viewer), opts);
      stageDOM.addEventListener("touchstart", viewer.events.mousedown = viewer.mouseDown.bind(viewer), opts);
      stageDOM.addEventListener("touchend", viewer.events.mouseup = viewer.mouseUp.bind(viewer), false);
      stageDOM.addEventListener("dblclick", viewer.events.dblclick = viewer.dblclick.bind(viewer), false);
      stageDOM.addEventListener("scroll", viewer.events.scroll = viewer.onScroll.bind(viewer), false);
      stageDOM.addEventListener("mousewheel", viewer.events.mousewheel = viewer.mouseWheel.bind(viewer), opts);
      stageDOM.addEventListener('DOMMouseScroll', viewer.events.mousewheel = viewer.mouseWheel.bind(viewer), false);
    }
    this.startTouches = null;
    this.lastScale = null;

    this.startPoint = null;
  }

  refresh() {

  }

  reset() {

  }

  eventToPoint(event) {
    let point = {x: event.clientX, y: event.clientY};

    point.x = point.x - this.app.viewerContainer[0].getBoundingClientRect().left;
    point.y = point.y - this.app.viewerContainer[0].getBoundingClientRect().top;
    return {
      raw: point
    }
  }

  mouseMove(event) {
    event = utils.fixMouseEvent(event);
    this.pinchMove(event);
    if (this.pinchZoomDirty === true) {
      event.preventDefault();
    }
    if (this.startPoint && this.pinchZoomDirty != true) {
      this.pan(this.eventToPoint(event));
      event.preventDefault();
    }

  }

  mouseDown(event) {
    event = utils.fixMouseEvent(event);
    this.pinchDown(event);
    this.startPoint = this.eventToPoint(event);
  }

  mouseUp(event) {
    event = utils.fixMouseEvent(event);
    let viewer = this;
    if (viewer.pinchZoomDirty === true) {
      event.preventDefault();
    }
    let point = viewer.eventToPoint(event);
    let element = event.target || event.originalTarget; //check to see if the clicked element is a link, if so skip turn
    let isClick = viewer.startPoint && point.x === viewer.startPoint.x && point.y === viewer.startPoint.y && element.nodeName !== "A";
    if (event.ctrlKey === true && isClick) {
      this.zoomOnPoint(point);
    }

    this.pinchUp(event);
    this.startPoint = null;
  }

  pinchDown(event) {
    if (event.touches != null && event.touches.length == 2 && this.startTouches == null) {
      this.startTouches = utils.getTouches(event);
      this.app.viewer.zoomCenter = utils.getVectorAvg(utils.getTouches(event, this.parentElement.offset()));
      this.lastScale = 1;
    }
  }

  pinchUp(event) {
    if (event.touches != null && event.touches.length < 2 && this.pinchZoomDirty == true) {

      this.app.viewer.lastScale = this.lastScale;
      this.app.container.removeClass("df-pinch-zoom");
      this.updateTemporaryScale(true);
      this.app.zoom();
      this.lastScale = null;
      this.app.viewer.canSwipe = false;
      this.pinchZoomDirty = false;
      this.app.viewer._pinchZoomLastScale = null;
      this.startTouches = null;
    }
  }

  pinchMove(event) {
    if (event.touches != null && event.touches.length == 2 && this.startTouches != null) {
      this.pinchZoomDirty = true;
      this.app.container.addClass("df-pinch-zoom");
      var newScale = utils.calculateScale(this.startTouches, utils.getTouches(event)),
        scale = newScale / this.lastScale;
      this.lastScale = newScale;
      this.app.viewer.pinchZoomUpdateScale = utils.limitAt(newScale, this.app.viewer.minZoom / this.app.zoomValue, this.app.viewer.maxZoom / this.app.zoomValue);

      if (this.app.viewer._pinchZoomLastScale != this.app.viewer.pinchZoomUpdateScale) {
        this.app.viewer.pinchZoomRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;
        this.app.viewer._pinchZoomLastScale = this.app.viewer.pinchZoomUpdateScale;
      }

      event.preventDefault();
      return;
    }
  }

  updateTemporaryScale(reset = false) {
    // return;
    if (reset === true) {
      this.parentElement[0].style.transform = "none";
    }
    else if (this.app.viewer.zoomCenter) {
      let scale = this.app.viewer.pinchZoomUpdateScale;
      this.parentElement[0].style.transformOrigin = this.app.viewer.zoomCenter.x + "px " + this.app.viewer.zoomCenter.y + "px";
      this.parentElement[0].style.transform = "scale3d(" + scale + "," + scale + ",1)";
    }
  }

  pan(point, reset = false) {
    this.panRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;
    utils.pan(this, point, reset);
  }

  updatePan() {
    this.element.css({
      transform: "translate3d(" + this.left + "px," + this.top + "px,0)"
    });
  }

  dblclick(event) {

  }

  onScroll(event) {

  }

  mouseWheel(event) {
    let viewer = this,
      app = this.app,
      delta = utils.getMouseDelta(event);

    //detect trackpad or CTRL + mouse scroll zoom, both use CTRL + scroll method
    var isValidZoomKey = event.ctrlKey === true;
    var isValidZoomOption = app.options.mouseScrollAction === DEARVIEWER.MOUSE_SCROLL_ACTIONS.ZOOM && (app.options.isLightBox === true || app.isFullscreen === true);

    //if it CTRL mousewheel. it is zoom.
    if (isValidZoomKey || isValidZoomOption) {
      if (delta > 0 || delta < 0) {
        event.preventDefault();
        app.viewer.zoomCenter = this.eventToPoint(event).raw;
        app.zoom(delta);

        app.ui.update();
      }
    }
    else if (app.options.mouseScrollAction === DEARVIEWER.MOUSE_SCROLL_ACTIONS.NAV) {
      if (delta > 0) {
        app.next();
      }
      else if (delta < 0) {
        app.prev();
      }
    }
  }

  zoomOnPoint(point) {
    this.app.viewer.zoomCenter = point.raw;
    this.app.zoom(1);
  }

  getVisiblePages() {
    this.visiblePagesCache = [];
    return {main: this.visiblePagesCache, buffer: []};
  }

  getBasePage() {
    return this.app.currentPageNumber;
  }

  isFirstPage(pageNumber) {
    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;
    return pageNumber === 1;
  }

  isLastPage(pageNumber) {
    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;
    return pageNumber === this.app.pageCount;
  }

  isEdgePage(pageNumber) {
    if (pageNumber === void 0)
      pageNumber = this.app.currentPageNumber;
    return pageNumber === 1 || pageNumber === this.app.pageCount;
  }

  checkRequestQueue() {

    let REQUEST_STATUS = DEARVIEWER.REQUEST_STATUS;

    if (this.panRequestStatus === REQUEST_STATUS.ON) {
      this.updatePan();
      this.panRequestStatus = REQUEST_STATUS.OFF;
    }

    if (this.app.viewer.pinchZoomRequestStatus === REQUEST_STATUS.ON) {
      this.app.viewer.updateTemporaryScale();
      this.app.viewer.pinchZoomRequestStatus = REQUEST_STATUS.OFF;
    }

  }

  isAnimating() {
    return false;
  }

  updatePendingStatusClass(status) {
    if (status === void 0)
      status = this.isAnimating();

    this.app.container.toggleClass("df-pending", status);
  }

  initPages() {

  }

  resize() {

  }

  determinePageMode() {

  }

  zoom() {

  }

  gotoPageCallBack() {
    this.requestRefresh();
  }

  requestRefresh(status = true) {
    this.app.refreshRequestStatus = status === true ? DV.REQUEST_STATUS.ON : DV.REQUEST_STATUS.OFF;
  }

  getPageByNumber(pageNumber) {
    let pages = this.pages,
      page = undefined;
    if (this.app.isValidPage(pageNumber)) {
      for (let count = 0; count < pages.length; count++) {
        if (pageNumber === pages[count].pageNumber) {
          page = pages[count];
          break;
        }
      }
    }
    return page;
  }

  changeAnnotation() {
    return false;
  }

  getAnnotationElement(pageNumber, clean = false) {
    let page = this.getPageByNumber(pageNumber);
    if (page === undefined) return undefined;

    if (page.annotationElement === undefined) {
      page.annotationElement = jQuery("<div class='df-link-content'>");
      page.contentLayer.append(page.annotationElement);
    }
    if (clean === true) {
      page.annotationElement.html("");
    }
    return page.annotationElement[0];
  }

  getTextElement(pageNumber, clean = false) {
    let page = this.getPageByNumber(pageNumber);
    if (page === undefined) return undefined;

    if (page.textElement === undefined) {
      page.textElement = jQuery("<div class='df-text-content'>");
      page.contentLayer.append(page.textElement);
    }
    if (clean === true) {//if clean is not done early, old annotations are displayed until the page is loaded + until new annotation is displayed
      page.textElement.html("");
      page.textElement.siblings(".df-auto-link-content").html("");
    }
    return page.textElement[0];
  }

  render() {

  }

  textureLoadedCallback(param) {

  }

  handleZoom() {

  }

  getTextureSize(param) {
    console.error("Texture calculation missing!");
  }

  textureHeightLimit(height) {
    return utils.limitAt(height, 1, this.app.dimensions.maxTextureHeight);
  }

  textureWidthLimit(width) {
    return utils.limitAt(width, 1, this.app.dimensions.maxTextureWidth);
  }

  setPage(param) {
    utils.log("Set Page detected", param.pageNumber);
    let page = this.getPageByNumber(param.pageNumber);
    if (page) {
      // page.texturePageNumber = param.pageNumber;
      param.callback = this.textureLoadedCallback.bind(this);
      page.loadTexture(param);
      this.updateBuffer(page);
      return true;
    }
    return false;
  }

  cleanPage(pageNumber) {
    return true;
  }

  /**
   * Check if the Page change request really makes a page change if not returns false
   * @param pageNumber
   * @returns {boolean}
   */
  validatePageChange(pageNumber) {
    //Fixes issue #40 - validates only if the pageNumber has changed
    return pageNumber !== this.app.currentPageNumber;
  }

  afterControlUpdate() {

  }

  searchPage(pageNumber) {
    return {include: true, label: this.app.provider.getLabelforPage(pageNumber)}
  }
}

export {BaseViewer};
