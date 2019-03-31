import yargs from "yargs";
const get = require('lodash.get');

/**
 * i18n helper for Handlebars
 * @example
 * {{i18n key="my_key"}}
 */
module.exports = function(key) {
  const translateFile = require(`../locales/home-${process.env.lang}.json`);
  return get(translateFile, key) || '';
}