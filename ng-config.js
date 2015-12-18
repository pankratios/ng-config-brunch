"use strict";

// var exec = require('child_process').exec;
var fs = require('fs'),
    path = require('path');

function NgConfigPlugin(config) {
  this.type = 'javascript';
  this.extension = 'json';
  this.publicPath = config.paths ? config.paths.public : null;
}

NgConfigPlugin.prototype.brunchPlugin = true;
NgConfigPlugin.prototype.compile = compile;
NgConfigPlugin.prototype.getFileName = getFileName;
NgConfigPlugin.prototype.generateConfig = generateConfig;

function compile(params, callback) {
  var config = JSON.parse(params.data);

  params.path = this.getFileName(params.path);
  params.data = this.generateConfig(config);

  callback(null, params);
}

/*
angular
 .module('', [])
 .value('', '')
 .constant('', '')
*/
function getFileName(filePath) {
  var filePathObj = path.parse(filePath);

  filePathObj.dir = this.publicPath;
  filePathObj.ext = '.js';
  filePathObj.base = filePathObj.name + filePathObj.ext;

  return path.format(filePathObj);
}

function generateConfig(config) {
  return [
    'angular.module(\'',
    config.name,
    '\', [])',
    '.constant(\'plugincheck\', \'jo men\')'
  ].join('');
}

module.exports = NgConfigPlugin;
