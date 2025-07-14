// background.js
console.log("Background script started");

chrome.action.onClicked.addListener((tab) => {
  // Check if the content script can run on the current tab
  // This is good practice to avoid errors on internal browser pages
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:")) {
    console.warn("Cannot run extension on this page.");
    return;
  }

  console.log(
    "Extension icon clicked on tab.id = ",
    tab.id,
    "tab.url = ",
    tab.url
  );

  // Send a message to the content script in the active tab
  chrome.tabs.sendMessage(tab.id, { action: "toggleOverlay" }, (response) => {
    // This callback is optional, but useful for debugging
    if (chrome.runtime.lastError) {
      console.warn(
        "Could not send message to content script:",
        chrome.runtime.lastError.message
      );
    } else {
      console.log('Message "toggleOverlay" sent to content script.');
    }
  });
});
