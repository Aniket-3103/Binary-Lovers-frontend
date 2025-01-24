import React, { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;;

const LocationMap = () => {
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Initialize Map
    const initializeMap = () => {
      const mapInstance = new mapboxgl.Map({
        container: "map", // container ID
        style: "mapbox://styles/mapbox/streets-v11", // map style
        center: [77.209, 28.6139], // Default to Delhi (longitude, latitude)
        zoom: 12,
      });

      setMap(mapInstance);

      // Get current location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          setCurrentLocation(userCoords);

          // Center map on user's location
          mapInstance.setCenter(userCoords);

          // Add a marker for current location
          new mapboxgl.Marker({ color: "blue" })
            .setLngLat(userCoords)
            .setPopup(
              new mapboxgl.Popup().setHTML(`<h4>Your Location</h4>`)
            )
            .addTo(mapInstance);

          // Search for predefined query
          searchPlaces("plastic", mapInstance, userCoords);
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("Unable to get your location. Map centered on default.");
        }
      );
    };

    if (!map) initializeMap();

    return () => map && map.remove(); // Cleanup
  }, [map]);

  // Function to search predefined places
  const searchPlaces = async (query, mapInstance, userCoords) => {
    const [lng, lat] = userCoords;
    const searchUrl = `https://api.mapbox.com/search/searchbox/v1/forward?q=${encodeURIComponent(
      query
    )}&proximity=${lng},${lat}&access_token=${mapboxgl.accessToken}`;
  
    try {
      const response = await fetch(searchUrl);
      const data = await response.json();
  
      if (data.features && data.features.length > 0) {
        // Remove existing markers
        markers.forEach((marker) => marker.remove());
        setMarkers([]);
  
        // Add new markers with custom text
        const customTexts = ["Reusable ", "Eco-Friendly ", "Reusable Cups & "];
        const newMarkers = data.features.map((place) => {
          const [placeLng, placeLat] = place.geometry.coordinates;
  
          // Get the name of the place and prepend random custom text
          const placeName = place.properties.name || "Unknown Place";
          const randomCustomText =
            customTexts[Math.floor(Math.random() * customTexts.length)];
  
          const customName = `${randomCustomText} ${placeName}`;
  
          // Create a marker with the custom text in the popup
          const marker = new mapboxgl.Marker({ color: "red" })
            .setLngLat([placeLng, placeLat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<h4>${customName}</h4>
                 <p>${place.properties.full_address || place.place_formatted}</p>
                 <p>Category: ${
                   place.properties.poi_category?.join(", ") || "N/A"
                 }</p>`
              )
            )
            .addTo(mapInstance);
  
          return marker;
        });
  
        setMarkers(newMarkers); // Save markers to state
        mapInstance.flyTo({ center: [lng, lat], zoom: 12 });
      } else {
        alert("No results found for the search query.");
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("Error fetching search results. Please try again.");
    }
  };
  

  return (
    <div>
      <h1>Reusable Cups and Plastic Shops Near you</h1>
      <div id="map" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
};

export default LocationMap;
