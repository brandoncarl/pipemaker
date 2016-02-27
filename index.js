/**

  pipemaker
  Copyright 2016 Brandon Carl
  MIT Licensed

  Instance
  • compile
  • compileFile
  • addPipeline
  • createPipeline
  • getPipeline
  • hasPipeline
  • removePipeline

**/

"use strict";


//
//  Dependencies
//

var fs           = require("fs"),
    path         = require("path"),
    compilers    = require("compilers"),
    Pipemaker;




//
//  Core mappings
//

var core = {
  "js"   : "javascript",
  "html" : "html",
  "css"  : "css"
};



/**

  Constructor for Pipemaker class. Automatically installs packages by default.

  @param {Object} mappings Keys correspond to extensions, values to pipeline names.
  @param {Object} options Install directory `dir`, and whether to `fetch` if missing.
  @returns {Pipemaker} Instance of class.

  @example
  var pipemaker = new Pipemaker({ dir : process.cwd() });

**/

Pipemaker = module.exports = function(options) {

  // Set up defaults
  options = Object.assign({ fetch : true }, options);
  this.mappings = Object.assign(core, options.mappings);

  // Initialize pipelines
  this.pipelines = {};
  for (var ext in this.mappings)
    this.addPipeline(ext, this.mappings[ext]);

  // Store directory if designated
  if (options.dir) this.dir = options.dir;

  // Store fetch
  this.fetch = !!options.fetch;

};



/**

  compiles a string using pipeline associated with ext

  @param {String} ext The extension associated with string (e.g. "coffee").
  @param {String} str The string to be compiled.
  @param {Object} [options={}] Options to be passed to rendering pipeline.
  @param {Function} next Callback of type fn(err, compiled).

  @example
  pipemaker.compile("coffee", "console.log 'Hello'", function(err, compiled) {
    console.log(compiled);
    // => console.log('Hello');
  });

**/

Pipemaker.prototype.compile = function(ext, str, options, next) {

  this.pipelines[this.mappings[ext]](str, options, next);

};



/**

  compiles a file using pipeline associated with file's extension

  @param {String} filename Name of file.
  @param {Object} [options={}] Options to be passed to rendering pipeline.
  @param {Function} next Callback of type fn(err, compiled).

  @example
  pipemaker.compileFile("app.coffee", function(err, compiled) {
    // Compiled version of app.coffee
  });

**/

Pipemaker.prototype.compileFile = function(filename, options, next) {

  var self = this,
      ext = path.parse(filename).ext.replace(/^\./, "");

  fs.readFile(filename, "utf8", function(err, str) {
    if (err) return next(err);
    self.compile(ext, str, options, next);
  });

};


// Helper function for async iteration of pipelines
function runTask(tasks, str, options, next) {

  var task = tasks.shift();
  if (!task) return next(null, str);

  task.call(null, str, options, function(err, res) {
    if (err) return next(err);
    runTask(tasks, res, options, next);
  });

}


/**

  Returns a compilation function based on input chain.

  @param {String} chain String containing names of pipelines to use.
  @returns {Function} Compilation function fn(str, options, next).

  @example
  pipemaker.createPipeline("jade");
  pipemaker.createPipeline("jade>handlebars");
  pipemaker.createPipeline("js>uglify-js");

*/

Pipemaker.prototype.createPipeline = function(chain) {

  var pipelines,
      self = this;

  pipelines = chain.split(">").map(function(pipeline) {
    return compilers(pipeline, { dir : self.dir, fetch : self.fetch });
  });

  return function(str, options, next) {
    var tasks = pipelines.slice(0);
    runTask(tasks, str, options, next);
  };

};



/**

  Gets an pipeline based on chain, creating pipeline if necessary.

  @param {String} chain Chain of pipelines.
  @returns {Function} Compilation function fn(str, options, next).

  @example
  pipemaker.getPipeline("jade>handlebars");

**/

Pipemaker.prototype.getPipeline = function(chain) {

  if (!this.pipelines[chain])
    this.pipelines[chain] = this.createPipeline(chain);

  return this.pipelines[chain];

};



/**

  Adds an pipeline for an extension, creating pipeline if necessary.

  @param {String} ext File extension to be associated with pipeline.
  @param {String} [chain] Optional chain for creating pipeline.
  @returns {Function} Compilation function fn(str, options, next).

**/

Pipemaker.prototype.addPipeline = function(ext, chain) {

  chain = chain || compilers.defaultEngineForExtension(ext);

  // Store in both mappings and pipeline
  this.mappings[ext] = chain;
  this.pipelines[chain] = this.getPipeline(chain);

  return this.pipelines[chain];

};



/**

  Removes an pipeline by extension.

  @param {String} ext File extension to for removal.

**/

Pipemaker.prototype.removePipeline = function(ext) {

  // Delete both from mappings and pipeline
  delete this.pipelines[this.mappings[ext]];
  delete this.mappings[ext];

  // Add default pipeline back (so as not to delete core functionality)
  if (core[ext]) this.addPipeline(ext, core[ext]);

};



/**

  Determines if an pipeline currently exists for an extension.

  @param {String} ext File extension to check.
  @returns {Boolean} Whether pipeline exists.

**/

Pipemaker.prototype.hasPipeline = function(ext) {

  return !!this.mappings[ext];

};
