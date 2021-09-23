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
    assign       = require("lodash.assign"),
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

var COMPILER_RE = /(\s*)['"]?>>\s?([^\s'"]+)/;



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
  options = assign({ fetch : true }, options);
  this.mappings = assign(core, options.mappings);

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

  // Check if uses multiple compilers (requires line-by-line compilation)
  if ("*" === this.mappings[ext])
    this.compileWildcard(str, options, next);
  else
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

  // Stop-gap solution until more comprehensive strategy put into place
  options = options || {};
  if (!options.filename) options.filename = filename;

  fs.readFile(filename, "utf8", function(err, str) {
    if (err) return next(err);
    self.compile(ext, str, options, next);
  });

};


/**

  Compiles a wildcard string.

  @param {String} str The string to be compiled.
  @param {Object} [options={}] Options to be passed to rendering pipeline.
  @param {Function} next Callback of type fn(err, compiled).

**/

Pipemaker.prototype.compileWildcard = function(str, options, next) {

  var lines = str.split(/[\r\n]/);
  this.compileBlock(lines, 0, options, next);

};


/**

  Recursively compiles a wildcard block.

  @param {Array} lines The lines to be compiled
  @param {Number} lineNo The line number to start with
  @param {Object} [options={}] Options to be passed to rendering pipeline
  @param {Function} next Callback of type fn(err, compiled, numberOfLinesProcessed)

**/

Pipemaker.prototype.compileBlock = function(lines, lineNo, options, next) {

  var self  = this;
  var start = lineNo;
  var block = parseCompiler(lines[lineNo]);
  var base  = block.indent.length;
  var out   = "";

  // Add compiler if necessary
  if (!this.hasPipeline(block.ext)) this.addPipeline(block.ext);

  function complete(done) {
    // Note that we clone options (otherwise each compiler may chain additional options)
    self.compile(block.ext, block.lines.join("\n"), Object.assign({}, options), function(err, compiled) {
      if (err) return done(err);
      done(null, pad(compiled, base), lineNo - start);
    });
  }

  // We always start with a compiler
  (function nextLine() {

    // If no line remains, we've reached end of input
    var line = lines[++lineNo];
    if ("undefined" === typeof line) return complete(next);

    // If outdent occurs, then finish block
    var space = line.match(/^(\s*)/)[0].length;
    if (space < base) return complete(next);

    if (COMPILER_RE.test(line)) {

      // New indent block
      if (space > base)
        self.compileBlock(lines, lineNo, options, function(err, compiled, count) {
          lines[lineNo] = compiled;
          lines.splice(lineNo + 1, count - 1);
          block.lines.push(compiled);
          nextLine();
        });

      // Block complete
      else
        complete(function(err, compiled, count) {
          if (err) return next(err);
          out += compiled;
          nextLine();
        });

    } else {
      block.lines.push(line);
      nextLine();
    }

  })();

};


/**

  Helper function to parse a compiler

  @param {String} str The string to parse
  @returns {Object} A compiler object {indent, ext, lines}

**/

function parseCompiler(str) {

  var match = str.match(COMPILER_RE);

  return {
    indent: match[1],
    ext: match[2],
    lines: []
  };

}


/**

  Helper function to ensure that a string has padding of at least indent.

  @param {String} str The string to pad
  @param {Number} minIndent The minimum indentation
  @returns {String} Indented string
  
**/

function pad(str, minIndent) {

  var pad = str.match(/^(\s*)/)[0];
  var lines;

  if (pad.length < minIndent) {
    pad = new Array(1 + minIndent - pad.length).join(" ");
    lines = str.split(/[\n\r]/);
    lines.forEach(function(line, i) { lines[i] = pad + lines[i]; });
    str = lines.join("\n");
  }

  return str;

}


// Helper function for async iteration of pipelines
function runTask(tasks, str, options, next) {

  var task = tasks.shift();
  if (!task) return next(null, str);

  task.call(null, str, options, function(err, res) {
    if (err) return next(err);
    if ("function" === typeof(res))
      res = res.call(null, options);
    runTask(tasks, res, options, next);
  });

}


/**

  Returns a compilation function based on input chain.

  By default this will return a string. This is typically slow as it requires
  templates to be rendered.

  By inserting a @ into your pipeline, the intermediate results will be forced to
  text, and a function will be returned. One compiler may be optionally provided
  after the @, and will be used to render any results thereafter.

  @param {String} chain String containing names of pipelines to use.
  @returns {Function} Compilation function fn(str, options, next).

  @example
  // Compiles and renders a template with context
  pipemaker.createPipeline("pug");
  
  // Identical to the above
  pipemaker.createPipeline("pug>@");

  // Compiles the pug template and returns a function for reuse
  pipemaker.createPipeline("@>pug");

  // Renders the pug template and pipes the results into handlebars for rendering
  pipemaker.createPipeline("pug>@>handlebars");

*/

Pipemaker.prototype.createPipeline = function(chain) {

  var self = this;

  var pipelines = chain.split(">").reduce(function(agg, pipeline) {
    if (pipeline === "@") {
      agg.which = "post";
    } else
      agg[agg.which].push(compilers(pipeline, { dir : self.dir, fetch : self.fetch }));
    return agg;
  }, { pre: [], post: [], which: "pre" });

  if (pipelines.post.length > 1)
    throw new Error("Only one pipeline can be specified after forcing to text");
  
  return function(str, options, next) {
    runTask(pipelines.pre.slice(0), str, options, function(err, text) {
      if (err) return next(err);

      if (pipelines.post.length) {
        pipelines.post[0](text, {}, function(err, results) {
          if (err) return next(err);

          // Wrap non-compilers into a function
          if ("string" === typeof(results))
            next(null, function() { return results });
          else
            next(null, results);
        });
      } else {
        next(null, text);
      }
    });
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

  // Ignore wildcards (they are handled line-by-line)
  if ("*" === chain) {
    this.mappings[ext] = "*";
    return;
  }

  chain = chain || compilers.defaultCompilerForExtension(ext);

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
