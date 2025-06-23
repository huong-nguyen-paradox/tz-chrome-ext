// This script runs in the context of the current webpage. 
// It creates, injects, and manages the tz overlay.

(function() {
    console.log('in function()');

    // define a unique ID for the overlay to prevent multiple injections and manage its state
    const OVERLAY_ID = 'time-zone-converter-overlay';
    // const TAILWIND_CDN = 'https://cdn.tailwindcss.com'; // removed as we will now load a local file

    let overlay = document.getElementById(OVERLAY_ID);
    console.log('OVERLAY_ID = ', OVERLAY_ID);

    // if the overlay already exists, remove it
    if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        return; // exit if just toggling visibility
    }

    // overlay creation and html injection
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;

    // apply initialy styles for the draggable, floating overlay
    overlay.className = 'fixed top-1/4 left-1/2 -translate-x-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-200 z-[2147483647] flex flex-col gap-4 max-w-sm sm:max-w-md w-full'; // z-index to be on top of everything
    overlay.style.cursor = 'grab'; // indicate it's draggable
    overlay.style.resize = 'both'; // allow resizing
    overlay.style.overflow = 'auto'; // add scrollbars if content overflows during resize
    overlay.style.minWidth = '300px'; 
    overlay.style.minHeight = '350px'; 

    // Inject our local compiled Tailwind CSS file (prev: Inject Tailwind CSS CDN link (CDN link instead of via a CSS file for simplicity for being being injected by a content script))
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('tailwind.css'); // use chrome.runtime.getURL to get the full path to local CSS file within the ext
    document.head.appendChild(styleLink);

    // inner HTML for the converter tool
    overlay.innerHTML = `
        <!-- Close button -->
        <button id="${OVERLAY_ID}-close-btn"
                class="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 transition duration-150 ease-in-out">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <h2 class="text-xl font-bold text-gray-800 text-center -mt-2">Time Zone Converter</h2>

        <!-- Input for Date and Time -->
        <div>
            <label for="${OVERLAY_ID}-datetime-input" class="block text-sm font-medium text-gray-700 mb-1">Date and Time:</label>
            <input type="datetime-local" id="${OVERLAY_ID}-datetime-input"
                   class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
        </div>

        <!-- From Time Zone Selector -->
        <div>
            <label for="${OVERLAY_ID}-from-timezone-select" class="block text-sm font-medium text-gray-700 mb-1">From Time Zone:</label>
            <select id="${OVERLAY_ID}-from-timezone-select"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-no-repeat bg-right-center"
                    style="background-image: url('data:image/svg+xml;utf8,<svg fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'><path fill-rule=\\'evenodd\\' d=\\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\\' clip-rule=\\'evenodd\\'></path></svg>'); background-size: 1.5em 1.5em; padding-right: 2.5rem;">
                <!-- Options will be populated by JavaScript -->
            </select>
        </div>

        <!-- To Time Zone Selector -->
        <div>
            <label for="${OVERLAY_ID}-to-timezone-select" class="block text-sm font-medium text-gray-700 mb-1">To Time Zone:</label>
            <select id="${OVERLAY_ID}-to-timezone-select"
                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-no-repeat bg-right-center"
                    style="background-image: url('data:image/svg+xml;utf8,<svg fill=\\'currentColor\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'><path fill-rule=\\'evenodd\\' d=\\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\\' clip-rule=\\'evenodd\\'></path></svg>'); background-size: 1.5em 1.5em; padding-right: 2.5rem;">
                <!-- Options will be populated by JavaScript -->
            </select>
        </div>

        <!-- Result Display -->
        <div id="${OVERLAY_ID}-result-display" class="mt-2 p-4 bg-blue-50 rounded-md text-blue-800 text-center font-medium shadow-inner">
            Select a date/time and time zones to convert.
        </div>
    `

    document.body.appendChild(overlay);

    // TZ conversion logic

    // Function gets a list of common time zones
    function getTimeZones() {
        console.log('in getTimeZones()');
        
        const timeZones = [
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'America/Honolulu',
            'Europe/London', 'Europe/Berlin', 'Europe/Paris',
            'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata',
            'Australia/Sydney', 'Australia/Perth',
            'Africa/Johannesburg',
            'Etc/UTC'
        ];
        return timeZones.sort();
    }

    // Function to populate the time zone dropdowns
    function populateTimeZoneSelects() {
        console.log('in populateTimeZoneSelects()');

        const timeZones = getTimeZones();
        const fromSelect = document.getElementById(`${OVERLAY_ID}-from-timezone-select`);
        const toSelect = document.getElementById(`${OVERLAY_ID}-to-timezone-select`);

        const currentUserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        fromSelect.innerHTML = ''; // clear existing options
        toSelect.innerHTML = ''; 

        timeZones.forEach(zone => {
            const optionFrom = document.createElement('option');
            optionFrom.value = zone;
            optionFrom.textContent = zone.replace(/_/g, '');
            fromSelect.appendChild(optionFrom);

            const optionTo = document.createElement('option');
            optionTo.value = zone;
            optionTo.textContent = zone.replace(/_/g, ' ');
            toSelect.appendChild(optionTo);
        });

        if (timeZones.includes(currentUserTimeZone)) {
            fromSelect.value = currentUserTimeZone;
        } else {
            fromSelect.value = 'America/New_York';
        } 
        toSelect.value = 'Etc/UTC'; // default to UTC
    }

    // Function to convert time
    function convertTime() {
        console.log('in getTimeZones()');   

        const dateTimeInput = document.getElementById(`${OVERLAY_ID}-datetime-input`);
        const fromTimeZoneSelect = document.getElementById(`${OVERLAY_ID}-from-timezone-select`);
        const toTimeZoneSelect = document.getElementById(`${OVERLAY_ID}-to-timezone-select`);
        const resultDisplay = document.getElementById(`${OVERLAY_ID}-result-display`);

        const dateTimeString = dateTimeInput.value;
        const fromTimeZone = fromTimeZoneSelect.value;
        const toTimeZone = toTimeZoneSelect.value;

        if (!dateTimeString) {
            resultDisplay.textContent = 'Please enter a date and time.';
            resultDisplay.classList.remove('bg-blue-50', 'text-blue-800');
            resultDisplay.classList.add('bg-red-50', 'text-red-800');
            return;
        }

        try {
            const date = new Date(dateTimeString);

            if (isNaN(date.getTime())) {
                throw new Error('Invalid date and time input.');
            }

            const convertedDateString = date.toLocaleString('en-US', {
                timeZone: toTimeZone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            });

            resultDisplay.textContent = `Converted Time: ${convertedDateString} (${toTimeZone.replace(/_/g, ' ')})`; 
            resultDisplay.classList.remove('bg-red-50', 'text-red-800');
            resultDisplay.classList.add('bg-blue-50', 'text-blue-800');

        } catch (error) {
            resultDisplay.textContent = `Error: ${error.message}`;
            resultDisplay.classList.remove('bg-blue-50', 'text-blue-800');
            resultDisplay.classList.add('bg-red-50', 'text-red-800');
            console.error("Time conversion error:", error);
        }
    }

    // Event Listeners and Initial Setup
    // set current date and time as default in teh input field
    const dateTimeInput = document.getElementById(`${OVERLAY_ID}-datetime-input`);
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    dateTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

    populateTimeZoneSelects(); // populate dropdowns immediately

    // add event listeners for interaction
    document.getElementById(`${OVERLAY_ID}-close-btn`).addEventListener('click', () => {
        overlay.remove(); // remove the overlay from the DOM
    });

    dateTimeInput.addEventListener('change', convertTime);
    document.getElementById(`${OVERLAY_ID}-from-timezone-select`).addEventListener('change', convertTime);
    document.getElementById(`${OVERLAY_ID}-to-timezone-select`).addEventListener('change', convertTime);

    // convertTime(); // initial conversion on load ?

    // Make the overlay draggable
    let isDragging = false;
    let startX, startY, initialX, initialY;

    overlay.addEventListener('mousedown', (e) => {
        // only allow dragging if not clicking on input fields or select dropdowns
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
            isDragging = true;
            overlay.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            initialX = overlay.offsetLeft;
            initialY = overlay.offsetTop;
            e.preventDefault(); // prevent text selection on drag
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // calculate new position
        let newLeft = initialX + dx;
        let newTop = initialY + dy;

        // keep overlay within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const overlayRect = overlay.getBoundingClientRect();

        if (newLeft < 0) newLeft = 0;
        if (newTop < 0) newTop = 0;
        if (newLeft + overlayRect.width > viewportWidth) newLeft = viewportWidth - overlayRect.width;
        if (newTop + overlayRect.height > viewportHeight) newTop = viewportHeight - overlayRect.height;

        overlay.style.left = `${newLeft}px`;
        overlay.style.top = `${newTop}px`;
        overlay.style.transform = 'none'; //remove translation when dragged
    })

    document.addEventListener('mouseup', () => {
        isDragging = false;
        overlay.style.cursor = 'grab';
    });

})(); // End of IIFE (Immediately Invoked Function Expression)

