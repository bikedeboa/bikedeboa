import React from "react";
import { MapContainer } from "./styled";
import { GoogleMap, withScriptjs, withGoogleMap } from "react-google-maps";

const GMap = () => (
  <GoogleMap 
    defaultZoom={16}
    defaultCenter={{ lat: -23.604710, lng: -46.634330}}
  />
)
const WrappedMap = withScriptjs(withGoogleMap(GMap));

const Map = () => (
  <MapContainer>
    <WrappedMap
      googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${process.env.REACT_APP_GOOGLE_KEY}`}
      loadingElement={<div style={{height:`100%`}}/>}
      containerElement={<div style={{height:`100%`}}/>}
      mapElement={<div style={{height:`100%`}}/>}
    />
  </MapContainer>
)

export default Map;