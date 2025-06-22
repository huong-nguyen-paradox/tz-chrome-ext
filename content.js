// content.js (Empty/Not used directly as separate file for this approach) ---
// In this specific implementation, the JavaScript logic that runs in the page's
// context is embedded directly in the `background.js` file within the
// `getSelectedTextAndInjectOverlay` function, which is then `executeScript`-ed.

// This means you technically don't need a separate `content.js` file for this approach,
// but it's good to keep the structure in mind for more complex content script needs.
// For clarity, I'm keeping this comment block, but you don't need to create a `content.js` file
// with content if you use the `function` property of `executeScript`.
// If you wanted a larger, more complex content script, you would use `files: ['content.js']`
// in executeScript and define the entire overlay logic within `content.js` itself.
/*
// This file would contain the JavaScript for interacting with the webpage.
// For this example, its content is now part of the function injected from background.js.
*/