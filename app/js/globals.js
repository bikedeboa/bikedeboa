///////////
// Utils //
///////////

function createMapFromArrays(a, b) {
  let ret = {};
  a.forEach( (val, i) => {
    ret[val] = b[i];
  });

  return ret;
}

function getSimulatedDelay () {
  return Math.floor(Math.random() * 2000) + 500;
}


///////////////
// Constants //
///////////////

const BDB_COUNTRYCODE = '<BDB_COUNTRYCODE>';

const CAPITALS = {
  'BR': { latitude: -30.0346, longitude: -51.2177 }, // Porto Alegre
  'PT': { latitude: 38.736946, longitude: -9.142685 } // Lisbon
};

const DEFAULT_COORDS = CAPITALS[BDB_COUNTRYCODE];

const N_MOCK_PICS = 14;

const MAX_ZOOM_TO_SHOW_PINS = 14;

const MARKER_SIZE_MULTIPLIER = 1.5;

const MARKER_W = 20 * MARKER_SIZE_MULTIPLIER;
const MARKER_H = 26 * MARKER_SIZE_MULTIPLIER;
const MARKER_W_MINI = 18; 
const MARKER_H_MINI = 18;
const CURRENT_LOCATION_MARKER_W = 20;
const CURRENT_LOCATION_MARKER_H = 20; 
const MARKER_ICON_GREEN = '/img/pin_green.svg';
const MARKER_ICON_YELLOW = '/img/pin_yellow.svg';
const MARKER_ICON_RED = '/img/pin_red.svg';
const MARKER_ICON_GRAY = '/img/pin_gray.svg';
const MARKER_ICON_GREEN_MINI = '/img/pin_green_mini.svg';
const MARKER_ICON_YELLOW_MINI = '/img/pin_yellow_mini.svg';
const MARKER_ICON_RED_MINI = '/img/pin_red_mini.svg';
const MARKER_ICON_GRAY_MINI = '/img/pin_gray_mini.svg';

const MARKER_ICON_RACK = '/img/pin_rack.svg';
const MARKER_ICON_REQUEST = '/img/pin_request.svg';
const MARKER_ICON_RACK_MINI = '/img/pin_rack_mini.svg';
const MARKER_ICON_REQUEST_MINI = '/img/pin_request_mini.svg';

const PHOTO_UPLOAD_MAX_W = 1000; 
const PHOTO_UPLOAD_MAX_H = 1000;

const MAX_RECENT_SEARCHES = 3;
const MAX_TOP_CITIES = 5;

const ANIMATIONS_MULTIPLIER = 1;
const MODAL_TRANSITION_IN_DURATION = 700 * ANIMATIONS_MULTIPLIER;
const STAGGER_SLOW = 100 * ANIMATIONS_MULTIPLIER;
const STAGGER_NORMAL = 75 * ANIMATIONS_MULTIPLIER;
const STAGGER_FAST = 50 * ANIMATIONS_MULTIPLIER;


const STRUCTURE_NAMES = ['U Invertido', 'Entorta Roda', 'Poste', 'Suspenso', 'Grade/Vedação', 'Outro', 'Pescocinho', 'Paliteiro', 'Tipo M', 'Pente'];
const STRUCTURE_CODES = ['uinvertido', 'deroda', 'trave', 'suspenso', 'grade', 'other', 'pescocinho', 'paliteiro', 'm', 'pente'];
const STRUCTURE_NAME_TO_CODE = createMapFromArrays(STRUCTURE_NAMES, STRUCTURE_CODES);
const STRUCTURE_CODE_TO_NAME = createMapFromArrays(STRUCTURE_CODES, STRUCTURE_NAMES);

const TAG_NAMES_PT = ['espaçoso', 'fácil acesso', 'vigiado', 'movimentado', 'reforçado', 'visível'];
const TAG_NAMES_EN = ['spacious', 'easyaccess', 'monitored', 'bustling', 'strong', 'visible'];
const TAG_NAMES__PT_TO_EN = createMapFromArrays(TAG_NAMES_PT, TAG_NAMES_EN);
const TAG_NAMES__EN_TO_PT = createMapFromArrays(TAG_NAMES_EN, TAG_NAMES_PT);

const GOOGLEMAPS_KEY = '<GOOGLE_MAPS_ID>';
const FACEBOOK_CLIENT_ID = '<FACEBOOK_CLIENT_ID>';
const GOOGLE_CLIENT_ID = '<GOOGLE_CLIENT_ID>';
const BDB_ENV = '<BDB_ENV>';

const MOBILE_MAX_WIDTH = '430px'; 
const DESKTOP_MIN_WIDTH = '430px';
let _isMobile = window.matchMedia && window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH})`).matches;

const _isLocalhost = BDB_ENV === 'localhost';
const _isTouchDevice = ('ontouchstart' in window || navigator.msMaxTouchPoints);

const MAX_AUTHENTICATION_ATTEMPTS = 3;

const MAX_KM_TO_CALCULATE_ITINERARY = 20;
const MAX_KM_TO_FIT_TO_VIEWPORT = 2;

const MAX_NAME_SUGGESTIONS = 5;

const MAP_BOUNDS_COORDS = { 
    sw: { lat: '-34.0526594796', lng: '-61.3037107971' }, 
    ne: { lat: '0.1757808338', lng: '-34.3652340941' } 
};
/////////////
// Globals //
/////////////
 
let map;
let geocoder;
let places;
let tags;
let idToTag = {};
let tagToId = {};
let addLocationMode = false;
let openedMarker;
let _newMarkerTemp;
let currentPendingRating;
let _uploadingPhotoBlob;
let _searchResultMarker;
let _abortedDetailsRequest;
let _hamburgerMenu;
let _filterMenu;
let _updatingReview;
let _isFacebookBrowser;
let _activeFilters;
let _isOffline;
let _currentView;
let _isDeeplink = false;
let _deeplinkMarker;
let _onDataReadyCallback;
let _socialToken;
let _centerChangedTimeout;
let _deferredPWAPrompt;
let _loginMutexBlocked;
let _isFeatherlightOpen;
let _routePendingData;
let _forceOffline;

let templates = {};
