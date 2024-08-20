import {DEARVIEWER} from "../defaults.js";
import {FlipBook2D, BookSheet2D} from "./flipbook-2d.js";
import {Page2D} from "./page.js";

let utils = DEARVIEWER.utils;

class SliderPage extends BookSheet2D {

  init() {
    let sheet = this, div = '<div>';

    let element = sheet.element = jQuery(div, {class: 'df-sheet'});
    let frontPage = sheet.frontPage = new Page2D();
    frontPage.element.addClass('df-page-front').appendTo(sheet.element);
    let backPage = sheet.backPage = new Page2D();
    backPage.element.addClass('df-page-back').appendTo(sheet.element);

    this.parentElement.append(element);

    this.frontPage.sheet = this.backPage.sheet = this;
  }

  completeTween() {
    var sheet = this;
    sheet.isFlipping = false;
    sheet.viewer.onFlip();
    sheet.viewer.afterFlip();
    sheet.viewer.requestRefresh();
    sheet.element[0].style.opacity = 1;
  }

  flip(point) {
    var sheet = this;
    sheet.side = sheet.targetSide;
    this.completeTween();
  }

  updateSize(width, height, top) {
    width = Math.floor(width);
    height = Math.floor(height);
    top = Math.floor(top);

    this.element[0].style.height = this.frontPage.element[0].style.height = height + "px";
    this.element[0].style.width = this.frontPage.element[0].style.width = width + "px";

    this.element[0].style.transform = 'translateX(' + this.positionX + 'px) translateY(' + top + 'px)';
  }
}

class Slider extends FlipBook2D {
  constructor(options, appContext) {
    options.viewerClass = "df-slider";
    options.pageMode = DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
    options.singlePageMode = DEARVIEWER.FLIPBOOK_SINGLE_PAGE_MODE.BOOKLET;
    options.pageSize = DEARVIEWER.FLIPBOOK_PAGE_SIZE.SINGLE;
    super(options, appContext);
    this.stackCount = 10;
    this.soundOn = false;

    this.foldSense = 0;
    appContext._viewerPrepared();
  }

  initPages() {
    for (let count = 0; count < this.stackCount; count++) {
      let sheet = new SliderPage({
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
    this.skipTransition = true;
  }

  refreshSheet(options) {
    let _sheet = options.sheet,
      sheetPageNumber = options.sheetNumber;
    _sheet.element.toggleClass("df-no-transition", _sheet.skipFlip || this.skipTransition);
    //Render Pages & flip
    if (_sheet.isFlipping === false) {

      if (options.needsFlip) {
        _sheet.flip();
      }
      else {
        // page.depth = depth;
        _sheet.skipFlip = false;

        _sheet.element.removeClass("df-flipping df-quick-turn df-folding df-left-side df-right-side");
        _sheet.element.addClass(_sheet.targetSide === DEARVIEWER.TURN_DIRECTION.LEFT ? "df-left-side"
                                                                                     : "df-right-side");

        _sheet.side = _sheet.targetSide;
      }

    }

    _sheet.visible = options.visible;

    _sheet.updateCSS({
      display: options.sheetNumber > 0 && options.sheetNumber <= this.app.pageCount ? "block" : "none",
      zIndex: options.zIndex,
    });

    if (sheetPageNumber !== _sheet.pageNumber) {
      _sheet.element.attr("number", sheetPageNumber);
      _sheet.backPage.element.attr("pagenumber", _sheet.backPage.pageNumber);
      _sheet.frontPage.element.attr("pagenumber", _sheet.frontPage.pageNumber);
    }
  }

  refresh() {
    super.refresh();
    this.skipTransition = false;
  }

  eventToPoint(event) {
    var point = super.eventToPoint(event);
    //setting isInsideSheet == true call every other match as right page slide
    point.isInsideSheet = jQuery(event.srcElement).closest(".df-page").length > 0;
    point.isInsideCorner = false;
    return point;
  }

  initCustomControls() {
    //added so that sound is removed
    let ui = this.app.ui;
    let controls = ui.controls;
    if (controls.pageMode)
      controls.pageMode.hide();
  }

  setPageMode(args) {
    args.isSingle = true;
    super.setPageMode(args);
  }

  pagesReady() {
    if (this.isFlipping()) return;
    var leftPos = 0, rightPos = 0;
    var app = this.app;
    var midpoint = Math.floor(this.stackCount / 2);
    let pages = [];
    let page = app.currentPageNumber;
    for (let _count = 0; _count < this.stackCount / 2; _count++) {
      pages.push(page + _count);
      pages.push(page - _count - 1);
    }
    for (let i = 0; i < this.stackCount; i++) {
      let pageNumber = pages[i];
      let page = this.getPageByNumber(pageNumber);
      if (page) {
        let sheet = this.getPageByNumber(pageNumber).sheet;

        let viewPort = this.getViewPort(sheet.pageNumber, true);
        let size = utils.contain(viewPort.width, viewPort.height, this.availablePageWidth(), this.availablePageHeight());
        if (app.currentPageNumber === sheet.pageNumber) {
          this.leftSheetWidth = this.rightSheetWidth = Math.floor(size.width);
        }
        if (app.currentPageNumber > sheet.pageNumber) {
          leftPos -= Math.floor(size.width) + 10;
          sheet.positionX = leftPos;
        }
        else {
          sheet.positionX = rightPos;
          rightPos += Math.floor(size.width) + 10;
        }
        let top = (this.availablePageHeight() - size.height) / 2;

        sheet.updateSize(Math.floor(size.width * app.zoomValue), Math.floor(size.height * app.zoomValue), top);
      }
    }
    this.updateCenter();
    this.updatePendingStatusClass();
  }

}

export {Slider};
