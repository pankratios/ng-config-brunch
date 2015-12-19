var ngConfig = require('./ng-config');

describe("ng-config", function() {
  var brunchConfig;

  beforeEach(function () {
    brunchConfig = {
      paths: { public: 'public' },
      env: ['development'],
      plugins: {}
    };
  });

  it("should be defined", function() {
    expect(ngConfig).toBeDefined();
  });

  it("should be a plugin", function() {
    expect(new ngConfig(brunchConfig)).toBeDefined();
  });

  describe('compile', function () {
    var plugin,
        compileParams;

    beforeEach(function () {
      compileParams = {
        path: "test.conf.json",
        data: JSON.stringify({
          moduleName: "test.config",
          values: {
            testValue: "test Value $brunch.env$"
          },
          constants: {
            string: "test-value",
            interpolatedString: "this '$brunch.env$' from brunch config",
            array: ['string-in-array'],
            object: {
              item: 'item-value'
            }
          }
        })
      };
      plugin = new ngConfig(brunchConfig);
    });

    it("should modify file path extension to js", function(done) {
      plugin.compile(compileParams, function (err, params) {
        expect(params.path).toBe('public/test.conf.js');

        done();
      });
    });

    it("should transform json into an angular module", function(done) {
      plugin.compile(compileParams, function (err, params) {
        expect(params.data).toBe([
          'angular.module("test.config", [])',
          '.constant("string", "test-value")',
          '.constant("interpolatedString", "this \'development\' from brunch config")',
          '.constant("array", ["string-in-array"]).constant("object", {"item":"item-value"})',
          '.value("testValue", "test Value development");'
        ].join(''));

        done();
      });
    });
  });
});
