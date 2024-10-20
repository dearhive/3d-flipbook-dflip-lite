/* globals jQuery */
import {DEARVIEWER} from "../defaults.js";

let DV = DEARVIEWER;
let jQuery = DEARVIEWER.jQuery;

let utils = DEARVIEWER.utils,
  REQUEST_STATUS = DEARVIEWER.REQUEST_STATUS;

class UI {
  constructor(options, appContext) {
    this.options = options;
    this.app = appContext;
    this.parentElement = this.app.container;
    this.element = jQuery('<div>', {class: "df-ui"});
    this.leftElement = jQuery('<div>', {class: "df-ui-left"}).appendTo(this.element);
    this.centerElement = jQuery('<div>', {class: "df-ui-center"}).appendTo(this.element);
    this.rightElement = jQuery('<div>', {class: "df-ui-right"}).appendTo(this.element);
    this.parentElement.append(this.element);
    this.events = {};
    this.controls = {};
  }

  init() {
    let ui = this,
      div = '<div>',
      app = this.app,
      controls = this.controls;
    let text = app.options.text,
      icons = app.options.icons;

    ui.createLogo();

    this.openRight = controls.openRight = jQuery(div, {
      class: "df-ui-nav df-ui-next",
      title: (app.isRTL ? text.previousPage : text.nextPage),
      html: '<div class="df-ui-btn ' + icons['next'] + '"></div>'
    })
      .on("click", function () {
        app.openRight();
      });

    this.openLeft = controls.openLeft = jQuery(div, {
      class: "df-ui-nav df-ui-prev",
      title: (app.isRTL ? text.nextPage : text.previousPage),
      html: '<div class="df-ui-btn ' + icons['prev'] + '"></div>'
    })
      .on("click", function () {
        app.openLeft();
      });

    if (app.options.autoPlay == true) {
      this.play = controls.play = utils.createBtn('play', icons['play'], text.play)
        .on("click", function () {
          let el = jQuery(this);
          app.setAutoPlay(!el.hasClass(app.options.icons['pause']));
        });

      app.setAutoPlay(app.options.autoPlayStart);
    }

    this.pageNumber = controls.pageNumber = utils.createBtn('page')
      .on("change", function () {
        app.gotoPageLabel(controls.pageInput.val());
      })
      .on("keyup", function (event) {

        if (event.keyCode === 13) {
          app.gotoPageLabel(controls.pageInput.val());
        }

      });

    let rnd_id = "df_book_page_number_" + Math.ceil(performance.now() / 10);
    this.pageInput = controls.pageInput = jQuery('<input id="' + rnd_id + '" type="text"/>').appendTo(controls.pageNumber);
    this.pageLabel = controls.pageLabel = jQuery('<label for="' + rnd_id + '"></label>').appendTo(controls.pageNumber);

    this.thumbnail = controls.thumbnail = utils.createBtn('thumbnail', icons['thumbnail'], text.toggleThumbnails);
    controls.thumbnail.on("click", function () {
      let el = jQuery(this);
      if (app.thumblist == null) {
        app.initThumbs();
      }

      let thumbContainer = app.thumbContainer;
      thumbContainer.toggleClass("df-sidemenu-visible");
      el.toggleClass('df-active');

      if (el.hasClass("df-active")) {
        el.siblings(".df-active").trigger("click");
        app.thumbRequestStatus = REQUEST_STATUS.ON;
      }
      ui.update();
      if (app.options.sideMenuOverlay === false)
        app.resizeRequestStart();
    }).addClass("df-sidemenu-trigger");

    if (app.hasOutline()) {
      this.outline = controls.outline = utils.createBtn('outline', icons['outline'], text.toggleOutline);
      controls.outline.on("click", function () {
        let el = jQuery(this);
        if (app.outlineViewer == null) {
          app.initOutline();
        }
        if (app.outlineContainer) {
          let outlineContainer = app.outlineContainer;
          el.toggleClass('df-active');
          outlineContainer.toggleClass("df-sidemenu-visible");
          if (el.hasClass("df-active")) {
            el.siblings(".df-active").trigger("click");
          }
          ui.update();
          if (app.options.sideMenuOverlay === false)
            app.resizeRequestStart();
        }
      }).addClass("df-sidemenu-trigger");
    }

    if (app.options.showSearchControl === true && utils.isMobile !== true && typeof app.options.source === 'string') {
      controls.search = utils.createBtn('search', icons['search'], text.search);
      controls.search.on("click", function () {
        let el = jQuery(this);
        if (app.searchContainer == null) {
          app.initSearch();
        }
        if (app.searchContainer) {
          let searchContainer = app.searchContainer;
          el.toggleClass('df-active');
          searchContainer.toggleClass("df-sidemenu-visible");
          if (el.hasClass("df-active")) {
            el.siblings(".df-active").trigger("click");
            app.searchBox.focus();
          }
          ui.update();
          if (app.options.sideMenuOverlay === false)
            app.resizeRequestStart();
        }
      }).addClass("df-sidemenu-trigger");
    }

    let controlsContainer = ui.element;

    this.zoomIn = controls.zoomIn = utils.createBtn('zoomin', icons['zoomin'], text.zoomIn)
      .on("click", function () {
        app.zoom(1);
        ui.update();
      });

    this.zoomOut = controls.zoomOut = utils.createBtn('zoomout', icons['zoomout'], text.zoomOut)
      .on("click", function () {
        app.zoom(-1);
        ui.update();
      });

    this.resetZoom = controls.resetZoom = utils.createBtn('resetzoom', icons['resetzoom'], text.resetZoom)
      .on("click", function () {
        app.resetZoom(-1);
        ui.update();
      });

    /*PAGEMODE/PAGEFIT*/
    if (app.viewer.isFlipBook) { //todo PageMode buttons to be added through viewers
      if (app.pageCount > 2) {
        let isSingle = app.viewer.pageMode === DEARVIEWER.FLIPBOOK_PAGE_MODE.SINGLE;
        this.pageMode = controls.pageMode = utils.createBtn('pagemode',
          icons[isSingle ? 'doublepage' : 'singlepage'],
          isSingle ? text.doublePageMode : text.singlePageMode)
          .on("click", function () {

            let el = jQuery(this);
            app.viewer.setPageMode({
              isSingle: !el.hasClass(icons['doublepage'])
            });
            app.viewer.pageModeChangedManually = true;

          });
      }
    }
    else {
      this.pageFit = controls.pageFit = utils.createBtn('pagefit', icons['pagefit'], text.pageFit)
        .on("click", function () {
          let pageFit = controls.pageFit;
          let isPageFit = !pageFit.hasClass(icons['widthfit']);
          if (isPageFit === true) {
            pageFit.addClass(icons['widthfit']);
            pageFit.html("<span>" + text.widthFit + "</span>");
            pageFit.attr("title", text.widthFit);
          }
          else {
            pageFit.removeClass(icons['widthfit']);
            pageFit.html("<span>" + text.pageFit + "</span>");
            pageFit.attr("title", text.pageFit);
          }
          // jQuery(this).toggleClass(buttonClass + " " + uiClass + "-widthfit ");
        });
    }
    ui.shareBox = new DV_Share(app.container, app.options);
    this.share = controls.share = utils.createBtn('share', icons['share'], text.share)
      .on("click", function () {
        if (ui.shareBox.isOpen === true)
          ui.shareBox.close();
        else {
          ui.shareBox.update(app.getURLHash());
          ui.shareBox.show();
        }
      });

    //More button
    this.more = controls.more = utils.createBtn('more', icons['more'])
      .on("click", function (event) {
        if (ui.moreContainerOpen !== true) {
          jQuery(this).addClass("df-active");
          ui.moreContainerOpen = true;
          event.stopPropagation();
        }
      });

    this.startPage = controls.startPage = utils.createBtn('start', icons['start'], text.gotoFirstPage)
      .on("click", function () {

        app.start();

      });

    this.endPage = controls.endPage = utils.createBtn('end', icons['end'], text.gotoLastPage)
      .on("click", function () {

        app.end();

      });

    if (app.options.showPrintControl === true && utils.isMobile !== true && typeof app.options.source === 'string') {
      this.print = controls.print = utils.createBtn('print', icons['print'], text.print)
        .on("click", function () {

          DEARVIEWER.printHandler = DEARVIEWER.printHandler || new PrintHandler();
          DEARVIEWER.printHandler.printPDF(app.options.source);

        });
    }

    if (app.options.showDownloadControl === true && typeof app.options.source === 'string') {
      let downloadClass = "df-ui-btn df-ui" + "-download " + icons['download'];
      this.download = controls.download = jQuery('<a download target="_blank" class="' + downloadClass + '"><span>' + text.downloadPDFFile + '</span></a>');
      controls.download.attr("href", utils.httpsCorrection(app.options.source)).attr("title", text.downloadPDFFile);
      //moreContainer.append(download);
    }

    //endregion

    //region MoreContainer
    ui.moreContainer = jQuery(div, {
      class: "df-more-container"
    });
    controls.more.append(ui.moreContainer);
    //endregion

    if (!(app.options.isLightBox === true && app.fullscreenSupported !== true)) {
      this.fullScreen = controls.fullScreen = utils.createBtn('fullscreen', icons['fullscreen'], text.toggleFullscreen)
        .on("click", app.switchFullscreen.bind(app));
    }
    app.viewer.initCustomControls();
    /**
     * Controls position and placement is determined by options.moreControls and options.hideControls
     */
    let allControls = app.options.allControls.replace(/ /g, '').split(','),
      moreControls = ',' + app.options.moreControls.replace(/ /g, '') + ',',
      hideControls = ',' + app.options.hideControls.replace(/ /g, '') + ',',
      leftControls = ',' + app.options.leftControls.replace(/ /g, '') + ',',
      rightControls = ',' + app.options.rightControls.replace(/ /g, '') + ',',
      devControls = ',';// + app.options.devControls.replace(/ /g, '') + ',';

    // if (utils.isIOS) {
    //   hideControls += ",fullScreen,";
    // }
    hideControls += devControls;

    for (let controlCount = 0; controlCount < allControls.length; controlCount++) {
      //if hidden skip
      let controlName = allControls[controlCount];
      if (hideControls.indexOf(',' + controlName + ',') < 0) { //not found in hide list
        let control = controls[controlName];
        if (control != null && typeof control == "object") {
          if (moreControls.indexOf(',' + controlName + ',') > -1 && controlName !== 'more' && controlName !== 'pageNumber') {//found in more controls
            ui.moreContainer.append(control);
          }
          else if (app.options.controlsFloating == true) {
            controlsContainer.append(control)
          }
            // else if (leftControls.indexOf(',' + controlName + ',') > -1) {
            //   this.leftElement.append(control);
            // }
            // else if (rightControls.indexOf(',' + controlName + ',') > -1) {
            //   this.rightElement.append(control);
          // }
          else {
            this.centerElement.append(control);
          }
        }
      }
    }
    if (ui.moreContainer.children().length == 0) { //fixes #347
      this.more.addClass("df-hidden");
    }
    app.container.append(controlsContainer);
    app.container.append(controls.openLeft);
    app.container.append(this.controls.openRight);

    //register a click event on window to close the more-options and search options
    window.addEventListener('click', ui.events.closePanels = ui.closePanels.bind(ui), false);
    window.addEventListener('keyup', ui.events.keyup = ui.keyUp.bind(ui), false);
    document.addEventListener('fullscreenchange', ui.events.fullscreenChange = ui.fullscreenChange.bind(ui), false);

    if (app.options.autoOpenThumbnail === true) {
      ui.controls.thumbnail.trigger("click");
    }
    if (app.hasOutline() && app.options.autoOpenOutline === true) {
      ui.controls.outline.trigger("click");
    }
    app.executeCallback('onCreateUI');
  }

  closePanels(event) {
    if (this.moreContainerOpen === true) {
      this.controls.more?.removeClass("df-active");
      this.moreContainerOpen = false;
    }
  }

  fullscreenChange(event) {
    let isExit = utils.getFullscreenElement() === void 0;
    if (isExit && this.app.isFullscreen === true) {
      this.app.switchFullscreen();
    }
  }

  keyUp(event) {
    let ui = this,
      app = this.app;
    //bail out if the keys are getting entered in some input box.
    if (event.target.nodeName === "INPUT") return;
    let navKeysValid = false;
    if(app.options.arrowKeysAction === DEARVIEWER.ARROW_KEYS_ACTIONS.NAV){
      if(app.isFullscreen === true || app.options.isLightBox === true){
        navKeysValid = true;
      }
      if(app.options.isLightBox != true && DEARVIEWER.activeEmbeds.length <2 && jQuery("body").hasClass("df-lightbox-open") === false){
        navKeysValid = true;
      }
    }
    switch (event.keyCode) {
      case 27://escKey
        if (DEARVIEWER.activeLightBox && DEARVIEWER.activeLightBox.app && !utils.isChromeExtension()) {
          DEARVIEWER.activeLightBox.closeButton.trigger("click");
        }
        break;
      case 37://leftKey:
        if (navKeysValid)
          app.openLeft();
        break;
      case 39://rightKey:
        if (navKeysValid)
          app.openRight();
        break;
      default:
        break;
    }
  }

  createLogo() {
    let app = this.app;
    let logo = null;
    if (app.options.logo.indexOf("<") > -1) {
      logo = jQuery(app.options.logo).addClass("df-logo df-logo-html");
    }
    else if (app.options.logo.trim().length > 2) {
      logo = jQuery('<a class="df-logo df-logo-img" target="_blank" href="' + app.options.logoUrl + '"><img alt="" src="' + app.options.logo + '"/>');
    }
    this.element.append(logo);
  }

  dispose() {

    let ui = this;

    for (let key in this.controls) {
      if (this.controls.hasOwnProperty(key)) {
        let control = this.controls[key];
        if (control !== null && typeof control == "object") control.off().remove();
      }
    }

    ui.element.remove();

    ui.shareBox = utils.disposeObject(ui.shareBox);

    window.removeEventListener('click', ui.events.closePanels, false);
    window.removeEventListener('keyup', ui.events.keyup, false);
    document.removeEventListener('fullscreenchange', ui.events.fullscreenChange, false);
  }

  update() {

    let app = this.app, controls = this.controls;

    if (this._pageLabelWidthSet !== true) {
      //https://github.com/deepak-ghimire/dearviewer/issues/349
      this.pageLabel.width("");
      if (app.provider.pageLabels) {
        this.pageLabel.html("88888888888888888".substring(0, app.pageCount.toString().length * 3 + 4));
      }
      else {
        this.pageLabel.html("88888888888".substring(0, app.pageCount.toString().length * 2 + 3));
      }
      this.pageNumber.width(this.pageLabel.width());
      this.pageLabel.width(this.pageLabel.width());
      this.pageLabel.html("");
      this._pageLabelWidthSet = true;
    }

    var pageLabel = app.getCurrentLabel();
    if (pageLabel.toString() !== app.currentPageNumber.toString()) {
      controls.pageLabel.html((pageLabel) + "(" + app.currentPageNumber + "/" + app.pageCount + ")");
    }
    else {
      controls.pageLabel.html((pageLabel) + "/" + app.pageCount);
    }
    controls.pageInput.val(pageLabel);

    app.container.toggleClass("df-sidemenu-open", app.container.find(".df-sidemenu-visible").length > 0);
    let isSearchOpen = app.provider.totalHits > 0 && app.container.find(".df-sidemenu-visible.df-search-container").length > 0;
    app.container.toggleClass("df-search-open", isSearchOpen);
    if (isSearchOpen) {
      let targetSearchresult = app.searchContainer.find(".df-search-result[data-df-page=" + app.currentPageNumber + "]");
      app.searchContainer.find(".df-search-result.df-active").removeClass("df-active");
      if (targetSearchresult.length > 0 && !targetSearchresult.hasClass(".df-active")) {
        targetSearchresult.addClass("df-active");

        let searchWrapper = app.searchResults[0];
        let searchWrapperScrollTop = searchWrapper.scrollTop,
          searchWrapperScrollHeight = searchWrapper.getBoundingClientRect().height;

        targetSearchresult = targetSearchresult[0];
        //when the thumb is below the display area scroll so that just it's fully visible
        if (searchWrapperScrollTop + searchWrapperScrollHeight < targetSearchresult.offsetTop + targetSearchresult.scrollHeight)
          utils.scrollIntoView(targetSearchresult, null, false);
        //when the thumb is above the display area scroll so that just it's fully visible
        else if (searchWrapperScrollTop > targetSearchresult.offsetTop)
          utils.scrollIntoView(targetSearchresult);

      }
    }

    controls.zoomIn.toggleClass("disabled", app.zoomValue === app.viewer.maxZoom);
    controls.zoomOut.toggleClass("disabled", app.zoomValue === app.viewer.minZoom);

    let isRTL = app.isRTL,
      isStart = app.currentPageNumber === app.startPage,
      isEnd = app.currentPageNumber === app.endPage;

    let noPrev = (isStart && !isRTL) || (isEnd && isRTL),
      noNext = (isEnd && !isRTL) || (isStart && isRTL);

    controls.openRight.toggleClass("df-hidden", noNext);
    controls.openLeft.toggleClass("df-hidden", noPrev);

    app.viewer.afterControlUpdate();
  }
}

class DV_Share {
  constructor(container, options) {
    let dfShare = this;

    dfShare.isOpen = false;
    dfShare.shareUrl = "";

    dfShare.init(container, options);

  }

  init(container, options) {
    let dfShare = this;
    let shareButtonClass = "df-share-button";
    let windowParameters = "width=500,height=400";
    dfShare.wrapper = jQuery('<div class="df-share-wrapper" style="display: none;">')
      .on("click", function () {
        dfShare.close();
      });

    dfShare.box = jQuery('<div class="df-share-box">');
    dfShare.box.on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    dfShare.box
      .appendTo(dfShare.wrapper)
      .html('<span class="df-share-title">' + options.text.share + '</span>');

    dfShare.urlInput = jQuery('<textarea name="df-share-url" class="df-share-url">').on("click", function () {
      jQuery(this).select();
    });

    dfShare.box.append(dfShare.urlInput);

    for (let shareKey in options.share) {
      if (options.share.hasOwnProperty(shareKey) && options.hideShareControls.indexOf(shareKey) < 0) {
        let shareTemplate = options.share[shareKey];
        if (shareTemplate !== null) {
          dfShare[shareKey] = jQuery('<div>', {
            class: shareButtonClass + " df-share-" + shareKey + " " + options.icons[shareKey]
          }).on("click", function (e) {
            e.preventDefault();
            window.open(shareTemplate.replace("{{url}}", encodeURIComponent(dfShare.shareUrl)).replace("{{mailsubject}}", options.text.mailSubject), "Sharer", windowParameters);
            e.stopPropagation();//so the default event is not cancelled by parent element
          });
          dfShare.box.append(dfShare[shareKey]);
        }
      }
    }

    jQuery(container).append(dfShare.wrapper);
  }

  show() {
    this.wrapper.fadeIn(300);
    this.urlInput.val(this.shareUrl);
    this.urlInput.trigger("click");
    this.isOpen = true;
  }

  dispose() {
    let dfShare = this;
    for (let key in dfShare) {
      if (dfShare.hasOwnProperty(key)) {
        if (dfShare[key] && dfShare[key].off)
          dfShare[key].off();
      }
    }
    dfShare.wrapper.remove();
  }

  close() {
    this.wrapper.fadeOut(300);
    this.isOpen = false;
  }

  update(url) {
    this.shareUrl = url;
  };
}

class DVLightBox {
  /**
   * @constructs LightBox
   * @param closeCallback callBack function when lightbox is closed
   */
  constructor(closeCallback) {

    this.duration = 300;

    //cache this
    let lightbox = this;
    //lightbox wrapper div
    lightbox.lightboxWrapper = jQuery("<div>").addClass("df-lightbox-wrapper");
    //lightbox background
    lightbox.backGround = jQuery("<div>").addClass("df-lightbox-bg").appendTo(lightbox.lightboxWrapper);
    //lightbox element
    lightbox.element = jQuery("<div>").addClass("df-app").appendTo(lightbox.lightboxWrapper);
    //lightbox controls
    lightbox.controls = jQuery("<div>").addClass("df-lightbox-controls").appendTo(lightbox.lightboxWrapper);

    //lightbox close button
    lightbox.closeButton = jQuery("<div>").addClass("df-lightbox-close df-ui-btn " + DEARVIEWER.defaults.icons['close'])
      .on("click", function () {
        lightbox.close(closeCallback);
      })
      .appendTo(lightbox.controls);

    lightbox.lightboxWrapper.append(lightbox.element);

    return lightbox;
  }

  show(callback) {

    if (this.lightboxWrapper.parent().length === 0)
      jQuery("body").append(this.lightboxWrapper);
    jQuery("html,body").addClass("df-lightbox-open");
    this.lightboxWrapper.fadeIn(this.duration);
    if (typeof callback === "function")
      callback();

    return this;
  }

  close(callback) {

    this.lightboxWrapper.fadeOut(this.duration);

    Array.prototype.forEach.call(DEARVIEWER.utils.getSharePrefixes(), function (prefix) {
      if (window.location.hash.indexOf("#" + prefix) === 0)
        history.replaceState(undefined, undefined, "#_");
      //window.location.hash = "#_";
    });

    if (typeof callback === "function")
      setTimeout(callback, this.duration);
    jQuery("html,body").removeClass("df-lightbox-open");

    //cleanup any classes to remove old CSS classes
    this.element.attr("class", "df-app").attr("style", "");
    this.lightboxWrapper.attr("class", "df-lightbox-wrapper").attr("style", "");
    this.backGround.attr("style", "");

    return this;
  }

}

class PrintHandler {
  constructor() {

    //cache this
    let printHandler = this;

    printHandler.frame = jQuery('<iframe id="df-print-frame" style="display:none">').appendTo(jQuery("body"));
    printHandler.frame.on("load", function () {
      try {printHandler.frame[0].contentWindow.print();} catch (e) {console.log(e);}
    });

    return printHandler;
  }

  printPDF(source) {
    this.frame[0].src = source;
  }
}

class Sidemenu {
  constructor(options, appContext) {
    this.options = options;
    this.app = appContext;

    this.parentElement = options.parentElement;
    this.element = jQuery('<div>', {class: "df-sidemenu-wrapper"});
    this.parentElement.append(this.element);

    this.buttons = jQuery('<div>', {
      class: "df-sidemenu-buttons df-ui-wrapper"
    }).appendTo(this.element);

    /*
        let icons = this.app.options.icons,
          text = this.app.options.text;

        this.thumbnail = utils.createBtn('thumbnail', icons['thumbnail'], text.toggleThumbnails);
        this.outline = utils.createBtn('outline', icons['outline'], text.toggleOutline);*/
    this.close = utils.createBtn('close', appContext.options.icons['close'], appContext.options.text.close);//todo

    this.buttons.append(this.close);

  }

  dispose() {
    this.element.remove();
  }
}

class BookMarkViewer {

  /**
   * @typedef {Object} BookMarkViewerOptions
   * @property {HTMLDivElement} container - The viewer element.
   * @property {Object} linkService - the serviceProvider
   * @property {Object} outlineItemClass - custom class for outline item
   * @property {Object} outlineToggleClass - custom class for outline toggle
   * @property {Object} outlineToggleHiddenClass - custom class for outline hidden item
   */

  /**
   * @typedef {Object} BookMarkViewerRenderParameters
   * @property {Array|null} outline - An array of outline objects.
   */

  /**
   * @constructs BookMarkViewer
   * @param {BookMarkViewerOptions} options
   */
  constructor(options) {
    this.outline = null;
    this.lastToggleIsShow = true;
    this.container = options.container;
    this.linkService = options.linkService;
    this.outlineItemClass = options.outlineItemClass || "outlineItem";
    this.outlineToggleClass = options.outlineToggleClass || "outlineItemToggler";
    this.outlineToggleHiddenClass = options.outlineToggleHiddenClass || "outlineItemsHidden";
  }


  dispose() {
    if (this.container) {
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }
    this.linkService = null;

  };

  reset() {
    this.outline = null;
    this.lastToggleIsShow = true;

    let container = this.container;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };

  /**
   * @private
   */
  _dispatchEvent(outlineCount) {
    let event = document.createEvent('CustomEvent');
    event.initCustomEvent('outlineloaded', true, true, {
      outlineCount: outlineCount
    });
    this.container.dispatchEvent(event);
  };

  /**
   * @private
   */
  _bindLink(element, item) {
    let linkService = this.linkService;
    if (item.custom === true) {
      element.href = linkService.getCustomDestinationHash(item.dest);
      element.onclick = function goToDestination() {
        linkService.customNavigateTo(item.dest);
        return false;
      };
    }
    else {
      if (item.url) {
        pdfjsLib.addLinkAttributes(element, {url: item.url});
        return;
      }

      element.href = linkService.getDestinationHash(item.dest);
      element.onclick = function goToDestination() {
        linkService.navigateTo(item.dest);
        return false;
      };
    }
  };

  /**
   * Prepend a button before an outline item which allows the user to toggle
   * the visibility of all outline items at that level.
   *
   * @private
   */
  _addToggleButton(div) {
    let _bookMarkViewer = this;
    let toggler = document.createElement('div');
    toggler.className = this.outlineToggleClass + " " + this.outlineToggleHiddenClass;
    toggler.onclick = function (event) {
      event.stopPropagation();
      toggler.classList.toggle(this.outlineToggleHiddenClass);

      if (event.shiftKey) {
        let shouldShowAll = !toggler.classList.contains(this.outlineToggleHiddenClass);
        _bookMarkViewer._toggleOutlineItem(div, shouldShowAll);
      }
    }.bind(this);
    div.insertBefore(toggler, div.firstChild);
  };

  /**
   * Toggle the visibility of the subtree of an outline item.
   *
   * @param {Element} root - the root of the outline (sub)tree.
   * @param {boolean} show - whether to show the outline (sub)tree. If false,
   *   the outline subtree rooted at |root| will be collapsed.
   *
   * @private
   */
  _toggleOutlineItem(root, show) {
    this.lastToggleIsShow = show;
    let togglers = root.querySelectorAll('.' + this.outlineToggleClass);
    for (let i = 0, ii = togglers.length; i < ii; ++i) {
      togglers[i].classList[show ? 'remove' : 'add'](this.outlineToggleHiddenClass);
    }
  };

  /**
   * @param {BookMarkViewerRenderParameters} params
   */
  render(params) {
    let outline = (params && params.outline) || null;
    let outlineCount = 0;

    if (this.outline) {
      this.reset();
    }
    this.outline = outline;

    if (!outline) {
      //this._dispatchEvent(outlineCount);
      return;
    }

    let fragment = document.createDocumentFragment();
    let queue = [{parent: fragment, items: this.outline, custom: false}];
    let hasAnyNesting = false;
    while (queue.length > 0) {
      let levelData = queue.shift();
      let isCustom = levelData.custom;
      for (let i = 0, len = levelData.items.length; i < len; i++) {
        let item = levelData.items[i];

        let div = document.createElement('div');
        div.className = this.outlineItemClass;

        let element = document.createElement('a');
        if (item.custom == null && isCustom != null)
          item.custom = isCustom;

        this._bindLink(element, item);
        //element.
        element.textContent = item.title.replace(/\x00/g, '');
        //pdfjsLib.removeNullCharacters(item.title) || "Untitled Bookmark";

        div.appendChild(element);

        if (item.items && item.items.length > 0) {
          hasAnyNesting = true;
          this._addToggleButton(div);

          let itemsDiv = document.createElement('div');
          itemsDiv.className = this.outlineItemClass + "s";
          div.appendChild(itemsDiv);
          // noinspection JSCheckFunctionSignatures
          queue.push({parent: itemsDiv, custom: item.custom, items: item.items});
        }

        levelData.parent.appendChild(div);
        outlineCount++;
      }
    }
    if (hasAnyNesting) {
      if (this.container.classList != null) {
        this.container.classList.add(this.outlineItemClass + "s");
      }
      else if (this.container.className != null) {
        this.container.className += " picWindow";
      }
    }

    this.container.appendChild(fragment);

    this._dispatchEvent(outlineCount);
  }

}

class ThumbList {
  constructor(config) {
    let itemHeight = this.itemHeight = config.itemHeight;
    let itemWidth = this.itemWidth = config.itemWidth;
    let app = this.app = config.app;
    this.items = config.items;
    this.generatorFn = config.generatorFn;
    this.totalRows = config.totalRows || (config.items && config.items.length);

    this.addFn = config.addFn;
    this.scrollFn = config.scrollFn;

    this.container = document.createElement('div');

    let self = this;

    for (let count = 0; count < this.totalRows; count++) {
      let el = document.createElement("div");
      let pageNumber = count + 1;
      el.id = "df-thumb" + pageNumber;
      let image = document.createElement("div"),
        thumbNumber = document.createElement("div"),
        wrapper = document.createElement("div");
      wrapper.className = "df-wrapper";
      thumbNumber.className = "df-thumb-number";
      el.className = "df-thumb";
      image.className = "df-bg-image";
      wrapper.style.height = itemHeight + 'px';
      wrapper.style.width = itemWidth + 'px';
      thumbNumber.innerText = app.provider.getLabelforPage(pageNumber);
      el.appendChild(wrapper);
      wrapper.appendChild(thumbNumber);
      wrapper.appendChild(image);
      this.container.appendChild(el);
    }

    function onScroll() {
      app.thumbRequestCount = 0;
      app.thumbRequestStatus = REQUEST_STATUS.COUNT;
    }

    self.dispose = function () {
      if (self.container) {
        if (self.container.parentNode) {
          self.container.parentNode.removeChild(self.container);
        }
      }

      self.container.removeEventListener('scroll', onScroll);
    };

    self.container.addEventListener('scroll', onScroll);
  }

  processThumbRequest() {
    utils.log("Thumb Request Initiated");
    let app = this.app;
    app.thumbRequestStatus = REQUEST_STATUS.OFF;

    //move to thumb if thumb is on
    if (app.activeThumb !== app.currentPageNumber) {
      let thumbVisible = app.thumbContainer != null && app.thumbContainer.hasClass("df-sidemenu-visible");

      if (thumbVisible) {
        let thumbWrapper = app.thumblist.container;
        let thumbWrapperScrollTop = thumbWrapper.scrollTop,
          thumbWrapperScrollHeight = thumbWrapper.getBoundingClientRect().height;

        let thumb = app.thumbContainer.find("#df-thumb" + app.currentPageNumber);
        if (thumb.length > 0) {//TODO direct jumps won't work..
          app.thumbContainer.find(".df-selected").removeClass("df-selected");
          thumb.addClass("df-selected");
          //js calculation
          thumb = thumb[0];

          //when the thumb is below the display area scroll so that just it's fully visible
          if (thumbWrapperScrollTop + thumbWrapperScrollHeight < thumb.offsetTop + thumb.scrollHeight)
            utils.scrollIntoView(thumb, null, false);
          //when the thumb is above the display area scroll so that just it's fully visible
          else if (thumbWrapperScrollTop > thumb.offsetTop)
            utils.scrollIntoView(thumb);

          app.activeThumb = app.currentPageNumber;
        }
        else { //TODO: Why is this written??
          //noinspection JSValidateTypes
          jQuery(thumbWrapper).scrollTop(app.currentPageNumber * 124);
          app.thumbRequestStatus = REQUEST_STATUS.ON;
        }
      }
    }

    if (app.thumblist.container.getElementsByClassName("df-thumb-requested").length === 0) {
      let visible = utils.getVisibleElements({
        container: app.thumblist.container,
        elements: app.thumblist.container.children
      });
      if (jQuery.inArray(visible))
        visible.unshift(app.activeThumb);

      for (let count = 0; count < visible.length; count++) {
        let thumb = app.thumblist.container.children[visible[count] - 1];
        if (thumb !== void 0 && thumb.classList.contains("df-thumb-loaded") === false && thumb.classList.contains("df-thumb-requested") === false) {
          thumb.classList.add("df-thumb-requested");
          utils.log("Thumb Requested for " + visible[count]);
          app.provider.processPage({
            pageNumber: visible[count],
            textureTarget: DEARVIEWER.TEXTURE_TARGET.THUMB
          });
          return false;
        }
      }
    }
  }

  setPage(param) {
    let app = this.app,
      pageNumber = param.pageNumber,
      texture = param.texture,
      textureTarget = param.textureTarget;

    if (textureTarget === DEARVIEWER.TEXTURE_TARGET.THUMB) {
      let thumb = app.container.find("#df-thumb" + pageNumber);
      thumb.find(".df-wrapper").css({
        height: param.height,
        width: param.width,
      });
      thumb.find(".df-bg-image").css({
        backgroundImage: utils.bgImage(texture)
      });
      thumb.addClass(
        "df-thumb-loaded"
      ).removeClass("df-thumb-requested");
    }
    utils.log("Thumbnail set for " + param.pageNumber);
    app.thumbRequestStatus = REQUEST_STATUS.ON;
  }
}

DEARVIEWER.openLightBox = function openLightBox(app) {

  if (!DEARVIEWER.activeLightBox) {
    DEARVIEWER.activeLightBox = new DVLightBox(function () {
      if (DEARVIEWER.activeLightBox.app) {
        DEARVIEWER.activeLightBox.app.closeRequested = true;
        DEARVIEWER.activeLightBox.app.analytics({
          eventAction: DEARVIEWER.activeLightBox.app.options.analyticsViewerClose,
          options: DEARVIEWER.activeLightBox.app.options
        });
      }

      DEARVIEWER.activeLightBox.app = utils.disposeObject(DEARVIEWER.activeLightBox.app);
    });
  }
  DEARVIEWER.activeLightBox.duration = 300;

  if ( //valid states to close existing lightbox and open new
    DEARVIEWER.activeLightBox.app === undefined ||
    DEARVIEWER.activeLightBox.app === null ||
    DEARVIEWER.activeLightBox.app.closeRequested === true ||
    DEARVIEWER.openLocalFileInput == app // request is through OpenFile function
  ) {

    DEARVIEWER.activeLightBox.app = utils.disposeObject(DEARVIEWER.activeLightBox.app);

    if (DEARVIEWER.activeLightBox.app === null) {

      DEARVIEWER.activeLightBox.show(
        function () {
          DEARVIEWER.activeLightBox.app = jQuery(DEARVIEWER.activeLightBox.element).dearviewer({
            transparent: false,//todo transparent is not available so set to a default background https://github.com/deepak-ghimire/dearviewer/issues/330
            isLightBox: true,
            hashNavigationEnabled: true,
            height: "100%",
            dataElement: app
          });
          history.pushState({},null,"#");
          DEARVIEWER.activeLightBox.lightboxWrapper.toggleClass("df-lightbox-padded", DEARVIEWER.activeLightBox.app.options.popupFullsize === false);
          DEARVIEWER.activeLightBox.lightboxWrapper.toggleClass("df-rtl", DEARVIEWER.activeLightBox.app.options.readDirection === DEARVIEWER.READ_DIRECTION.RTL);
          DEARVIEWER.activeLightBox.backGround.css({
            "backgroundColor": DEARVIEWER.activeLightBox.app.options.backgroundColor === "transparent"
              ? DEARVIEWER.defaults.popupBackGroundColor
              : DEARVIEWER.activeLightBox.app.options.backgroundColor
          });
        }
      );
    }
  }
}

DEARVIEWER.checkBrowserURLforDefaults = function () {
  if (utils.isIEUnsupported) return;
  let viewerType = (new URL(location.href)).searchParams.get('viewer-type') || (new URL(location.href)).searchParams.get('viewertype');
  let is3D = (new URL(location.href)).searchParams.get('is-3d') || (new URL(location.href)).searchParams.get('is3d');
  if (viewerType) {
    DEARVIEWER.defaults.viewerType = viewerType;
  }
  if (is3D === "true" || is3D === "false") {
    DEARVIEWER.defaults.is3D = is3D === "true";
  }
};

DEARVIEWER.checkBrowserURLforPDF = function (openFlipbook = false) {
  if (utils.isIEUnsupported) return;
  let pdf = (new URL(location.href)).searchParams.get('pdf-source');
  if (pdf) {
    pdf = decodeURI(pdf);
    if (openFlipbook) {
      DEARVIEWER.openURL(pdf);
    }
  }
  return pdf;
};

//Exists if there is need for open file and other lightbox present in the same page. They cannot share same settings.
//also is needed just be a dummy elemet for lightbox dataElement
function createFileInput() {
  if (DEARVIEWER.openLocalFileInput === void 0) {
    let input = DEARVIEWER.openLocalFileInput = jQuery('<input type="file" accept=".pdf" style="display:none">').appendTo(jQuery("body")).data('df-option', DEARVIEWER.openFileOptions);

    input.change(function () {
      let files = input[0].files;
      let file;
      if (files.length) {
        file = files[0];
        input.val("");
        DEARVIEWER.openFile(file);
      }
    });
  }
}

//default fileDropHandler
DEARVIEWER.fileDropHandler = function (files, e) {
  var file = files[0];
  if (file.type === "application/pdf") {
    e.preventDefault();
    e.stopPropagation();
    DEARVIEWER.openFile(file);
  }
};

DEARVIEWER.openFile = function (file) {

  if (file) {
    if (DEARVIEWER.oldLocalFileObjectURL) window.URL.revokeObjectURL(DEARVIEWER.oldLocalFileObjectURL);
    DEARVIEWER.oldLocalFileObjectURL = window.URL.createObjectURL(file);

    //callback to handle any actions once file is selected.
    DEARVIEWER['openFileSelected']?.({url: DEARVIEWER.oldLocalFileObjectURL, file: file});
    DEARVIEWER.openURL(DEARVIEWER.oldLocalFileObjectURL);
  }
  else {
    DEARVIEWER.openURL();
  }
}

DEARVIEWER.openURL = function (src) {
  createFileInput();
  if (src) {
    DEARVIEWER.openFileOptions.source = src;
    DEARVIEWER.openFileOptions.pdfParameters = null;
  }
  DEARVIEWER.openLightBox(DEARVIEWER.openLocalFileInput);
}

DEARVIEWER.openBase64 = function (data) {
  DEARVIEWER.openFileOptions.source = null;
  DEARVIEWER.openFileOptions.pdfParameters = {data: atob(data)};
  DEARVIEWER.openURL();
}

DEARVIEWER.openLocalFile = function () {
  createFileInput();
  DEARVIEWER.openLocalFileInput.click();
}

//jQuery events
DEARVIEWER.initControls = function () {
  //Lightbox Trigger
  let body = jQuery('body');

  if (DEARVIEWER.defaults.autoPDFLinktoViewer !== false) {
    body.on('click', 'a[href$=".pdf"]', function (event) {
      let app = jQuery(this);
      //prevent Download button to trigger Flipbook!
      if (app.attr("download") !== undefined || app.attr("target") === "_blank" || app.hasClass("df-ui-btn") || app.parents(".df-app").length > 0) {

      }
      else {
        event.preventDefault();

        app.data('df-source', app.attr('href'));
        DEARVIEWER.openLightBox(app);
      }
    });
  }

  window.addEventListener('popstate', function(event) {
    if (DEARVIEWER.activeLightBox && DEARVIEWER.activeLightBox.app && !utils.isChromeExtension()) {
      DEARVIEWER.activeLightBox.closeButton.trigger("click");
    }
  });

  body.on('click', '.df-open-local-file', function (event) {
    DEARVIEWER.openLocalFile();
  });

  body.on('click', '.df-sidemenu-buttons .df-ui-close', function () {
    let el = jQuery(this);
    el.closest(".df-app").find(".df-ui-btn.df-active").trigger("click");
  });

  body.on('mouseout', '.df-link-content section.squareAnnotation, .df-link-content section.textAnnotation, .df-link-content section.freeTextAnnotation', function () {
    let el = jQuery(this);
    DEARVIEWER.handlePopup(el, false);
  });

  body.on('mouseover', '.df-link-content section.squareAnnotation, .df-link-content section.textAnnotation, .df-link-content section.freeTextAnnotation', function () {
    let el = jQuery(this);
    DEARVIEWER.handlePopup(el, true);
  });

  DEARVIEWER.handlePopup = function (el, show = true) {

    var container = el.closest('.df-container');
    var commentPopup = container.find('.df-comment-popup');
    commentPopup.toggleClass("df-active", show);
    if (show) {
      var elBounds = el[0].getBoundingClientRect();
      var containerBounds = container[0].getBoundingClientRect();
      var popup = el.find(".popupWrapper").first();
      if(el.hasClass("popupTriggerArea")){
        var annotation_id = el.data("annotation-id");
        if(annotation_id !== void 0){
          popup = el.siblings("[data-annotation-id=popup_"+annotation_id + "]");
        }
      }

      commentPopup.html(popup.html());
      var left = elBounds.left - containerBounds.left;
      if (left + 360 > containerBounds.width)
        left = containerBounds.width - 360 - 10;
      else if (left < 10)
        left = 10;

      var top = elBounds.top - containerBounds.top + elBounds.height + 5;
      if (top + commentPopup.height() > containerBounds.height)
        top = elBounds.top - commentPopup.height() - elBounds.height - 10;
      else if (top < 10)
        top = 10;
      commentPopup.css({
        "left": left,
        "top": top
      });
    }

  };

  if (DEARVIEWER.fileDropElement != void 0) {

    var fileDropElement = jQuery(DEARVIEWER.fileDropElement);

    if (fileDropElement.length > 0) {
      fileDropElement.on("dragover", function (event) {
        event.preventDefault();
        event.stopPropagation();
        jQuery(this).addClass('df-dragging');
      });

      fileDropElement.on("dragleave", function (event) {
        event.preventDefault();
        event.stopPropagation();
        jQuery(this).removeClass('df-dragging');
      });

      fileDropElement.on("drop", function (e) {
        let files = e.originalEvent.dataTransfer.files; // Array of all files
        let file;
        if (files.length) {
          DEARVIEWER.fileDropHandler(files, e);
        }
      });

    }

  }

};

export {UI, Sidemenu, BookMarkViewer, ThumbList};
