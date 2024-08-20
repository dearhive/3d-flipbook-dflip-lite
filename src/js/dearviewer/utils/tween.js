//region TWEEN.js required for animation
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 */
(function TweenJs() {
  var TWEEN = TWEEN || (function () {

    var _tweens = [];

    return {

      getAll: function () {

        return _tweens;

      },

      removeAll: function () {

        _tweens = [];

      },

      add: function (tween) {

        _tweens.push(tween);

      },

      remove: function (tween) {

        var i = _tweens.indexOf(tween);

        if (i !== -1) {
          _tweens.splice(i, 1);
        }

      },

      update: function (time) {

        if (_tweens.length === 0) {
          return false;
        }

        var i = 0;

        //noinspection JSUnresolvedVariable
        time = time != null ? time : window.performance.now();

        while (i < _tweens.length) {

          if (_tweens[i].update(time)) {
            i++;
          } else {
            _tweens.splice(i, 1);
          }

        }

        return true;

      }
    };

  })();

  TWEEN.Tween = function (object) {

    var _object = object;
    var _valuesStart = {};
    var _valuesEnd = {};
    var _valuesStartRepeat = {};
    var _duration = 1000;
    var _repeat = 0;
    var _yoyo = false;
    var _isPlaying = false;
    var _reversed = false;
    var _delayTime = 0;
    var _startTime = null;
    var _easingFunction = TWEEN.Easing.Linear.None;
    var _interpolationFunction = TWEEN.Interpolation.Linear;
    var _chainedTweens = [];
    var _onStartCallback = null;
    var _onStartCallbackFired = false;
    var _onUpdateCallback = null;
    var _onCompleteCallback = null;
    var _onStopCallback = null;

    // Set all starting values present on the target object
    for (var field in object) {
      //noinspection JSUnfilteredForInLoop
      _valuesStart[field] = parseFloat(object[field], 10);
    }

    this.to = function (properties, duration) {

      if (duration != null) {
        _duration = duration;
      }

      _valuesEnd = properties;

      return this;

    };

    this.start = function (time) {

      TWEEN.add(this);

      _isPlaying = true;

      _onStartCallbackFired = false;

      _startTime = time != null ? time : window.performance.now();
      _startTime += _delayTime;

      for (var property in _valuesEnd) {

        // Check if an Array was provided as property value
        if (_valuesEnd[property] instanceof Array) {

          if (_valuesEnd[property].length === 0) {
            continue;
          }

          // Create a local copy of the Array with the start value at the front
          _valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

        }

        // If `to()` specifies a property that doesn't exist in the source object,
        // we should not set that property in the object
        if (_valuesStart[property] == null) {
          continue;
        }

        _valuesStart[property] = _object[property];

        if ((_valuesStart[property] instanceof Array) === false) {
          _valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
        }

        _valuesStartRepeat[property] = _valuesStart[property] || 0;

      }

      return this;

    };

    this.stop = function () {

      if (!_isPlaying) {
        return this;
      }

      TWEEN.remove(this);
      _isPlaying = false;

      if (_onStopCallback != null) {
        _onStopCallback.call(_object);
      }

      this.stopChainedTweens();
      return this;

    };

    this.stopChainedTweens = function () {

      for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
        _chainedTweens[i].stop();
      }

    };

    this.complete = function () {
      if (!_isPlaying) {
        return this;
      }

      TWEEN.remove(this);
      _isPlaying = false;

      if (_onCompleteCallback != null) {
        _onCompleteCallback.call(_object);
      }

      this.completeChainedTweens();
      return this;
    };

    this.completeChainedTweens = function () {

      for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
        _chainedTweens[i].complete();
      }

    };

    this.delay = function (amount) {

      _delayTime = amount;
      return this;

    };

    this.repeat = function (times) {

      _repeat = times;
      return this;

    };

    //noinspection JSUnusedGlobalSymbols
    this.yoyo = function (yoyo) {

      _yoyo = yoyo;
      return this;

    };


    this.easing = function (easing) {

      _easingFunction = easing == null ? _easingFunction : easing;
      return this;

    };

    this.interpolation = function (interpolation) {

      _interpolationFunction = interpolation;
      return this;

    };

    //noinspection JSUnusedGlobalSymbols
    this.chain = function () {

      _chainedTweens = arguments;
      return this;

    };

    this.onStart = function (callback) {

      _onStartCallback = callback;
      return this;

    };

    this.onUpdate = function (callback) {

      _onUpdateCallback = callback;
      return this;

    };

    this.onComplete = function (callback) {

      _onCompleteCallback = callback;
      return this;

    };

    //noinspection JSUnusedGlobalSymbols
    this.onStop = function (callback) {

      _onStopCallback = callback;
      return this;

    };

    this.update = function (time) {

      var property;
      var elapsed;
      var value;

      if (time < _startTime) {
        return true;
      }

      if (_onStartCallbackFired === false) {

        if (_onStartCallback != null) {
          _onStartCallback.call(_object);
        }

        _onStartCallbackFired = true;

      }

      elapsed = (time - _startTime) / _duration;
      elapsed = elapsed > 1 ? 1 : elapsed;

      value = _easingFunction(elapsed);

      for (property in _valuesEnd) {

        // Don't update properties that do not exist in the source object
        if (_valuesStart[property] == null) {
          continue;
        }

        var start = _valuesStart[property] || 0;
        var end = _valuesEnd[property];

        if (end instanceof Array) {

          _object[property] = _interpolationFunction(end, value);

        } else {

          // Parses relative end values with start as base (e.g.: +10, -3)
          if (typeof (end) === 'string') {

            if (end.startsWith('+') || end.startsWith('-')) {
              end = start + parseFloat(end, 10);
            } else {
              end = parseFloat(end, 10);
            }
          }

          // Protect against non-numeric properties.
          if (typeof (end) === 'number') {
            _object[property] = start + (end - start) * value;
          }

        }

      }

      if (_onUpdateCallback != null) {
        _onUpdateCallback.call(_object, value);
      }

      if (elapsed === 1) {

        if (_repeat > 0) {

          if (isFinite(_repeat)) {
            _repeat--;
          }

          // Reassign starting values, restart by making startTime = now
          for (property in _valuesStartRepeat) {

            if (typeof (_valuesEnd[property]) === 'string') {
              _valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
            }

            if (_yoyo) {
              var tmp = _valuesStartRepeat[property];

              _valuesStartRepeat[property] = _valuesEnd[property];
              _valuesEnd[property] = tmp;
            }

            _valuesStart[property] = _valuesStartRepeat[property];

          }

          if (_yoyo) {
            _reversed = !_reversed;
          }

          _startTime = time + _delayTime;

          return true;

        } else {

          if (_onCompleteCallback != null) {
            _onCompleteCallback.call(_object);
          }

          for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
            // Make the chained tweens start exactly at the time they should,
            // even if the `update()` method was called way past the duration of the tween
            _chainedTweens[i].start(_startTime + _duration);
          }

          return false;

        }

      }

      return true;

    };

  };

  TWEEN.Easing = {

    Linear: {

      None: function (k) {

        return k;

      }

    },

    Quadratic: {

      In: function (k) {

        return k * k;

      },

      Out: function (k) {

        return k * (2 - k);

      },

      InOut: function (k) {

        if ((k *= 2) < 1) {
          return 0.5 * k * k;
        }

        return -0.5 * (--k * (k - 2) - 1);

      }

    },
    Quartic: {

      In: function (k) {

        return k * k * k * k;

      },

      Out: function (k) {

        return 1 - (--k * k * k * k);

      },

      InOut: function (k) {

        if ((k *= 2) < 1) {
          return 0.5 * k * k * k * k;
        }

        return -0.5 * ((k -= 2) * k * k * k - 2);

      }

    },
    Sinusoidal: {

      In: function (k) {

        return 1 - Math.cos(k * Math.PI / 2);

      },

      Out: function (k) {

        return Math.sin(k * Math.PI / 2);

      },

      InOut: function (k) {

        return 0.5 * (1 - Math.cos(Math.PI * k));

      }

    },
    Cubic: {

      In: function (k) {

        return k * k * k;

      },

      Out: function (k) {

        return --k * k * k + 1;

      },

      InOut: function (k) {

        if ((k *= 2) < 1) {
          return 0.5 * k * k * k;
        }

        return 0.5 * ((k -= 2) * k * k + 2);

      }

    }

  };

  //noinspection JSUnusedGlobalSymbols
  TWEEN.Interpolation = {

    Linear: function (v, k) {

      var m = v.length - 1;
      var f = m * k;
      var i = Math.floor(f);
      var fn = TWEEN.Interpolation.Utils.Linear;

      if (k < 0) {
        return fn(v[0], v[1], f);
      }

      if (k > 1) {
        return fn(v[m], v[m - 1], m - f);
      }

      return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

    },

    Bezier: function (v, k) {

      var b = 0;
      var n = v.length - 1;
      var pw = Math.pow;
      var bn = TWEEN.Interpolation.Utils.Bernstein;

      for (var i = 0; i <= n; i++) {
        b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
      }

      return b;

    },

    Utils: {

      Linear: function (p0, p1, t) {

        return (p1 - p0) * t + p0;

      },

      Bernstein: function (n, i) {

        var fc = TWEEN.Interpolation.Utils.Factorial;

        return fc(n) / fc(i) / fc(n - i);

      },

      Factorial: (function () {

        var a = [1];

        return function (n) {

          var s = 1;

          if (a[n]) {
            return a[n];
          }

          for (var i = n; i > 1; i--) {
            s *= i;
          }

          a[n] = s;
          return s;

        };

      })(),

      CatmullRom: function (p0, p1, p2, p3, t) {

        var v0 = (p2 - p0) * 0.5;
        var v1 = (p3 - p1) * 0.5;
        var t2 = t * t;
        var t3 = t * t2;

        return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

      }

    }
  };

  window.TWEEN = TWEEN;
})();