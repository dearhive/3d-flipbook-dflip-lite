import {DEARVIEWER} from "../defaults.js";
import {BaseViewer} from "./base-viewer.js";
import {Page2D} from "./page.js";

let utils = DEARVIEWER.utils;

class Reader extends BaseViewer {
  constructor(options, appContext) {
    options.viewerClass = "df-reader";
    appContext.options.mouseScrollAction = DEARVIEWER.MOUSE_SCROLL_ACTIONS.NONE;
    super(options, appContext);
    this.app.jumpStep = 1;
    this.minZoom = 0.25;
    this.stackCount = this.app.pageCount;
    this.app.options.paddingLeft = 0;
    this.app.options.paddingRight = 0;
    this.app.options.paddingTop = 10;
    this.app.options.paddingBottom = this.app.options.controlsFloating === true ? 20 : 10;

    this.app.pageScaling = this.app.options.pageScale;
    this.acceptAppMouseEvents = true; //fixes #236 doublemouse events were passed

    this.scrollStatus = DEARVIEWER.REQUEST_STATUS.OFF;
    this.deltaPanX = 0;
    this.deltaPanY = 0;
    // this.app.options.pageSize = DEARVIEWER.PAGE_
    // this.app.options.hideControls = "zoomIn,zoomOut";
    appContext._viewerPrepared();
    this.zoomViewer = this; //todo zoomviewer is a bad idea at base
  }

  init() {
    super.init();
    this.initEvents();
    this.initPages();
    this.initScrollBar();
  }

  initEvents() {
    this.stageDOM = this.element[0];
    super.initEvents();
  }

  initPages() {
    this.stackCount = this.app.pageCount;
    for (let count = 0; count < this.stackCount; count++) {
      let page = new Page2D({
        parentElement: this.wrapper
      });
      page.index = count;//just reference for debugging
      page.viewer = this;
      this.pages.push(page);
    }
  }

  initScrollBar() {
    this.scrollBar = jQuery("<div class='df-reader-scrollbar'>");
    //adding scrollbar to viewer.wrapper doesn't fit properly with mobile momentum scroll, shaky movement is detected
    this.scrollBar.appendTo(this.app.container);
    //solved #237
    this.scrollPageNumber = jQuery("<div class='df-reader-scroll-page-number'>").appendTo(this.app.container);
  }

  afterControlUpdate() {
    if (this.scrollBar === void 0) return;
    this.scrollBar[0].innerHTML = this.app.getCurrentLabel();
    if (this.app.provider.pageLabels) {
      this.scrollPageNumber[0].innerHTML = this.app.getCurrentLabel() + "<div>(" + this.app.currentPageNumber + " of " + this.app.pageCount + ")</div>";
    }
    else {
      this.scrollPageNumber[0].innerHTML = this.app.getCurrentLabel() + "<div>of " + this.app.pageCount + "</div>";
    }
  }

  updateBuffer(page) {

    if (page.textureStamp === "-1" || page.pageNumber === void 0)
      return;

    let index = page.pageNumber,
      farthest = page.pageNumber,
      farthestIndex = 0;

    for (let count = 0; count < this.pageBuffer.length; count++) {
      var _pageNumber = this.pageBuffer[count].pageNumber;
      if (index === _pageNumber) {
        utils.log("Page " + index + " already in buffer, skipping");
        return;
      }
      if (Math.abs(this.app.currentPageNumber - _pageNumber) > Math.abs(this.app.currentPageNumber - farthest)) {
        farthest = _pageNumber;
        farthestIndex = count;
      }
    }

    this.pageBuffer.push(page);

    if (this.pageBuffer.length > this.pageBufferSize) {
      utils.log("Farthest buffer: " + farthest);
      this.pageBuffer[farthestIndex].reset();
      this.pageBuffer.splice(farthestIndex, 1);
    }

  }

  initCustomControls() {
    let ui = this.app.ui;
    let controls = ui.controls;
    controls.openRight.hide();
    controls.openLeft.hide();
  }

  dispose() {
    super.dispose();
    if (this.scrollBar) this.scrollBar.remove();
    if (this.scrollPageNumber) this.scrollPageNumber.remove();
    this.element.remove();

  }

  _getInnerHeight() {
    let height = super._getInnerHeight(),
      appHeight = this.app.dimensions.maxHeight - this.app.dimensions.padding.height;

    let viewPort = this.app.dimensions.defaultPage.viewPort;

    let maxWidth = this.app.dimensions.containerWidth - 20 - this.app.dimensions.padding.width;
    if (this.app.pageScaling === DEARVIEWER.PAGE_SCALE.ACTUAL)
      maxWidth = this.app.provider.defaultPage.viewPort.width * 1;

    //if it's page fit it's from the available height
    let maxHeight = appHeight;

    if (this.app.pageScaling === DEARVIEWER.PAGE_SCALE.PAGE_WIDTH)
      maxHeight = viewPort.height * 100;
    else if (this.app.pageScaling === DEARVIEWER.PAGE_SCALE.AUTO)
      maxHeight = viewPort.height * 1.5;
    else if (this.app.pageScaling === DEARVIEWER.PAGE_SCALE.ACTUAL)
      maxHeight = viewPort.height * 1;

    maxHeight = maxHeight - 2;
    this._containCover = utils.contain(viewPort.width,
      viewPort.height,
      maxWidth,
      maxHeight);

    maxHeight = Math.min(appHeight, this._containCover.height + 2);

    this.app.pageScaleValue = this._containCover.height / viewPort.height;

    return this.app.dimensions.isFixedHeight
           ? appHeight
           : maxHeight;
  }

  handleZoom() {
    let app = this.app;

    let maxZoom = this.maxZoom = 4,//app.dimensions.maxTextureHeight / this._containCover.height,
      // todo find a solution than can land properly in zoom value 1.
      zoomValue = app.zoomValue;

    if (app.pendingZoom === true && app.zoomDelta != null) {
      let delta = app.zoomDelta;
      zoomValue = delta > 0 ? zoomValue * app.options.zoomRatio : zoomValue / app.options.zoomRatio;
    }
    else if (this.lastScale != null) {
      zoomValue *= this.lastScale;
      this.lastScale = null;
    }
    zoomValue = utils.limitAt(zoomValue, this.minZoom, maxZoom);
    app.zoomValueChange = zoomValue / app.zoomValue;
    app.zoomChanged = app.zoomValue !== zoomValue;

    app.zoomValue = zoomValue;


  }

  resize() {
    let viewer = this;
    let app = viewer.app;
    let dimensions = app.dimensions,
      padding = app.dimensions.padding;

    let shiftHeight = this.shiftHeight = 0,
      shiftWidth = 0;
    this.element.css({
      top: -shiftHeight,
      bottom: -shiftHeight,
      right: -shiftWidth, //+ (isRTL ? sideShift : 0),
      left: -shiftWidth,//(isRTL ? 0 : sideShift),
      paddingTop: padding.top,
      paddingRight: padding.right,
      paddingBottom: padding.bottom,
      paddingLeft: padding.left
    });

    let topVisiblePage = viewer.getVisiblePages().main[0] - 1;
    topVisiblePage = viewer.pages[topVisiblePage].element[0];
    let rect = topVisiblePage.getBoundingClientRect();
    let rectParent = this.parentElement[0].getBoundingClientRect();

    for (let count = 0; count < viewer.pages.length; count++) {
      let page = viewer.pages[count];
      let viewPort = viewer.getViewPort(count + 1, true);

      // page.element
      var els = page.element[0].style;
      els.height = Math.floor(viewPort.height * app.pageScaleValue * app.zoomValue) + "px";
      els.width = Math.floor(viewPort.width * app.pageScaleValue * app.zoomValue) + "px";
    }

    if (viewer.oldScrollHeight != viewer.element[0].scrollHeight && viewer.oldScrollHeight !== void 0) {
      let delta = viewer.element[0].scrollHeight / viewer.oldScrollHeight;
      viewer.skipScrollCheck = true;
      let top = topVisiblePage.offsetTop + topVisiblePage.clientTop - (rect.top - rectParent.top + topVisiblePage.clientTop) * delta,
        left = topVisiblePage.offsetLeft + topVisiblePage.clientLeft - (rect.left - rectParent.left + topVisiblePage.clientLeft) * delta;

      //10 is margin that zooms too and reset to 10
      top += (delta - 1) * (10) / 2;
      left += (delta - 1) * (10) / 2;

      this.zoomCenter = this.zoomCenter ?? {
        x: 0,//(viewer.element[0].offsetWidth) / 2,
        y: 0 //(viewer.element[0].offsetHeight) / 2
      }

      //if pinch zoom , then move to center
      top += (delta - 1) * this.zoomCenter.y;
      left += (delta - 1) * this.zoomCenter.x;
      this.zoomCenter = null;

      viewer.element[0].scrollTop = top;
      viewer.element[0].scrollLeft = left;
      viewer.skipScrollCheck = false;
    }
    viewer.oldScrollHeight = viewer.element[0].scrollHeight;

    // this.updatePendingStatusClass();
    this.scrollBar[0].style.transform = "none";
    this.updateScrollBar();
  }

  onReady() {
    this.gotoPageCallBack();
    this.oldScrollHeight = this.element[0].scrollHeight;
  }

  refresh() {
    let viewer = this;
    let app = this.app;
    let visible = viewer.getVisiblePages().main;

    for (let _pageCount = 0; _pageCount < visible.length; _pageCount++) {
      let page,
        _pageNumber = visible[_pageCount];
      page = viewer.pages[_pageNumber - 1];

      let pageChanged = _pageNumber !== page.pageNumber;

      //Determine Page Situation
      if (pageChanged) {

        //texture reset
        page.resetTexture();

        this.app.textureRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;
      }

      page.element.attr("number", _pageNumber);
      page.pageNumber = _pageNumber;
      // page.name = _pageNumber.toString();
    }

    viewer.requestRefresh(false);
    app.textureRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;
    // viewer.element.toggleClass("df-noscroll", !(viewer.element[0].scrollHeight > viewer.element[0].offsetHeight));
  }

  isAnimating() {
    // if (this.scrollStatus === DEARVIEWER.REQUEST_STATUS.ON) console.log("animating");
    return this.scrollStatus === DEARVIEWER.REQUEST_STATUS.ON || this.scrollStatus === DEARVIEWER.REQUEST_STATUS.COUNT;
  }

  checkRequestQueue() {
    super.checkRequestQueue();
    if (this.scrollStatus === DEARVIEWER.REQUEST_STATUS.ON) {
      this.scrollStatus = DEARVIEWER.REQUEST_STATUS.OFF;
    }
    if (this.scrollStatus === DEARVIEWER.REQUEST_STATUS.COUNT) { //skip one beat
      this.scrollStatus = DEARVIEWER.REQUEST_STATUS.ON;
    }
  }

  isActivePage(pageNumber) {
    return this.visiblePagesCache !== void 0 && this.visiblePagesCache.includes(pageNumber);
  }

  getVisiblePages() {

    var visiblePages = utils.getVisibleElements({
      container: this.element[0],
      elements: this.wrapper[0].children
    });
    if (visiblePages.length === 0) {
      visiblePages = [this.app.currentPageNumber];
    }
    else {
      visiblePages = visiblePages.splice(0, this.pageBufferSize)
    }
    this.visiblePagesCache = visiblePages;
    return {
      main: visiblePages,
      buffer: []
    };

  }

  getPageByNumber(pageNumber) {

    let page = this.pages[pageNumber - 1];
    if (page === undefined) {
      utils.log("Page Not found for: " + pageNumber);
    }
    return page;
  }

  onScroll(event) {

    let viewer = this;
    let center = viewer.element[0].scrollTop + viewer.app.dimensions.containerHeight / 2; // Triggers reflow

    let visible = viewer.getVisiblePages().main;
    let pageIndex = visible[0];
    for (let i = 0; i < visible.length; i++) {
      pageIndex = visible[i];
      let element = viewer.pages[pageIndex - 1].element[0];
      let top = element.offsetTop + element.clientTop;
      if (top <= center && element.clientHeight + top >= center) { //page starts before center and ends after center
        break;
      }
      else if (i > 0 && top > center && element.clientHeight + top >= center) { //page has crossed center
        pageIndex = visible[i - 1];
        break;
      }
    }
    viewer.skipScrollIntoView = true;
    viewer.app.gotoPage(pageIndex);
    viewer.skipScrollIntoView = false;
    viewer.updateScrollBar();
    event.preventDefault && event.preventDefault();
    event.stopPropagation();
    viewer.requestRefresh();
    this.scrollStatus = DEARVIEWER.REQUEST_STATUS.COUNT;
    DEARVIEWER.handlePopup(viewer.element, false);
  }

  updateScrollBar() {
    let el = this.element[0],
      container = this.app.container[0],
      top = 60,
      bottom = 60,
      height = 40;
    // this.scrollBar[0].style.top = (el.scrollTop + ((el.offsetHeight - height) * el.scrollTop / (el.scrollHeight - el.offsetHeight))) + "px";
    // this.scrollBar[0].style.top = (el.scrollTop + top + ((el.offsetHeight - height - top - bottom) * el.scrollTop / (el.scrollHeight - el.offsetHeight))) + "px";
    // this.scrollBar[0].style.right = -el.scrollLeft + "px";
    let x = el.scrollLeft,
      y = (top + ((el.offsetHeight - height - top - bottom) * el.scrollTop / (el.scrollHeight - el.offsetHeight)));

    if (isNaN(y)) { y = top; }

    this.scrollBar.lastY = y;
    this.scrollBar[0].style.transform = 'translateY(' + y + 'px)';

  }

  validatePageChange(pageNumber) {
    true;
  }

  gotoPageCallBack() {
    let viewer = this;
    if (viewer.skipScrollIntoView !== true) {
      let page = viewer.getPageByNumber(viewer.app.currentPageNumber);
      if (page != null) utils.scrollIntoView(page.element[0], viewer.element[0]);
    }
    viewer.skipScrollIntoView = false;
    viewer.requestRefresh();
  }

  getTextureSize(param) {
    let viewPort = this.app.provider.viewPorts[1];
    if (this.app.provider.viewPorts[param.pageNumber]) {
      viewPort = this.app.provider.viewPorts[param.pageNumber];
    }
    let pixelRatio = this.app.options.pixelRatio;

    return {
      height: viewPort.height * this.app.zoomValue * this.app.pageScaleValue * pixelRatio,
      width: viewPort.width * this.app.zoomValue * this.app.pageScaleValue * pixelRatio
    };
  }

  textureLoadedCallback(param) {
    let page = this.getPageByNumber(param.pageNumber),
      app = this.app;
    let viewPort = this.getViewPort(param.pageNumber, true);

    page.element
      .height(Math.floor(viewPort.height * app.pageScaleValue * app.zoomValue))
      .width(Math.floor(viewPort.width * app.pageScaleValue * app.zoomValue));
  }

  pan(point, reset = false) {
    let viewer = this;
    let origin = viewer.startPoint;
    let deltay = point.raw.y - origin.raw.y,
      deltax = point.raw.x - origin.raw.x;

    viewer.deltaPanY += deltay;
    viewer.deltaPanX += deltax;
    viewer.panRequestStatus = DEARVIEWER.REQUEST_STATUS.ON;

    if (reset === false) {
      viewer.startPoint = point;
    }
  }

  updatePan() {
    this.element[0].scrollTop = this.element[0].scrollTop - this.deltaPanY;
    this.element[0].scrollLeft = this.element[0].scrollLeft - this.deltaPanX;
    this.deltaPanY = 0;
    this.deltaPanX = 0;
  }

  mouseMove(event) {
    // check if scroll bar is moved.
    if (this.startPoint && this.isScrollBarPressed) {
      let _event = utils.fixMouseEvent(event);
      let point = this.eventToPoint(_event)

      let el = this.element[0],
        top = 60,
        bottom = 60,
        height = 40,
        estY = this.scrollBar.lastY - (this.startPoint.raw.y - point.raw.y);

      this.scrollBar.lastY = estY;
      el.scrollTop = (estY - top) * (el.scrollHeight - el.offsetHeight) / (el.offsetHeight - height - top - bottom);
      this.startPoint = point;

      event.preventDefault();
      return;
    }

    //if it's swipe scroll we need to leave goign further and use system swipe-scroll
    if (event.touches && event.touches.length < 2) return;

    super.mouseMove(event);
  }

  mouseDown(event) {
    super.mouseDown(event);
    if (event.srcElement === this.scrollBar[0]) {
      this.isScrollBarPressed = true;
      this.scrollBar.addClass("df-active");
      this.scrollPageNumber.addClass("df-active");
    }
  }

  mouseUp(event) {
    super.mouseUp(event);
    if (this.isScrollBarPressed = true && this.scrollBar) {
      this.isScrollBarPressed = false;
      this.scrollBar.removeClass("df-active");
      this.scrollPageNumber.removeClass("df-active");
    }
  }
}

export {Reader};
