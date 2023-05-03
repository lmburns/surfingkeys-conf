import theme from "./theme.js"
import keys from "./keys.js"
import searchEngines from "./search-engines.js"

export default {
  settings: {
    defaultSearchEngine:      "go",
    // ══════════════════════════════════════════════════════════════════════
    // Alignment of hints on their target elements
    hintAlign:                "left",
    hintCharacters:           "qwertasdfgzxcvb",
    hintShiftNonActive:       true,
    richHintsForKeystroke:    1,
    // ══════════════════════════════════════════════════════════════════════
    // Show suggestion URLs
    omnibarSuggestion:        true, // false
    // Timeout duration before Omnibar suggestion URLs are queried
    omnibarSuggestionTimeout: 500, // 200
    // The maximum of items fetched from browser history
    omnibarHistoryCacheSize:  150, // 100
    // How many results will be listed out each page for Omnibar
    omnibarMaxResults:        10, // 10
    // Whether to focus first candidate of matched result in Omnibar
    focusFirstCandidate:      false, // false
    // Whether to list history in order of most used beneath Omnibar
    historyMUOrder:           true, // true
    // Whether to list opened tabs in order of most recently used beneath Omnibar
    tabsMRUOrder:             true, // true
    // ══════════════════════════════════════════════════════════════════════
    // When total of opened tabs exceeds the number, Omnibar will be used for choosing tabs
    tabsThreshold:            10, // 9
    // Where to place a newly opened tab
    newTabPosition:           "right", // "default" | ["left", "right", "first", "last", "default"]
    // Which tab will be focused after the current tab is closed
    focusAfterClosed:         "left", // "right" | ["left", "right", "last"]
    // ══════════════════════════════════════════════════════════════════════
    // Whether always to show mode status
    showModeStatus:           false, // false
    // Whether to show proxy info in status bar
    showProxyInStatusBar:     false, // false
    // ══════════════════════════════════════════════════════════════════════
    // Whether to use smooth scrolling when pressing scrolling keys
    smoothScroll:             true, // true
    // A step size for each move by `j`/`k`
    scrollStepSize:           70, // 70
    // A force that is needed to start continuous scrolling after initial scroll step.
    // A bigger number will cause a flicker after initial step, but help to keep the first step precise
    scrollFriction:           0, // 0
    // ══════════════════════════════════════════════════════════════════════
    // Whether to put cursor at end of input when entering an input box,
    //   false: to put the cursor where it was when focus was removed from the input
    cursorAtEndOfInput:       true, // true
    // Whether to focus text input after quitting from vim editor
    focusOnSaved:             true, // true
    // Whether to enable auto focus after mouse click on some widget.
    // For example, there is a hidden input box on a page, it is turned to visible after user clicks on some other link.
    // If you don't like the input to be focused when it's turned to visible, you could set this to false
    enableAutoFocus:          true, // true
    // Insert mode is activated automatically when an editable element is focused.
    // For example, if `document.body` is editable for some window/iframe (e.g., docs.google.com),
    // Insert mode is always activated on that window/iframe, meaning all Normal mode bindings aren't available.
    editableBodyCare:         true, // true
    // ══════════════════════════════════════════════════════════════════════
    // The maximum of actions to be repeated
    repeatThreshold:          99, // 99
    // Whether digits are reserved for repeats, by false to enable mapping of numeric keys
    digitForRepeat:           true, // true
    // ══════════════════════════════════════════════════════════════════════
    // Whether finding in page/Omnibar is case sensitive
    caseSensitive:            false, // false
    // Whether to make caseSensitive true if the search pattern contains upper case characters
    smartCase:                true, // true
    // Which mode to fall back after yanking text in visual mode
    modeAfterYank:            "Caret", // "" | ["", "Caret", "Normal"]

    // To change css of the Surfingkeys UI elements
    theme,
  },

  keys,
  searchEngines,

  // Leader for site-specific mappings
  siteleader: "<Space>",

  // Leader for OmniBar searchEngines
  searchleader: "a",
}
