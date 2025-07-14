// background.js
console.log("Background script started.");

chrome.action.onClicked.addListener((tab) => {
    // Executes the content script's file inside the current tab's isolated world.
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, () => {
        // This optional callback can be used for logging or error handling.
        if (chrome.runtime.lastError) {
            console.error("Script injection failed:", chrome.runtime.lastError.message);
        } else {
            console.log("Content script injected successfully.");
        }
    });
});