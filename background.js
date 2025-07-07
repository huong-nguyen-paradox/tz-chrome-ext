// background.js
console.log("Background script has started to load for Timezone Converter!");

chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on tab.id = ', tab.id, 'tab.url = ', tab.url);

    // Inject the content script that handles the UI and logic on the page
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            files: ['content.js'] // Specify the content script file
        },
        (injectionResults) => {
            if (chrome.runtime.lastError) {
                console.error('Script injection failed:', chrome.runtime.lastError.message);
                return;
            }
            console.log('Timezone converter content script injected into tab:', tab.id);
        }
    );
});