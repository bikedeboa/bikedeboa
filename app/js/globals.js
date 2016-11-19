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
const N_MOCK_PICS = 14;
const MIN_TITLE_CHARACTERS = 0;
const MARKER_ICON_GREEN = 'img/pin_green.svg';
const MARKER_ICON_YELLOW = 'img/pin_yellow.svg';
const MARKER_ICON_RED = 'img/pin_red.svg';
const MARKER_ICON_GRAY = 'img/pin_gray.svg';
const GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';

// const STRUCTURE_NAMES = ['U Invertido', 'De roda', 'Trave', 'Suspenso', 'Grade', 'Outro'];
// const STRUCTURE_CODES = ['uinvertido', 'deroda', 'trave', 'suspenso', 'grade', 'other'];
const STRUCTURE_NAMES = ['U Invertido', 'De roda', 'Outro', 'Suspenso'];
const STRUCTURE_CODES = ['uinvertido', 'deroda', 'other', 'suspenso'];
const STRUCTURE_NAME_TO_CODE = createMapFromArrays(STRUCTURE_NAMES, STRUCTURE_CODES);
const STRUCTURE_CODE_TO_NAME = createMapFromArrays(STRUCTURE_CODES, STRUCTURE_NAMES);


/////////////////////////
//                     //
//                     //
let isDemoMode = window.location.pathname !== '/login'; //@todo temp
//                     //
//                     //
/////////////////////////

let Database;
let map;
let geocoder;
let markers = [];
let tags = [];
let idToTag = {};
let tagToId = {};
let _gmarkers;
let areMarkersHidden = false;
let addLocationMode = false;
let openedMarker;
let currentPendingRating;
let _uploadingPhotoBlob;
let loggedUser;

let templates = {};
