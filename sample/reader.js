"use strict";

/* eslint-env node */
/* eslint no-process-exit:0 */

var Readable = require("../readable");

console.log("Reader: Opens data.sample, pipes to stdout");

var stream = new Readable("./data.sample", {"wait": true});

stream.pipe(process.stdout);

stream.on("error", function (err) {
  if (err.code === "ENOENT") {
    console.log("File not found: you should call 'writer.js'");
    process.exit(1);
  }

  throw err;
});
