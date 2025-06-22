// This script is injected into the active webpage. 
// It gets the currently selected text and sends it back to the popup.

// function to get the selected text from the current page
function getSelectedText() {
    console.log('in func getSelectedText');
    return window.getSelection().toString();
}

// get selected text
const selectedText = getSelectedText();

// send selected text back to popup (or any listening part of the extension)
// the 'type' property helps distinguish different messages
chrome.runtime.sendMessage({ type: 'selectedText', text: selectedText });

console.log('Content script executed. Selected text: ', selectedText);

