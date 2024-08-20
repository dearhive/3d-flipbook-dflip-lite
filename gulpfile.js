let gulp = require('gulp');
let src = gulp.src,
  dest = gulp.dest;

let fs = require('fs');
let del = require('del');
let bump = require('gulp-bump');
let swcMin = require('gulp-swc-minify').default;
let replace = require('gulp-replace');
let rename = require('gulp-rename');
let sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('@aptuitiv/gulp-clean-css');
let sourcemaps = require('gulp-sourcemaps');
let cache = require('gulp-cached');
const zip = require('gulp-zip');
const branchName = require('current-git-branch');

const wpPot = require('gulp-wp-pot');

const webpack_stream = require('webpack-stream');
const webpack_config = require('./webpack.config.js');

let getPackageJson = function () {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

let packageJson = getPackageJson();
console.log(packageJson.version);

let cleaning = false;

gulp.task('bump', gulp.series(
  function bumpVersion() {
    return gulp.src('./package.json')
      .pipe(bump())
      .pipe(gulp.dest('./'));
  },
  function versionFetch(done) {
    packageJson = getPackageJson();
    console.log("After:" + packageJson.version);
    return done();
  }
));

/**
 * Export Tasks
 */

//region Webpack & JS
gulp.task('webpack-prod', function () {
  return webpack_stream(webpack_config)
    .pipe(replace("DV_VERSION", packageJson.version))
    .pipe(gulp.dest('assets'));
});

let jsFiles = [
  'assets/js/dflip.js'
];

gulp.task('js-minify-prod', function () {
  return gulp.src(jsFiles)
    .pipe(swcMin({
      //   // mangle: false
    }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('assets/js'));
});

gulp.task('js-prod', gulp.series('webpack-prod', 'js-minify-prod'));
//endregion

//region SCSS & CSS
gulp.task('sass-common', gulp.series(
  function compileSASS() {
    return gulp.src('src/css/dflip.scss')
      .pipe(sourcemaps.init())
      .pipe(sass({linefeed: 'crlf'}).on('error', sass.logError))
      .pipe(rename('dflip.css'))
      .pipe(gulp.dest('./assets/css'));
  }));

//cleanCSS removed container query so production is skipped. Using dev instead.
gulp.task('sass-minify-prod', gulp.series(
  function sassMinifyProd() {
    return gulp.src('assets/css/dflip.css')
      .pipe(cleanCSS({
        keepSpecialComments: '*',
        spaceAfterClosingBrace: true
      }))
      .pipe(rename('dflip.min.css'))
      .pipe(gulp.dest('assets/css'));
  }));

gulp.task('sass-prod', gulp.series('sass-common', 'sass-minify-prod'));
//endregion

//region Build
/**
 * Common Build
 * Takes everything from base and transfers to build
 */
gulp.task('build-common', function () {
  return src([
    'base/**/*',
    '!base/**/*.js',
    'base/**/*.min.js'
  ])
    .pipe(cache("build-common"))
    .pipe(dest('build/common'));
});

gulp.task('build-prod', gulp.series('build-common', 'sass-prod', 'js-prod'));
//endregion

gulp.task('default', gulp.series('build-prod'));


