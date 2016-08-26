(function (exports) {
  'use strict';
  /* exported defineMethod */
  
  var proto = {},
    updater,
    settable = false,
    callbacks = {},
    arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice'],
    defaults = ['filter'];
	
  proto = {
    createPrivateProperty: function(appendObj, propName) {
      return Object.defineProperty(appendObj, "_" + propName, {
        enumerable: false,
        writable: true
      });
    },
    createProperty: function(appendObj, propName, val, mapper, level) {
      var protoObj = this,
        map,
        level = level || 0,
        mapper = mapper || [propName];
        // fix mapper if level is less than its lenght
      	mapper = mapper.slice(0, level);

      var obj = Object.defineProperty(appendObj, propName, {
        get: function() {
          return this["_" + propName];
        },
        set: function(newVal) {
          var _self = this,
            oldVal,
            callback;

          if (newVal && newVal !== protoObj["_" + propName]) {
            if (angular.isObject(newVal) && !Array.isArray(newVal)) {

              protoObj.createPrivateProperty(_self, propName);
              mapper[level++] = propName;
              _self['_' + propName] = {};

              angular.forEach(newVal, function(val, name) {
                if (typeof val !== 'function') {
                  protoObj.createProperty(_self["_" + propName], name, val, mapper, level);
                  mapper[level] = name;
                  protoObj.createPrivateProperty(_self["_" + propName], 'mapper_');
                  _self["_" + propName]['_mapper_'] = mapper.slice(0, mapper.length - 1).join('.');
                } 
                else {
                  _self["_" + propName][name] = val;
                }
              });

              return;
            }

            if (!this["_" + propName]) {
              protoObj.createPrivateProperty(this, propName);
            }

            // Store old value of the property
            oldVal = Array.isArray(this["_" + propName]) ? this["_" + propName].slice(0) : this["_" + propName];
            // Set the new value of the property
            this["_" + propName] = newVal;

            if (typeof protoObj.update === 'function') {
              //Call method on update
              protoObj.update(propName, newVal, oldVal, this['_mapper_'] + '.' + propName, this);
            }

            callback = (callbacks[this['_mapper_']] || callbacks[this['_mapper_'] + '.' + propName] || callbacks['*']) || false;
            if (typeof callback === 'function') {
              callback(newVal, oldVal, this['_mapper_'] + '.' + propName);
            }
            
            // 
            Object.defineProperty(protoObj, "$timesChanged", {
              value: protoObj.$timesChanged += 1
            });

            if (Array.isArray(newVal)) {
              arrayMethods.forEach(function(prop) {
                newVal[prop] = function() {
                  var oldArr = this.slice(0);
                  var newEntry = Array.prototype[prop].apply(this, arguments);
									
                  if (typeof callback === 'function') {
                    callback(this, oldArr, _self['_mapper_'] + '.' + propName);
                  }
                  
                  Object.defineProperty(protoObj, "$timesChanged", {
                    value: protoObj.$timesChanged += 1
                  });
                  
                  return newEntry;
                };
              });
            }

          }
        },
        enumerable: true,
        configurable: true
      });

      obj[propName] = angular.isDefined(val) ? val : null;

      return obj;
    },
    addProp: function(name, val) {
      this.createProperty(this, name, val);
      return this;
    },
    on: function(selector, callback) {
      callbacks[selector] = callback;
      return this;
    },
    off: function(selector) {
      if (!selector) {
        callbacks = {};
      } 
      else {
        callbacks[selector] = null;
      }

      return this;
    },
    init: function(newScope) {

			function MainScope() {
        // Define inner property which will count the changes in the object
        Object.defineProperty(this, '$timesChanged', {
          writable: false,
          enumerable: false,
          configurable: true,
          value: 0
        });
      }
 
      MainScope.prototype = Object.create(proto);
  		var mainScope = new MainScope();
      
      if( newScope===true ) {
        return new MainScope();
      }
      
      defaults.forEach(function(name) {
        mainScope.addProp(name);
      });
      
      return mainScope;
    },
    $new: function(options) {
      return this.init(true);
    }
  };

  //return proto.init();
  
  /* global angular, MainScope, MainScope */

  angular.module('MainScope', [])
    .factory('MainScope', function () {
      return proto.init();
    });
  
}(typeof window === 'undefined' ? module.exports : window));