"use strict";

/* eslint-env node */
/* eslint no-process-exit:0 */

var Writable = require("../writable");

console.log("Writer: Generates data.sample, writes chunk every second, closes in 15 seconds…");
console.log("Run 'reader.js' while writing, or after, to experiment");

var stream = new Writable("./data.sample");

var interval = setInterval(function () {
  stream.write("DATA:" + Date.now() + "\n");
}, 1000);

setTimeout(function () {
  clearInterval(interval); // make sure we don't write after end
  stream.end("END\n");
  setImmediate(process.exit);
}, 15000);
