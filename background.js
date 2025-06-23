// This service worker script listens for clicks on the extensions's toolbar icon.

chrome.action.onClicked.addListener((tab) => {
    // when the icon is clicked, execute the content_script.js in the current tab
    // this script will inject or toggle the tz ext overlay
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content_script.js']
    })
    .then(() => console.log('Content script executed.'))
    .catch(err => console.error('Failed to execute content script:', err));
})