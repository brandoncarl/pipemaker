/**

  motors
  Copyright 2016 Brandon Carl
  MIT Licensed

  Class
  • compile
  • compileFile
  • addEngine
  • createEngine
  • hasEngine
  • removeEngine

**/

"use strict";


//
//  Dependencies
//

var fs           = require("fs"),
    path         = require("path"),
    preschool    = require("preschool"),
    Motors;




//
//  Core mappings
//

var core = {
  "js"   : "javascript",
  "html" : "html",
  "css"  : "css"
};



/**

  Constructor for Motors class. Automatically installs packages by default.

  @param {Object} mappings Keys correspond to extensions, values to engine names.
  @param {Object} options Install directory `dir`, and whether to `fetch` if missing.
  @returns {Motors} Instance of class.

  @example
  var motors = new Motors({ dir : process.cwd() });

**/

module.exports = Motors = function(options) {

  // Set up defaults
  options = Object.assign({ fetch : true }, options);
  this.mappings = Object.assign(core, options.mappings);

  // Initialize engines
  this.engines = {};
  for (var ext in this.mappings)
    this.addEngine(ext, this.mappings[ext]);

  // Store directory if designated
  if (options.dir) this.dir = options.dir;

  // Store fetch
  this.fetch = !!options.fetch;

};



/**

  compiles a string using engine associated with ext

  @param {String} ext The extension associated with string (e.g. "coffee").
  @param {String} str The string to be compiled.
  @param {Object} [options={}] Options to be passed to rendering engine.
  @param {Function} next Callback of type fn(err, compiled).

  @example
  motors.compile("coffee", "console.log 'Hello'", function(err, compiled) {
    console.log(compiled);
    // => console.log('Hello');
  });

**/

Motors.prototype.compile = function(ext, str, options, next) {

  this.engines[this.mappings[ext]](str, options, next);

};



/**

  compiles a file using engine associated with file's extension

  @param {String} filename Name of file.
  @param {Object} [options={}] Options to be passed to rendering engine.
  @param {Function} next Callback of type fn(err, compiled).

  @example
  motors.compileFile("app.coffee", function(err, compiled) {
    // Compiled version of app.coffee
  });

**/

Motors.prototype.compileFile = function(filename, options, next) {

  var self = this,
      ext = path.parse(filename).ext.replace(/^\./, "");

  fs.readFile(filename, "utf8", function(err, str) {
    if (err) return next(err);
    self.compile(ext, str, options, next);
  });

};


// Helper function for async iteration of engines
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

  @param {String} chain String containing names of engines to use.
  @returns {Function} Compilation function fn(str, options, next)

  @example
  motors.createEngine("jade");
  motors.createEngine("jade>handlebars");
  motors.createEngine("js>uglify-js");

*/

Motors.prototype.createEngine = function(chain) {

  var engines,
      self = this;

  engines = chain.split(">").map(function(engine) {
    return preschool(engine, { dir : self.dir, fetch : self.fetch });
  });

  return function(str, options, next) {
    var tasks = engines.slice(0);
    runTask(tasks, str, options, next);
  };

};



/**

  Gets an engine based on chain, creating engine if necessary.

  @param {String} chain Chain of engines.

  @example
  motors.getEngine("jade>handlebars");

**/

Motors.prototype.getEngine = function(chain) {

  if (!this.engines[chain])
    this.engines[chain] = this.createEngine(chain);

  return this.engines[chain];

};



/**

  Adds an engine for an extension, creating engine if necessary.

  @param {String} ext File extension to be associated with engine.
  @param {String} [chain] Optional chain for creating engine.

**/

Motors.prototype.addEngine = function(ext, chain) {

  chain = chain || preschool.defaultEngineForExtension(ext);

  // Store in both mappings and engine
  this.mappings[ext] = chain;
  this.engines[chain] = this.getEngine(chain);

  return this.engines[chain];

};



/**

  Removes an engine by extension.

  @param {String} ext File extension to for removal.

**/

Motors.prototype.removeEngine = function(ext) {

  // Delete both from mappings and engine
  delete this.engines[this.mappings[ext]];
  delete this.mappings[ext];

  // Add default engine back (so as not to delete core functionality)
  if (core[ext]) this.addEngine(ext, core[ext]);

};



/**

  Determines if an engine currently exists for an extension.

  @param {String} ext File extension to check.
  @returns {Boolean} Whether engine exists.

**/

Motors.prototype.hasEngine = function(ext) {

  return !!this.engines[ext];

};
