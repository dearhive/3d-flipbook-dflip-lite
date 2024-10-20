/* globals jQuery, pdfjsLib,THREE  */
import {DEARVIEWER} from "../defaults.js";
import {MOCKUP} from "./mockup.js";
import {BaseFlipBookViewer, BookSheet} from "./flipbook.js";
import {Page, Page2D} from "./page.js";

let DV = DEARVIEWER;
let utils = DV.utils;

class BookSheet3D extends BookSheet {
  constructor(options) {
    super(options);

    this.flexibility = options.flexibility;
    this.sheetAngle = 180;
    this.curveAngle = 0;
    this.parent3D = options.parent3D;

    this.segments = options.segments || 50;
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.depth = options.depth || 0.5;//is overridden from options
    this.matColor = "white";
    this.fallbackMatColor = MOCKUP.WHITE_COLOR;
    this.init();
    this.bumpScale = [0, 0, 0, 0, 1, 1];
  }

  init() {
    let sheet = this;
    sheet.element = new MOCKUP.Paper({
      parent3D: sheet.parent3D,
      segments: sheet.segments,
      depth: sheet.depth,
      height: sheet.height,
      width: sheet.width,
      flatShading: sheet.flexibility === 0 ? true : false
    });
    sheet.element.sheet = sheet;
    sheet.frontPage = new Page3D({
      sheet: sheet, face: 5
    });
    sheet.backPage = new Page3D({
      sheet: sheet, face: 4
    });
    sheet.reset();
    sheet.updateAngle();
    //sheet.element.loadBump("http://localhost/tmp/cardboard.png");
  }

  setMatColor(val, face) {
    this.matColor = new THREE.Color(val);
    if (face === void 0) {
      for (let i = 0; i < 6; i++) {
        this.element.material[i].color = this.matColor;
      }
    }
    else {
      this.element.material[face].color = this.matColor;
    }
  }

  getBumpScale(face) {
    return this.bumpScale[face];
  }

  resetMatColor(face, applyMatColor) {
    this.element.material[face].color = applyMatColor ? this.matColor : this.fallbackMatColor;
  }

  frontImage(texture, callback) {
    this.element.frontImage(texture, callback);
  }

  backImage(texture, callback) {
    this.element.backImage(texture, callback);
  }

  updateAngle() {

    let sheet = this;
    if (this.viewer === undefined || this.viewer === null) return;
    let flexibility = sheet.isHard === true ? 0 : sheet.flexibility;
    let width = (this.viewer.orientation === 'vertical' ? this.height : this.width)
      * ((1 - Math.sin((flexibility / 2) * (flexibility / 2)) / 2) - (flexibility) / 20);
    this.element.scale.y = (this.viewer.orientation === 'vertical' ? this.width : this.height)
      / this.element.geometry.parameters.height;
    // this.element.scale.x = this.width / this.element.geometry.parameters.width;
    // this.element.scale.z = 1;
    let segments = sheet.segments;
    let foldCount = 1;


    let foldWidth = width / foldCount; //fold-width
    let curveHandlePoint = foldWidth * flexibility; //bend control point distance
    let curveWidth = foldWidth; //curve width still not perfect
    //control pointsFront are a list of at least (degree+1)
    let curvesFront = [];
    let curvesBack = [];
    let verticesFront = [];
    let verticesBack = [];
    let pointsFront = [];
    let pointsBack = [];
    let sheetDepth = sheet.depth; // distance Bias

    //calculate folds controls points
    let sum = 0, distances = [];
    distances.push(sum);
    // let test = false;

    // region CalcPoints

    pointsFront[0] = [];
    pointsBack[0] = [];

    let sheetAngle = sheet.sheetAngle * Math.PI / 180; // the angle at which the sheet will turn
    // if (this.viewer.pageOffset && this.viewer.hasSpiral) {
    if (this.viewer.orientation !== 'vertical') {
      this.element.position.x = -Math.cos(sheetAngle) * this.viewer.pageOffset;
    }
    if (this.viewer.orientation === 'vertical') {
      this.element.position.y = Math.cos(sheetAngle) * this.viewer.pageOffset;
    }
    // }
    let curveAngle = sheet.isHard === true ? sheetAngle : ((sheet.curveAngle)) * Math.PI / 180; // the angle at which curve will form due to curve handle point

    let pointAngle = sheet.sheetAngle * Math.PI / 180;
    let pointAngleB = pointAngle - Math.PI / 2,
      zShift = Math.sin(pointAngleB) * sheetDepth / 2;

    pointsFront[0][0] = pointsFront[0][1] = new THREE.Vector3(-curveWidth * Math.cos(sheetAngle), 0, Math.sin(sheetAngle) * curveWidth - zShift);
    pointsBack[0][0] = pointsBack[0][1] = new THREE.Vector3(pointsFront[0][0].x - Math.cos(pointAngleB) * sheetDepth, 0, pointsFront[0][0].z + zShift * 2);


    pointsFront[0][1] = new THREE.Vector3(-curveWidth / 2 * Math.cos(curveAngle), 0, curveWidth / 2 * Math.sin(curveAngle) - zShift);
    pointsBack[0][1] = new THREE.Vector3(pointsFront[0][1].x - Math.cos(pointAngleB) * sheetDepth, 0, pointsFront[0][1].z + zShift * 2);

    pointAngle = (45 + sheet.sheetAngle / 2) * Math.PI / 180;

    pointsFront[0][2] = new THREE.Vector3(-Math.cos(pointAngle) * curveHandlePoint / 2, 0, Math.sin(pointAngle) * curveHandlePoint - zShift);
    pointsBack[0][2] = new THREE.Vector3(pointsFront[0][2].x + Math.cos(pointAngleB) * sheetDepth, 0, pointsFront[0][2].z + zShift * 2);
    if (Math.abs(pointsBack[0][2].x - 0) < 0.0005) pointsBack[0][2].x = 0;

    pointsFront[0][3] = new THREE.Vector3(0, 0, -zShift);
    pointsBack[0][3] = new THREE.Vector3(pointsFront[0][3].x - Math.cos(pointAngleB) * sheetDepth, 0, pointsFront[0][3].z + zShift * 2); //pointsFront[0][3];
    if (Math.abs(pointsBack[0][3].x - 0) < 0.0005) pointsBack[0][3].x = 0;
    //endregion

    for (let curveCount = 0; curveCount < foldCount; curveCount++) {

      let length = Math.max(sheet.segments - 1, 1);
      curvesFront[curveCount] = new THREE.CubicBezierCurve3(
        pointsFront[curveCount][0], pointsFront[curveCount][1], pointsFront[curveCount][2], pointsFront[curveCount][3]);
      verticesFront[curveCount] = curvesFront[curveCount].getPoints(length);

      if (length > 2) {
        verticesFront[curveCount].push(new THREE.Vector3().copy(verticesFront[curveCount][length]));
      }
      let current, last = verticesFront[curveCount][0];
      for (let vcount = 1; vcount < verticesFront[curveCount].length; vcount++) {
        current = verticesFront[curveCount][vcount];
        sum += current.distanceTo(last);
        distances.push(sum);
        last = current;
      }

      curvesBack[curveCount] = new THREE.CubicBezierCurve3(
        pointsBack[curveCount][0], pointsBack[curveCount][1], pointsBack[curveCount][2], pointsBack[curveCount][3]);
      verticesBack[curveCount] = curvesBack[curveCount].getPoints(length);
      if (length > 2) {
        verticesBack[curveCount].push(new THREE.Vector3().copy(verticesBack[curveCount][length]));
      }
    }
    /*var test = true;
    if (test === true) {
      if (sheet.handlesf === void 0) {

        let material = new THREE.LineBasicMaterial({color: 0x00ff00});

        let geometry = new THREE.Geometry();
        geometry.vertices.push(
          pointsFront[0][0], pointsFront[0][1], pointsFront[0][2], pointsFront[0][3]
        );

        sheet.handlesf = new THREE.Line(geometry, material);
        sheet.element.add(sheet.handlesf);

      }
      else {
        let hvs = sheet.handlesf.geometry.vertices;
        for (let hcount = 0; hcount < hvs.length; hcount++) {
          hvs[hcount] = pointsFront[0][hcount];
        }
        sheet.handlesf.geometry.verticesNeedUpdate = true;
      }
      if (sheet.handlesb === void 0) {

        let material = new THREE.LineBasicMaterial({color: 0x0000ff});

        let geometry = new THREE.Geometry();
        geometry.vertices.push(
          pointsBack[0][0], pointsBack[0][1], pointsBack[0][2], pointsBack[0][3]
        );

        sheet.handlesb = new THREE.Line(geometry, material);
        sheet.element.add(sheet.handlesb);

      }
      else {
        let hvs = sheet.handlesb.geometry.vertices;
        for (let hcount = 0; hcount < hvs.length; hcount++) {
          hvs[hcount] = pointsBack[0][hcount];
        }
        sheet.handlesb.geometry.verticesNeedUpdate = true;
      }
    }

*/

    let bodyG = sheet.element.geometry;
    if (bodyG.attributes !== void 0) {

      //5 segments have 56 vertices
      /*
      * 5 segments have 56 vertices
      * 8 are side vertices
      * remaining 48 in 4 faces
      * each 12 vertices
      *rowvertices = segments + 1
      * 1,7   -   2,8   -   3,9   -   4,10  -   5,11  -   6,12    x + rowvertices*0 + count, x + rowvertices*1 + count
      * 13,19 -   14,20 -   15,21 -   16,22 -   17,23 -   18,24   x + rowvertices*2 + 1, x + rowvertices*3 + 1
      * 25,31 -   26,32 -   27,33 -   28,34 -   29,35 -   30,36
      * 37,43 -   38,44 -   39,45 -   40,46 -   41,47 -   42,48
      *
      * */

      let positions = bodyG.attributes.position;
      let uvs = bodyG.attributes.uv;

      let rowVertices = segments + 1;
      let offset = 8;

      //region basic side vertices
      //Update the geometry based on angles
      positions.setZ(0, verticesFront[0][segments].z);
      positions.setZ(2, verticesFront[0][segments].z);
      positions.setX(0, verticesFront[0][segments].x);
      positions.setX(2, verticesFront[0][segments].x);
      // verts[0].z = verts[2].z = verticesFront[0][segments].z;
      // verts[0].x = verts[2].x = verticesFront[0][segments].x;

      positions.setZ(1, verticesBack[0][segments].z);
      positions.setZ(3, verticesBack[0][segments].z);
      positions.setX(1, verticesBack[0][segments].x);
      positions.setX(3, verticesBack[0][segments].x);
      // verts[1].z = verts[3].z = verticesBack[0][segments].z;
      // verts[1].x = verts[3].x = verticesBack[0][segments].x;

      positions.setZ(5, verticesFront[0][0].z);
      positions.setZ(7, verticesFront[0][0].z);
      positions.setX(5, verticesFront[0][0].x);
      positions.setX(7, verticesFront[0][0].x);
      // verts[5].z = verts[7].z = verticesFront[0][0].z;
      // verts[5].x = verts[7].x = verticesFront[0][0].x;

      positions.setZ(4, verticesBack[0][0].z);
      positions.setZ(6, verticesBack[0][0].z);
      positions.setX(4, verticesBack[0][0].x);
      positions.setX(6, verticesBack[0][0].x);
      // verts[4].z = verts[6].z = verticesBack[0][0].z;
      // verts[4].x = verts[6].x = verticesBack[0][0].x;

      //endregion

      for (let fold = 0; fold < foldCount; fold++) {

        for (let count = 0; count < rowVertices; count++) {

          positions.setZ(offset + rowVertices * 0 + count, verticesFront[0][count].z);
          positions.setX(offset + rowVertices * 0 + count, verticesFront[0][count].x);
          positions.setZ(offset + rowVertices * 1 + count, verticesBack[0][count].z);
          positions.setX(offset + rowVertices * 1 + count, verticesBack[0][count].x);

          positions.setZ(offset + rowVertices * 2 + count, verticesFront[0][count].z);
          positions.setX(offset + rowVertices * 2 + count, verticesFront[0][count].x);
          positions.setZ(offset + rowVertices * 3 + count, verticesBack[0][count].z);
          positions.setX(offset + rowVertices * 3 + count, verticesBack[0][count].x);

          positions.setZ(offset + rowVertices * 4 + count, verticesFront[0][count].z);
          positions.setX(offset + rowVertices * 4 + count, verticesFront[0][count].x);
          positions.setZ(offset + rowVertices * 5 + count, verticesFront[0][count].z);
          positions.setX(offset + rowVertices * 5 + count, verticesFront[0][count].x);
          uvs.setX(offset + rowVertices * 4 + count, distances[count] / sum);
          uvs.setX(offset + rowVertices * 5 + count, distances[count] / sum);

          positions.setZ(offset + rowVertices * 6 + count, verticesBack[0][segments - count].z);
          positions.setX(offset + rowVertices * 6 + count, verticesBack[0][segments - count].x);
          positions.setZ(offset + rowVertices * 7 + count, verticesBack[0][segments - count].z);
          positions.setX(offset + rowVertices * 7 + count, verticesBack[0][segments - count].x);
          uvs.setX(offset + rowVertices * 6 + count, 1 - distances[segments - count] / sum);
          uvs.setX(offset + rowVertices * 7 + count, 1 - distances[segments - count] / sum);

          // verts[offset].z = verts[offset + rowVertices * 3].z = verticesBack[0][count].z;
          // verts[offset].x = verts[offset + rowVertices * 3].x = verticesBack[0][count].x;

          // verts[offset + rowVertices].z = verts[offset + rowVertices * 2].z = verticesFront[0][count].z;
          // verts[offset + rowVertices].x = verts[offset + rowVertices * 2].x = verticesFront[0][count].x;

          // offset++;
        }
      }

      bodyG.computeBoundingBox();

      sheet.element.scale.x = curveWidth * foldCount / sum;
      // sheet.element.scale.z = sheet.element.scale.x;//1 + (Math.cos(pointAngleB) * sheet.element.scale.x / sheet.element.scale.x);

      bodyG.computeBoundingSphere();
      positions.needsUpdate = true;
      uvs.needsUpdate = true;

      bodyG.computeVertexNormals();

    }
    else {
      let verts = bodyG.vertices;

      let rowVertices = segments - 1;
      let offset = 8;

      //Update the geometry based on angles
      verts[0].z = verts[2].z = verticesFront[0][segments].z;
      verts[0].x = verts[2].x = verticesFront[0][segments].x;

      verts[1].z = verts[3].z = verticesBack[0][segments].z;
      verts[1].x = verts[3].x = verticesBack[0][segments].x;

      verts[5].z = verts[7].z = verticesFront[0][0].z;
      verts[5].x = verts[7].x = verticesFront[0][0].x;

      verts[4].z = verts[6].z = verticesBack[0][0].z;
      verts[4].x = verts[6].x = verticesBack[0][0].x;


      for (let fold = 0; fold < foldCount; fold++) {

        for (let count = 1; count < segments; count++) {

          verts[offset].z = verts[offset + rowVertices * 3].z = verticesBack[0][count].z;
          verts[offset].x = verts[offset + rowVertices * 3].x = verticesBack[0][count].x;

          verts[offset + rowVertices].z = verts[offset + rowVertices * 2].z = verticesFront[0][count].z;
          verts[offset + rowVertices].x = verts[offset + rowVertices * 2].x = verticesFront[0][count].x;

          offset++;
        }
      }

      let uvs = bodyG.faceVertexUvs[0];
      let faces = bodyG.faces;
      let uvIndexFront = 0;

      for (let count = 0; count < uvs.length; count++) {
        if (faces[count].materialIndex === MOCKUP.MATERIAL_FACE.BACK) {
          let dist = distances[uvIndexFront] / sum;
          if ((count % 2) === 0) {
            uvs[count][0].x = uvs[count][1].x = uvs[count + 1][0].x = dist;
            uvIndexFront++;
          }
          else {
            uvs[count - 1][2].x = uvs[count][1].x = uvs[count][2].x = dist;
          }
        }
        else if (faces[count].materialIndex === MOCKUP.MATERIAL_FACE.FRONT) {
          let dist = 1 - distances[uvIndexFront] / sum;
          //console.log(dist);
          if ((count % 2) === 0) {
            uvs[count][0].x = uvs[count][1].x = uvs[count + 1][0].x = dist;
            uvIndexFront--;
          }
          else {
            uvs[count - 1][2].x = uvs[count][1].x = uvs[count][2].x = dist;
          }
        }
      }

      bodyG.computeBoundingBox();

      sheet.element.scale.x = curveWidth * foldCount / sum;
      // sheet.element.scale.z = sheet.element.scale.x;//1 + (Math.cos(pointAngleB) * sheet.element.scale.x / sheet.element.scale.x);

      bodyG.computeBoundingSphere();
      bodyG.verticesNeedUpdate = true;
      bodyG.computeFaceNormals();

      bodyG.computeVertexNormals();
      bodyG.uvsNeedUpdate = true;
      bodyG.normalsNeedUpdate = true;
    }
    curvesFront.forEach(function (curveF) {
      curveF = null;
    });
    curvesBack.forEach(function (curveB) {
      curveB = null;
    });
    verticesBack.forEach(function (vertexB) {
      vertexB = null;
    });
    verticesFront.forEach(function (vertexF) {
      vertexF = null;
    });

  }

  flip(oldAngle, newAngle) {
    let sheet = this;
    let isBooklet = sheet.viewer.isBooklet;

    //https://github.com/deepak-ghimire/dearviewer/issues/494
    if (sheet.isCover === true) {
      if (oldAngle === 0) oldAngle = sheet.viewer.flexibility * 2.5;
      if (oldAngle === 180) oldAngle = oldAngle - sheet.viewer.flexibility * 2.5;
    }

    let diff = newAngle - oldAngle;//170 -5 == 165 :  5-170 = -165

    let isRight = oldAngle > 90;
    let isRTL = sheet.viewer.isRTL;
    let pageNumber = isRight ? sheet.backPage.pageNumber : sheet.frontPage.pageNumber;
    let viewport = this.viewer.getViewPort(pageNumber);
    if (viewport)
      viewport = utils.contain(viewport.width, viewport.height, sheet.viewer.availablePageWidth(), sheet.viewer.availablePageHeight())

    let coverAdjustmentWidth = -(sheet.viewer.has3DCover && sheet.viewer.isClosedPage() ? sheet.viewer.coverExtraWidth
        : 0),
      coverAdjustmentHeight = -(sheet.viewer.has3DCover && sheet.viewer.isClosedPage() ? sheet.viewer.coverExtraHeight
        : 0);

    sheet.init = {
      angle: oldAngle,
      height: isRight ? sheet.viewer.rightSheetHeight : sheet.viewer.leftSheetHeight,
      width: isRight ? sheet.viewer.rightSheetWidth : sheet.viewer.leftSheetWidth,
      index: (isRight && !isRTL) || (!isRight && isRTL) ? 1 : 0,
      _index: 0
    };
    sheet.first = {
      angle: oldAngle + diff / 4,
      index: (isRight && !isRTL) || (!isRight && isRTL) ? 1 : 0.25
    };
    sheet.mid = {
      angle: oldAngle + diff * 2 / 4,
      index: (isRight && !isRTL) || (!isRight && isRTL) ? 0.5 : 0.5
    };
    sheet.mid2 = {
      angle: oldAngle + diff * 3 / 4,
      index: (isRight && !isRTL) || (!isRight && isRTL) ? 0.25 : 1
    };
    sheet.end = {
      angle: newAngle,
      index: (isRight && !isRTL) || (!isRight && isRTL) ? 0 : 1,
      height: coverAdjustmentHeight + (viewport ? viewport.height : sheet.height),
      width: coverAdjustmentWidth + (viewport ? viewport.width : sheet.width),
    };

    //console.log(sheet.init, sheet.first, sheet.mid, sheet.end);
    sheet.isFlipping = true;

    let update = function (tween) {

      sheet.sheetAngle = tween.angle;
      sheet.curveAngle = sheet.isHard ? tween.angle : utils.getCurveAngle(isRight,tween.angle);
      if (sheet.isHard === true) {
        sheet.flexibility = 0;
        if (sheet.isCover) {
          sheet.viewer.flipCover(sheet);
        }
      }
      else {
        sheet.flexibility = tween.angle < 90 ? sheet.leftFlexibility : sheet.rightFlexibility;
      }
      sheet.element.position.z = (tween.angle < 90 ? sheet.leftPos : sheet.rightPos) + sheet.depth;
      if (isBooklet) {
        sheet.element.material[5].opacity = sheet.element.material[4].opacity = tween.index;
        sheet.element.castShadow = (isRight && !isRTL) || (!isRight && isRTL) ? tween.index > 0.5 : tween.index > 0.5;
      }

      sheet.height = tween.height;
      sheet.width = tween.width;

      sheet.updateAngle(true);

    };

    if (isBooklet && ((!isRight && !isRTL) || (isRight && isRTL))) {
      sheet.element.material[5].opacity = sheet.element.material[4].opacity = 0;
      sheet.element.castShadow = false;
    }

    sheet.currentTween = new TWEEN.Tween(sheet.init)
      .to({
        angle: [sheet.first.angle, sheet.mid.angle, sheet.mid2.angle, sheet.end.angle],
        index: [sheet.first.index, sheet.mid.index, sheet.mid2.index, sheet.end.index],
        _index: 1,
        height: sheet.end.height,
        width: sheet.end.width
      }, sheet.viewer.app.options.duration * Math.abs(diff)/180)
      .onUpdate(function (event) {
        update(this, event);
      }).easing(TWEEN.Easing.Sinusoidal.Out)
      .onStop(function () {
        sheet.currentTween = null;
        sheet.isFlipping = false;
        if (sheet.isCover) {
          sheet.viewer.leftCover.isFlipping = false;
          sheet.viewer.rightCover.isFlipping = false;
        }
        sheet.element.material[5].opacity = sheet.element.material[4].opacity = 1;
      })
      .onComplete(function () {
        sheet.updateAngle();
        sheet.element.material[5].opacity = sheet.element.material[4].opacity = 1;
        sheet.element.castShadow = true;
        sheet.isFlipping = false;
        if (sheet.isCover) {
          sheet.viewer.leftCover.isFlipping = false;
          sheet.viewer.rightCover.isFlipping = false;
        }
        sheet.side = sheet.targetSide;
        sheet.viewer.onFlip();
        sheet.viewer.afterFlip();
        sheet.currentTween = null;
        if (sheet.viewer && sheet.viewer.requestRefresh)
          sheet.viewer.requestRefresh();
      }).start();
    //calling instantly will fix the render and postioning update issue
    //https://github.com/deepak-ghimire/dearviewer/issues/494
    sheet.currentTween.update(window.performance.now());
  }
}

class FlipBook3D extends BaseFlipBookViewer {
  constructor(options, appContext) {

    options.viewerClass = "df-flipbook-3d";
    super(options, appContext);

    this.pageOffset = 5; //space between pages in spiral book
    this.spiralCount = 20;
    this.groundDistance = options.groundDistance ?? 2; //relative sizing distance of ground from book when cover is closed.

    this.hasSpiral = options.hasSpiral === "true" || options.hasSpiral === true;
    this.flexibility = utils.limitAt(options.flexibility ?? 0.9, 0, 10);
    if (this.hasSpiral){
      this.flexibility = 0;
    }
    if(this.flexibility === 0)
      options.sheetSegments = 8;

    this.drag3D = utils.isTrue(options.drag3D);
    //if it's mobile do not use power of two to save, overhead and device resources
    this.texturePowerOfTwo = utils.isMobile ? false : (options.texturePowerOfTwo ?? true);

    this.color3DSheets = this.app.options.color3DSheets ?? 'white';
    this.midPosition = 0;

    this.initMOCKUP(function () {
      appContext._viewerPrepared();
    });

  }

  initMOCKUP(callback) {
    let app = this.app;

    if (typeof THREE === "undefined") {
      app.updateInfo(app.options.text.loading + " WEBGL 3D ...");

      if (typeof window.define === 'function' && window.define.amd && window.requirejs) {
        window.requirejs.config({
          "paths": {
            "three": app.options.threejsSrc.replace(".js", "")
          },
          shim: {
            'three': {
              exports: 'THREE'
            }
          }
        });
        window.require(['three'], function (THREE) {
          window.THREE = THREE;
          MOCKUP.init();
          if (typeof callback === "function") callback();
          return THREE;
        });
      }
      else if (typeof window.define === 'function' && window.define.amd) {
        window.require(["three", app.options.threejsSrc.replace(".js", "")], function (ready) {
          ready(function () {
            MOCKUP.init();
            if (typeof callback === "function") callback();
          });
        });
      }
      else {
        utils.getScript(app.options.threejsSrc + "?ver=" + DV.version, function () {
          MOCKUP.init();
          if (typeof callback === "function") callback();
        }, function () {
          app.updateInfo("Unable to load THREE.js...");
        });
      }
    }
    else {
      MOCKUP.init();
      if (typeof callback === "function") callback();
    }
  }

  init() {
    let app = this.app;
    super.init();

    let _pageRatio = app.provider.defaultPage.pageRatio;

    this.pageScaleX = 1;
    this.initDepth();

    this.initStage();
    this.initPages();

    this.initEvents();
    this.render();//until render is called none of the css pages are added.

  }

  updatePageMode() {
    super.updatePageMode();
    let app = this.app;
    this.has3DCover = app.options.cover3DType !== DEARVIEWER.FLIPBOOK_COVER_TYPE.NONE && app.pageCount > 7 && !this.isBooklet;
    if (this.has3DCover && app.options.flipbookHardPages === "none") {
      app.options.flipbookHardPages = "cover";
    }
  }

  initDepth() {
    this.sheetDepth = this.pageScaleX * (this.app.options.sheetDepth ?? 0.5);
    this.sheetSegments = this.app.options.sheetSegments ?? 20;
    this.coverDepth = 2 * this.sheetDepth;
    this.sheetsDepth = Math.min(10, this.app.pageCount / 4) * this.sheetDepth;
  }

  initStage() {
    let viewer = this;
    let stage = viewer.stage = new MOCKUP.Stage({
      pixelRatio: viewer.app.options.pixelRatio
    });
    let canvas = stage.canvas = jQuery(stage.renderer.domElement).addClass("df-3dcanvas");
    canvas.appendTo(this.element);


    stage.camera.position.set(0, 0, 600);
    stage.camera.lookAt(new THREE.Vector3(0, 0, 0));
    viewer.camera = stage.camera;
    //shadows are zigzag due to shadow camera position
    stage.spotLight.position.set(-220, 220, 550);

    stage.spotLight.castShadow = utils.isMobile ? false : viewer.app.options.has3DShadow;
    if (stage.spotLight.shadow) {
      stage.spotLight.shadow.bias = -0.005;//-0.0035 has artifacts in smaller size;
    }

    // stage.spotLight.intensity = 0.22;
    stage.ambientLight.color = new THREE.Color("#fff");
    stage.ambientLight.intensity = 0.82;

    let material = new THREE.ShadowMaterial();
    material.opacity = viewer.app.options.shadowOpacity;

    stage.ground.oldMaterial = stage.ground.material;
    stage.ground.material = material;
    stage.ground.position.z = this.has3DCover ? -6 : -4;

    stage.selectiveRendering = true;

    let cssRenderer = stage.cssRenderer = new THREE.CSS3DRenderer();
    jQuery(cssRenderer.domElement).css({
      position: "absolute",
      top: 0,
      pointerEvents: "none"
    }).addClass("df-3dcanvas df-csscanvas");
    viewer.element[0].appendChild(cssRenderer.domElement);

    stage.cssScene = new THREE.Scene();

    viewer.wrapper.remove();
    viewer.wrapper = new THREE.Group();
    viewer.stage.add(viewer.wrapper);
    viewer.wrapper.add(stage.ground);
    viewer.bookWrapper = new THREE.Group();
    viewer.bookWrapper.name = "bookwrapper";
    // stage.bookWrapper.add(stage.camera);
    viewer.wrapper.add(viewer.bookWrapper);

    viewer.bookHelper = stage.bookHelper = new THREE.BoxHelper(viewer.bookWrapper, 0xffff00);
    stage.add(viewer.bookHelper);
    viewer.bookHelper.visible = false;

    viewer.cameraWrapper = new THREE.Group();
    viewer.cameraWrapper.add(stage.camera);
    stage.add(viewer.cameraWrapper);
    // viewer.wrapper.add(stage.spotLight);

    viewer.app.renderRequestStatus = DV.REQUEST_STATUS.ON;
  }

  initPages() {

    let options = {
      parent3D: this.bookWrapper,
      viewer: this,
      segments: this.sheetSegments,
      depth: this.sheetDepth,
      flexibility: this.flexibility
    };

    for (let count = 0; count < this.stackCount; count++) {
      let sheet = new BookSheet3D(options);
      sheet.index = count;//just reference for debugging
      sheet.viewer = this;
      this.sheets.push(sheet);
      sheet.setMatColor(this.color3DSheets);
      this.pages.push(sheet.frontPage);
      this.pages.push(sheet.backPage);
      this.stage.cssScene.add(sheet.frontPage.cssPage);
      this.stage.cssScene.add(sheet.backPage.cssPage);

    }

    options.depth = this.sheetsDepth;
    options.segments = 1;
    options.flexibility = 0;
    this.leftSheets = new BookSheet3D(options); //to display sheet stack on left side of Realistic book
    this.rightSheets = new BookSheet3D(options); //to display sheet stack on right side of Realistic book
    this.leftSheets.setMatColor(this.color3DSheets);
    this.rightSheets.setMatColor(this.color3DSheets);

    options.depth = this.coverDepth;

    this.leftCover = new BookSheet3D(options);
    this.rightCover = new BookSheet3D(options);

    // this.leftCover.element.loadNormalMap(this.app.options.imagesLocation + "/book-cover-normal.jpg", MOCKUP.MATERIAL_FACE.FRONT);
    // this.rightCover.element.loadNormalMap(this.app.options.imagesLocation + "/book-cover-normal.jpg", MOCKUP.MATERIAL_FACE.BACK);
    this.leftCover.isHard = true;
    this.rightCover.isHard = true;
    this.set3DCoverNormal();
    this.setcolor3DCover(this.app.options.color3DCover);

    this.stage.cssScene.add(this.leftCover.frontPage.cssPage);
    this.stage.cssScene.add(this.rightCover.backPage.cssPage);

    this.zoomViewer.leftPage.element.css({backgroundColor: this.color3DSheets});
    this.zoomViewer.rightPage.element.css({backgroundColor: this.color3DSheets});
    if (this.orientation === 'vertical') {
      this.bookWrapper.children.forEach(function (childPaper) {
        childPaper.rotateZ(THREE.MathUtils.degToRad(-90));
        childPaper.textureCenter = new THREE.Vector2(0.5, 0.5);
        childPaper.textureRotation = 90;
      })
    }

    this.initSpiral();
  }

  initSpiral() {
    this.hasSpiral = false;
  }

  set3DCoverNormal(){}

  setcolor3DCover(val = ""){}

  initEvents() {
    this.stageDOM = this.element[0];
    super.initEvents();
  }

  dispose() {
    super.dispose();

    let viewer = this;
    if (viewer.stage) {
      viewer.stage.clearChild();

      viewer.stage.cssRenderer.domElement.parentNode.removeChild(viewer.stage.cssRenderer.domElement);
      viewer.stage.cssRenderer = null;

      viewer.stage.orbitControl = utils.disposeObject(viewer.stage.orbitControl);

      viewer.stage.renderer = utils.disposeObject(viewer.stage.renderer);

      jQuery(viewer.stage.canvas).remove();
      viewer.stage.canvas = null;

      viewer.stage = utils.disposeObject(viewer.stage);
    }
    if (viewer.centerTween && viewer.centerTween.stop)
      viewer.centerTween.stop();
  }

  render() {
    this.stage.render();
    this.stage.cssRenderer.render(this.stage.cssScene, this.stage.camera);
  }

  resize() {
    super.resize();

    let viewer = this;
    let app = viewer.app,
      stage = viewer.stage;
    let dimensions = app.dimensions;
    let padding = dimensions.padding;
    let isSingle = viewer.isSingle;
    let zoomWidth = this.availablePageWidth(),
      zoomHeight = this.availablePageHeight();

    stage.resizeCanvas(dimensions.stage.width, dimensions.stage.height);
    stage.cssRenderer.setSize(dimensions.stage.width, dimensions.stage.height);

    this.pageScaleX = Math.max(Math.max(zoomWidth, zoomHeight) / 400, 1);
    this.initDepth();
    this.sheets.forEach(function (sheet) {
      sheet.depth = viewer.sheetDepth;
    });

    app.refreshRequestStart();

    let ref = this.refSize = Math.min(zoomHeight, zoomWidth);
    this.coverExtraWidth = (viewer.orientation == 'vertical' ? 2 : 1) * ref * .025;
    this.coverExtraHeight = (viewer.orientation == 'vertical' ? 1 : 2) * ref * .025;
    if (this.has3DCover !== true) {
      this.coverExtraWidth = 0;
      this.coverExtraHeight = 0;
    }
    //viewer.app.renderRequestStatus = DV.REQUEST_STATUS.ON;

    viewer.zoomViewer.resize();

    viewer.cameraPositionDirty = true;
    viewer.centerNeedsUpdate = true;
    viewer.checkCenter(true);
    viewer.pagesReady();

    this.pageOffset = (this.hasSpiral ? 6 : 0)
      * Math.min(this._defaultPageSize.width, this._defaultPageSize.height) / 1000;
  }

  fitCameraToCenteredObject(camera, object, offset, orbitControls) {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    var middle = new THREE.Vector3();
    var size = new THREE.Vector3();
    boundingBox.getSize(size);

    var coverExtraHeight = this.coverExtraHeight;
    var coverExtraWidth = this.coverExtraWidth * 2;
    if (this.isClosedPage()) {
      coverExtraWidth = 0;
      coverExtraHeight = 0;
    }
    size.x = size.x - coverExtraWidth + this.app.dimensions.padding.width;
    size.y = size.y - coverExtraHeight + this.app.dimensions.padding.height;

    // figure out how to fit the box in the view:
    // 1. figure out horizontal FOV (on non-1.0 aspects)
    // 2. figure out distance from the object in X and Y planes
    // 3. select the max distance (to fit both sides in)
    //
    // The reason is as follows:
    //
    // Imagine a bounding box (BB) is centered at (0,0,0).
    // Camera has vertical FOV (camera.fov) and horizontal FOV
    // (camera.fov scaled by aspect, see fovh below)
    //
    // Therefore if you want to put the entire object into the field of view,
    // you have to compute the distance as: z/2 (half of Z size of the BB
    // protruding towards us) plus for both X and Y size of BB you have to
    // figure out the distance created by the appropriate FOV.
    //
    // The FOV is always a triangle:
    //
    //  (size/2)
    // +--------+
    // |       /
    // |      /
    // |     /
    // | F° /
    // |   /
    // |  /
    // | /
    // |/
    //
    // F° is half of respective FOV, so to compute the distance (the length
    // of the straight line) one has to: `size/2 / Math.tan(F)`.
    //
    // FTR, from https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
    // the camera.fov is the vertical FOV.


    const fov = camera.fov * (Math.PI / 180);
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
    let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
    let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
    let cameraZ = Math.max(dx, dy);

    // offset the camera, if desired (to avoid filling the whole canvas)
    if (offset !== undefined && offset !== 0) cameraZ *= offset;

    camera.position.set(0, 0, cameraZ);

    // set the far plane of the camera so that it easily encompasses the whole object
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

    camera.far = cameraToFarEdge * 3;
    camera.updateProjectionMatrix();

    if (orbitControls !== undefined) {
      // set camera to rotate around the center
      orbitControls.target = new THREE.Vector3(0, 0, 0);

      // prevent camera from zooming out far enough to create far plane cutoff
      orbitControls.maxDistance = cameraToFarEdge * 2;
    }
  }

  updateShadowSize() {
    return;
    let shadowSize = this.pageScaleX > 2.5 ? 1024 : 512;
    let shadow = this.stage.spotLight.shadow;
    if (this.stage.spotLight.castShadow === true && shadow.mapSize.height != shadowSize) {
      shadow.radius = shadowSize / 256;
      shadow.mapSize.width = shadowSize;
      shadow.mapSize.height = shadowSize;
      shadow.needsUpdate = true;
    }
  }

  refresh() {
    let viewer = this,
      app = this.app,
      basePage = viewer.getBasePage();
    this.refreshRequested = true; //flag to check if refresh has beem requested

    let ratioStep = 1 / (app.pageCount),
      ratio = ratioStep * basePage;
    let leftWeight = this.isRTL ? 1 - ratio : ratio,
      rightWeight = 1 - leftWeight;

    let minSheetStack = Math.min(viewer.stackCount, viewer.totalSheets);
    let maxSheetStack = utils.limitAt(viewer.totalSheets, viewer.stackCount, viewer.stackCount * 2);

    let midWeight = Math.max(leftWeight, rightWeight);
    let flexibilityFactor = this.isBooklet
      ? 0 : this.flexibility / maxSheetStack;
    viewer.leftFlexibility = flexibilityFactor * rightWeight;
    viewer.rightFlexibility = flexibilityFactor * leftWeight;
    viewer.midPosition = 0.5 * minSheetStack * viewer.sheetDepth;

    super.refresh();


    let displayCover = this.has3DCover === true;
    this.leftCover.element.visible
      = this.rightCover.element.visible
      = this.leftSheets.element.visible
      = this.rightSheets.element.visible
      = displayCover;

    this.wrapper.position.z = -this.midPosition;

    let depthLeft = 0, depthRight = 0, isRTL = viewer.isRTL;

    let isFrontPage = this.isFirstPage(),
      isLastPage = this.isLastPage();

    let isLeftClosed = this.isLeftClosed = this.isClosedPage() && ((isRTL && isLastPage) || (!isRTL && isFrontPage)),
      isRightClosed = this.isRightClosed = this.isClosedPage() && ((!isRTL && isLastPage) || (isRTL && isFrontPage));

    if (displayCover) {

      viewer.leftSheets.depth = isRTL
        ? viewer.sheetsDepth * (1 - viewer.getBasePage() / app.pageCount)
        : viewer.sheetsDepth * basePage / app.pageCount;
      viewer.leftSheets.element.visible = isRTL ? app.pageCount - viewer.getBasePage() > 2 : basePage > 2;
      depthLeft -= viewer.leftSheets.depth / 2;
      viewer.leftSheets.element.position.z = depthLeft;
      depthLeft -= viewer.coverDepth + (viewer.leftSheets.element.visible ? viewer.leftSheets.depth / 2
        : 0) + viewer.coverDepth * 3;

      viewer.leftCover.depth = viewer.rightCover.depth = viewer.coverDepth;

      let maxSheetHeight = Math.max(this.leftSheetHeight, this.rightSheetHeight);
      if (isRightClosed) maxSheetHeight = this.leftSheetHeight;
      if (isLeftClosed) maxSheetHeight = this.rightSheetHeight;
      if (viewer.leftCover.isFlipping !== true) {
        viewer.leftCover.element.position.z = isLeftClosed ? viewer.midPosition + viewer.coverDepth
          : depthLeft + viewer.coverDepth / 2;
        viewer.leftCover.element.position.z = Math.max(viewer.leftCover.element.position.z, -viewer.refSize * 0.05);
        viewer.leftCover.element.position.x = 0;
        viewer.leftSheets.sheetAngle = viewer.leftCover.sheetAngle = isLeftClosed ? 180 : 0;
        viewer.leftSheets.curveAngle = viewer.leftCover.curveAngle = isLeftClosed ? 180 : 0;

        if (viewer.rightCover.isFlipping !== true) {
          viewer.leftCover.height = maxSheetHeight;
          viewer.leftCover.width = viewer.leftCover.sheetAngle < 90 ? this.leftSheetWidth : this.rightSheetWidth;
          if (!this.isClosedPage()) {
            viewer.leftCover.width += this.coverExtraWidth;
            viewer.leftCover.height += this.coverExtraHeight;
          }
        }
        viewer.leftSheets.updateAngle();
        viewer.leftCover.updateAngle();
      }

      viewer.rightSheets.depth = viewer.sheetsDepth - viewer.leftSheets.depth;
      viewer.rightSheets.element.visible = isRTL ? basePage > 2 : app.pageCount - viewer.getBasePage() > 2;
      depthRight -= viewer.rightSheets.depth / 2;
      viewer.rightSheets.element.position.z = depthRight;
      depthRight -= viewer.coverDepth + (viewer.rightSheets.element.visible ? viewer.rightSheets.depth / 2
        : 0) + viewer.coverDepth * 3;

      if (viewer.rightCover.isFlipping !== true) {
        viewer.rightCover.element.position.z = isRightClosed ? viewer.midPosition + viewer.coverDepth
          : depthRight + viewer.coverDepth / 2;
        viewer.rightCover.element.position.z = Math.max(viewer.rightCover.element.position.z, -viewer.refSize * 0.05);
        viewer.rightCover.element.position.x = 0;

        viewer.rightSheets.sheetAngle = viewer.rightCover.sheetAngle = isRightClosed ? 0 : 180;
        viewer.rightSheets.curveAngle = viewer.rightCover.curveAngle = isRightClosed ? 0 : 180;

        if (viewer.leftCover.isFlipping !== true) {
          viewer.rightCover.height = maxSheetHeight;
          viewer.rightCover.width = viewer.rightCover.sheetAngle < 90 ? this.leftSheetWidth : this.rightSheetWidth;
          if (!this.isClosedPage()) {
            viewer.rightCover.width += this.coverExtraWidth;
            viewer.rightCover.height += this.coverExtraHeight;
          }
        }
        viewer.rightSheets.updateAngle();
        viewer.rightCover.updateAngle();

      }
      viewer.updateSheets();
      viewer.stage.ground.position.z = Math.min(depthLeft, depthRight) - viewer.refSize * viewer.groundDistance / 100;
      // if (this.isClosedPage()) {
      //   viewer.stage.ground.position.z -= viewer.coverDepth * 2;
      // }

      viewer.stage.ground.position.z = Math.max(viewer.stage.ground.position.z, -viewer.refSize * 0.1);
    }
    else {
      viewer.stage.ground.position.z = -viewer.midPosition - viewer.sheetDepth * 15;
    }

    if (viewer.cameraPositionDirty === true) {
      viewer.updateCameraPosition();
    }

    this.refreshSpiral();
  }

  refreshSpiral() {}

  updateCameraPosition() {
    let viewer = this;
    let app = viewer.app,
      stage = viewer.stage;
    let dimensions = app.dimensions;
    let padding = dimensions.padding;

    let cameraZ = 1 / (2 * Math.tan(Math.PI * stage.camera.fov * 0.5 / 180) / (dimensions.stage.height / app.zoomValue)) + 2.2;

    this.updateShadowSize();
    this.stage.spotLight.position.x = -this.pageScaleX * 330;
    this.stage.spotLight.position.y = this.pageScaleX * 330;
    this.stage.spotLight.position.z = this.pageScaleX * 550;
    this.stage.spotLight.shadow.camera.far = this.pageScaleX * 1200;
    this.stage.spotLight.shadow.camera.updateProjectionMatrix();

    let shiftY = (padding.top - padding.bottom) / app.zoomValue / 2,
      shiftX = -(padding.left - padding.right) / app.zoomValue / 2;

    if (stage.camera.position.z !== cameraZ && app.pendingZoom === true) {
      stage.camera.position.z = cameraZ;
    }

    if (app.zoomValue === 1) {
      viewer.bookWrapper.rotation.set(0, 0, 0);
      viewer.bookHelper.rotation.set(0, 0, 0);
      viewer.cameraWrapper.rotation.set(0, 0, 0);
      if (app.options.flipbook3DTiltAngleUp !== 0 || app.options.flipbook3DTiltAngleLeft !== 0) {
        stage.camera.aspect = dimensions.stage.width / dimensions.stage.height;
        stage.camera.updateProjectionMatrix();
        //upward rotation is on X axis and is done after left Rotation , Z axis.
        //Since book need to rotate upwward, rotate X later works
        viewer.bookWrapper.rotateZ(THREE.Math.degToRad(-app.options.flipbook3DTiltAngleLeft)); //negative goes left
        viewer.bookWrapper.rotateX(THREE.Math.degToRad(-app.options.flipbook3DTiltAngleUp)); //negative goes upward
        if (viewer.orientation == 'vertical') {
          viewer.bookWrapper.scale.y = 1 / (this.isSingle ? 2 : 1);
        }
        else {
          viewer.bookWrapper.scale.x = 1 / (this.isSingle ? 2 : 1);
        }
        viewer.bookHelper.update();
        viewer.fitCameraToCenteredObject(stage.camera, viewer.bookWrapper);
        viewer.bookWrapper.rotation.set(0, 0, 0);
        viewer.bookWrapper.scale.x = 1;
        viewer.bookWrapper.scale.y = 1;
        //upward rotation is on X axis and is done after left Rotation , Z axis.
        //Since book need to rotate upwward, rotate X later works
        // viewer.bookHelper.rotateZ(THREE.Math.degToRad(app.options.flipbook3DTiltAngleLeft)); //negative goes left
        // viewer.bookHelper.rotateX(THREE.Math.degToRad(-app.options.flipbook3DTiltAngleUp)); //negative goes upward

        stage.camera.position.set(shiftX, shiftY, stage.camera.position.z + stage.ground.position.z);
        this.camera.aspect = dimensions.stage.width / dimensions.stage.height;
        this.camera.updateProjectionMatrix();

        //upward rotation is on X axis and is done after left Rotation , Z axis.
        //Since book need to rotate upwward, rotate X later works
        viewer.cameraWrapper.rotateX(THREE.Math.degToRad(app.options.flipbook3DTiltAngleUp)); //negative goes upward
        viewer.cameraWrapper.rotateZ(THREE.Math.degToRad(app.options.flipbook3DTiltAngleLeft)); //positive goes left
      }
      else {
        stage.camera.position.set(shiftX, shiftY, cameraZ);
      }

    }
    stage.camera.updateProjectionMatrix();
    viewer.app.renderRequestStatus = DV.REQUEST_STATUS.ON;
    viewer.cameraPositionDirty = false;
  }

  refreshSheet(options) {

    let viewer = this,
      _sheet = options.sheet,
      _sheetStackIndex = options.index;

    // region Determine Next Position, angle and Flexibility based on pageLocation
    let oldAngle = _sheet.sheetAngle, newAngle,
      isFlexible = !(_sheet.isHard || this.flexibility === 0);

    _sheet.leftFlexibility = !isFlexible ? 0 : viewer.leftFlexibility;
    _sheet.rightFlexibility = !isFlexible ? 0 : viewer.rightFlexibility;

    _sheet.leftPos = viewer.midPosition + (_sheetStackIndex - options.midPoint + 1) * viewer.sheetDepth - viewer.sheetDepth / 2;
    _sheet.rightPos = viewer.midPosition - (_sheetStackIndex - options.midPoint) * viewer.sheetDepth - viewer.sheetDepth / 2;

    newAngle = _sheet.targetSide === DEARVIEWER.TURN_DIRECTION.LEFT ? 0 : 180;

    //endregion
    if (_sheet.isFlipping === false) {
      if (options.needsFlip) {
        _sheet.isFlipping = true;

        if (_sheet.isCover && options.sheetNumber === 0)
          if (viewer.isRTL)
            viewer.rightCover.isFlipping = true;
          else
            viewer.leftCover.isFlipping = true;
        if (_sheet.isCover && (viewer.totalSheets - options.sheetNumber === 1))
          if (viewer.isRTL)
            viewer.leftCover.isFlipping = true;
          else
            viewer.rightCover.isFlipping = true;

        _sheet.element.position.z = Math.max(oldAngle < 90 ? _sheet.leftPos
          : _sheet.rightPos, viewer.midPosition) + viewer.sheetDepth;
        //this.beforeFlip();
        _sheet.flexibility = oldAngle < 90 ? _sheet.leftFlexibility : _sheet.rightFlexibility;

        _sheet.flip(oldAngle, newAngle);

      }
      else {
        _sheet.skipFlip = false;
        _sheet.sheetAngle = _sheet.curveAngle = newAngle;
        _sheet.flexibility = newAngle < 90 ? _sheet.leftFlexibility : _sheet.rightFlexibility;
        _sheet.element.position.z = newAngle < 90 ? _sheet.leftPos : _sheet.rightPos;
        _sheet.side = _sheet.targetSide;

        //sheets from left side coming to right should follow the right side dimension and vice versa
        _sheet.height = newAngle < 90 ? this.leftSheetHeight : this.rightSheetHeight;
        _sheet.width = newAngle < 90 ? this.leftSheetWidth : this.rightSheetWidth;

      }
      _sheet.updateAngle();
      this.app.renderRequestStatus = DV.REQUEST_STATUS.ON;
    }
    else {
      // _sheet.element.position.z = oldAngle < 90 ? _sheet.leftPos : _sheet.rightPos;
    }

    //determine visibility
    _sheet.element.visible = options.visible;
  }

  updateCenter() {
    let viewer = this,
      app = this.app;

    let init = this.orientation == 'vertical' ? viewer.wrapper.position.y : viewer.wrapper.position.x,
      centerShift = (this.orientation === 'vertical' ? -1 : 1) * viewer.centerShift,
      length = this.isLeftPage()
        ? this.orientation == 'vertical' ? this.leftSheetHeight : this.leftSheetWidth
        : this.orientation == 'vertical' ? this.rightSheetHeight : this.rightSheetWidth;

    let end = centerShift * length / 2;
    viewer.seamPosition = (-app.dimensions.offset.width + app.dimensions.containerWidth) / 2 + end;
    //create a centerTween
    if (end !== viewer.centerEnd) { //avoid recreating the tween if the target is same as before
      if (viewer.centerTween && viewer.centerTween.stop)
        viewer.centerTween.stop();
      viewer.onCenterStartAnimation(this);  //solves issue 301 - called early so that waiting doesn't cause flicker
      viewer.centerTween = new TWEEN.Tween({x: init}).delay(0)
        .to({x: end}, app.zoomValue === 1 && viewer.skipCenterAnimation !== true ? viewer.app.options.duration : 1)
        .onStart(function () {
          /*viewer.onCenterStartAnimation(this); //is delayed for some reason - maybe waiting for request frame and causes flicker - issue 301*/
        })
        .onUpdate(function () { viewer.onCenterUpdateAnimation(this); })
        .onComplete(function () { viewer.onCenterCompleteAnimation(this); })
        .onStop(function () { viewer.onCenterStopAnimation(this); })
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
      this.updatePendingStatusClass();
      viewer.skipCenterAnimation = false;
      viewer.centerEnd = end;
    }
    viewer.renderRequestStatus = DV.REQUEST_STATUS.ON;

    this.zoomViewer.updateCenter();
  }

  onCenterUpdateAnimation(tween) {
    if (this.orientation == 'vertical') {
      this.wrapper.position.y = tween.x;
      //noinspection JSUnresolvedVariable
      if (this.stage && this.stage.cssScene)
        this.stage.cssScene.position.y = tween.x;
    }
    else {
      this.wrapper.position.x = tween.x;
      //noinspection JSUnresolvedVariable
      if (this.stage && this.stage.cssScene)
        this.stage.cssScene.position.x = tween.x;
    }
  }

  onCenterStartAnimation(tween) { }

  onCenterStopAnimation(tween) { }

  onCenterCompleteAnimation(tween) { }

  flipCover(sheet) {
    let viewer = this, cover = null, multiplier, diff;

    if (sheet.pageNumber === 0 || (this.isBooklet && sheet.pageNumber === 1)) {
      cover = this.isRTL ? this.rightCover : this.leftCover;
      multiplier = this.isRTL ? 1 : -1;
    }
    else if (sheet.pageNumber === this.totalSheets - 1) {
      cover = this.isRTL ? this.leftCover : this.rightCover;
      multiplier = this.isRTL ? -1 : 1;
    }
    if (cover === null)
      return;

    diff = cover.depth + sheet.depth + 1;
    cover.sheetAngle = sheet.sheetAngle;
    cover.curveAngle = sheet.curveAngle;
    this.rightCover.height = this.leftCover.height = sheet.height + this.coverExtraHeight;
    this.rightCover.width = this.leftCover.width = sheet.width + this.coverExtraWidth;
    cover.flexibility = sheet.flexibility;


    this.rightCover.updateAngle();
    this.leftCover.updateAngle();

    cover.element.position.x = sheet.element.position.x + multiplier * Math.sin(sheet.sheetAngle * Math.PI / 180) * diff;
    cover.element.position.z = sheet.element.position.z + multiplier * Math.cos(sheet.sheetAngle * Math.PI / 180) * diff;

  }

  pagesReady() {
    if (this.isAnimating()) return;
    if (this.refreshRequested !== true) return;

    if (this.app.options.flipbookFitPages === false) {
      let basePage = this.app.viewer.getBasePage();
      let leftViewPort = this.leftViewport = this.getViewPort(basePage + (this.isBooklet ? 0 : (this.isRTL ? 1 : 0))),
        rightViewPort = this.rightViewPort = this.getViewPort(basePage + (this.isBooklet ? 0 : (this.isRTL ? 0 : 1)));

      if (leftViewPort) {
        let leftDimen = utils.contain(leftViewPort.width, leftViewPort.height, this.availablePageWidth(), this.availablePageHeight());
        if (this.leftSheetWidth != Math.floor(leftDimen.width) || this.leftSheetHeight != Math.floor(leftDimen.height)) {
          this.cameraPositionDirty = true;
        }
        this.leftSheetWidth = Math.floor(leftDimen.width);
        this.leftSheetHeight = Math.floor(leftDimen.height);
      }

      if (rightViewPort) {
        let rightDimen = utils.contain(rightViewPort.width, rightViewPort.height, this.availablePageWidth(), this.availablePageHeight());
        if (this.rightSheetWidth != Math.floor(rightDimen.width) || this.rightSheetWidth != Math.floor(rightDimen.height)) {
          this.cameraPositionDirty = true;
        }
        this.rightSheetWidth = Math.floor(rightDimen.width);
        this.rightSheetHeight = Math.floor(rightDimen.height);
      }

      for (let i = 0; i < this.sheets.length; i++) {
        let sheet = this.sheets[i];
        if (sheet.side === DV.TURN_DIRECTION.LEFT) {
          sheet.height = this.leftSheetHeight;
          sheet.width = this.leftSheetWidth;
          sheet.updateAngle();
        }
        else {
          sheet.height = this.rightSheetHeight;
          sheet.width = this.rightSheetWidth;
          sheet.updateAngle();
        }
      }

      if (this.isClosedPage()) {
        var isClosedOnRight = (this.isRTL && this.isLastPage()) || (!this.isRTL && this.isFirstPage());
        this.leftCover.width = this.rightCover.width = (isClosedOnRight ? this.rightSheetWidth : this.leftSheetWidth);
        this.leftCover.height = this.rightCover.height = (isClosedOnRight ? this.rightSheetHeight
          : this.leftSheetHeight);
      }
      else {
        this.leftCover.height = this.rightCover.height = this.coverExtraHeight + Math.max(this.leftSheetHeight, this.rightSheetHeight);
        this.leftCover.width = this.coverExtraWidth + this.leftSheetWidth;
        this.rightCover.width = this.coverExtraWidth + this.rightSheetWidth;
      }

      this.leftSheets.width = this.leftSheetWidth;
      this.leftSheets.height = this.leftSheetHeight;
      this.rightSheets.height = this.rightSheetHeight;
      this.rightSheets.width = this.rightSheetWidth;

      this.leftCover.updateAngle();
      this.leftSheets.updateAngle();
      this.rightCover.updateAngle();
      this.rightSheets.updateAngle();

      this.updateSheets(true);
    }
    this.updateCenter();
    this.updateCSSLayer();

    this.updatePendingStatusClass();
    this.refreshSpiral();
    if (this.cameraPositionDirty === true) {
      this.updateCameraPosition();
    }
  }

  updateSheets(update) {
    if (this.isClosedPage() !== true) {

      var rightPage = this.getPageByNumber(this.getRightPageNumber());
      if (this.rightCover.isFlipping !== true && rightPage && rightPage.sheet.element.geometry.attributes) {
        let pos = this.rightSheets.element.geometry.attributes.position,
          posX = update ? rightPage.sheet.element.geometry.boundingBox.max.x * rightPage.sheet.element.scale.x : this.rightSheets.lastSlopeX;
        pos.setX(21, posX);
        pos.setX(23, posX);
        pos.setX(4, posX);
        pos.setX(6, posX);
        pos.setX(10, posX);
        pos.setX(14, posX);
        pos.needsUpdate = true;
        this.rightSheets.element.geometry.attributes.uv.needsUpdate = true;

        this.rightSheets.element.geometry.computeVertexNormals();
        if (update) this.rightSheets.lastSlopeX = posX;
      }
      var leftPage = this.getPageByNumber(this.getLeftPageNumber());
      if (this.leftCover.isFlipping !== true && leftPage && leftPage.sheet.element.geometry.attributes) {
        let pos = this.leftSheets.element.geometry.attributes.position,
          posX = update ? leftPage.sheet.element.geometry.boundingBox.min.x * leftPage.sheet.element.scale.x : this.leftSheets.lastSlopeX;
        pos.setX(16, posX);
        pos.setX(18, posX);
        pos.setX(5, posX);
        pos.setX(7, posX);
        pos.setX(8, posX);
        pos.setX(12, posX);
        pos.needsUpdate = true;
        this.leftSheets.element.geometry.attributes.uv.needsUpdate = true;

        this.leftSheets.element.geometry.computeVertexNormals();
        if (update) this.leftSheets.lastSlopeX = posX;
      }
    }
  }

  updateCSSLayer() {
  }

  mouseMove(event) {
    event = utils.fixMouseEvent(event);
    this.app.renderRequestStatus = DV.REQUEST_STATUS.ON;
    if (event.touches != null && event.touches.length === 2) {
      this.pinchMove(event);
      return;
    }
    let viewer = this;
    let point = viewer.eventToPoint(event);

    if (viewer.dragSheet !== null && viewer.drag3D !== false) {
      if(Math.abs(point.x-viewer.startPoint.x)>2) {//mouse has to move a little
        if(viewer.isDragging !==true){
          viewer.updatePendingStatusClass(true);
          viewer.isDragging = true;
        }
        let width = viewer.dragSheet.width;
        let x = point.x - ((this.app.dimensions.origin.x + viewer.centerEnd) - width);
        let distance = utils.limitAt(
          1 - (x / (width)), -1, 1);
        let angle = utils.toDeg(Math.acos(distance));
        // angle = utils.limitAt(angle, 0, 180);
        let sheet = viewer.dragSheet;
        let isLeftPage = viewer.drag === DV.TURN_DIRECTION.LEFT;
        sheet.sheetAngle = angle;
        let curveAngle = utils.getCurveAngle(isLeftPage, angle, 45);
        if (sheet.isCover) {
          sheet.viewer.flipCover(sheet);
        }
        sheet.curveAngle = sheet.isHard ? angle : curveAngle;
        sheet.updateAngle();
      }
    }

    viewer.checkSwipe(point, event);
  }

  /**
   * @param {MouseEvent & jQueryMouseEvent} event
   */
  mouseUp(event) {
    let viewer = this;

    event = utils.fixMouseEvent(event);
    if (!event.touches && event.button !== 0) return;
    if (viewer.dragSheet == null && event.touches != null && event.touches.length === 0) {
      this.pinchUp(event);
      return;
    }

    let point = viewer.eventToPoint(event);

    if (viewer.app.zoomValue === 1) {

      if (viewer.dragSheet !== null) {
        var distance = point.x - viewer.startPoint.x;
        if (Math.abs(distance) > viewer.swipeThreshold*2) {
          if (viewer.drag === DV.TURN_DIRECTION.LEFT && distance > 0 ){
            viewer.app.openLeft();
          }
          else if(viewer.drag === DV.TURN_DIRECTION.RIGHT && distance < 0 ) {
            viewer.app.openRight();
          }
        }
        viewer.requestRefresh();
        viewer.updatePendingStatusClass();
      }
      let element = event.target || event.originalTarget; //check to see if the clicked element is a link, if so skip turn
      let isClick = viewer.startPoint && point.x === viewer.startPoint.x && point.y === viewer.startPoint.y && element.nodeName !== "A";
      if (event.ctrlKey === true && isClick) {
        this.zoomOnPoint(point);
      }
      else if (isClick && point.sheet && viewer.clickAction === DV.MOUSE_CLICK_ACTIONS.NAV) {
          if (point.sheet.sheetAngle > 90) {
            viewer.app.openRight();
          }
          else {
            viewer.app.openLeft();
          }
      }

    }
    viewer.dragSheet = null;
    viewer.drag = null;

    if(viewer.isDragging === true){
      viewer.isDragging = false;
    }
    /*3 if there is swipe - clean*/
    viewer.startPoint = null;
    viewer.canSwipe = false;

    viewer.app.renderRequestStatus = DV.REQUEST_STATUS.ON;
  }

  raycastCLick(event) {
    let viewer = this;
    viewer.mouse = new THREE.Vector2();
    viewer.raycaster = new THREE.Raycaster();
    viewer.mouse.x = ((event.offsetX) / viewer.app.dimensions.stage.width) * 2 - 1;
    viewer.mouse.y = 1 - ((event.offsetY) / viewer.app.dimensions.stage.height) * 2;

    viewer.raycaster.setFromCamera(viewer.mouse, viewer.camera);

    var intersects = viewer.raycaster.intersectObjects(viewer.bookWrapper.children, true);

    if (intersects.length > 0) {

      var object, objectCount = 0;
      do {
        object = intersects[objectCount] != null ? intersects[objectCount].object : null;
        if (object.sheet && object.sheet.index) {
          if (object.sheet.isFlipping !== true) {
            return object;
          }
        }
        objectCount++;
      } while (objectCount < intersects.length);

    }
  }

  mouseDown(event) {
    event = utils.fixMouseEvent(event);
    if (!event.touches && event.button !== 0) return;
    if (event.touches != null && event.touches.length === 2) {
      this.pinchDown(event);
    }
    else {
      event = utils.fixMouseEvent(event);
      let viewer = this;
      let point = viewer.eventToPoint(event);
      viewer.startPoint = point;
      viewer.lastPosX = point.x;
      viewer.lastPosY = point.y;

      var object = viewer.raycastCLick(event);

      var edgeDistance = point.sheet ? point.sheet.width-Math.abs(point.x - (this.app.dimensions.origin.x + viewer.centerEnd)) : 0;
      if (point.sheet && object && point.isInsideSheet && edgeDistance < point.sheet.width/2) {
        viewer.dragSheet = object.sheet;
        viewer.drag = point.sheet.sheetAngle < 90 ? DV.TURN_DIRECTION.LEFT : DV.TURN_DIRECTION.RIGHT;
      }
      else {
        viewer.canSwipe = true;
      }
    }
  }

  eventToPoint(event) {
    let viewer = this,
      dimensions = this.app.dimensions;

    event = utils.fixMouseEvent(event);
    let point = {x: event.clientX, y: event.clientY};

    //calculate x and y relative to container
    point.x = point.x - viewer.parentElement[0].getBoundingClientRect().left;
    point.y = point.y - viewer.parentElement[0].getBoundingClientRect().top;

    let left = (-dimensions.offset.width + dimensions.containerWidth) / 2 - dimensions.stage.width / 2,
      right = (-dimensions.offset.width + dimensions.containerWidth) / 2 + dimensions.stage.width / 2,
      top = dimensions.padding.top,
      bottom = dimensions.padding.top + viewer.availablePageHeight();

    let isLeftSheet = point.x < viewer.seamPosition;
    let pageNumber = viewer.getBasePage() + (isLeftSheet ? 0 : 1);
    let sheet = this.getPageByNumber(pageNumber);
    if (sheet)
      sheet = sheet.sheet;

    let isInsideSheet = point.x > left && point.x < right && point.y > top && point.y < bottom;

    return {
      isInsideSheet: isInsideSheet,
      isInsideDragZone: isInsideSheet && point.x - left < viewer.foldSense || (right - point.x) < viewer.foldSense,
      x: point.x,
      y: point.y,

      left: left,
      top: top,
      right: right,
      bottom: bottom,
      raw: point,
      isLeftSheet: isLeftSheet,
      sheet: sheet
    };
  }

  checkPageLoading() {
    let isLoaded = true;
    let pages = this.getVisiblePages().main;
    for (let index = 0; index < (this.isBooklet ? 1 : 2); index++) {
      let page = this.getPageByNumber(pages[index]);
      if (page) {
        isLoaded = page.textureLoaded && isLoaded;
      }
    }
    this.element.toggleClass("df-loading", !isLoaded);
  }

  textureLoadedCallback(param) {
    this.app.renderRequestStart();
    this.pagesReady();
  }

  getTextureSize(param) {
    let size = super.getTextureSize(param);

    if (this.app.zoomValue !== 1 || param.isAnnotation === true)
      return size;

    var height = utils.nearestPowerOfTwo(size.height);
    var width = size.width * height / size.height;
    return this.texturePowerOfTwo ? {height: height, width: width} : size;
  }

  getPageByNumber(pageNumber) {
    if (this.has3DCover) {
      let isLastPage = !this.isBooklet && pageNumber === this.app.pageCount && (pageNumber % 2 === 0),
        isFirstPage = pageNumber === 1;
      if ((!this.isRTL && isFirstPage) || (this.isRTL && isLastPage))
        return this.leftCover.frontPage;
      if ((!this.isRTL && isLastPage) || (this.isRTL && isFirstPage))
        return this.rightCover.backPage;
    }
    return super.getPageByNumber(pageNumber);
  }

  setPage(param) {
    return super.setPage(param);
  }

  beforeFlip() {
    super.beforeFlip();
  }
}

/**
 * Page3D represents only the material side of the booksheet
 */
class Page3D extends Page2D {
  constructor(options) {
    super(options);
    let page = this;
    page.element = null;
    page.face = options.face;
    page.parent3D = options.sheet;
    page.sheet = options.sheet;

    page.cssPage = new THREE.CSS3DObject(page.contentLayer[0]);
  }

  setLoading() {
    this.sheet.viewer.checkPageLoading();
  }

  clearMap() {
    this.sheet.element.material[this.face].map = null;
    this.sheet.element.material[this.face].needsUpdate = true;
  }

  loadTexture(param) {
    let page = this,
      texture = param.texture,
      callback = param.callback;
    page.textureSrc = texture;

    function completed(object, texture3D) {
      page.updateTextureLoadStatus(true);
      page.sheet.resetMatColor(page.face, param.texture === page.textureLoadFallback);
      if (typeof callback == 'function') callback(param);
    }

    if (typeof DV.defaults.beforeLoadTexture == 'function') DV.defaults.beforeLoadTexture({texture:texture,page:page});

    if (this.face === 4) {
      this.sheet.backImage(texture, completed);
    }
    else {
      this.sheet.frontImage(texture, completed);
    }
  }
}

export {FlipBook3D,MOCKUP};
