const SIMULATED_DELAY_MS = 2300;
const MARKER_ICON_GREEN = 'img/icon-pin-green.png';
const MARKER_ICON_YELLOW = 'img/icon-pin-yellow-copy.png';
const MARKER_ICON_RED = 'img/icon-yellow-copy-2.png';
const MARKER_ICON_GRAY = 'img/icon-pin-gray.png';
const MARKER_W = 20;
const MARKER_H = 24;
const N_MOCK_PICS = 15;
const STRUCTURE_TYPES = ['U Invertido', 'De roda', 'Trave', 'Suspenso', 'Grade'];
const GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';

let Database = BIKE.MockedDatabase;
let map;
let geocoder;
let markers = 'sdf';
let tags = ['Iluminado', 'Movimentado', 'Monitorado', 'Fácil acesso', 'Espaçoso'];
let _gmarkers;
let areMarkersHidden = false;
let addLocationMode = false;
let openedMarker;
let currentPendingRating;
let uploadingPhotoBlob;

let templates = {};