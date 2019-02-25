var BDB = BDB || {};

BDB.Markers = (function(){

	let markers;
	let gmarkers;
	let markerClusterer;


	return {
		updateMarkers: function(map, mapZoomLevel, infoWindow, markerClickCallback){
			console.log('updateMarkers');

			this.clearMarkers();

			// Places from Database
			if (places && places.length > 0) {

				for (let i = 0; i < places.length; i++) {
				  const m = places[i];

				  if (m) {
				    // Icon and Scaling
				    let scale;
				    let iconType, iconTypeMini;
				    if(m.type ==="rack"){
				    	let color = getColorFromAverage(m.average);
				    	m.average = formatAverage(m.average);
					    switch (color) {
					    case 'red':
					      iconType = MARKER_ICON_RACK;
					      iconTypeMini = MARKER_ICON_RACK_MINI;
					      scale = 0.4;
					      break;
					    case 'yellow':
					      iconType = MARKER_ICON_RACK;
					      iconTypeMini = MARKER_ICON_RACK_MINI;
					      scale = 0.8;
					      break;
					    case 'green':
					      iconType = MARKER_ICON_RACK;
					      iconTypeMini = MARKER_ICON_RACK_MINI;
					      scale = 1;
					      break;
					    case 'gray':
					    default:
					      iconType = MARKER_ICON_RACK;
					      iconTypeMini = MARKER_ICON_RACK_MINI;
					      scale = 0.6;
					      break;
					    }
				    }else{
				    	scale = 1;
				    	if(m.support == 0){
				    		scale = 0.6;
				    	}else if (m.support >= 1 && m.support <= 20) {
				    		scale = 0.8;
				    	}else if (m.support > 20) {
				    		scale = 1;
				    	}

				    	iconType = MARKER_ICON_REQUEST;
				    	iconTypeMini = MARKER_ICON_REQUEST_MINI;
				    	
				    }
				    

				    if (map) {
				      m.icon = {
				        url: iconType, // url
				        scaledSize: new google.maps.Size((MARKER_W * scale), (MARKER_H * scale)), // scaled size
				        origin: new google.maps.Point(0, 0), // origin
				        anchor: new google.maps.Point((MARKER_W * scale) / 2, (MARKER_H - MARKER_H / 10) * scale), // anchor
				      };
				      
				      m.iconSelected = { 
				        url: iconType, // url
				        scaledSize: new google.maps.Size((MARKER_W * 1.5), (MARKER_H * 1.5)), // scaled size
				        origin: new google.maps.Point(0, 0), // origin
				        anchor: new google.maps.Point((MARKER_W * 1.5) / 2, (MARKER_H - MARKER_H / 10) * 1.5), // anchor
				      }

				      m.iconMini = {
				        url: iconTypeMini, // url
				        scaledSize: new google.maps.Size((MARKER_W_MINI * scale), (MARKER_H_MINI * scale)), // scaled size
				        origin: new google.maps.Point(0, 0), // origin
				        anchor: new google.maps.Point((MARKER_W_MINI * scale) / 2, (MARKER_H_MINI * scale) / 2), // anchor
				      };


				      if (m.lat && m.lng) {
				        let newMarker = new google.maps.Marker({
				          optimized: true, 
				          position: {
				            lat: parseFloat(m.lat),
				            lng: parseFloat(m.lng)
				          },
				          icon: mapZoomLevel === 'mini' ? m.iconMini : m.icon,
				          zIndex: i, //places should be ordered by average
				          // opacity: 0.1 + (m.average/5).
				        });
				        

				        // Info window
				        /*let templateData = {
					          thumbnailUrl: (m.photo) ? m.photo.replace('images', 'images/thumbs') : '',
					          title: m.text,
					          average: m.average,
					          roundedAverage: m.average && ('' + Math.round(m.average)),
					          pinColor: getColorFromAverage(m.average),
					          numReviews : m.reviews
				        	};*/
				        let templateData;
				        if (m.type === 'rack'){
				        	templateData = {
				        	  type : 1,
					          thumbnailUrl: (m.photo) ? m.photo.replace('images', 'images/thumbs') : '',
					          title: m.text,
					          average: m.average,
					          roundedAverage: m.average && ('' + Math.round(m.average)),
					          pinColor: getColorFromAverage(m.average),
					          numReviews : m.reviews
				        	};
				        }else { 
				        	templateData = {
				        	  type : 0,
					          thumbnailUrl: (m.photo) ? m.photo.replace('images', 'images/thumbs') : '',
					          title: m.text,
					          supporters: 0
				        	};
				        }
				        
				        const contentString = BDB.templates.infoWindow(templateData);

				        if (_isTouchDevice) {
				          // Infobox preview on click
				          newMarker.addListener('click', () => {
				            ga('send', 'event', 'Local', 'infobox opened', m.id);

				            // Close previous, if any 
				            if (infoWindow && infoWindow.reset) {
				              infoWindow.reset(); 
				            }

				            map.panTo(newMarker.getPosition());
				            newMarker.setIcon(m.iconSelected);
				            m.originalZIndex = newMarker.getZIndex();
				            newMarker.setZIndex(9999);

				            BDB.Map.showDirectionsToPlace(newMarker.position);

				            $('body').append(`<div class="infoBox"> ${contentString} </div>`);
				            // $('.map-action-buttons').addClass('move-up');

				            infoWindow = $('.infoBox');
				            infoWindow.off('click').on('click', () => {
				              markerClickCallback(m, () => {
				                infoWindow.reset();
				              });
				            });

				            infoWindow.reset = function() {
				              this.remove();
				              // $('.map-action-buttons').removeClass('move-up');

				              BDB.Map.removeDirections();

				              newMarker.setIcon(m.icon);
				              newMarker.setZIndex(m.originalZIndex);
				            }
				          });
				        } else {
				          // No infobox, directly opens the details modal
				          newMarker.addListener('click', () => {
				            markerClickCallback(m);
				          });

				          // Infobox preview on hover
				          newMarker.addListener('mouseover', () => {
				            ga('send', 'event', 'Local', 'infobox opened', m.id);

				            infoWindow.setContent(contentString);
				            infoWindow.open(map, newMarker);
				            infoWindow.addListener('domready', () => {
				              $('.infobox--img img').off('load').on('load', e => {
				                $(e.target).parent().removeClass('loading');
				              });
				            });
				          });

				          newMarker.addListener('mouseout', () => {
				            infoWindow.close();
				          });
				        }

				        gmarkers.push(newMarker);
				        m.gmarker = newMarker;
				      } else {
				        console.error('error: pin with no latitude/longitude');
				      }
				    }

				  } else {
				    console.error('marker is weirdly empty on addMarkerToMap()');
				  }
				}

				if (map) {
				  //_geolocationMarker.setZIndex(markers.length);

				  const clustererStyles = [
				    {
				      url: '/img/cluster_medium.png',
				      height: 50,
				      width: 50
				    },
				    {
				      url: '/img/cluster_medium.png',
				      height: 75,
				      width: 75
				    },
				    {
				      url: '/img/cluster_medium.png',
				      height: 80,
				      width: 80
				    },
				    {
				      url: '/img/cluster_big.png',
				      height: 100,
				      width: 100
				    },
				    {
				      url: '/img/cluster_big.png',
				      height: 120,
				      width: 120
				    },
				  ];
				  let clustererOptions = {
				    maxZoom: 10, 
				    minimumClusterSize: 1,
				    styles: clustererStyles,
				    gridSize: 60
				  };
				  if (_isMobile) {
				    clustererOptions.maxZoom = 15;
				    clustererOptions.minimumClusterSize = 2;
				  }
				  markerClusterer = new MarkerClusterer(map, gmarkers, clustererOptions); 
				  return markerClusterer;
				}
			}
		},
		
		clearMarkers: function(){
			// setMapOnAll(null);
		     gmarkers = [];
		     if (markerClusterer) {
		       markerClusterer.clearMarkers();
		     }
		},
		getGMarkers: function(){
			return gmarkers;
		}
	}

})();