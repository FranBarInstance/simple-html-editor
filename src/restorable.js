/*!
 * Simple HTML Editor v2.0.1 - Restorable Module
 * State management for saving and restoring element states
 *
 * @author FranBarInstance
 * @license MIT
 * @version 2.0.1
 */

(function () {
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
