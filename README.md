Pending streams
===============

Provides writable and readable streams for pending files.

* `Writable` will write to a temporary file and generate the final file only in the very end
* `Readable` will be able to grab data written by `Writable` on the go, reading what has already been written previously, waiting for new data, finishing as soon as writing is over

Install
-------

```sh
npm install pending-streams --save
```

Usage
-----

```javascript
var pending = require("pending-streams");

var writable = new pending.Writable(filename, options);

var readable = new pending.Readable(filename, options);
```

### Sample

Look at the `sample` folder for a fully working example:

```sh
cd sample
node reader.js # will wait for writer to start working

# from another terminal
node writer.js # will start writing, ends after 15 seconds
# first "reader.js" should show chunks on the go

# from another terminal, before 15 seconds
node reader.js # look how it showed the previously written data…
# and then waits for next chunks

# from another terminal, after 15 seconds
node reader.js # works just like cat then
```

API
---

### `Readable(filename, [options])`

* `filename` (string, mandatory) is the path to final file
* `options` (object, optional):
  * `wait` (boolean, defaults = `false`) if true the stream will not fail if no file is found, it will just wait for a writer to start working
  * `suffix` (string, default = `".part"`) is the suffix added to `filename` to generate temporary file
  * `highWaterMark` is supposedly correctly implemented
  * other options are passed as-is to `stream.Readable`, you should be careful (I suppose `objectMode` for example may break everything)

### `Writable(filename, [options])`

* `filename` (string, mandatory) is the path to final file
* `options` (object, optional):
  * `suffix` (string, default = `".part"`) is the suffix added to `filename` to generate temporary file
  * other options are passed as-is to `stream.Writable`, you should be careful

How it works
------------

It's quite simple and naive:

* `Writable` works with a temporary file until it's finished, then renames it
* `Readable` reads from the final file if found (then there is nothing else to do, no pending chunks), else it reads from the temporary file, and as soon as it has finished reading the temporary file it restarts from the number of bytes already consumed

When should you use it?
-----------------------

This module was written to implement a direct upload/download tool without keeping streams in memory.

Writing from a process, reading from another, you may not want to wait for the first process to end, and may not want to implement some specific communication between the processes. Pending streams could do the job.

TODO
----

* Optimizations (I guess there can be a lot, like using fs.read instead of fs streams in `PendingReadable`)
* Tests (don't cry, at least there is a sample folder)
* Work with other things than filesystem
* Readable: detect when file is deleted or restarted

Contributions are very welcome: create an issue, or even better a pull request.
