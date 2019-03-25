/**
 * get current language used in helper for Handlebars
 * @example
 * {{getlang}}
 */
module.exports = function() {
  return process.env.lang;
}