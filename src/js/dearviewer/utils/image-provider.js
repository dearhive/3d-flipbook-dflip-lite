import {DEARVIEWER} from "../defaults.js";
import {DocumentProvider, PDFLinkService} from "./provider.js";

let utils = DEARVIEWER.utils;

class ImagePage {
  constructor(props) {
    this._viewPort = new Viewport(0, 0);
    this._pageInfo = {
      rotate: 0
    };
    this.src = props.src;
  }

  getViewport(params = {scale: 1}) {
    return new Viewport(this._viewPort.height * params.scale, this._viewPort.width * params.scale, params.scale);
  }
}

class ImageDocument {
  constructor(source) {
    this.source = [];
    this.pages = [];
    this.numPages = source.length;
    for (var _correct = 0; _correct < source.length; _correct++) {
      this.source[_correct] = utils.httpsCorrection(source[_correct].toString());
      this.pages.push(new ImagePage({src: this.source[_correct]}));
    }
  }

  getPage(pageNumber) {
    var provider = this;
    return new Promise(function (resolve, reject) {
      try {
        jQuery("<img/>")
          .attr("src", provider.source[pageNumber - 1])
          .prop("crossOrigin","Anonymous")
          .on('load', (function () {
            jQuery(this).off();
            var page = new ImagePage({src: this.src});
            page._viewPort.height = this.height;
            page._viewPort.width = this.width;
            page._viewPort.scale = 1;
            page.image = this;
            resolve(page);
          }));
      } catch (error) {
        reject(error);
      }
    });
  }
}

class Viewport {
  constructor(height, width, scale = 1) {
    this.scale = scale;
    this.height = height;
    this.width = width;
    this.scale = scale;
    this.transform = [0, 0, 0, 0, 0, this.height];
  }

  clone() {
    return new Viewport(this.height, this.width, this.scale);
  }
}

class ImageDocumentProvider extends DocumentProvider {
  constructor(options, context) {
    super(options, context);
    let app = this.app,
      provider = this;

    provider.document = new ImageDocument(app.options.source);
    provider.pageCount = provider.document.numPages;
    provider.numPages = provider.document.numPages;

    provider.loadDocument();

  }

  dispose() {

  }

  loadDocument() {
    let app = this.app,
      options = this.app.options,
      provider = this;


    provider.document.getPage(1).then(function (page) {
      provider.defaultPage = page;
      let _defaultViewPort = provider.defaultPage.viewPort = page._viewPort;
      let _defaultPageRatio = provider.defaultPage.pageRatio = _defaultViewPort.width / _defaultViewPort.height;

      let _isdefaultPageWide = _defaultPageRatio > 1;
      provider.viewPorts[1] = _defaultViewPort;

      app.dimensions.defaultPage = {
        ratio: _defaultPageRatio,
        viewPort: _defaultViewPort,
        width: _defaultViewPort.width,
        height: _defaultViewPort.height
      };

      app.dimensions.maxTextureHeight = (options.maxTextureSize ?? 3200) / (!_isdefaultPageWide ? 1 : _defaultPageRatio);
      app.dimensions.maxTextureWidth = app.dimensions.maxTextureHeight * _defaultPageRatio;
      app.dimensions.autoHeightRatio = 1 / _defaultPageRatio;

      provider._page1Pass = true;
      provider.pagesLoaded();
    });

    //check if internal pages are of double sizes.
    if (provider.pageCount > 1 && app.checkSecondPage === true) {
      provider.document.getPage(2).then(function (page) {
        let _page2ViewPort = page._viewPort;
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
  }

  finalize() {
    let app = this.app,
      provider = this;
    if (app === null || app.options === null) return;

    provider.linkService = new PDFLinkService();
    // provider.linkService.setDocument(provider.pdfDocument, null);
    provider.linkService.setViewer(app);

    provider._documentLoaded();
  }

  processPage(param) {
    let app = this.app,
      provider = this,
      pageNumber = param.pageNumber,
      startTime = performance.now();

    //region determine page to render
    let pdfPageNumberToRender = app.viewer.getDocumentPageNumber(pageNumber);

    utils.log("Requesting PDF Page:" + pdfPageNumberToRender);
    provider.document.getPage(pdfPageNumberToRender).then(function (page) {
      if (!provider.viewPorts[pageNumber]) {
        param.isFreshPage = true;
        provider.viewPorts[pageNumber] = page._viewPort;
      }
      let renderContext = app.viewer.getRenderContext(page, param);

      if (param.isFreshPage) {
        app.viewer.getPageByNumber(param.pageNumber)?.changeTexture(param.pageNumber, renderContext.canvas.height);
      }

      param.preferCanvas = true;
      if (param.preferCanvas === true) {
        var context = renderContext.canvas.getContext("2d");
        context.drawImage(page.image, renderContext.viewport.transform[4], 0, renderContext.canvas.width * (renderContext.viewport.widthFix ?? 1), renderContext.canvas.height);
        //todo cleanup page.image , don't keep in memory
        app.applyTexture(renderContext.canvas, param);
      }
      else {
        app.applyTexture({
          src: page.src,
          height: renderContext.canvas.height,
          width: renderContext.canvas.width
        }, param);
      }
      utils.log("Rendered " + pageNumber + " in " + (performance.now() - startTime) + " milliseconds");
    });

  }

}

DEARVIEWER.providers['image'] = ImageDocumentProvider;
export {ImageDocumentProvider};
