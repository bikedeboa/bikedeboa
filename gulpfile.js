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
const fileSizes = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const plumber = require('gulp-plumber');
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
const exec = require('gulp-exec');
const declare = require('gulp-declare'); 
const merge = require('merge-stream');


// Environment specific variables
const development = environments.development;
const production = environments.production;
const BDB_ENV = process.env.BDB_ENV || 'localhost';
const BDB_COUNTRYCODE = process.env.BDB_COUNTRYCODE || 'BR';

const DATABASE_URL = process.env.DATABASE_URL || 'https://bdb-test-api.herokuapp.com';

console.log('NODE_ENV =', development() ? 'development' : 'production');
console.log('BDB_ENV =', BDB_ENV);
console.log('BDB_COUNTRYCODE =', BDB_COUNTRYCODE);

const FACEBOOK_IDS = {
  prod: '2007305346231830',
  beta: '478533412529512',
  localhost: '478533412529512'
};

const GOOGLE_IDS = {
  prod: '319090409123-bi80qd52k4qpokld0d1asj56rlknosjn.apps.googleusercontent.com',
  beta: '319090409123-69tt57hvqglbfrfqo8di0efj2ubpusrb.apps.googleusercontent.com',
  localhost: '319090409123-op2g7784o89mgvarnv5ctkh394oo49eu.apps.googleusercontent.com'
  //localhost: '319090409123-69tt57hvqglbfrfqo8di0efj2ubpusrb.apps.googleusercontent.com'
};

const GOOGLE_DOMAIN_VERIFICATION = {
  localhost  : 'Y_cOF4KQfBquQDznr2yIrMPCFe5Gq1XCc5v7PUufM2I',
  beta       : 'lBRCnp2PL1ybmfdHuE9XuKOwlVM414hRHD6cnejL0Yo',
  prod       : 'Y_cOF4KQfBquQDznr2yIrMPCFe5Gq1XCc5v7PUufM2I'
}

const GOOGLE_API_KEY = 'AIzaSyAeJ1ByYK4W3TxCHlFlvP6eV9XfNG55e3U';
const FACEBOOK_CLIENT_ID = FACEBOOK_IDS[BDB_ENV];
const GOOGLE_CLIENT_ID = GOOGLE_IDS[BDB_ENV];
const GOOGLE_DOMAIN_ID = GOOGLE_DOMAIN_VERIFICATION[BDB_ENV];
const GOOGLE_MAPS_ID = GOOGLE_API_KEY;
 
// Production: opt-out of the Experimental new renderer and base map style
// https://developers.google.com/maps/documentation/javascript/releases
// if (BDB_ENV === 'prod') {  
  // GOOGLE_MAPS_ID += '&v=3.exp&use_slippy=true';
  // GOOGLE_MAPS_ID += '&v=3.31';
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

  gulp.src('app/**/*.handlebars')
    .pipe(replace('<DATABASE_URL>', DATABASE_URL))
    .pipe(replace('<FACEBOOK_CLIENT_ID>', FACEBOOK_CLIENT_ID))
    .pipe(replace('<GOOGLE_CLIENT_ID>', GOOGLE_CLIENT_ID))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(replace('<BDB_ENV>', BDB_ENV))
    .pipe(replace('<BDB_COUNTRYCODE>', BDB_COUNTRYCODE))
    .pipe(replace('<GOOGLE_DOMAIN_ID>', GOOGLE_DOMAIN_ID))
    .pipe(gulp.dest('dist/'));
  
  gulp.src('server.js')
    .pipe(replace('<DATABASE_URL>', DATABASE_URL))
    .pipe(replace('<FACEBOOK_CLIENT_ID>', FACEBOOK_CLIENT_ID))
    .pipe(replace('<GOOGLE_CLIENT_ID>', GOOGLE_CLIENT_ID))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(replace('<BDB_ENV>', BDB_ENV))
    .pipe(replace('<BDB_COUNTRYCODE>', BDB_COUNTRYCODE))
    .pipe(replace('<GOOGLE_DOMAIN_ID>', GOOGLE_DOMAIN_ID))
    .pipe(plumber())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('dist/'));

  var jsStream = gulp.src('app/js/*.js')
    .pipe(development(sourcemaps.init()))
    .pipe(replace('<DATABASE_URL>', DATABASE_URL))
    .pipe(replace('<FACEBOOK_CLIENT_ID>', FACEBOOK_CLIENT_ID))
    .pipe(replace('<GOOGLE_CLIENT_ID>', GOOGLE_CLIENT_ID))
    .pipe(replace('<GOOGLE_MAPS_ID>', GOOGLE_MAPS_ID))
    .pipe(replace('<BDB_ENV>', BDB_ENV))
    .pipe(replace('<BDB_COUNTRYCODE>', BDB_COUNTRYCODE))
    .pipe(plumber())
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
    .pipe(replace('<BDB_COUNTRYCODE>', BDB_COUNTRYCODE))
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
    // Files to be precached, which will always be available offline
    //   Not to be mistaken with Runtime Caching, which may also enable some assets to be available offline
    staticFileGlobs: [
      // 'dist/*.json', 
      // 'assets/**/*.{svg,png,jpg}',
      // 'dist/**/*.{ttf,woff,woff2}', 
      // 'dist/**/*.{js,css,html}', 
      // 'public/lib/infobox.min.js', 
      // 'public/lib/markerclusterer.min.js', 
      'public/*.{json}', 
      'dist/fonts/glyphicons-halflings-regular.ttf',
      'dist/fonts/glyphicons-halflings-regular.woff',
      'dist/fonts/glyphicons-halflings-regular.woff2',
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
    navigateFallbackWhitelist: [/^\/b\//],
    
    // Runtime caching Handler options: https://googlechromelabs.github.io/sw-toolbox/api.html#handlers
    runtimeCaching: [
      // Network First: good for API requests where you always want the freshest data when it is available, but would
      //   rather have stale data than no data. (Will NEVER prioritize cache over network, which is slower but safer)
      
      // All JS, CSS and HTML files
      // @todo understand why code sometimes doesn't get updated even if there's network available
      // { urlPattern: /\.(?:js|css|html)$/, handler: 'networkFirst' },
      
      // All image asssets
      { 
        urlPattern: /\.(?:png|jpg|jpeg|svg)$/, handler: 'networkFirst', options: {
          cache: {
            maxEntries: 50,
            name: 'bdb-images'
          }
        }
      }, 
      
      // BDB API Requests
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


// Watch Files For Changes
gulp.task('watch', () => {
  gulp.watch('app/js/*.js',
    gulp.series('scripts', 'generate-service-worker')
  );
  gulp.watch('app/scss/*.scss',
    gulp.series('sass', 'generate-service-worker')
  ); 
  gulp.watch('app/*.html',
    gulp.series('html', 'generate-service-worker')
  );
  gulp.watch('app/templates/*.hbs',
    gulp.series('scripts', 'generate-service-worker')
  ); 
});

gulp.task('images', () => {
  return gulp.src('assets/img/**/*')
    .pipe(imagemin()) 
    .pipe(gulp.dest('dist/img')); 
});

gulp.task('server', () => {
  child.spawn('node', ['dist/server.js']); 
  
  // var log = fs.createWriteStream('server.log', {flags: 'a'});
  // server.stdout.pipe(log); 
  // server.stderr.pipe(log);

  // exec('node dist/server.js', function (err, stdout, stderr) {
  //   console.log(stdout);
  //   console.log(stderr);
  //   cb(err);
  // });
});

gulp.task('clean', del.bind(null, ['dist']));
 
gulp.task('build',
  gulp.series('clean', gulp.parallel('html', 'sass', 'scripts'), 'generate-service-worker', () => {
    return gulp.src('dist/**/*').pipe(fileSizes({title: 'total output', gzip: true})); 
  })
);

gulp.task('default',
  gulp.series('build', gulp.parallel('server', 'watch'))
);
