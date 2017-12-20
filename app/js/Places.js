var BDB = BDB || {};

BDB.Places = {
  ///////////////////
  // G L O B A L S //
  ///////////////////

  // reviews: undefined,


  ///////////////////
  // M E T H O D S //
  ///////////////////

  getMarkerById: function (id) {
    if (!markers) {
      console.error('error on getMarkerById: no markers');
      return;
    }

    if (id && id >= 0) {
      const res = markers.filter( i => i.id === id );
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

    let url = `/b/${marker.id}`;
    if (marker.text) {
      url += `-${slugify(marker.text)}`;
    }
 
    return url;
  } 
};
