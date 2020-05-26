import React from "react";
import { MapContainer } from "./styled";
import { 
  GoogleMap,
  withScriptjs,
  withGoogleMap, 
  Marker, 
  BicyclingLayer 
} from "react-google-maps";

const MapCenter = { 
  lat: -23.604710,
  lng: -46.634330,
}

const defaultMapOptions = { 
  fullscreenControl: false,
  mapTypeControl: false,
  zoomControl: false,
  streetViewControl: false,
}

const GMap = () => (
  <GoogleMap 
    defaultZoom={16}
    defaultCenter={MapCenter}
    defaultOptions={defaultMapOptions}
  >
    <Marker position={MapCenter} />
    <BicyclingLayer autoUpdate />
  </GoogleMap>
)
const WrappedMap = withScriptjs(withGoogleMap(GMap));

const Map = () => (
  <MapContainer>
    <WrappedMap
      googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${process.env.REACT_APP_GOOGLE_KEY}`}
      loadingElement={<div style={{height:`100vh`}}/>}
      containerElement={<div style={{height:`100vh`}}/>}
      mapElement={<div style={{height:`100vh`}}/>}
    />
  </MapContainer>
)

export default Map;