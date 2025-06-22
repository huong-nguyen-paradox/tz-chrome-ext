// This is the service worker script.
// It listens for when the extension icon is clicked, then injects the content script into the active tab.

// listen for clicks on the extensions's toolbar icon
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on tab.id = ', tab.id, 'tab.url = ', tab.url);

    // get current select text from active tab
    chrome.scripting.executeScript( 
        {
            target: {tabId: tab.id },
            function: getSelectedTextAndInjectOverlay // execute a func directly in content script context to get the selection
        },
        (injectionResults) => {
            if (chrome.runtime.lastError) {
                console.error('Script injection failed:', chrome.runtime.lastError.message);
                return;
            }
            if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                const selectedText = injectionResults[0].result;
            } else {
                console.warn('No text selected or script did not return a result.');
            }
        }
    );
});

// Function gets the select text and then calls the func to manage the overlay.
// This function is executed in the context of the webpage (content script's isolated world). It might be defined outside the listener for 'executeScript' to inject it.
function getSelectedTextAndInjectOverlay() {
    const selectedText = window.getSelection().toString(); // this runs in the context of the webpage

    const OVERLAY_ID = 'extension-selected-text-overlay'; // define the ID for overlay elem to easily find and remove

    let overlay = document.getElementById(OVERLAY_ID); // check if overlay already exists

    if (!overlay) { // if it doesn't exist, create it
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-width: 90vw; /* Responsive width */
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            padding: 20px;
            z-index: 2147483647; /* High z-index to ensure it's on top */
            font-family: 'Inter', sans-serif;
            color: #333;
            animation: fadeIn 0.3s ease-out forwards;
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-sizing: border-box; /* Include padding in width */
        `;

        // add style block for animations if not already present
        if (!document.getElementById('extension-overlay-styles')) {
            const style = document.createElement('style');
            style.id = 'extension-overlay-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        // add header
        const header = document.createElement('h3');
        header.textContent = 'Selected Text';
        header.style.cssText = `
            margin: 0;
            color: #4a5568;
            font-size: 1.1em;
            text-align: left;
            padding-right: 30px; /* Space for close button */
        `;
        overlay.appendChild(header);

        // add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.2em;
            cursor: pointer;
            color: #888;
            padding: 5px;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease, color 0.2s ease;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = '#f0f0f0';
            closeButton.style.color = '#333';
        };
        closeButton.onmouseout = () => {
            closeButton.style.backgroundColor = 'none';
            closeButton.style.color = '#888';
        };
        closeButton.onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            overlay.addEventListenser('animationend', () => overlay.remove(), { once: true });
        };
        overlay.appendChild(closeButton);

        // add text content area
        const contentArea = document.createElement('div');
        contentArea.id = OVERLAY_ID + '-content';
        contentArea.style.cssText = `
            background-color: #f8f8f8;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 8px;
            min-height: 50px;
            max-height: 200px;
            overflow-y: auto;
            text-align: left;
            word-wrap: break-word;
            font-size: 0.95em;
            line-height: 1.4;
            color: #555;
            flex-grow: 1; /* Allow content area to grow */
        `;
        overlay.appendChild(contentArea);
        document.body.appendChild(overlay);
    } else {
        // if overlay already exists, reset its animation and ensure visibility
        overlay.style.animation = 'none';
        overlay.offsetHeight; // trigger reflow to apply reset
        overlay.style.animation = 'fadeIn 0.3s ease-out forwards'; // re-apply fadeIn

        document.body.appendChild(overlay) // re-append to ensure it's on top of any new content (though z-index usually handles this, re-appending ensures DOM order is latest)
    }

    // update the text content
    const contentArea = document.getElementById(OVERLAY_ID + '-content');
    if (selectedText.trim() !== '') {
        contentArea.textContent = selectedText;
        contentArea.style.color = '#555';
    } else {
        contentArea.textContent = 'No text was selected. Select text and click the icon again.';
        contentArea.style.color = '#dc3545'; // red for warning
    }

    return selectedText; // return the selected text to the background script (optional, for logging)
}

