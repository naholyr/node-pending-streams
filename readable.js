"use strict";

/* eslint-env node */
/* eslint no-underscore-dangle:0 */

var fs = require("fs");
var Readable = require("stream").Readable;
var util = require("util");
var debug = require("debug")("pending-streams:readable");


var PendingReadable = module.exports = function (filename, opt) {
  if (!(this instanceof PendingReadable)) {
    return new PendingReadable(filename, opt);
  }

  Readable.call(this, opt);

  var suffix = (opt && opt.suffix) || ".part";

  this._pushed = 0;
  this._open(filename, filename + suffix, opt || {});
};

util.inherits(PendingReadable, Readable);


PendingReadable.prototype._open = function (finished, pending, opt) {
  var self = this;

  fs.exists(finished, function (exists) {
    var filename = exists ? finished : pending;

    debug("Open", filename);
    self._input = fs.createReadStream(filename, {
      "highWaterMark":  opt.highWaterMark,
      "start":          self._pushed
    });

    self._input.on("error", function (err) {
      if (err.code === "ENOENT" && !exists) {
        // Pending file does not exist: writing has not even started yet
        if (opt.wait) {
          // We're supposed to wait… try again ASAP
          setImmediate(function () {
            self._open(finished, pending, opt);
          });
          return;
        }
      }
      self.emit("error", err);
    });

    // Read ASAP
    self._input.on("readable", function () {
      self.__read();
    });

    // Reached end of input:
    self._input.once("end", function () {
      if (exists) {
        // Was reading finished file: end of content
        self.push(null);
      } else {
        // Was reading pending file: resume ASAP
        setImmediate(function () {
          self._open(finished, pending, opt);
        });
      }
    });
  });
};

// Grab a readable stream's internal buffer size
function _bufferSize (readable) {
  return readable._readableState.buffer.reduce(function (sum, buffer) {
    return sum + buffer.length;
  }, 0);
}

PendingReadable.prototype.__read = function () {
  var self = this;
  var bufferSize = _bufferSize(self);
  var bufferMaxSize = self._readableState.highWaterMark;
  if (bufferSize >= bufferMaxSize) {
    debug("Buffer full: wait");
    setImmediate(function () {
      self.__read();
    });
  } else if (!self._input) {
    debug("Input not ready: wait");
    setImmediate(function () {
      self.__read();
    });
  } else {
    var chunk = self._input.read(bufferMaxSize - bufferSize);
    debug("Read chunk", chunk && chunk.length);
    if (chunk) {
      debug("Push chunk", chunk && chunk.length);
      self.push(chunk);
      self._pushed += chunk.length;
    } else {
      debug("No chunk");
    }
  }
};

PendingReadable.prototype._read = function() {
  debug("Called read", _bufferSize(this));
  this.__read();
};
