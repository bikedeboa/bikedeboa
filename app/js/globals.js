function createMapFromArrays(a, b) {
  let ret = {};
  a.forEach( (val, i) => {
    ret[val] = b[i];
  });

  return ret;
}

function isDesktop() {
  return window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
}

function getSimulatedDelay () {
  return Math.floor(Math.random() * 2000) + 500;
}

const MARKER_W = 20;
const MARKER_H = 24;
const MARKER_W_MINI = 10;
const MARKER_H_MINI = 12;
const N_MOCK_PICS = 14;
const MIN_TITLE_CHARACTERS = 0;
const MARKER_ICON_GREEN = 'img/pin_green.svg';
const MARKER_ICON_YELLOW = 'img/pin_yellow.svg';
const MARKER_ICON_RED = 'img/pin_red.svg';
const MARKER_ICON_GRAY = 'img/pin_gray.svg';
const MARKER_ICON_GREEN_MINI = 'img/pin_green_mini.svg';
const MARKER_ICON_YELLOW_MINI = 'img/pin_yellow_mini.svg';
const MARKER_ICON_RED_MINI = 'img/pin_red_mini.svg';
const MARKER_ICON_GRAY_MINI = 'img/pin_gray_mini.svg';
// const GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';
const PHOTO_UPLOAD_MAX_W = 1000;
const PHOTO_UPLOAD_MAX_H = 1000;

const STRUCTURE_NAMES = ['U Invertido', 'de Roda', 'Trave', 'Suspenso', 'Grade', 'Estranho'];
const STRUCTURE_CODES = ['uinvertido', 'deroda', 'trave', 'suspenso', 'grade', 'other'];
// const STRUCTURE_NAMES = ['U Invertido', 'De roda', 'Estranho', 'Suspenso'];
// const STRUCTURE_CODES = ['uinvertido', 'deroda', 'other', 'suspenso'];
const STRUCTURE_NAME_TO_CODE = createMapFromArrays(STRUCTURE_NAMES, STRUCTURE_CODES);
const STRUCTURE_CODE_TO_NAME = createMapFromArrays(STRUCTURE_CODES, STRUCTURE_NAMES);
const MODAL_TRANSITION_IN_DURATION = 700;
const GOOGLEMAPS_KEY = 'AIzaSyD6TeLzQCvWopEQ7hBdbktYsmYI9aNjFc8';

const _isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

/////////////////////////
//                     //
//                     //
let isDemoMode = false;
//                     //
//                     //
/////////////////////////

let map;
let _mapBoundsCoords = {sw: {lat:"-33.815031097046436", lng:'-57.6784069268823'}, ne: {lat: '-27.048660701748112', lng:'-49.5485241143823'}};
let _mapBounds;
let Database;
let geocoder;
let markers = [];
let tags = [];
let idToTag = {};
let tagToId = {};
let _gmarkers;
let _geolocationMarker;
let _geolocationRadius;
let areMarkersHidden = false;
let addLocationMode = false;
let openedMarker = {};
let newMarkerTemp = {};
let currentPendingRating;
let _uploadingPhotoBlob;
let loggedUser;
let _searchResultMarker;
let _abortedDetailsRequest;
let _positionWatcher;
let _sidenav;
let _geolocationInitialized;
let _updatingReview;
let _userIP;
let _mapZoomLevel;
let _isFacebookBrowser;

let templates = {};
