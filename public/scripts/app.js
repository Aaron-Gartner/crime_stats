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

// Violent: 110/120 Murder, 210/220 Rape, 400-453 Agg Assault, 810-863 dom assault, 900-982 arson
// Property: 300-374 Robbery, 500-566 Burglary, 600-693 (except 614) Theft, 700-722 Vehicle theft, 1400 Vandalism, 1401-1436 Graffiti
// Other: 614 other, 1800-1885 narcotics, 2619 Weapons, 9954 proactive visit, 9959 comm eng event
const violentCrimes = [110, 120, 210, 220, 400, 410, 411, 412, 420, 421, 422, 430, 431, 432, 440, 441, 442, 450, 451, 452, 453, 810, 861, 862, 863, 900, 901, 903, 905, 911, 913, 915, 921, 923, 931, 941, 942, 951, 961, 971, 972, 981, 982];
const propertyCrimes = [300, 311, 312, 313, 314, 321, 322, 323, 324, 331, 33, 334, 341, 342, 343, 344, 351, 352, 353, 354, 361, 363, 364, 371, 372, 373, 374, 500, 510, 511, 513, 515, 516, 520, 521, 523, 525, 526, 530, 531, 533, 535, 536, 540, 541, 543, 545, 546, 550, 551, 553, 555, 556, 560, 561, 563, 565, 566, 600, 603, 611, 612, 613, 621, 622, 623, 630, 631632, 633, 640, 641, 642, 643, 651, 652, 653, 661, 662, 663, 671, 672, 673, 681, 682, 683, 691, 693, 700, 710, 711, 712, 720, 721, 722, 1400, 1401, 1410, 1415, 1420, 1425, 1426, 1430, 1435, 1436];
const otherCrimes = [614, 1800, 1810, 1811, 1812, 1813, 1814, 1815, 1820, 1822, 1823, 1824, 1825, 1830, 1835, 1840, 1841, 1842, 1843, 1844, 1845, 1850, 1855, 1860, 1865, 1870, 1880, 1885, 2619, 9954, 9959];

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
      neighborhoods: [],
      neighborhood_names: ['Conway/Battlecreek/Highwood', 'Greater East Side', 'West Side', "Dayton's Bluff", 'Payne/Phalen', 'North End', 'Thomas/Dale(Frogtown)', 'Summit/University', 'West Seventh', 'Como', 'Hamline/Midway', 'St. Anthony', 'Union Park', 'Macalester-Groveland', 'Highland', 'Summit Hill', 'Capitol River'],
      codes: [],
      incident_types: ['Murder', 'Rape', 'Robbery', 'Aggravated Assault', 'Burglary', 'Theft', 'Other', 'Motor Vehicle Theft', 'Domestic Assault', 'Arson', 'Vandalism', 'Graffiti', 'Narcotics', 'Weapons', 'Proactive Police Visit', 'Community Engagement Event'],
      toggle: false,
      max_incidents: 1000,
      selected_types: [],
      selected_neighborhoods: [],
      start_date: '',
      end_date: '',
      start_time: 0,
      end_time: 86400
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

  // Fills array of neighborhood names for Vue app
  getJSON(crime_url + "/neighborhoods")
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        app.neighborhoods[data[i].neighborhood_number] = data[i].neighborhood_name;
      }
    })
    .catch((error) => {
      console.log(error);
    });

  // Fills array of incident types by code for Vue app  
  getJSON(crime_url + "/codes")
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        app.codes[data[i].code] = data[i].incident_type;
      }
    })
    .catch((error) => {
      console.log(error);
    });

  // Callback that is done when map is done moving  
  map.on("moveend", () => {
    district_boundary.eachLayer((layer) => {
      neighborhood_bounds[parseInt(layer.feature.properties.district)] =
        layer._bounds;
    });
    console.log(neighborhood_bounds);

    // Put the name of the place inside the search bar
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

      // Determine which neighborhoods are currently visible on the map  
      console.log(map.getCenter());
      console.log(map.getBounds());

      let currentSWBoundLat = map.getBounds().getSouthWest().lat;
      let currentSWBoundLng = Math.abs(map.getBounds().getSouthWest().lng);
      let currentNEBoundLat = map.getBounds().getNorthEast().lat;
      let currentNEBoundLng = Math.abs(map.getBounds().getNorthEast().lng);
      console.log('BOUND: \nEASTERN LNG:' + currentNEBoundLng + '\nNORTHERN LAT: ' + currentNEBoundLat + '\nWESTERN LNG: ' + currentSWBoundLng + '\nSOUTHERN LAT: ' + currentSWBoundLat);

      let visibleNeighborhoods = [];
      for (let i = 1; i < neighborhood_bounds.length; i++) {
        let currentHoodNELat = neighborhood_bounds[i]._northEast.lat;
        let currentHoodSWLat = neighborhood_bounds[i]._southWest.lat;
        let currentHoodNELng = Math.abs(neighborhood_bounds[i]._northEast.lng);
        let currentHoodSWLng = Math.abs(neighborhood_bounds[i]._southWest.lng);
        console.log(i + '\nEASTERN LNG:' + currentHoodNELng + '\nNORTHERN LAT: ' + currentHoodNELat + '\nWESTERN LNG: ' + currentHoodSWLng + '\nSOUTHERN LAT: ' + currentHoodSWLat);

        //south edge is south of nothern. north edge is north of south same w west and south
        // part of neighborhood is north of the southernmost lat OR south of the northernmost lat
        // AND east of the westernmost lng or west of the easternmost lng
        if (
          (currentHoodNELat >= currentSWBoundLat && currentHoodSWLat <= currentNEBoundLat) &&
          (currentHoodNELng <= currentSWBoundLng && currentHoodSWLng >= currentNEBoundLng)
        ) {
          visibleNeighborhoods.push(i);
        }
      }

      console.log(visibleNeighborhoods);

      // Call incidents API to get the top 1k incidents w/ neighborhoods visible on map
      let request = {
        url: `${crime_url}/incidents?neighborhood=${visibleNeighborhoods.join(",")}`,
        dataType: "json",
        success: LocationData,
        error: function (error) {
          console.log(error);
        },
      };
      $.ajax(request);
    }
  });
}

// promise for getting JSON data
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

// fill the table
function LocationData(data) {
  for (let i = 0; i < data.length; i++) {
    data[i]["neighborhood_name"] =
      app.neighborhoods[data[i].neighborhood_number];
    data[i]["incident_type"] =
      app.codes[data[i].code];
  }
  app.incidents = data;
  console.log(data);

  // adding markers to neighborhood_markers array
  for (let i = 0; i < neighborhood_markers.length; i++) {
    var marker = L.marker(neighborhood_markers[i].location).addTo(map);
    neighborhood_markers[i].marker = marker;
  }

  // Count up the incidents present in each neighborhood
  var neighborhoodIncidents = [];
  for (let i = 0; i < neighborhood_markers.length + 1; i++) {
    neighborhoodIncidents.push(0);
  }
  for (let i = 0; i < data.length; i++) {
    let currentNeighborhood = parseInt(data[i].neighborhood_number);
    neighborhoodIncidents[currentNeighborhood]++;
  }

  // bind the counts to the popup
  for (let i = 0; i < neighborhood_markers.length; i++) {
    var popup = L.popup().setLatLng(neighborhood_markers[i].location);
    popup.setContent("Incidents: " + neighborhoodIncidents[i + 1]);
    neighborhood_markers[i].marker.bindPopup(popup);
  }
}

// move map to where the input is after clicking the Go! button
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