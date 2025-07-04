// This is the service worker script.
// It listens for when the extension icon is clicked, then injects the UI and logic
// for the timezone converter into the active tab. All animations and related CSS
// have been removed.

console.log("Background script has started to load for Timezone Converter (No Animation)!");

// Listen for clicks on the extension's toolbar icon
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on tab.id = ', tab.id, 'tab.url = ', tab.url);

    // Execute the function that creates/manages the timezone converter overlay
    chrome.scripting.executeScript(
        {
            target: {tabId: tab.id },
            function: createOrUpdateTimeConverterOverlay // This function will be injected and run on the page
        },
        (injectionResults) => {
            if (chrome.runtime.lastError) {
                console.error('Script injection failed:', chrome.runtime.lastError.message);
                return;
            }
            console.log('Timezone converter script injected into tab:', tab.id);
            // No result is expected back from this injection as it directly manipulates the DOM
        }
    );
});

// This function will be executed in the context of the webpage (content script's isolated world).
// It creates or updates the timezone converter overlay.
function createOrUpdateTimeConverterOverlay() {
    const OVERLAY_ID = 'extension-timezone-converter-overlay';
    const TIME_INPUT_ID = OVERLAY_ID + '-time-input';
    const SOURCE_TZ_SELECT_ID = OVERLAY_ID + '-source-tz-select';
    const TARGET_TZ_SELECT_ID = OVERLAY_ID + '-target-tz-select'; // New ID for target timezone select
    const CONVERT_BUTTON_ID = OVERLAY_ID + '-convert-btn';
    const RESULTS_AREA_ID = OVERLAY_ID + '-results';
    const CLOSE_BUTTON_ID = OVERLAY_ID + '-close-btn';

    let overlay = document.getElementById(OVERLAY_ID);

    // List of common IANA timezones (you can expand this)
    const timezones = [
        "America/New_York",
        "America/Chicago",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Berlin",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Australia/Sydney",
        "UTC",
        "Asia/Kolkata",
        "Asia/Dubai",
        "Europe/Paris",
        "Canada/Atlantic",
        "Mexico/BajaNorte"
    ];

    // Check if Inter font is already loaded
    if (!document.getElementById('inter-font-link')) {
        const interLink = document.createElement('link');
        interLink.id = 'inter-font-link';
        interLink.rel = 'stylesheet';
        interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
        document.head.appendChild(interLink);
    }

    if (!overlay) {
        // If it doesn't exist, create it
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        // Removed 'animation: fadeIn ...'
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px; /* Slightly wider for the converter */
            max-width: 95vw; /* Responsive width */
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            padding: 20px;
            z-index: 2147483647; /* High z-index to ensure it's on top */
            font-family: 'Inter', sans-serif;
            color: #333;
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-sizing: border-box; /* Include padding in width */
        `;

        // Basic styling for inputs and buttons (no animations/transitions here either)
        // This style block is for elements within the overlay, not for the overlay itself's animations
        if (!document.getElementById('extension-overlay-internal-styles')) {
            const style = document.createElement('style');
            style.id = 'extension-overlay-internal-styles';
            style.textContent = `
                #${OVERLAY_ID} input[type="text"],
                #${OVERLAY_ID} select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.95em;
                }
                #${OVERLAY_ID} button {
                    background-color: #007bff; /* Primary button color */
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1em;
                    display: block; /* Full width for the button */
                    width: 100%;
                    box-sizing: border-box;
                    /* Removed transition for no animation */
                }
                #${OVERLAY_ID} button:hover {
                    background-color: #0056b3; /* Darker blue on hover */
                }
                /* Removed :active styles */
            `;
            document.head.appendChild(style);
        }


        // Add header
        const header = document.createElement('h3');
        header.textContent = 'Timezone Converter';
        header.style.cssText = `
            margin: 0;
            color: #4a5568;
            font-size: 1.3em;
            text-align: left;
            padding-right: 30px; /* Space for close button */
            margin-bottom: 10px;
        `;
        overlay.appendChild(header);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.id = CLOSE_BUTTON_ID;
        closeButton.textContent = 'X';
        // Removed transition for no animation
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
        `;
        // Removed onmouseover/onmouseout for no animation
        closeButton.onclick = () => {
            overlay.remove(); // Direct removal, no fadeOut animation
        };
        overlay.appendChild(closeButton);

        // --- Input Section ---
        const inputSection = document.createElement('div');
        inputSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
        `;

        // Time Input
        const timeLabel = document.createElement('label');
        timeLabel.textContent = 'Time:';
        timeLabel.htmlFor = TIME_INPUT_ID;
        timeLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block; /* Ensure it takes full width above input */
            margin-bottom: 4px;
        `;
        inputSection.appendChild(timeLabel);

        const timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.id = TIME_INPUT_ID;
        timeInput.placeholder = 'e.g., 9:00 AM or 14:30';
        // Input styles handled by the internal style block
        inputSection.appendChild(timeInput);

        // Source Timezone Select
        const sourceTzLabel = document.createElement('label');
        sourceTzLabel.textContent = 'From Timezone:';
        sourceTzLabel.htmlFor = SOURCE_TZ_SELECT_ID;
        sourceTzLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block;
            margin-bottom: 4px;
            margin-top: 10px; /* Space above this label */
        `;
        inputSection.appendChild(sourceTzLabel);

        const sourceTzSelect = document.createElement('select');
        sourceTzSelect.id = SOURCE_TZ_SELECT_ID;
        // Select styles handled by the internal style block
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz;
            sourceTzSelect.appendChild(option);
        });
        // Attempt to pre-select local timezone
        try {
            const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (timezones.includes(localTimeZone)) {
                sourceTzSelect.value = localTimeZone;
            } else {
                 const matchingTZ = timezones.find(tz => tz.includes(localTimeZone.split('/')[0]) || tz.includes(localTimeZone.split('/')[1]));
                 sourceTzSelect.value = matchingTZ || "UTC";
            }
        } catch (e) {
            console.warn("Could not determine local timezone:", e);
            sourceTzSelect.value = "UTC"; // Default to UTC if detection fails
        }
        inputSection.appendChild(sourceTzSelect);

        // --- NEW: Target Timezone Select ---
        const targetTzLabel = document.createElement('label');
        targetTzLabel.textContent = 'To Timezone:';
        targetTzLabel.htmlFor = TARGET_TZ_SELECT_ID;
        targetTzLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block;
            margin-bottom: 4px;
            margin-top: 10px; /* Space above this label */
        `;
        inputSection.appendChild(targetTzLabel);

        const targetTzSelect = document.createElement('select');
        targetTzSelect.id = TARGET_TZ_SELECT_ID;
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz;
            option.textContent = tz;
            targetTzSelect.appendChild(option);
        });
        // You might want to default the target timezone to a common one or a different one than source
        // For now, let's default it to New York as an example.
        targetTzSelect.value = "America/New_York"; // Default target timezone
        inputSection.appendChild(targetTzSelect);
        // --- END NEW ---

        overlay.appendChild(inputSection);

        // Convert Button
        const convertButton = document.createElement('button');
        convertButton.id = CONVERT_BUTTON_ID;
        convertButton.textContent = 'Convert Time';
        // Button styles handled by the internal style block
        overlay.appendChild(convertButton);

        // --- Results Section ---
        const resultsArea = document.createElement('div');
        resultsArea.id = RESULTS_AREA_ID;
        resultsArea.style.cssText = `
            background-color: #f8f8f8;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 8px;
            min-height: 80px;
            max-height: 250px;
            overflow-y: auto;
            text-align: left;
            word-wrap: break-word;
            font-size: 0.95em;
            line-height: 1.6;
            color: #555;
            flex-grow: 1;
        `;
        resultsArea.innerHTML = '<span style="color: #6c757d;">Enter time and click Convert.</span>'; // Neutral gray for initial message
        overlay.appendChild(resultsArea);

        document.body.appendChild(overlay);

        // --- Event Listener for Conversion ---
        convertButton.addEventListener('click', () => {
            const inputTime = timeInput.value.trim();
            const sourceTz = sourceTzSelect.value;
            const targetTz = targetTzSelect.value; // Get the selected target timezone
            const resultsDiv = document.getElementById(RESULTS_AREA_ID);

            if (!inputTime) {
                resultsDiv.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Please enter a time to convert.</span>';
                return;
            }

            if (sourceTz === targetTz) {
                resultsDiv.innerHTML = '<span style="color: #ffc107; font-weight: bold;">Source and target timezones are the same. No conversion needed.</span>';
                return;
            }

            resultsDiv.innerHTML = '<span style="color: #007bff;">Converting...<br></span>'; // Blue for converting message

            try {
                // Determine a base date for parsing (today)
                // IMPORTANT: To correctly parse the input time in the *source* timezone,
                // we need to create a `Date` object that inherently understands that timezone.
                // The `Intl.DateTimeFormat` doesn't help with parsing, only formatting.
                // A common way to handle this without a full date library is to:
                // 1. Create a `Date` object from the current date.
                // 2. Set the hours/minutes based on the input.
                // 3. Then, when formatting for the *target* timezone, `Intl.DateTimeFormat` handles the conversion.

                // Let's create a date string that `new Date()` can potentially parse with the timezone.
                // However, `new Date("YYYY-MM-DD HH:MM:SS TZ_NAME")` is not reliably parsed across all browsers.
                // The most reliable way for cross-timezone parsing with native Date objects
                // is to parse it as if it were UTC, then adjust, or use a robust library like Luxon/Moment.
                // For simplicity and given your current approach, we'll continue with parsing local time
                // and then rely on Intl.DateTimeFormat for *displaying* in the target timezone.

                let parsedDate = new Date(); // Start with current date/time in local timezone

                const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
                const match = inputTime.match(timeRegex);

                if (!match) {
                    resultsDiv.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Invalid time format. Use HH:MM or HH:MM AM/PM.</span>';
                    return;
                }

                let hours = parseInt(match[1]);
                const minutes = parseInt(match[2]);
                const ampm = match[3] ? match[3].toUpperCase() : '';

                if (ampm === 'PM' && hours < 12) {
                    hours += 12;
                } else if (ampm === 'AM' && hours === 12) {
                    hours = 0; // 12 AM is 00:00
                }

                if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                    resultsDiv.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Invalid time values.</span>';
                    return;
                }

                // Here's the trick: We create a date string for the *source* timezone.
                // This is still tricky with `Date` object directly for parsing,
                // but `Intl.DateTimeFormat` handles the conversion *from* a given Date object.
                // The native `Date` object always works with the system's local time and UTC internally.
                // What we need is to interpret `inputTime` *as if it were in `sourceTz`* and then convert.

                // A reliable way to get a Date object representing the input time in the source timezone:
                // 1. Get current date components in the *local* timezone.
                // 2. Create a `Date` object from these local components, but with the input time.
                // 3. Use `toLocaleString` with the `sourceTz` to get its representation in that timezone.
                // This is less about 'parsing' a date string *into* a specific timezone directly with `new Date()`,
                // and more about calculating the UTC equivalent of the given time in the source timezone.

                // Let's construct a date object representing the input time *on today's date in the source timezone*.
                // This requires a bit of a workaround since `new Date()` parses based on the local system.
                // We'll create a Date object in UTC, then set its components.
                // Then, we'll format it with the source timezone to make sure it's understood.

                // First, create a Date object representing "today" in the local system's time.
                const today = new Date();
                // Set the hours and minutes for this Date object.
                today.setHours(hours, minutes, 0, 0);

                // Now, `today` is a Date object representing `inputTime` on the current date in the *local* timezone.
                // To get the equivalent time in the *target* timezone, we just use `Intl.DateTimeFormat`.

                const outputOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    timeZoneName: 'short'
                };

                // Format the input time in its source timezone for display
                const sourceTimeFormatted = new Intl.DateTimeFormat('en-US', { ...outputOptions, timeZone: sourceTz }).format(today);

                // Format the input time for the target timezone
                const targetTimeFormatted = new Intl.DateTimeFormat('en-US', { ...outputOptions, timeZone: targetTz }).format(today);

                let output = `<span style="font-weight: 600; color: #007bff;">${targetTz}:</span> ${targetTimeFormatted}`;

                resultsDiv.innerHTML = output;

            } catch (error) {
                console.error("Time conversion error:", error);
                resultsDiv.innerHTML = `<span style="color: #dc3545; font-weight: bold;">Error converting time: Invalid input or unknown timezone. (${error.message || error})</span>`;
            }
        });

    } else {
        // If the overlay already exists, simply re-append to ensure it's on top
        // No animation reset or re-application needed
        document.body.appendChild(overlay);
    }
}