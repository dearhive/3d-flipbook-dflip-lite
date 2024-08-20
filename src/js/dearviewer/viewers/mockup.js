import {utils} from "../utils/utils.js";
let MOCKUP = {};

MOCKUP.init = function () {

  //region MOCKUP
  if (MOCKUP.initialized === true) return;

  let THREE = window.THREE;
  MOCKUP = {
    init: function () {
    },
    initialized: true,
    GEOMETRY_TYPE: {PLANE: 0, BOX: 1, MODEL: 2},
    MATERIAL_FACE: {FRONT: 5, BACK: 4},
    WHITE_COLOR: new THREE.Color("white"),
    defaults: {
      anisotropy: 8,
      maxTextureSize: 2048,
      groundTexture: "blank",
      color: 0xffffff,
      shininess: 15,
      width: 210,
      height: 297,
      depth: 0.2,
      segments: 150,
      textureLoadFallback: "blank"
    },
    textureLoader: new THREE.TextureLoader(),
    clearChild: function (child) {
      let material = child.material;
      child.parent.remove(child);
      let texture;
      child = utils.disposeObject(child);
      if (material == null) return;

      if (material.length == null) {
        if (material.map) {
          texture = material.map;
          material.dispose();
          texture.dispose();
        }
        if (material.bumpMap) {
          texture = material.bumpMap;
          material.dispose();
          texture.dispose();
        }
        if (material.normalMap) {
          texture = material.normalMap;
          material.dispose();
          texture.dispose();
        }

      }
      else {
        for (let matCount = 0; matCount < material.length; matCount++) {
          if (material[matCount]) {
            if (material[matCount].map) {
              texture = material[matCount].map;
              material[matCount].dispose();
              texture.dispose();
            }
            if (material[matCount].bumpMap) {
              texture = material[matCount].bumpMap;
              material[matCount].dispose();
              texture.dispose();
            }
            if (material[matCount].normalMap) {
              texture = material[matCount].normalMap;
              material[matCount].dispose();
              texture.dispose();
            }
          }

          material[matCount] = null;

        }
      }
      material = null;
      texture = null;
    },
    /**
     * @param {Paper} object
     * @param image
     * @param faceNumber
     * @param mapType
     * @param callback
     * @returns {number|*}
     */
    loadImage: function (object, image, faceNumber, mapType, callback) {

      if (image == null) {//get value
        let value = (object.material[faceNumber] == null) ? null
          : (object.material[faceNumber][mapType])
            ? object.material[faceNumber][mapType].sourceFile
            : null;

        return (value == null) ? null : (value.indexOf("data:image") > -1) ? null : value;
      }

      else {

        let _texture = null;

        if (image.nodeName === "CANVAS" || image.nodeName === "IMG") {
          _texture = new THREE.Texture(image);
          _texture.needsUpdate = true;
          MOCKUP.loadTexture(_texture, object, mapType, faceNumber);
          if (typeof callback === "function") callback(object, _texture);
        }
        else {
          if (image !== "blank") {
            _texture = (image == null) ? null : MOCKUP.textureLoader.load(image,// THREE.UVMapping,
              function textureOnLoad(texture) {
                texture.sourceFile = image;
                MOCKUP.loadTexture(texture, object, mapType, faceNumber);
                if (typeof callback === "function") callback(object, texture);
              }, void 0, //the other end expects explicitly void 0
              function textureOnError() {
                if (_texture.image == null) {
                  MOCKUP.loadImage(object, MOCKUP.defaults.textureLoadFallback, faceNumber, mapType);
                }
                MOCKUP.loadTextureFailed();
              });
            if (_texture) _texture.mapping = THREE.UVMapping;
          }
          else {
            MOCKUP.loadTexture(null, object, mapType, faceNumber);
            if (typeof callback === "function") callback(object, _texture);
          }
        }

        return 0;
      }
    },
    //load image to texture
    loadTexture: function (texture, object, mapType, faceNumber) {
      if (texture) {
        let img = texture.image;
        texture.naturalWidth = img.naturalWidth;
        texture.naturalHeight = img.naturalHeight;
        texture.needsUpdate = true;
        if (object.textureRotation != void 0) {
          texture.rotation = THREE.MathUtils.degToRad(object.textureRotation);
          texture.center = object.textureCenter;
        }
      }
      if (texture !== null && mapType === "map") {
        texture.anisotropy = 0;
        if (MOCKUP.defaults.anisotropy > 0)
          texture.anisotropy = MOCKUP.defaults.anisotropy;
        if (THREE.skipPowerOfTwo === true) {
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
        }
        texture.name = new Date().toTimeString();

      }


      MOCKUP.clearTexture(object.material[faceNumber][mapType]);
      object.material[faceNumber][mapType] = texture;
      if (mapType === "bumpMap")
        object.material[faceNumber].bumpScale = object.sheet.getBumpScale(faceNumber);
      // if (mapType === "normalMap")
      //   object.material[faceNumber].normalScale = object.sheet.getBumpScale(faceNumber);

      object.material[faceNumber].needsUpdate = true;

    },
    //load image to texture
    loadTextureFailed: function () {
      //console.log("Failed to load texture:" + image);
      return null;
    },
    clearTexture: function (texture) {
      if (texture) {
        if (texture.image) {
          if (texture.image.nodeName === "CANVAS") {
            if (texture.image.remove)
              texture.image.remove();
            delete texture.image;
          }
        }
        texture = utils.disposeObject(texture);
      }
    }
  };

  THREE.skipPowerOfTwo = true;

  /**
   * @typedef {Object} Paper
   * @property material
   */
  class Paper extends THREE.Mesh {
    constructor(options) {

      let width = options.width || MOCKUP.defaults.width,
        height = options.height || MOCKUP.defaults.height,
        color = options.color || MOCKUP.defaults.color,
        segments = options.segments || MOCKUP.defaults.segments,
        depth = options.depth || MOCKUP.defaults.depth;

      let _matParameters = {
        color: color,
        flatShading: false,//options.flatShading === void 0 ? true : options.flatShading,
        shininess: options.shininess || MOCKUP.defaults.shininess,
      };
      let _material = new THREE.MeshPhongMaterial(_matParameters);
      // _matParameters.flatShading = false; smooth-shading causes shadow in the middle of books - solved with extra vertex in updateAngle()
      let _materials = [_material, _material, _material, _material,
        new THREE.MeshPhongMaterial(_matParameters), new THREE.MeshPhongMaterial(_matParameters)];
      super(
        new THREE.BoxGeometry(width, height, depth, segments, 1, 1), _materials);

      this.material[5].transparent = true;
      this.material[4].transparent = true;

      this.baseType = "Paper";
      this.type = "Paper";

      this.castShadow = true;
      this.receiveShadow = true;

      options.parent3D.add(this);
    }

    loadImage(texture, face, callback) {
      MOCKUP.loadImage(this, texture, face, "map", callback);
    }

    frontImage(texture, callback) {
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.FRONT, "map", callback);
    }

    backImage(texture, callback) {
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.BACK, "map", callback);
    }

    loadBump(texture) {
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.FRONT, "bumpMap", null);
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.BACK, "bumpMap", null);
    }

    loadNormalMap(texture, face) {
      if (face !== void 0) {
        MOCKUP.loadImage(this, texture, face, "normalMap", null);
        return;
      }
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.FRONT, "normalMap", null);
      MOCKUP.loadImage(this, texture, MOCKUP.MATERIAL_FACE.BACK, "normalMap", null);
    }

  }

  class Ground extends Paper {
    constructor(options) {
      super(options);
      this.receiveShadow = true;
      this.frontImage(MOCKUP.defaults.groundTexture);
      this.backImage(MOCKUP.defaults.groundTexture);
      this.type = "Ground";
    }
  }

  class Stage extends THREE.Scene {
    /**
     * @typedef {Object} StageParameters
     * @property {HTMLCanvasElement} canvas - The canvas element.
     * @property {Number} pixelRatio        - Device PixelRatio
     * @property {Boolean} castShadow       - If the elements will cast shadow
     */
    /**
     * @param {{}} parameters
     */
    constructor(parameters) {
      super();

      let stage = this;
      //currently canvas is compulsory
      stage.canvas = parameters.canvas || document.createElement('canvas');

      stage.canvas = jQuery(this.canvas);

      stage.camera = new THREE.PerspectiveCamera(20, stage.width / stage.height, 4, 50000);
      stage.renderer = new THREE.WebGLRenderer({canvas: stage.canvas[0], antialias: true, alpha: true});

      stage.renderer.setPixelRatio(parameters.pixelRatio);
      stage.renderer.setSize(stage.width, stage.height);
      stage.renderer.setClearColor(0xffffff, 0);

      // let orbitControl = stage.orbitControl = new THREE.SimpleOrbitControls(stage.renderer, stage, stage.camera);


      stage.renderer.shadowMap.enabled = true;
      stage.renderer.shadowMap.type = 1;
      stage.ground = new Ground({
        color: 0xffffff,
        height: stage.camera.far / 10,
        width: stage.camera.far / 10,
        segments: 2,
        parent3D: stage
      });

      stage.ambientLight = new THREE.AmbientLight(0x444444);
      stage.add(stage.ambientLight);

      let spotLight = stage.spotLight = new THREE.DirectionalLight(0xffffff, 0.25);
      spotLight.position.set(0, 1, 0);

      if (parameters.castShadow !== false) {
        spotLight.castShadow = true;

        spotLight.shadow.camera.near = 200;
        spotLight.shadow.camera.far = 2000;
        spotLight.shadow.camera.top = 1350;
        spotLight.shadow.camera.bottom = -1350;
        spotLight.shadow.camera.left = -1350;
        spotLight.shadow.camera.right = 1350;

        spotLight.shadow.radius = 2;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.needsUpdate = true;
      }

      stage.add(spotLight);

      stage.animateCount = 0;
      stage.renderCount = 0;

      stage.camera.position.set(-300, 300, 300);
      stage.camera.lookAt(new THREE.Vector3(0, 0, 0));
      // stage.orbitControl.center.set(0, 0, 0);
      // stage.orbitControl.update();

    }

    resizeCanvas(width, height) {
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    render() {
      this.animateCount++;

      this.renderer.render(this, this.camera);

      if (this.stats != null) this.stats.update();

    }

    clearMaterials() {
      let totalChild = this.children.length;
      for (let count = totalChild - 1; count >= 0; count--) {
        let child = this.children[count];
        if (child.baseType && child.baseType === "Paper") {
          if (child.material) {
            if (child.material.length) {
              for (let countMat = 0; countMat < child.material.length; countMat++)
                child.material[countMat].needsUpdate = true;
            }
            else {
              child.material.needsUpdate = true;
            }

          }
        }
      }
    }

    clearChild() {

      this.spotLight.shadow.map = utils.disposeObject(this.spotLight.shadow.map);
      this.spotLight.castShadow = false;
      this.clearMaterials();

      let totalChild = this.children.length;
      for (let count = totalChild - 1; count >= 0; count--) {
        let child = this.children[count];

        if (child.children && child.children.length > 0) {
          for (let stackCount = child.children.length - 1; stackCount >= 0; stackCount--) {
            MOCKUP.clearChild(child.children[stackCount]);
          }
        }
        MOCKUP.clearChild(child);
        child = null;
      }

      this.render();
    }
  }

  MOCKUP.Paper = Paper;
  MOCKUP.Stage = Stage;
  //endregion

  //region CSS3DObject
  class CSS3DObject extends THREE.Object3D {
    constructor(e) {
      super();
      this.element = e;
      this.element.style.position = "absolute";
      this.addEventListener("removed", function () {
        if (this.element.parentNode !== null) {
          this.element.parentNode.removeChild(this.element);
        }
      });
    }

  }

  THREE.CSS3DObject = CSS3DObject;

  class CSS3DSprite extends THREE.CSS3DObject {
    constructor(e) {super(e);}
  }

  THREE.CSS3DSprite = CSS3DSprite;
  if (THREE.MathUtils)
    THREE.Math = THREE.MathUtils;
  THREE.CSS3DRenderer = function () {
    utils.log("THREE.CSS3DRenderer", THREE.REVISION);
    let e, t;
    let r, i;
    let n = new THREE.Matrix4;
    let a = {camera: {fov: 0, style: ""}, objects: {}};
    let o = document.createElement("div");
    o.style.overflow = "hidden";
    o.style.WebkitTransformStyle = "preserve-3d";
    o.style.MozTransformStyle = "preserve-3d";
    o.style.oTransformStyle = "preserve-3d";
    o.style.transformStyle = "preserve-3d";
    this.domElement = o;
    let s = document.createElement("div");
    s.style.WebkitTransformStyle = "preserve-3d";
    s.style.MozTransformStyle = "preserve-3d";
    s.style.oTransformStyle = "preserve-3d";
    s.style.transformStyle = "preserve-3d";
    o.appendChild(s);
    this.setClearColor = function () {
    };
    this.getSize = function () {
      return {width: e, height: t};
    };
    this.setSize = function (n, a) {
      e = n;
      t = a;
      r = e / 2;
      i = t / 2;
      o.style.width = n + "px";
      o.style.height = a + "px";
      s.style.width = n + "px";
      s.style.height = a + "px";
    };
    let h = function (e) {
      return Math.abs(e) < Number.EPSILON ? 0 : e;
    };
    let u = function (e) {
      let t = e.elements;
      return "matrix3d(" + h(t[0]) + "," + h(-t[1]) + "," + h(t[2]) + "," + h(t[3]) + "," + h(t[4]) + "," + h(-t[5]) + "," + h(t[6]) + "," + h(t[7]) + "," + h(t[8]) + "," + h(-t[9]) + "," + h(t[10]) + "," + h(t[11]) + "," + h(t[12]) + "," + h(-t[13]) + "," + h(t[14]) + "," + h(t[15]) + ")";
    };
    let c = function (e) {
      let t = e.elements;
      return "translate3d(-50%,-50%,0) matrix3d(" + h(t[0]) + "," + h(t[1]) + "," + h(t[2]) + "," + h(t[3]) + "," + h(-t[4]) + "," + h(-t[5]) + "," + h(-t[6]) + "," + h(-t[7]) + "," + h(t[8]) + "," + h(t[9]) + "," + h(t[10]) + "," + h(t[11]) + "," + h(t[12]) + "," + h(t[13]) + "," + h(t[14]) + "," + h(t[15]) + ")";
    };
    let l = function (e, t) {
      if (e instanceof THREE.CSS3DObject) {
        let r;
        if (e instanceof THREE.CSS3DSprite) {
          n.copy(t.matrixWorldInverse);
          n.transpose();
          n.copyPosition(e.matrixWorld);
          n.scale(e.scale);
          n.elements[3] = 0;
          n.elements[7] = 0;
          n.elements[11] = 0;
          n.elements[15] = 1;
          r = c(n);
        }
        else {
          r = c(e.matrixWorld);
        }
        let i = e.element;
        let o = a.objects[e.id];
        if (o === undefined || o !== r) {
          i.style.WebkitTransform = r;
          i.style.MozTransform = r;
          i.style.oTransform = r;
          i.style.transform = r;
          a.objects[e.id] = r;
        }
        if (i.parentNode !== s) {
          s.appendChild(i);
        }
      }
      for (let h = 0, u = e.children.length; h < u; h++) {
        l(e.children[h], t);
      }
    };
    this.render = function (e, n) {
      let h = .5 / Math.tan(THREE.Math.degToRad(n.fov * .5)) * t;
      if (a.camera.fov !== h) {
        o.style.WebkitPerspective = h + "px";
        o.style.MozPerspective = h + "px";
        o.style.oPerspective = h + "px";
        o.style.perspective = h + "px";
        a.camera.fov = h;
      }
      e.updateMatrixWorld();
      if (n.parent === null) n.updateMatrixWorld();
      if (n.matrixWorldInverse.invert)
        n.matrixWorldInverse.copy(n.matrixWorld).invert();
      else
        n.matrixWorldInverse.getInverse(n.matrixWorld);
      let c = "translate3d(0,0," + h + "px)" + u(n.matrixWorldInverse) + " translate3d(" + r + "px," + i + "px, 0)";
      if (a.camera.style !== c) {
        s.style.WebkitTransform = c;
        s.style.MozTransform = c;
        s.style.oTransform = c;
        s.style.transform = c;
        a.camera.style = c;
      }
      l(e, n);
    };
  };
  //endregion

};

export {MOCKUP};
