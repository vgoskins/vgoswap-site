const gulp = require('gulp');
const sass = require('gulp-sass');
const path = require('path');
const uglifycss = require('gulp-uglifycss');
const runSequence = require('run-sequence');
const javascriptObfuscator = require('gulp-javascript-obfuscator');

gulp.task('sass', function () {
  return gulp.src(path.join(__dirname, `gulp`, `scss`, `**`, `*.scss`))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(path.join(__dirname, 'gulp', 'css')));
});
 
gulp.task('css', function () {
  gulp.src('./gulp/css/**/*.css')
    .pipe(uglifycss({
      'uglyComments': true
    }))
    .pipe(gulp.dest('./public/style/'));
});

gulp.task('obfuscate', function() {
	gulp.src('./gulp/js/**/*.js')
    .pipe(javascriptObfuscator({
        compact:true,
        sourceMap: true
    }))
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('compilesass', function(callback) {
	runSequence('sass', 'css', callback);
});

gulp.task('make', ['compilesass', 'obfuscate']);

gulp.task('watch', function() {
	gulp.watch('./gulp/scss/**/*.scss', ['compilesass']);
	gulp.watch('./gulp/js/**/*.js', ['obfuscate']);
});

gulp.task('default', ['make', 'watch']);