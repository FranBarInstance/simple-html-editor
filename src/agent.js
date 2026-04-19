/*!
 * Simple HTML Editor - AI Module
 * AI streaming with ClientAgentJS
 *
 * https://github.com/FranBarInstance/simple-html-edit
 */

(function () {
    /**
     * Executes AI prompt using ClientAgentJS with streaming
     */
    ncSimpleHtmlEditor.prototype.executeAIPrompt = async function () {
        var prompt = document.getElementById('ncsedt-dialog-agent-prompt').value;
        var additionalPromptSelect = document.getElementById('ncsedt-dialog-agent-additional-prompt');
        var additionalPromptKey = additionalPromptSelect.options[additionalPromptSelect.selectedIndex].value;
        var currentCode = document.querySelector('#ncsedt-dialog-agent .code').value;
        var responseTextarea = document.getElementById('ncsedt-dialog-agent-response');

        if (!prompt.trim()) {
            alert("Please enter a prompt for the AI");
            return;
        }

        // Check if agent is ready
        if (!this.agent.isReady()) {
            this.agent.openConfigPanel({ agent: this.agent });
            return;
        }

        var fullPrompt = "User instructions:\n" + prompt + "\n\nINPUT:\n" + currentCode;
        if (additionalPromptKey !== 'none' && this.options.additionalPrompts[additionalPromptKey]) {
            fullPrompt = this.options.additionalPrompts[additionalPromptKey] + "\n\n" + fullPrompt;
        }

        var executeBtn = document.querySelector('#ncsedt-dialog-agent .execute-ai');
        var originalBtnText = executeBtn.textContent;
        executeBtn.textContent = "Stop";
        responseTextarea.value = "";
        responseTextarea.readOnly = false;

        // Create abort controller for cancellation
        this.currentAbortController = new AbortController();

        try {
            // Use streaming for real-time updates
            var stream = this.agent.stream(fullPrompt, {
                signal: this.currentAbortController.signal
            });

            var fullText = "";

            for await (var chunk of stream) {
                fullText += chunk.text;
                responseTextarea.value = fullText;
                responseTextarea.scrollTop = responseTextarea.scrollHeight;
            }

            // Post-process if using "only replacement" mode
            if (additionalPromptKey === 'only replacement') {
                var processedValue = fullText;
                processedValue = processedValue.replace(/<think\b[^>]*>[\s\S]*?<\/think\b[^>]*>\s*/gi, '');
                processedValue = processedValue.replace(/```[a-zA-Z]*\s*/g, '');
                processedValue = processedValue.replace(/```/g, '');
                responseTextarea.value = processedValue;
            }

        } catch (error) {
            if (error.name === "AbortError") {
                responseTextarea.value += "\n\n[Request cancelled by user]";
            } else {
                console.error("AI API Error:", error);
                responseTextarea.value = "Error: " + (error.message || "Failed to get AI response");
            }
        } finally {
            executeBtn.textContent = originalBtnText;
            this.currentAbortController = null;
        }
    };

    /**
     * Stops the current AI generation
     */
    ncSimpleHtmlEditor.prototype.stopAIGeneration = function () {
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    };
})();
