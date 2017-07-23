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

const BOWER_PATH = './bower_components';
const DEST_PATH =  'dist';

var development = environments.development;
var production = environments.production;

console.log('NODE_ENV = ', process.env.NODE_ENV);


// // Lint Task
// gulp.task('lint', () => {
//     return gulp.src('app/js/*.js')
//         .pipe(jshint())
//         .pipe(jshint.reporter('default'));
// });

// Compile Our Sass
gulp.task('sass', () => {
    return gulp.src('app/scss/*.scss')
        .pipe(development(sourcemaps.init()))
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
        .pipe(production(minifycss()))
        .pipe(development(sourcemaps.write('.')))
        .pipe(fileSizes({title: 'main.min.css', gzip: true}))
        .pipe(gulp.dest('dist/css'));
});

// Concatenate & Minify JS
gulp.task('scripts', () => {
  gulp.src('app/service-worker-registration.js')
    .pipe(production(uglify()))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest('dist/'));

  return gulp.src('app/js/*.js')
    .pipe(development(sourcemaps.init()))
    .pipe(plumber())
    .pipe(concat('app.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(rename('app.min.js'))
    .pipe(production(uglify()))
    .pipe(development(sourcemaps.write('maps')))
    .pipe(fileSizes({title: 'app.min.js', gzip: true}))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('libs', () => {
  return gulp.src('app/js/lib/*.js')
    .pipe(development(sourcemaps.init()))
    .pipe(plumber())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(production(uglify()))
    .pipe(development(sourcemaps.write('maps')))
    .pipe(fileSizes({gzip: true}))
    .pipe(gulp.dest('dist/js/lib'));
})

gulp.task('html', () => { 
  return gulp.src('app/*.html')
    .pipe(development(replace('manifest.webmanifest', 'manifest-dev.webmanifest')))
    .pipe(development(replace('/favicons/', '/favicons-dev/')))
    .pipe(production(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
      // processScripts: ['text/x-handlebars-template']
    })))
    .pipe(gulp.dest('dist/'));
});

gulp.task('generate-service-worker', function(callback) {
  swPrecache.write(`dist/service-worker.js`, {
    staticFileGlobs: ['dist/**/*.{js,html,css}', 'dist/**/*.{woff,woff2,ttf}', 'public/**/*.{webmanifest}', 'assets/**/*.{png,jpg,svg}'], 
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
  return gulp.src('./bower_components/**/*.{eot,svg,ttf,woff,woff2}')
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

gulp.task('server', () => {
  child.spawn('node', ['server.js']);
  // var log = fs.createWriteStream('server.log', {flags: 'a'});
  // server.stdout.pipe(log);
  // server.stderr.pipe(log);
});

gulp.task('clean', del.bind(null, ['dist']));
 
gulp.task('build', () => {
  runSequence(['clean'], ['bower', 'bower-fonts', 'html', 'sass', 'scripts', 'libs'], ['generate-service-worker'], () => {
    return gulp.src('dist/**/*').pipe(fileSizes({title: 'total output', gzip: true}));
  });
});

gulp.task('default', () => {
  runSequence('build', 'server', 'watch');
});
