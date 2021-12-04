let app;
let map;
var crime_url = "http://localhost:8000";

let neighborhood_markers = [
  { location: [44.942068, -93.020521], marker: null },
  { location: [44.977413, -93.025156], marker: null },
  { location: [44.931244, -93.079578], marker: null },
  { location: [44.956192, -93.060189], marker: null },
  { location: [44.978883, -93.068163], marker: null },
  { location: [44.975766, -93.113887], marker: null },
  { location: [44.959639, -93.121271], marker: null },
  { location: [44.9477, -93.128505], marker: null },
  { location: [44.930276, -93.119911], marker: null },
  { location: [44.982752, -93.14791], marker: null },
  { location: [44.963631, -93.167548], marker: null },
  { location: [44.973971, -93.197965], marker: null },
  { location: [44.949043, -93.178261], marker: null },
  { location: [44.934848, -93.176736], marker: null },
  { location: [44.913106, -93.170779], marker: null },
  { location: [44.937705, -93.136997], marker: null },
  { location: [44.949203, -93.093739], marker: null },
];

const neighborhood_names = [
  "Conway/Battlecreek/Highwood",
  "Greater East Side",
  "West Side",
  "Dayton's Bluff",
  "Payne/Phalen",
  "North End",
  "Thomas/Dale(Frogtown)",
  "Summit/University",
  "West Seventh",
  "Como",
  "Hamline/Midway",
  "St. Anthony",
  "Union Park",
  "Macalester-Groveland",
  "Highland",
  "Summit Hill",
  "Capitol River",
];

function init() {
  app = new Vue({
    el: "#app",
    data: {
      map: {
        center: {
          lat: 44.955139,
          lng: -93.102222,
          address: "",
        },
        zoom: 12,
        bounds: {
          nw: { lat: 45.008206, lng: -93.217977 },
          se: { lat: 44.883658, lng: -92.993787 },
        },
      },
      incidents: [],
      location_search: "",
    },
  });

  map = L.map("leafletmap").setView(
    [app.map.center.lat, app.map.center.lng],
    app.map.zoom
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 11,
    maxZoom: 18,
  }).addTo(map);
  map.setMaxBounds([
    [44.883658, -93.217977],
    [45.008206, -92.993787],
  ]);

  map.on("moveend", () => {
    console.log(map.getCenter());
  });

  let district_boundary = new L.geoJson();
  district_boundary.addTo(map);

  // Create object of neighborhoods that contains all the lat lng reference points for each neighborhood
  var neighborhoods = {};
  getJSON("data/StPaulDistrictCouncil.geojson")
    .then((result) => {
      // St. Paul GeoJSON
      $(result.features).each(function (key, value) {
        district_boundary.addData(value);
        console.log(value);
        neighborhoods[`${value.properties.district}`] = [];
        let coordinates = value.geometry.coordinates;
        console.log(coordinates);
        for (let i = 0; i < coordinates[0][0].length; i++){
            console.log('here');
            neighborhoods[`${value.properties.district}`].push([coordinates[0][0][i][1], coordinates[0][0][i][0]]);
        }
      });
    })
    .catch((error) => {
      console.log("Error:", error);
    });
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      dataType: "json",
      url: url,
      success: function (data) {
        resolve(data);
      },
      error: function (status, message) {
        reject({ status: status.status, message: status.statusText });
      },
    });
  });
}

function LocationSearch(event) {
  if (app.location_search !== "") {
    let request = {
      url: `${crime_url}/incidents`,
      dataType: "json",
      success: LocationData,
    };
    $.ajax(request);
  } else {
    app.location_search = "";
  }

  geoLocate();
}

function LocationData(data) {

  for (let i = 0; i < data.length; i++) {
      let neighborhoodNumber = data[i].neighborhood_number;
      getJSON(crime_url+`/neighborhoods?id=${neighborhoodNumber}`).then((data2) => {
          data[i]['neighborhood_name'] = data2[0].neighborhood_name;
      }).catch((error) => {
          console.log(error);
      });

      if (i == data.length) {
          app.forceUpdate();
      }
  }
  app.incidents = data;
  //console.log(app.incidents[0]);
  console.log(data);

  // adding markers to neighborhood_markers array
  for (let i = 0; i < neighborhood_markers.length; i++) {
    var marker = L.marker(neighborhood_markers[i].location).addTo(map);
    neighborhood_markers[i].marker = marker;
  }

  var neighborhoodIncidents = [];
  for (let i = 0; i < neighborhood_markers.length + 1; i++) {
    neighborhoodIncidents.push(0);
  }

  for (let i = 0; i < data.length; i++) {
    let currentNeighborhood = parseInt(data[i].neighborhood_number);
    neighborhoodIncidents[currentNeighborhood]++;
  }

  for (let i = 0; i < neighborhood_markers.length; i++) {
    var popup = L.popup().setLatLng(neighborhood_markers[i].location);
    popup.setContent("Incidents: " + neighborhoodIncidents[i + 1]);
    neighborhood_markers[i].marker.bindPopup(popup);
  }
}

function geoLocate() {
  let location = app.location_search + " , St. Paul, Minnesota";
  let url = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=25&accept-language=en`;

  getJSON(url)
    .then((data) => {
      if (data) {
        console.log(data[0]);
        let latLng = [data[0].lat, data[0].lon];
        map.flyTo(latLng, 15.5);
        console.log(map.getBounds());

        console.log(neighborhoods);

        

        /*
        let parts = data[0].display_name.split(",");
        let neighborhood;
        for (let i = 0; i < parts; i++) {
            if (neighborhood_names.indexOf(parts[i].trim()) > 0) {
                console.log(parts[i]);
                neighborhood = parts[i];
            }
        }
        if (neighborhood == "Downtown") {
          neighborhood = "Capitol River";
        } else if (neighborhood.toLowerCase().includes("highland")) {
          neighborhood = "Highland";
        }*/
      } else {
        console.log("error");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

