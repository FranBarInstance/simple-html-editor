/*!
 * Simple HTML Editor - AI Agent Dialog Module
 * AI agent editing dialog
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Renders the AI agent dialog
     */
    ncSimpleHtmlEditor.prototype.renderDialogAgent = function () {
        var dialogAgent =
            '<dialog id="ncsedt-dialog-agent" class="ncsedt-dialog" style="width: 600px;">' +
            '    <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton dragger"><img class="" src="' + this.options.draggerIcon + '" title="Move"> <span>AI Agent</span></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton cancel"> <b>&Cross;</b> </button>' +
            '       </div>' +
            '   </div>' +
            '   <div class="body">' +
            '       <div class="code-section">' +
            '           <label>Current Code:</label>' +
            '           <textarea class="code sbutton" placeholder="Current HTML code"></textarea>' +
            '       </div>' +
            '       <div class="separator"></div>' +
            '       <div class="prompt-section">' +
            '           <label>AI Prompt:</label>' +
            '           <textarea id="ncsedt-dialog-agent-prompt" class="prompt sbutton" placeholder="Enter your instructions for the AI..."></textarea>' +
            '           <div class="ai-config">' +
            '               <div class="backend-selector">' +
            '                   <button id="ncsedt-dialog-agent-config" type="button" class="sbutton config-models">&#9881;</button>' +
            '                   <select id="ncsedt-dialog-agent-additional-prompt" class="sbutton" style="padding: 8px">' +
            '                       <option value="none">None</option>';

        for (const [key, value] of Object.entries(this.options.additionalPrompts)) {
            const selected = key === "only replacement" ? ' selected="selected"' : '';
            dialogAgent += `<option value="${key}"${selected}>${key}</option>`;
        }

        dialogAgent += '                   </select>' +
            '                   <select id="ncsedt-dialog-agent-custom-prompt" class="sbutton" style="padding: 8px">' +
            '                       <option value="none">Custom prompt</option>';;

        for (const [key, value] of Object.entries(this.options.customPrompts)) {
            dialogAgent += `<option value="${key}">${key}</option>`;
        }

        dialogAgent += '                   </select>' +
            '                   <button type="button" id="ncsedt-dialog-agent-execute" class="sbutton execute-ai" style="float: right;">Go!</button>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="separator"></div>' +
            '       <div class="response-section">' +
            '           <label>AI Response:</label>' +
            '           <textarea id="ncsedt-dialog-agent-response" class="response sbutton" placeholder="AI response will appear here..." readonly></textarea>' +
            '           <div class="ai-actions">' +
            '               <button type="button" class="sbutton copy-response">Copy</button>' +
            '               <button type="button" class="sbutton apply-response">Apply Changes</button>' +
            '               <button type="button" class="sbutton apply-and-close">Apply and Close</button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '   <div class="ncsedt-btns">' +
            '       <div class="ncsedt-btns-left">' +
            '           <button type="button" class="sbutton parent" title="Find parent">&Uparrow;</button>' +
            '           <button type="button" class="sbutton child" title="Find child">&Downarrow;</button>' +
            '           <button type="button" class="sbutton go-code" title="Edit code"><img class="" src="' + this.options.buttons.code.icon + '" ></button>' +
            '       </div>' +
            '       <div class="ncsedt-btns-right">' +
            '           <button type="button" class="sbutton ko">&Cross;</button>' +
            '           <button type="button" class="sbutton confirm">&check; Ok</button>' +
            '       </div>' +
            '   </div>' +
            '</dialog>';

        this.container.insertAdjacentHTML('beforeend', dialogAgent);
        return document.getElementById('ncsedt-dialog-agent');
    };

    /**
     * Sets up event handlers for the AI agent dialog
     */
    ncSimpleHtmlEditor.prototype.setEventsDialogAgent = function () {
        var _this = this;

        document.getElementById('ncsedt-dialog-agent-custom-prompt').addEventListener('change', function() {
            const customPromptKey = this.value;
            const promptTextarea = document.getElementById('ncsedt-dialog-agent-prompt');

            if (customPromptKey !== 'none' && _this.options.customPrompts[customPromptKey]) {
                promptTextarea.value = _this.options.customPrompts[customPromptKey];
            }
        });

        document.querySelector("#ncsedt-dialog-agent .config-models").addEventListener('click', function () {
            _this.openAgentConfigWithState();
        });

        document.querySelector("#ncsedt-dialog-agent .cancel").addEventListener('click', function () {
            _this.dialogAgent.close();
        });

        document.querySelector("#ncsedt-dialog-agent .ko").addEventListener('click', function () {
            _this.dialogAgent.close();
        });

        document.querySelector("#ncsedt-dialog-agent .confirm").addEventListener('click', function () {
            _this.editAgentConfirm();
        });

        document.querySelector("#ncsedt-dialog-agent .parent").addEventListener('click', function () {
            _this.editAgentParent();
        });

        document.querySelector("#ncsedt-dialog-agent .child").addEventListener('click', function () {
            _this.editAgentChild();
        });

        document.querySelector("#ncsedt-dialog-agent .execute-ai").addEventListener('click', function () {
            var btn = document.getElementById('ncsedt-dialog-agent-execute');
            if (btn.textContent === 'Stop') {
                _this.stopAIGeneration();
            } else {
                _this.executeAIPrompt();
            }
        });

        document.querySelector("#ncsedt-dialog-agent .go-code").addEventListener('click', function () {
            if (_this.dialogAgent.open) {
                _this.dialogAgent.close();
            }

            _this.command(_this.options.buttons.code)
        });

        document.querySelector("#ncsedt-dialog-agent .apply-response").addEventListener('click', function () {
            var response = document.getElementById('ncsedt-dialog-agent-response').value;
            document.querySelector('#ncsedt-dialog-agent .code').value = response;
        });

        document.querySelector("#ncsedt-dialog-agent .apply-and-close").addEventListener('click', function () {
            var response = document.getElementById('ncsedt-dialog-agent-response').value;
            document.querySelector('#ncsedt-dialog-agent .code').value = response;
            _this.editAgentConfirm();
        });

        document.querySelector("#ncsedt-dialog-agent .copy-response").addEventListener('click', function () {
            var responseTextarea = document.getElementById('ncsedt-dialog-agent-response');
            responseTextarea.select();
            responseTextarea.setSelectionRange(0, 99999);
            try {
                navigator.clipboard.writeText(responseTextarea.value);
            } catch (err) {
                console.error('Error clipboard: ', err);
            }
        });
    };

    /**
     * Opens and initializes the AI agent dialog
     */
    ncSimpleHtmlEditor.prototype.editAgent = function () {
        if (!this.editingEnabled) {
            return;
        }

        this.currentSelection = window.getSelection();
        this.currentRange = this.currentSelection.getRangeAt(0);
        this.dialogAgent.querySelector('textarea.code').value = this.focusedElement.innerHTML;

        if (!this.dialogAgent.open) {
            this.dialogAgent.showModal();
        }
    };

    /**
     * Confirms and applies changes from the agent dialog
     */
    ncSimpleHtmlEditor.prototype.editAgentConfirm = function () {
        if (this.dialogAgent.open) {
            this.dialogAgent.close();
        }

        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.isContentEditable) {
            if (this.focusedElement.innerHTML != this.dialogAgent.querySelector('textarea.code').value) {
                this.focusedElement.innerHTML = this.dialogAgent.querySelector('textarea.code').value;
            }
        }
    };

    /**
     * Moves focus to parent element in agent dialog
     */
    ncSimpleHtmlEditor.prototype.editAgentParent = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.parentElement && this.focusedElement.parentElement.isContentEditable) {
            this.setFocus(this.focusedElement.parentElement);
            this.editAgent();
        }
    };

    /**
     * Moves focus to child element in agent dialogt
     */
    ncSimpleHtmlEditor.prototype.editAgentChild = function () {
        if (!this.editingEnabled) {
            return;
        }

        if (this.focusedElement.firstElementChild && this.focusedElement.firstElementChild.isContentEditable) {
            this.setFocus(this.focusedElement.firstElementChild);
            this.editAgent();
        }
    };

    /**
     * Opens config panel while preserving agent dialog state
     */
    ncSimpleHtmlEditor.prototype.openAgentConfigWithState = function () {
        var _this = this;

        // Save current dialog state
        var savedState = {
            code: document.querySelector('#ncsedt-dialog-agent .code').value,
            prompt: document.getElementById('ncsedt-dialog-agent-prompt').value,
            response: document.getElementById('ncsedt-dialog-agent-response').value
        };

        // Close agent dialog
        if (this.dialogAgent.open) {
            this.dialogAgent.close();
        }

        // Open config panel
        this.agent.openConfigPanel({ agent: this.agent });

        // Wait for config panel to close, then restore agent dialog
        var checkInterval = setInterval(function () {
            var overlay = document.querySelector('.client-agent-js-profile-overlay');
            if (!overlay) {
                clearInterval(checkInterval);
                // Config panel closed, restore agent dialog
                _this.dialogAgent.showModal();
                document.querySelector('#ncsedt-dialog-agent .code').value = savedState.code;
                document.getElementById('ncsedt-dialog-agent-prompt').value = savedState.prompt;
                document.getElementById('ncsedt-dialog-agent-response').value = savedState.response;
            }
        }, 100);
    };
})();
