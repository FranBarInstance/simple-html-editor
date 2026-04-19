/*!
 * Simple HTML Editor - Link Dialog Module
 * Link editing dialog
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Renders the link editing dialog
     * Creates and returns a dialog for editing link properties and attributes
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
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogLink);

        return document.getElementById('ncsedt-dialog-link');
    };

    /**
     * Sets up event handlers for the link editing dialog
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogLink = function () {
        var _this = this;

        document.querySelector("#ncsedt-dialog-link .cancel").addEventListener('click', function () {
            _this.dialogLink.close();
        });

        document.querySelector("#ncsedt-dialog-link .ko").addEventListener('click', function () {
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
})();
