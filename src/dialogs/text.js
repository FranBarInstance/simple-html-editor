/*!
 * Simple HTML Editor - Text Dialog Module
 * Text content editing dialog
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Edit text content dialog
     */
    ncSimpleHtmlEditor.prototype.renderDialogText = function () {
        var _this = this;
        var dialogText =
            '<dialog id="ncsedt-dialog-text" class="ncsedt-dialog">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span>Edit text</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <textarea class="text sbutton" placeholder=" ( empty ) "></textarea>' +
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
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogText);

        return document.getElementById('ncsedt-dialog-text');
    };

    /**
     * Edit text dialog events
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogText = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-text .cancel").addEventListener('click', function () {
            _this.dialogText.close();
        });

        document.querySelector("#ncsedt-dialog-text .ko").addEventListener('click', function () {
            _this.dialogText.close();
        });

        document.querySelector("#ncsedt-dialog-text .parent").addEventListener('click', function () {
            _this.editTextParent();
        });

        document.querySelector("#ncsedt-dialog-text .child").addEventListener('click', function () {
            _this.editTextChild();
        });

        document.querySelector("#ncsedt-dialog-text .confirm").addEventListener('click', function () {
            _this.editTextConfirm();
        });

        document.querySelector("#ncsedt-dialog-text .agent").addEventListener('click', function () {
            if (_this.dialogText.open) {
                _this.dialogText.close();
            }

            _this.command(_this.options.buttons.agent)
        });

        document.querySelector("#ncsedt-dialog-text .link").addEventListener('click', function () {
            if (_this.dialogText.open) {
                _this.dialogText.close();
            }

            _this.command(_this.options.buttons.link)
        });

        document.querySelector("#ncsedt-dialog-text .image").addEventListener('click', function () {
            if (_this.dialogText.open) {
                _this.dialogText.close();
            }

            _this.setFocus(_this.focusedElement.querySelector('img'));
            _this.command(_this.options.buttons.image)
        });
    };

    /**
     * Edit text dialog commands
     */
    ncSimpleHtmlEditor.prototype.editText = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.querySelector('img') || this.focusedElement.parentElement.querySelector('img')) {
            this.dialogText.querySelector('#ncsedt-dialog-text .image').style.visibility = "visible";
        } else {
            this.dialogText.querySelector('#ncsedt-dialog-text .image').style.visibility = "hidden";
        }

        if (window.getSelection().toString() || this.focusedElement.querySelector('a') || this.focusedElement.parentElement.querySelector('a')) {
            this.dialogText.querySelector('#ncsedt-dialog-text .link').style.visibility = "visible";
        } else {
            this.dialogText.querySelector('#ncsedt-dialog-text .link').style.visibility = "hidden";
        }

        // Find the first (deepest) element that contains text
        this.textEditTarget = this.findFirstTextContainer(this.focusedElement);
        this.dialogText.querySelector('textarea.text').value = this.textEditTarget.innerHTML;

        if (!this.dialogText.open) {
            this.dialogText.showModal();
        }
    };

    ncSimpleHtmlEditor.prototype.findFirstTextContainer = function (element) {
        // If element has no children, return it
        if (!element.firstElementChild) {
            return element;
        }

        // Check all children recursively to find the deepest one with text
        var children = element.children;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            // Skip script/style elements
            if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') {
                continue;
            }
            // If child has text content, recurse into it
            if (child.textContent && child.textContent.trim().length > 0) {
                return this.findFirstTextContainer(child);
            }
        }

        // If no child has text, return the element itself
        return element;
    };

    ncSimpleHtmlEditor.prototype.editTextConfirm = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.dialogText.open) {
            this.dialogText.close();
        }

        if (this.textEditTarget && this.textEditTarget.isContentEditable) {
            if (this.textEditTarget.innerHTML !== this.dialogText.querySelector('textarea.text').value) {
                this.textEditTarget.innerHTML = this.dialogText.querySelector('textarea.text').value;
            }
        }
    };

    ncSimpleHtmlEditor.prototype.editTextParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editText();
        }
    };

    ncSimpleHtmlEditor.prototype.editTextChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.isContentEditable) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.editText();
        }
    };

    ncSimpleHtmlEditor.prototype.editTextPrev = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElementPrev && this.focusedElementPrev.isContentEditable) {
            this.setFocus(this.focusedElementPrev);
            this.editText();
        }
    };
})();
