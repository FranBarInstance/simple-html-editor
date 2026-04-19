/*!
 * Simple HTML Editor - Code Dialog Module
 * Source code editing dialog
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
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
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
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

        document.querySelector("#ncsedt-dialog-code .ko").addEventListener('click', function () {
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

        this.dialogCode.querySelector('textarea.code').value = this.focusedElement.outerHTML;

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
})();
