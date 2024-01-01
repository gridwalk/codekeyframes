import http from 'http'
import gulp from 'gulp'
import gulpWatch from 'gulp-watch'
import dartSass from 'sass'
import gulpSass from 'gulp-sass'
import autoprefixer from 'gulp-autoprefixer'
import rename from 'gulp-rename'
import livereload from 'gulp-livereload'
import opn from 'opn'
import plumber from 'gulp-plumber'
import notify from 'gulp-notify'
import jshint from 'gulp-jshint'
import concat from 'gulp-concat'
import fs from 'fs'
import serveStatic from 'serve-static'
import finalhandler from 'finalhandler'
import minify from 'gulp-minify'

const packageJson = JSON.parse(fs.readFileSync('./package.json'))
const sass = gulpSass(dartSass)

// paths to files that are used in the project
var paths = {
  styles: './src/scss/**/*',
  pages:'./src/html/**/*',
  dist: './dist/',
  scripts: {
    vendor: './src/js/vendor/**/*',
    app: './src/js/app/**/*',
  },
}

const pages = () => {
  return gulp.src(paths.pages)
    .pipe(gulp.dest(paths.dist))
    .pipe(livereload())
}

// do the scss compilation
const styles = () => {
  return gulp.src('./src/scss/style.scss')
    .pipe(plumber({
      errorHandler: err => {
        notify.onError({
          title: err.relativePath,
          subtitle: 'Line ' + err.line,
          message: '<%= error.messageOriginal %>'
        })(err)
        this.emit('end')
      }
    }))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(rename('codekeyframes.css'))
    .pipe(gulp.dest(paths.dist))
    .pipe(livereload())
}

// show notification on js error
const lintScripts = () => {
  return gulp.src(paths.scripts.app)
    .pipe(plumber())
    .pipe(jshint({
      // https://jshint.com/docs/options/  reference all options
      'esversion': 11,
      'debug': true, // allows debugger statements
      'asi': true, // allows missing semicolons
      'sub': true, // allows bracket notation of array items
      'evil': true, // allows eval statements
    }))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(notify(function (file) { // Use gulp-notify as jshint reporter
      if (file.jshint.success) {
        return false // Don't show something if success
      }
      var errors = file.jshint.results.map(function (data) {
        if (data.error) {
          return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason
        }
      }).join("\n")
      return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors
    }))
}

// compiles all js into one file: main.js
const compileScripts = () => {
  return gulp.src([ paths.scripts.vendor, paths.scripts.app ])
    .pipe(concat('codeKeyframes.js'))
    .pipe(minify({
      ext:{
        src:'.js',
        min:'.min.js'
      }
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(livereload())
}

const scripts = gulp.series(lintScripts, compileScripts)
scripts.description = 'compile scripts'

const compile = gulp.parallel(pages, styles, scripts)
compile.description = 'compile all sources'

const startServer = (done) => {
  
  // // Serve up dist folder
  var serve = serveStatic(paths.dist)

  // Create server
  var server = http.createServer(function onRequest(req, res) {
    serve(req, res, finalhandler(req, res))
  })

  // Listen for requests on port 3000
  // http://localhost:3000
  server.listen(3000)

  done()

}

const openBrowser = (done) => {
  opn(`http://localhost:${ packageJson.port }`)
  livereload.listen()
  done()
}

const serve = gulp.series(compile, startServer, openBrowser)

// gulp watches the filesystem for changes, then compiles the according files
const watch = (done) => {

  gulpWatch(paths.pages, function () {
    pages()
  })

  gulpWatch(paths.styles, function () {
    styles()
  })

  gulpWatch(paths.scripts.app, function () {
    scripts()
  })
  done()
}


gulp.task('default', gulp.parallel(serve, watch))