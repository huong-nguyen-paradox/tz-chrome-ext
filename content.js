// content.js
// This function will be executed in the context of the webpage (content script's isolated world).
// It creates or updates the timezone converter overlay.

const OVERLAY_ID = "extension-timezone-converter-overlay";
const TIME_INPUT_ID = OVERLAY_ID + "-time-input";
const SOURCE_TZ_INPUT_ID = OVERLAY_ID + "-source-tz-input";
const SOURCE_TZ_DATALIST_ID = OVERLAY_ID + "-source-tz-datalist";
const TARGET_TZ_INPUT_ID = OVERLAY_ID + "-target-tz-input";
const TARGET_TZ_DATALIST_ID = OVERLAY_ID + "-target-tz-datalist";
const CONVERT_BUTTON_ID = OVERLAY_ID + "-convert-btn";
const RESULTS_AREA_ID = OVERLAY_ID + "-results";
const CLOSE_BUTTON_ID = OVERLAY_ID + "-close-btn";

// Comprehensive list of IANA timezones (same as before, but note the addition of "Etc/GMT" zones and others)
const rawTimezones = [
  "America/New York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los Angeles",
  "America/Anchorage",
  "America/Honolulu",
  "America/Adak",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
  "America/North Dakota/Center",
  "America/Boise",
  "America/Juneau",
  "America/Sitka",
  "America/Yakutat",
  "America/Nome",
  "America/Metlakatla",
  "America/Puerto Rico",
  "America/St Johns",
  "America/Halifax",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Moscow",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Dublin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong Kong",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Ho Chi Minh", // Vietnam!
  "Asia/Jakarta",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Darwin",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "America/Sao Paulo",
  "America/Mexico City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "UTC",
  // Adding more common fixed-offset GMT zones for completeness, as requested
  "Etc/GMT-1",
  "Etc/GMT-2",
  "Etc/GMT-3",
  "Etc/GMT-4",
  "Etc/GMT-5",
  "Etc/GMT-6",
  "Etc/GMT-7",
  "Etc/GMT-8",
  "Etc/GMT-9",
  "Etc/GMT-10",
  "Etc/GMT-11",
  "Etc/GMT-12",
  "Etc/GMT+1",
  "Etc/GMT+2",
  "Etc/GMT+3",
  "Etc/GMT+4",
  "Etc/GMT+5",
  "Etc/GMT+6",
  "Etc/GMT+7",
  "Etc/GMT+8",
  "Etc/GMT+9",
  "Etc/GMT+10",
  "Etc/GMT+11",
  "Etc/GMT+12",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "Pacific/Fiji",
  "Asia/Jerusalem",
  "Europe/Warsaw",
  "America/Argentina/Buenos Aires",
  "Africa/Lagos",
  "Asia/Riyadh",
  "Indian/Maldives",
  "Pacific/Kiritimati",
  "Europe/Oslo",
  "Europe/Stockholm",
  "Europe/Helsinki",
].sort(); // Sort alphabetically for better display

// Function to get the current abbreviation for a given IANA timezone
function getTimezoneAbbreviation(ianaTimezone) {
  try {
    // Use a dummy date (current date) to get the current abbreviation
    // The abbreviation can change with DST, so this gets the *current* one.
    const now = new Date();
    const options = { timeZone: ianaTimezone, timeZoneName: "short" };
    // Format the date in English (en-US) to ensure consistent abbreviation format
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
    const abbreviationPart = parts.find((part) => part.type === "timeZoneName");
    return abbreviationPart ? abbreviationPart.value : "";
  } catch (e) {
    // Fallback for invalid or unrecognized timezones, or 'Etc/GMT' zones which often don't have standard abbreviations
    if (ianaTimezone.startsWith("Etc/GMT")) {
      return ianaTimezone.replace("Etc/", ""); // e.g., "GMT-5"
    }
    return ""; // Return empty string if abbreviation can't be found
  }
}

// Prepare the timezones with their current abbreviations for display
const allTimezonesWithAbbreviations = rawTimezones.map((tz) => {
  const abbreviation = getTimezoneAbbreviation(tz);
  return {
    iana: tz,
    display: abbreviation ? `${tz} (${abbreviation})` : tz,
  };
});

// The function that creates the overlay - it will be executed when the content.js file runs
function createOrUpdateTimeConverterOverlay() {
  let overlay = document.getElementById(OVERLAY_ID);

  // Check if Inter font is already loaded (this can stay here or be moved to a separate CSS file)
  if (!document.getElementById("inter-font-link")) {
    const interLink = document.createElement("link");
    interLink.id = "inter-font-link";
    interLink.rel = "stylesheet";
    interLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap";
    document.head.appendChild(interLink);
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 350px;
            max-width: 95vw;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            padding: 20px;
            z-index: 2147483647;
            font-family: 'Inter', sans-serif;
            color: #333;
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-sizing: border-box;
            position: fixed;
        `;

    if (!document.getElementById("extension-overlay-internal-styles")) {
      const style = document.createElement("style");
      style.id = "extension-overlay-internal-styles";
      style.textContent = `
                #${OVERLAY_ID} input[type="text"] {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    box-sizing: border-box;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.95em;
                }
                #${OVERLAY_ID} button {
                    background-color:#669dd8;
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1em;
                    display: block;
                    width: 40%;
                    box-sizing: border-box;
                    margin-left: auto;
                    margin-right: auto;
                }
                #${OVERLAY_ID} button:hover {
                    background-color:#2656a9;
                }
            `;
      document.head.appendChild(style);
    }

    const header = document.createElement("h3");
    header.textContent = "Timezone Converter";
    header.style.cssText = `
            margin: 0;
            color: #4a5568;
            font-size: 1.3em;
            text-align: left;
            padding-right: 30px;
            margin-bottom: 10px;
        `;
    overlay.appendChild(header);

    const closeButton = document.createElement("button");
    closeButton.id = CLOSE_BUTTON_ID;
    closeButton.textContent = "X";
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
    closeButton.onclick = () => {
      overlay.remove();
    };
    overlay.appendChild(closeButton);

    const inputSection = document.createElement("div");
    inputSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
        `;

    const timeLabel = document.createElement("label");
    timeLabel.textContent = "Time:";
    timeLabel.htmlFor = TIME_INPUT_ID;
    timeLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block;
            margin-bottom: 4px;
        `;
    inputSection.appendChild(timeLabel);

    const timeInput = document.createElement("input");
    timeInput.type = "text";
    timeInput.id = TIME_INPUT_ID;
    timeInput.placeholder = "e.g., 9:00 AM or 14:30";
    inputSection.appendChild(timeInput);

    const sourceTzLabel = document.createElement("label");
    sourceTzLabel.textContent = "From Timezone:";
    sourceTzLabel.htmlFor = SOURCE_TZ_INPUT_ID;
    sourceTzLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block;
            margin-bottom: 4px;
            margin-top: 10px;
        `;
    inputSection.appendChild(sourceTzLabel);

    const sourceTzInput = document.createElement("input");
    sourceTzInput.type = "text";
    sourceTzInput.id = SOURCE_TZ_INPUT_ID;
    sourceTzInput.setAttribute("list", SOURCE_TZ_DATALIST_ID);
    sourceTzInput.placeholder = "Type to search timezone...";
    inputSection.appendChild(sourceTzInput);

    const sourceTzDatalist = document.createElement("datalist");
    sourceTzDatalist.id = SOURCE_TZ_DATALIST_ID;
    allTimezonesWithAbbreviations.forEach((tz) => {
      const option = document.createElement("option");
      option.value = tz.display; // Display value for the user
      option.dataset.iana = tz.iana; // Store the actual IANA ID in a data attribute
      sourceTzDatalist.appendChild(option);
    });
    inputSection.appendChild(sourceTzDatalist);

    // Attempt to pre-fill source timezone with local timezone
    try {
      const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const matchingTz = allTimezonesWithAbbreviations.find(
        (item) => item.iana === localTimeZone
      );
      if (matchingTz) {
        sourceTzInput.value = matchingTz.display;
      } else {
        // Try to find a partial match or default to UTC
        const partialMatch = allTimezonesWithAbbreviations.find((item) =>
          item.iana.includes(localTimeZone)
        );
        if (partialMatch) {
          sourceTzInput.value = partialMatch.display;
        } else {
          sourceTzInput.value = allTimezonesWithAbbreviations.find(
            (item) => item.iana === "UTC"
          ).display;
        }
      }
    } catch (e) {
      console.warn("Could not determine local timezone:", e);
      sourceTzInput.value = allTimezonesWithAbbreviations.find(
        (item) => item.iana === "UTC"
      ).display; // Default to UTC
    }

    const targetTzLabel = document.createElement("label");
    targetTzLabel.textContent = "To Timezone:";
    targetTzLabel.htmlFor = TARGET_TZ_INPUT_ID;
    targetTzLabel.style.cssText = `
            font-size: 0.9em;
            color: #555;
            display: block;
            margin-bottom: 4px;
            margin-top: 10px;
        `;
    inputSection.appendChild(targetTzLabel);

    const targetTzInput = document.createElement("input");
    targetTzInput.type = "text";
    targetTzInput.id = TARGET_TZ_INPUT_ID;
    targetTzInput.setAttribute("list", TARGET_TZ_DATALIST_ID);
    targetTzInput.placeholder = "Type to search timezone...";
    inputSection.appendChild(targetTzInput);

    const targetTzDatalist = document.createElement("datalist");
    targetTzDatalist.id = TARGET_TZ_DATALIST_ID;
    allTimezonesWithAbbreviations.forEach((tz) => {
      const option = document.createElement("option");
      option.value = tz.display;
      option.dataset.iana = tz.iana;
      targetTzDatalist.appendChild(option);
    });
    inputSection.appendChild(targetTzDatalist);

    // Default target timezone (e.g., London)
    targetTzInput.value = allTimezonesWithAbbreviations.find(
      (item) => item.iana === "Europe/London"
    ).display;

    overlay.appendChild(inputSection);

    const convertButton = document.createElement("button");
    convertButton.id = CONVERT_BUTTON_ID;
    convertButton.textContent = "Convert";
    overlay.appendChild(convertButton);

    const resultsArea = document.createElement("div");
    resultsArea.id = RESULTS_AREA_ID;
    resultsArea.style.cssText = `
            background-color: #f8f8f8;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 8px;
            min-height: 10%;
            max-height: 25%;
            overflow-y: auto;
            text-align: left;
            word-wrap: break-word;
            font-size: .85em;
            line-height: 1.6;
            color: #555;
            flex-grow: 1;
        `;
    resultsArea.innerHTML =
      '<span style="color: #6c757d;">Enter time and click Convert.</span>';
    overlay.appendChild(resultsArea);

    document.body.appendChild(overlay);

    // Helper function to get the IANA timezone from the displayed string
    function getIanaTimezoneFromDisplay(displayString) {
      const matchedItem = allTimezonesWithAbbreviations.find(
        (item) => item.display === displayString
      );
      return matchedItem ? matchedItem.iana : null;
    }

    convertButton.addEventListener("click", () => {
      const inputTime = timeInput.value.trim();
      const sourceDisplayTz = sourceTzInput.value.trim(); // Get the displayed string
      const targetDisplayTz = targetTzInput.value.trim(); // Get the displayed string
      const resultsDiv = document.getElementById(RESULTS_AREA_ID);

      // Convert display strings back to IANA timezones for calculation
      const sourceTz = getIanaTimezoneFromDisplay(sourceDisplayTz);
      const targetTz = getIanaTimezoneFromDisplay(targetDisplayTz);

      if (!inputTime) {
        resultsDiv.innerHTML =
          '<span style="color: #dc3545; font-weight: bold;">Please enter a time to convert.</span>';
        return;
      }

      // Validate if selected timezones are valid IANA timezones from our list (by checking if getIanaTimezoneFromDisplay found a match)
      if (!sourceTz) {
        resultsDiv.innerHTML = `<span style="color: #dc3545; font-weight: bold;">Invalid "From Timezone": "${sourceDisplayTz}". Please select from the list.</span>`;
        return;
      }
      if (!targetTz) {
        resultsDiv.innerHTML = `<span style="color: #dc3545; font-weight: bold;">Invalid "To Timezone": "${targetDisplayTz}". Please select from the list.</span>`;
        return;
      }

      if (sourceTz === targetTz) {
        resultsDiv.innerHTML =
          '<span style="color: #ffc107; font-weight: bold;">Source and target timezones are the same. No conversion needed.</span>';
        return;
      }

      resultsDiv.innerHTML =
        '<span style="color: #4a86c7;">Converting...<br></span>';

      try {
        const today = new Date();
        const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
        const match = inputTime.match(timeRegex);

        if (!match) {
          resultsDiv.innerHTML =
            '<span style="color: #dc3545; font-weight: bold;">Invalid time format. Use HH:MM or HH:MM AM/PM.</span>';
          return;
        }

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3] ? match[3].toUpperCase() : "";

        if (ampm === "PM" && hours < 12) {
          hours += 12;
        } else if (ampm === "AM" && hours === 12) {
          hours = 0;
        }

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          resultsDiv.innerHTML =
            '<span style="color: #dc3545; font-weight: bold;">Invalid time values.</span>';
          return;
        }

        today.setHours(hours, minutes, 0, 0);

        const outputOptions = {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        };

        // Get formatted parts for target timezone
        const targetFormatter = new Intl.DateTimeFormat("en-US", {
          ...outputOptions,
          timeZone: targetTz,
        });
        const targetParts = targetFormatter.formatToParts(today);
        const targetTime = targetParts
          .filter((p) => p.type !== "timeZoneName")
          .map((p) => p.value)
          .join("");
        const targetAbbreviation =
          targetParts.find((p) => p.type === "timeZoneName")?.value || "";

        // Only output the target timezone information
        let output = `<span style="display: block; padding-top: 2px; padding-bottom: 2px; font-size: 1.5em;"> ${targetTime} 
                        <span style="color:#669dd8;">${targetAbbreviation}</span>
                        </span>`;

        resultsDiv.innerHTML = output;
      } catch (error) {
        console.error("Time conversion error:", error);
        resultsDiv.innerHTML = `<span style="color: #dc3545; font-weight: bold;">Error converting time: ${
          error.message || error
        }</span>`;
      }
    });
  } else {
    document.body.appendChild(overlay);
  }
}

// Call the function immediately when the content script is injected
createOrUpdateTimeConverterOverlay();
