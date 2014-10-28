"use strict";

/* eslint-env node */
/* eslint no-underscore-dangle:0 */

var fs = require("fs");
var Writable = require("stream").Writable;
var util = require("util");
var debug = require("debug")("pending-streams:writable");


var PendingWritable = module.exports = function (filename, opt) {
  if (!(this instanceof PendingWritable)) {
    return new PendingWritable(filename, opt);
  }

  Writable.call(this, opt);

  var self = this;

  var suffix = (opt && opt.suffix) || ".part";

  debug("Open", filename + suffix, opt);
  self._stream = fs.createWriteStream(filename + suffix, opt);

  // Remove finished file, we don't want it to interfere
  fs.unlink(filename, function (err) {
    if (err && err.code !== "ENOENT") {
      debug(err);
      self.emit("error", err);
    }
  });

  self._stream.on("error", function (err) {
    debug(err);
    self.emit("error", err);
  });

  self._stream.on("finish", function () {
    debug("Rename: " + filename + suffix + " => " + filename);
    fs.rename(filename + suffix, filename, function (err) {
      if (err) {
        debug(err);
        self.emit("error", err);
      } else {
        debug("Finished.");
        self.emit("finish");
      }
    });
  });
};

util.inherits(PendingWritable, Writable);


PendingWritable.prototype._write = function (chunk, encoding, cb) {
  var self = this;

  if (!self._stream) {
    // Try again ASAP
    setImmediate(function () {
      self._write(chunk, encoding, cb);
    });
  } else {
    // Delegate to inner stream
    debug("Write chunk", chunk && chunk.length);
    self._stream.write(chunk, encoding, cb);
  }
};

PendingWritable.prototype.end = function (buffer) {
  this._stream.end(buffer);
};
