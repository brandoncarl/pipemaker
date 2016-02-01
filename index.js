
/*

  Motors

*/

"use strict";


/*

  //// Dependencies

*/

var fs        = require("fs"),
    path      = require("path"),
    assign    = require("lodash.assign"),
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

module.exports = Motors = function(config, options) {

  options = options || {};
  this.config = assign(core, config);

  this.engines = {};
  for (var ext in this.config)
    this.addEngine(ext, this.config[ext]);

  // Store directory if designated
  if (options.dir) this.dir = options.dir;

  return;

};



Motors.prototype.compile = function(type, str, options, next) {

  this.engines[type](str, options, next);

}



Motors.prototype.compileFile = function(filename, options, next) {

  var self = this,
      type = path.parse(filename).ext.replace(/^\./, "");

  fs.readFile(filename, "utf8", function(err, str) {
    if (err) return next(err);
    self.compile(type, str, options, next);
  });

}


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
      dir = this.dir;

  engines = chain.split(">").map(function(engine) {
    return preschool(engine, { dir : dir });
  });

  return function(str, options, next) {
    var tasks = engines.slice(0);
    runTask(tasks, str, options, next);
  }

}


Motors.prototype.addEngine = function(ext, chain) {

  this.engines[ext] = this.createEngine(chain);

}


Motors.prototype.removeEngine = function(ext) {

  delete this.engines[ext];

  // Add default engine back (so as not to delete core functionality)
  if (core[ext]) this.engines[ext] = this.createEngine(core[ext]);

}

