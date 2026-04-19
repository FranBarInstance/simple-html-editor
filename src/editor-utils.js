/*!
 * Simple HTML Editor - Editor Utils Module
 * Button state helpers and state checkers
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {

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

    ncSimpleHtmlEditor.prototype.isTextButtonDisabled = function () {
        return !this.editingEnabled;
    };

})();
