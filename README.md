# ng-config-brunch

Generates an angular module from a json config file

## Usage

Install the plugin via npm with `npm install git@github.com:pankratios/ng-config-brunch.git`.

## Options

Import external data through the `imports` section.

```javascript
{
  ...
  plugins: {
    ngconfig: {
      imports: [
        './package.json',
        './bower.json'
      ]
    }
  }
}
```

The imported data can be accessed with `$...$` notation.

```javascript
{
  "packageVersion": "$package.version$"
  "bowerVersion": "$bower.version$"
}
```

## Configuration file structure

Configurations can be overriden per `environment`, `development` is the default.

## Eexample

`*.conf.json`
```javascript
{
  "moduleName": "myApp.config",
  "values": {
    "appName": "App name is $bower.name$",
  },
  "constants": {
    "appVersion": "version $package.version$",
    "requestTimeout": 3000
  },
  "production": {
    "requestTimeout": 1000
  }
}
```

### Generated module

`development env`
```javascript
angular
  .module("myApp.config", [])
  .constant("appVersion", "version 1.0.9")
  .value("appName", "App name is angular-config-example")
  .constant("requestTimeout", 3000)
```

`production env`
```javascript
angular
  .module("myApp.config", [])
  ...
  .constant("requestTimeout", 1000)
```

### Todo

- [x] Support `value`
- [ ] Support `functions`?
- [ ] Should overrides defined per type (constant and a value with the same name makes
  no sense)
