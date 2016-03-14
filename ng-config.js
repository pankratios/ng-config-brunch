"use strict";

var fs = require('fs'),
    extend = require('util')._extend,
    path = require('path'),
    doT = require('dot');

function NgConfigPlugin(config) {
  this.brunchConfig = config || {};
  this.config = (this.brunchConfig.plugins || {}).ngconfig || {};
  this.publicPath = config.paths.public;
  this.env = this.brunchConfig.env || [];
  this.generate = this.compileTemplate();
  this.importedData = this.loadImportData();
}

NgConfigPlugin.prototype.brunchPlugin = true;
NgConfigPlugin.prototype.type = 'javascript';
NgConfigPlugin.prototype.extension = 'conf.json';
NgConfigPlugin.prototype.compile = compile;
NgConfigPlugin.prototype.getFileName = getFileName;
NgConfigPlugin.prototype.generateModule = generateModule;
NgConfigPlugin.prototype.merge = merge;
NgConfigPlugin.prototype.serialize = serialize;
NgConfigPlugin.prototype.serializeObject = serializeObject;
NgConfigPlugin.prototype.serializeValue = serializeValue;
NgConfigPlugin.prototype.serializeString = serializeString;
NgConfigPlugin.prototype.serializeArray = serializeArray;
NgConfigPlugin.prototype.compileTemplate = compileTemplate;
NgConfigPlugin.prototype.loadImportData = loadImportData;
NgConfigPlugin.prototype.loadJSON = loadJSON;
NgConfigPlugin.prototype.getImportName = getImportName;

function compile(params, callback) {
  var appConfig = JSON.parse(params.data);

  appConfig.overrides = appConfig.overrides || {};

  params.data = this.generateModule(appConfig);

  callback(null, params);
}

function getFileName(filePath) {
  var filePathObj = path.parse(filePath);

  filePathObj.dir = this.publicPath;
  filePathObj.ext = '.js';
  filePathObj.base = filePathObj.name + filePathObj.ext;

  return path.format(filePathObj);
}

function loadImportData() {
  var i = 0,
      imports = this.config.imports,
      importsCount,
      importFilePath,
      output = {};

  if (imports) {
    importsCount = imports.length;

    for(; i < importsCount; i = i + 1) {
      importFilePath = imports[i];
      output[this.getImportName(importFilePath)] = this.loadJSON(importFilePath);
    }
  }

  output.brunch = this.brunchConfig;

  return output;
}

function getImportName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function generateModule(config) {
  config.constants = this.serialize(this.merge(config, 'constants'));
  config.values = this.serialize(this.merge(config, 'values'));

  return this.generate(config);
}

function merge(config, type) {
  var merged = config[type] || {},
      envOverrides;

  this.env.forEach(function mergeData(env) {
    envOverrides = config.overrides[env];
    if (envOverrides) {
      merged = extend(merged, envOverrides[type] || {});
    }
  });

  return merged;
}

function serialize(values) {
  var serialized = {},
      name;

  for(name in values) {
    serialized[name] = this.serializeValue(values[name], true);
  }

  return serialized;
}

function serializeValue(value, stringify) {
  var type = (typeof(value) + '').toLowerCase();

  if(/string/.test(type)) {
    return this.serializeString(value, stringify);
  }

  if(/number|boolean/.test(type)) {
    return value;
  }

  if(Array.isArray(value)) {
    return this.serializeArray(value, stringify);
  }

  if (/object/.test(type)) {
    return this.serializeObject(value, stringify);
  }

  throw [
    'The type ("',
    type,
    '") is not supported'
  ].join('');
}

function serializeObject(obj, stringify) {
  var key,
      output = {};

  for(key in obj) {
    obj[key] = this.serializeValue(obj[key], false);
  }

  return stringify ? JSON.stringify(obj) : obj;
}


function serializeArray(values, stringify) {
  var valuesLength = values.length,
      i = 0;

  for(; i < valuesLength; i = i + 1) {
    values[i] = this.serializeValue(values[i], false);
  }

  return stringify ? JSON.stringify(values) : values;
}

function serializeString(value, stringify) {
  if (this.importedData) {
    value = doT.template(value)(this.importedData);
  }

  return stringify ? JSON.stringify(value) : value;
}

function compileTemplate() {
  return doT.template(
    [
      'angular',
      '.module("{{=it.moduleName}}",[',
      '])',
      '{{for(var prop in it.constants){}}',
      '.constant("{{=prop}}",{{=it.constants[prop]}})',
      '{{}}}',
      '{{for(var prop in it.values){}}',
      '.value("{{=prop}}",{{=it.values[prop]}})',
      '{{}}}',
      ';'
    ].join(''));
}

module.exports = NgConfigPlugin;
