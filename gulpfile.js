// Include gulp
const gulp = require('gulp');

// Include Our Plugins
// const jshint = require('gulp-jshint');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const child = require('child_process');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const runSequence = require('run-sequence');
const fileSizes = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const plumber = require('gulp-plumber');
const mainBowerFiles = require('main-bower-files');
const filter = require('gulp-filter');
const flatten = require('gulp-flatten');
const minifycss = require('gulp-clean-css');
const path = require('path');
const swPrecache = require('sw-precache');
const htmlmin = require('gulp-htmlmin');
const environments = require('gulp-environments');
const replace = require('gulp-replace');
const server = require('gulp-develop-server');
const argv = require('yargs').argv;

const BOWER_PATH = './bower_components';
const DEST_PATH =  'dist';


// Environment specific variables
const development = environments.development;
const production = environments.production;
const facebookEnv = process.env.FACEBOOK_ENV || 'localhost';

console.log('NODE_ENV =', development() ? 'development' : 'production');
console.log('FACEBOOK_ENV =', facebookEnv);
 
const DATABASE_URL = process.env.DATABASE_URL || 'https://bdb-test-api.herokuapp.com';
const isProdDatabase = process.env.DATABASE_URL === 'https://bdb-api.herokuapp.com';

const FACEBOOK_IDS = {
  production: '1814653185457307',
  beta: '1554610834551808',
  development: '116937842287717', 
  localhost: '478533412529512'
};
const GOOGLE_PROD = '823944645076-nr3b0ha8cet2ru3h3501vvk5dms81gkf.apps.googleusercontent.com';
const GOOGLE_DEV = '823944645076-knkq7sq3v5eflsue67os43p6dbre4e9d.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyD6TeLzQCvWopEQ7hBdbktYsmYI9aNjFc8';

const FACEBOOK_CLIENT_ID = FACEBOOK_IDS[facebookEnv];
const GOOGLE_CLIENT_ID = isProdDatabase ? GOOGLE_PROD : GOOGLE_DEV;
const GOOGLE_MAPS_ID = GOOGLE_API_KEY;
// const GOOGLE_MAPS_ID = development() ? 'AIzaSyD1dNf2iN1XS0wx17MTf2lPTbPg8UIJqfA' : 'AIzaSyD6TeLzQCvWopEQ7hBdbktYsmYI9aNjFc8';



// SASS
gulp.task('sass', () => {
    return gulp.src('app/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(sass())
        .on('error', function(e) {
          console.log(e);
          this.emit('end');
        })
        .pipe(autoprefixer({
            browsers: ['> 1%']
        }))
        .pipe(concat('main.min.css'))
        .pipe(minifycss())
        .pipe(sourcemaps.write('.'))
        .pipe(fileSizes({title: 'main.min.css', gzip: true}))
        .pipe(gulp.dest('dist/css'));
});

// Javascript
gulp.task('scripts', () => {
  gulp.src('app/service-worker-registration.js')
    .pipe(gulp.dest('dist/'));

  return gulp.src('app/js/*.js') 
    .pipe(development(sourcemaps.init()))
    .pipe(replace('<DATABASE_URL>', DATABASE_URL))
    .pipe(replace('<FACEBOOK_CLIENT_ID>', FACEBOOK_CLIENT_ID))
    .pipe(replace('<GOOGLE_CLIENT_ID>', GOOGLE_CLIENT_ID))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(plumber()) 
    .pipe(concat('app.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    // .on('error', function(e) {
    //   console.log(e);
    //   this.emit('end');
    // })
    // .pipe(sourcemaps.write('maps'))
    // .pipe(gulp.dest('dist/js'))
    .pipe(rename('app.min.js'))
    .pipe(production(uglify()))
    .pipe(sourcemaps.write('maps'))
    .pipe(fileSizes({title: 'app.min.js', gzip: true}))
    .pipe(gulp.dest('dist/js'));
});

// HTML
gulp.task('html', () => {
  return gulp.src('app/*.html')
    .pipe(development(replace('manifest.webmanifest', 'manifest-dev.webmanifest')))
    .pipe(development(replace('/favicons/', '/favicons-dev/')))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(production(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
      // processScripts: ['text/x-handlebars-template']
    })))
    .pipe(gulp.dest('dist/'));
});

// Service Worker (sw-precache)
gulp.task('generate-service-worker', function(callback) {
  swPrecache.write(`dist/service-worker.js`, {
    staticFileGlobs: [
      'dist/**/*.{js,css}',
      'dist/*.html', 
    // 'assets/**/*.{svg,png,jpg}',
      // 'dist/**/*.{ttf,woff,woff2}',
      '/fonts/glyphicons-halflings-regular.ttf',
      '/fonts/glyphicons-halflings-regular.woff',
      '/fonts/glyphicons-halflings-regular.woff2',
      'public/**/*.{json}',
      'assets/img/icon_search.svg',
      'assets/img/icon_add_pin.svg',
      'assets/img/icon_geolocation.svg',
      'assets/img/icon_filter.svg',
      'assets/img/icon_hamburger.svg',
      'assets/img/icon_user_big.svg',
      'assets/img/spinner.svg',
    ], 
    stripPrefixMulti: {
      'dist/': '/', 
      'assets/': '/', 
      'public/': '/'
    },
    // If handleFetch is false (i.e. because this is called from generate-service-worker-dev), then
    // the service worker will precache resources but won't actually serve them.
    // This allows you to test precaching behavior without worry about the cache preventing your
    // local changes from being picked up during the development cycle.
    handleFetch: true
  }, callback);
});


// grab libraries files from bower_components, minify and push in DEST_PATH
gulp.task('bower', function() {
  var jsFilter = filter('**/*.js', {restore: true}),
      cssFilter = filter('**/*.css', {restore: true}),
      fontFilter = filter(['**/*.eot', '**/*.woff', '**/*.svg', '**/*.ttf'], {restore: true});

  // console.log(mainBowerFiles());

  return gulp.src(mainBowerFiles(), { base: BOWER_PATH })

  .pipe(fileSizes({title: 'bower files', gzip: true, showFiles: true}))

  // grab vendor js files from bower_components, minify and push in DEST_PATH
  .pipe(jsFilter)
  // .pipe(gulp.dest(DEST_PATH + '/js/'))
  // .pipe(concat('vendors.min.js'))
  .pipe(rename({dirname: ''}))
  .pipe(production(uglify()))
  // .pipe(rename({
  //   suffix: ".min"
  // }))
  .pipe(fileSizes({title: 'vendors.min.js', gzip: true}))
  .pipe(gulp.dest(DEST_PATH + '/js/lib/'))
  .pipe(jsFilter.restore)

  // grab vendor css files from bower_components, minify and push in DEST_PATH
  .pipe(cssFilter)
  .pipe(concat('vendors.min.css'))
  // .pipe(gulp.dest(DEST_PATH + '/css'))
  .pipe(production(minifycss()))
  // .pipe(rename({
  //     suffix: ".min"
  // }))
  .pipe(fileSizes({title: 'vendors.min.css', gzip: true}))
  .pipe(gulp.dest(DEST_PATH + '/css'))
  .pipe(cssFilter.restore);

  // grab vendor font files from bower_components and push in DEST_PATH
  // .pipe(fontFilter)
  // .pipe(flatten())
  // .pipe(gulp.dest(DEST_PATH + '/fonts'));
});

gulp.task('bower-fonts', function() {
  return gulp.src('./bower_components/**/*.{ttf,woff,woff2}')
    .pipe(flatten())
    .pipe(fileSizes({title: 'bower fonts', gzip: true}))
    .pipe(gulp.dest(DEST_PATH + '/fonts'));
});

// Watch Files For Changes
gulp.task('watch', () => {
  // gulp.watch('js/*.js', ['lint', 'scripts']);
  // gulp.watch('assets/*', ['images']);
  gulp.watch('app/js/*.js', () => {
    runSequence(['scripts'], ['generate-service-worker'])
  });
  gulp.watch('app/scss/*.scss', () => {
    runSequence(['sass'], ['generate-service-worker'])
  });
  gulp.watch('app/*.html', () => {
    runSequence(['html'], ['generate-service-worker'])
  });
});

gulp.task('images', () => {
  return gulp.src('assets/img/**/*')
    .pipe(imagemin()) 
    .pipe(gulp.dest('dist/img')); 
});

/*gulp.task('server', () => {
  child.spawn('node', ['server.js']);
});*/

gulp.task('server', ()=>{
  let port = (argv.port === undefined) ? 5000 : argv.port
  server.listen({
      path: 'server.js',
      env : {
        PORT:port
      }
    });
});


gulp.task('clean', del.bind(null, ['dist']));
 
gulp.task('build', () => {
  runSequence(['clean'], ['bower', 'bower-fonts', 'html', 'sass', 'scripts'], ['generate-service-worker'], () => {
    return gulp.src('dist/**/*').pipe(fileSizes({title: 'total output', gzip: true}));
  });
});

gulp.task('default', () => {
  runSequence('build', 'watch', 'server');
});
