import { DEARVIEWER } from "../defaults.js";
import { Reader } from "./reader.js";
import { Slider } from "./slider.js";
import { FlipBook2D } from "./flipbook-2d.js";
import { FlipBook3D } from "./flipbook-3d.js";

DEARVIEWER.defaults.maxTextureSize = 2048;

class FlipBook {
  constructor(options, appContext) {
    if (DEARVIEWER.utils.canSupport3D() == false) {
      options.is3D = false; //IE 11
    }

    if  (DEARVIEWER.utils.isTrue(options.is3D)) {
      return new FlipBook3D(options, appContext);
    }

    return new FlipBook2D(options, appContext)
  }
}

DEARVIEWER.viewers = {};
DEARVIEWER.viewers["flipbook"] = FlipBook;
DEARVIEWER.viewers["default"] = DEARVIEWER.viewers["reader"] = Reader;
DEARVIEWER.viewers["slider"] = Slider;
