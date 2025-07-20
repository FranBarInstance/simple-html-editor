# Simple HTML Editor

A lightweight, customizable **WYSIWYG JavaScript HTML content editor** for modern web applications that provides a robust and intuitive content editing experience.

Allows you to edit the content of previously created templates or designs, it does not have options to change the design.

Unlike other editors, it allows you to edit the entire document, body and head, also does not use deprecated execCommand().

![screencast](https://repository-images.githubusercontent.com/1023009164/802daf9a-8a30-48f9-8a97-f6a6c91638a1)

## Features

- Full document editing (body and head)
- Modern implementation (no deprecated execCommand)
- Comprehensive undo/redo system
- Image handling with preview and resizing
- Link management with target control
- Source code editing capability
- Restorable dynamic content
- Touch-enabled drag interface

## DEMO

Once the editing is finished, I save the changes I receive in an index.html file to replace the downloaded one.

- [DEMO template 1](https://franbarinstance.github.io/simple-html-editor/demo/grayscale)
- [DEMO template 2](https://franbarinstance.github.io/simple-html-editor/demo/ebook/)
- [DEMO template 3](https://franbarinstance.github.io/simple-html-editor/demo/digimedia/)

## Getting Started

### Installation

You can include the editor in your project using either the CDN or by downloading the files directly:

#### CDN Installation
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.css">
<script src="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.js"></script>
```

#### Local Installation
1. Download `simplehtmleditor.min.css` and `simplehtmleditor.min.js`
2. Include them in your project

### Basic Setup

The editor code must be wrapped in a div with the id `ncsedt-implement` and placed at the end of your page: "ncsedt-implement" and placed at the bottom of the page, immediately before "/body", including .js and .css.

This will start the editor with the default options:

```html
<!-- ncsedt-implement:before -->
<div id="ncsedt-implement">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.css">
    <script src="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', function () {
            var editor = new ncSimpleHtmlEditor();
            editor.start();
        });
    </script>
</div>
<!-- ncsedt-implement:end -->
```

With ncsedt-implement:before, dynamic changes are detected so that they can be removed before saving.

## Options

```javascript
var options = {

    /*
     * editable selector, default "body"
     */
    editable: "body",

    /*
     *  Non-linear undo/redo history possible
     */
    linearHistory: true,

    /*
     * Several mutations can belong to the same update in the history, they are grouped by time, in milliseconds.
     */
    groupingHistory: 200,

    /*
     * Number of toolbar columns, by default null, as set in css
     */
    toolbarCols: null,

    /*
     * Save button, disable on click in milliseconds
     */
    saveTimeout: 500,

    // Max image upload size in bytes.
    // There is a big performance loss in the editor when using large base64 images.
    maxImageUpload: 1200000,

    /*
     * Active buttons and toolbar order
     */
    toolbar: ['edit', 'undo', 'redo', 'up', 'down', 'cut', 'copy', 'paste', 'code', 'link', 'image', 'head', 'save'],
};

var editor = new ncSimpleHtmlEditor(options);
```

### Editable selector

The editor is designed to edit the whole page (body) but there is no problem to edit a specific selector:

```javascript
var editor = new ncSimpleHtmlEditor({
    editable: "#id",
});
```

For editable: ".class" only the first element found will be editable.

### Create a custom button

```javascript
var options = {
    buttons: {
        help: {

            /*
             * Same a key name: "help"
             */
            name: 'help',

            /*
             * Image for toolbar icon
             */
            icon: 'help.png',

            /*
             * Alt text
             */
            title: 'Help',

            /*
             * Set when the button is disabled, in this case never
             */
            disabled: function () { return false },

            /*
             * On click action
             */
            action: function () {
                var link = document.createElement('a');
                var ncsedt = document.querySelector('#ncsedt-implement');

                link.setAttribute('href', 'https://github.com/FranBarInstance/simple-html-editor');
                link.setAttribute('target', '_blank');
                ncsedt.appendChild(link);
                link.click();
            }
        }
    },

    /*
     * Add the button at the end of the toolbar
     */
    toolbar: ['edit', 'undo', 'redo', 'up', 'down', 'cut', 'copy', 'paste', 'code', 'link', 'image', 'head', 'save', 'help']
};

var editor = new ncSimpleHtmlEditor(options);
```

### disabled

Disabled is called whenever there are changes in the editor so that you can determine when to disable the button, an example is the disabledUno function of the undo button, which is disabled whenever editing is not active and enabled if the history is not empty:

```javascript
ncSimpleHtmlEditor.prototype.disabledUno = function () {
    if (this.editEnable) {
        if (this.historyUndo.length) {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
};
```

## Restorable

You can mark tag as "restorable" to restore dynamic changes, such as a "preloader".

There are two ways to do this, with the tag "ncsedt-restorable" or with the attribute "data-ncsedt-restorable".

To mark a code block as "restorable" we use the tag "ncsedt-restorable":

```html
<ncsedt-restorable>
    <div class="preload">
        ...
    </div>
</ncsedt-restorable>
```
To mark a tag as "restorable" we use the attribute data-ncsedt-restorable:

```html
<div class="preload" data-ncsedt-restorable="true">
```
To understand what "restorable" does, let's imagine a "preload" plugin that needs a DIV with a class at the beginning of BODY:

```html
<div class="preload"></div>
```
When the plugin is executed the code has changed dynamically and may look similar to this:

```html
<div class="preload done"></div>
```

Saving the template will also save the .done class and the preload will not be executed again.

It will not work with dynamic changes that are executed before loading the editor code.

## Removable

You can mark code block as "removable" to remove block on save.

The following code block will be removed when saving the template:

```html
<ncsedt-removable>
    <div>
        ...
    </div>
</ncsedt-removable>
```

## Events

The editor provides several events that you can listen to for extending functionality:

### Core Events
- `editorstart`: Fired after the editor initialization is complete
- `editorchanges`: Fired when changes affect the editor's state
- `contentchanges`: Fired when editable content is modified
- `focusedchange`: Fired when the focused element changes

### Dialog Events
- `showModal`: Fired when any dialog is displayed
- `click`: Fired for various button interactions
- `change`: Fired when file inputs or form fields are modified

### Usage Example
```javascript
editor.addEventListener('contentchanges', function(e) {
    console.log('Content was modified');
});
```

## Functions

- __isEditEnable()__: Determine if editing is active, true/false.
- __getFocused()__: Get the current element that has the focus.
- __getFocusedPrev()__: Get the previous element that had the focus
- __getEditable()__: Get editable element.
- __getClipboard()__: Get clipboard content, can be null.
- __getDocumentHTML(selector = null)__: Get the HTML with the current changes, If no selector is indicated, the complete document.

## Overwrite save function

```javascript
var editor = new ncSimpleHtmlEditor({
    buttons: {
        save: {
            action: function () {

                /*
                 * Disable editing mode to remove elements that
                 * should only be in edit mode.
                 */
                editor.editOff();

                /*
                 * Get HTML to save
                 */
                var html = editor.getDocumentHTML();

                // Your code to save the html here.

                /*
                 * Restore editing mode.
                 */
                editor.editOn();
            }
        }
    }
});
```
## Limitations

The editor works on more than 90% of modern templates without the need to modify the template.

There are issues with dynamically generated content, such as animations, preloading, etc. Some plugins modify tag attributes dynamically so that the modified attributes are saved when the template is saved.

## License

MIT License
