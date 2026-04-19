/*!
 * Simple HTML Editor v2.0.1 - Editor Content Module
 * Content saving, serialization, undo/redo history
 *
 * @author FranBarInstance
 * @license MIT
 * @version 2.0.1
 */

(function () {
    const MIN_GROUPING_WINDOW_MS = 100; // Minimum time window for grouping mutations
    const TIME_SCALE_FACTOR = 10000; // Time scaling factor for mutation timestamps

    /**
     * Download html with the current changes.
     * You may need to replace this function with your own.
     */
    ncSimpleHtmlEditor.prototype.save = function () {
        var _this = this;
        var templatesource = this.getDocumentHTML();
        var download = document.createElement('a');
        var btnsSave = document.querySelectorAll('.ncsedt-toolbar-btn-save img');
        this.saving = true;
        this.editOff();

        for (button of btnsSave) {
            button.src = this.options.buttons.save.icon2;
            button.parentNode.disabled = true;
        }

        download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(templatesource));
        download.setAttribute('download', 'index.html');
        this.container.appendChild(download);
        download.click();

        setTimeout(function () {
            _this.saving = false;
            for (button of btnsSave) {
                button.src = _this.options.buttons.save.icon;
                button.parentNode.disabled = false;
            }
        }, this.options.saveTimeout);

        this.container.removeChild(download);
        this.editOn();
    };

    /**
     * Get the HTML with the current changes.
     * If no selector is indicated, the complete document.
     */
    ncSimpleHtmlEditor.prototype.getDocumentHTML = function (selector = null) {
        var html = '';

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        this.restorable.restore();
        this.removable();

        if (selector) {
            html = document.querySelector(selector).innerHTML;
        } else {
            html = new XMLSerializer().serializeToString(document);
        }

        this.undoRemovable();
        this.restorable.undoRestore();

        return this.ncsedtRemover(html);
    };

    /**
     * Removes the code from the HTML editor.
     */
    ncSimpleHtmlEditor.prototype.ncsedtRemover = function (html) {

        /*
         * Everything between <!-- ncsedt-implement:before --> and </ncsedt-editable>
         * was created dynamically and must be removed.
         */
        html = html.replace(/<ncsedt-removable>\s*<\/ncsedt-removable>/gsi, '');
        html = html.replace(/<!--\s*ncsedt-implement:before\s*-->.*<\/ncsedt-editable>/gsi, '</ncsedt-editable>');
        html = html.replace(/<!--\s*ncsedt-implement:begin\s*-->.*<!--\s*ncsedt-implement:end\s*-->/gsi, '');
        html = html.replace(/<!--\s*ncsedt-container:begin\s*-->.*<!--\s*ncsedt-container:end\s*-->/gsi, '');
        html = html.replace(/<\/?ncsedt-editable[^>]*>/gsi, '');

        return html;
    };

    ncSimpleHtmlEditor.prototype.removable = function () {
        var _this = this;
        var count = 0;
        this.removableHtml = [];

        document.querySelectorAll('ncsedt-removable').forEach(function (node) {
            _this.removableHtml[count++] = node.innerHTML;
            node.innerHTML = '';
        });
    };

    ncSimpleHtmlEditor.prototype.undoRemovable = function () {
        var _this = this;
        var count = 0;

        document.querySelectorAll('ncsedt-removable').forEach(function (node) {
            node.innerHTML = _this.removableHtml[count++];
        });
    };

    ncSimpleHtmlEditor.prototype.undo = function () {
        this.undoredo(true);
    };

    ncSimpleHtmlEditor.prototype.redo = function () {
        this.undoredo(false);
    };

    /**
     * When there are changes.
     */
    ncSimpleHtmlEditor.prototype.setEventEditorChanges = function () {
        var _this = this;

        document.addEventListener('editorchanges', function () {
            _this.setDisabledBtns();
        });
    };

    /**
     * Observer.
     * Main use is undo/redo history
     */
    ncSimpleHtmlEditor.prototype.setObserver = function () {

        /*
            The edited template may change attributes for design reasons,
            class changes in nav, menus, etc.

            Only mutations that originate from the element being edited
            (_this.focusedElement.contains(mutation.target)) are added to the
            history for "attributes".

            Only the changes forced by the application (historyforce) are
            added to the history for "attributes".
        */

        return new MutationObserver(function (mutations) {
            if (!_this.editingEnabled || _this.ignoreMutations) {
                return;
            }

            mutations.forEach(function (mutation) {
                mutation.time = Date.now() / TIME_SCALE_FACTOR;

                switch (mutation.type) {
                    case 'characterData':
                        mutation.newValue = mutation.target.nodeValue;
                        _this.historyUndo.push(mutation);
                        _this.resetLinearHistory();
                        document.dispatchEvent(new Event("contentchanges"));
                        break
                    case 'attributes':
                        var attrName = mutation.attributeName;
                        var attrValue = mutation.target.getAttribute(mutation.attributeName);
                        if ((_this.focusedElement.contains(mutation.target) || document.head.contains(mutation.target)) && _this.historyForceCheck(attrName, attrValue)) {
                            mutation.newValue = attrValue;
                            _this.historyUndo.push(mutation);
                            _this.historyForceRemove(attrName, attrValue);
                            _this.resetLinearHistory();
                            document.dispatchEvent(new Event("contentchanges"));
                        }

                        break
                    case 'childList':
                        _this.historyUndo.push(mutation);
                        _this.resetLinearHistory();
                        document.dispatchEvent(new Event("contentchanges"));
                        break
                }
            });

            document.dispatchEvent(new Event("editorchanges"));
        });


    };

    /**
     * Activate the observer.
     * For editable, head if button head is present in tootlbar.
     */
    ncSimpleHtmlEditor.prototype.observe = function () {
        this.observer.observe(this.editable, {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
            attributeOldValue: true,
            characterDataOldValue: true
        });

        if (this.options.toolbar.includes('head')) {
            this.observer.observe(document.head, {
                attributes: true,
                characterData: true,
                childList: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });
        }
    };

    ncSimpleHtmlEditor.prototype.resetLinearHistory = function () {
        if (this.historyRedo.length && this.options.usesLinearUndoHistory) {
            this.historyRedo = [];
        }
    }

    /**
     * Attributes require authorization for mutations.
     * Attribute name and value.
     */
    ncSimpleHtmlEditor.prototype.historyForcePush = function (attr, val) {
        var force = attr + ':' + val.toString();
        this.historyForce.push(force);
    };

    /**
     * Check an attribute change.
     * Attribute name and value.
     */
    ncSimpleHtmlEditor.prototype.historyForceCheck = function (attr, val) {
        var value = val || '';
        var force = attr + ':' + value.toString();
        return this.historyForce.includes(force);
    };

    /**
     * You should not call this function.
     */
    ncSimpleHtmlEditor.prototype.historyForceRemove = function (attr, val) {
        var force = attr + ':' + val.toString();

        if (this.historyForce.includes(force)) {
            this.historyForce.splice(this.historyForce.indexOf(force), 1);
        }
    };

    /**
     * undo/redo action, undo if undo=true, else redo.
     */
    ncSimpleHtmlEditor.prototype.undoredo = function (undo) {
        this.observer.disconnect();
        var previousTime = null;
        var groupingByTime = true; // always true, only for readability

        /*
            The editor can cause several mutations that correspond to a single
            update, mutations performed at the same time or in a margin of
            "groupingHistory" time correspond to the same update.
        */
        while (groupingByTime) {
            if (undo) {
                if (!this.historyUndo.length) {
                    break;
                }

                var mutation = this.historyUndo.pop();
                this.historyRedo.push(mutation);

                if (previousTime && mutation.time + _this.options.mutationGroupingWindowMs < previousTime) {
                    /**
                     * End group, restore and break
                     */
                    this.historyUndo.push(mutation);
                    this.historyRedo.pop();
                    break;
                }
            } else {
                if (!this.historyRedo.length) {
                    break;
                }

                var mutation = this.historyRedo.pop();
                this.historyUndo.push(mutation);

                if (previousTime && mutation.time - _this.options.mutationGroupingWindowMs > previousTime) {
                    /**
                     * End group, restore and break
                     */
                    this.historyRedo.push(mutation);
                    this.historyUndo.pop();
                    break;
                }
            }

            switch (mutation.type) {
                case 'characterData':
                    var parentView = mutation.target.parentElement.parentElement.parentElement || mutation.target.parentElement.parentElement || mutation.target.parentElement
                    parentView.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target.parentElement);
                    mutation.target.textContent = undo ? mutation.oldValue : mutation.newValue;
                    break;

                case 'attributes':
                    mutation.target.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target);
                    var value = undo ? mutation.oldValue : mutation.newValue

                    if (value === null) {
                        mutation.target.removeAttribute(mutation.attributeName);
                    } else {
                        mutation.target.setAttribute(mutation.attributeName, value);
                    }

                    break;

                case 'childList':
                    mutation.target.scrollIntoView({ block: "center" });
                    this.setFocus(mutation.target);
                    var addNodes = undo ? mutation.removedNodes : mutation.addedNodes;
                    var removeNodes = undo ? mutation.addedNodes : mutation.removedNodes;

                    Array.from(addNodes).forEach(mutation.nextSibling ? (node) => {
                        mutation.nextSibling.parentNode.insertBefore(node, mutation.nextSibling);
                    } : (node) => {
                        mutation.target.appendChild(node);
                    });

                    Array.from(removeNodes).forEach(function (node) {
                        node.parentNode.removeChild(node);
                    });

                    break;
            }

            previousTime = mutation.time;
        }

        this.observe();
        document.dispatchEvent(new Event("editorchanges"));
        document.dispatchEvent(new Event("contentchanges"));
    };

})();
