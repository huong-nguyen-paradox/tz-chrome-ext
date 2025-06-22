// This script runs when the popup ('popup.html') is opened. 
// It requests the selected text from the active tab and displays it.

// get references to HTML elements in popup.html
const selectedTextDisplay = document.getElementById("selectedTextDisplay");
const loadingMessage = document.getElementById("loadingMessage");

// function to handle the response from the content script
function handleMessage(message, sender, sendResponse) {
  if (message.type === "selectedText") {
    // Hide loading message and display the selected text
    loadingMessage.style.display = "none";
    if (message.text && message.text.trim() !== "") {
      selectedTextDisplay.textContent = message.text;
    } else {
      selectedTextDisplay.textContent = "No text was selected.";
      selectedTextDisplay.style.color = "#dc3545"; // red color for "no text"
    }
  }
}

// listener for messages from content script
chrome.runtime.onMessage.addListener(handleMessage);

// When popup opens, execute content script in the currently active tab to get the selected text.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length === 0) {
    // No active tab found (if popup opened on special/unexpected Chrome page?)
    loadingMessage.style.display = "none";
    selectedTextDisplay.textContent =
      "Cannot access selected text on this page.";
    selectedTextDisplay.style.color = "#ffc107"; // yellow color for warning
    return;
  }

  const activeTabId = tabs[0].id;

  // use 'chrome.runtime.onMessage.addListener(handleMessage) for Manifest V3
  chrome.scripting.executeScript(
    {
      target: { tabId: activeTabId },
      files: ["content.js"], // path to the content script file
    },
    () => {
      // check for errors during script injection
      if (chrome.runtime.lastError) {
        console.error(
          "Script injection failed:",
          chrome.runtime.lastError.message
        );
        loadingMessage.style.display = "none";
        selectedTextDisplay.textContent = "Error: Could not inject script.";
        selectedTextDisplay.style.color = "#dc3545";
        return;
      }
      console.log("content.js injected into tab:", activeTabId);
      // after content.js is inkected, it will automatically send back the selected text
      // the handleMessage function will then process it
    }
  );
});
