let app;
let map;
var crime_url = "http://localhost:8000";

var neighborhood_bounds = [];

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

//const violentCrimes = [110,120,210,220,]

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

  let district_boundary = new L.geoJson();
  district_boundary.addTo(map);

  // Create object of neighborhoods that contains all the lat lng reference points for each neighborhood
  getJSON("data/StPaulDistrictCouncil.geojson")
    .then((result) => {
      // St. Paul GeoJSON
      $(result.features).each(function (key, value) {
        district_boundary.addData(value);
      });
    })
    .catch((error) => {
      console.log("Error:", error);
    });

  map.on("moveend", () => {
    district_boundary.eachLayer((layer) => {
      neighborhood_bounds[parseInt(layer.feature.properties.district)] =
        layer._bounds;
    });

    console.log(neighborhood_bounds);
    if (app.location_search !== "") {
      let url = `https://nominatim.openstreetmap.org/reverse?lat=${map.getCenter().lat}&lon=${map.getCenter().lng}&format=jsonv2&limit=25&accept-language=en`;
      getJSON(url)
        .then((data) => {
          console.log(data);
          if (data.name) {
            app.location_search = data.name;
          } else {
            app.location_search = data.display_name;
          }
        })
        .catch((error) => {
          console.log(error);
        });

      console.log(map.getCenter());
      console.log(map.getBounds());

      let currentCenterLat = map.getCenter().lat;
      let currentCenterLong = map.getCenter().lng;

      let visibleNeighborhoods = [];
      for (let i = 1; i < neighborhood_bounds.length; i++) {
        let currentMaxLat = neighborhood_bounds[i]._northEast.lat;
        let currentMinLat = neighborhood_bounds[i]._southWest.lat;
        let currentMaxLong = neighborhood_bounds[i]._northEast.lng;
        let currentMinLong = neighborhood_bounds[i]._southWest.lng;

        if (
          currentCenterLat <= currentMaxLat &&
          currentCenterLat >= currentMinLat &&
          currentCenterLong <= currentMaxLong &&
          currentCenterLong >= currentMinLong
        ) {
          visibleNeighborhoods.push(i);
        }
      }

      console.log(visibleNeighborhoods);
      getJSON(`${crime_url}/neighborhoods?id=${visibleNeighborhoods.join(",")}`).then((neighborhoodData) => {
        let neighborhoodNames = [];
        for (let i = 0; i < neighborhoodData.length; i++) {
          neighborhoodNames[neighborhoodData[i].neighborhood_number] = neighborhoodData[i].neighborhood_name;
        }

        if (app.location_search !== "") {
          let request = {
            url: `${crime_url}/incidents?neighborhood=${visibleNeighborhoods.join(",")}`,
            dataType: "json",
            success: function (data) {
              for (let i = 0; i < data.length; i++) {
                data[i]["neighborhood_name"] =
                  neighborhoodNames[data[i].neighborhood_number];
              }
              LocationData(data);
            },
            error: function (error) {
              console.log(error);
            },
          };
          $.ajax(request);
        } else {
          app.location_search = "";
        }
      });
    }
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

function LocationData(data) {
  console.log(data);
  app.incidents = data;

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
        let latLng = [data[0].lat, data[0].lon];
        map = map.flyTo(latLng, 15.5);
      } else {
        console.log("error");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
