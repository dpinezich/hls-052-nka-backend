import yargs from "yargs";
const get = require('lodash.get');
const translateFile = require(`../locales/home-${process.env.lang}.json`);

/**
 * i18n helper for Handlebars
 * @example
 * {{i18n key="my_key"}}
 */
module.exports = function(key) {
  return get(translateFile, key) || `(${key})`;
}