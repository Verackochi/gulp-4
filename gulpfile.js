const {
    src,
    dest,
    parallel,
    series,
    watch
} = require('gulp');
const sass = require('gulp-sass');
const notify = require("gulp-notify");
const autoPrefixer = require('gulp-autoprefixer');
const rename = require("gulp-rename");
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const del = require('del');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');

const styles = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(autoPrefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/css/'))
        .pipe(browserSync.stream());
};

const libCSS = () => {
return src(['./node_modules/normalize.css/normalize.css', './node_modules/slick-carousel/slick/slick.css', './node_modules/slick-carousel/slick/slick.js', /*'./node_modules/rateyo/lib/es/rateyo.css'*/ './node_modules/star-rating-svg2/src/css/star-rating-svg.css'])
        .pipe(concat('lib.css'))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(dest('./app/css/'))
};

const libJS = () => {
    return src(['./node_modules/jquery/dist/jquery.js', './node_modules/slick-carousel/slick/slick.js', /*'./node_modules/rateyo/lib/es/rateyo.js'*/ './node_modules/star-rating-svg2/src/jquery.star-rating-svg.js'])
        .pipe(concat('lib.js'))
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(dest('./app/js/'))
};

const htmlInclude = () => {
    return src(['./src/**/*.html', '!./src/html/*.html'])
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest('./app'))
        .pipe(browserSync.stream());
};

const fonts = () => {
    src('./src/fonts/**.ttf')
        .pipe(ttf2woff())
        .pipe(dest('./app/fonts/'))
    return src('./src/fonts/**.ttf')
        .pipe(ttf2woff2())
        .pipe(dest('./app/fonts/'))
};


const imgTooApp = () => {
    return src(['./src/images/**/*.jpg', './src/images/**/*.jpeg', './src/images/**/*.png'])
        .pipe(dest('./app/images'));
};

const resources = () => {
    return src('./src/resources/**')
        .pipe(dest('./app'))
};

const clean = () => {
    return del(['app/*'])
}

const svgSprites = () => {
    return src('./src/images/**.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "./sprite.svg"
                }
            }
        }))
        .pipe(dest('./app/images/svg'))
};

const scripts = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            mode: 'development',
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }]
            },
        }))
        .on('error', function (err) {
            console.error('WEBPACK ERROR', err);
            this.emit('end'); // Don't stop the rest of the task
        })

        .pipe(sourcemaps.init())
        .pipe(uglify().on("error", notify.onError()))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/js'))
        .pipe(browserSync.stream());
};

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: "./app"
        }
    });
};


watch('./src/scss/**/*.scss', styles);
watch('./src/**/*.html', htmlInclude);
watch('./src/images/**.jpg', imgTooApp);
watch('./src/images/**.jpeg', imgTooApp);
watch('./src/images/**.png', imgTooApp);
watch('./src/svg/**.svg', svgSprites);
watch('./src/resources/**', resources);
watch('./src/font/**.ttf', fonts);
watch('./src/js/**/*.js', scripts);



exports.styles = styles;
exports.watchFiles = watchFiles;
exports.fileinclude = fileinclude;

exports.default = series(clean, parallel(htmlInclude, libCSS, libJS, fonts, scripts, resources, imgTooApp, svgSprites), styles, watchFiles);


const stylesBuild = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        }).on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(dest('./app/css/'))
};

const scriptsBuild = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            mode: 'development',
            output: {
                filename: 'main.js',
            },
            module: {
                rules: [{
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }]
            },
        }))
        .on('error', function (err) {
            console.error('WEBPACK ERROR', err);
            this.emit('end'); // Don't stop the rest of the task
        })
        .pipe(uglify().on("error", notify.onError()))
        .pipe(dest('./app/js'))
};

const imageCompresors = () => {
    src('src/images/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            interlaced: true,
            optimizationLevel: 3,
    }))
    .pipe(dest('./app/img'))
};

exports.build = series(clean, parallel(htmlInclude, scriptsBuild, fonts, resources, imgTooApp, svgSprites), stylesBuild, imageCompresors);