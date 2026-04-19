/*!
 * Simple HTML Editor v2.0.1 - Editor Navigation Module
 * Element navigation (up, down, previous, next)
 *
 * @author FranBarInstance
 * @license MIT
 * @version 2.0.1
 */

(function () {

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

})();
