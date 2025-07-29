/*!
 * Simple HTML Editor v1.0.1
 * A lightweight, customizable WYSIWYG HTML editor for modern web applications
 *
 * @author FranBarInstance
 * @license MIT
 * @version 1.0.1
 * @link https://github.com/FranBarInstance/simple-html-editor
 * @copyright (c) 2022-2025
 */

(function () {

    // Manages the state of elements that need to be restored during undo/redo operations
    window.ncsedtRestorable = function () {
        var _this = this;

        this.elementsWithTag = document.querySelectorAll('ncsedt-restorable');
        this.elementsWithAttribute = document.querySelectorAll('[data-ncsedt-restorable="true"]');

        this.savedHTML = [];
        this.savedAttributes = [];
        this.undoHistoryHTML = [];
        this.undoHistoryAttributes = [];

        this.htmlElementCount = 0;
        this.attributeElementCount = 0;

        this.elementsWithTag.forEach(function (node) {
            _this.savedHTML[_this.htmlElementCount++] = node.innerHTML;
        });

        this.elementsWithAttribute.forEach(function (node) {
            _this.savedAttributes[_this.attributeElementCount++] = node.cloneNode().attributes;
        });
    }

    /**
     * Restores the saved state of all restorable elements
     *
     * @method restore
     * @description This method restores both the HTML content and attributes
     *              of all elements marked as restorable to their previously
     *              saved state. Before restoring, it saves the current state
     *              to enable undo functionality.
     *
     * @fires editorchanges - When restoration is complete
     * @returns {void}
     */
    ncsedtRestorable.prototype.restore = function () {
        var _this = this;
        var count = 0;

        /**
         * Step 1: Save current state for undo functionality
         * Stores the current HTML content of all <ncsedt-restorable> elements
         * before making any changes, enabling the undo operation
         */
        count = 0;
        this.elementsWithTag.forEach(function (node) {
            _this.undoHistoryHTML[count++] = node.innerHTML;
        });

        /**
         * Step 2: Save current attributes for undo functionality
         * Stores the current attributes of all data-ncsedt-restorable elements
         * before making any changes, enabling the undo operation
         */
        count = 0;
        this.elementsWithAttribute.forEach(function (node) {
            _this.undoHistoryAttributes[count++] = node.cloneNode().attributes;
        });

        /**
         * Step 3: Restore saved HTML content
         * Restores the previously saved HTML content to all <ncsedt-restorable>
         * elements, effectively reverting them to their initial state
         */
        for (let i = 0; i < this.elementsWithTag.length; i++) {
            this.elementsWithTag[i].innerHTML = this.savedHTML[i];
        }

        /**
         * Step 4: Clean current attributes
         * Removes all existing attributes from data-ncsedt-restorable elements
         * to prepare them for restoration of their saved state
         */
        for (let i = 0; i < this.elementsWithAttribute.length; i++) {
            Array.prototype.slice.call(this.elementsWithAttribute[i].attributes).forEach(
                function (cur) {
                    _this.elementsWithAttribute[i].removeAttribute(cur.name);
                }
            )
        }

        /**
         * Step 5: Restore saved attributes
         * Applies the previously saved attributes back to the data-ncsedt-restorable
         * elements, completing the restoration process
         *
         * @fires editorchanges - When restoration is complete
         */
        for (let i = 0; i < this.elementsWithAttribute.length; i++) {
            Array.prototype.slice.call(this.savedAttributes[i]).forEach(
                function (cur) {
                    _this.elementsWithAttribute[i].setAttribute(cur.name, cur.value);
                }
            )
        }

        // Trigger change event to notify that restoration is complete
        document.dispatchEvent(new Event("editorchanges"));
    };

    /**
     * Reverts the last restoration operation
     *
     * @method undoRestore
     * @description Reverts the changes made by the last restore() operation.
     *              This method uses the saved undo state to return elements
     *              to their state before the last restoration.
     *
     * @fires editorchanges - When undo operation is complete
     * @returns {void}
     */
    ncsedtRestorable.prototype.undoRestore = function () {
        var _this = this;

        /**
         * Step 1: Restore HTML content from undo history
         * Reverts the HTML content of all <ncsedt-restorable> elements
         * to their state before the last restore operation
         */
        for (let i = 0; i < this.elementsWithTag.length; i++) {
            this.elementsWithTag[i].innerHTML = this.undoHistoryHTML[i];
        }

        /**
         * Step 2: Restore attributes from undo history
         * Reverts the attributes of all data-ncsedt-restorable elements
         * to their state before the last restore operation
         */
        for (let i = 0; i < this.elementsWithAttribute.length; i++) {
            Array.prototype.slice.call(this.undoHistoryAttributes[i]).forEach(
                function (cur) {
                    _this.elementsWithAttribute[i].setAttribute(cur.name, cur.value);
                }
            )
        }

        // Trigger change event to notify that undo operation is complete
        document.dispatchEvent(new Event("editorchanges"));
    };
})();

/**
 * Initialize the global restorable object
 * This initialization must happen immediately to ensure proper state management
 * @global
 */
if (!("ncsedtRestorableObj" in window)) {
    var ncsedtRestorableObj = new ncsedtRestorable();
}

(function () {
    // Constants
    const MAX_IMAGE_SIZE_BYTES = 1200000; // 1.2MB - Large base64 images degrade DOM performance
    const MAX_ALLOWED_IMAGE_SIZE_BYTES = 5000000; // 5MB absolute maximum
    const MIN_GROUPING_WINDOW_MS = 100; // Minimum time window for grouping mutations
    const TIME_SCALE_FACTOR = 10000; // Time scaling factor for mutation timestamps


    /**
     * Simple HTML Editor main class
     * @class ncSimpleHtmlEditor
     * @description A lightweight WYSIWYG HTML editor that provides intuitive content editing
     *              capabilities with undo/redo support, clipboard operations, and more.
     *
     * @param {Object} options - Configuration options for the editor
     * @param {string} options.editableContentSelector - Selector for editable content (default: "body")
     * @param {boolean} options.usesLinearUndoHistory - Enable/disable linear undo/redo history
     * @param {number} options.mutationGroupingWindowMs - Time in ms to group history changes
     * @param {number} options.toolbarCols - Number of columns in toolbar
     * @param {number} options.saveTimeout - Timeout for save button in ms
     * @param {number} options.maxImageSizeBytes - Maximum image upload size in bytes
     * @param {Array<string>} options.toolbar - List of enabled toolbar buttons
     */
    window.ncSimpleHtmlEditor = function (options = {}) {
        var _this = this;

        /**
         * Reference to the global restorable object for state management
         * @type {ncsedtRestorable}
         * @private
         */
        this.restorable = window.ncsedtRestorableObj || new ncsedtRestorable();

        /**
         * Editor state object
         * Maintains the current state of the editor including editing mode,
         * clipboard contents, and history stacks
         *
         * @type {Object}
         * @property {boolean} isEditing - Whether the editor is in edit mode
         * @property {string|null} clipboard - Content stored in internal clipboard
         * @property {Object} history - Undo/redo history stacks
         * @property {Array} history.undo - Stack of operations that can be undone
         * @property {Array} history.redo - Stack of operations that can be redone
         * @property {Array} history.force - Stack of forced history entries
         * @property {Selection|null} selection - Current text selection in editor
         * @private
         */
        this.state = {
            isEditing: false,
            clipboard: null,
            history: {
                undo: [],
                redo: [],
                force: []
            },
            selection: null
        };

        /**
         * Validate and process configuration options
         * @private
         */
        this.validateOptions(options);

        /**
         * Default configuration options
         * @type {Object}
         * @private
         */
        const defaults = {

            editableContentSelector: "body",
            usesLinearUndoHistory: true,
            mutationGroupingWindowMs: 200,

            /**
             * IA models
             */
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

            additionalPrompts: {
                "only replacement": '(INSTRUCTIONS IMPORTANT: The answer should only indicate what is asked of you, without any additional comments,  just the -HTML code- or the text, without markdown or anything else.)'
            },

            /**
             * Number of columns to display in the toolbar
             * When null, uses the default layout defined in CSS
             * @type {number|null}
             * @default null
             */
            toolbarCols: null,

            /**
             * Timeout in milliseconds to disable the save button after clicking
             * Prevents accidental double-saves
             * @type {number}
             * @default 500
             */
            saveTimeout: 500,

            maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,

            /**
             * Array of enabled toolbar buttons and their display order
             * Determines which features are available and how they are presented
             * @type {Array<string>}
             */
            toolbar: ['edit', 'undo', 'redo', 'up', 'down', 'previous', 'next', 'cut', 'copy', 'paste', 'head', 'code', 'agent', 'link', 'image', 'save', 'github'],

            /**
             * Toolbar button configurations
             * Each button configuration includes:
             * - name: Button identifier
             * - icon: Base64 encoded icon image
             * - icon2: Alternative icon for toggled state (optional)
             * - title: Tooltip text
             * - disabled: Function that determines if button should be disabled
             * - action: Function to execute when button is clicked
             * @type {Object}
             */
            buttons: {
                /**
                 * Edit Button Configuration
                 * Toggles the editor's edit mode on/off
                 * @property {string} name - Button identifier
                 * @property {string} icon - Normal state icon (base64)
                 * @property {string} icon2 - Active state icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if button should be disabled
                 * @property {Function} action - Button click handler
                 */
                edit: {
                    name: 'edit',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABP0lEQVRo3u3YMU4CQRTG8T+7nkM3HkUTK26BHa2Vt9BGGlAEgl5Dz2E2XoFGGqLNTljJDDNLwXtD3pdMQTIkv+/tsNkFLBaLxQIV8AmsgAeglAZ1yTnwBfy21jtwJg07FJ9NiX34LEoMI3i3Fij+TdwnlniUhrpUwNUBJVbScIevgR/gpmOJDy14B+pSogYuJPGhu80a6O/svdvZ8w1casSnlBDHV/w/NqHlO07D5vtiCU1+AgyADfErIZYK/+THQNHsucV/Ja6l8fsm7/A94MmzR/zMnyT++ZTwo1zxRfM5G/yS7eNvAbwY3vBpePfqlx3+rYUvc8dPDW/4OL79X41aPPgfiedsb5UlMPPsqRF+GXGJTf4VpZMPFWhPfo7iyYcKOLz6yYcKhJZKfGoBtfiUAqrxsQLq8RaLxXKc/AH+RGvPIDl6DwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxNDo1ODoyMyswMDowMGRD6r4AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTQ6NTk6MzIrMDA6MDCQATIWAAAAAElFTkSuQmCC',
                    icon2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAACI0lEQVRo3u3YsWoUURTG8Z9ICIiNsDEiioioKGEbK0uxUWwkjU9kbRUbn8BitQkE0byBTUSx0FgkisaAaCGITSx2Bzezd3buzM7OzJL9YNhqzvy/c+45995lrrnmmmsuOljHL6xhoWmgIlrCFg6GnnUsNg1WFn5mTCzhTQZ8aRMdbKJbg4E7+Jtj4AA9kT3R8b+c+zWZWI00sRYT7FXqpWmY6AZixpj4GRN8BXtTNNEdxAvFzDPxMvYjV/El9fIP3KgIflzMe/gTgN/GcpGPXcHnCk2k4YuY2B/wFNZl7FZgIgs+xsRv3CyZNHAJO8r3RB78uJiruDsJfKIL+muwaCWy4Hu4b3StV9FnY018ishaDHyyIT0QV4nKdB4fIz/4Igf+OJ7WbQDO4J380p90eFMchj+GJwH479OGT7SMtxEmFvE8AP+4SfhEoUqEyr/g8CHskQaWTZZOGz0Kj5skD7Ug82ndFpfRE0YvLY1lPtG4TSpUiVN4rSWZj9lhQxmu87JUGH5DP7OtWiax8MmovIav4hu7VfAGvxtaNCqLwj+T3RONVaIK+MZMTAL/Hrc03BMx8L0M+OQOG0pCbT1RJvMfcDYVp7HplIbLy/w2zmXEaqQSacAEPpT5HVzMiVd7JfKmSvLs6v8BEKNaTcTAfxtAFVFtJvLg93C9ZOxaTOSdNlcmjN/qs9ORMhEasZtNQxXVcCW29C8/M6eufuZnEv7o6h+WFd8aD3ft0gAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxNDo1OTozMiswMDowMOFciqoAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTQ6NTk6MzIrMDA6MDCQATIWAAAAAElFTkSuQmCC',
                    title: 'Edit',
                    disabled: function () { return _this.isEditButtonDisabled() },
                    action: function () { _this.editToggle() }
                },
                /**
                 * Code View Button Configuration
                 * Toggles between visual and HTML code view
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if button should be disabled
                 * @property {Function} action - Button click handler
                 */
                code: {
                    name: 'code',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAACIElEQVRo3u2ZsUscQRjFf8ZCMFVSmFIskiqkUxEkXbAJFmJO0MQmraSxDYLYJVVII5axCakEm5C/IBwh2ClBxPaKWNhEjMlZXA7mHrPZmZ3ZGYR9cMXevO99783s7c7tQoMGDRrkxHCiPgvAHjADjAO/gE7u8D54A3SNz9tYwrcSBZiS43aivlEwDJwzuALjuU354JGYj3ruh55Cyw6cSTluV9CoBS3gtwNvh8EVeC3jV8CLXOa7DtwDCfBExrupQ5jmywKMCvcvcMcSIFkINV8W4LFwjywcc7zWEMv/GpgNy34D68LftXB0Qq6o4Ydtm3mXRp+kZs3CWQQuqXElqpoHOJW6yQJebSFCzI9J3QUw8h9+9BAh5gHmpfarQ020EKHmAbak/p1jXXCIGOYBvojGc4/ayiFimR8CzkTnvqeGUwjXzdyQZ/MHDN5xz4BjT42ivqXbl6JVWPFovCr1nz2NLxZ4cD4NnwUKvJfaTQ/zob2jCLWl7mlq8yGCI/RuWmbNvRzmqwpPC/fEoUfLs0e0ELbr8ivhfcxtvo+lgkaKXeGsl+jatuhLsc33Ybu8KX7I+GyJZsjlOkoIE3fp/W00Z/O2Y4Ak5m0hTMwxOKPfHbSSmzdDXMp3GxJg20Eni/k+WnK8LwFeVtDIio4EeJjbkA8mxPw5Cd4/xHy8ro/QvwF/bnKAJO8AYi5xh95N7Ce9Dd0H4DBFiAYNGjTIh2vrWlwSpGLTnQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxNTowMjowNCswMDowMFgiNkMAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTU6MDI6MDQrMDA6MDApf47/AAAAAElFTkSuQmCC',
                    title: 'Code',
                    disabled: function () { return _this.isCodeButtonDisabled() },
                    action: function () { _this.editCode() }
                },
                /**
                 * Undo Button Configuration
                 * Reverts the last change in the editor
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no changes to undo
                 * @property {Function} action - Button click handler
                 */
                undo: {
                    name: 'undo',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABhklEQVRo3u3WMWsUURDA8Z9i5CQaG5toIURMIRLUJo3Gyi5fxVYbwWATIYVo48ewsLJUsFFMYZVCiyTNhQhBwXDEnGfxVjiWvTWn7xED84dpdpeZ+e/Mg0cQBEEQBEEQ/E88PuwG/pXBUZI4MeL5ffSwNEauCdzELdzAZUzjNH7gC7axibd4g1Xs55YaDMVBBK7iedXgYMzYwZNKtohAm8QVvMTPv2i8Hv0q12wJgfqZmJBWbC9D4/XYq2p1cgv8nsRFaW9zN16PDzh/kGaPjRAYxXdMtrzfxWu8wntsoVvlPCcd6nncxh2cacm1iUV8zDWBtuji3h8aqjOFu/jUkvcr5koK9LGMU+MWGaIjrWdvRI11aXLZBb5Jq5CLa9LaNNV6h5MlJrCUUQAuSDvfVOtBCYES145pbDTU2cWlEgIlJnFd85l4UUqgxCQeNdToY6aUQO5JdPC5ocbK8EfHM/+1hxklenhae9aVrhut5LgK5JI4izU8w4L8PzwIgiAIgiAIgiPML+zxM5YSM3skAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIyLTA5LTE2VDE1OjAxOjUyKzAwOjAwmCW2HgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMi0wOS0xNlQxNDo1OTo1NiswMDowME3jdLwAAAAASUVORK5CYII=',
                    title: 'Undo',
                    disabled: function () { return _this.isUndoButtonDisabled() },
                    action: function () { _this.undo() }
                },
                /**
                 * Redo Button Configuration
                 * Reapplies previously undone changes
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no changes to redo
                 * @property {Function} action - Button click handler
                 */
                redo: {
                    name: 'redo',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABiklEQVRo3u3WT0tUURjH8U+hhoSuijQqd4oECS1aBJK73ktvoCCs2am7auHLCIJatSraRFjbsDYFUVAgRqFWji7uLPQ4c+femWO6eL5wFvfP8/D9nXMv5xAEQRAEQRAEQTUaRy3Qr/xOenMgQ+MBXMUNXMdFnMUZDOIXvuID3uIlXuFfTfn7uWdkEg+x1pqZOuM7lnG5ovze2r6ZwjM0exBPRxNPMF1Rvq8Ag7iNzQzi6fiLRZzqIt9zgPNYOQTxdKxgokT+QIATFeRn8BQXSt75ied4gdf4hh+t/mM4h2u4qfjZh0t6/cbpkudVnPfJr5fMxipuYaRGz1HcaYXsZZUqM47PHZpsYB5DdRomDGMJ24cRYAhvOjT4hCt9iKfMKT7BrAHudih+11qZnDRqyFcKMKHYPdPCL8p/5P8hXynAY+2/+ZljIN81wCXFGSUtundM5LsGWGhT8NH+HfIo5Q8EOJlc/1GcHPfyAFsZ5bOfKtuFmsUjvFdsPLnkcxw3giAIgiAIgiAIwC7w7i5ZynjYFQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxNTowMjowNCswMDowMFgiNkMAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTU6MDI6MDQrMDA6MDApf47/AAAAAElFTkSuQmCC',
                    title: 'Redo',
                    disabled: function () { return _this.isRedoButtonDisabled() },
                    action: function () { _this.redo() }
                },
                /**
                 * Move Up Button Configuration
                 * Moves selection to parent element
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if can't move up
                 * @property {Function} action - Button click handler
                 */
                up: {
                    name: 'up',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAAAsUlEQVRo3u3VTQqCUBhG4dMP0aBZbaLVNWzaRlqJm2gpzmoSNXGQYJJe7bsXzgOCA9H3CCJIkqRei+gBKS7AFVhGDxk7/tUcxUV8ji8uomt8MRF947OP+GV8thFDxmcXMWZ8NhEp4yeJWCWMPwFn4PHl2NL+C9fAveO6I7AHqr+88gFq2m/6MMdDsviIDCiZAdEMiGZANAOiGRDNgGjFB6xnvPcN2DXnG+AZHStJkqb2BvfBZVUwT6fHAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIyLTA5LTI3VDExOjAxOjU1KzAwOjAwYMkoEwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMi0wOS0yN1QwMTowMTo1NSswMDowMBGUkK8AAAAASUVORK5CYII=',
                    title: 'Select up',
                    disabled: function () { return _this.isUpButtonDisabled() },
                    action: function () { _this.up() }
                },
                /**
                 * Move Down Button Configuration
                 * Moves selection to child element
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if can't move down
                 * @property {Function} action - Button click handler
                 */
                down: {
                    name: 'down',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAAArUlEQVRo3u2XvQrCMBgAT9FJEAqu4vO4+BgOvrSv4NjJOgm10Gp/vwTv4JuSkLtsAREREelkBxTAKlqkLw+gqs1hjkvW0ZUGRAsYEC1gQLSAAdECBkQLGBAtYEC0wN8HbEacPQLbjvXm45yAfcveCrgvHX8GSj5/XUPmCdyWlp8qIlR+bEQS8kMjkpLvG5Gk/K8RSct/i8hCvi0iK/lmRJbyby7ANVpCRERE5uIFO9pmz/tN+9wAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMjdUMDE6MDE6MzcrMDA6MDAxOTC9AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTE2VDE1OjAxOjE1KzAwOjAwqJU+1gAAAABJRU5ErkJggg==',
                    title: 'Selenct down',
                    disabled: function () { return _this.isDownButtonDisabled() },
                    action: function () { _this.down() }
                },
                /**
                 * Previous Sibling Button Configuration
                 * Moves selection to previous sibling element
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if can't move to previous sibling
                 * @property {Function} action - Button click handler
                 */
                previous: {
                    name: 'previous',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABGklEQVRoQ+1XOQ7CMBBMREFBwQPgWdRU/IqGf1DxmVDRUFBQAOsikmUFa61ZgkaaSC6i7I7nSGyn78ivnpx/JwH/TlAJKAHQAb1CoIFwuxKALQQBlABoINyuBAoL93Z/tnGFrXUCRCaQyJ9sbG0MzvnhsigBI/mEt2ETkJNPjlIJKMlTCZgiTyPgG3kKAQdjeawsHzt7dgOXl7f1XzwYratQzXnPfN6alxUuPMUtAuYin3g/bSyZBTyM/CpaQMKbK4W7zbX+hQCPCIqNjHoZHZOl3shqIiheofz7oj7MTSVBl0ApgvKHJhdB+0vp2XfCa1rOQuGTRwBKQISLCIYSQNyL6FUCES4iGEoAcS+iVwlEuIhgKAHEvYjeD0hbKjFLoDaVAAAAAElFTkSuQmCC',
                    title: 'Select previous sibling',
                    disabled: function () { return _this.isPreviousButtonDisabled() },
                    action: function () { _this.previous() }
                },

                /**
                 * Next Sibling Button Configuration
                 * Moves selection to next sibling element
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if can't move to next sibling
                 * @property {Function} action - Button click handler
                 */
                next: {
                    name: 'next',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABHklEQVRoQ+2WQQrCUAxE25WXEEHwEh7MnaAuXOmdPIggiAfRZK82k/yQX5hCV02m82bk13GY+TXO3P9AgOoG2QAbCCbAn1AwwPA6GwhHGBRgA8EAw+tswBHhQXZOjr2vKxUNvMXJTu5rC4gqAPXeBKISoAlENUAYogeAEEQvAG4IBGArb1k0ODlufzT28uyMvAMBeInwEhF3zkKnEwLwFEMrpyl0zQyBADzExRp14pzXL/XRsosA3EVwYxENzugXWhswXQiASdAwpH8lfl2QeRXpCQA23xOAy3wvAG7zPQCEzFcDhM1XAjQxXwVwQc75qWO54hid8gQ9JwAUV8IwG0gIFZJkA1BcCcNsICFUSJINQHElDLOBhFAhydk38AELbCYxoaSv8QAAAABJRU5ErkJggg==',
                    title: 'Select next sibling',
                    disabled: function () { return _this.isNextButtonDisabled() },
                    action: function () { _this.next() }
                },
                /**
                 * Cut Button Configuration
                 * Cuts the selected content to internal clipboard
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no selection
                 * @property {Function} action - Button click handler
                 */
                cut: {
                    name: 'cut',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAAB9klEQVRo3u2YTU7CQBiGHzHqCgzXELmAceERSIhncUndGRFTAtHD+BNdeAAFI3HJDQSXGFxMScgU2pnOtDOLvskkJP2m87ztVzp9oVSpUmlqAn1gDPxGYwyEwLFruCQdAHfAH7DcMhbAENh3DbsJ/jkBXB5Plk0ECWsp6V4DfjUGBcArGWgSb5sp0Aaq0WgBE+Lt1MgZPlA5SShN+gLqG+rqkbH12lvX8ACf0sRWQu25VDtyDQ8wkyZXE2prUu3MNbyugUOp9sc1POi1UFuq/XAND/GHeML2h/hbqr12DQ9ie7CQTjhFPLC1aLQ3wC+Bnmv4lYYpi2QFKAQexLbg0bKJwuDXTQyIt1NWE4FGrVU1EG/YETBH/FW+A11Ez5uayBVeRRcpJq4S6jumi+9aMPAG7ABnW46fRsdfpPpX4NLWVbQh3TvhpQIJ+gRxB3Lr90rOhiqIdlmpk4cJWwpQ/4v1rp104L0zkQW+UBNyLjRDvNRuUHuRpRkM8gJXyYVUwQo3oZsLebeZy5ILebOdzpoLefNBE0on1MmFuopr5GrCJBfy4qPeJBfyIlYxyYW8CLZMciEvosVQmqyTC3kR7mbNhRbAkYEBqyay5EJ9Q3hVE0rSzYUegD1LBtJMKEslF1ogrrxNeOuSc6F59LuHec+XKlXKUP835G8IanS10wAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0yN1QwNDo0MDowNCswMDowMFFlZxoAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMjdUMDQ6NDA6MDQrMDA6MDAgON+mAAAAAElFTkSuQmCC',
                    title: 'Cut',
                    disabled: function () { return _this.isCutButtonDisabled() },
                    action: function () { _this.cut() }
                },
                /**
                 * Copy Button Configuration
                 * Copies the selected content to internal clipboard
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no selection
                 * @property {Function} action - Button click handler
                 */
                copy: {
                    name: 'copy',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAAA7klEQVRo3u2ZSw6CMBRFj4apcQMyZu0aEscO3JGagAvAATqQQOTTvlfiPQmTQuk9bdKXtCDSJAdKoAaayE+U8HeD4NEESsPwiwU2PW01sIsxMxMyLOrcjPgmGbbeASTgHcBLwKJO1MAZKKaG+7XNWdeJx3vMYALWdaIBTkNh52yj1nXiM+Y+lIBVnRg1zt/uQskgAW8k4I0EvJGANxLwRgLeSMAbCXizeoGspy3ps9Auq18BCXgjAW8k4E02o8+T78PdKFelHaqhF3NW4GoQuMsl5M8K2ksHq7uBG3AIPSM57aVDFTF4BRxjhBcheQHmPezLx9HoXgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0yN1QwNDozOTozNCswMDowMArEXrAAAAAElFTkSuQmCC',
                    title: 'Copy',
                    disabled: function () { return _this.isCopyButtonDisabled() },
                    action: function () { _this.copy() }
                },
                /**
                 * Paste Button Configuration
                 * Pastes content from internal clipboard at cursor position
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if clipboard empty
                 * @property {Function} action - Button click handler
                 */
                paste: {
                    name: 'paste',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABG0lEQVRo3u2ZzWrCUBBGj9WtUNc1a99KfT1F6KYoXbgVq6+iQiK4TRcmoGKS3h/7WToHZhHIzP0OCVlkID4dYAxsgVNRG2AEtB9wXlR6wBeQV9QaeFWHrKLdEL6sFfCiDnuP8Q/ClzX8rVAJMAMyh3BlfQBvQB+Ye/RnwDswCAm/9zi4rP7NLN85h6LfmVnAoTEFcmDqI+Dz2lzWvJBIgEXgrLQqZKtGIG+4NycuTfPvZn3Kz5kLJqDGBNR0AnpbAb3R+PNPwATUmIAaE1BjAmpMQI0JqDEBNSagxgTUmIAaE1BjAmrq/swdge7Fdex9gAuVC466J7AUBr7l06dpwHnBFrIailE7rvdtTiScF2ypIHgKTELCG8Z/4BuHD+VLGLARSgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0yN1QwNDozOTo1MCswMDowMDjkcyQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMjdUMDQ6Mzk6NTArMDA6MDCQATIWAAAAAElFTkSuQmCC',
                    title: 'Paste',
                    disabled: function () { return _this.isPasteButtonDisabled() },
                    action: function () { _this.paste() }
                },
                /**
                 * Link Button Configuration
                 * Opens dialog to insert/edit hyperlinks
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if not in edit mode
                 * @property {Function} action - Button click handler
                 */
                link: {
                    name: 'link',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAADHElEQVRo3u2ZzUsUYRzHP7uBSh0qLTtUKKuBQdGpOkSkFBQEnZLqYJEQBL0IEkT0B1QQhYc6mG1u18B7eRGtSxHUUahs7WZrmEX4Eurh2YHxO2+77szOCvuFYXlmvvP7fZ6Z53n2eZ6Bqqqqal0rEVPeOuAo0AQ0ADngO/AWmI/7ofgpBWSAv8Cyy/EHSAPNcYO6qRdY8ADXYx64HjewpSTwrEBwPfqCgm8oA3wa6Ha59g0YAoaBL0A9sFk8hzH940PEnJ7wgzifag7oxDmAJIEuYEb8c5jOXhHwk0BrwL37XSrxvFLgUwXG6JJ7Z4GacsFnSoS34mQlRsd6gbf0QuK4DQQkQ6zAAHBRzv0A2jEjTrGaknJDlBW4DVwOER5gu5R/hcTq0D7gP4U1mx3AAYIfXAKYoEx9YEgSTQEtLr5TwL+85zX+o8oFnKNQbRTw9cCiJDvt4R0WX7+HrxWYFm86CniA85Loo4/3Kc4R6ph4GjDTap3YNUdVgbuS7J6PdwswLv5R8WzKA9s9N8OCTQJtcu6xJOsJiHEIWLL5l4Cd4hkluJmtgioUPg2ck/O/pbw1IM57YMxWTgAnxPM5/5sBroZRAQv+EqbT2pWVcnsB8UakrDPN6Tx8N+YNlSz7YkST78LZJA4GxOthdbN7JNfbCHGG0CvJ5oCN4hkTzzimw3rpgfjvhAWrSuFcw04C28TXgXN4fOIT95N4z0ZVAZ1Z5vBejOia942H74z4FvB/W2tWHc6tj04ffw1merCMmS6cdPG0AD8l5qso4MEMbfZEXwneBEtiJmqNLtdSmOZnj7kI7I2qAlck2UAJsdzgl4FbYYB6DVf6h5QrAX4E2C3n08DDKCugi4fGoEBFwL/EvOFIdZzVrztLcX8uXs0mU2ScNasWs9FqT95VIvxgueAtpQVgBrPp5Kc9lQIPZhGhc/MZzM6DwiQwy0BdScUGb+mGC5DVJwaB+5j9mwkPX6zwlvo84IKO/kqAt3QNMxMt9ONEaMvAMNWE2SWe9QCP5fPQWj7y1QBH8qCNmH2gLPCOCv9AV1VVVVWgVgAPDHRgefYM4AAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxNDo1OTozMiswMDowMOFciqoAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTQ6NTk6MzIrMDA6MDCQATIWAAAAAElFTkSuQmCC',
                    title: 'Link',
                    disabled: function () { return _this.isLinkButtonDisabled() },
                    action: function () { _this.editLink() }
                },
                /**
                 * Image Button Configuration
                 * Opens dialog to insert/edit images
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if not in edit mode
                 * @property {Function} action - Button click handler
                 */
                image: {
                    name: 'image',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABzUlEQVRo3u2ZyUrDUBSGvzosxLEqqAj6AKJvIK58AKdncOXeCUdc+BKiILoQhYLgwpUg4hOIIu4UdyotKDi0LpJLQ8hNk7S9p4X7wYHCPWn+L0N7cwMWWRqr/P0bwARwJS2aNHzBrTXpMHHZdIN/u1UAVqRDJQk/BUx7JFalw8UNr5ihDs6ELrxiFvhxe5alw/rZKhE+SGJJOnTc8Io5j8RiuTtPlRgfBNaBcaBPs32X+/kXyEXcbwfF/6B3TU8OyODc+NkkcsPAM8Xfcql69BykWJzUQHhVe7qQYZdQFmhPYl4FPoB03I38R8EkvVH332A4WMWxAtJYAWmsgDRWQBorII0VkKbSAmmgW1pKkWQ6fQZcUv6SZeTpdCUFFjy9OyV6Sz2LGxcYA748vXmcJZQg+oFroKdWBNqA+4D+HDDi620Bbt3xc/T3oFGBQ/QP4w9Ap9uXAo5847oVOmMC8yHhVWXc8NsBY3/ApJTAKPAZQUBdLnnN2CswYFqgFbiLGD5K3QDNJgX2Kxhe1a5JgWpj14XqhroXaAoZy+Ks4ytM3wdedO8QQs/AhWBgP6dJNhoCXpB/N/BEcTqSSOIYZ33edPA34ABn9mqpWf4B0/l4sgdYXjsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMTZUMTU6MDE6MTUrMDA6MDDZyIZqAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTE2VDE1OjAxOjE1KzAwOjAwqJU+1gAAAABJRU5ErkJggg==',
                    title: 'Image',
                    disabled: function () { return _this.isImageButtonDisabled() },
                    action: function () { _this.editImage() }
                },
                /**
                 * Head Edit Button Configuration
                 * Opens dialog to edit document head section
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if not in edit mode
                 * @property {Function} action - Button click handler
                 */
                head: {
                    name: 'head',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAADI0lEQVRo3u2ZT09TQRTFf4KtCRBNwJIodK0LdwgWd+BnMBDdgaisCYluXAqu1QBxSeKfGFeKSz6AAZMaNzRxYQWbKC6gKGWhdTGvyePOtH3TzrQYe5JZzOvMmXPfu3PvnSm00ML/jWOOeNqBIWAEGADOA2eAruD3PeArsAGsA6vAO+BPs19AEpgHNoGiZfsCzAH9zRCeAJaAgxqEy3YALACnGyX+GvDDgXDZtoFxn8JjwJMKAnaAp8ANYDD4SrGgJYJnU8AzYLcCz2Iwxyk6gLdlFtwAJoIxNnyTQKYM54olX9U3bxL/C5gBjtfJPQvsG/jf4OhLmNwmA1xw9YaAFCrMynUW6iW+biB9j/Jp1+gH0ob1xmolTKBHm4wn8WEjcmLN70BPLWRL6D7v0m3KIQUUxNqPbUmS6ElqpgHiS7gn1i5gmbHn0UNlPdHGFl3orjQXdXI7em0z0UDxJUwLDVmgLcrEYTFxB4dJxQKdQF5oGZKDTBaNiP4KagM3Gj+DtcMYjWLAgOivNkF8ubWlNqMB50Q/Lfpx4AEqc26hNnzc0xi5ttRmhExesk6XEaoYPPMxphc9qVWFjP/yrZhqlpynMSfQ88EhRApLAkXDs9+exlSFyYA90T8p+suGOcuexpwS/XwUoz5SOfbGUb66ReUN6mJMSmj5EMWAV2LSVJRJnnBLaHkpB5hcaE30R2kerlTRZoT8bLscnVJiMMrENtSlU3jiZBMMmBIaPmMRNefE5AwerjoqIA58Ehru2xD0oye02QYacAc9gfXZkiwIkn3U/vCNy+hHyoe1EHWjag+Z6pMexZ9FP0xtU8e96Th6vZLGz41yEpWo5HpX6yVeNJDmcOtOw+hn4CLwyAV5DHUykuQF1O1BZx3cceAuus8Xgdc4vEjoKGNE6WtMWxrSCdxED5Vh8c6TZww9MoVbHniOql8uoQ4j8aD1Bs9uAy/QM6x0G69XOGPo0clF+4aDDRsVPajrPpPv2rYCKs53N0p8GH2osiNbg/AsqjywzrBhuPqbtQ24iCq9B1C3B30c/pt1E1VTraGuS9Y5An+zttDCv46/K53XmFVUFdIAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMjRUMDc6MTM6NTQrMDA6MDAX56YDAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTI0VDA3OjEzOjU0KzAwOjAwZroevwAAAABJRU5ErkJggg==',
                    title: 'Edit head',
                    disabled: function () { return _this.isHeadButtonDisabled() },
                    action: function () { _this.editHead() }
                },
                /**
                 * Save Button Configuration
                 * Triggers save operation for current content
                 * @property {string} name - Button identifier
                 * @property {string} icon - Normal state icon (base64)
                 * @property {string} icon2 - Processing state icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no changes to save
                 * @property {Function} action - Button click handler
                 */
                save: {
                    name: 'save',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABvklEQVRo3u2Zu0oDQRSGv0jUWKigTZAIYiH2Bn0FOx/AQiSVVV4hpYiVta3YeEGsLSwEo40+gRcQO4MXtIzF7uKyzGSzs3NmDcwPU+25/N/mZGaXBS8vL6//rEXgFPgAusKrZdv8LPDmwLgYxJFj89YhXIyNKESyqJSWUI/q9qAAiEHoAGyNiTiEawDrEEUA9IIYGACAlX7jSykAqlhbf+hSyvVuP/FDlswUJg9QtMoGOWmz61QD/wt4gKIlAVABmkAb+ArXNbAFjGSo85rXiMlRXgPu0Z++hxn6jwIN4DlD/1wAlRTzB8C4gY9p4NwFQLOH+V3ybb9GuVkB2ujvfCFnR1aAT0XOIzBh2L/qGuBbkbNu2LtO8E5gmm8EcJuIf8Jsm64DnbDGD7DsCmAzEW/yGhg3H60rVwBl4CYWv6qJm8lg/gGYcwUAMMXfblRTXG+FJuvS5k0BIJj7DWBYYT6qFYcQMZ8HQKedRL0OwaOCiHkJgBKwr6ib3LnmbZgHeE9plrbWFDXLwJkm3tqdj3SSE2BPU3cMuJQ2D7BAvg8cLwSPxCpNAneS5uMQx5iPU6NH7SpwIWney8vLS16/eT7oBHxeUFYAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMTdUMTY6Mjk6NTQrMDA6MDCj7IdOAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTE3VDE2OjI5OjU0KzAwOjAw0rE/8gAAAABJRU5ErkJggg==',
                    icon2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAABvklEQVRo3u2Zu0oDQRSGv0jUWKigTZAIYiH2Bn0FOx/AQiSVVV4hpYiVta3YeEGsLSwEo40+gRcQO4MXtIzF7uKyzGSzs3NmDcwPU+25/N/mZGaXBS8vL6//rEXgFPgAusKrZdv8LPDmwLgYxJFj89YhXIyNKESyqJSWUI/q9qAAiEHoAGyNiTiEawDrEEUA9IIYGACAlX7jSykAqlhbf+hSyvVuP/FDlswUJg9QtMoGOWmz61QD/wt4gKIlAVABmkAb+ArXNbAFjGSo85rXiMlRXgPu0Z++hxn6jwIN4DlD/1wAlRTzB8C4gY9p4NwFQLOH+V3ybb9GuVkB2ujvfCFnR1aAT0XOIzBh2L/qGuBbkbNu2LtO8E5gmm8EcJuIf8Jsm64DnbDGD7DsCmAzEW/yGhg3H60rVwBl4CYWv6qJm8lg/gGYcwUAMMXfblRTXG+FJuvS5k0BIJj7DWBYYT6qFYcQMZ8HQKedRL0OwaOCiHkJgBKwr6ib3LnmbZgHeE9plrbWFDXLwJkm3tqdj3SSE2BPU3cMuJQ2D7BAvg8cLwSPxCpNAneS5uMQx5iPU6NH7SpwIWney8vLS16/eT7oBHxeUFYAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMTdUMTY6Mjk6NTQrMDA6MDCj7IdOAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTE3VDE2OjI5OjU0KzAwOjAw0rE/8gAAAABJRU5ErkJggg==',
                    title: 'Save',
                    disabled: function () { return _this.isSaveButtonDisabled() },
                    action: function () { _this.save() }
                },
                /**
                 * Agent Button Configuration
                 * Opens dialog to interact with AI Agent
                 * @property {string} name - Button identifier
                 * @property {string} icon - Button icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if not in edit mode
                 * @property {Function} action - Button click handler
                 */
                agent: {
                    name: 'agent',
                    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzAwMCIgZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMnptMCAyYzQuNDE4IDAgOCAzLjU4MiA4IDhzLTMuNTgyIDgtOCA4LTgtMy41ODItOC04IDMuNTgyLTggOC04eiIvPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0xMiA2Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2IDYtMi42ODYgNi02LTIuNjg2LTYtNi02em0wIDJjMi4yMDkgMCA0IDEuNzkxIDQgNHMtMS43OTEgNC00IDQtNC0xLjc5MS00LTQgMS43OTEtNCA0LTR6Ii8+PC9zdmc+',
                    title: 'AI Agent',
                    disabled: function () { return _this.isAgentButtonDisabled() },
                    action: function () { _this.editAgent() }
                },
                /**
                 * github Button Configuration
                 * Triggers save operation for current content
                 * @property {string} name - Button identifier
                 * @property {string} icon - Normal state icon (base64)
                 * @property {string} icon2 - Processing state icon (base64)
                 * @property {string} title - Button tooltip
                 * @property {Function} disabled - Returns true if no changes to save
                 * @property {Function} action - Button click handler
                 */
                github: {
                    name: 'github',
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAADIklEQVRo3u2Y20tUQRzHPyrdzFKoxUv5WlGhkCX10JUgejQquzxE/0IQRBYVBAoSJSZmvfYqFpQEQXSBoCihx+olSreLRmDXLWt7mFl2nT0zZ845c45B+4UB2d+c7+/7nRln5jdQQgn/N8oc8VQArcBWoAVYAdQDVTL+BUgDz4GnwB3gMfBnpgegEegCRoFswPYG6ASWzoTwFDAAZEIIV1sG6AcWJyX+APDRgXC1TQD74hQ+C7gSg3C1XZK5nKISGE5AfK7dlDmdjXyS4nPtNjDbhYEklo2u9UcVf1BDfAHYBfQB7yMIfAdclFw9mj7tYcWn0O82Kwv6zQM6gM8yNoU4sB4ilt6w/PuFjGVl3w75bQ6rNLnGgUVhDAxoCL9p+jcAG8mfvl6okn0aNPHvmpx9QcU3oj+kJsKMhiV0M/6DgCd2F/p1+5vpU+8KlZJbl7fTlqgC/7tNUwwGmnxyvgbKbYg2+BANxCA+h8s+uVttSI4bCCYJuSNYIkV+N/Nqx9QPvKZkrSHBEOIfLS6MA9cN8RYbA8sMBPdiFJ/DXUNsuY2BegPBWAIGRg2xIm1eBkwH0UxjgY2BKQNBElVTyhAr0uZlwHTS1iVgwLSEi7R5GRg3EGxKwMBmQ+yDjYFXBoJtOKyUPDAf2GKIF2nzMvDAQFAFHInRwFHMA3TfhqQZ83E+CayOQXwz4gEs8h2sHPHoZCJKy4SusAZRnTm5zAGcUD7+BLxUfssAZ4HaCMKXAN3ALx/xWcQdzRq1TC9oeuXv6xDlomrkFuKitRNYaOCtAdqAk4j3URvhWUSlZjofPNGrkFxF1AqN6Av5Z8BcA+ccYMRStPqIEBjViLVeSHRGxnaQL9AL22EL3vaA4sd8ZtWIPQrZV/Kn8XbgEfATccDcwG6aGwIa2B1WfA7nFMLzEfkqAojvjioexNY1VEA6BRyKyGkjfpAA26YfKoFrSoJhYD+wHlEptTk0MEgMLx9lwGmfxC4M9OBw5L2wl+LdyYWBNGLTSAQ1iOc+9fUujIEM4oG3OinxhagDTiFG70mA70aAt4glmUSRVEIJJfyr+AubsTWHiHv2sgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0yOVQxNjozMzoyNCswMDowMAydbHEAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMjlUMTY6MzM6MjQrMDA6MDB9wNTNAAAAAElFTkSuQmCC',
                    title: 'Github',
                    disabled: function () { return false },
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
            draggerIcon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABgAAAAYADwa0LPAAAA+klEQVRo3u3ZUQ7CIBAE0NGDGOL9r+SHJ6k/bWJIkV3KDrvCJHx3XgwsrcDKiuukfYXMA8ALwBvAc3SZ1vLbvkIh8vKhEKXyIRC18q4R0vIuEdryrhCt5bshboa4jfGsuyGAkukAidDJ7BnHhpUm37DSmJxO36eNNaD7EZsflQxAN8TZOc8CXEaUhhQT0Iz4NWHZADXi6vXAaokQXssXEeEn8Vm8/grd9oE0wzZxDcEGdJ8FTIDJNGYBzO5DDIDpjdQaYPqynwgAzTPWS/3wTA/QTOy/+zrnonwrwlV5LcJleSnCdfkaIkT5EiJU+RwRsvyRhMB/dK9MkQ9aiYmYo9JGZAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0wOS0xNlQxMjoyOTo1MSswMDowMJ8FU+4AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMDktMTZUMTQ6Mjk6NTErMDA6MDDuWOtSAAAAAElFTkSuQmCC'
        }

        this.options = this.deepMerge(defaults, options);
        this.options.mutationGroupingWindowMs = this.options.mutationGroupingWindowMs / TIME_SCALE_FACTOR;

        this.sessionConfig = {
            aiBackends: JSON.parse(JSON.stringify(this.options.aiBackends))
        };

        /*
            <div id="ncsedt-implement">:
                The code to run the editor, the developer or user of the editor creates it. There can only be one.

            <ncsedt-editable id="ncsedt-editable">:
                Container that creates this script for editable HTML. Internal use of this application.

            Initial tree (editable = 'body'):

                html
                |-- head
                `-- body (editable)
                    |-- body content ...
                    `-- ncsedt-implement
                        `-- new ncSimpleHtmlEditor()

            Necessary tree:

                html
                |-- head
                `-- body
                    |-- ncsedt-editable (editable)
                    |   `-- body content ...
                    `-- ncsedt-implement
                        `-- new ncSimpleHtmlEditor()

            Initial tree (editable = 'div'):

                html
                |-- head
                `-- body
                    |-- div (editable)
                    `-- ncsedt-implement
                        `-- new ncSimpleHtmlEditor()

            Necessary tree:

                html
                |-- head
                `-- body
                    |-- ncsedt-editable (editable)
                    |   `-- div
                    `-- ncsedt-implement
                        `-- new ncSimpleHtmlEditor()

            Then:
                - The highest node that can be edited is body.
                - Wrap editable in ncsedt-editable.
                - Ensure that the implement is the last child of the body.

         */


        /*
         * Determines if the editing is active, can be true/false.
         */
        this.editingEnabled = null;

        /*
         * Private clipboard, does NOT share data with other applications.
         */
        this.clipboard = null;

        /*
         * <ncsedt-editable id="ncsedt-editable">
         */
        this.editable = document.querySelector(this.options.editableContentSelector);
        this.editableInBody();
        this.wrapEditable();

        /*
         * <div id="ncsedt-implement">
         */
        this.implement = document.querySelector('#ncsedt-implement');
        this.implementToLastBody();

        /*
         * Default focus to editable
         */
        this.focusedElement = this.editable;
        this.previousFocusedElement = this.focusedElement;

        /*
         * Observer
         */
        this.observer = this.setObserver();

        /*
         * undo/redo history
         */
        this.historyUndo = [];
        this.historyRedo = [];
        this.historyForce = [];

        /*
         * Events that must be available before "start".
         */
        this.setEventEditorChanges();
    }

    ncSimpleHtmlEditor.prototype.deepMerge = function (target, source) {
        for (key of Object.keys(source)) {
            if (!target.hasOwnProperty(key) || typeof source[key] !== 'object') {
                target[key] = source[key];
            } else {
                this.deepMerge(target[key], source[key]);
            }
        }

        return target;
    }

    ncSimpleHtmlEditor.prototype.isEditingEnabled = function () {
        return this.editingEnabled;
    }

    ncSimpleHtmlEditor.prototype.getCurrentFocusedElement = function () {
        return this.focusedElement;
    }

    ncSimpleHtmlEditor.prototype.getPreviousFocusedElement = function () {
        return this.previousFocusedElement;
    }

    /**
     * Get editable element.
     */
    ncSimpleHtmlEditor.prototype.getEditable = function (target, source) {
        return this.editable;
    }

    /**
     * Get clipboard content, can be null.
     */
    ncSimpleHtmlEditor.prototype.getClipboard = function (target, source) {
        return this.clipboard;
    }

    /**
     * The highest node that can be editable is body
     */
    ncSimpleHtmlEditor.prototype.editableInBody = function () {
        if (this.editable.contains(document.body) && this.editable != document.body) {
            console.log('The highest node that can be edited is body, set options.editableContentSelector = "body"');
            this.options.editableContentSelectorContentSelector = 'body';
            this.editable = document.querySelector(this.options.editableContentSelector);
        }
    };

    /**
     * Wrap editable content/innerHTML
     */
    ncSimpleHtmlEditor.prototype.wrapEditable = function () {
        const wrapContent = (target, wrapper = document.createElement('ncsedt-editable')) => {
            ;[...target.childNodes].forEach(child => wrapper.appendChild(child))
            target.appendChild(wrapper);
            return wrapper;
        }

        this.editable = wrapContent(this.editable);
        this.editable.id = "ncsedt-editable";
        this.editable.setAttribute("contentEditable", "true");
    };

    /**
     * Separate the editor code from the editable content,
     * preventing the code from being part of the editable content.
     */
    ncSimpleHtmlEditor.prototype.implementToLastBody = function () {
        var implement = document.createDocumentFragment();
        implement.appendChild(this.implement);
        document.body.appendChild(implement);
        this.implement.insertAdjacentHTML('beforeend', '<div id="ncsedt-container"></div>');
        this.implement.insertAdjacentHTML('beforebegin', '<!-- ncsedt-implement:begin -->');
        this.implement.insertAdjacentHTML('afterend', '<!-- ncsedt-implement:end -->');
        this.container = document.getElementById('ncsedt-container');
        this.container.insertAdjacentHTML('beforebegin', '<!-- ncsedt-container:begin -->');
        this.container.insertAdjacentHTML('afterend', '<!-- ncsedt-container:end -->');
    };

    /**
     * Start the editor, the editorstart event is called at the end.
     */
    ncSimpleHtmlEditor.prototype.start = function () {
        this.editOff();
        this.tollbar = this.renderTollbar();
        this.dialogCode = this.renderDialogCode();
        this.dialogImage = this.renderDialogImage();
        this.dialogLink = this.renderDialogLink();
        this.dialogHead = this.renderDialogHead();
        this.dialogAgent = this.renderDialogAgent();
        this.dialogConfig = this.renderConfigDialog();
        this.movable('#ncsedt-toolbar', '#ncsedt-toolbar-dragger');
        this.movable('#ncsedt-dialog-code', '#ncsedt-dialog-code .dragger');
        this.movable('#ncsedt-dialog-image', '#ncsedt-dialog-image .dragger');
        this.movable('#ncsedt-dialog-link', '#ncsedt-dialog-link .dragger');
        this.movable('#ncsedt-dialog-head', '#ncsedt-dialog-head .dragger');
        this.movable('#ncsedt-dialog-agent', '#ncsedt-dialog-agent .dragger');
        this.movable('#ncsedt-dialog-config', '#ncsedt-dialog-config .dragger');
        this.setEvents();
        this.setEventsToolbar();
        this.setEventsDialogCode();
        this.setEventsDialogImage();
        this.setEventsDialogLink();
        this.setEventsDialogHead();
        this.setEventsDialogAgent();
        this.setupConfigDialogEvents();
        document.dispatchEvent(new Event("editorstart"));
    };

    /**
     * Activate editing, set this.editEnable=true which allows you to
     * desterminate if the editor is active
     */
    ncSimpleHtmlEditor.prototype.editOn = function () {
        var btnsEdit = document.querySelectorAll('.ncsedt-toolbar-btn-edit img');
        this.editable.setAttribute("contentEditable", "true");

        for (element of btnsEdit) {
            element.src = this.options.buttons.edit.icon2;
        }

        this.editingEnabled = true;
        this.setFocus(this.focusedElement);
        this.observe();
        document.dispatchEvent(new Event("editorchanges"));
    };

    /**
     * Deactivate editing, set this.editEnable=false which allows you to
     * desterminate if the editor is deactivated
     */
    ncSimpleHtmlEditor.prototype.editOff = function () {
        this.observer.disconnect();
        var editable = document.querySelectorAll('*[contentEditable]');
        var btnsEdit = document.querySelectorAll('.ncsedt-toolbar-btn-edit img');

        for (element of editable) {
            element.setAttribute("contentEditable", "false");
        }

        for (element of btnsEdit) {
            element.src = this.options.buttons.edit.icon;
        }

        for (focused of document.querySelectorAll(".focused")) {
            focused.classList.remove('focused');
        }

        this.editingEnabled = false;
        document.dispatchEvent(new Event("editorchanges"));
    };

    /**
     * Sets the focus on the element currently being edited.
     * Receives the element on which the focus will be set.
     */
    ncSimpleHtmlEditor.prototype.setFocus = function (element) {
        if (!this.editingEnabled) {
            return;
        }

        if (!element) {
            return;
        }

        if (!element.isContentEditable) {
            return;
        }

        for (oldfocused of document.querySelectorAll(".focused")) {
            oldfocused.classList.remove('focused');
        }

        this.previousFocusedElement = this.focusedElement;
        this.focusedElement = element;
        this.focusedElement.focus();
        this.focusedElement.classList.add('focused');
        document.dispatchEvent(new Event("focusedchange"));
    };

    /**
     * Download html with the current changes.
     * You may need to replace this function with your own.
     */
    ncSimpleHtmlEditor.prototype.save = function () {
        var _this = this;
        var templatesource = this.getDocumentHTML();
        var download = document.createElement('a');
        var btnsSave = document.querySelectorAll('.ncsedt-toolbar-btn-save img');
        this.saving = true;
        this.editOff();

        for (button of btnsSave) {
            button.src = this.options.buttons.save.icon2;
            button.parentNode.disabled = true;
        }

        download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(templatesource));
        download.setAttribute('download', 'index.html');
        this.container.appendChild(download);
        download.click();

        setTimeout(function () {
            _this.saving = false;
            for (button of btnsSave) {
                button.src = _this.options.buttons.save.icon;
                button.parentNode.disabled = false;
            }
        }, this.options.saveTimeout);

        this.container.removeChild(download);
        this.editOn();
    };

    /**
     * Get the HTML with the current changes.
     * If no selector is indicated, the complete document.
     */
    ncSimpleHtmlEditor.prototype.getDocumentHTML = function (selector = null) {
        var html = '';

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        this.restorable.restore();
        this.removable();

        if (selector) {
            html = document.querySelector(selector).innerHTML;
        } else {
            html = new XMLSerializer().serializeToString(document);
        }

        this.undoRemovable();
        this.restorable.undoRestore();

        return this.ncsedtRemover(html);
    };

    /**
     * Removes the code from the HTML editor.
 */
    ncSimpleHtmlEditor.prototype.ncsedtRemover = function (html) {

        /*
         * Everything between <!-- ncsedt-implement:before --> and </ncsedt-editable>
         * was created dynamically and must be removed.
         */
        html = html.replace(/<ncsedt-removable>\s*<\/ncsedt-removable>/gsi, '');
        html = html.replace(/<!--\s*ncsedt-implement:before\s*-->.*<\/ncsedt-editable>/gsi, '</ncsedt-editable>');
        html = html.replace(/<!--\s*ncsedt-implement:begin\s*-->.*<!--\s*ncsedt-implement:end\s*-->/gsi, '');
        html = html.replace(/<!--\s*ncsedt-container:begin\s*-->.*<!--\s*ncsedt-container:end\s*-->/gsi, '');
        html = html.replace(/<\/?ncsedt-editable[^>]*>/gsi, '');

        return html;
    };

    /**
     * Remove removable block
     */
    ncSimpleHtmlEditor.prototype.removable = function () {
        var _this = this;
        var count = 0;
        this.removableHtml = [];

        document.querySelectorAll('ncsedt-removable').forEach(function (node) {
            _this.removableHtml[count++] = node.innerHTML;
            node.innerHTML = '';
        });
    };

    /**
     * Undo remove removable block
     */
    ncSimpleHtmlEditor.prototype.undoRemovable = function () {
        var _this = this;
        var count = 0;

        document.querySelectorAll('ncsedt-removable').forEach(function (node) {
            node.innerHTML = _this.removableHtml[count++];
        });
    };

    /**
     * Editing on/off
     */
    ncSimpleHtmlEditor.prototype.editToggle = function () {
        if (this.editingEnabled) {
            this.editOff();
        } else {
            this.editOn();
        }
    };

    /**
     * Undo
     */
    ncSimpleHtmlEditor.prototype.undo = function () {
        this.undoredo(true);
    };

    /**
     * Redo
     */
    ncSimpleHtmlEditor.prototype.redo = function () {
        this.undoredo(false);
    };

    /**
     * Focus on parent
     */
    ncSimpleHtmlEditor.prototype.up = function () {
        if (this.focusedElement.parentElement) {
            this.setFocus(this.focusedElement.parentElement);
            this.focusedElement.scrollIntoView({ block: "center" });
        }
    };

    /**
     * Focus on first child
     */
    ncSimpleHtmlEditor.prototype.down = function () {
        if (this.focusedElement.firstElementChild) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.focusedElement.scrollIntoView({ block: "center" });
        }
    };


    /**
     * Focus on previous sibling or previous parent sibling
     */
    ncSimpleHtmlEditor.prototype.previous = function () {
        if (this.focusedElement.previousElementSibling) {
            this.setFocus(this.focusedElement.previousElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        } else if (this.focusedElement.parentElement.previousElementSibling) {
            this.setFocus(this.focusedElement.parentElement.previousElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        } else if (this.focusedElement.parentElement.parentElement &&
            this.focusedElement.parentElement.parentElement.previousElementSibling) {
            this.setFocus(this.focusedElement.parentElement.parentElement.previousElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        }
    };


    /**
     * Focus on next sibling or next parent sibling
     */
    ncSimpleHtmlEditor.prototype.next = function () {
        if (this.focusedElement.nextElementSibling) {
            this.setFocus(this.focusedElement.nextElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        } else if (this.focusedElement.parentElement.nextElementSibling) {
            this.setFocus(this.focusedElement.parentElement.nextElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        } else if (this.focusedElement.parentElement.parentElement &&
            this.focusedElement.parentElement.parentElement.nextElementSibling) {
            this.setFocus(this.focusedElement.parentElement.parentElement.nextElementSibling);
            this.focusedElement.scrollIntoView({ block: "center" });
        }
    };

    /**
     * Current focus to clipboard
     */
    ncSimpleHtmlEditor.prototype.copy = function () {
        if (this.focusedElement != this.editable) {
            this.clipboard = this.focusedElement.outerHTML;
            document.dispatchEvent(new Event("editorchanges"));
        }
    };

    /**
     * Cut current focus
     */
    ncSimpleHtmlEditor.prototype.cut = function () {
        if (this.focusedElement != this.editable) {
            this.clipboard = this.focusedElement.outerHTML;
            this.focusedElement.parentElement.removeChild(this.focusedElement);
            this.setFocus(this.focusedElement.parentElement);
        }
    };

    /**
     * Paste clipboard content
     */
    ncSimpleHtmlEditor.prototype.paste = function () {
        if (this.clipboard && this.focusedElement != this.editable) {
            this.focusedElement.insertAdjacentHTML('afterend', this.clipboard);
        }
    };



    ncSimpleHtmlEditor.prototype.isAgentButtonDisabled = function () {
        return !this.editingEnabled;
    };



    ncSimpleHtmlEditor.prototype.isEditButtonDisabled = function () {
        return false;
    };

    ncSimpleHtmlEditor.prototype.isSaveButtonDisabled = function () {
        return !this.editingEnabled || this.saving;
    };

    ncSimpleHtmlEditor.prototype.isUndoButtonDisabled = function () {
        return !this.isEditingEnabled() || !this.hasUndoHistory();
    };

    ncSimpleHtmlEditor.prototype.hasUndoHistory = function () {
        return this.historyUndo.length > 0;
    };

    ncSimpleHtmlEditor.prototype.isRedoButtonDisabled = function () {
        return !this.isEditingEnabled() || !this.hasRedoHistory();
    };

    ncSimpleHtmlEditor.prototype.hasRedoHistory = function () {
        return this.historyRedo.length > 0;
    };

    ncSimpleHtmlEditor.prototype.isUpButtonDisabled = function () {
        return !this.editingEnabled || !this.canMoveUp();
    };

    ncSimpleHtmlEditor.prototype.canMoveUp = function () {
        return this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable;
    };

    ncSimpleHtmlEditor.prototype.isDownButtonDisabled = function () {
        return !this.editingEnabled || !this.canMoveDown();
    };

    ncSimpleHtmlEditor.prototype.canMoveDown = function () {
        return this.focusedElement.firstElementChild;
    };

    ncSimpleHtmlEditor.prototype.isPreviousButtonDisabled = function () {
        return !this.editingEnabled || !this.canMovePrevious();
    };

    ncSimpleHtmlEditor.prototype.canMovePrevious = function () {
        return this.focusedElement.previousElementSibling ||
            (this.focusedElement.parentElement &&
                this.focusedElement.parentElement.previousElementSibling) ||
            (this.focusedElement.parentElement &&
                this.focusedElement.parentElement.parentElement &&
                this.focusedElement.parentElement.parentElement.previousElementSibling);
    };

    ncSimpleHtmlEditor.prototype.isNextButtonDisabled = function () {
        return !this.editingEnabled || !this.canMoveNext();
    };

    ncSimpleHtmlEditor.prototype.canMoveNext = function () {
        return this.focusedElement.nextElementSibling ||
            (this.focusedElement.parentElement &&
                this.focusedElement.parentElement.nextElementSibling) ||
            (this.focusedElement.parentElement &&
                this.focusedElement.parentElement.parentElement &&
                this.focusedElement.parentElement.parentElement.nextElementSibling);
    };

    ncSimpleHtmlEditor.prototype.isCutButtonDisabled = function () {
        return !this.editingEnabled || this.focusedElement == this.editable;
    };

    ncSimpleHtmlEditor.prototype.isCopyButtonDisabled = function () {
        return !this.editingEnabled || this.focusedElement == this.editable;
    };

    ncSimpleHtmlEditor.prototype.isPasteButtonDisabled = function () {
        return !this.editingEnabled || !this.clipboard || this.focusedElement == this.editable;
    };

    ncSimpleHtmlEditor.prototype.isLinkButtonDisabled = function () {
        return !this.editingEnabled;
    };

    ncSimpleHtmlEditor.prototype.isImageButtonDisabled = function () {
        return !this.editingEnabled;
    };

    ncSimpleHtmlEditor.prototype.isHeadButtonDisabled = function () {
        return !this.editingEnabled;
    };

    ncSimpleHtmlEditor.prototype.isCodeButtonDisabled = function () {
        return !this.editingEnabled;
    };

    /**
     * Validate editor options
     * @param {Object} options - Editor configuration options
     * @throws {Error} If options are invalid
     */
    ncSimpleHtmlEditor.prototype.validateOptions = function (options) {
        if (options.editableContentSelector && typeof options.editableContentSelector !== 'string') {
            throw new Error('Option "editable" must be a string selector');
        }

        if (options.maxImageSizeBytes && typeof options.maxImageSizeBytes !== 'number') {
            throw new Error('Option "maxImageUpload" must be a number');
        }

        if (options.toolbar && !Array.isArray(options.toolbar)) {
            throw new Error('Option "toolbar" must be an array');
        }

        // Sanitize values
        if (options.mutationGroupingWindowMs) {
            options.mutationGroupingWindowMs = Math.max(MIN_GROUPING_WINDOW_MS, options.mutationGroupingWindowMs);
        }

        if (options.maxImageSizeBytes) {
            options.maxImageSizeBytes = Math.min(options.maxImageSizeBytes, MAX_ALLOWED_IMAGE_SIZE_BYTES);
        }

        if (options.aiBackends) {
            const validBackends = ['ollama', 'openrouter', 'anthropic', 'azure', 'gemini', 'openai'];

            for (const backend of validBackends) {
                if (options.aiBackends[backend]) {
                    if (typeof options.aiBackends[backend].enabled !== 'boolean') {
                        options.aiBackends[backend].enabled = false;
                    }

                    // Validar configuraciones requeridas
                    if (backend === 'azure') {
                        if (!options.aiBackends[backend].url || !options.aiBackends[backend].model) {
                            options.aiBackends[backend].enabled = false;
                            console.warn(`Azure backend disabled - URL and model must be configured`);
                        }
                    } else if (backend !== 'ollama') {
                        if (!options.aiBackends[backend].apiKey) {
                            options.aiBackends[backend].enabled = false;
                            console.warn(`${backend} backend disabled - API key not configured`);
                        }
                    }
                }
            }
        }
    };

    /**
     * Observer.
     * Main use is undo/redo history
     */
    ncSimpleHtmlEditor.prototype.setObserver = function () {

        /*
            The edited template may change attributes for design reasons,
            class changes in nav, menus, etc.

            Only mutations that originate from the element being edited
            (_this.focusedElement.contains(mutation.target)) are added to the
            history for "attributes".

            Only the changes forced by the application (historyforce) are
            added to the history for "attributes".
        */

        return new MutationObserver(function (mutations) {
            if (!_this.editingEnabled || _this.ignoreMutations) {
                return;
            }

            mutations.forEach(function (mutation) {

                // Time to group mutations.
                mutation.time = Date.now() / TIME_SCALE_FACTOR;

                switch (mutation.type) {
                    case 'characterData':
                        mutation.newValue = mutation.target.nodeValue;
                        _this.historyUndo.push(mutation);
                        _this.resetLinearHistory();
                        document.dispatchEvent(new Event("contentchanges"));
                        break
                    case 'attributes':
                        var attrName = mutation.attributeName;
                        var attrValue = mutation.target.getAttribute(mutation.attributeName);
                        if ((_this.focusedElement.contains(mutation.target) || document.head.contains(mutation.target)) && _this.historyForceCheck(attrName, attrValue)) {
                            mutation.newValue = attrValue;
                            _this.historyUndo.push(mutation);
                            _this.historyForceRemove(attrName, attrValue);
                            _this.resetLinearHistory();
                            document.dispatchEvent(new Event("contentchanges"));
                        }

                        break
                    case 'childList':
                        _this.historyUndo.push(mutation);
                        _this.resetLinearHistory();
                        document.dispatchEvent(new Event("contentchanges"));
                        break
                }
            });

            document.dispatchEvent(new Event("editorchanges"));
        });


    };

    /**
     * Activate the observer.
     * For editable, head if button head is present in tootlbar.
     */
    ncSimpleHtmlEditor.prototype.observe = function () {
        this.observer.observe(this.editable, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
            characterDataOldValue: true
        });

        if (this.options.toolbar.includes('head')) {
            this.observer.observe(document.head, {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });
        }
    };

    ncSimpleHtmlEditor.prototype.resetLinearHistory = function () {
        if (this.historyRedo.length && this.options.usesLinearUndoHistory) {
            this.historyRedo = [];
        }
    }

    /**
     * Attributes require authorization for mutations.
     * Attribute name and value.
     */
    ncSimpleHtmlEditor.prototype.historyForcePush = function (attr, val) {
        var force = attr + ':' + val.toString();
        this.historyForce.push(force);
    };

    /**
     * Check an attribute change.
     * Attribute name and value.
     */
    ncSimpleHtmlEditor.prototype.historyForceCheck = function (attr, val) {
        var value = val || '';
        var force = attr + ':' + value.toString();
        return this.historyForce.includes(force);
    };

    /**
     * You should not call this function.
     */
    ncSimpleHtmlEditor.prototype.historyForceRemove = function (attr, val) {
        var force = attr + ':' + val.toString();

        if (this.historyForce.includes(force)) {
            this.historyForce.splice(this.historyForce.indexOf(force), 1);
        }
    };

    /**
     * undo/redo action, undo if undo=true, else redo.
     */
    ncSimpleHtmlEditor.prototype.undoredo = function (undo) {
        this.observer.disconnect();
        var previousTime = null;
        var groupingByTime = true; // always true, only for readability

        /*
            The editor can cause several mutations that correspond to a single
            update, mutations performed at the same time or in a margin of
            "groupingHistory" time correspond to the same update.
        */
        while (groupingByTime) {
            if (undo) {
                if (!this.historyUndo.length) {
                    break;
                }

                var mutation = this.historyUndo.pop();
                this.historyRedo.push(mutation);

                if (previousTime && mutation.time + _this.options.mutationGroupingWindowMs < previousTime) {
                    /**
                     * End group, restore and break
                     */
                    this.historyUndo.push(mutation);
                    this.historyRedo.pop();
                    break;
                }
            } else {
                if (!this.historyRedo.length) {
                    break;
                }

                var mutation = this.historyRedo.pop();
                this.historyUndo.push(mutation);

                if (previousTime && mutation.time - _this.options.mutationGroupingWindowMs > previousTime) {
                    /**
                     * End group, restore and break
                     */
                    this.historyRedo.push(mutation);
                    this.historyUndo.pop();
                    break;
                }
            }

            switch (mutation.type) {
                case 'characterData':
                    var parentView = mutation.target.parentElement.parentElement.parentElement || mutation.target.parentElement.parentElement || mutation.target.parentElement
                    parentView.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target.parentElement);
                    mutation.target.textContent = undo ? mutation.oldValue : mutation.newValue;
                    break;

                case 'attributes':
                    mutation.target.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target);
                    var value = undo ? mutation.oldValue : mutation.newValue

                    if (value === null) {
                        mutation.target.removeAttribute(mutation.attributeName);
                    } else {
                        mutation.target.setAttribute(mutation.attributeName, value);
                    }

                    break;

                case 'childList':
                    mutation.target.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target);
                    var addNodes = undo ? mutation.removedNodes : mutation.addedNodes;
                    var removeNodes = undo ? mutation.addedNodes : mutation.removedNodes;

                    Array.from(addNodes).forEach(mutation.nextSibling ? (node) => {
                        mutation.nextSibling.parentNode.insertBefore(node, mutation.nextSibling);
                    } : (node) => {
                        mutation.target.appendChild(node);
                    });

                    Array.from(removeNodes).forEach(function (node) {
                        node.parentNode.removeChild(node);
                    });

                    break;
            }

            previousTime = mutation.time;
        }

        this.observe();
        document.dispatchEvent(new Event("editorchanges"));
        document.dispatchEvent(new Event("contentchanges"));
    };

    /**
     * When there are changes.
     */
    ncSimpleHtmlEditor.prototype.setEventEditorChanges = function () {
        var _this = this;

        document.addEventListener('editorchanges', function () {
            _this.setDisabledBtns();
        });
    };

    /**
     * Generic events.
     */
    ncSimpleHtmlEditor.prototype.setEvents = function () {
        var _this = this;

        this.editable.addEventListener('click', function (evt) {
            if (_this.focusedElement != evt.target) {
                _this.setFocus(evt.target);
            }
        }, true);

        this.editable.addEventListener('input', function (evt) {
            // https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
            if (evt.inputType == "insertParagraph") {
                setTimeout(function () {
                    _this.setFocus(document.getSelection().anchorNode);
                }, 50);
            }
        }, true);

        this.editable.addEventListener('dblclick', function () {
            if (_this.focusedElement.tagName == 'A' || _this.focusedElement.parentElement.tagName == 'A') {
                _this.command(_this.options.buttons.link);
            } else if (_this.focusedElement.tagName == 'IMG' || _this.focusedElement.parentElement.tagName == 'IMG') {
                _this.command(_this.options.buttons.image);
            } else {
                _this.command(_this.options.buttons.code);
            }
        }, true);

        document.addEventListener('contentchanges', function () {
            window.onbeforeunload = function (evt) {
                evt.returnValue = '';
                return '';
            };
        });

    };

    /**
     * Toolbar events.
     */
    ncSimpleHtmlEditor.prototype.setEventsToolbar = function () {
        _this = this;

        for (var name of this.options.toolbar) {
            var button = this.options.buttons[name];
            var toolbarBtns = document.querySelectorAll(".ncsedt-toolbar-btn-" + button.name);
            for (btn of toolbarBtns) {
                btn.addEventListener('click', handleCommand(button));
            }
        }

        function handleCommand(button) {
            return function (e) {
                _this.command(button);
            };
        }
    };

    /**
     * Execute a command, usually from the toolbar.
     */
    ncSimpleHtmlEditor.prototype.command = function (command) {
        command.action();
    };

    /**
     * Set handler for disabled buttons
     */
    ncSimpleHtmlEditor.prototype.setDisabledBtns = function () {
        for (var name of this.options.toolbar) {
            var option = this.options.buttons[name];
            var buttons = document.querySelectorAll(".ncsedt-toolbar-btn-" + option.name);
            for (button of buttons) {
                button.disabled = option.disabled();
            }
        }
    };

    /**
     * Set an element as movable.
     */
    ncSimpleHtmlEditor.prototype.movable = function (movableSelector, draggerSelector) {
        new ncSimpleMoveable(movableSelector, draggerSelector);
    };

    /**
     * Render toolbar
     */
    ncSimpleHtmlEditor.prototype.renderTollbar = function () {
        var toolbar = document.createElement("toolbar");
        toolbar.id = "ncsedt-toolbar";
        toolbar.classList.add("ncsedt-toolbar");

        toolbar.innerHTML =
            '<button class="ncsedt-toolbar-dragger ncsedt-toolbar-btn" id="ncsedt-toolbar-dragger">' +
            '   <img class="ncsedt-toolbar-icon-dragger ncsedt-toolbar-icon" src="' + this.options.draggerIcon + '" title="Move">' +
            '</button>';

        for (var name of this.options.toolbar) {
            var option = this.options.buttons[name];
            var button = document.createElement("button");
            button.classList.add("ncsedt-toolbar-btn");
            button.classList.add("ncsedt-toolbar-btn-" + option.name);
            button.disabled = option.disabled();
            button.innerHTML = '<img class="ncsedt-toolbar-icon" src="' + option.icon + '" title="' + option.title + '">';
            toolbar.append(button);
        }

        this.container.append(toolbar);

        if (this.options.toolbarCols) {
            var style = window.getComputedStyle(toolbar);
            var padding = parseInt(style.getPropertyValue('padding'));
            var border = parseInt(style.getPropertyValue('border'));
            toolbar.style.width = (42 * this.options.toolbarCols + (padding * 2) + (border * 2)) + 'px';
        }

        return toolbar;
    };


    ncSimpleHtmlEditor.prototype.renderConfigDialog = function () {
        const dialogHTML = `
    <dialog id="ncsedt-dialog-config" class="ncsedt-dialog" style="width: 500px;">
        <div class="ncsedt-btns">
            <div class="ncsedt-btns-left">
                <button type="button" class="sbutton dragger">
                    <img src="${this.options.draggerIcon}" title="Move">
                    <span>Configure AI Backend</span>
                </button>
            </div>
            <div class="ncsedt-btns-right">
                <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>
            </div>
        </div>
        <div class="body">
            <div class="backend-selector">
                <label style="width: 20%;text-align: right;">Backend:</label>
                <select id="ncsedt-config-backend" class="sbutton">
                    <option value="ollama">Ollama</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="azure">Azure</option>
                    <option value="gemini">Gemini</option>
                    <option value="openai">OpenAI</option>
                </select>
            </div>

            <div id="ncsedt-config-fields">
                <!-- Los campos se generarán dinámicamente -->
            </div>
        </div>
        <div class="ncsedt-btns">
            <div class="ncsedt-btns-right">
                <button type="button" class="sbutton confirm">&check; Save</button>
            </div>
        </div>
    </dialog>
    `;

        this.container.insertAdjacentHTML('beforeend', dialogHTML);
        return document.getElementById('ncsedt-dialog-config');
    };

    ncSimpleHtmlEditor.prototype.setupConfigDialogEvents = function () {
        const _this = this;
        const dialog = document.getElementById('ncsedt-dialog-config');
        const backendSelect = document.getElementById('ncsedt-config-backend');

        // Generar campos de configuración cuando cambia el backend
        backendSelect.addEventListener('change', function () {
            _this.updateConfigFields(this.value);
        });

        // Botón cancelar
        document.querySelector("#ncsedt-dialog-config .cancel").addEventListener('click', function () {
            dialog.close();
        });

        // Botón guardar
        document.querySelector("#ncsedt-dialog-config .confirm").addEventListener('click', function () {
            _this.saveBackendConfig();
            dialog.close();
        });
    };

    ncSimpleHtmlEditor.prototype.updateConfigFields = function (backend) {
        const fieldsContainer = document.getElementById('ncsedt-config-fields');
        const config = this.sessionConfig.aiBackends[backend];

        let fieldsHTML = `
    <div class="separator"></div>
    <div class="config-field">
        <label for="ncsedt-config-enabled" style="width: 20%;text-align: right;">Enabled:</label>
        <input id="ncsedt-config-enabled" type="checkbox" ${config.enabled ? 'checked' : ''}>
    </div>
    <div class="separator"></div>
    <div class="config-field">
        <label for="ncsedt-config-url" style="width: 20%;text-align: right;">API URL:</label>
        <input id="ncsedt-config-url" type="text" value="${config.url || ''}" class="sbutton" style="width: 75%">
    </div>
    <div class="separator"></div>
    <div class="config-field">
        <label for="ncsedt-config-model" style="width: 20%;text-align: right;">Model:</label>
        <input id="ncsedt-config-model" type="text" value="${config.model || ''}" class="sbutton" style="width: 75%">
    </div>
    <div class="separator"></div>`;

        // Solo mostrar campo API Key para backends que lo necesitan
        if (backend !== 'ollama') {
            fieldsHTML += `
        <div class="config-field">
            <label for="ncsedt-config-apikey" style="width: 20%;text-align: right;">API Key:</label>
            <input id="ncsedt-config-apikey" type="password" value="${config.apiKey || ''}" class="sbutton" style="width: 75%">
        </div>
        <div class="separator"></div>`;
        }

        fieldsContainer.innerHTML = fieldsHTML;
    };

    ncSimpleHtmlEditor.prototype.saveBackendConfig = function () {
        const backend = document.getElementById('ncsedt-config-backend').value;
        const config = this.sessionConfig.aiBackends[backend];

        config.enabled = document.getElementById('ncsedt-config-enabled').checked;
        config.url = document.getElementById('ncsedt-config-url').value;
        config.model = document.getElementById('ncsedt-config-model').value;

        if (backend !== 'ollama') {
            const apiKey = document.getElementById('ncsedt-config-apikey').value;
            if (apiKey) {
                config.apiKey = apiKey;
            }
        }

        // Actualizar el selector en el diálogo de agente
        this.updateBackendSelector();
    };

    ncSimpleHtmlEditor.prototype.updateBackendSelector = function () {
        const selector = document.getElementById('ncsedt-dialog-agent-backend');
        if (!selector) return;

        Array.from(selector.options).forEach(option => {
            const backend = option.value;
            if (this.sessionConfig.aiBackends[backend]) {
                option.disabled = !this.sessionConfig.aiBackends[backend].enabled;
                option.style.opacity = this.sessionConfig.aiBackends[backend].enabled ? '1' : '0.5';
            }
        });
    };



    /**
     * Renders the AI agent dialog with three textareas
     */
    ncSimpleHtmlEditor.prototype.renderDialogAgent = function () {
        var dialogAgent =
            '<dialog id="ncsedt-dialog-agent" class="ncsedt-dialog" style="width: 600px;">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span>AI Agent</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <div class="code-section">' +
            '           <label>Current Code:</label>' +
            '           <textarea class="code sbutton" placeholder="Current HTML code"></textarea>' +
            '       </div>' +
            '       <div class="separator"></div>' +
            '       <div class="prompt-section">' +
            '           <label>AI Prompt:</label>' +
            '           <textarea id="ncsedt-dialog-agent-prompt" class="prompt sbutton" placeholder="Enter your instructions for the AI..."></textarea>' +
            '           <div class="ai-config">' +
            '               <div class="backend-selector">' +
            '                   <button id="ncsedt-dialog-agent-config" type="button" class="sbutton config-models">&#9881;</button>' +
            '                   <select id="ncsedt-dialog-agent-backend" class="sbutton" style="padding: 8px">' +
            '                       <option value="ollama">Ollama</option>' +
            '                       <option value="openrouter">OpenRouter</option>' +
            '                       <option value="anthropic">Anthropic</option>' +
            '                       <option value="azure">Azure</option>' +
            '                       <option value="gemini">Gemini</option>' +
            '                       <option value="openai">OpenAI</option>' +
            '                   </select>' +
            '                   <select id="ncsedt-dialog-agent-additional-prompt" class="sbutton" style="padding: 8px">' +
            '                       <option value="none">None</option>';

        // Add additional prompt options
        for (const [key, value] of Object.entries(this.options.additionalPrompts)) {
            const selected = key === "only replacement" ? ' selected="selected"' : '';
            dialogAgent += `<option value="${key}"${selected}>${key}</option>`;
        }

        dialogAgent += '                   </select>' +
            '                   <button type="button" class="sbutton execute-ai">Go!</button>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="separator"></div>' +
            '       <div class="response-section">' +
            '           <label>AI Response:</label>' +
            '           <textarea id="ncsedt-dialog-agent-response" class="response sbutton" placeholder="AI response will appear here..." readonly></textarea>' +
            '           <div class="ai-actions">' +
            '               <button type="button" class="sbutton apply-response">Apply Changes</button>' +
            '               <button type="button" class="sbutton copy-response">Copy</button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogAgent);
        return document.getElementById('ncsedt-dialog-agent');
    };


    /**
     * Sets up event handlers for the AI agent dialog
     *
     * @method setEventsDialogAgent
     * @description Initializes all interactive elements in the agent dialog:
     * - Cancel button to close dialog
     * - Parent/Child navigation buttons
     * - Execute AI button to send prompt
     * - Confirm button to apply changes
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogAgent = function () {
        var _this = this;

        var backends = ['ollama', 'openrouter', 'anthropic', 'azure', 'gemini', 'openai'];
        var select = document.getElementById('ncsedt-dialog-agent-backend');

        // Disable options for backends that aren't enabled or properly configured
        backends.forEach(backend => {
            var option = select.querySelector(`option[value="${backend}"]`);

            if (!_this.options.aiBackends[backend].enabled ||
                (backend !== 'ollama' && !_this.options.aiBackends[backend].apiKey) ||
                (backend === 'azure' && (!_this.options.aiBackends.azure.url || !_this.options.aiBackends.azure.model))) {

                option.disabled = true;
                option.style.opacity = '0.5';
            }
        });

        document.querySelector("#ncsedt-dialog-agent .config-models").addEventListener('click', function () {
            const backendSelect = document.getElementById('ncsedt-dialog-agent-backend');
            const currentBackend = backendSelect.value;

            const configDialog = document.getElementById('ncsedt-dialog-config');
            const backendConfigSelect = document.getElementById('ncsedt-config-backend');

            backendConfigSelect.value = currentBackend;
            _this.updateConfigFields(currentBackend);

            if (!configDialog.open) {
                configDialog.showModal();
            }
        });

        // Botones básicos
        document.querySelector("#ncsedt-dialog-agent .cancel").addEventListener('click', function () {
            _this.dialogAgent.close();
        });

        document.querySelector("#ncsedt-dialog-agent .confirm").addEventListener('click', function () {
            _this.editAgentConfirm();
        });

        // Navegación
        document.querySelector("#ncsedt-dialog-agent .parent").addEventListener('click', function () {
            _this.editAgentParent();
        });

        document.querySelector("#ncsedt-dialog-agent .child").addEventListener('click', function () {
            _this.editAgentChild();
        });

        // Acciones de IA
        document.querySelector("#ncsedt-dialog-agent .execute-ai").addEventListener('click', function () {
            _this.executeAIPrompt();
        });

        document.querySelector("#ncsedt-dialog-agent .apply-response").addEventListener('click', function () {
            var response = document.getElementById('ncsedt-dialog-agent-response').value;
            document.querySelector('#ncsedt-dialog-agent .code').value = response;
        });

        document.querySelector("#ncsedt-dialog-agent .copy-response").addEventListener('click', function () {
            var responseTextarea = document.getElementById('ncsedt-dialog-agent-response');
            responseTextarea.select();
            document.execCommand('copy');
        });
    };
    /**
     * Opens and initializes the AI agent dialog
     *
     * @method editAgent
     * @description Handles the opening of agent dialog and initialization:
     * - Preserves current selection state
     * - Populates code area with current element's HTML
     * - Shows dialog with current content
     */
    ncSimpleHtmlEditor.prototype.editAgent = function () {
        if (!this.editingEnabled) {
            return;
        }

        this.currentSelection = window.getSelection();
        this.currentRange = this.currentSelection.getRangeAt(0);
        this.dialogAgent.querySelector('textarea.code').value = this.focusedElement.innerHTML;

        if (!this.dialogAgent.open) {
            this.dialogAgent.showModal();
        }
    };

    /**
     * Confirms and applies changes from the agent dialog
     *
     * @method editAgentConfirm
     * @description Commits the changes made in the agent dialog:
     * - Updates element's HTML with edited code
     * - Closes the dialog
     */
    ncSimpleHtmlEditor.prototype.editAgentConfirm = function () {
        if (this.dialogAgent.open) {
            this.dialogAgent.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.isContentEditable) {
            if (this.focusedElement.innerHTML != this.dialogAgent.querySelector('textarea.code').value) {
                this.focusedElement.innerHTML = this.dialogAgent.querySelector('textarea.code').value;
            }
        }
    };

    /**
     * Moves focus to parent element in agent dialog
     *
     * @method editAgentParent
     * @description Shifts editing focus to parent element
     */
    ncSimpleHtmlEditor.prototype.editAgentParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editAgent();
        }
    };

    /**
     * Moves focus to child element in agent dialog
     *
     * @method editAgentChild
     * @description Shifts editing focus to first child element
     */
    ncSimpleHtmlEditor.prototype.editAgentChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.isContentEditable) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.editAgent();
        }
    };

    /**
     * Executes AI prompt with selected backend and displays results
     *
     * @method executeAIPrompt
     * @description Sends prompt to selected AI backend (Ollama/OpenRouter):
     * - Gets current code and user prompt
     * - Constructs appropriate API request
     * - Handles API response
     * - Updates UI with AI response
     * - Manages loading states and errors
     */
    ncSimpleHtmlEditor.prototype.executeAIPrompt = function () {
        var prompt = document.getElementById('ncsedt-dialog-agent-prompt').value;
        var backendSelect = document.getElementById('ncsedt-dialog-agent-backend');
        var backend = backendSelect.options[backendSelect.selectedIndex].value;
        var additionalPromptSelect = document.getElementById('ncsedt-dialog-agent-additional-prompt');
        var additionalPromptKey = additionalPromptSelect.options[additionalPromptSelect.selectedIndex].value;
        var currentCode = document.querySelector('#ncsedt-dialog-agent .code').value;
        var responseTextarea = document.getElementById('ncsedt-dialog-agent-response');

        console.log("Ejecutando executeAIPrompt");
        console.log("Backend seleccionado:", backend);

        // Validate input
        if (!prompt.trim()) {
            alert("Please enter a prompt for the AI");
            return;
        }

        // Get additional prompt if selected
        let fullPrompt = `Current HTML code:\n${currentCode}\n\nUser instructions:\n${prompt}`;
        if (additionalPromptKey !== 'none' && this.options.additionalPrompts[additionalPromptKey]) {
            fullPrompt += '\n\n' + this.options.additionalPrompts[additionalPromptKey];
        }

        // Show loading state
        var executeBtn = document.querySelector('#ncsedt-dialog-agent .execute-ai');
        var originalBtnText = executeBtn.textContent;
        executeBtn.disabled = true;
        executeBtn.textContent = "...";
        responseTextarea.value = "Processing your request...";

        try {
            switch (backend) {
                case 'ollama':
                    this.callOllamaAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                case 'openrouter':
                    this.callOpenRouterAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                case 'anthropic':
                    this.callAnthropicAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                case 'azure':
                    this.callAzureAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                case 'gemini':
                    this.callGeminiAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                case 'openai':
                    this.callOpenAIAPI(fullPrompt, responseTextarea, executeBtn, originalBtnText);
                    break;
                default:
                    responseTextarea.value = "Selected backend not implemented";
                    executeBtn.disabled = false;
                    executeBtn.textContent = originalBtnText;
            }
        } catch (error) {
            console.error("AI API Error:", error);
            responseTextarea.value = "Error calling AI service: " + error.message;
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
        }
    };

    /**
     * Calls Ollama local API to generate response
     *
     * @method callOllamaAPI
     * @param {string} prompt - Full prompt including context
     * @param {HTMLElement} responseTextarea - Textarea to display response
     * @param {HTMLElement} executeBtn - Execute button to restore after completion
     * @param {string} originalBtnText - Original button text to restore
     */
    ncSimpleHtmlEditor.prototype.callOllamaAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        if (!this.options.aiBackends.ollama.model) {
            responseTextarea.value = "Ollama model not configured. Please set it in editor options.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }
        var model = this.options.aiBackends.ollama.model;

        fetch(this.options.aiBackends.ollama.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9
                }
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Ollama API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                responseTextarea.value = data.response;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("Ollama API Error:", error);
                responseTextarea.value = "Error calling Ollama API. Make sure Ollama is running locally.\nError: " + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });
    };

    /**
     * Calls OpenRouter API to generate response
     *
     * @method callOpenRouterAPI
     * @param {string} prompt - Full prompt including context
     * @param {HTMLElement} responseTextarea - Textarea to display response
     * @param {HTMLElement} executeBtn - Execute button to restore after completion
     * @param {string} originalBtnText - Original button text to restore
     */
    ncSimpleHtmlEditor.prototype.callOpenRouterAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        const backend = 'openrouter';
        const config = this.sessionConfig.aiBackends[backend];

        if (!config.enabled) {
            responseTextarea.value = "OpenRouter backend is disabled";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        if (!config.apiKey) {
            responseTextarea.value = "OpenRouter API key not configured. Please configure it first.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        fetch(config.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Simple HTML Editor'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 2000
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error?.message || `OpenRouter API error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    responseTextarea.value = data.choices[0].message.content;
                } else {
                    throw new Error("Unexpected response format from OpenRouter");
                }
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("OpenRouter API Error:", error);
                responseTextarea.value = "Error calling OpenRouter API:\n" + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });

    };


    // Método para Anthropic
    ncSimpleHtmlEditor.prototype.callAnthropicAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        const backend = 'anthropic';
        const config = this.sessionConfig.aiBackends[backend];

        if (!config.enabled) {
            responseTextarea.value = "Anthropic backend is disabled";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        if (!config.apiKey) {
            responseTextarea.value = "Anthropic API key not configured. Please configure it first.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 2000
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error?.message || `Anthropic API error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.content && data.content[0] && data.content[0].text) {
                    responseTextarea.value = data.content[0].text;
                } else {
                    throw new Error("Unexpected response format from Anthropic");
                }
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("Anthropic API Error:", error);
                responseTextarea.value = "Error calling Anthropic API:\n" + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });
    };

    ncSimpleHtmlEditor.prototype.callAzureAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        const backend = 'azure';
        const config = this.sessionConfig.aiBackends[backend];

        if (!config.enabled) {
            responseTextarea.value = "Azure backend is disabled";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        if (!config.apiKey || !config.url || !config.model) {
            responseTextarea.value = "Azure configuration incomplete. Please set URL, model and API key.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 2000
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error?.message || `Azure API error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    responseTextarea.value = data.choices[0].message.content;
                } else {
                    throw new Error("Unexpected response format from Azure");
                }
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("Azure API Error:", error);
                responseTextarea.value = "Error calling Azure API:\n" + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });
    };

    ncSimpleHtmlEditor.prototype.callGeminiAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        const backend = 'gemini';
        const config = this.sessionConfig.aiBackends[backend];

        if (!config.enabled) {
            responseTextarea.value = "Gemini backend is disabled";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        if (!config.apiKey) {
            responseTextarea.value = "Gemini API key not configured. Please configure it first.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        const url = `${config.url}${config.model}:generateContent?key=${config.apiKey}`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error?.message || `Gemini API error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    responseTextarea.value = data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Unexpected response format from Gemini");
                }
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("Gemini API Error:", error);
                responseTextarea.value = "Error calling Gemini API:\n" + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });
    };

    ncSimpleHtmlEditor.prototype.callOpenAIAPI = function (prompt, responseTextarea, executeBtn, originalBtnText) {
        const backend = 'openai';
        const config = this.sessionConfig.aiBackends[backend];

        if (!config.enabled) {
            responseTextarea.value = "OpenAI backend is disabled";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        if (!config.apiKey) {
            responseTextarea.value = "OpenAI API key not configured. Please configure it first.";
            executeBtn.disabled = false;
            executeBtn.textContent = originalBtnText;
            return;
        }

        fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 2000
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error?.message || `OpenAI API error: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    responseTextarea.value = data.choices[0].message.content;
                } else {
                    throw new Error("Unexpected response format from OpenAI");
                }
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            })
            .catch(error => {
                console.error("OpenAI API Error:", error);
                responseTextarea.value = "Error calling OpenAI API:\n" + error.message;
                executeBtn.disabled = false;
                executeBtn.textContent = originalBtnText;
            });
    };


    /**
     * Edit source code dialog
     */
    ncSimpleHtmlEditor.prototype.renderDialogCode = function () {
        var _this = this;
        var dialogCode =
            '<dialog id="ncsedt-dialog-code" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span>Edit source code</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <textarea class="code sbutton" placeholder=" ( empty ) "></textarea>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '           <button type="button" class="sbutton agent"><img class="" src="' + this.options.buttons.agent.icon + '" title="AI Agent"></button>' +
            '           <button type="button" class="sbutton link"><img class="" src="' + this.options.buttons.link.icon + '" title="Edit link"></button>' +
            '           <button type="button" class="sbutton image"><img class="" src="' + this.options.buttons.image.icon + '" title="Edit image"></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogCode);

        return document.getElementById('ncsedt-dialog-code');
    };

    /**
     * Edit source code dialog events
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogCode = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-code .cancel").addEventListener('click', function () {
            _this.dialogCode.close();
        });

        document.querySelector("#ncsedt-dialog-code .parent").addEventListener('click', function () {
            _this.editCodeParent();
        });

        document.querySelector("#ncsedt-dialog-code .child").addEventListener('click', function () {
            _this.editCodeChild();
        });

        document.querySelector("#ncsedt-dialog-code .confirm").addEventListener('click', function () {
            _this.editCodeConfirm();
        });

        document.querySelector("#ncsedt-dialog-code .agent").addEventListener('click', function () {
            if (_this.dialogCode.open) {
                _this.dialogCode.close();
            }

            _this.command(_this.options.buttons.agent)
        });

        document.querySelector("#ncsedt-dialog-code .link").addEventListener('click', function () {
            if (_this.dialogCode.open) {
                _this.dialogCode.close();
            }

            _this.command(_this.options.buttons.link)
        });

        document.querySelector("#ncsedt-dialog-code .image").addEventListener('click', function () {
            if (_this.dialogCode.open) {
                _this.dialogCode.close();
            }

            _this.setFocus(_this.focusedElement.querySelector('img'));
            _this.command(_this.options.buttons.image)
        });
    };

    /**
     * Edit source code dialog commands
     */

    ncSimpleHtmlEditor.prototype.editCode = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.querySelector('img') || this.focusedElement.parentElement.querySelector('img')) {
            this.dialogCode.querySelector('#ncsedt-dialog-code .image').style.visibility = "visible";
        } else {
            this.dialogCode.querySelector('#ncsedt-dialog-code .image').style.visibility = "hidden";
        }

        if (window.getSelection().toString() || this.focusedElement.querySelector('a') || this.focusedElement.parentElement.querySelector('a')) {
            this.dialogCode.querySelector('#ncsedt-dialog-code .link').style.visibility = "visible";
        } else {
            this.dialogCode.querySelector('#ncsedt-dialog-code .link').style.visibility = "hidden";
        }

        this.dialogCode.querySelector('textarea.code').value = this.focusedElement.innerHTML;

        if (!this.dialogCode.open) {
            this.dialogCode.showModal();
        }
    };

    ncSimpleHtmlEditor.prototype.editCodeConfirm = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.dialogCode.open) {
            this.dialogCode.close();
        }

        if (this.focusedElement.isContentEditable) {
            if (this.focusedElement.innerHTML != this.dialogCode.querySelector('textarea.code').value) {
                this.focusedElement.innerHTML = this.dialogCode.querySelector('textarea.code').value;
            }
        }
    };

    ncSimpleHtmlEditor.prototype.editCodeParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editCode();
        }
    };

    ncSimpleHtmlEditor.prototype.editCodePrev = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElementPrev && this.focusedElementPrev.isContentEditable) {
            this.setFocus(this.focusedElementPrev);
            this.editCode();
        }
    };

    ncSimpleHtmlEditor.prototype.editCodeChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.isContentEditable) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.editCode();
        }
    };

    /* ----------------------------------------------------------- */

    /**
     * Renders the image editing dialog
     * Creates and returns a dialog for editing image properties and attributes
     *
     * @method renderDialogImage
     * @description Creates a modal dialog with controls for:
     * - Image upload and preview
     * - URL and alt text input
     * - Dimension controls (width/height)
     * - Float and padding adjustments
     * - Image removal option
     * - Navigation buttons for parent/child elements
     *
     * @returns {HTMLElement} The dialog DOM element
     */
    ncSimpleHtmlEditor.prototype.renderDialogImage = function () {
        var _this = this;
        var dialogImage =
            '<dialog id="ncsedt-dialog-image" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span id="ncsedt-dialog-image-title">Edit image</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <div class="preview">' +
            '           <img class="image" src="' + this.options.buttons.image.icon + '">' +
            '           <button id="ncsedt-dialog-image-upload" type="button" class="upload sbutton">&UpArrowBar; Upload</button>' +
            '           <input id="ncsedt-dialog-image-file" class="file" accept="image/*" type="file" />' +
            '       </div>' +
            '       <label for="ncsedt-dialog-image-src">Image URL:</label>' +
            '       <input id="ncsedt-dialog-image-src" class="src sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <label for="ncsedt-dialog-image-alt">Alt. text:</label>' +
            '       <input id="ncsedt-dialog-image-alt" class="alt sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-width" class="width sbutton" type="text" placeholder="auto">' +
            '       <button type="button" class="sbutton style-width" value="100%">&longleftrightarrow;</button>' +
            '       <button type="button" class="sbutton style-width" value="50%">50%</button>' +
            '       <button type="button" class="sbutton style-width" value="25%">25%</button>' +
            '       <button type="button" class="sbutton style-width" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-height" class="height sbutton style-height" type="text" placeholder="auto">' +
            '       <button type="button" class="sbutton style-height" value="100%">&UpDownArrow;</button>' +
            '       <button type="button" class="sbutton style-height" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-float" class="float sbutton style-float" type="text" placeholder="no">' +
            '       <button type="button" class="sbutton style-float" value="left">&looparrowleft;</button>' +
            '       <button type="button" class="sbutton style-float" value="right">&looparrowright;</button>' +
            '       <button type="button" class="sbutton style-float" value="">&circlearrowleft;</button>' +
            '       <div class="separator"></div>' +
            '       <input size="3" id="ncsedt-dialog-image-padding" class="padding sbutton style-padding" type="text" placeholder="no">' +
            '       <button type="button" class="sbutton style-padding" value="10px">&sdotb;</button>' +
            '       <button type="button" class="sbutton style-padding" value="">&circlearrowleft;</button>' +
            '       <div class="image-remove">' +
            '           <div class="separator"></div>' +
            '           <label for="ncsedt-dialog-image-remove">Remove image:</label>' +
            '           <input id="ncsedt-dialog-image-remove" class="remove" type="checkbox">' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '           <button type="button" class="sbutton code"><img class="" src="' + this.options.buttons.code.icon + '" ></button>' +
            '           <button type="button" class="sbutton link"><img class="" src="' + this.options.buttons.link.icon + '" title="Edit link"></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogImage);

        return document.getElementById('ncsedt-dialog-image');
    };

    /**
     * Sets up event handlers for the image editing dialog
     *
     * @method setEventsDialogImage
     * @description Initializes all interactive elements in the image dialog:
     * - Cancel/Confirm buttons
     * - Navigation controls (parent/child/previous)
     * - Image upload functionality
     * - Style controls (width/height/float/padding)
     * - Integration with code and link editors
     *
     * @fires change - When image file is selected
     * @fires click - For various button interactions
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogImage = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-image .cancel").addEventListener('click', function () {
            _this.dialogImage.close();
        });

        document.querySelector("#ncsedt-dialog-image .confirm").addEventListener('click', function () {
            _this.editImageConfirm();
        });

        document.querySelector("#ncsedt-dialog-image .parent").addEventListener('click', function () {
            _this.editImageParent();
        });

        document.querySelector("#ncsedt-dialog-image .child").addEventListener('click', function () {
            _this.editImageChild();
        });

        document.querySelector("#ncsedt-dialog-image .code").addEventListener('click', function () {
            if (_this.dialogImage.open) {
                _this.dialogImage.close();
            }

            _this.command(_this.options.buttons.code)
        });

        document.querySelector("#ncsedt-dialog-image .link").addEventListener('click', function () {
            if (_this.dialogImage.open) {
                _this.dialogImage.close();
            }

            _this.command(_this.options.buttons.link)
        });

        document.querySelector("#ncsedt-dialog-image .upload").addEventListener('click', function () {
            document.querySelector("#ncsedt-dialog-image-file").dispatchEvent(new MouseEvent("click"));
        });

        document.querySelector("#ncsedt-dialog-image-file").addEventListener('change', function (e) {
            if (this.files[0].size > _this.options.maxImageSizeBytes) {
                var inMb = (_this.options.maxImageSizeBytes / 1024 / 1024).toFixed(1);
                alert("File is too big! " + inMb + "Mb. max. (Use .webp format)");
                this.value = "";

                return false;
            };

            var reader = new window.FileReader();
            reader.readAsDataURL(this.files[0]);
            reader.onloadend = function () {
                _this.dialogImage.querySelector('#ncsedt-dialog-image .image').src = reader.result;
                _this.dialogImage.querySelector('#ncsedt-dialog-image .src').value = 'data:image/...';
            }
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-width").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = evt.target.value;
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-height").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = evt.target.value;
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-float").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = evt.target.value;
                if (evt.target.value) {
                    _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '10px';
                } else {
                    _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '';
                }
            });
        });

        document.querySelectorAll("#ncsedt-dialog-image button.style-padding").forEach(function (element) {
            element.addEventListener('click', function (evt) {
                _this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = evt.target.value;
            });
        });
    };

    /**
     * Opens and initializes the image editing dialog
     *
     * @method editImage
     * @description Handles the opening of image dialog and initialization of its fields:
     * - Detects if editing existing image or creating new one
     * - Preserves current selection state
     * - Sets up dialog fields with current image properties
     * - Handles special cases (parent/child images)
     *
     * @throws {Error} If editor is not in edit mode
     * @fires showModal - When dialog is displayed
     */
    ncSimpleHtmlEditor.prototype.editImage = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement.tagName == 'IMG') {
            this.editImageParent();
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.lastElementChild) {
            if (this.focusedElement.firstElementChild.tagName == 'IMG' && this.focusedElement.lastElementChild.tagName == 'IMG') {
                this.editImageChild();
            }
        }

        this.currentSelection = window.getSelection();
        this.currentRange = this.currentSelection.getRangeAt(0);
        this.dialogImage.querySelector('#ncsedt-dialog-image-remove').checked = false;

        if (this.focusedElement.tagName == 'IMG') {

            /*
                Edit existing
            */
            var style = window.getComputedStyle(this.focusedElement);

            this.dialogImage.querySelector('#ncsedt-dialog-image-title').innerHTML = 'Image (Edit)';
            this.dialogImage.querySelector('.preview img').src = this.focusedElement.src;

            if (this.focusedElement.getAttribute('src').startsWith("data:image/")) {
                this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = 'data:image/...'
            } else {
                this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = this.focusedElement.getAttribute('src');
            }

            this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value = this.focusedElement.getAttribute('alt');
            this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = this.focusedElement.style.width;
            this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = this.focusedElement.style.height;
            this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = this.focusedElement.style.float;
            this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = this.focusedElement.style.padding;
            this.dialogImage.querySelector('#ncsedt-dialog-image .image-remove').style.visibility = "visible";
        } else {

            /*
                Edit new
            */
            this.dialogImage.querySelector('#ncsedt-dialog-image-title').innerHTML = 'Image (CREATE)';
            this.dialogImage.querySelector('.preview img').src = this.options.buttons.image.icon;
            this.dialogImage.querySelector('#ncsedt-dialog-image-src').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-width').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-height').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-float').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value = '';
            this.dialogImage.querySelector('#ncsedt-dialog-image .image-remove').style.visibility = "hidden";
        }

        if (!this.dialogImage.open) {
            this.dialogImage.showModal();
        }
    };

    /**
     * Confirms and applies changes from the image editing dialog
     *
     * @method editImageConfirm
     * @description Commits the changes made in the image dialog to the editor:
     * - Updates existing image properties or inserts new image
     * - Closes the dialog
     *
     * @fires contentchanges - When image properties are updated
     */
    ncSimpleHtmlEditor.prototype.editImageConfirm = function () {
        if (this.dialogImage.open) {
            this.dialogImage.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (!this.focusedElement.isContentEditable) {
            return;
        }

        if (this.focusedElement.tagName == 'IMG') {
            if (this.dialogImage.querySelector('#ncsedt-dialog-image-remove').checked) {
                this.focusedElement.outerHTML = this.focusedElement.innerHTML;
            } else {
                this.editImageConfirmExisting();
            }
        } else {
            this.editImageConfirmNew();
        }
    };

    /**
     * Applies changes to an existing image in the editor
     *
     * @method editImageConfirmExisting
     * @description Updates properties of an existing image:
     * - Source URL
     * - Alt text
     * - Dimensions (width/height)
     * - Float position
     * - Padding
     * - Handles image removal if requested
     *
     * @private
     * @fires contentchanges - When image properties are updated
     */
    ncSimpleHtmlEditor.prototype.editImageConfirmExisting = function () {
        // Extract new values from dialog fields
        var newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image-src').value;
        var newalt = this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value;
        var newwidth = this.dialogImage.querySelector('#ncsedt-dialog-image-width').value;
        var newheight = this.dialogImage.querySelector('#ncsedt-dialog-image-height').value;
        var newfloat = this.dialogImage.querySelector('#ncsedt-dialog-image-float').value;
        var newpadding = this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value;
        var oldsrc = this.focusedElement.getAttribute('src');
        var oldalt = this.focusedElement.getAttribute('alt');
        var oldwidth = this.focusedElement.style.width;
        var oldheight = this.focusedElement.style.height;
        var oldfloat = this.focusedElement.style.float;
        var oldpadding = this.focusedElement.style.padding;

        if (newwidth && !isNaN(newwidth)) {
            newwidth += '%';
        }

        if (newheight && !isNaN(newheight)) {
            newheight += '%';
        }

        if (newpadding && !isNaN(newpadding)) {
            newpadding += 'px';
        }

        if (oldsrc != newsrc) {
            if (newsrc == 'data:image/...') {
                newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image .image').src;
            }

            this.historyForcePush('src', newsrc);
            this.focusedElement.setAttribute('src', newsrc);
        }

        if (oldalt != newalt) {
            this.historyForcePush('alt', newalt);
            this.focusedElement.setAttribute('alt', newalt);
        }

        if (oldwidth != newwidth) {
            this.focusedElement.style.width = newwidth;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldheight != newheight) {
            this.focusedElement.style.height = newheight;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldfloat != newfloat) {
            this.focusedElement.style.float = newfloat;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }

        if (oldpadding != newpadding) {
            this.focusedElement.style.padding = newpadding;
            this.historyForcePush('style', this.focusedElement.style.cssText);
        }
    };

    /**
     * Inserts a new image into the editor
     *
     * @method editImageConfirmNew
     * @description Creates and inserts a new image element:
     * - Validates image source URL
     * - Sets alt text and dimensions
     * - Applies styling (float/padding)
     * - Inserts at current selection
     *
     * @private
     * @fires contentchanges - When new image is inserted
     * @throws {Error} If image source is invalid
     */
    ncSimpleHtmlEditor.prototype.editImageConfirmNew = function () {
        var newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image-src').value;
        var newalt = this.dialogImage.querySelector('#ncsedt-dialog-image-alt').value;
        var newwidth = this.dialogImage.querySelector('#ncsedt-dialog-image-width').value;
        var newheight = this.dialogImage.querySelector('#ncsedt-dialog-image-height').value;
        var newfloat = this.dialogImage.querySelector('#ncsedt-dialog-image-float').value;
        var newpadding = this.dialogImage.querySelector('#ncsedt-dialog-image-padding').value;

        if (!isNaN(newwidth)) {
            newwidth += '%';
        }

        if (!isNaN(newheight)) {
            newheight += '%';
        }

        if (newsrc) {
            if (newsrc == 'data:image/...') {
                newsrc = this.dialogImage.querySelector('#ncsedt-dialog-image .image').src;
            }

            var newimg = document.createElement('img');
            newimg.setAttribute('src', newsrc);
            newimg.setAttribute('alt', newalt);
            newimg.style.width = newwidth;
            newimg.style.height = newheight;
            newimg.style.float = newfloat;
            newimg.style.padding = newpadding;
            this.currentRange.surroundContents(newimg);
        }
    };

    /**
     * Moves focus to parent element in image dialog
     *
     * @method editImageParent
     * @description Shifts the editing focus to the parent element of the current image:
     * - Validates parent element is editable
     * - Updates dialog state for parent element
     * - Maintains selection and history state
     *
     * @private
     * @fires focusedchange - When focus changes to parent
     */
    ncSimpleHtmlEditor.prototype.editImageParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editImage();
        } else if (this.focusedElement.parentElement.parentElement && this.focusedElement.parentElement.parentElement.querySelector('img') && this.focusedElement.parentElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement.parentElement.querySelector('img'));
            this.editImage();
        } else if (this.focusedElement.previousElementSibling && this.focusedElement.previousElementSibling.tagName == 'IMG' && this.focusedElement.previousElementSibling.isContentEditable) {
            this.setFocus(this.focusedElement.previousElementSibling);
            this.editImage();
        }

    };

    /**
     * Moves focus to child element in image dialog
     *
     * @method editImageChild
     * @description Shifts the editing focus to the first child element:
     * - Checks if child element exists and is editable
     * - Updates dialog state for child element
     * - Maintains editor state
     *
     * @private
     * @fires focusedchange - When focus changes to child
     */
    ncSimpleHtmlEditor.prototype.editImageChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.querySelector('img')) {
            this.setFocus(this.focusedElement.querySelector('img'));
            this.editImage();
        } else if (this.focusedElement.nextElementSibling && this.focusedElement.nextElementSibling.tagName == 'IMG' && this.focusedElement.nextElementSibling.isContentEditable) {
            this.setFocus(this.focusedElement.nextElementSibling);
            this.editImage();
        }

        // disable button if no match
    };

    /* ----------------------------------------------------------- */

    /**
     * Renders the link editing dialog
     * Creates and returns a dialog for editing link properties and attributes
     *
     * @method renderDialogLink
     * @description Creates a modal dialog with controls for:
     * - Link text (anchor) input
     * - URL input field
     * - Target (_blank) checkbox
     * - Link removal option
     * - Navigation buttons for parent/child elements
     * - Integration with code and image editors
     *
     * @returns {HTMLElement} The dialog DOM element
     */
    ncSimpleHtmlEditor.prototype.renderDialogLink = function () {
        var dialogLink =
            '<dialog id="ncsedt-dialog-link" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span id="ncsedt-dialog-link-title">Edit link</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <label for="ncsedt-dialog-link-anchor">Anchor:</label>' +
            '       <textarea id="ncsedt-dialog-link-anchor" rows="2" class="anchor sbutton" placeholder=" ( empty ) "></textarea>' +
            '       <label for="ncsedt-dialog-link-href">URL:</label>' +
            '       <input id="ncsedt-dialog-link-href" class="href sbutton" type="text">' +
            '       <label for="ncsedt-dialog-link-target">Open in new:</label>' +
            '       <input id="ncsedt-dialog-link-target" class="target" type="checkbox">' +
            '       <div class="link-remove" style="float: right">' +
            '           <label for="ncsedt-dialog-link-remove">Remove link:</label>' +
            '           <input id="ncsedt-dialog-link-remove" class="remove" type="checkbox">' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '           <button type="button" class="sbutton code"><img class="" src="' + this.options.buttons.code.icon + '" title="Edit code"></button>' +
            '           <button type="button" class="sbutton image"><img class="" src="' + this.options.buttons.image.icon + '" title="Edit image"></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogLink);

        return document.getElementById('ncsedt-dialog-link');
    };

    /**
     * Sets up event handlers for the link editing dialog
     *
     * @method setEventsDialogLink
     * @description Initializes all interactive elements in the link dialog:
     * - Cancel button to close dialog
     * - Parent/Child navigation buttons
     * - Confirm button to apply changes
     * - Integration with code editor
     * - Integration with image editor
     *
     * @fires click - For various button interactions
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogLink = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-link .cancel").addEventListener('click', function () {
            _this.dialogLink.close();
        });

        document.querySelector("#ncsedt-dialog-link .parent").addEventListener('click', function () {
            _this.editLinkParent();
        });

        document.querySelector("#ncsedt-dialog-link .child").addEventListener('click', function () {
            _this.editLinkChild();
        });

        document.querySelector("#ncsedt-dialog-link .confirm").addEventListener('click', function () {
            _this.editLinkConfirm();
        });

        document.querySelector("#ncsedt-dialog-link .code").addEventListener('click', function () {
            if (_this.dialogLink.open) {
                _this.dialogLink.close();
            }

            _this.command(_this.options.buttons.code)
        });

        document.querySelector("#ncsedt-dialog-link .image").addEventListener('click', function () {
            if (_this.dialogLink.open) {
                _this.dialogLink.close();
            }

            _this.command(_this.options.buttons.image)
        });
    };

    /**
     * Opens and initializes the link editing dialog
     *
     * @method editLink
     * @description Handles the opening of link dialog and initialization of its fields:
     * - Preserves current selection state
     * - Detects if editing existing link or creating new one
     * - Handles special cases (parent/child links)
     * - Shows/hides image editing option based on context
     * - Populates dialog fields with current link properties
     * - Manages visibility of link removal option
     *
     * @throws {Error} If editor is not in edit mode
     * @fires showModal - When dialog is displayed
     */
    ncSimpleHtmlEditor.prototype.editLink = function () {
        if (!this.editingEnabled) {
            return;
        }

        this.currentSelection = window.getSelection();
        this.currentRange = this.currentSelection.getRangeAt(0);

        if (this.focusedElement.parentElement.tagName == 'A') {
            this.editLinkParent();
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.lastElementChild) {
            if (this.focusedElement.firstElementChild.tagName == 'A' && this.focusedElement.lastElementChild.tagName == 'A' && !this.currentSelection.toString()) {
                this.editLinkChild();
            }
        }

        if (this.focusedElement.tagName == 'IMG' || (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.tagName == 'IMG')) {
            this.dialogLink.querySelector('#ncsedt-dialog-link .image').style.visibility = "visible";
        } else {
            this.dialogLink.querySelector('#ncsedt-dialog-link .image').style.visibility = "hidden";
        }

        if (this.focusedElement.tagName == 'A') {

            /*
                Edit existing
            */
            this.dialogLink.querySelector('#ncsedt-dialog-link-title').innerHTML = 'Link (Edit)';
            this.dialogLink.querySelector('#ncsedt-dialog-link-anchor').value = this.focusedElement.innerHTML;
            this.dialogLink.querySelector('#ncsedt-dialog-link-href').value = this.focusedElement.getAttribute("href");
            this.dialogLink.querySelector('#ncsedt-dialog-link-remove').checked = false;
            this.dialogLink.querySelector('#ncsedt-dialog-link .link-remove').style.visibility = "visible";

            if (this.focusedElement.getAttribute('target') == '_blank') {
                this.dialogLink.querySelector('#ncsedt-dialog-link-target').checked = true;
            } else {
                this.dialogLink.querySelector('#ncsedt-dialog-link-target').checked = false;
            }
        } else {

            /*
                Edit new
            */
            if (this.currentSelection.anchorNode.nodeType == Node.TEXT_NODE && this.currentSelection.toString()) {
                var anchor = this.currentSelection;
            } else {
                var anchor = this.focusedElement.innerHTML || this.focusedElement.outerHTML;
            }

            this.dialogLink.querySelector('#ncsedt-dialog-link-title').innerHTML = 'Link (CREATE)';
            this.dialogLink.querySelector('.anchor').value = anchor;
            this.dialogLink.querySelector('.href').value = '';
            this.dialogLink.querySelector('#ncsedt-dialog-link-target').checked = false;
            this.dialogLink.querySelector('#ncsedt-dialog-link-remove').checked = false;
            this.dialogLink.querySelector('#ncsedt-dialog-link .link-remove').style.visibility = "hidden";
        }

        if (!this.dialogLink.open) {
            this.dialogLink.showModal();
        }
    };

    /**
     * Confirms and applies changes from the link editing dialog
     *
     * @method editLinkConfirm
     * @description Commits the changes made in the link dialog:
     * - Closes the dialog
     * - Validates editor state
     * - Handles link removal if requested
     * - Routes to appropriate handler for new or existing links
     *
     * @throws {Error} If editor is not in edit mode
     * @fires contentchanges - When link properties are updated
     */
    ncSimpleHtmlEditor.prototype.editLinkConfirm = function () {
        if (this.dialogLink.open) {
            this.dialogLink.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (!this.focusedElement.isContentEditable) {
            return;
        }

        if (this.focusedElement.tagName == 'A') {
            if (this.dialogLink.querySelector('#ncsedt-dialog-link-remove').checked) {
                this.focusedElement.outerHTML = this.focusedElement.innerHTML;
            } else {
                this.editLinkConfirmExisting();
            }
        } else {
            this.editLinkConfirmNew();
        }
    };

    /**
     * Applies changes to an existing link in the editor
     *
     * @method editLinkConfirmExisting
     * @description Updates properties of an existing link:
     * - Target attribute (_blank for new window)
     * - Link text (anchor)
     * - URL (href)
     * - Maintains history for undo/redo
     *
     * @private
     * @fires contentchanges - When link properties are updated
     */
    ncSimpleHtmlEditor.prototype.editLinkConfirmExisting = function () {
        var newtarget = this.dialogLink.querySelector('#ncsedt-dialog-link-target').checked ? '_blank' : "";
        var newanchor = this.dialogLink.querySelector('#ncsedt-dialog-link-anchor').value;
        var newurl = this.dialogLink.querySelector('#ncsedt-dialog-link-href').value;

        var oldtarget = this.focusedElement.getAttribute('target');
        var oldanchor = this.focusedElement.innerHTML;
        var oldurl = this.focusedElement.getAttribute('href');

        if (oldtarget != newtarget || oldanchor != newanchor || oldurl != newurl) {
            this.historyForcePush('href', newurl);
            this.historyForcePush('target', newtarget);
            this.focusedElement.innerHTML = newanchor;
            this.focusedElement.setAttribute('href', newurl);
            this.focusedElement.setAttribute('target', newtarget);
        }
    };

    /**
     * Creates and inserts a new link in the editor
     *
     * @method editLinkConfirmNew
     * @description Handles creation of new link elements:
     * - Creates new anchor element
     * - Sets link properties (href, target, text)
     * - Inserts at current selection or replaces focused element
     * - Maintains selection state
     *
     * @private
     * @fires contentchanges - When new link is inserted
     */
    ncSimpleHtmlEditor.prototype.editLinkConfirmNew = function () {
        var newtarget = this.dialogLink.querySelector('#ncsedt-dialog-link-target').checked ? '_blank' : "";
        var newanchor = this.dialogLink.querySelector('#ncsedt-dialog-link-anchor').value;
        var newurl = this.dialogLink.querySelector('#ncsedt-dialog-link-href').value;

        if (newanchor.length || newurl.length) {
            var newlink = document.createElement('a');
            newlink.setAttribute('href', newurl);
            newlink.setAttribute('target', newtarget);

            if (this.focusedElement.contains(this.currentRange.commonAncestorContainer)) {
                this.currentRange.surroundContents(newlink);
                newlink.innerHTML = newanchor;
            } else {
                newlink.innerHTML = newanchor
                this.focusedElement.outerHTML = newlink.outerHTML;
            }
        }
    };

    /**
     * Moves focus to parent element in link dialog
     *
     * @method editLinkParent
     * @description Shifts the editing focus to the parent element:
     * - Validates parent element is editable
     * - Updates dialog state for parent element
     * - Maintains selection and history state
     *
     * @private
     * @fires focusedchange - When focus changes to parent
     */
    ncSimpleHtmlEditor.prototype.editLinkParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editLink();
        }
    };

    /**
     * Moves focus to previous element in link dialog
     *
     * @method editLinkPrev
     * @description Shifts editing focus to the previously focused element:
     * - Validates previous element exists and is editable
     * - Updates dialog state for previous element
     *
     * @private
     * @fires focusedchange - When focus changes to previous element
     */
    ncSimpleHtmlEditor.prototype.editLinkPrev = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElementPrev && this.focusedElementPrev.isContentEditable) {
            this.setFocus(this.focusedElementPrev);
            this.editLink();
        }
    };

    /**
     * Moves focus to child element in link dialog
     *
     * @method editLinkChild
     * @description Shifts editing focus to the first child element:
     * - Validates child element exists and is editable
     * - Updates dialog state for child element
     * - Maintains editor state
     *
     * @private
     * @fires focusedchange - When focus changes to child
     */
    ncSimpleHtmlEditor.prototype.editLinkChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.isContentEditable) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.editLink();
        }
    };

    /* ----------------------------------------------------------- */

    /**
     * Renders the head section editing dialog
     * Creates and returns a dialog for editing HTML document head properties
     *
     * @method renderDialogHead
     * @description Creates a modal dialog with controls for:
     * - Document title editing
     * - Meta description management
     * - Full head section source code editing
     * - Movable dialog with drag handle
     * - Cancel and confirm buttons
     *
     * @returns {HTMLElement} The dialog DOM element
     */
    ncSimpleHtmlEditor.prototype.renderDialogHead = function () {
        var dialogHead =
            '<dialog id="ncsedt-dialog-head" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span id="ncsedt-dialog-title">Edit head</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <label for="ncsedt-dialog-head-title">Title:</label>' +
            '       <input id="ncsedt-dialog-head-title" class="title sbutton" type="text">' +
            '       <div class="separator"></div>' +
            '       <label for="ncsedt-dialog-head-description">Description:</label>' +
            '       <textarea id="ncsedt-dialog-head-description" rows="3" class="description sbutton" placeholder=" ( empty ) "></textarea>' +
            '       <div class="separator"></div>' +
            '       <div class="edit-all" style="display: none">' +
            '           <label for="ncsedt-dialog-head-all">Edit source code:</label>' +
            '           <textarea id="ncsedt-dialog-head-all" rows="3" class="all sbutton" placeholder=" ( empty ) "></textarea>' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton show-all"><img class="" src="' + this.options.buttons.code.icon + '" title="Edit code"> Edit all</button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogHead);

        return document.getElementById('ncsedt-dialog-head');
    };

    /**
     * Sets up event handlers for the head editing dialog
     *
     * @method setEventsDialogHead
     * @description Initializes all interactive elements in the head dialog:
     * - Cancel button to close dialog
     * - Show/hide full head source code editor
     * - Confirm button to apply changes
     *
     * @fires click - For various button interactions
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogHead = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-head .cancel").addEventListener('click', function () {
            _this.dialogHead.close();
        });

        document.querySelector("#ncsedt-dialog-head .show-all").addEventListener('click', function () {
            if (_this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display == "none") {
                _this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display = 'inline-block';
            } else {
                _this.dialogHead.querySelector('#ncsedt-dialog-head .edit-all').style.display = 'none';
            }
        });

        document.querySelector("#ncsedt-dialog-head .confirm").addEventListener('click', function () {
            _this.editHeadConfirm();
        });
    };

    /**
     * Opens and initializes the head editing dialog
     *
     * @method editHead
     * @description Opens the dialog for editing HTML document head:
     * - Retrieves current meta description
     * - Sets up dialog fields with current values
     * - Displays dialog with current head content
     *
     * @throws {Error} If editor is not in edit mode
     * @fires showModal - When dialog is displayed
     */
    ncSimpleHtmlEditor.prototype.editHead = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (document.head.querySelector('meta[name="description"]')) {
            var description = document.head.querySelector('meta[name="description"]').getAttribute("content");
        } else {
            var description = '';
        }

        this.dialogHead.querySelector('#ncsedt-dialog-head-title').value = document.title || 'pedo';
        this.dialogHead.querySelector('#ncsedt-dialog-head-description').value = description;
        this.dialogHead.querySelector('#ncsedt-dialog-head-all').value = document.head.innerHTML;

        if (!this.dialogHead.open) {
            this.dialogHead.showModal();
        }
    };

    /**
     * Confirms and applies changes from the head editing dialog
     *
     * @method editHeadConfirm
     * @description Commits the changes made in the head dialog:
     * - Updates document title if changed
     * - Updates meta description if changed
     * - Updates entire head content if modified
     * - Creates meta description tag if not present
     * - Maintains history for undo/redo
     *
     * @fires contentchanges - When head properties are updated
     */
    ncSimpleHtmlEditor.prototype.editHeadConfirm = function () {
        if (this.dialogHead.open) {
            this.dialogHead.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (document.head.querySelector('meta[name="description"]')) {
            var description = document.head.querySelector('meta[name="description"]').getAttribute("content");
        } else {
            var description = '';
        }

        var newtitle = this.dialogHead.querySelector('#ncsedt-dialog-head-title').value;
        var newdescription = this.dialogHead.querySelector('#ncsedt-dialog-head-description').value;
        var newhead = this.dialogHead.querySelector('#ncsedt-dialog-head-all').value
        var oldtitle = document.title;
        var oldescription = description;
        var oldhead = document.head.innerHTML;

        if (newhead != oldhead) {
            document.head.innerHTML = newhead;
        }

        if (newtitle != oldtitle) {
            document.title = newtitle;
        }

        if (newdescription != oldescription) {
            if (!document.head.querySelector('meta[name="description"]')) {
                var meta = document.createElement('meta');
                meta.setAttribute("name", "description");
                document.head.appendChild(meta);
            }

            this.historyForcePush('content', newdescription);
            document.head.querySelector('meta[name="description"]').setAttribute("content", newdescription);
        }
    };


})();

(function () {
    /**
     * Creates a movable element that can be dragged around the window
     *
     * @class ncSimpleMoveable
     * @param {string} movableSelector - CSS selector for the movable element
     * @param {string} draggerSelector - CSS selector for the drag handle element
     * @description Initializes drag functionality for dialogs and UI elements:
     * - Supports both mouse and touch interactions
     * - Handles window boundary constraints
     * - Maintains element position within viewport
     */
    window.ncSimpleMoveable = function (movableSelector, draggerSelector) {
        this.movable = document.querySelector(movableSelector);
        this.dragger = document.querySelector(draggerSelector);
        var supports = document.createElement('div');

        if ('ontouchstart' in supports) {
            this.movableOnTouch();
        } else {
            this.movableOnDrag();
        }
    }

    /**
     * Initializes mouse drag functionality for movable elements
     *
     * @method movableOnDrag
     * @description Sets up mouse event handlers for dragging:
     * - Mouse down to start drag
     * - Mouse move to update position
     * - Mouse up to end drag
     * - Constrains movement within window bounds
     * - Handles margin calculations
     *
     * @private
     * @fires mousedown - When drag starts
     * @fires mousemove - While dragging
     * @fires mouseup - When drag ends
     */
    ncSimpleMoveable.prototype.movableOnDrag = function () {
        var _this = this;
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        this.movable.style.position = 'fixed';
        this.dragger.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            var style = window.getComputedStyle(_this.movable);
            var marginTop = parseInt(style.getPropertyValue('margin-top'));
            var marginLeft = parseInt(style.getPropertyValue('margin-left'));
            _this.movable.style.margin = '0px';
            _this.movable.style.top = (_this.movable.offsetTop + marginTop) + "px";
            _this.movable.style.left = (_this.movable.offsetLeft + marginLeft) + "px";
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            _this.movable.style.top = (_this.movable.offsetTop - pos2) + "px";
            _this.movable.style.left = (_this.movable.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            var xDraggerOffset = _this.dragger.offsetLeft;
            var xOffset = _this.movable.offsetLeft + xDraggerOffset;
            var yDraggerOffset = _this.dragger.offsetTop;
            var yOffset = _this.movable.offsetTop + yDraggerOffset;
            var xMax = window.innerWidth - _this.dragger.offsetWidth;
            var yMax = window.innerHeight - _this.dragger.offsetHeight;
            var xMIn = 0;
            var yMin = 0;

            if (yOffset > yMax) {
                _this.movable.style.top = (yMax - yDraggerOffset) + 'px';
            }

            if (yOffset < yMin) {
                _this.movable.style.top = (yMin - yDraggerOffset) + 'px';
            }

            if (xOffset > xMax) {
                _this.movable.style.left = (xMax - xDraggerOffset) + 'px';
            }

            if (xOffset < xMIn) {
                _this.movable.style.left = (xMIn - xDraggerOffset) + 'px';
            }
        }
    };

    /**
     * Initializes touch functionality for movable elements
     *
     * @method movableOnTouch
     * @description Sets up touch event handlers for dragging:
     * - Touch move to update position
     * - Touch end to finalize position
     * - Handles viewport offset calculations
     * - Constrains movement within window bounds
     * - Supports mobile and touch-enabled devices
     *
     * @private
     * @fires touchmove - While dragging
     * @fires touchend - When drag ends
     */
    ncSimpleMoveable.prototype.movableOnTouch = function () {
        var _this = this;
        this.movable.style.position = 'fixed';

        this.dragger.addEventListener('touchmove', function (e) {
            e.preventDefault();
            var xOffset = _this.dragger.offsetLeft + Math.round(_this.dragger.offsetWidth / 2);
            var yOffset = _this.dragger.offsetTop + Math.round(_this.dragger.offsetHeight / 2);
            _this.movable.style.margin = '0px';
            var touchLocation = e.targetTouches[0];
            _this.movable.style.left = touchLocation.pageX - xOffset + 'px';
            _this.movable.style.top = touchLocation.pageY - window.pageYOffset - yOffset + 'px';
        });

        this.movable.addEventListener('touchend', function (e) {
            var xDraggerOffset = _this.dragger.offsetLeft;
            var xOffset = _this.movable.offsetLeft + xDraggerOffset;
            var yDraggerOffset = _this.dragger.offsetTop;
            var yOffset = _this.movable.offsetTop + yDraggerOffset;
            var xMax = window.innerWidth - _this.dragger.offsetWidth;
            var yMax = window.innerHeight - _this.dragger.offsetHeight;
            var xMIn = 0;
            var yMin = 0;

            if (yOffset > yMax) {
                _this.movable.style.top = (yMax - yDraggerOffset) + 'px';
            }

            if (yOffset < yMin) {
                _this.movable.style.top = (yMin - yDraggerOffset) + 'px';
            }

            if (xOffset > xMax) {
                _this.movable.style.left = (xMax - xDraggerOffset) + 'px';
            }

            if (xOffset < xMIn) {
                _this.movable.style.left = (xMIn - xDraggerOffset) + 'px';
            }
        });
    };
})();

/**
 * Auto-initialization module
 * Automatically initializes the editor when the data-ncsheditorauto attribute is present
 *
 * @module AutoInit
 * @description Handles automatic initialization of the editor:
 * - Checks for data-ncsheditorauto attribute
 * - Waits for DOM content to be loaded
 * - Creates and starts editor instance if not already present
 */
(function () {
    if (document.currentScript.dataset.ncsheditorauto) {
        window.addEventListener('DOMContentLoaded', function () {
            if (!("ncSHEditor" in window)) {
                ncSHEditor = new ncSimpleHtmlEditor();
                ncSHEditor.start();
            }
        });
    }
})();
