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
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const size = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const plumber = require('gulp-plumber');
const bowerFiles = require('main-bower-files')
// const fs = require('fs');w


// // Lint Task
// gulp.task('lint', () => {
//     return gulp.src('app/js/*.js')
//         .pipe(jshint())
//         .pipe(jshint.reporter('default'));
// });

// Compile Our Sass
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
        .pipe(concat('main.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'));
});

// Concatenate & Minify JS 
gulp.task('scripts', () => {
  return gulp.src('app/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(concat('app.js'))
    .pipe(babel({
      presets: ['es2015']
    }))
    // .on('error', function(e) {
    //   console.log(e);
    //   this.emit('end');
    // })
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('dist/js'))
    // .pipe(rename('app.min.js'))
    // .pipe(uglify())
    // .pipe(gulp.dest('dist/js'));
});

// @todo Rule to minify and concatenate bower libs (both JS and CSS)
// gulp.task('bower', function(){
//     return gulp.src('./bower.json')
//       .pipe(bowerFiles())
//       .pipe(plumber())
//       .pipe(uglify())
//       .pipe(gulp.dest('dist'));
// });

// Watch Files For Changes
gulp.task('watch', () => {
  // gulp.watch('js/*.js', ['lint', 'scripts']);
  // gulp.watch('assets/*', ['images']);
  gulp.watch('app/js/*.js', ['scripts']);
  gulp.watch('app/scss/*.scss', ['sass']);
  gulp.watch('bower.json', ['wiredep']);
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

// gulp.task('serve', () => {
//   runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts'], () => {
//     browserSync({
//       notify: false,
//       port: 9000,
//       server: {
//         baseDir: ['.tmp', 'app'],
//         routes: {
//           '/bower_components': 'bower_components'
//         }
//       }
//     });

//     gulp.watch([
//       'app/*.html',
//         'app/images/**/*',
//       '.tmp/fonts/**/*'
//     ]).on('change', reload);

//     gulp.watch('app/styles/**/*.scss', ['styles']);
//       gulp.watch('app/scripts/**/*.js', ['scripts']);
//       gulp.watch('app/fonts/**/*', ['fonts']);
//     gulp.watch('bower.json', ['wiredep', 'fonts']);
//   });
// });

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/scss/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/scss'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./ 
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('build', () => {
  runSequence(['clean', 'wiredep'], ['sass', 'scripts'], () => {
    return gulp.src('dist/**/*').pipe(size({title: 'build', gzip: true}));
  });
});

gulp.task('default', () => {
  runSequence('build', 'server', 'watch');
});