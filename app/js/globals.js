const SIMULATED_DELAY_MS = 2300;
const MARKER_W = 20;
const MARKER_H = 24;
const N_MOCK_PICS = 14;
const MIN_TITLE_CHARACTERS = 1;
const MARKER_ICON_GREEN = 'img/pin_green.svg';
const MARKER_ICON_YELLOW = 'img/pin_yellow.svg';
const MARKER_ICON_RED = 'img/pin_red.svg';
const MARKER_ICON_GRAY = 'img/pin_gray.svg';
const STRUCTURE_TYPES = ['U Invertido', 'De roda', 'Trave', 'Suspenso', 'Grade'];
const GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';

let Database = BIKE.MockedDatabase;
let map;
let geocoder;
let markers = [];
let tags = ['Iluminado', 'Movimentado', 'Monitorado', 'Fácil acesso', 'Espaçoso', 'Coberto'];
let _gmarkers;
let areMarkersHidden = false;
let addLocationMode = false;
let openedMarker;
let currentPendingRating;
let uploadingPhotoBlob;

let templates = {};