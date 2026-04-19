/*!
 * Simple HTML Editor - Auto-Initialization Module
 * Automatically initializes the editor when the data-ncsheditorauto attribute is present
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

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
