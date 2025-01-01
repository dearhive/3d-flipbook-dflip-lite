/* globals requirejs, jQuery*/
import {DEARVIEWER} from "../defaults.js";

let utils = DEARVIEWER.utils;


/**
 * @typedef {Object} PDFDocument
 * @property {Function} getPage - Gets the Page
 * @property {Function} numPages - Total number of pages
 * @property {Function} getPageIndex - Gets the Page Index
 * @property {Function} getOutline - Gets the Outline
 * @property {Function} getDestination - Gets the Destination
 */

/**
 * @typedef {Object} PDFPage
 * @property {Function} getViewport - Gets the Viewport
 * @property {Function} getAnnotations - Gets the Annotation
 */

//region Link Service
/**
 * Performs navigation functions inside PDF, such as opening specified page,
 * or destination.
 * @class
 */
class PDFLinkService {
  /**
   * @constructs PDFLinkService
   */
  constructor() {
    this.baseUrl = null;
    this.pdfDocument = null;
    this.pdfApp = null;
    this.pdfHistory = null;
    this.externalLinkRel = null;
    this.externalLinkEnabled = true;
    this._pagesRefCache = null;
  }

  dispose() {
    this.baseUrl = null;
    this.pdfDocument = null;
    this.pdfApp = null;
    this.pdfHistory = null;

    this._pagesRefCache = null;
  };

  setDocument(pdfDocument, baseUrl) {
    this.baseUrl = baseUrl;
    this.pdfDocument = pdfDocument;
    this._pagesRefCache = Object.create(null);
  };


  setViewer(pdfApp) {
    this.pdfApp = pdfApp;
    this.externalLinkTarget = pdfApp.options.linkTarget;
  };

  setHistory(pdfHistory) {
    this.pdfHistory = pdfHistory;
  };

  /**
   * @returns {number}
   */
  get pagesCount() {
    return this.pdfDocument.numPages;
  };

  /**
   * @returns {number}
   */
  get page() {
    return this.pdfApp.currentPageNumber;
  };

  /**
   * @param {number} value
   */
  set page(value) {
    this.pdfApp.gotoPage(value);
  };

  navigateTo(dest) {//Deprecated in pdf.js 2.7.570
    this.goToDestination(dest);
  }

  /**
   * Wrapper around the `addLinkAttributes`-function in the API.
   * @param {HTMLAnchorElement} link
   * @param {string} url
   * @param {boolean} [newWindow]
   */
  addLinkAttributes(link, url, newWindow = false) {
    /*    pdfjsLib.addLinkAttributes(link, {
          url,
          target: this.externalLinkTarget,
          rel: this.externalLinkRel,
          enabled: this.externalLinkEnabled,
        });*/

    let target = this.externalLinkTarget,
      rel = this.externalLinkRel,
      enabled = this.externalLinkEnabled;

    if (!url || typeof url !== "string") {
      throw new Error('A valid "url" parameter must provided.');
    }
    const urlNullRemoved = (0, utils.removeNullCharacters)(url);
    if (enabled) {
      link.href = link.title = urlNullRemoved;
    }
    else {
      link.href = "";
      link.title = `Disabled: ${urlNullRemoved}`;
      link.onclick = () => {
        return false;
      };
    }
    let targetStr = "";
    switch (target) {
      case DEARVIEWER.LINK_TARGET.NONE:
        break;
      case DEARVIEWER.LINK_TARGET.SELF:
        targetStr = "_self";
        break;
      case DEARVIEWER.LINK_TARGET.BLANK:
        targetStr = "_blank";
        break;
      case DEARVIEWER.LINK_TARGET.PARENT:
        targetStr = "_parent";
        break;
      case DEARVIEWER.LINK_TARGET.TOP:
        targetStr = "_top";
        break;
    }
    link.target = targetStr;
    link.rel = typeof rel === "string" ? rel : "noopener noreferrer nofollow";
  }

  /**
   * @param dest - The PDF destination object.
   */
  goToDestination(dest) {
    let destString = '';
    let self = this;

    let goToDestination = function (destRef) {
      utils.log("Requested: ", destRef);
      // dest array looks like that: <page-ref> </XYZ|FitXXX> <args..>
      let pageNumber = destRef instanceof Object ? self._pagesRefCache[destRef.num + ' ' + destRef.gen + ' R']
        : (destRef + 1);
      if (pageNumber) {
        pageNumber = self.pdfApp.viewer.getViewerPageNumber(pageNumber);

        if (pageNumber > self.pdfApp.pageCount) {
          pageNumber = self.pdfApp.pageCount;
        }
        utils.log("Loading for:", destRef, " at page ", pageNumber);
        if (self.pdfApp.requestDestRefKey === destRef.num + ' ' + destRef.gen + ' R') {
          self.pdfApp.gotoPage(pageNumber);

          if (self.pdfHistory) {
            // Update the browsing history.
            self.pdfHistory.push({
              dest: dest,
              hash: destString,
              page: pageNumber
            });
          }
        }
        else {
          utils.log("Expired Request for ", pageNumber, " with ", destRef);
        }
      }
      else {
        self.pdfApp.container.addClass('df-fetch-pdf');
        self.pdfDocument.getPageIndex(destRef).then(function (pageIndex) {
          let pageNum = pageIndex + 1;
          let cacheKey = destRef.num + ' ' + destRef.gen + ' R';
          self._pagesRefCache[cacheKey] = pageNum;
          goToDestination(destRef);
        });
      }
    };

    let destinationPromise;
    if (typeof dest === 'string') {
      destString = dest;
      destinationPromise = this.pdfDocument.getDestination(dest);
    }
    else {
      destinationPromise = Promise.resolve(dest);
    }
    destinationPromise.then(function (destination) {
      utils.log("Started:", destination);
      dest = destination;
      if (!(destination instanceof Array)) {
        return; // invalid destination
      }
      self.pdfApp.requestDestRefKey = destination[0].num + ' ' + destination[0].gen + ' R';
      goToDestination(destination[0]);
    });
  };

  /**
   * @param dest - The PDF destination object.
   */
  customNavigateTo(dest) {
    if (dest === '' || dest == null || dest === 'null') return;
    let pageNumber = null;
    if (!isNaN(Math.floor(dest))) {
      pageNumber = dest;
    }
    else if (typeof dest === 'string') {
      pageNumber = parseInt(dest.replace("#", ""), 10);
      if (isNaN(pageNumber)) {
        window.open(dest, this.pdfApp.options.linkTarget === DEARVIEWER.LINK_TARGET.SELF ? "_self" : "_blank");
        return;
      }
    }

    if (pageNumber != null)
      this.pdfApp.gotoPage(pageNumber);

  };

  /**
   * @param dest - The PDF destination object.
   * @returns {string} The hyperlink to the PDF object.
   */
  getDestinationHash(dest) {
    if (typeof dest === 'string') {
      return this.getAnchorUrl('#' + escape(dest));
    }
    if (dest instanceof Array) {
      let destRef = dest[0]; // see navigateTo method for dest format
      let pageNumber = destRef instanceof Object ? this._pagesRefCache[destRef.num + ' ' + destRef.gen + ' R']
        : (destRef + 1);
      if (pageNumber) {
        let pdfOpenParams = this.getAnchorUrl('#page=' + pageNumber);
        let destKind = dest[1];
        if (typeof destKind === 'object' && 'name' in destKind &&
          destKind.name === 'XYZ') {
          let scale = (dest[4] || this.pdfApp.pageScaleValue);
          let scaleNumber = parseFloat(scale);
          if (scaleNumber) {
            scale = scaleNumber * 100;
          }
          pdfOpenParams += '&zoom=' + scale;
          if (dest[2] || dest[3]) {
            pdfOpenParams += ',' + (dest[2] || 0) + ',' + (dest[3] || 0);
          }
        }
        return pdfOpenParams;
      }
    }
    return this.getAnchorUrl('');
  };

  /**
   * @param dest - The PDF destination object.
   * @returns {string} The hyperlink to the PDF object.
   */
  getCustomDestinationHash(dest) {
    //if (typeof dest === 'string') {
    return '#' + escape(dest);
    //}
    //return this.getAnchorUrl('');
  };

  /**
   * Prefix the full url on anchor links to make sure that links are resolved
   * relative to the current URL instead of the one defined in <base href>.
   * @param {String} anchor The anchor hash, including the #.
   * @returns {string} The hyperlink to the PDF object.
   */
  getAnchorUrl(anchor) {
    return (this.baseUrl || '') + anchor;
  };

  /**
   * @param {string} action
   */
  executeNamedAction(action) {
    // See PDF reference, table 8.45 - Named action
    switch (action) {
      case 'GoBack':
        if (this.pdfHistory) {
          this.pdfHistory.back();
        }
        break;

      case 'GoForward':
        if (this.pdfHistory) {
          this.pdfHistory.forward();
        }
        break;

      case 'NextPage':
        this.page++;
        break;

      case 'PrevPage':
        this.page--;
        break;

      case 'LastPage':
        this.page = this.pagesCount;
        break;

      case 'FirstPage':
        this.page = 1;
        break;

      default:
        break; // No action according to spec
    }

    let event = document.createEvent('CustomEvent');
    event.initCustomEvent('namedaction', true, true, {
      action: action
    });
    this.pdfApp.container.dispatchEvent(event);
  };

  // noinspection JSUnusedGlobalSymbols
  /**
   * @param {number} pageNum - page number.
   * @param {Object} pageRef - reference to the page.
   */
  cachePageRef(pageNum, pageRef) {
    let refStr = pageRef.num + ' ' + pageRef.gen + ' R';
    this._pagesRefCache[refStr] = pageNum;
  }
}

class DocumentProvider {
  constructor(props, context) {
    this.props = props;
    this.app = context;
    this.textureCache = [];
    this.pageCount = 0;
    this.numPages = 0;
    this.outline = [];
    this.viewPorts = [];
    this.requestedPages = '';
    this.requestIndex = 0;
    this.pagesToClean = [];
    this.defaultPage = undefined;
    this.pageSize = this.app.options.pageSize;

    this._page1Pass = false;
    this._page2Pass = false;
    this.pageLabels = void 0;
    this.textSearchLength = 0;
    this.textSearch = "";

    this.textContentSearch = [];
    this.textContentJoinedSearch = [];
    this.textOffsetSearch = [];
    this.textContent = [];
    this.textContentJoined = [];
    this.textOffset = [];

    this.autoLinkItemsCache = [];
    this.autoLinkHitsCache = [];
    this.searchHitItemsCache = [];
    this.searchHits = [];

    this.PDFLinkItemsCache = [];
    this.canPrint = true;

    this.textPostion = [];

  }

  finalize() {

  }

  dispose() {

  }

  softDispose() {

  }

  setCache(index, src, cacheIndexSize) {
    let provider = this;
    let cacheIndex = cacheIndexSize;

    if (cacheIndexSize) {
      if (provider.textureCache[cacheIndex] === undefined)
        provider.textureCache[cacheIndex] = [];
      provider.textureCache[cacheIndex][index] = src;
    }
  };

  getCache(index, textureIndex) {
    let provider = this;
    return provider.textureCache[textureIndex] === undefined ? undefined : provider.textureCache[textureIndex][index];
  }

  _isValidPage(pageNumber) {
    return (pageNumber > 0 && pageNumber <= this.pageCount);
  }

  getLabelforPage(pageNumber) {
    if (this.pageLabels && this.pageLabels[pageNumber - 1] !== void 0) return this.pageLabels[pageNumber - 1];
    return pageNumber;
  }

  getThumbLabel(pageNumber) {
    var label = this.getLabelforPage(pageNumber);
    if (label !== pageNumber) {
      return label + " (" + pageNumber + ")"
    }
    return pageNumber;
  }

  getPageNumberForLabel(label) {
    if (!this.pageLabels) {
      return label;
    }
    const i = this.pageLabels.indexOf(label);
    if (i < 0) {
      return null;
    }
    return i + 1;
  }

  processPage(param) {

  }

  cleanUpPages() {

  }

  checkRequestQueue() {

  }

  processAnnotations() {

  }

  processTextContent() {

  }

  loadDocument() {

  }

  pagesLoaded() {
    let provider = this;
    if (provider._page1Pass && provider._page2Pass) {

      provider.app.viewer.checkDocumentPageSizes();

      provider.finalize();
    }
  }

  _documentLoaded() {
    this.finalizeOutLine();
    //checks so that new providers fulfill all the required steps
    if (this.app && this.app.dimensions && this.app.dimensions.pageFit === undefined)
      utils.log("Provider needs to initialize page properties for the app");
    this.app._documentLoaded();
  }

  finalizeOutLine() {

    if (this.app === null || this.app.options === null) return;

    let outline = this.app.options.outline,
      provider = this;

    if (outline) {
      for (let count = 0; count < outline.length; count++) {
        outline[count].custom = true;
        outline[count].dest = outline[count].dest.replace(/javascript:/g,'');
        provider.outline.push(outline[count]);
      }
    }
  }

  search() {

  }
}

class PDFDocumentProvider extends DocumentProvider {

  constructor(props, context) {
    super(props, context);
    let app = this.app,
      provider = this;

    provider.pdfDocument = undefined;

    provider._page2Ratio = undefined;
    provider.cacheBustParameters = "?ver=" + DEARVIEWER.version + "&pdfver=" + app.options.pdfVersion;

    function getPDFScript(callback) {
      if (typeof pdfjsLib === "undefined") {

        app.updateInfo(app.options.text.loading + " PDF Service ...");

        utils.getScript(app.options.pdfjsSrc + provider.cacheBustParameters, function () {

          if (typeof define === 'function' && define.amd && window.requirejs && window.require && window.require.config) {
            app.updateInfo(app.options.text.loading + " PDF Service (require) ...");
            window.require.config({paths: {'pdfjs-dist/build/pdf.worker': app.options.pdfjsWorkerSrc.replace(".js", "")}});
            window.require(['pdfjs-dist/build/pdf'], function (pdfjsLib) {
              window.pdfjsLib = pdfjsLib;
              getWorkerScript(callback);
            });
          }
          else {
            getWorkerScript(callback);
          }
        }, function () {
          app.updateInfo("Unable to load PDF service..");
          provider.dispose();
        }, app.options.pdfjsSrc.indexOf("pdfjs-4") > 1);

      }
      else {
        if (typeof callback === "function") callback();
      }
    }

    function getWorkerScript(callback) {

      app.updateInfo(app.options.text.loading + " PDF Worker ...");
      let tmp = document.createElement('a');
      tmp.href = app.options.pdfjsWorkerSrc + provider.cacheBustParameters;

      if (tmp.hostname !== window.location.hostname && DEARVIEWER['loadCorsPdfjsWorker'] === true) {
        app.updateInfo(app.options.text.loading + " PDF Worker CORS ...");
        jQuery.ajax({
          url: app.options.pdfjsWorkerSrc + provider.cacheBustParameters,
          cache: true,
          success: function (data) {
            app.options.pdfjsWorkerSrc = utils.createObjectURL(data, "text/javascript");
            if (typeof callback === "function") callback();
          }
        });
      }
      else {
        if (typeof callback === "function") callback();
      }
    }

    getPDFScript(function () {
      pdfjsLib.GlobalWorkerOptions.workerSrc = app.options.pdfjsWorkerSrc + provider.cacheBustParameters;
      pdfjsLib.canvasWillReadFrequently = DEARVIEWER.defaults.canvasWillReadFrequently;
      provider.loadDocument();
    });

  }

  dispose() {
    if (this.pdfDocument) this.pdfDocument.destroy();
    this.linkService = utils.disposeObject(this.linkService);
    if (this.pdfLoadProgress) this.pdfLoadProgress.destroy();
    this.pdfLoadProgress = null;
    this.pdfDocument = null;
  }

  loadDocument() {

    let app = this.app,
      options = this.app.options,
      provider = this;

    let parameters = options.pdfParameters || {};
    parameters.url = utils.httpsCorrection(parameters.url || options.source);
    parameters.rangeChunkSize = options.rangeChunkSize;
    parameters.cMapPacked = true;
    parameters.disableAutoFetch = options.disableAutoFetch;
    parameters.disableStream = options.disableStream;
    parameters.disableRange = options.disableRange === true;
    parameters.disableFontFace = options.disableFontFace;
    parameters.isEvalSupported = false;

    parameters.cMapUrl = options.cMapUrl;
    parameters.imagesLocation = options.imagesLocation;
    parameters.imageResourcesPath = options.imageResourcesPath;


    //region Loading Document
    if (!parameters.url && !parameters.data && !parameters.range) {
      //Display No PDF file found error
      app.updateInfo("ERROR : No PDF File provided! ", "df-error");
      return;
    }
    // app.updateInfo(app.options.text.loading + " PDF ...");
    let pdfLoadProcess = provider.pdfLoadProgress = pdfjsLib.getDocument(parameters);

    pdfLoadProcess._worker.promise.then(function (a) {
      app.updateInfo(app.options.text.loading + " PDF ...");
    });

    pdfLoadProcess.onPassword = function (updatePassword, reason) {
      switch (reason) {
        case pdfjsLib.PasswordResponses.NEED_PASSWORD:
          var password = prompt("Enter the password to open the PDF file.");
          if (password === null) {
            throw new Error("No password givsen.");
          }
          updatePassword(password);
          break;
        case pdfjsLib.PasswordResponses.INCORRECT_PASSWORD:
          var password = prompt("Invalid password. Please try again.");
          if (!password) {
            throw new Error("No password givaen.");
          }
          updatePassword(password);
          break;
      }
    }

    pdfLoadProcess.promise.then(
      /**
       * @constructs pdfLoaded
       * @param {PDFDocument} pdf
       */
      function pdfLoaded(pdf) {
        provider.pdfDocument = pdf;
        pdf.getPage(1).then(function (page) {

          //set defaultPage details
          provider.defaultPage = page;
          let _defaultViewPort = provider.defaultPage.viewPort = page.getViewport({
            scale: 1,
            rotation: page._pageInfo.rotate + app.options.pageRotation
          });
          let _defaultPageRatio = provider.defaultPage.pageRatio = _defaultViewPort.width / _defaultViewPort.height;
          let _isDefaultPageWide = _defaultPageRatio > 1;
          provider.viewPorts[1] = _defaultViewPort;

          app.dimensions.defaultPage = {
            ratio: _defaultPageRatio,
            viewPort: _defaultViewPort,
            width: _defaultViewPort.width,
            height: _defaultViewPort.height
          };

          app.dimensions.maxTextureHeight = (options.maxTextureSize ?? 3200) / (!_isDefaultPageWide ? 1
            : _defaultPageRatio);
          app.dimensions.maxTextureWidth = app.dimensions.maxTextureHeight * _defaultPageRatio;
          app.dimensions.autoHeightRatio = 1 / _defaultPageRatio;

          provider.pageCount = pdf.numPages;
          provider.numPages = pdf.numPages;
          provider._page1Pass = true;
          provider.pagesLoaded();

        });

        //check if internal pages are of double sizes.
        if (pdf.numPages > 1 && app.checkSecondPage === true) {
          /**
           * @constructs checkInternalPages
           * @param {PDFPageProxy} page
           */
          pdf.getPage(2).then(function checkInternalPages(page) {

            let _page2ViewPort = page.getViewport({
              scale: 1,
              rotation: page._pageInfo.rotate + app.options.pageRotation
            });
            provider._page2Ratio = _page2ViewPort.width / _page2ViewPort.height;
            provider.viewPorts[2] = _page2ViewPort;
            provider._page2Pass = true;
            provider.pagesLoaded();

          });
        }
        else {
          provider._page2Pass = true;
          provider.pagesLoaded();
        }

      })
      .catch(function (error) {
        if (app !== null && app.options != null) {
          //Find errors condition
          let
            cors = "",
            _a = document.createElement('a');

          _a.href = app.options.source;
          if (_a.hostname !== window.location.hostname
            && _a.href.indexOf("file://") === -1
            && !utils.isChromeExtension()
            && _a.href.indexOf("blob:") === -1)
            cors = "<strong>CROSS ORIGIN!! </strong>";

          let fileName = app.options?.fileName || _a.href;
          //Display error reason
          app.updateInfo(cors + "<strong>Error: Cannot access file!  </strong>" + fileName + "<br><br>" + error.message, "df-error");
          console.log(error);
          app.container.removeClass('df-loading').addClass("df-error");
          provider.dispose();

        }
      });

    pdfLoadProcess.getTotalLength = function () {
      return provider.pdfLoadProgress._transport._networkStream._fullRequestReader.contentLength;
    }
    pdfLoadProcess.onProgress = function getDocumentProgress(progressData) {
      if (app !== null) {
        let percentage = 100 * progressData.loaded / pdfLoadProcess.getTotalLength();
        if (isNaN(percentage)) { //in case divided by zero/undefined -- don't have total value
          if (progressData && progressData.loaded) {
            // skip loading value if the differnces is less than 250kb,
            // not required in percentage since percentage only updates in partial load chunk completion
            if (pdfLoadProcess.lastLoaded === void 0 || pdfLoadProcess.lastLoaded + 250000 < progressData.loaded) {
              pdfLoadProcess.lastLoaded = progressData.loaded;
              app.updateInfo(app.options.text.loading + " PDF " + (Math.ceil(progressData.loaded / 10000) / 100).toFixed(2).toString() + "MB ...");
            }
          }
          else {
            app.updateInfo(app.options.text.loading + " PDF ...");
          }
        }
        else {
          app.updateInfo(app.options.text.loading + " PDF " + Math.ceil(Math.min(100, percentage)).toString().split(".")[0] + "% ...");
        }
      }
    };
    //endregion
  }

  pdfFetchStarted() {
    this.pdfFetchStatusCount = 0
    this.app.container.addClass('df-fetch-pdf');
    this.pdfFetchStatus = DEARVIEWER.REQUEST_STATUS.COUNT;
  }

  checkRequestQueue() {
    return;
    let REQUEST_STATUS = DEARVIEWER.REQUEST_STATUS;

    if (this.pdfFetchStatus === REQUEST_STATUS.ON) {
      this.app.container.removeClass('df-fetch-pdf');
      this.pdfFetchStatus = REQUEST_STATUS.OFF;
    }
    else if (this.pdfFetchStatus === REQUEST_STATUS.COUNT) {
      this.pdfFetchStatusCount++;
      if (this.pdfFetchStatusCount > 30) {
        this.pdfFetchStatusCount = 0;
        this.pdfFetchStatus = REQUEST_STATUS.ON;
      }
    }
  }

  finalize() {
    let app = this.app,
      provider = this;
    if (app === null || app.options === null) return;

    provider.linkService = new PDFLinkService();
    provider.linkService.setDocument(provider.pdfDocument, null);
    provider.linkService.setViewer(app);

    provider.pdfDocument.getOutline().then(function (pdfOutline) {
      if (app.options.overwritePDFOutline === true) {
        pdfOutline = [];
      }
      pdfOutline = pdfOutline || [];
      provider.outline = pdfOutline;

    }).finally(function () {
      provider._getLabels();
    });
  }

  _getLabels() {
    let app = this.app,
      provider = this;
    provider.pdfDocument.getPageLabels().then(function (pageLabels) {
      if (!pageLabels || app.options.disablePageLabels === true) {
        return;
      }
      const numLabels = pageLabels.length;
      // Ignore page labels that correspond to standard page numbering,
      // or page labels that are all empty.
      let standardLabels = 0,
        emptyLabels = 0;
      for (let i = 0; i < numLabels; i++) {
        const label = pageLabels[i];
        if (label === (i + 1).toString()) {
          standardLabels++;
        }
        else if (label === "") {
          emptyLabels++;
        }
        else {
          break;
        }
      }
      if (standardLabels >= numLabels || emptyLabels >= numLabels) {
        return;
      }
      provider.pageLabels = pageLabels;
    }).finally(function () {
      provider._getPermissions();
    });
  }

  _getPermissions() {
    let app = this.app,
      provider = this;
    provider.pdfDocument.getPermissions().then(function (permissions) {
      if (permissions !== null && Array.isArray(permissions)) {
        provider.canPrint = permissions.indexOf(pdfjsLib.PermissionFlag.PRINT) > -1;
        if (provider.canPrint == false) {
          console.log("PDF printing is disabled.");
          app.options.showPrintControl = app.options.showPrintControl && provider.canPrint;
        }
      }
    }).finally(function () {
      provider._documentLoaded();
    });
  }

  processPage(param) {
    let app = this.app,
      provider = this,
      pageNumber = param.pageNumber,
      startTime = performance.now();

    let dimen = app.viewer.getTextureSize(param);
    if(DEARFLIP.defaults.cachePDFTexture === true){
      if(this.getCache(pageNumber,dimen.height) !== undefined){
        app.applyTexture(this.getCache(pageNumber,dimen.height), param);
        utils.log("Texture loaded from cache for : " + pageNumber);
        return;
      }
    }

    //region determine page to render
    let pdfPageNumberToRender = app.viewer.getDocumentPageNumber(pageNumber);

    //endregion
    utils.log("Requesting PDF Page:" + pdfPageNumberToRender);
    provider.pdfDocument.getPage(pdfPageNumberToRender).then(function (pdfPage) {
      if (!provider.viewPorts[pageNumber]) {
        param.isFreshPage = true;
        provider.viewPorts[pageNumber] = pdfPage.getViewport({
          scale: 1,
          rotation: pdfPage._pageInfo.rotate + app.options.pageRotation
        });
      }
      //region Render the Page

      let renderContext = app.viewer.getRenderContext(pdfPage, param);
      if (param.isFreshPage) {
        app.viewer.getPageByNumber(param.pageNumber)?.changeTexture(param.pageNumber, renderContext.canvas.height);
      }
      utils.log("Page " + pageNumber + " rendering - " + renderContext.canvas.width + "x" + renderContext.canvas.height);

      param.trace = provider.requestIndex++;
      provider.requestedPages += "," + param.trace + "[" + pdfPageNumberToRender + "|" + renderContext.canvas.height + "]";
      pdfPage.cleanupAfterRender = false;//needs to disable the cleanup after render code in pdf.js
      let pageRendering = pdfPage.render(renderContext);

      pageRendering.promise.then(
        function () {
          app.applyTexture(renderContext.canvas, param);
          if(DEARFLIP.defaults.cachePDFTexture === true){
            provider.setCache(param.pageNumber,renderContext.canvas,dimen.height);
          }
          if (app.options.cleanupAfterRender === true) {
            var checkString = "," + param.trace + "[" + pdfPageNumberToRender + "|" + renderContext.canvas.height + "]";
            utils.log("CleanUp Requesting for (" + pageNumber + ") actual " + pdfPageNumberToRender);

            if (provider.requestedPages.indexOf(checkString) > -1) {
              provider.requestedPages = provider.requestedPages.replace(checkString, "");
              if (provider.requestedPages.indexOf("[" + pdfPageNumberToRender + "|") == -1) {
                utils.log("CleanUp Passed for (" + pageNumber + ") actual " + pdfPageNumberToRender);
                provider.pagesToClean.push(pdfPage);
                if (provider.pagesToClean.length > 0)
                  provider.cleanUpPages();
              }
              else {
                utils.log("CleanUp Cancelled waiting for (" + pageNumber + ") actual " + pdfPageNumberToRender + " : " + provider.requestedPages);
              }
            }
          }
          renderContext = null;
          utils.log("Rendered " + pageNumber + " in " + (performance.now() - startTime) + " milliseconds");
        }).catch(function (error) {
        console.log(error);
      });
      //endregion
    }).catch(function (error) {
      console.log(error);
    });

  }

  cleanUpPages() {

    while (this.pagesToClean.length > 0) {
      var page = this.pagesToClean.splice(-1)[0];
      utils.log("Cleanup Completed for PDF page: " + (page._pageIndex + 1));
      page.cleanup();
    }
  }

  clearSearch() {
    var provider = this;

    provider.searchHits = [];
    provider.searchHitItemsCache = [];
    provider.totalHits = 0;
    provider.app.searchResults.html("");
    provider.app.container.removeClass("df-search-open");
    provider.textSearch = "";
    provider.app.container.find(".df-search-hits").remove();
  }

  search(text) {
    var provider = this;
    if (provider.textSearch === text) return;
    provider.clearSearch();

    if (text.length < 3 && text != "") {
      provider.app.updateSearchInfo("Minimum 3 letters required.");
      return;
    }
    provider.textSearch = text;
    provider.textSearchLength = text.length;

    provider.app.searchContainer.addClass("df-searching");
    provider.app.container.addClass('df-fetch-pdf');
    provider._search(text, 1);
  }

  _search(text, pageNumber = 1) {
    var provider = this;
    provider.app.updateSearchInfo("Searching Page: " + pageNumber);
    provider.searchPage(pageNumber).then(function (textContent) {
      // console.log(textContent);
      let searchString = textContent, pos = 0, myRegexp = new RegExp(text, 'gi'), result;

      let hits = [];
      while (result = myRegexp.exec(searchString)) {
        hits.push({index: result.index, length: provider.textSearchLength});
      }
      provider.searchHits[pageNumber] = hits;

      if (hits.length > 0) {
        let searchPage = provider.app.viewer.searchPage(pageNumber);
        if (searchPage.include === true) {
          provider.totalHits += hits.length;
          provider.app.searchResults.append(
            '<div class="df-search-result ' +
            (provider.app.currentPageNumber === pageNumber ? 'df-active' : '') +
            '" data-df-page="' + pageNumber + '">' +
            '<span>Page ' + searchPage.label + '</span><span>' + hits.length + ' ' +
            (hits.length > 1 ? 'results' : 'result') +
            '</span></div>');
        }
      }
      if (provider.app.viewer.isActivePage(pageNumber)) {
        provider.processTextContent(pageNumber, provider.app.viewer.getTextElement(pageNumber, true));
        provider.app.ui.update();
      }
      provider._search(text, pageNumber + 1);
    }).catch(function () {

    }).finally(function () {
      if (provider.totalHits == 0) {
        provider.app.updateSearchInfo("No results Found!");
      }
      else {
        provider.app.updateSearchInfo(provider.totalHits + " results found");
      }

      provider.app.searchContainer.removeClass("df-searching");
      provider.app.container.removeClass('df-fetch-pdf');
    });
  }

  prepareTextContent(textContent, pageNumbertoSearch, rePrepare = false) {
    var provider = this;
    if (provider.textContentJoinedSearch[pageNumbertoSearch] == void 0 || rePrepare) {
      var provider = this;
      let item, p = 0, p_search = 0, len = 0;
      provider.textContentSearch[pageNumbertoSearch] = [];
      provider.textContent[pageNumbertoSearch] = [];
      provider.textOffsetSearch[pageNumbertoSearch] = [];
      provider.textOffset[pageNumbertoSearch] = [];
      provider.textContentJoinedSearch[pageNumbertoSearch] = [];
      provider.textContentJoined[pageNumbertoSearch] = [];
      for (var item_count = 0; item_count < textContent.items.length; item_count++) {
        item = textContent.items[item_count];
        provider.textContentSearch[pageNumbertoSearch].push(item.hasEOL === true ? item.str + " " : item.str);
        provider.textContent[pageNumbertoSearch].push(item.str + " ");

        len = (item.str.length || 0) + (item.hasEOL === true ? 1 : 0);
        p_search += len;
        provider.textOffsetSearch[pageNumbertoSearch].push({length: len, offset: p_search - len});
        len = (item.str.length || 0) + 1;
        p += len;
        provider.textOffset[pageNumbertoSearch].push({length: len, offset: p - len});
      }
      provider.textContentJoinedSearch[pageNumbertoSearch] = provider.textContentSearch[pageNumbertoSearch].join("");
      provider.textContentJoined[pageNumbertoSearch] = provider.textContent[pageNumbertoSearch].join("");
    }
  }

  searchPage(pageNumber) {
    var provider = this;
    return new Promise(function (resolve, reject) {
      if (!provider._isValidPage(pageNumber)) {reject();}
      else {
        try {
          let pageNumbertoSearch = provider.app.viewer.getDocumentPageNumber(pageNumber);
          if (provider.textContentJoinedSearch[pageNumbertoSearch] == void 0) {
            provider.pdfDocument.getPage(pageNumbertoSearch).then(function (page) {
              page.getTextContent().then(function (textContent) {
                provider.prepareTextContent(textContent, pageNumbertoSearch);
                resolve(provider.textContentJoinedSearch[pageNumbertoSearch]);
              })
            });
          }
          else {
            resolve(provider.textContentJoinedSearch[pageNumbertoSearch]);
          }
        } catch (error) {
          utils.log(error);
          reject(error);
        }
      }
    });
  }

}

DEARVIEWER.providers['pdf'] = PDFDocumentProvider;
export {DocumentProvider, PDFLinkService, PDFDocumentProvider};
