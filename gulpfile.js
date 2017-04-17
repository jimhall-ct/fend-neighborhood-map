var gulp = require('gulp'),
    gutil = require('gulp-util'),
    connect = require('gulp-connect'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    htmlmin = require('gulp-htmlmin'),
    cssmin = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    imageresize = require('gulp-image-resize'),
    imagemin = require('gulp-imagemin'),
    pngcrush = require('imagemin-pngcrush');

var jsSources = ['development/**/*.js'];
var cssSources = ['development/**/*.css'];
var htmlSources = ['development/**/*.html'];
var imageSources = ['development/**/*.{jpg,png,gif}'];

gulp.task('js', function() {
    gulp.src(jsSources)
        .pipe(uglify())
        .pipe(gulp.dest('production'))
        .pipe(connect.reload())
});

gulp.task('css', function() {
    gulp.src(cssSources)
        .pipe(cssmin())
        .pipe(gulp.dest('production'))
        .pipe(connect.reload())
});

gulp.task('html', function() {
    gulp.src(htmlSources)
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true
        }))
        .pipe(gulp.dest('production'))
        .pipe(connect.reload())
});

// Image resizer option
var resizeImageTasks = [];
[120, 240, 360, 480, 640, 800, 1000].forEach(function(size) {
   var resizeImageTask = 'resize_' + size;

    gulp.task(resizeImageTask, function() {
        gulp.src(imageSources)
            .pipe(imageresize({
                imageMagick: true,
                width: size,
                crop: false,
                upscale: false,
                quality: 0.5
            }))
            .pipe(imagemin({
                progressive: true,
                use: [pngcrush()]
            }))
            .pipe(rename(function(path) {
                path.basename += '_' + size;
            }))
            .pipe(gulp.dest('production'))
    });
    resizeImageTasks.push(resizeImageTask);
});

gulp.task('images', function() {
    gulp.src(imageSources)
        .pipe(imagemin({
            progressive: true,
            use: [pngcrush()]
        }))
        .pipe(gulp.dest('production'))
});

gulp.task('watch', function() {
    gulp.watch(jsSources, ['js']);
    gulp.watch(htmlSources, ['html']);
    gulp.watch(cssSources, ['css']);
    gulp.watch(imageSources, ['images']);
});

gulp.task('connect', function() {
    connect.server({
        root: 'production',
        livereload: true
    });
});

gulp.task('resize_images', resizeImageTasks);
gulp.task('default', ['js', 'css', 'html', 'images', 'connect', 'watch']);