const colorScale = chroma.scale(['#fbe4f8', '#6a0dad']).domain([0, 1]);

function getColor(IC) {
  return colorScale(IC).hex(); // Get the color as a HEX value
}

proj4.defs("EPSG:32719", "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs"); // Source projection (UTM Zone 19S)
const sourceProj = "EPSG:32719"; // Your GeoJSON's projection
const targetProj = "EPSG:4326"; // Leaflet's required projection (WGS84)

const map = L.map('map').setView([-33.45, -70.66], 11); // Center map on your area

// Add a base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

fetch('src/datos_comunas.geojson')
  .then(response => response.json())
  .then(geojsonData => {
    // Iterate over features
    geojsonData.features.forEach(feature => {
      const geometry = feature.geometry;
      const properties = feature.properties;

      if (geometry.type === "Polygon") {
        // Reproject coordinates for each polygon
        const transformedCoordinates = geometry.coordinates[0].map(coord => {
          const [x, y] = proj4(sourceProj, targetProj, coord); // Transform each coordinate
          return [y, x]; // Flip for Leaflet's [lat, lng]
        });

        const color = getColor(properties.IC);
        const polygon = L.polygon(transformedCoordinates, { color: "#6a0dad", fillColor: color, fillOpacity:0.7 }).addTo(map);
        // Attach a tooltip (display on hover)
        polygon.bindTooltip(`<b>${properties.nombre_comuna}</b>`, {
            permanent: false, 
            direction: "auto"
          });
  
        
          polygon.bindPopup(`
            <div>
              <h5 style="font-family:monospace;">${properties.nombre_comuna}</h4>
              <p style="font-family:monospace;"><b>Área urbanizada:</b> ${properties.area_urbanizada}</p> 
              <p style="font-family:monospace;"><b>Número paradas:</b> ${properties.num_paradas} </p> 
            <p style="font-family:monospace;" ><b>IC:</b> ${properties.IC} </p>
            </div>
          `);
      }
    });
  })
  .catch(error => console.error("Error loading GeoJSON:", error));


  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend');
    const grades = [0, 0.2, 0.4, 0.6, 0.8, 1];  // Define the range of IC values
    const labels = [];
  
    // Loop through the grades and create a colored square for each one
    for (let i = 0; i < grades.length; i++) {
      const color = getColor(grades[i]); // Get the color for the grade
      div.innerHTML +=
        `<i style="background:${color}; width: 20px; height: 20px; display: inline-block; margin-right: 5px;"></i>` + // Color box
        grades[i] + (grades[i + 1] ? `&ndash;${grades[i + 1]}<br>` : '+');
    }
  
    return div;
  };
  
  legend.addTo(map);