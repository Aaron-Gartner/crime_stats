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
const propertyCrimes = [300, 311, 312, 313, 314, 321, 322, 323, 324, 331, 33, 334, 341, 342, 343, 344, 351, 352, 353, 354, 361, 363, 364, 371, 372, 373, 374, 500, 510, 511, 513, 515, 516, 520, 521, 523, 525, 526, 530, 531, 533, 535, 536, 540, 541, 543, 545, 546, 550, 551, 553, 555, 556, 560, 561, 563, 565, 566, 600, 603, 611, 612, 613, 621, 622, 623, 630, 631, 632, 633, 640, 641, 642, 643, 651, 652, 653, 661, 662, 663, 671, 672, 673, 681, 682, 683, 691, 693, 700, 710, 711, 712, 720, 721, 722, 1400, 1401, 1410, 1415, 1420, 1425, 1426, 1430, 1435, 1436];
const otherCrimes = [614, 1800, 1810, 1811, 1812, 1813, 1814, 1815, 1820, 1822, 1823, 1824, 1825, 1830, 1835, 1840, 1841, 1842, 1843, 1844, 1845, 1850, 1855, 1860, 1865, 1870, 1880, 1885, 2619, 9954, 9959];
const codeToCrimeTypeMapping = {
  'Murder': [110, 120],
  'Rape': [210,220],
  'Robbery': [300, 311, 312, 313, 314, 321, 322, 323, 324, 331, 33, 334, 341, 342, 343, 344, 351, 352, 353, 354, 361, 363, 364, 371, 372, 373, 374],
  'Aggravated Assault': [400, 410, 411, 412, 420, 421, 422, 430, 431, 432, 440, 441, 442, 450, 451, 452, 453],
  'Burglary': [500, 510, 511, 513, 515, 516, 520, 521, 523, 525, 526, 530, 531, 533, 535, 536, 540, 541, 543, 545, 546, 550, 551, 553, 555, 556, 560, 561, 563, 565, 566],
  'Theft': [600, 603, 611, 612, 613, 621, 622, 623, 630, 631, 632, 633, 640, 641, 642, 643, 651, 652, 653, 661, 662, 663, 671, 672, 673, 681, 682, 683, 691, 693],
  'Other': [614],
  'Motor Vehicle Theft': [700, 710, 711, 712, 720, 721, 722],
  'Domestic Assault': [810, 861, 862, 863],
  'Arson': [900, 901, 903, 905, 911, 913, 915, 921, 923, 931, 941, 942, 951, 961, 971, 972, 981, 982],
  'Vandalism': [1400, 1410, 1420, 1430],
  'Graffiti': [1401, 1415, 1416, 1425, 1426, 1435, 1436],
  'Narcotics': [1800, 1810, 1811, 1812, 1813, 1814, 1815, 1820, 1822, 1823, 1824, 1825, 1830, 1835, 1840, 1841, 1842, 1843, 1844, 1845, 1850, 1855, 1860, 1865, 1870, 1880, 1885],
  'Weapons': [2619],
  'Proactive Police Visit': [9954],
  'Community Engagement Event': [9959]
}
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
      end_time: 86399,
      isIncidentsReady: false
    },
    // Referenced from vue documentation https://vuejs.org/v2/guide/class-and-style.html and https://levelup.gitconnected.com/solving-common-vue-problems-classes-binding-and-more-4d4292daa66d
    methods: {
      findType: function(code) {
        if (violentCrimes.indexOf(code) > -1) {
          return 'violentClass'
        } else if (propertyCrimes.indexOf(code) > -1) {
          return 'propertyClass'
        } else {
          return 'otherClass'
        }
      }
    }
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
    //console.log(neighborhood_bounds);

    // Put the name of the place inside the search bar
    if (app.location_search !== "") {
      let url = `https://nominatim.openstreetmap.org/reverse?lat=${map.getCenter().lat}&lon=${map.getCenter().lng}&format=jsonv2&limit=25&accept-language=en`;
      getJSON(url)
        .then((data) => {
          //console.log(data);
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
      //console.log(map.getCenter());
      //console.log(map.getBounds());

      let currentSWBoundLat = map.getBounds().getSouthWest().lat;
      let currentSWBoundLng = Math.abs(map.getBounds().getSouthWest().lng);
      let currentNEBoundLat = map.getBounds().getNorthEast().lat;
      let currentNEBoundLng = Math.abs(map.getBounds().getNorthEast().lng);
      //console.log('BOUND: \nEASTERN LNG:\t' + currentNEBoundLng + '\nNORTHERN LAT:\t' + currentNEBoundLat + '\nWESTERN LNG:\t' + currentSWBoundLng + '\nSOUTHERN LAT:\t' + currentSWBoundLat);

      let visibleNeighborhoods = [];
      for (let i = 1; i < neighborhood_bounds.length; i++) {
        let currentHoodNELat = neighborhood_bounds[i]._northEast.lat;
        let currentHoodSWLat = neighborhood_bounds[i]._southWest.lat;
        let currentHoodNELng = Math.abs(neighborhood_bounds[i]._northEast.lng);
        let currentHoodSWLng = Math.abs(neighborhood_bounds[i]._southWest.lng);
        //console.log(i + '\nEASTERN LNG:\t' + currentHoodNELng + '\nNORTHERN LAT:\t' + currentHoodNELat + '\nWESTERN LNG:\t' + currentHoodSWLng + '\nSOUTHERN LAT:\t' + currentHoodSWLat);

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

      //console.log(visibleNeighborhoods);

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
    if (data[i] != undefined) {
      data[i]["neighborhood_name"] = app.neighborhoods[data[i].neighborhood_number];
      data[i]["incident_type"] = app.codes[data[i].code];
      let currentNeighborhood = parseInt(data[i].neighborhood_number);
      neighborhoodIncidents[currentNeighborhood]++;
    }
  }
  app.incidents = data;
  app.isIncidentsReady = true;
  //console.log(data);

  // bind the counts to the popup
  for (let i = 0; i < neighborhood_markers.length; i++) {
    var popup = L.popup().setLatLng(neighborhood_markers[i].location);
    popup.setContent("Incidents: " + neighborhoodIncidents[i + 1]);
    neighborhood_markers[i].marker.bindPopup(popup);
  }
}

// move map to where the input is after clicking the Go! button
function geoLocate() {
  let location;
  // regex from https://stackoverflow.com/questions/3518504/regular-expression-for-matching-latitude-longitude-coordinates
  if (/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/.test(app.location_search)) {
    location = app.location_search;
  } else {
    // locations can only be in St. Paul 
    location = app.location_search + " , St. Paul, Minnesota";
  }

  let url = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=25&accept-language=en`;

  getJSON(url)
    .then((data) => {
      if (data.length > 0) {
        let boundNE = map.options.maxBounds._northEast;
        let boundSW = map.options.maxBounds._southWest;
        let latLng;

        // if it is too far east, clamp to east bound
        if (data[0].lon > boundNE.lng) {
          data[0].lon = boundNE.lng;  
        // if it is too far west, clamp to west bound  
        } else if (data[0].lon < boundSW.lng) {
          data[0].lon = boundSW.lng;
        }
        
        // same thing north and south
        if (data[0].lat > boundNE.lat) {
          data[0].lat = boundNE.lat;
        } else if (data[0].lat < boundSW.lat) {
          data[0].lat = boundSW.lat;
        }

        latLng = [data[0].lat, data[0].lon];
        map = map.flyTo(latLng, 15.5);
      } else {
        console.log("error");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function handleFilters() {
  // Going from seconds to HH MM referenced from https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  let max = parseInt(app.max_incidents);
  let types = app.selected_types;
  let neighborhoods = app.selected_neighborhoods;
  let start_time = app.start_time;
  let end_time = app.end_time;

  let codes = [];
  for(let i = 0; i < types.length; i++) {
    let currentTypeCodes = codeToCrimeTypeMapping[types[i]];
    codes.push(currentTypeCodes.join(','))
  }
  codes = codes.join(',');
  //console.log(codes);

  let neighborhoodNumbers = [];
  for (let i = 0; i < neighborhoods.length; i++) {
    let idx = app.neighborhood_names.indexOf(neighborhoods[i]);
    if (idx > -1) {
      neighborhoodNumbers.push(idx + 1);
    }
  }
  neighborhoodNumbers = neighborhoodNumbers.join(',');
  /*console.log(neighborhoodNumbers);

  console.log('Max incidents: ' + max);
  console.log('Types: ' + types);
  console.log('Neighborhoods: ' + neighborhoods);
  console.log('Start Date: ' + app.start_date);
  console.log('End Date: ' + app.end_date);
  console.log('Start time: ' + start_time);
  console.log('End time: ' + end_time);*/

  // URL will always have the default max 1k
  let url = crime_url + '/incidents?';
  url += `limit=${max}`;

  if (codes) {
    url += `&code=${codes}`;
  }

  if (neighborhoodNumbers) {
    url += `&neighborhood=${neighborhoodNumbers}`;
  }

  if (app.start_date) {
    url += `&start_date=${app.start_date}`;
  }

  if (app.end_date) {
    url += `&end_date=${app.end_date}`;
  }

  //console.log(url);

  // Clear seach box so moving map won't change data
  app.location_search = '';

  let request = {
    url: url,
    dataType: "json",
    success: function(data) {
      if (start_time != 0 || end_time != 86399) {
        //console.log('custom time');
        for (let i = 0; i < data.length; i++) {
          let currentTime = data[i].time.split('.')[0];
          let hours = parseInt(currentTime.split(":")[0]);
          let minutes = parseInt(currentTime.split(":")[1]);
          let seconds = parseInt(currentTime.split(":")[2]);
          let currentTimeAsSeconds = (hours * 3600) + (minutes * 60) + seconds;
          if (currentTimeAsSeconds < start_time || currentTimeAsSeconds > end_time) {
            data[i] = undefined;
          }
        }
      }
      LocationData(data);
    },
    error: function (error) {
      LocationData([]);
      console.log(error);
    },
  };
  $.ajax(request);
}

// Removing marker was referenced from https://stackoverflow.com/questions/9912145/leaflet-how-to-find-existing-markers-and-delete-markers
var specialMarkers = {};
var specialMarkerLayerId;
function addMarker(incident) {
  let streetNumber = incident.block.split(' ')[0];
  let otherParts = incident.block.split(' ');
  if (/\d/.test(streetNumber)) {
    streetNumber = streetNumber.replaceAll('X', '0');
  }

  let address = streetNumber + ' ';
  for (let i = 1; i < otherParts.length; i++) {
    address += otherParts[i].trim() + ' ';
  }

  let location = address + " , St. Paul, Minnesota";
  let url = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=25&accept-language=en`;

  getJSON(url)
    .then((data) => {
      if (data) {
        var lat = data[0].lat;
        var lng = data[0].lon;

        // Found this icon library https://github.com/pointhi/leaflet-color-markers
        var specialIcon = new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        });
        var specialMarker = new L.marker([lat, lng], {icon: specialIcon});
        specialMarker.addTo(map);
        specialMarkers[specialMarker._leaflet_id] = specialMarker;
        specialMarkerLayerId = specialMarker._leaflet_id;
        var popup = new L.popup().setLatLng([lat, lng]);
        popup.setContent(`<p>Case number: ${incident.case_number}</p><p>Date: ${incident.date}</p><p>Time: ${incident.time.split('.')[0]}</p><p>${incident.incident}</p><button class="ui-button" id="${specialMarkerLayerId}" onclick="removeMarker(this.id, specialMarkers)">Delete</button>`);
        specialMarker.bindPopup(popup);
      } else {
        console.log("error");
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

function removeMarker(id, markers) {
  let markerToRemove = markers[id];
  map.removeLayer(markerToRemove);
}