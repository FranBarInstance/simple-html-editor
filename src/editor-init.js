/*!
 * Simple HTML Editor v2.0.1 - Editor Init Module
 * Editor initialization and core lifecycle
 *
 * @author FranBarInstance
 * @license MIT
 * @version 2.0.1
 */

(function () {
    const MAX_IMAGE_SIZE_BYTES = 1200000; // 1.2MB - Large base64 images degrade DOM performance
    const MAX_ALLOWED_IMAGE_SIZE_BYTES = 5000000; // 5MB absolute maximum
    const MIN_GROUPING_WINDOW_MS = 100; // Minimum time window for grouping mutations
    const TIME_SCALE_FACTOR = 10000; // Time scaling factor for mutation timestamps


    /**
     * Simple HTML Editor main class
     */
    window.ncSimpleHtmlEditor = function (options = {}) {
        var _this = this;

        this.agent = null;

        /**
         * Reference to the global restorable object for state management
         */
        this.restorable = window.ncsedtRestorableObj || new ncsedtRestorable();

        /**
         * Editor state object
         * Maintains the current state of the editor including editing mode,
         * clipboard contents, and history stacks
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
         */
        this.validateOptions(options);

        /**
         * Default configuration options
         */
        const defaults = {
            editableContentSelector: "body",
            usesLinearUndoHistory: true,
            mutationGroupingWindowMs: 200,

            defaultModel: {
                id: 'default-ollama',
                name: 'Local Ollama',
                provider: 'openai-compatible',
                model: 'gemma4:e2b',
                apiKey: '',
                baseURL: 'http://localhost:11434/v1',
                systemPrompt: 'Never modify the element with id ncsedt-implement. Only process and return what comes after INPUT:'
            },

            agentOptions: {
                storageType: 'local',
                storageKey: 'ncsedt_agent_config'
            },

            additionalPrompts: {
                "only replacement": 'No return markdown, no code blocks, no comments, no explanations. Returns HTML or plain text, depending on the INPUT content.'
            },

            customPrompts: {
                "translate": 'Translate to English',
                "traduce": 'Traduce a Español',
            },

            toolbarCols: null,

            /**
             * Timeout in milliseconds to disable the save button after clicking
             * Prevents accidental double-saves
             */
            saveTimeout: 500,

            maxImageSizeBytes: MAX_IMAGE_SIZE_BYTES,

            /**
             * Determines which features are available and how they are presented
             */
            toolbar: ['edit', 'undo', 'redo', 'up', 'down', 'previous', 'next', 'cut', 'copy', 'paste', 'head', 'code', 'text', 'link', 'agent', 'image', 'save', 'profiles', 'mcp', 'github'],

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
                edit: {
                    name: 'edit',
                    icon: ICON_EDIT_ON,
                    icon2: ICON_EDIT_OFF,
                    title: 'Edit',
                    disabled: function () { return _this.isEditButtonDisabled() },
                    action: function () { _this.editToggle() }
                },
                code: {
                    name: 'code',
                    icon: ICON_CODE,
                    title: 'Code',
                    disabled: function () { return _this.isCodeButtonDisabled() },
                    action: function () { _this.editCode() }
                },
                text: {
                    name: 'text',
                    icon: ICON_TEXT,
                    title: 'Edit text',
                    disabled: function () { return _this.isTextButtonDisabled() },
                    action: function () { _this.editText() }
                },
                undo: {
                    name: 'undo',
                    icon: ICON_UNDO,
                    title: 'Undo',
                    disabled: function () { return _this.isUndoButtonDisabled() },
                    action: function () { _this.undo() }
                },
                redo: {
                    name: 'redo',
                    icon: ICON_REDO,
                    title: 'Redo',
                    disabled: function () { return _this.isRedoButtonDisabled() },
                    action: function () { _this.redo() }
                },
                up: {
                    name: 'up',
                    icon: ICON_ARROW_UP,
                    title: 'Select up',
                    disabled: function () { return _this.isUpButtonDisabled() },
                    action: function () { _this.up() }
                },
                down: {
                    name: 'down',
                    icon: ICON_ARROW_DOWN,
                    title: 'Selenct down',
                    disabled: function () { return _this.isDownButtonDisabled() },
                    action: function () { _this.down() }
                },
                previous: {
                    name: 'previous',
                    icon: ICON_ARROW_LEFT,
                    title: 'Select previous sibling',
                    disabled: function () { return _this.isPreviousButtonDisabled() },
                    action: function () { _this.previous() }
                },
                next: {
                    name: 'next',
                    icon: ICON_ARROW_RIGHT,
                    title: 'Select next sibling',
                    disabled: function () { return _this.isNextButtonDisabled() },
                    action: function () { _this.next() }
                },
                cut: {
                    name: 'cut',
                    icon: ICON_CUT,
                    title: 'Cut',
                    disabled: function () { return _this.isCutButtonDisabled() },
                    action: function () { _this.cut() }
                },
                copy: {
                    name: 'copy',
                    icon: ICON_COPY,
                    title: 'Copy',
                    disabled: function () { return _this.isCopyButtonDisabled() },
                    action: function () { _this.copy() }
                },
                paste: {
                    name: 'paste',
                    icon: ICON_PASTE,
                    title: 'Paste',
                    disabled: function () { return _this.isPasteButtonDisabled() },
                    action: function () { _this.paste() }
                },
                link: {
                    name: 'link',
                    icon: ICON_LINK,
                    title: 'Link',
                    disabled: function () { return _this.isLinkButtonDisabled() },
                    action: function () { _this.editLink() }
                },
                image: {
                    name: 'image',
                    icon: ICON_IMAGE,
                    title: 'Image',
                    disabled: function () { return _this.isImageButtonDisabled() },
                    action: function () { _this.editImage() }
                },
                head: {
                    name: 'head',
                    icon: ICON_HEAD,
                    title: 'Edit head',
                    disabled: function () { return _this.isHeadButtonDisabled() },
                    action: function () { _this.editHead() }
                },
                save: {
                    name: 'save',
                    icon: ICON_SAVE_ON,
                    icon2: ICON_SAVE_OFF,
                    title: 'Save',
                    disabled: function () { return _this.isSaveButtonDisabled() },
                    action: function () { _this.save() }
                },
                agent: {
                    name: 'agent',
                    icon: ICON_AGENT,
                    title: 'AI Agent',
                    disabled: function () { return _this.isAgentButtonDisabled() },
                    action: function () { _this.editAgent() }
                },
                github: {
                    name: 'github',
                    icon: ICON_GITHUB,
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
                },
                profiles: {
                    name: 'profiles',
                    icon: ICON_PROFILE,
                    title: 'AI Profiles',
                    disabled: function () { return false },
                    action: function () {
                        _this.agent.openConfigPanel({ agent: _this.agent });
                    }
                },
                mcp: {
                    name: 'mcp',
                    icon: ICON_MCP,
                    title: 'AI MCP Servers',
                    disabled: function () { return false },
                    action: function () {
                        _this.agent.openMcpPanel({ agent: this.agent });
                    }
                }
            },
            draggerIcon: ICON_DRAG
        }

        this.options = this.deepMerge(defaults, options);
        this.options.mutationGroupingWindowMs = this.options.mutationGroupingWindowMs / TIME_SCALE_FACTOR;

        // Create agent with custom options
        this.agent = ClientAgent.createAgent(this.options.agentOptions || {})

        // Initialize default model profile if provided
        if (this.options.defaultModel && this.options.defaultModel.id) {
            var profile = this.options.defaultModel;
            this.agent.saveProfile(profile.id, profile);
            this.agent.setActiveProfile(profile.id);
        }

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

        this.editingEnabled = null;
        this.clipboard = null;
        this.editable = document.querySelector(this.options.editableContentSelector);
        this.editableInBody();
        this.wrapEditable();
        this.implement = document.querySelector('#ncsedt-implement');
        this.implementToLastBody();
        this.focusedElement = this.editable;
        this.previousFocusedElement = this.focusedElement;
        this.observer = this.setObserver();
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

    ncSimpleHtmlEditor.prototype.getEditable = function (target, source) {
        return this.editable;
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
        this.dialogText = this.renderDialogText();
        this.dialogImage = this.renderDialogImage();
        this.dialogLink = this.renderDialogLink();
        this.dialogHead = this.renderDialogHead();
        this.dialogAgent = this.renderDialogAgent();
        this.movable('#ncsedt-toolbar', '#ncsedt-toolbar-dragger');
        this.movable('#ncsedt-dialog-code', '#ncsedt-dialog-code .dragger');
        this.movable('#ncsedt-dialog-text', '#ncsedt-dialog-text .dragger');
        this.movable('#ncsedt-dialog-image', '#ncsedt-dialog-image .dragger');
        this.movable('#ncsedt-dialog-link', '#ncsedt-dialog-link .dragger');
        this.movable('#ncsedt-dialog-head', '#ncsedt-dialog-head .dragger');
        this.movable('#ncsedt-dialog-agent', '#ncsedt-dialog-agent .dragger');
        this.setEvents();
        this.setEventsToolbar();
        this.setEventsDialogCode();
        this.setEventsDialogText();
        this.setEventsDialogImage();
        this.setEventsDialogLink();
        this.setEventsDialogHead();
        this.setEventsDialogAgent();
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

    ncSimpleHtmlEditor.prototype.editToggle = function () {
        if (this.editingEnabled) {
            this.editOff();
        } else {
            this.editOn();
        }
    };

    /**
     * Validate editor options
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

        if (options.mutationGroupingWindowMs) {
            options.mutationGroupingWindowMs = Math.max(MIN_GROUPING_WINDOW_MS, options.mutationGroupingWindowMs);
        }

        if (options.maxImageSizeBytes) {
            options.maxImageSizeBytes = Math.min(options.maxImageSizeBytes, MAX_ALLOWED_IMAGE_SIZE_BYTES);
        }

    };

})();
