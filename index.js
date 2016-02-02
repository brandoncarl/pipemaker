
/*

  Motors

*/

"use strict";


/*

  //// Dependencies

*/

var fs        = require("fs"),
    path      = require("path"),
    preschool = require("preschool"),
    core,
    Motors;



/*

  //// Defaults

*/

core = {
  "js"   : "javascript",
  "html" : "html",
  "css"  : "css"
};



/*

  //// Class definition

*/


module.exports = Motors = function(options) {

  options = Object.assign({ fetch : true }, options);
  this.mappings = Object.assign(core, options.mappings);

  this.engines = {};
  for (var ext in this.mappings)
    this.addEngine(ext, this.mappings[ext]);

  // Store directory if designated
  if (options.dir) this.dir = options.dir;

  // Store fetch
  this.fetch = !!options.fetch;

};



Motors.prototype.compile = function(type, str, options, next) {

  this.engines[type](str, options, next);

};



Motors.prototype.compileFile = function(filename, options, next) {

  var self = this,
      ext = path.parse(filename).ext.replace(/^\./, "");

  fs.readFile(filename, "utf8", function(err, str) {
    if (err) return next(err);
    self.compile(ext, str, options, next);
  });

};


/*

   Helper function for async iteration of engines

*/

function runTask(tasks, str, options, next) {

  var task = tasks.shift();
  if (!task) return next(null, str);

  task.call(null, str, options, function(err, res) {
    if (err) return next(err);
    runTask(tasks, res, options, next);
  });

}


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


Motors.prototype.addEngine = function(ext, chain) {

  chain = chain || preschool.defaultEngineForExtension(ext);

  // Store in both mappings and engine
  this.mappings[ext] = chain;
  this.engines[chain] = this.getEngine(chain);

  return this.engines[chain];

};


Motors.prototype.removeEngine = function(ext) {

  // Delete both from mappings and engine
  delete this.engines[this.mappings[ext]];
  delete this.mappings[ext];

  // Add default engine back (so as not to delete core functionality)
  if (core[ext]) this.addEngine(ext, core[ext]);

};


Motors.prototype.hasEngine = function(ext) {

  return !!this.engines[ext];

};
