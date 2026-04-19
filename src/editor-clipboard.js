/*!
 * Simple HTML Editor - Editor Clipboard Module
 * Copy, cut and paste functionality
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {

    /**
     * Get clipboard content, can be null.
     */
    ncSimpleHtmlEditor.prototype.getClipboard = function (target, source) {
        return this.clipboard;
    }

    ncSimpleHtmlEditor.prototype.copy = function () {
        if (this.focusedElement != this.editable) {
            this.clipboard = this.focusedElement.outerHTML;
            document.dispatchEvent(new Event("editorchanges"));
        }
    };

    ncSimpleHtmlEditor.prototype.cut = function () {
        if (this.focusedElement != this.editable) {
            this.clipboard = this.focusedElement.outerHTML;
            this.focusedElement.parentElement.removeChild(this.focusedElement);
            this.setFocus(this.focusedElement.parentElement);
        }
    };

    ncSimpleHtmlEditor.prototype.paste = function () {
        if (this.clipboard && this.focusedElement != this.editable) {
            this.focusedElement.insertAdjacentHTML('afterend', this.clipboard);
        }
    };

})();
