import gulp from 'gulp';
import less from 'gulp-less';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import htmlmin from 'gulp-htmlmin';
import { deleteAsync } from 'del';

const paths = {
    styles: {
        src: 'src/styles/**/*.less',
        dest: 'dist/styles/'
    },
    scripts: {
        src: 'src/scripts/**/*.js',
        dest: 'dist/scripts/'
    },
    views: {
        src: 'src/views/**/*.html',
        dest: 'dist/'
    }
};

export function clean() {
    return deleteAsync(['dist']);
}

export function styles() {
    return gulp.src(paths.styles.src)
        .pipe(less())
        .pipe(gulp.dest(paths.styles.dest));
}

export function scripts() {
    return gulp.src(paths.scripts.src)
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dest));
}

export function views() {
    return gulp.src(paths.views.src)
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.views.dest));
}

export function watch() {
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.views.src, views);
}
export function photos(){
    return gulp.src('src/**/*').pipe(gulp.dest('dist/'));
}

const build = gulp.series(clean, gulp.parallel(styles, scripts, views, photos));
export { build };
export default build;