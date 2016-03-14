var ngConfig = require('./ng-config');

describe('ng-config', function () {
  var brunchConfig;

  beforeEach(function () {
    brunchConfig = {
      paths: { public: 'public' },
      env: ['production'],
      plugins: {}
    };
  });

  it('should be defined', function () {
    expect(ngConfig).toBeDefined();
  });

  it('should be a plugin', function () {
    expect(new ngConfig(brunchConfig)).toBeDefined();
  });

  describe('compile', function () {
    var plugin,
        compileParams;

    beforeEach(function () {
      compileParams = {
        path: 'test.conf.json',
        data: JSON.stringify({
          moduleName: 'test.config',
          values: {
            testValue: 'test Value {{=it.brunch.env}}'
          },
          constants: {
            string: 'test-value',
            interpolatedString: 'this \'{{=it.brunch.env}}\' from brunch config',
            array: ['string-in-array'],
            boolean: true,
            object: {
              item: 'item-value'
            }
          },
          overrides: {
            production: {
              constants: {
                string: 'production-test-value'
              }
            }
          }
        })
      };
      plugin = new ngConfig(brunchConfig);
    });

    it('should transform json into an angular module', function (done) {
      plugin.compile(compileParams, function (err, params) {
        expect(params.data).toBe([
          'angular.module("test.config",[])',
          '.constant("string","production-test-value")',
          '.constant("interpolatedString","this \'production\' from brunch config")',
          '.constant("array",["string-in-array"])',
          '.constant("boolean",true)',
          '.constant("object",{"item":"item-value"})',
          '.value("testValue","test Value production");'
        ].join(''));

        done();
      });
    });
  });
});
