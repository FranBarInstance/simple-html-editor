/*!
 * Simple HTML Editor - Editor UI Module
 * UI rendering and event handling
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {

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

})();
