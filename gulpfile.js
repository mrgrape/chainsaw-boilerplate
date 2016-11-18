//-----------------------
// Requiring Gulp Plugins
//-----------------------

'use strict';

var gulp = require('gulp'),
    argv = require('yargs').argv,
    del = require('del'),
    sass = require('gulp-sass'),
    bourbon = require('node-bourbon').includePaths,
    neat = require('node-neat').includePaths,
    cssnano = require('gulp-cssnano'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    nunjucksRender = require('gulp-nunjucks-render'),
    data = require('gulp-data'),
    sequence = require('run-sequence');
    

//----------
// Variables
//----------

var paths = {
    scss: 'app/assets/scss/**/*.scss'
};
var supported = [
    'last 2 versions',
    'safari >= 8',
    'ie >= 9',
    'ff >= 20',
    'ios 6',
    'android 4'
];

// -----------------
// Development Tasks
// -----------------

// Clean old "dist" files, build new site, start the server, open browser preview
gulp.task('build', function (done) {
    sequence('clean:dist', 'watch', done);
});

// Clean old "dist" files, leave cached images
gulp.task('clean:dist', function () {
    return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Watch for file changes
gulp.task('watch', function (done) {
    sequence(['sass', 'nunjucks', 'imageOptimizer', 'fonts', 'jsOptimizer'], 'browserSync', done);
    gulp.watch('app/assets/scss/**/*.scss', ['sass']);
    gulp.watch('app/**/*.nunjucks', ['nunjucks']);
    gulp.watch('app/assets/js/**/*.js', browserSync.reload);
    gulp.watch('app/assets/img/*', ['imageOptimizer']);
});

// Convert SASS to CSS
gulp.task('sass', function () {
    return gulp.src(paths.scss)
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: bourbon,
            includePaths: neat
        }))
        .pipe(gulpif(argv.production, cssnano({
            autoprefixer: {browsers: supported, add: true}
        })))
        .pipe(gulpif(argv.production, sourcemaps.write()))
        .pipe(gulp.dest('dist/assets/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Render Nunjucks to HTML
gulp.task('nunjucks', function () {
    return gulp.src('app/pages/**/*.+(html|nunjucks)')
        .pipe(data(function () {
            return require('./app/data/data.json');
        }))
        .pipe(nunjucksRender({
            path: ['app/templates']
        }))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Optimize and move images to "dist" folder
gulp.task('imageOptimizer', function () {
    return gulp.src('app/assets/img/**/*.+(png|jpg|gif|svg)')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true
        })))
        .pipe(gulp.dest('dist/assets/img'));
});

// Copy Font files to "dist"
gulp.task('fonts', function () {
    return gulp.src('app/assets/fonts/**/*')
        .pipe(gulp.dest('dist/assets/fonts'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Start the server and open browser preview
gulp.task('browserSync', function () {
    browserSync({
        server: {
            baseDir: 'dist'
        },
        port: 8080,
        browser: "google chrome"
    });
});

// Optimize JS
gulp.task('jsOptimizer', function () {
    return gulp.src('app/assets/js/**/*.js')
        .pipe(gulpif(argv.production, uglify()))
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Deleting "dist" folder and clearing the img cache
gulp.task('clean', function () {
    return del.sync('dist').then(function (done) {
        return cache.clearAll(done);
    });
});