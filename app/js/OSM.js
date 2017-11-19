var BDB = BDB || {};

BDB.OSM = {
  ///////////////////
  // G L O B A L S //
  ///////////////////


  ///////////////////
  // M E T H O D S //
  ///////////////////

  convertOSMtoBDB: function(osmObj) {
    let ret = {};
      
    // address: "Av. Erico Veríssimo, 31-41 - Menino Deus, Porto Alegre"
    // average: "4"
    // icon: Object
    // iconMini: Object
    // id: 1212
    // isCovered: null
    // isPublic: true
    // lat: "-30.045377212905038"
    // lng: "-51.21941795487408"
    // photo: ""
    // reviews: "1"
    // structureType: "uinvertido"
    // text: "Paraciclos EPTC"
    // _hasDetails: false

    // Basic info
    ret.id = osmObj.id;
    ret.lat = osmObj.lat;
    ret.lng = osmObj.lon;
    
    // OSM tags
    if (osmObj.tags) {
      const tags = osmObj.tags;

      ret.reviews = 0;
      ret.description = tags.description || '';

      // @todo reverse geocode this
      // ret.address

      // https://wiki.openstreetmap.org/wiki/Key:access
      if (tags.access) {
        switch(tags.access) {
        case 'public':
        case 'yes':
        case 'permissive':
          ret.isPublic = true;
          break; 
        case 'private': 
        case 'no':
        case 'customers':
        case 'destination':
          ret.isPublic = false;
          break;
        default:
          console.debug('No mapping for access=' + tags.access);
        }
        // ret.description += '<br><b>Tipo de acesso:</b> ' + tags.access;
      }

      // https://wiki.openstreetmap.org/wiki/Key:bicycle_parking
      if (tags.bicycle_parking) {
        switch(tags.bicycle_parking) {
        case 'wide_stands':
        case 'bollard':
        case 'stands':
          ret.structureType = 'uinvertido';
          break;
        case 'wall_hoops':
        case 'wall_loops': 
          ret.structureType = 'deroda';
          break;
        case 'ground_slots':
        case 'rack':
          ret.structureType = 'outro';
          break;
        default:
          console.debug('No mapping for bicycle_parking=' + tags.bicycle_parking);
        }
        // ret.tag_type = tags.bicycle_parking;
      }

      if (tags.name) {
        ret.text = tags.name;
        if (tags.operator) {
          // ret.description += '<br><b>Operado por</b>: ' + tags.operator;
          ret.tag_operator = tags.operator;
        }
      } else if (tags.operator) {
        ret.text = `${tags.operator} <small>(operador)</small>`;
      }

      if (tags.capacity) {
        ret.tag_capacity = tags.capacity;
      }

      if (tags.fee) {
        switch(tags.fee) {
        case 'yes':
          // ret.description += '<br><b>Pago:</b> sim';
          ret.tag_fee = 'Pago';
          break;
        case 'no':
          // ret.description += '<br><b>Pago:</b> não';
          ret.tag_fee = 'Grátis';
          break;
        }
      }

      if (tags.lit) {
        switch(tags.lit) {
        case 'yes':
          // ret.description += '<br><b>Iluminado:</b> sim';
          ret.tag_lit = 'Iluminado';
          break;
        case 'no':
          ret.tag_lit = 'Mal iluminado';
          break;
        }
      }

      // if (tags.supervised) {
      //   switch(tags.supervised) {
      //   case 'yes':
      //     // ret.description += '<br><b>Monitorado:</b> sim';
      //     break;
      //   case 'no':
      //     // ret.description += '<br><b>Monitorado:</b> não';
      //     break; 
      //   }
      // }

      if (tags.covered) {
        switch(tags.covered) {
        case 'yes':
          ret.isCovered = true;
          break;
        case 'no':
          ret.isCovered = false;
          break;
        default:
          console.debug('No mapping for covered=' + tags.covered);
        }
      }


      if (tags.opening_hours) {
        ret.tag_openinghours = tags.opening_hours;
      }

      if (tags.website) {
        ret.tag_website = tags.website; 
      }

      // 
      // Debug mode
      ret.description += '<small style="color: gray;">' + JSON.stringify(tags).split(',"').join(',<br>"') + '</small>';
      // ret.description += '<small style="color: gray;">' + JSON.stringify(tags) + '</small>';
    }

    return ret;
  },

  getPlaces: function(callback) {
    // if (!map || !map.getBounds()) {
    //   return;
    // }

    const queryStr = `
        [out:json][timeout:25];
        (
          node["amenity"="bicycle_parking"](${_overpassQLBoundingBox});
          //way["amenity"="bicycle_parking"]({{bbox}});
          //relation["amenity"="bicycle_parking"]({{bbox}});
        );
        out body;
        >;
        out skel qt;
    `;
    //node["amenity"="bicycle_parking"](${map.getBounds().toUrlValue()});
    //node["amenity"="bicycle_parking"](-34.0526594796,-61.3037107971,0.1757808338,-34.3652340941);

    this.runOverpassQuery(queryStr)
      .then( data => {
        // convert and plot
        if (data.elements) {
          console.debug(`Retrieved ${data.elements.length} nodes from OSM.`);
          toastr['success'](`${data.elements.length} bicicletários importados.`); 

          for(let i=0; i < data.elements.length; i++) {
            const convertedNode = BDB.OSM.convertOSMtoBDB(data.elements[i]);
            markers.push(convertedNode); 
          }
        }

        if (callback && typeof callback === 'function') {
          callback();
        }
      });
  },

  runOverpassQuery: function(queryStr) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'post',
        url: 'https://overpass-api.de/api/interpreter',
        data: queryStr,
        success: function(data) {
          console.debug('OSM Overpass API call success.');
          console.debug(data);
 
          resolve(data);
        },
        error: reject
      });
    });
  },
};
