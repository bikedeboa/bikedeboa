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
const handlebars = require('gulp-handlebars');
const wrap = require('gulp-wrap');
const declare = require('gulp-declare'); 
const merge = require('merge-stream');


const BOWER_PATH = './bower_components';
const DEST_PATH =  'dist';


// Environment specific variables
const development = environments.development;
const production = environments.production;
const BDB_ENV = process.env.BDB_ENV || 'localhost';

console.log('NODE_ENV =', development() ? 'development' : 'production');
console.log('BDB_ENV =', BDB_ENV);
 
const DATABASE_URL = process.env.DATABASE_URL || 'https://bdb-test-api.herokuapp.com';
const isProdDatabase = process.env.DATABASE_URL === 'https://bdb-api.herokuapp.com';

const FACEBOOK_IDS = {
  prod: '1814653185457307',
  beta: '1554610834551808',
  beta2: '116937842287717', 
  localhost: '478533412529512'
};
const GOOGLE_PROD = '823944645076-nr3b0ha8cet2ru3h3501vvk5dms81gkf.apps.googleusercontent.com';
const GOOGLE_DEV = '823944645076-knkq7sq3v5eflsue67os43p6dbre4e9d.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyD6TeLzQCvWopEQ7hBdbktYsmYI9aNjFc8';

const FACEBOOK_CLIENT_ID = FACEBOOK_IDS[BDB_ENV];
const GOOGLE_CLIENT_ID = isProdDatabase ? GOOGLE_PROD : GOOGLE_DEV;
let GOOGLE_MAPS_ID = GOOGLE_API_KEY;
 
// Production: opt-out of the Experimental new renderer and base map style
// https://developers.google.com/maps/documentation/javascript/releases
// if (BDB_ENV === 'prod') {  
  // GOOGLE_MAPS_ID += '&v=3.exp&use_slippy=true';
  GOOGLE_MAPS_ID += '&v=3.31';
// }
 

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

  var jsStream = gulp.src('app/js/*.js')
    .pipe(development(sourcemaps.init()))
    .pipe(replace('<DATABASE_URL>', DATABASE_URL))
    .pipe(replace('<FACEBOOK_CLIENT_ID>', FACEBOOK_CLIENT_ID))
    .pipe(replace('<GOOGLE_CLIENT_ID>', GOOGLE_CLIENT_ID))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(replace('<BDB_ENV>', BDB_ENV))
    .pipe(plumber())
    // .pipe(concat('app.js'))
    .pipe(babel({
      presets: ['es2015']
    }))

  var templatesStream = gulp.src('app/templates/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'BDB.templates',
      noRedeclare: true, // Avoid duplicate declarations
    }))
    // .pipe(concat('templates.js')) 

  return merge(jsStream, templatesStream)
    .pipe(concat('app.min.js')) 
    // .on('error', function(e) {
    //   console.log(e);
    //   this.emit('end');
    // })
    // .pipe(gulp.dest('dist/js'))
    // .pipe(rename('app.min.js'))
    .pipe(production(uglify()))
    .pipe(sourcemaps.write('maps'))
    .pipe(fileSizes({ title: 'app.min.js', gzip: true }))
    .pipe(gulp.dest('dist/js'));
});

// HTML
gulp.task('html', () => {
  return gulp.src('app/*.html')
    .pipe(development(replace('manifest.json', 'manifest-dev.json')))
    .pipe(development(replace('/favicons/', '/favicons-dev/')))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(replace('<BDB_ENV>', BDB_ENV))
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
  swPrecache.write('dist/service-worker.js', {
    // Files to be precached to be available offline.
    staticFileGlobs: [
      'dist/**/*.{js,css}',
      'dist/*.html', 
      // 'dist/*.json', 
      // 'assets/**/*.{svg,png,jpg}',
      // 'dist/**/*.{ttf,woff,woff2}',
      'dist/fonts/glyphicons-halflings-regular.ttf',
      'dist/fonts/glyphicons-halflings-regular.woff',
      'dist/fonts/glyphicons-halflings-regular.woff2',
      'public/manifest.json', 
      'public/lib/infobox.min.js',
      'public/lib/markerclusterer.min.js',
      'public/lib/featherlight.min.js',
      'public/lib/featherlight.min.css',
      'assets/img/icon_*.svg',
      'assets/img/tipo_*.svg',
      'assets/img/pin_*.svg', 
      'assets/img/spinner.svg',
      'assets/img/current_position.svg',
      'assets/img/last_position.svg',
      'assets/img/blank_map.jpg',
      'assets/img/cluster_medium.png',
      'assets/img/cluster_big.png',
    ], 

    // Maps multiple strings to be stripped and replaced from the beginning of URL paths at runtime. Use this option 
    //   when you have multiple discrepancies between relative paths at build time and the same path at run time. 
    //   If stripPrefix and replacePrefix are not equal to '', they are automatically added to this option.
    stripPrefixMulti: {
      'dist/': '/', 
      'assets/': '/', 
      'fonts/': '/', 
      'public/': '/'
    },

    // Sets an HTML document to use as a fallback for URLs not found in the sw-precache cache. 
    //  This fallback URL needs to be cached via staticFileGlobs or dynamicUrlToDependencies otherwise it won't work.
    navigateFallback: '/index.html',
    
    // Runtime caching Handler options: https://googlechromelabs.github.io/sw-toolbox/api.html#handlers
    runtimeCaching: [
      // Network First: good for API requests where you always want the freshest data when it is available, but would
      //   rather have stale data than no data. (Will NEVER prioritize cache over network, which is slower but safer)
      { 
        urlPattern: /\.(?:png|jpg|jpeg|svg)$/, handler: 'networkFirst', options: {
          cache: {
            maxEntries: 50,
            name: 'bdb-images'
          }
        }
      }, 
      { urlPattern: /herokuapp.com\/local\/light$/, handler: 'networkFirst'},
      { urlPattern: /herokuapp.com\/local\/\d+/, handler: 'networkFirst'},  
      
      // webfont.js
      { urlPattern: /ajax\.googleapis\.com\//, handler: 'networkFirst'}, 
      
      // Google Maps scripts 
      { urlPattern: /maps\.googleapis\.com\/maps-api-v3/, handler: 'networkFirst'}, 
      
      // Google Maps tiles, etc. 
      {
        urlPattern: /maps\.googleapis\.com\/maps\//, handler: 'networkFirst', options: {
          cache: {
            maxEntries: 50,
            name: 'google-maps-api'
          }
        }
      }, 


      // Fastest: both network and cache will be tried, and will use the fastest one (most of the cases it's the cache).
      //   Whenever the network call is successful, the cache is updated.
      // CAUTION: data might be outdated!
      { urlPattern: /\/geojson\/.*.json$/, handler: 'fastest'}, 
      { urlPattern: /fonts\.googleapis\.com\//, handler: 'fastest' }, 
      { urlPattern: /herokuapp.com\/stats$/, handler: 'fastest' },
      { urlPattern: /herokuapp.com\/tag$/, handler: 'fastest' }, 


      // Network Only: no caching will be done. For calls that don't make any sense if we're offline.
      { urlPattern: /herokuapp.com\/token$/, handler: 'networkOnly' }, 

      
      // Cache First: rather heavy calls that can totally be outdated and there's no problem. Use with EXTREME caution!
      // - none - 
    ],
  }, callback);
});


// grab libraries files from bower_components, minify and push in DEST_PATH
gulp.task('bower', function() {
  var jsFilter = filter('**/*.js', {restore: true}),
    cssFilter = filter('**/*.css', {restore: true}),
    fontFilter = filter(['**/*.eot', '**/*.woff', '**/*.svg', '**/*.ttf'], {restore: true});

  // console.log(mainBowerFiles());

  return gulp.src(mainBowerFiles(), { base: BOWER_PATH })

  // grab vendor js files from bower_components, minify and push in DEST_PATH
    .pipe(jsFilter)
  // .pipe(gulp.dest(DEST_PATH + '/js/'))
    // .pipe(concat('vendors.min.js')) 
    .pipe(rename({dirname: ''}))
    .pipe(production(uglify()))
  // .pipe(rename({
  //   suffix: ".min"
  // }))
    .pipe(fileSizes({title: 'bower lib:', gzip: true, showFiles: true}))
  // .pipe(fileSizes({title: 'vendors.min.js', gzip: true}))
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
  gulp.watch('app/js/*.js', () => {
    runSequence(['scripts'], ['generate-service-worker'])
  });
  gulp.watch('app/scss/*.scss', () => {
    runSequence(['sass'], ['generate-service-worker'])
  }); 
  gulp.watch('app/*.html', () => {
    runSequence(['html'], ['generate-service-worker'])
  });
  gulp.watch('app/templates/*.hbs', () => {
    runSequence(['scripts'], ['generate-service-worker'])
  }); 
});

gulp.task('images', () => {
  return gulp.src('assets/img/**/*')
    .pipe(imagemin()) 
    .pipe(gulp.dest('dist/img')); 
});

gulp.task('server', () => {
  child.spawn('node', ['server.js']);
  // var log = fs.createWriteStream('server.log', {flags: 'a'});
  // server.stdout.pipe(log); 
  // server.stderr.pipe(log);
});

gulp.task('clean', del.bind(null, ['dist']));
 
gulp.task('build', () => {
  runSequence(['clean'], ['bower', 'bower-fonts', 'html', 'sass', 'scripts'], ['generate-service-worker'], () => {
    return gulp.src('dist/**/*').pipe(fileSizes({title: 'total output', gzip: true})); 
  });
});

gulp.task('default', () => {
  runSequence('build', 'server', 'watch');
});
