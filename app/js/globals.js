///////////////
// Constants //
///////////////

//DEFAULT_COORDS is pointing to Porto Alegre
const DEFAULT_COORDS = { latitude: -30.0346, longitude: -51.2177 };

const N_MOCK_PICS = 14;

const MARKER_SIZE_MULTIPLIER = 1.5;

const MARKER_W = 20 * MARKER_SIZE_MULTIPLIER;
const MARKER_H = 26 * MARKER_SIZE_MULTIPLIER;
const MARKER_W_MINI = 16; 
const MARKER_H_MINI = 16;
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
const PHOTO_UPLOAD_MAX_W = 1000; 
const PHOTO_UPLOAD_MAX_H = 1000;

const MAX_RECENT_SEARCHES = 3;
const MAX_TOP_CITIES = 5;

const ANIMATIONS_MULTIPLIER = 1;
const MODAL_TRANSITION_IN_DURATION = 700 * ANIMATIONS_MULTIPLIER;
const STAGGER_SLOW = 100 * ANIMATIONS_MULTIPLIER;
const STAGGER_NORMAL = 75 * ANIMATIONS_MULTIPLIER;
const STAGGER_FAST = 50 * ANIMATIONS_MULTIPLIER;

let STRUCTURE_MAP = new Map();

STRUCTURE_MAP.set('uinvertido','U Invertido');
STRUCTURE_MAP.set('deroda','De Roda',);
STRUCTURE_MAP.set('trave','Trave');
STRUCTURE_MAP.set('suspenso','Suspenso');
STRUCTURE_MAP.set('grade','Grade');
STRUCTURE_MAP.set('other','Outro');

const BDB_ENV = '<BDB_ENV>';

const MOBILE_MAX_WIDTH = '430px'; 
const DESKTOP_MIN_WIDTH = '430px';
let _isMobile = window.matchMedia && window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH})`).matches;

const _isLocalhost = BDB_ENV === 'localhost';
const _isTouchDevice = ('ontouchstart' in window || navigator.msMaxTouchPoints);

const MAX_AUTHENTICATION_ATTEMPTS = 3;

const MAX_KM_TO_CALCULATE_ITINERARY = 20;

/////////////
// Globals //
/////////////
 
let map;
let geocoder;
let markers;
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
