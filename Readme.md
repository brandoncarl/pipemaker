# Motors

Powerful chaining of pre- and post-processors, with dynamic dependency downloading.


## Installation
```
npm install motors
```

## Examples

```js
var motors = new Motors();

// Simple engines (extension, name)
motors.addEngine("jade");
motors.addEngine("coffee");
motors.addEngine("js", "dust");

// Chained engines (extension, chain)
motors.addEngine("css", "css>clean-css");
motors.addEngine("js", "javascript>uglify-js");
motors.addEngine("jbs", "jade>handlebars");

function next(err, compiled) { console.log(compiled); }

// Compile
motors.compile("coffee", "console.log 'Hello'", next);
motors.compile("handlebars", "Hello {{ name }}", { name : "Donald" }, next);
motors.compileFile("./path-to/file.coffee", next);
```


## API

[Motors](#Motors) ⇒ <code>[Motors](#Motors)</code>  
[.addEngine(ext, [chain])](#Motors+addEngine) ⇒ <code>function</code>  
[.compile(ext, str, [options], next)](#Motors+compile)  
[.compileFile(filename, [options], next)](#Motors+compileFile)  
[.createEngine(chain)](#Motors+createEngine) ⇒ <code>function</code>  
[.getEngine(chain)](#Motors+getEngine) ⇒ <code>function</code>  
[.hasEngine(ext)](#Motors+hasEngine) ⇒ <code>Boolean</code>  
[.removeEngine(ext)](#Motors+removeEngine)  

<a name="Motors"></a>
### Motors ⇒ <code>[Motors](#Motors)</code>
Constructor for Motors class. Automatically installs packages by default.

**Returns**: <code>[Motors](#Motors)</code> - Instance of class.  

| Param | Type | Description |
| --- | --- | --- |
| mappings | <code>Object</code> | Keys correspond to extensions, values to engine names. |
| options | <code>Object</code> | Install directory `dir`, and whether to `fetch` if missing. |

**Example**  
```js
var motors = new Motors({ dir : process.cwd() });
```

<a name="Motors+compile"></a>
### motors.compile(ext, str, [options], next)
compiles a string using engine associated with ext

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ext | <code>String</code> |  | The extension associated with string (e.g. "coffee"). |
| str | <code>String</code> |  | The string to be compiled. |
| [options] | <code>Object</code> | <code>{}</code> | Options to be passed to rendering engine. |
| next | <code>function</code> |  | Callback of type fn(err, compiled). |

**Example**  
```js
motors.compile("coffee", "console.log 'Hello'", function(err, compiled) {
    console.log(compiled);
    // => console.log('Hello');
  });
```
<a name="Motors+compileFile"></a>
### motors.compileFile(filename, [options], next)
compiles a file using engine associated with file's extension

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filename | <code>String</code> |  | Name of file. |
| [options] | <code>Object</code> | <code>{}</code> | Options to be passed to rendering engine. |
| next | <code>function</code> |  | Callback of type fn(err, compiled). |

**Example**  
```js
motors.compileFile("app.coffee", function(err, compiled) {
    // Compiled version of app.coffee
  });
```
<a name="Motors+createEngine"></a>
### motors.createEngine(chain) ⇒ <code>function</code>
Returns a compilation function based on input chain.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| chain | <code>String</code> | String containing names of engines to use. |

**Example**  
```js
motors.createEngine("jade");
  motors.createEngine("jade>handlebars");
  motors.createEngine("js>uglify-js");
```
<a name="Motors+getEngine"></a>
### motors.getEngine(chain) ⇒ <code>function</code>
Gets an engine based on chain, creating engine if necessary.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| chain | <code>String</code> | Chain of engines. |

**Example**  
```js
motors.getEngine("jade>handlebars");
```
<a name="Motors+addEngine"></a>
### motors.addEngine(ext, [chain]) ⇒ <code>function</code>
Adds an engine for an extension, creating engine if necessary.

**Returns**: <code>function</code> - Compilation function fn(str, options, next).  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to be associated with engine. |
| [chain] | <code>String</code> | Optional chain for creating engine. |

<a name="Motors+removeEngine"></a>
### motors.removeEngine(ext)
Removes an engine by extension.

**Kind**: instance method of <code>[Motors](#Motors)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to for removal. |

<a name="Motors+hasEngine"></a>
### motors.hasEngine(ext) ⇒ <code>Boolean</code>
Determines if an engine currently exists for an extension.

**Returns**: <code>Boolean</code> - Whether engine exists.  

| Param | Type | Description |
| --- | --- | --- |
| ext | <code>String</code> | File extension to check. |

## License
MIT
