var gulp = require('gulp');
//var browserSync = require('browser-sync');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var sass = require('gulp-ruby-sass');
var shell = require('gulp-shell');
var sourcemaps = require('gulp-sourcemaps');
//var uglify = require('gulp-uglify');
var livereload = require('gulp-livereload');
var lr = require('tiny-lr');
var server = lr();

var sassSources   = ['src/*.scss'];
var coffeeSources = ['src/*.coffee'];
var jsSources     = ['src/*.js','js/*.js'];
var reloadSources = ['*.html','css/*.css','img/*'];
//var reloadSources = [ 'app/**/*.html','app/assets/css/**/*.css','app/assets/imgs/**/*.png','app/assets/js/**/*.js' ];


gulp.task('coffee', function() {
  gulp.src(coffeeSources)
    // .pipe(sourcemaps.init())
    .pipe(coffee({ bare: true}).on('error', gutil.log))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src'))
});

gulp.task('js', function() {
  gulp.src(jsSources)
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('combined.js'))
    //.pipe(uglify())
    .pipe(gulp.dest('./'))
    .pipe(livereload());
});

gulp.task('sass', function() {
  gulp.src(sassSources)
    .pipe(sass({style: 'expanded', lineNumbers: true}))
    .on('error', gutil.log)
    .pipe(concat('compiled.css'))
    .pipe(gulp.dest('css'));
    //.pipe(livereload());
});

gulp.task('watch', function() {
  gulp.watch(jsSources, ['js']);
  gulp.watch(coffeeSources, ['coffee']);
  gulp.watch(sassSources, ['sass']);
  var server = livereload();
  gulp.watch(reloadSources, function(e) {
   console.log(e.path + ': ' + e.type); // added, changed, or deleted
   server.changed(e.path);
  });
});

//gulp.task('browser-sync', function () {
//   browserSync.init(reloadSources, {server: {baseDir: './'}});
//   //browserSync.init(reloadSources, {proxy: "localhost:8888"});
//});

gulp.task('cat_coffescript_output', function() {
  gulp.watch('src/coffee.js', shell.task([
      'echo',
      'pygmentize -f terminal256 -O style=native -g src/coffee.js',
      'echo'
  ]));
});

gulp.task('default', ['sass','js','coffee','watch','cat_coffescript_output']);
                       //browser-sync

/*

<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>

package.json
{
  "name": "xxxxxx",
  "version": "0.1.0",
  "description": "xxxxxx",
  "author": "xxxxxx",
  "devDependencies": {
    "gulp-util": "~2.2.14",
    "gulp": "~3.6.2",
    "gulp-coffee": "~1.4.3",
    "gulp-concat": "~2.2.0",
    "gulp-ruby-sass": "~0.5.0",
    "gulp-uglify": "~0.3.0",
    "gulp-livereload": "~1.5.0",
    "tiny-lr": "0.0.7",
    "gulp-shell": "~0.2.7",
    "gulp-sourcemaps": "~0.4.1",
    "gulp-jshint": "~1.6.3",
    "browser-sync": "~0.9.1"
  }
}

*/
