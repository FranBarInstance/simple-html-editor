# Simple HTML Editor with AI Agent

A lightweight, customizable **WYSIWYG JavaScript HTML content editor** with **AI Agent** capabilities for modern web applications. Provides a robust and intuitive content editing experience with AI-powered assistance.

Allows you to edit the content of previously created templates or designs while maintaining the original design. Unlike other editors, it allows editing the entire document including both body and head sections, without using deprecated execCommand().

[![screencast](https://repository-images.githubusercontent.com/1023009164/802daf9a-8a30-48f9-8a97-f6a6c91638a1)](https://franbarinstance.github.io/simple-landing-editor/landing/)

## Key Features

- Integrated AI Agent for intelligent content editing
- Full document editing (body and head sections)
- Modern implementation (no deprecated execCommand)
- Comprehensive undo/redo system
- Advanced image handling with preview and resizing
- Link management with target control
- Source code editing capability
- AI-assisted code editing and generation
- Restorable dynamic content
- Touch-enabled drag interface

## DEMO

[![screencast](https://user-images.githubusercontent.com/114579121/193446865-ef500949-f3f9-4374-9c27-32d2fb7d43f5.gif)](https://franbarinstance.github.io/simple-html-editor/demo/grayscale/)

Once the editing is finished, I save the changes I receive in an index.html file to replace the downloaded one.

- [DEMO template 1](https://franbarinstance.github.io/simple-html-editor/demo/agency/)
- [DEMO template 2](https://franbarinstance.github.io/simple-html-editor/demo/grayscale/)
- [DEMO template 3](https://franbarinstance.github.io/simple-html-editor/demo/ebook/)
- [DEMO template 4](https://franbarinstance.github.io/simple-html-editor/demo/digimedia/)
- [DEMO template collection](https://franbarinstance.github.io/simple-landing-editor/landing/)

To try out the AI, you can create an account at https://openrouter.ai and use a free model, or install Ollama. In order for Ollama to work in local mode, you will need to configure CORS. Here's how: https://duckduckgo.com/?q=Ollama+CORS

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

The editor code must be wrapped in a div with the id `ncsedt-implement` and placed at the end of your page immediately before the closing `</body>` tag. This includes both the .js and .css files.

Basic setup with default options:

```html
<!-- ncsedt-implement:before -->
<div id="ncsedt-implement">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.css">
    <script src="https://cdn.jsdelivr.net/gh/FranBarInstance/simple-html-editor@master/simplehtmleditor.min.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', function () {
            var editor = new ncSimpleHtmlEditor({
                // AI configuration
                aiBackends: {
                    ollama: {
                        enabled: true,
                        url: 'http://localhost:11434/api/generate',
                        model: 'qwen2.5-coder:7b'
                    }
                    // Configure other AI backends as needed
                }
            });
            editor.start();
        });
    </script>
</div>
<!-- ncsedt-implement:end -->
```

The `ncsedt-implement:before` comment helps detect dynamic changes that should be removed before saving.

## Options

**IMPORTANT**: Do not enter the API key in the settings, as this poses a security risk. There is an option to configure the model in the editor.

```javascript
var options = {
    // Selector for editable content, default "body"
    editableContentSelector: "body",

    // Enable linear undo/redo history (non-linear history possible when false)
    usesLinearUndoHistory: true,

    // Time window in milliseconds for grouping multiple changes into a single history entry
    mutationGroupingWindowMs: 200,

    // Number of toolbar columns, by default null, as set in css
    toolbarCols: null,

    // Save button, disable on click in milliseconds
    saveTimeout: 500,

    // Maximum image size in bytes (large base64 images degrade DOM performance)
    maxImageSizeBytes: 1200000,

    // AI Backend configurations
    aiBackends: {
        ollama: {
            enabled: true,
            url: 'http://localhost:11434/api/generate',
            model: 'qwen2.5-coder:7b'
        },
        openrouter: {
            enabled: false,
            url: 'https://openrouter.ai/api/v1/chat/completions',
            model: 'qwen/qwen-2.5-coder-32b-instruct:free'
        },
        anthropic: {
            enabled: false,
            url: 'https://api.anthropic.com/v1/messages',
            model: 'claude-3-opus-20240229'
        },
        azure: {
            enabled: false,
            url: '',
            model: ''
        },
        gemini: {
            enabled: false,
            url: 'https://generativelanguage.googleapis.com/v1beta/models/',
            model: 'gemini-pro'
        },
        openai: {
            enabled: false,
            url: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4-turbo'
        }
    },

    // Additional prompts for AI
    additionalPrompts: {
        "only replacement": 'Instructions:\n Provide only what is requested, including all code or text that does not change, without additional comments, without Markdown.'
    },

    // Active buttons and toolbar order
    toolbar: ['edit', 'undo', 'redo', 'up', 'down', 'previous', 'next', 'cut', 'copy', 'paste', 'head', 'code', 'agent', 'link', 'image', 'save', 'github'],
};

var editor = new ncSimpleHtmlEditor(options);
```

### Editable selector

The editor is designed to edit the whole page (body) but there is no problem to edit a specific selector:

```javascript
var editor = new ncSimpleHtmlEditor({
    editableContentSelector: "#id",
});
```

For editableContentSelector: ".class" only the first element found will be editable.

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

Disabled is called whenever there are changes in the editor so that you can determine when to disable the button, an example is the isUndoButtonDisabled function of the undo button, which is disabled whenever editing is not active and enabled if the history is not empty:

```javascript
ncSimpleHtmlEditor.prototype.isUndoButtonDisabled = function () {
    return !this.isEditingEnabled() || !this.hasUndoHistory();
};

ncSimpleHtmlEditor.prototype.hasUndoHistory = function () {
    return this.historyUndo.length > 0;
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

- __isEditingEnabled()__: Determine if editing is active, true/false.
- __getCurrentFocusedElement()__: Get the current element that has the focus.
- __getPreviousFocusedElement()__: Get the previous element that had the focus
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
