// var BIKE = BIKE || {};

var SIMULATED_DELAY_MS = 2300;
var MARKER_ICON_GREEN = 'img/icon-pin-green.png';
var MARKER_ICON_YELLOW = 'img/icon-pin-yellow-copy.png';
var MARKER_ICON_RED = 'img/icon-yellow-copy-2.png';
var MARKER_ICON_GRAY = 'img/icon-pin-gray.png';
var MARKER_W = 20;
var MARKER_H = 24;
var N_MOCK_PICS = 15;
var STRUCTURE_TYPES = ['U Invertido', 'De roda', 'Trave', 'Suspenso', 'Grade'];
var GMAPS_DIRECTIONS_URL = 'http://maps.google.com/maps?saddr="#{origin}"&daddr="#{destination}"';

var map;
var geocoder;
var markers = 'sdf';
var tags;
var _gmarkers;
var areMarkersHidden = false;
var addLocationMode = false;
var openedMarker;
var currentPendingRating;
var uploadingPhotoBlob;