import gulp from "gulp";
import plugins from "gulp-load-plugins";
import browser from "browser-sync";
import rimraf from "rimraf";
import panini from "panini";
import yargs from "yargs";
import lazypipe from "lazypipe";
import inky from "inky";
import fs from "fs";
import siphon from "siphon-media-query";
import inlineimg from "gulp-inline-image";
import ext_replace from "gulp-ext-replace";

const $ = plugins();

const locales = ["de", "it", "fr"];

// Look for the --production flag
const PRODUCTION = !!yargs.argv.production;
const EMAIL = yargs.argv.to;
const LANG = yargs.argv.lang || locales[0];
const DIST = "emails/dist/";

process.env.lang = LANG;

// Declar var so that both AWS and Litmus task can use it.
var CONFIG;

// Build the "dist" folder by running all of the below tasks
gulp.task(
  "build",
  gulp.series(
    clean,
    pagesWithTranslation,
    sass,
    images,
    fonts,
    base64Images,
    inline
  )
);

// Build emails, run the server, and watch for file changes
gulp.task(
  "default",
  gulp.series(
    clean,
    pages,
    sass,
    images,
    fonts,
    base64Images,
    inline,
    server,
    watch
  )
);

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf(DIST, done);
}

function pagesWithTranslation(done) {
  const tasks = locales.map(locale => {
    return () => {
      process.env.lang = locale;
      return gulp
        .src(["emails/pages/**/*.html", "!emails/pages/archive/**/*.html"])
        .pipe(
          panini({
            root: "./emails/pages",
            layouts: "./emails/layouts",
            partials: "./emails/partials",
            helpers: "./emails/helpers"
          })
        )
        .pipe(inky())
        .pipe(ext_replace(`${locale}.html`))
        .pipe(gulp.dest(DIST));
    };
  });

  return gulp.series(...tasks, seriesDone => {
    seriesDone();
    done();
  })();
}

// Compile layouts, pages, and partials into flat HTML files
// Then parse using Inky templates
function pages() {
  return gulp
    .src(["emails/pages/**/*.html", "!emails/pages/archive/**/*.html"])
    .pipe(
      panini({
        root: "./emails/pages",
        layouts: "./emails/layouts",
        partials: "./emails/partials",
        helpers: "./emails/helpers"
      })
    )
    .pipe(inky())
    .pipe(gulp.dest(DIST));
}

// Reset Panini's cache of layouts and partials
function resetPages(done) {
  panini.refresh();
  done();
}

// Compile Sass into CSS
function sass() {
  return gulp
    .src("emails/assets/scss/app.scss")
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe(
      $.sass({
        includePaths: ["node_modules/foundation-emails/scss"]
      }).on("error", $.sass.logError)
    )
    .pipe(
      $.if(
        PRODUCTION,
        $.uncss({
          html: [DIST + "/**/*.html"]
        })
      )
    )
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(DIST + "/css"));
}

// Copy and compress images
function images() {
  return (
    gulp
      .src(["emails/assets/img/**/*", "!emails/assets/img/archive/**/*"])
      .pipe($.imagemin())
      // .pipe(inlineimg("emails/assets/img"))
      .pipe(gulp.dest(DIST + "/assets/img"))
  );
}

// Html img src to base64
function base64Images() {
  return gulp
    .src(DIST + "/**/*.html")
    .pipe(inlineimg("emails/assets/img")) // takes in the directory to use as the root when looking for images
    .pipe(gulp.dest(DIST));
}

// Copy fonts
function fonts() {
  return gulp
    .src(["emails/assets/fonts/**/*", "!emails/assets/fonts/archive/**/*"])
    .pipe(gulp.dest(DIST + "/assets/fonts"));
}

// Inline CSS and minify HTML
function inline() {
  return gulp
    .src(DIST + "/**/*.html")
    .pipe($.if(PRODUCTION, inliner(DIST + "/css/app.css")))
    .pipe(gulp.dest(DIST));
}

// Start a server with LiveReload to preview the site in
function server(done) {
  browser.init({
    server: DIST
  });
  done();
}

// Watch for file changes
function watch() {
  gulp
    .watch("emails/pages/**/*.html")
    .on("all", gulp.series(pages, inline, browser.reload));
  gulp
    .watch(["emails/layouts/**/*", "emails/partials/**/*"])
    .on("all", gulp.series(resetPages, pages, inline, browser.reload));
  gulp
    .watch(["emails/locales/**/*"])
    .on("all", gulp.series(resetPages, pages, browser.reload));
  gulp
    .watch(["../scss/**/*.scss", "emails/assets/scss/**/*.scss"])
    .on("all", gulp.series(resetPages, sass, pages, inline, browser.reload));
  gulp
    .watch("emails/assets/img/**/*")
    .on("all", gulp.series(images, browser.reload));
}

// Inlines CSS into HTML, adds media query CSS into the <style> tag of the email, and compresses the HTML
function inliner(css) {
  var css = fs.readFileSync(css).toString();
  var mqCss = siphon(css);

  var pipe = lazypipe()
    .pipe(
      $.inlineCss,
      {
        applyStyleTags: false,
        removeStyleTags: true,
        preserveMediaQueries: true,
        removeLinkTags: false
      }
    )
    .pipe(
      $.replace,
      "<!-- <style> -->",
      `<style>${mqCss}</style>`
    )
    .pipe(
      $.replace,
      '<link rel="stylesheet" type="text/css" href="css/app.css">',
      ""
    )
    .pipe(
      $.htmlmin,
      {
        collapseWhitespace: true,
        minifyCSS: true
      }
    );

  return pipe();
}
