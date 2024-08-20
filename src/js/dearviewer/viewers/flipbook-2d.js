/*Stage collects events and passed to respective implementation*/
import {DEARVIEWER} from "../defaults.js";
import {BaseFlipBookViewer, BookSheet} from "./flipbook.js";
import {Page2D} from "./page.js";

let DV = DEARVIEWER;
let utils = DV.utils;

class BookSheet2D extends BookSheet {
  constructor(options) {
    super(options);
    this.init();
  }

  init() {
    let sheet = this, div = '<div>';

    let element = sheet.element = jQuery(div, {class: 'df-sheet'});
    let frontPage = sheet.frontPage = new Page2D();
    frontPage.element.addClass('df-page-front');
    let backPage = sheet.backPage = new Page2D();
    backPage.element.addClass('df-page-back');

    let wrapper = sheet.wrapper = jQuery(div, {class: "df-sheet-wrapper"});

    let foldInnerShadow = sheet.foldInnerShadow = jQuery(div, {class: "df-sheet-fold-inner-shadow"});
    let foldOuterShadow = sheet.foldOuterShadow = jQuery(div, {class: "df-sheet-fold-outer-shadow"});


    this.parentElement.append(element);

    element.append(wrapper);
    element.append(foldOuterShadow);

    wrapper.append(frontPage.element);
    wrapper.append(backPage.element);
    wrapper.append(foldInnerShadow);

  }

  updateCSS(css) {
    let page = this;
    page.element.css(css);
  }

  resetCSS() {
    let sheet = this;

    sheet.wrapper.css({
      transform: ''
    });

    sheet.frontPage.resetCSS();

    sheet.backPage.resetCSS();

  }

  updateSize(width, height, top) {

    width = Math.floor(width);
    height = Math.floor(height);
    top = Math.floor(top);

    this.wrapper[0].style.height = this.wrapper[0].style.width = Math.ceil((utils.distOrigin(width, height)) * this.viewer.app.zoomValue) + "px";

    this.element[0].style.height = this.frontPage.element[0].style.height = this.backPage.element[0].style.height = this.foldInnerShadow[0].style.height = height + "px";
    this.element[0].style.width = this.frontPage.element[0].style.width = this.backPage.element[0].style.width = this.foldInnerShadow[0].style.width = width + "px";

    this.element[0].style.transform = 'translateY(' + top + 'px)';

  }

  flip(point) {

    let sheet = this;

    //point is usually null if the flip was made by next or previous without folding
    point = point || sheet.pendingPoint;

    if (sheet == null || sheet.viewer == null) return;

    sheet.isFlipping = true;
    sheet.viewer.flipPage = sheet;
    let isBooklet = sheet.viewer.isBooklet,
      isRight = sheet.side === DEARVIEWER.TURN_DIRECTION.RIGHT,
      isRTL = sheet.viewer.isRTL,
      isBottom = sheet.viewer.corner === DEARVIEWER.TURN_CORNER.BL || sheet.viewer.corner === DEARVIEWER.TURN_CORNER.BR;

    let travelY = isBottom ? sheet.element.height() : 0;
    let fullWidth = sheet.viewer.leftSheetWidth + sheet.viewer.rightSheetWidth;

    let init, angle = 0, end; //stages of flip or fold cancel

    end = sheet.end = (sheet && sheet.animateToReset === true)
                      ? {x: isRight ? fullWidth : 0, y: travelY}
                      : {x: isRight ? 0 : fullWidth, y: travelY};

    sheet.flipEasing = sheet.isHard ? TWEEN.Easing.Quadratic.InOut : TWEEN.Easing.Linear.None;

    let flipDuration = sheet.viewer.app.options.duration; //duration that should take based on distance(calculated below)

    if (sheet.isHard === true) {

      if (point != null) {
        angle = utils.angleByDistance(point.distance, point.fullWidth);
      }

      init = sheet.init = {angle: angle * (isRight ? -1 : 1)};
      end = sheet.end = (sheet && sheet.animateToReset === true)
                        ? {angle: isRight ? 0 : -0}
                        : {angle: isRight ? -180 : 180};

    }
    else {

      if (point == null) {

        init = sheet.init = (sheet && sheet.animateToReset === true)
                            ? {x: isRight ? 0 : fullWidth, y: 0}
                            : {x: isRight ? fullWidth : 0, y: 0};

      }
      else {

        init = sheet.init = {x: point.x, y: point.y, opacity: 1};

        flipDuration = sheet.viewer.app.options.duration * utils.distPoints(init.x, init.y, end.x, end.y) / sheet.viewer.fullWidth;

        flipDuration = utils.limitAt(flipDuration, sheet.viewer.app.options.duration / 3, sheet.viewer.duration);

      }
    }
    init.index = 0;
    end.index = 1;
    sheet.isFlipping = true;

    if (isBooklet && ((!isRight && !isRTL) || (isRight && isRTL)))
      sheet.element[0].style.opacity = 0;

    if (sheet.isHard === true) {
      sheet.currentTween = new TWEEN.Tween(init).delay(0)
        .to(end, sheet.viewer.app.options.duration)
        .onUpdate(function () {
          sheet.updateTween(this);
        }).easing(sheet.flipEasing)
        .onComplete(sheet.completeTween.bind(sheet))
        .start();
    }
    else {
      if (point == null) {
        sheet.currentTween = new TWEEN.Tween(init).delay(0)
          .to(end, sheet.viewer.app.options.duration)
          .onUpdate(function () {
            sheet.updateTween(this);
          }).easing(TWEEN.Easing.Sinusoidal.Out)
          .onComplete(sheet.completeTween.bind(sheet))
          .start();
      }
      else {
        sheet.currentTween = new TWEEN.Tween(init).delay(0)
          .to(end, flipDuration)
          .onUpdate(function () {
            sheet.updateTween(this);
          }).easing(TWEEN.Easing.Sinusoidal.Out)
          .onComplete(sheet.completeTween.bind(sheet))
          .start();
      }
    }
    //page.currentTween.viewer= page;

  };

  updatePoint(point) {
    let sheet = this;

    if (point == null) return;

    //detect the current page
    // let page = page.viewer.dragPage != null ? page.viewer.dragPage
    //   : point.page != null ? point.page : this;

    //get the pageWidth and pageHeight
    let pageWidth = sheet.element.width(),
      pageHeight = sheet.element.height();

    //the corner where the drag started
    let corner = sheet.viewer.corner !== DEARVIEWER.TURN_CORNER.NONE ? sheet.viewer.corner : point.corner,
      corners = DEARVIEWER.TURN_CORNER;

    let
      isRight = sheet.side === DEARVIEWER.TURN_DIRECTION.RIGHT,
      isBottom = (corner === corners.BL) || (corner === corners.BR);

    point.rx = (isRight === true)
               ? (sheet.viewer.leftSheetWidth + pageWidth) - point.x
               : point.x;

    point.ry = (isBottom === true)
               ? pageHeight - point.y
               : point.y;

    let radAngle = Math.atan2(point.ry, point.rx);

    radAngle = Math.PI / 2 - utils.limitAt(radAngle, 0, utils.toRad(90));

    let correctionX = pageWidth - point.rx / 2,

      correctionY = point.ry / 2,

      refLength = Math.max(0,
        Math.sin(radAngle - Math.atan2(correctionY, correctionX)) * utils.distOrigin(correctionX,
          correctionY)),
      //the distance from where the fold starts
      foldLength = 0.5 * utils.distOrigin(point.rx, point.ry);

    let x = Math.ceil(pageWidth - refLength * Math.sin(radAngle)),
      y = Math.ceil(refLength * Math.cos(radAngle)),

      angle = utils.toDeg(radAngle);

    let angle1 = isBottom
                 ? isRight ? 180 + (90 - angle) : 180 + angle
                 : isRight ? angle : 90 - angle;

    let angle2 = isBottom
                 ? isRight ? 180 + (90 - angle) : angle
                 : isRight ? angle + 180 : angle1,
      angleS = isBottom
               ? isRight ? 90 - angle : angle + 90
               : isRight ? angle1 - 90 : angle1 + 180,
      x1 = isRight ? pageWidth - x : x,
      y1 = isBottom ? pageHeight + y : -y,
      x2 = isRight ? -x : x - pageWidth,
      y2 = isBottom ? -pageHeight - y : y;

    let opacity = utils.limitAt(point.distance * 0.5 / pageWidth, 0, 0.5);
    let foldOpacity = utils.limitAt(((sheet.viewer.leftSheetWidth + pageWidth) - point.rx) * 0.5 / pageWidth, 0.05, 0.3);

    sheet.element.addClass("df-folding");

    let front = isRight ? sheet.backPage.element : sheet.frontPage.element;
    let back = isRight ? sheet.frontPage.element : sheet.backPage.element;
    let outerShadow = sheet.foldOuterShadow;
    let innerShadow = sheet.foldInnerShadow;
    sheet.wrapper.css({
      transform: utils.translateStr(x1, y1) + utils.rotateStr(angle1)
    });

    back.css({
      transform: utils.rotateStr(-angle1) + utils.translateStr(-x1, -y1)
    });

    front.css({
      transform: utils.rotateStr(angle2) + utils.translateStr(x2, y2),
      boxShadow: "rgba(0, 0, 0, " + opacity + ") 0px 0px 20px"
    });

    innerShadow.css({
      transform: utils.rotateStr(angle2) + utils.translateStr(x2, y2),
      opacity: foldOpacity / 2,
      backgroundImage: utils.prefix.css + "linear-gradient( " + angleS + "deg, rgba(0, 0, 0, 0.25) , rgb(0, 0, 0) " + foldLength * 0.7 + "px, rgb(255, 255, 255) " + foldLength + "px)"
    });

    outerShadow.css({
      opacity: foldOpacity / 2,
      left: isRight ? "auto" : 0,
      right: isRight ? 0 : "auto",
      backgroundImage: utils.prefix.css + "linear-gradient( " + (-angleS + 180) + "deg, rgba(0, 0, 0,0) " + foldLength / 3 + "px, rgb(0, 0, 0) " + foldLength + "px)"
    });

  }

  updateAngle(angle, isRight) {
    let sheet = this;

    let width = sheet.element.width() * 5;

    sheet.wrapper.css({
      perspective: width,
      perspectiveOrigin: isRight === true ? "0% 50%" : "100% 50%"
    });
    sheet.element.addClass("df-folding");
    sheet.backPage.updateCSS({
      display: (isRight === true ? (angle <= -90 ? 'block' : 'none') : (angle < 90 ? 'block' : 'none')),
      transform: (utils.prefix.dom !== 'MfS' ? "" : "perspective(" + width + "px) ")
        + (isRight === true ? "translateX(-100%) " : "")
        + "rotateY(" + ((isRight === true ? 180 : 0) + angle) + "deg)"
    });
    sheet.frontPage.updateCSS({
      display: (isRight === true ? (angle > -90 ? 'block' : 'none') : (angle >= 90 ? 'block' : 'none')),
      transform: (utils.prefix.dom !== 'MSd' ? "" : "perspective(" + width + "px) ")
        + (isRight === false ? "translateX(100%) " : "")
        + "rotateY(" + ((isRight === false ? -180 : 0) + angle) + "deg)"
    });

  }

  updateTween(tween) {
    let sheet = this;
    let isBooklet = sheet.viewer.isBooklet,
      isRight = sheet.side === DEARVIEWER.TURN_DIRECTION.RIGHT,
      isRTL = sheet.viewer.isRTL;
    let isReset = sheet.animateToReset === true;

    if (sheet.isHard === true) {
      sheet.updateAngle(tween.angle, isRight);
      sheet.angle = tween.angle;
    }
    else {
      sheet.updatePoint({
        x: tween.x,
        y: tween.y
      });
      sheet.x = tween.x;
      sheet.y = tween.y;
    }
    if (isBooklet && !isReset)
      sheet.element[0].style.opacity = (isRight && !isRTL) || (!isRight && isRTL)
                                       ? tween.index > 0.5 ? 2 * (1 - tween.index) : 1
                                       : tween.index < 0.5 ? 2 * tween.index : 1;
  }

  completeTween() {
    let sheet = this;
    if (sheet.isHard === true) {

      sheet.updateAngle(sheet.end.angle);
      sheet.backPage.element.css({display: "block"});
      sheet.frontPage.element.css({display: "block"});

    }
    else {

      sheet.updatePoint({
        x: sheet.end.x,
        y: sheet.end.y
      });

    }
    sheet.element[0].style.opacity = 1;

    if (sheet.animateToReset !== true) {
      sheet.side = sheet.targetSide;
    }
    sheet.reset();
    sheet.viewer.onFlip();
    sheet.viewer.afterFlip();
    sheet.viewer.requestRefresh();
  }


}

class FlipBook2D extends BaseFlipBookViewer {
  constructor(options, appContext) {

    options.viewerClass = options.viewerClass ?? "df-flipbook-2d";
    options.skipViewerLoaded = true;
    super(options, appContext);


    this.bookShadow = jQuery('<div>', {class: 'df-book-shadow'});
    this.wrapper.append(this.bookShadow);
    this.corner = DEARVIEWER.TURN_CORNER.NONE;

    appContext._viewerPrepared();
  }

  init() {
    super.init();
    this.initEvents();
    this.initPages();
  }

  initEvents() {
    this.stageDOM = this.element[0];
    super.initEvents();
  }

  dispose() {
    super.dispose();
    this.element.remove();
  }

  initPages() {
    for (let count = 0; count < this.stackCount; count++) {
      let sheet = new BookSheet2D({
        parentElement: this.wrapper
      });
      sheet.index = count;//just reference for debugging
      sheet.viewer = this;
      this.sheets.push(sheet);
      this.pages.push(sheet.frontPage);
      this.pages.push(sheet.backPage);
    }
  }

  resize() {
    super.resize();

    let viewer = this;
    let dimensions = viewer.app.dimensions;
    let padding = dimensions.padding;

    let zoomHeight = this.availablePageHeight(),
      zoomWidth = this.availablePageWidth(),
      zoomFullWidth = viewer.fullWidth = zoomWidth * 2,
      stageWidth = dimensions.width,
      stageHeight = dimensions.height;

    let shiftHeight = viewer.shiftHeight = Math.ceil(utils.limitAt((zoomHeight - stageHeight + padding.height) / 2, 0, zoomHeight)),
      shiftWidth = viewer.shiftWidth = Math.ceil(utils.limitAt((zoomFullWidth - stageWidth + padding.width) / 2, 0, zoomFullWidth));

    if (viewer.app.zoomValue === 1) { //todo add this line
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
      //marginTop when the flipbook is smaller than the ViewArea it has to center align vertically
      marginTop: Math.max(dimensions.height - zoomHeight - padding.height) / 2,
      height: zoomHeight,
      width: zoomFullWidth - (zoomFullWidth % 2)
    });

    viewer.zoomViewer.resize();

    viewer.centerNeedsUpdate = true;
    viewer.checkCenter(true);
    viewer.pagesReady();
  }

  updateCenter(skipTransition = false) {

    let viewer = this;

    let centerShift = viewer.centerShift,
      isRTL = viewer.isRTL,
      width = this.isLeftPage() ? this.leftSheetWidth : this.rightSheetWidth;

    let end = centerShift * width / 2;

    viewer.seamPosition = (-viewer.app.dimensions.offset.width + viewer.app.dimensions.containerWidth) / 2 + end;

    viewer.wrapperShift = (viewer.isSingle ? -viewer.app.dimensions.stage.innerWidth / 2 : 0) + end;
    viewer.wrapper[0].style.left = viewer.wrapperShift + "px";
    viewer.wrapper[0].style.transition = skipTransition ? "none" : "";

    this.zoomViewer.updateCenter();
  }

  refreshSheet(options) {
    let _sheet = options.sheet,
      sheetPageNumber = options.sheetNumber;

    //Render Pages & flip
    if (_sheet.isFlipping === false) {

      if (options.needsFlip) {

        //this.beforeFlip();

        _sheet.element.addClass("df-flipping");
        _sheet.flip();
      }
      else {
        // page.depth = depth;
        _sheet.skipFlip = false;

        _sheet.element.removeClass("df-flipping df-quick-turn df-folding df-left-side df-right-side");
        _sheet.element.addClass(_sheet.targetSide === DV.TURN_DIRECTION.LEFT ? "df-left-side" : "df-right-side");

        _sheet.side = _sheet.targetSide;

        (_sheet.targetSide === DV.TURN_DIRECTION.LEFT)
        ? _sheet.updateSize(this.leftSheetWidth, this.leftSheetHeight, this.leftSheetTop)
        : _sheet.updateSize(this.rightSheetWidth, this.rightSheetHeight, this.rightSheetTop);
      }

    }

    _sheet.visible = options.visible;

    if (_sheet.isHard) {
      _sheet.element.addClass("df-hard-sheet");
    }
    else {
      _sheet.element.removeClass("df-hard-sheet");
      _sheet.frontPage.updateCSS({display: "block"});
      _sheet.backPage.updateCSS({display: "block"});
    }
    _sheet.updateCSS({
      display: _sheet.visible === true ? "block" : "none",
      zIndex: options.zIndex,
      // transform: ''
    });

    if (_sheet.pendingPoint == null && _sheet.isFlipping === false) {
      _sheet.resetCSS();
    }

    if (sheetPageNumber !== _sheet.pageNumber) {
      _sheet.element.attr("number", sheetPageNumber);
      _sheet.backPage.element.attr("pagenumber", _sheet.backPage.pageNumber);
      _sheet.frontPage.element.attr("pagenumber", _sheet.frontPage.pageNumber);
    }
  }

  eventToPoint(event) {

    let viewer = this;

    event = utils.fixMouseEvent(event);

    // if(event.type==="mouseup"){
    //   let a = "mouseup";
    // }
    let wrapper = viewer.wrapper,
      bRect = wrapper[0].getBoundingClientRect(),
      webgl = viewer.is3D,
      sheets = viewer.sheets,
      dimen = viewer.app.dimensions,
      pageWidth, fullWidth, pageHeight,
      point = {x: event.clientX, y: event.clientY},
      left, top, distance, sheet, sheetDrag, isRight;

    //calculate x and y relative to container
    let pRect = viewer.parentElement[0].getBoundingClientRect();
    point.x = point.x - pRect.left;
    point.y = point.y - pRect.top;

    if (viewer.dragSheet)
      isRight = viewer.dragSheet.side === DV.TURN_DIRECTION.RIGHT;
    else {
      isRight = point.x > viewer.seamPosition;
    }
    pageWidth = isRight ? viewer.rightSheetWidth : viewer.leftSheetWidth;
    pageHeight = isRight ? viewer.rightSheetHeight : viewer.leftSheetHeight;
    fullWidth = viewer.rightSheetWidth + viewer.leftSheetWidth;
    top = isRight ? viewer.rightSheetTop : viewer.leftSheetTop;

    //region old
    //calculate x and y relative to wrapper
    left = point.x - (viewer.seamPosition - viewer.leftSheetWidth);
    top = point.y - (bRect.top - pRect.top) - top;

    distance = (viewer.drag === DV.TURN_DIRECTION.NONE)
               ? left < pageWidth ? left : fullWidth - left
               : viewer.drag === DV.TURN_DIRECTION.LEFT ? left : fullWidth - left;

    sheet = (isRight ? sheets[viewer.stackCount / 2] : sheets[viewer.stackCount / 2 - 1]);

    sheetDrag = left < viewer.foldSense ? DV.TURN_DIRECTION.LEFT
                                        : (left > fullWidth - viewer.foldSense) ? DV.TURN_DIRECTION.RIGHT
                                                                                : DV.TURN_DIRECTION.NONE;

    let x = left,
      y = top,
      h = pageHeight,
      w = fullWidth,
      delta = viewer.foldSense,
      corner;
    //determine the corner
    if (x >= 0 && x < delta) {
      if (y >= 0 && y <= delta)
        corner = DV.TURN_CORNER.TL;
      else if (y >= h - delta && y <= h)
        corner = DV.TURN_CORNER.BL;
      else if (y > delta && y < h - delta)
        corner = DV.TURN_CORNER.L;
      else
        corner = DV.TURN_CORNER.NONE;
    }
    else if (x >= w - delta && x <= w) {
      if (y >= 0 && y <= delta)
        corner = DV.TURN_CORNER.TR;
      else if (y >= h - delta && y <= h)
        corner = DV.TURN_CORNER.BR;
      else if (y > delta && y < h - delta)
        corner = DV.TURN_CORNER.R;
      else
        corner = DV.TURN_CORNER.NONE;
    }
    else
      corner = DV.TURN_CORNER.NONE;

    let returnPoint = {
      isInsideSheet: x >= 0 && x <= w && y >= 0 && y <= h,
      isInsideCorner: corner !== DV.TURN_CORNER.NONE && corner !== DV.TURN_CORNER.L && corner !== DV.TURN_CORNER.R,
      x: webgl ? point.x : left,
      y: webgl ? point.y : top,
      fullWidth: fullWidth,
      sheetWidth: pageWidth,
      sheetHeight: pageHeight,
      rawDistance: fullWidth - left,
      distance: distance,
      sheet: sheet,
      drag: sheetDrag,
      foldSense: viewer.foldSense,
      event: event,
      raw: point,
      corner: corner
    };
    return returnPoint;
  }

  pan(point, reset = false) {
    utils.pan(this, point, reset);
  };

  mouseMove(event) {
    let viewer = this;
    let point = viewer.eventToPoint(event);
    if (event.touches != null && event.touches.length == 2) {
      this.pinchMove(event);
      return;
    }
    //PAN
    if (viewer.app.zoomValue !== 1 && viewer.startPoint != null && viewer.canSwipe === true) {
      viewer.pan(point);
      event.preventDefault();
    }

    /*Magnetic Pull*/
    let targetSheet = viewer.dragSheet || point.sheet;
    if (viewer.flipPage == null && ((viewer.dragSheet != null) || (point.isInsideCorner === true))) {
      if (viewer.dragSheet != null) {
        // utils.log("set mouse down move");
      }
      else {
        point.y = utils.limitAt(point.y, 1, viewer.availablePageHeight() - 1);
        point.x = utils.limitAt(point.x, 1, point.fullWidth - 1);
      }

      let corner = viewer.dragSheet != null ? viewer.corner : point.corner;
      if (targetSheet.isHard) {
        let isRight = corner === DV.TURN_CORNER.BR || corner === DV.TURN_CORNER.TR;

        let angle = utils.angleByDistance(point.distance, point.fullWidth);

        targetSheet.updateAngle(angle * (isRight ? -1 : 1), isRight);

      }
      else {
        targetSheet.updatePoint(point);
      }

      targetSheet.magnetic = true;
      targetSheet.magneticCorner = point.corner;
      event.preventDefault();
      //point.sheet.updatePoint(point);
    }
    /*Magnetic Release*/
    if (viewer.dragSheet == null && targetSheet != null && point.isInsideCorner === false && targetSheet.magnetic === true) {
      targetSheet.pendingPoint = point;
      targetSheet.animateToReset = true;
      targetSheet.magnetic = false;
      viewer.corner = targetSheet.magneticCorner;
      targetSheet.flip(targetSheet.pendingPoint);
      targetSheet.pendingPoint = null;
    }
    //SWIPE
    viewer.checkSwipe(point, event);

  }

  /**
   * Performs:
   * 1. If click is in inside the corner - flip the page
   * 2. If drag is active - complete the flip
   * 3. Clear any swipe flags
   * @param event
   */
  mouseUp(event) {

    let viewer = this;
    if (viewer.startPoint == null) return;

    if (!event.touches && event.button !== 0) return;
    if (viewer.dragSheet == null && event.touches != null && event.touches.length == 0) {
      this.pinchUp(event);
      return;
    }

    let point = viewer.eventToPoint(event);

    //1 - 2 : if there is any page dragging - finish it
    let element = event.target || event.originalTarget; //check to see if the clicked element is a link, if so skip turn
    let isClick = viewer.app.zoomValue === 1
      && point.x === viewer.startPoint.x && point.y === viewer.startPoint.y
      && element.nodeName !== "A";

    if (event.ctrlKey === true && isClick) {
      this.zoomOnPoint(point);
    }
    else if (viewer.dragSheet) {
      event.preventDefault();
      let sheet = viewer.dragSheet;
      sheet.pendingPoint = point;
      viewer.drag = point.drag;
      /*it was a valid CLICK and was inside the corner*/
      if (isClick && (point.isInsideCorner === true || (point.isInsideSheet && viewer.clickAction === DV.MOUSE_CLICK_ACTIONS.NAV))) {
        if (point.corner.indexOf("l") > -1) {
          viewer.app.openLeft();
        }
        else {
          viewer.app.openRight();
        }
      }
      else {
        let _currentPage = this.getBasePage();
        if (point.distance > point.sheetWidth / 2) {
          if (point.sheet.side === DEARVIEWER.TURN_DIRECTION.LEFT) {
            viewer.app.openLeft();
          }
          else {
            viewer.app.openRight();
          }
        }
        //if no flip occurred reset the pages.
        if (_currentPage === this.getBasePage()) {
          sheet.animateToReset = true;
          sheet.flip(point);
        }
      }
      viewer.dragSheet = null;
      sheet.magnetic = false;
    }
    else if (isClick && !point.sheet.isFlipping && point.isInsideSheet && viewer.clickAction === DV.MOUSE_CLICK_ACTIONS.NAV) {
      if (point.sheet.side === "left") {
        viewer.app.openLeft();
      }
      else {
        viewer.app.openRight();
      }
    }
    /*3 if there is swipe - clean*/
    viewer.startPoint = null;
    viewer.canSwipe = false;

    viewer.drag = DV.TURN_DIRECTION.NONE;
  }

  mouseDown(event) {
    if (!event.touches && event.button !== 0) return;
    if (event.touches != null && event.touches.length == 2) {
      this.pinchDown(event);
      return;
    }
    let viewer = this;
    let point = viewer.eventToPoint(event);
    viewer.startPoint = point;
    viewer.lastPosX = point.x;
    viewer.lastPosY = point.y;

    if (point.isInsideCorner && viewer.flipPage == null) {
      viewer.dragSheet = point.sheet;
      viewer.drag = point.drag;
      viewer.corner = point.corner;

      if (point.sheet.pageNumber === 0) {
        viewer.bookShadow.css({
          width: '50%',
          left: viewer.app.isRTL ? 0 : '50%',
          transitionDelay: ''
        });
      }
      else if (point.sheet.pageNumber === Math.ceil(viewer.app.pageCount / 2) - 1) {
        viewer.bookShadow.css({
          width: '50%',
          left: viewer.app.isRTL ? '50%' : 0,
          transitionDelay: ''
        });
      }

    }
    else {
      viewer.canSwipe = true;
    }

  }

  onScroll(event) {

  }

  resetPageTween() {
    let viewer = this;
    for (let _pageCount = 0; _pageCount < viewer.stackCount; _pageCount++) {
      let sheets = viewer.sheets[_pageCount];
      if (sheets.currentTween) {
        sheets.currentTween.complete(true);
      }
    }
    viewer.requestRefresh();
  }

  pagesReady() {
    if (this.isFlipping()) return;
    if (this.app.options.flipbookFitPages === false) {
      let basePage = this.app.viewer.getBasePage();
      let leftViewPort = this.leftViewport = this.getViewPort(basePage + (this.isBooklet ? 0 : (this.isRTL ? 1 : 0))),
        rightViewPort = this.rightViewPort = this.getViewPort(basePage + (this.isBooklet ? 0 : (this.isRTL ? 0 : 1)));

      if (leftViewPort) {
        let leftDimen = utils.contain(leftViewPort.width, leftViewPort.height, this.availablePageWidth(), this.availablePageHeight());
        this.leftSheetWidth = Math.floor(leftDimen.width);
        this.leftSheetHeight = Math.floor(leftDimen.height);
        this.leftSheetTop = (this.availablePageHeight() - this.leftSheetHeight) / 2;
      }
      if (rightViewPort) {
        let rightDimen = utils.contain(rightViewPort.width, rightViewPort.height, this.availablePageWidth(), this.availablePageHeight());
        this.rightSheetWidth = Math.floor(rightDimen.width);
        this.rightSheetHeight = Math.floor(rightDimen.height);
        this.rightSheetTop = (this.availablePageHeight() - this.rightSheetHeight) / 2;
      }
      this.totalSheetsWidth = this.leftSheetWidth + this.rightSheetWidth;

      for (let i = 0; i < this.sheets.length; i++) {
        let sheet = this.sheets[i];
        if (sheet.side === DV.TURN_DIRECTION.LEFT) {
          sheet.updateSize(this.leftSheetWidth, this.leftSheetHeight, this.leftSheetTop);
        }
        else {
          sheet.updateSize(this.rightSheetWidth, this.rightSheetHeight, this.rightSheetTop);
        }
      }
    }
    this.updateCenter();
    this.updatePendingStatusClass();
  }

  textureLoadedCallback(param) {
    let page = this.getPageByNumber(param.pageNumber);
    this.pagesReady();
  }
}

export {BaseFlipBookViewer, BookSheet2D, FlipBook2D};
