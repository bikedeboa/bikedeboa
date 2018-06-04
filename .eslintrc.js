module.exports = {
    "env": { 
      "es6": true,
      "node": true,
      "browser": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "warn",
            2
        ],
        "linebreak-style": [
            "warn",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        "semi": [
            "warn",
            "always"
        ]
    },
    "globals": {
        // Libs
        "$": false,
        "google": false,
        "Cookies": false,
        "Handlebars": false,
        "UpUp": false,
        "swal": false,
        "twttr": true,
        "toastr": true,
        "ga": true, //overriden on localhost

        // Constants
        "SIMULATED_DELAY_MS": false,
        "MARKER_W": false,
        "MARKER_H": false,
        "N_MOCK_PICS": false,
        "MIN_TITLE_CHARACTERS": false,
        "MARKER_ICON_GREEN": false,
        "MARKER_ICON_YELLOW": false,
        "MARKER_ICON_RED": false,
        "MARKER_ICON_GRAY": false,
        "MARKER_ICON_GREEN_MINI": false,
        "MARKER_ICON_YELLOW_MINI": false, 
        "MARKER_ICON_RED_MINI": false,
        "MARKER_ICON_GRAY_MINI": false,
        "STRUCTURE_TYPES": false,
        "GMAPS_DIRECTIONS_URL": false,
        "PHOTO_UPLOAD_MAX_W": false,
        "PHOTO_UPLOAD_MAX_H": false,
        "STRUCTURE_CODE_TO_NAME": false,
        "GOOGLEMAPS_KEY": false,
        "MARKER_W_MINI": false,
        "MARKER_H_MINI": false,

        // Global util functions
        "toggleSpinner": true,
        "showSpinner": true,
        "hideSpinner": true,
        "defaultFailCallback": true,
        "getBrowserName": true,
        "removeAccents": true,
        "slugify": true,
        "autoGrowTextArea": true,
        "copyToClipboard": true,

        // Global variables
        "BDB": true,
        "SideNav": true,
        "Database": true,
        "map": true,
        "geocoder": true,
        "places": true,
        "tags": true,
        "_gmarkers": true,
        "areMarkersHidden": true,
        "addLocationMode": true,
        "openedMarker": true,
        "newMarkerTemp": true,
        "currentPendingRating": true,
        "_uploadingPhotoBlob": true,
        "templates": true,
        "loggedUser": true,
        "_searchResultMarker": true,
        "_abortedDetailsRequest": true,
        "_geolocationInitialized": true,
        "_geolocationMarker": true,
        "_positionWatcher": true,
        "_geolocationRadius": true,
        "_sidenav": true,
        "_updatingReview": true,
        "_mapZoomLevel": true,
        "_isLocalhost": true,
        "_isFacebookBrowser": true,
        "_isMobile": true,
        "_gmapsCustomStyleStaticApi": true,
        "_activeFilters": true,
        "_infoWindow": true,
        "_isTouchDevice": true,
        "_isFacebookBrowser": true,
        "_activeFilters": true,
        "_infoWindow": true,
        "_isOffline": true,
        "_currentView": true,
        "_isDeeplink": true,
        "_onDataReadyCallback": true,
    }
};