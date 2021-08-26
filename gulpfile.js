var gulp = require( 'gulp' );
var uglify = require( 'gulp-uglify' );
var concat = require( 'gulp-concat' );
var sourcemaps = require( 'gulp-sourcemaps' );
var notify = require( 'gulp-notify' );

var paths = {
  scripts : 'fbq-spy.js'
};

gulp.task( 'js', function(){
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src( paths.scripts )
    .pipe( sourcemaps.init() )
    .pipe( uglify() )
    .pipe( concat( 'fbq-spy.min.js' ) )
    .pipe( sourcemaps.write() )
    .pipe( gulp.dest( '.' ) )
    .pipe( notify( { message : 'JS Compiled!' } ) );
} );

// Rerun the task when a file changes
gulp.task( 'watch', function(){
  gulp.watch( paths.scripts, [ 'js' ] );
  //gulp.watch(paths.images, ['images']);
} );

// The default task (called when you run `gulp` from cli)
gulp.task( 'default', gulp.parallel( 'watch', 'js' ) );


// npm install --save-dev gulp-markdox
//https://www.npmjs.com/package/gulp-markdox
/*
var markdox = require( "gulp-markdox" );

gulp.task( "doc", function(){
  gulp.src( "./src/*.js" )
    .pipe( markdox() )
    .pipe( gulp.dest( "./docs" ) ); // https://github.com/smhmic/fbqSpy/settings
} );
*/
