// content.js
// This script is injected and runs once when the page loads.
// It listens for a message from the background script to toggle the overlay's visibility.

// ======================================
// 1. Constants & Helper Functions
//    (These are declared once and persist)
// ======================================
const OVERLAY_ID = "extension-timezone-converter-overlay";
const TIME_INPUT_ID = OVERLAY_ID + "-time-input";
const SOURCE_TZ_INPUT_ID = OVERLAY_ID + "-source-tz-input";
const SOURCE_TZ_DATALIST_ID = OVERLAY_ID + "-source-tz-datalist";
const TARGET_TZ_INPUT_ID = OVERLAY_ID + "-target-tz-input";
const TARGET_TZ_DATALIST_ID = OVERLAY_ID + "-target-tz-datalist";
const CONVERT_BUTTON_ID = OVERLAY_ID + "-convert-btn";
const RESULTS_AREA_ID = OVERLAY_ID + "-results";
const CLOSE_BUTTON_ID = OVERLAY_ID + "-close-btn";

const rawTimezones = Intl.supportedValuesOf("timeZone");
if (!rawTimezones.includes("UTC")) {
  rawTimezones.push("UTC");
}
rawTimezones.sort();
console.log("Available IANA Timezones (w/o abbrev):", rawTimezones);

// Helper function to get the current abbreviation for a given IANA timezone
function getTimezoneAbbreviation(ianaTimezone) {
  try {
    const now = new Date();
    const options = { timeZone: ianaTimezone, timeZoneName: "short" };
    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);
    const abbreviationPart = parts.find((part) => part.type === "timeZoneName");
    return abbreviationPart ? abbreviationPart.value : "";
  } catch (e) {
    if (ianaTimezone.startsWith("Etc/GMT")) {
      return ianaTimezone.replace("Etc/", "");
    }
    return "";
  }
}

const allTimezonesWithAbbreviations = rawTimezones.map((tz) => {
  const abbreviation = getTimezoneAbbreviation(tz);
  return {
    iana: tz,
    display: abbreviation ? `${tz} (${abbreviation})` : tz,
  };
});

// Helper function to get the IANA timezone from the displayed string
function getIanaTimezoneFromDisplay(displayString) {
  const matchedItem = allTimezonesWithAbbreviations.find(
    (item) => item.display === displayString
  );
  return matchedItem ? matchedItem.iana : null;
}

// ======================================
// 2. The Core UI Creation Function
//    (This runs only on the first message)
// ======================================

function createTimezoneConverterOverlay() {
  let overlay = document.createElement("div");
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
  `;

  // Add Inter font link
  if (!document.getElementById("inter-font-link")) {
    const interLink = document.createElement("link");
    interLink.id = "inter-font-link";
    interLink.rel = "stylesheet";
    interLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap";
    document.head.appendChild(interLink);
  }

  // Add internal styles
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
  // Change close action to HIDE instead of remove
  closeButton.onclick = () => {
    overlay.style.display = "none";
  };
  overlay.appendChild(closeButton);

  const inputSection = document.createElement("div");
  inputSection.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  `;

  // Time Input
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

  // Source Timezone Input
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
    option.value = tz.display;
    option.dataset.iana = tz.iana;
    sourceTzDatalist.appendChild(option);
  });
  inputSection.appendChild(sourceTzDatalist);

  // Pre-fill source timezone with local timezone
  try {
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matchingTz = allTimezonesWithAbbreviations.find(
      (item) => item.iana === localTimeZone
    );
    if (matchingTz) {
      sourceTzInput.value = matchingTz.display;
    } else {
      sourceTzInput.value = allTimezonesWithAbbreviations.find(
        (item) => item.iana === "UTC"
      ).display;
    }
  } catch (e) {
    sourceTzInput.value = allTimezonesWithAbbreviations.find(
      (item) => item.iana === "UTC"
    ).display;
  }

  // Target Timezone Input
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

  // Add the event listener for the convert button
  convertButton.addEventListener("click", () => {
    const inputTime = timeInput.value.trim();
    const sourceDisplayTz = sourceTzInput.value.trim();
    const targetDisplayTz = targetTzInput.value.trim();
    const resultsDiv = document.getElementById(RESULTS_AREA_ID);

    const sourceTz = getIanaTimezoneFromDisplay(sourceDisplayTz);
    const targetTz = getIanaTimezoneFromDisplay(targetDisplayTz);

    if (!inputTime) {
      resultsDiv.innerHTML =
        '<span style="color: #dc3545; font-weight: bold;">Please enter a time to convert.</span>';
      return;
    }
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
      // New, more flexible regex to handle HH:MM, HH:MM:SS, and optional AM/PM
      const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i;
      const match = inputTime.match(timeRegex);
      console.log("Input time regex match:", match);

      if (!match) {
        resultsDiv.innerHTML =
          '<span style="color: #dc3545; font-weight: bold;">Invalid time format. Use HH:MM, HH:MM:SS, with or without AM/PM.</span>';
        return;
      }

      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = match[3] ? parseInt(match[3]) : 0; // Default to 0 if seconds are not specified
      const ampm = match[4] ? match[4].toUpperCase() : "";

      // 1. Account for AM/PM when specified
      if (ampm === "PM" && hours < 12) {
        hours += 12;
      } else if (ampm === "AM" && hours === 12) {
        hours = 0; // 12 AM is 00:xx in 24-hour time
      } else if (!ampm && hours > 23) {
        // Handle invalid 24-hour time values
        resultsDiv.innerHTML =
          '<span style="color: #dc3545; font-weight: bold;">Invalid 24-hour time value. Hours must be 0-23.</span>';
        return;
      }

      if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
      ) {
        resultsDiv.innerHTML =
          '<span style="color: #dc3545; font-weight: bold;">Invalid time values.</span>';
        return;
      }

      // Create a date object with the parsed time.
      // The date itself (month, day, year) doesn't matter for timezone conversion
      // of a specific time, as long as it's a valid date.
      const today = new Date();
      today.setHours(hours, minutes, seconds, 0);

      // 2. Convert with seconds in the output
      const outputOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit", // Added 'second' to the output options
        hour12: true,
        timeZoneName: "short",
      };

      const targetFormatter = new Intl.DateTimeFormat("en-US", {
        ...outputOptions,
        timeZone: targetTz,
      });

      // Use formatToParts to get the time parts including the time zone abbreviation
      const targetParts = targetFormatter.formatToParts(today);
      const targetTime = targetParts
        .filter((p) => p.type !== "timeZoneName")
        .map((p) => p.value)
        .join("");
      const targetAbbreviation =
        targetParts.find((p) => p.type === "timeZoneName")?.value || "";

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
}

// ======================================
// 3. The Message Listener
//    (This is the entry point for interaction)
// ======================================

// Listen for a message from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleOverlay") {
    let overlay = document.getElementById(OVERLAY_ID);

    if (overlay) {
      // If the overlay already exists, toggle its visibility
      if (overlay.style.display === "none") {
        overlay.style.display = "flex";
      } else {
        overlay.style.display = "none";
      }
    } else {
      // If it doesn't exist, create it for the first time
      createTimezoneConverterOverlay();
    }
  }
});
