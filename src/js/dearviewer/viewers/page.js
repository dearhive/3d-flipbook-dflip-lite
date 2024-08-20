/* globals jQuery, pdfjsLib,THREE  */
import {DEARVIEWER} from "../defaults.js";
let DV = DEARVIEWER;
let utils = DEARVIEWER.utils;

class Page {

  constructor() {
    this.textureLoadFallback = "blank";
    this.textureStamp = "-1";
    this.textureLoaded = false;
    this.texture = "blank";
    this.textureSrc = "blank";
    this.pageNumber = undefined;
    this.contentLayer = jQuery('<div>', {class: "df-page-content"});
  }

  reset() {
    this.resetTexture();
    this.resetContent();
  }

  resetTexture() {
    this.textureLoaded = false;
    this.textureStamp = "-1";
    this.loadTexture({texture: this.textureLoadFallback});
    this.contentLayer.removeClass("df-content-loaded");
  }

  clearTexture() {
    this.loadTexture({texture: this.textureLoadFallback});
  }

  resetContent() {

  }

  loadTexture(param) {

  }

  getTexture(clone = false) {
    let texture = this.textureSrc;
    if (clone === true && texture && texture.cloneNode) {
      texture = texture.cloneNode();
      if (texture.getContext)
        texture.getContext('2d').drawImage(this.textureSrc, 0, 0);
    }
    return texture;
  }

  setLoading() {

  }

  updateTextureLoadStatus(textureLoaded) {
    this.textureLoaded = textureLoaded === true;
    utils.log((this.textureLoaded === true ? "Loaded " : "Loading ") + this.textureStamp + " for " + this.pageNumber);
    this.contentLayer.toggleClass("df-content-loaded", textureLoaded === true);
    this.setLoading();
  }

  /**
   *
   * @param pageNumber
   * @param textureSize
   * @returns {boolean} true if new stamp is set
   */
  changeTexture(pageNumber, textureSize) {
    let page = this;
    let reqStamp = pageNumber + "|" + textureSize;
    if (page.textureStamp !== reqStamp) {
      utils.log("Page " + pageNumber + " : texture changed from - " + page.textureStamp + " to " + reqStamp);

      page.textureLoaded = false;
      // page.element.attr("stamp", reqStamp);
      page.textureStamp = reqStamp;

      page.updateTextureLoadStatus(false);
      return true;
    }
    return false;
  }
}

class Page2D extends Page {
  constructor(options) {
    super();
    this.canvasMode = null;
    if (options && options.parentElement)
      this.parentElement = options.parentElement;
    this.init();
  }

  init() {

    let element = this.element = jQuery('<div>', {class: 'df-page'});
    element[0].appendChild(this.contentLayer[0]);

    this.texture = new Image();
    if (this.parentElement)
      this.parentElement[0].append(element[0]);

  }

  resetContent() {
    if (this.annotationElement !== undefined)
      this.annotationElement.html("");
    if (this.textElement !== undefined)
      this.textElement.html("");
  }

  setLoading() {
    this.element.toggleClass("df-loading", this.textureLoaded !== true);
  }

  loadTexture(param) {
    let page = this,
      texture = param.texture,
      callback = param.callback;

    function completed() {
      page.textureSrc = texture;
      page.element.css({
        backgroundImage: utils.bgImage(texture)
      });
      page.updateTextureLoadStatus(true);
      if (typeof callback == 'function') callback(param);
    }

    if (page.canvasMode === null && texture && texture.nodeName === "CANVAS")
      page.canvasMode = true;

    if (page.canvasMode === true) {
      page.element.find(">canvas").remove();
      if (texture !== page.textureLoadFallback) {
        page.textureSrc = texture;
        page.element.append(jQuery(texture));
        // page.element.width(texture.width).height(texture.height);
      }
      page.updateTextureLoadStatus(true);
      if (typeof callback == 'function') callback(param);
    }
    else {
      if (texture === page.textureLoadFallback) {
        completed();
      }
      else {
        page.texture.onload = completed;
        page.texture.src = texture;
      }
    }
  }

  updateCSS(css) {
    let page = this;
    page.element.css(css);
  }

  resetCSS() {
    let page = this;

    page.element.css({
      transform: '',
      boxShadow: '',
      display: "block"
    });

  }
}

export {Page, Page2D};
