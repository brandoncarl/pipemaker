# Pipemaker

Powerful chaining of pre- and post-processors, with dynamic dependency downloading.


## Installation
```
$ npm install pipemaker
```

## Examples

```js
var pipemaker = new Pipemaker();

// Simple pipelines (extension, name)
pipemaker.addPipeline("jade");
pipemaker.addPipeline("coffee");
pipemaker.addPipeline("js", "dust");

// Chained pipelines (extension, chain)
pipemaker.addPipeline("css", "css>clean-css");
pipemaker.addPipeline("js", "javascript>uglify-js");
pipemaker.addPipeline("jbs", "jade>handlebars");

function next(err, compiled) { console.log(compiled); }

// Compile
pipemaker.compile("coffee", "console.log 'Hello'", next);
pipemaker.compile("handlebars", "Hello {{ name }}", { name : "Donald" }, next);
pipemaker.compileFile("./path-to/file.coffee", next);
```


## API

[Pipemaker](#Pipemaker) ⇒ <code>[Pipemaker](#Pipemaker)</code>  
[.addPipeline(ext, [chain])](#Pipemaker+addPipeline) ⇒ <code>function</code>  
[.compile(ext, str, [options], next)](#Pipemaker+compile)  
[.compileFile(filename, [options], next)](#Pipemaker+compileFile)  
[.createPipeline(chain)](#Pipemaker+createPipeline) ⇒ <code>function</code>  
[.getPipeline(chain)](#Pipemaker+getPipeline) ⇒ <code>function</code>  
[.hasPipeline(ext)](#Pipemaker+hasPipeline) ⇒ <code>Boolean</code>  
[.removePipeline(ext)](#Pipemaker+removePipeline)  

<a name="Pipemaker"></a>
### Pipemaker ⇒ <code>[Pipemaker](#Pipemaker)</code>
Constructor for Pipemaker class. Automatically installs packages by default.

**Returns**: <code>[Pipemaker](#Pipemaker)</code> - Instance of class.  

| Param | Type | Description |
| --- | --- | --- |
| mappings | <code>Object</code> | Keys correspond to extensions, values to pipeline names. |
| options | <code>Object</code> | Install directory `dir`, and whether to `fetch` if missing. |

**Example**  
```js
var pipemaker = new Pipemaker({ dir : process.cwd() });
```

<a name="Pipemaker+compile"></a>
### pipemaker.compile(ext, str, [options], next)
compiles a string using pipeline associated with ext

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ext | <code>String</code> |  | The extension associated with string (e.g. "coffee"). |
| str | <code>String</code> |  | The string to be compiled. |
| [options] | <code>Object</code> | <code>{}</code> | Options to be passed to rendering pipeline. |
| next | <code>function</code> |  | Callback of type fn(err, compiled). |

**Example**  
```js
pipemaker.compile("coffee", "console.log 'Hello'", function(err, compiled) {
    console.log(compiled);
    // => console.log('Hello');
  });
```
<a name="Pipemaker+compileFile"></a>
### pipemaker.compileFile(filename, [options], next)
compiles a file using pipeline associated with file's extension

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filename | <code>String</code> |  | Name of file. |
| [options] | <code>Object</code> | <code>{}</code> | Options to be passed to rendering pipeline. |
| next | <code>function</code> |  | Callback of type fn(err, compiled). |

**Example**  
```js
pipemaker.compileFile("app.coffee", function(err, compiled) {
    // Compiled version of app.coffee
  });
```
<a name="Pipemaker+createPipeline"></a>
### pipemaker.createPipeline(chain) ⇒ <code>function</code>
Returns a compilation function based on input chain.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| chain | <code>String</code> | String containing names of pipelines to use. |

**Example**  
```js
pipemaker.createPipeline("jade");
  pipemaker.createPipeline("jade>handlebars");
  pipemaker.createPipeline("js>uglify-js");
```
<a name="Pipemaker+getPipeline"></a>
### pipemaker.getPipeline(chain) ⇒ <code>function</code>
Gets an pipeline based on chain, creating pipeline if necessary.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| chain | <code>String</code> | Chain of pipelines. |

**Example**  
```js
pipemaker.getPipeline("jade>handlebars");
```
<a name="Pipemaker+addPipeline"></a>
### pipemaker.addPipeline(ext, [chain]) ⇒ <code>function</code>
Adds an pipeline for an extension, creating pipeline if necessary.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to be associated with pipeline. |
| [chain] | <code>String</code> | Optional chain for creating pipeline. |

<a name="Pipemaker+removePipeline"></a>
### pipemaker.removePipeline(ext)
Removes an pipeline by extension.

**Kind**: instance method of <code>[Pipemaker](#Pipemaker)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to for removal. |

<a name="Pipemaker+hasPipeline"></a>
### pipemaker.hasPipeline(ext) ⇒ <code>Boolean</code>
Determines if an pipeline currently exists for an extension.

**Returns**: <code>Boolean</code> - Whether pipeline exists.  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to check. |

## License
MIT
