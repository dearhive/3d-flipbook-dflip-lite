/* globals jQuery */
let DEARVIEWER = {
  jQuery: jQuery,
  version: 'DV_VERSION',
  autoDetectLocation: true,
  slug: undefined, //this has to be defined by respective Viewer/Plugin, used in analytics
  locationVar: "dearViewerLocation", //this has to be defined by respective Viewer/Plugin
  locationFile: undefined, //this has to be defined by respective Viewer/Plugin , used to detect locationVar
  MOUSE_CLICK_ACTIONS: {NONE: "none", NAV: "nav"},
  ARROW_KEYS_ACTIONS: {NONE: "none", NAV: "nav"},
  MOUSE_DBL_CLICK_ACTIONS: {NONE: "none", ZOOM: "zoom"},
  MOUSE_SCROLL_ACTIONS: {NONE: "none", ZOOM: "zoom", NAV: "nav"},

  PAGE_SCALE: {
    PAGE_FIT: "fit",
    PAGE_WIDTH: 'width',
    AUTO: "auto", //page_width to a maximum of 125% zoom
    ACTUAL: 'actual', //100%
    MANUAL: 'manual'
  },

  READ_DIRECTION: {LTR: 'ltr', RTL: 'rtl'},
  TURN_DIRECTION: {
    LEFT: 'left',
    RIGHT: 'right',
    NONE: 'none'
  },
  INFO_TYPE: {INFO: "info", ERROR: "error"},

  FLIPBOOK_PAGE_MODE: {SINGLE: "single", DOUBLE: "double", AUTO: "auto"},
  FLIPBOOK_SINGLE_PAGE_MODE: {ZOOM: "zoom", BOOKLET: "booklet", AUTO: "auto"},
  FLIPBOOK_PAGE_SIZE: {
    AUTO: "auto",
    SINGLE: "single",
    DOUBLE_INTERNAL: "dbl_int", // |1|, |2-3|, |4-5|, |6-7|, |8| -- booklet modes , can be auto detected
    DOUBLE: "dbl",  // |1-2|, |3-4|, |5-6|, |7-8| -- used from unorganized images , cannot be autodetected
    DOUBLE_COVER_BACK: "dbl_cover_back" // |8-1|, |2-3|, |4-5|, |6-7| -- used in printing , cannot be autodetected
  },


  LINK_TARGET: {NONE: 0, SELF: 1, BLANK: 2, PARENT: 3, TOP: 4},  //as per PDF.js standard
  CONTROLS_POSITION: {HIDDEN: 'hidden', TOP: 'top', BOTTOM: 'bottom'},


  //internals
  TURN_CORNER: {TL: "tl", TR: "tr", BL: "bl", BR: "br", L: "l", R: "r", NONE: "none"},
  REQUEST_STATUS: {OFF: "none", ON: "pending", COUNT: "counting"},
  TEXTURE_TARGET: {THUMB: 0, VIEWER: 1, ZOOM: 2},
  FLIPBOOK_CENTER_SHIFT: {RIGHT: 1, LEFT: -1, NONE: 0},
  FLIPBOOK_COVER_TYPE: {NONE: "none", PLAIN: "plain", BASIC: "basic", RIDGE: "ridge"},
};


//_defaults that can be referenced but should not be changed
DEARVIEWER._defaults = {

  // When viewer is set to flipbook
  // use 3D flipbook(true) or normal CSS flipbook(false)
  is3D: true,

  // When viewer is set to flipbook, and 3D is on.
  // if you want to turn off shadow in 3d set it to false
  has3DShadow: true,
  color3DCover: "#aaaaaa",
  color3DSheets: "#fff", //we use white if needed in future
  cover3DType: DEARVIEWER.FLIPBOOK_COVER_TYPE.NONE,
  flexibility: 0.9,
  drag3D:false,

  // height of the container
  // value(eg: 320) or percentage (eg: '50%')
  // calculation limit: minimum 320, max window height
  height: 'auto',

  // set to true to show outline on open (true|false)
  autoOpenOutline: false,

  // set to true to show thumbnail on open (true|false)
  autoOpenThumbnail: false,

  // enableDownload of PDF files (true|false)
  showDownloadControl: true,
  showSearchControl: true,
  showPrintControl: true,
  // if enable sound at start (true|false)
  enableSound: true,

  // duration of page turn in milliseconds
  duration: 800,

  pageRotation: 0,
  flipbook3DTiltAngleUp: 0,
  flipbook3DTiltAngleLeft: 0,

  readDirection: DEARVIEWER.READ_DIRECTION.LTR,

  pageMode: DEARVIEWER.FLIPBOOK_PAGE_MODE.AUTO,

  singlePageMode: DEARVIEWER.FLIPBOOK_SINGLE_PAGE_MODE.AUTO,
  //resizes the underlying pages to suit the top cover page after flip
  flipbookFitPages: false, //can be hard set to false

  //color value in hexadecimal
  backgroundColor: "transparent",

  flipbookHardPages: "none", //possible values are "all", "none", "cover"

  openPage: 1, //the page number where the book should open

  annotationClass: "",

  // texture settings
  maxTextureSize: 3200,	//max page size to be rendered. for pdf files only
  minTextureSize: 256,	//min page size to be rendered. for pdf files only
  rangeChunkSize: 524288,
  //pdf related options
  disableAutoFetch: true,
  disableStream: true,
  disableFontFace: false,

  // icons for the buttons
  icons: {
    'altnext': 'df-icon-arrow-right1',
    'altprev': 'df-icon-arrow-left1',
    'next': 'df-icon-arrow-right1',
    'prev': 'df-icon-arrow-left1',
    'end': 'df-icon-last-page',
    'start': 'df-icon-first-page',
    'share': 'df-icon-share',
    'outline-open': 'df-icon-arrow-right',
    'outline-close': 'df-icon-arrow-down',
    'help': 'df-icon-help',
    'more': 'df-icon-more',
    'download': 'df-icon-download',
    'zoomin': 'df-icon-add-circle',
    'zoomout': 'df-icon-minus-circle',
    'resetzoom': 'df-icon-minus-circle',
    'fullscreen': 'df-icon-fullscreen',
    'fullscreen-off': 'df-icon-fit-screen',
    'fitscreen': 'df-icon-fit-screen',
    'thumbnail': 'df-icon-grid-view',
    'outline': 'df-icon-list',
    'close': 'df-icon-close',
    'doublepage': 'df-icon-double-page',
    'singlepage': 'df-icon-file',
    'print': 'df-icon-print',
    'play': 'df-icon-play',
    'pause': 'df-icon-pause',
    'search': 'df-icon-search',
    'sound': 'df-icon-volume',
    'sound-off': 'df-icon-volume',
    'facebook': 'df-icon-facebook',
    'google': 'df-icon-google',
    'twitter': 'df-icon-twitter',
    'whatsapp': 'df-icon-whatsapp',
    'linkedin': 'df-icon-linkedin',
    'pinterest': 'df-icon-pinterest',
    'mail': 'df-icon-mail',
  },

  // TRANSLATION text to be displayed
  text: {

    toggleSound: "Turn on/off Sound",
    toggleThumbnails: "Toggle Thumbnails",
    toggleOutline: "Toggle Outline/Bookmark",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    toggleFullscreen: "Toggle Fullscreen",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset Zoom",
    pageFit: 'Fit Page',
    widthFit: 'Fit Width',
    toggleHelp: "Toggle Help",
    search: "Search in PDF",

    singlePageMode: "Single Page Mode",
    doublePageMode: "Double Page Mode",
    downloadPDFFile: "Download PDF File",
    gotoFirstPage: "Goto First Page",
    gotoLastPage: "Goto Last Page",
    print: "Print",
    play: "Start AutoPlay",
    pause: "Pause AutoPlay",
    share: "Share",
    close: "Close",

    mailSubject: "Check out this FlipBook",
    mailBody: "Check out this site {{url}}",
    loading: "Loading",
    thumbTitle: "Thumbnails",
    outlineTitle: "Table of Contents",
    searchTitle: "Search",
    searchPlaceHolder: "Search",

    analyticsEventCategory: "DearFlip",
    analyticsViewerReady: "Document Ready",
    analyticsViewerOpen: "Document Opened",
    analyticsViewerClose: "Document Closed",
    analyticsFirstPageChange: "First Page Changed",
  },

  share: {
    'facebook': 'https://www.facebook.com/sharer/sharer.php?u={{url}}&t={{mailsubject}}',
    'twitter': 'https://twitter.com/share?url={{url}}&text={{mailsubject}}',
    'mail': undefined,  // calculated based on translate text.mailSubject and text.mailBody or can be directly overridden
    'whatsapp': 'https://api.whatsapp.com/send/?text={{mailsubject}}+{{url}}&type=custom_url&app_absent=0',
    'linkedin': 'https://www.linkedin.com/shareArticle?url={{url}}&title={{mailsubject}}',
    'pinterest': 'https://www.pinterest.com/pin/create/button/?url={{url}}&media=&description={{mailsubject}}'

  },

  //valid control-names:
  //altPrev,pageNumber,altNext,outline,thumbnail,zoomIn,zoomOut,fullScreen,share
  //more,download,pageMode,startPage,endPage,sound
  allControls: "altPrev,pageNumber,altNext,play,outline,thumbnail,zoomIn,zoomOut,zoom,fullScreen,share,download,search,pageMode,startPage,endPage,sound,search,print,more",
  moreControls: "download,pageMode,pageFit,startPage,endPage,sound",
  leftControls: "outline,thumbnail",
  rightControls: "fullScreen,share,download,more",
  hideControls: "",
  hideShareControls: "",

  controlsPosition: DEARVIEWER.CONTROLS_POSITION.BOTTOM,
  paddingTop: 20,
  paddingLeft: 15,
  paddingRight: 15,
  paddingBottom: 20,
  enableAnalytics: false,

  zoomRatio: 2,
  maxDPI:2,
  fakeZoom:1,
  pageScale: DEARVIEWER.PAGE_SCALE.PAGE_FIT,

  controlsFloating: true,
  sideMenuOverlay: true,

  enableAnnotation: true,
  enableAutoLinks: true,

  //ACTIONS
  arrowKeysAction: DEARVIEWER.ARROW_KEYS_ACTIONS.NAV,
  clickAction: DEARVIEWER.MOUSE_CLICK_ACTIONS.NAV,
  dblClickAction: DEARVIEWER.MOUSE_DBL_CLICK_ACTIONS.NONE,
  mouseScrollAction: DEARVIEWER.MOUSE_SCROLL_ACTIONS.NONE,
  linkTarget: DEARVIEWER.LINK_TARGET.BLANK,

  //Resources settings
  soundFile: "sound/turn2.mp3",
  imagesLocation: "images",
  imageResourcesPath: "images/pdfjs/",
  popupThumbPlaceholder: 'data:image/svg+xml,' + escape('<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><rect width="210" height="297" style="fill:#f1f2f2"/><circle cx="143" cy="95" r="12" style="fill:#e3e8ed"/><polygon points="131 138 120 149 95 124 34 184 176 185 131 138" style="fill:#e3e8ed"/></svg>'),
  cMapUrl: "js/libs/cmaps/",
  logo: "",
  logoUrl: "",

  sharePrefix: '',
  pageSize: DEARVIEWER.FLIPBOOK_PAGE_SIZE.AUTO,

  // link to the images file that you want as background.
  // supported files are jpgs,png. smaller files are preffered for performance
  backgroundImage: "",//"images/textures/el.jpg",
  pixelRatio: window.devicePixelRatio || 1,

  /*3D settings*/
  spotLightIntensity: 0.22,
  ambientLightColor: "#fff",
  ambientLightIntensity: 0.8,
  shadowOpacity: 0.1,

  slug: undefined,
  headerElementSelector: undefined,

  //callbacks
  onReady: function (app) {
    // after document and viewer is loaded
  },
  onPageChanged: function (app) {
    // when page change is detected
  },
  beforePageChanged: function (app) {
    // when page change validated but before pages are changed
  },
  onCreate: function (app) {
    // after app is created and initialized, viewer and document loading is not included
  },
  onCreateUI: function (app) {
    // after UI is created
  },
  onFlip: function (app) {
    // after flip event is fired
  },
  beforeFlip: function (app) {
    // before flip event is fired
  },

  autoPDFLinktoViewer: false,
  autoLightBoxFullscreen: false,
  thumbLayout: 'book-title-hover',
  cleanupAfterRender: true, //creates issue in pdf.js version above 2.5.207
  canvasWillReadFrequently: true,

  providerType: 'pdf',
  loadMoreCount: -1, //0 and -1 will display all items
  autoPlay: false,
  autoPlayDuration: 1000,
  autoPlayStart: false,

  popupBackGroundColor: "#eee",
  mockupMode: false,
  instantTextureProcess: false, //will use too much CPU,GPU and RAM
  cachePDFTexture: false, //will use too much RAM
  pdfVersion: "default"
};

//options that can be changed by users
//Needed for: When user changed text or icons and just changed one, it impacted all others.
DEARVIEWER.defaults = {};
DEARVIEWER.jQuery.extend(true, DEARVIEWER.defaults, DEARVIEWER._defaults);

DEARVIEWER.viewers = {};
DEARVIEWER.providers = {};
DEARVIEWER.openFileOptions = {};

DEARVIEWER.executeCallback = function () {};

export {DEARVIEWER};
