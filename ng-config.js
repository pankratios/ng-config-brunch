"use strict";

var fs = require('fs'),
    extend = require('util')._extend,
    path = require('path'),
    doT = require('dot');

function NgConfigPlugin(config) {
  // brunch properties
  this.type = 'javascript';
  this.extension = 'conf.json';

  // internal
  this.config = config;
  this.publicPath = config.paths.public;
  this.generate = this.compileTemplate();
  this.importedData = this.loadImportData();
  this.env = config.env || [];
}

// brunch
NgConfigPlugin.prototype.brunchPlugin = true;
NgConfigPlugin.prototype.compile = compile;

// internal
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

  params.path = this.getFileName(params.path);
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
      imports = (this.config.plugins.ngconfig || {}).imports,
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

  output.brunch = {
    env: this.config.env,
    server: this.config.server,
    optimize: this.config.optimize
  };

  return output;
}

function getImportName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

function generateModule(config) {
  config.constants = this.serialize(this.merge(config.constants, config));
  config.values = this.serialize(this.merge(config.values, config));

  return this.generate(config);
}

function merge(values, config) {
  var merged = values || {};

  this.env.forEach(function mergeData(env) {
    merged = extend(merged, config[env] || {});
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

  if(/number/.test(type)) {
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
  var importedData = this.importedData;

  if (importedData) {
    value = value.replace(/\$([^\s\.]+\.[^\$\s]+)\$/g, function (_, propertyPath) {
      var properties = propertyPath.split('.'),
          propertyCount = properties.length,
          propertyValue = importedData,
          i = 0;

      for(; i < propertyCount; i = i + 1) {
        propertyValue = propertyValue[properties[i]];

        if (propertyValue === undefined) {
          throw [
            'The property "',
            propertyPath,
            '" can not be found.'
          ].join('');
        }
      }

      return propertyValue;
    });
  };

  return stringify ? JSON.stringify(value) : value;
}

function compileTemplate() {
  return doT.template(
    [
      'angular',
      '.module("{{=it.moduleName}}", [',
      '])',
      '{{ for(var prop in it.constants) { }}',
      '.constant("{{=prop}}", {{=it.constants[prop]}})',
      '{{}}}',
      '{{ for(var prop in it.values) { }}',
      '.value("{{=prop}}", {{=it.values[prop]}})',
      '{{}}}',
      ';'
    ].join(''));
}

module.exports = NgConfigPlugin;
