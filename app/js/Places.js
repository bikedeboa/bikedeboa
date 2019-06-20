var BDB = BDB || {};

BDB.Places = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // reviews: undefined,
  // places: [],


  ///////////////////
  // M E T H O D S //
  ///////////////////

  // WIP
  // constructor: function() {
  //   places = [];
  // },

  // setPlaces: function(newPlaces) {
  //   places = newPlaces;
  // },

  // loadFromLocalStorage: function() {
  //   const tmp = JSON.parse(localStorage.getItem('markers'));

  //   for (let i = 0; i < tmp && tmp.length; i++) {
  //     tmp[i].gmarker = null;
  //   }

  //   return tmp;
  // },

  // saveToLocalStorage: function(markersToSave) {
  //   let tmp = markersToSave;

  //   for (let i = 0; i < tmp && tmp.length; i++) {
  //     tmp[i].gmarker = null;
  //   }

  //   localStorage.setItem('markers', JSON.stringify(tmp));
  // },

  getMarkerById: function (id, type) {
    if (!places) {
      console.error('error on getMarkerById: no places');
      return;
    }
    if (id && id >= 0) {
      const res = places.filter( i => i.id === id && i.type == type);
      if (res.length > 0) {
        return res[0];
      }
    }

    //console.error('Error on getMarkerById: ID is not valid');
    return null;
  },

  getMarkerShareUrl: function (marker) {
    if (!marker) {
      console.error('error on getMarkerShareUrl: no marker');
      return;
    }
    let prefix = (marker.type === 'rack') ? 'b' : 'r';
  
    let url = `/${prefix}/${marker.id}`;
    if (marker.text) {
      url += `-${slugify(marker.text)}`;
    }
 
    return url;
  } 
};
