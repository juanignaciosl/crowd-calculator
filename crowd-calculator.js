var map;
var areas = {};

var SQL_API_URL = 'https://juanignaciosl.cartodb.com/api/v2/sql';

var LOW_DENSITY = 1;
var MEDIUM_DENSITY = 2.5;
var HIGH_DENSITY = 4;

function init() {
  var mapId = 'cartodb-map';

  var mapDiv = document.getElementById(mapId);

  map = new L.Map(mapId, {
    center: [41.652044, -4.728007],
    zoom: 18
  });

  var baseLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);

  cartodb.createLayer(map, {
      user_name: 'juanignaciosl',
      type: 'cartodb',
      sublayers: []
  })
  .addTo(map) 
  .done(function(layer) {
    var v = cdb.vis.Overlay.create('search', map.viz, {})
    v.show();
    mapDiv.appendChild(v.render().el);

    enableDrawing(map);
  });
}

function enableDrawing(map) {
  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  var drawControl = new L.Control.Draw({
      edit: {
          featureGroup: drawnItems
      },
      draw: {
        polygon: true,
        rectangle: false,
        circle: false,
        marker: false,
        polyline: false
      }
  });
  map.addControl(drawControl);

  map.on('draw:created', function (e) {
    var type = e.layerType,
        layer = e.layer;

    var geoJSON = "'" + JSON.stringify(layer.toGeoJSON().geometry) + "'";

    var sql = "select crowd_calculator_insert_leaflet_data('crowd-01', " + geoJSON + ")";
    console.log('Sending...');
    $.ajax({
      type: 'POST',
      url: SQL_API_URL,
      crossDomain: true,
      data: { q: sql },
      dataType: 'json',
      success: function(responseData, textStatus, jqXHR) {
        console.log('done');

        var cartodbId = responseData.rows[0].crowd_calculator_insert_leaflet_data;
        calculateArea(cartodbId, function(area) {
          console.log('area', area);
          areas[cartodbId] = area;
          updateEstimation(areas);
        }, function(error) {
          console.log('error', error);
        });

        map.addLayer(layer);
      },
      error: function(responseData, textStatus, errorThrown) {
        console.log('error', errorThrown);
      }
    });
  });
}

function calculateArea(cartodbId, successCallback, errorCallback) {
  $.ajax({
    type: 'GET',
    url: SQL_API_URL,
    crossDomain: true,
    data: { q: 'SELECT ST_Area(the_geom::geography) as area FROM crowd_data where cartodb_id = ' + cartodbId },
    dataType: 'json',
    success: function(responseData, textStatus, jqXHR) {
      successCallback(responseData.rows[0].area);
    },
    error: function(responseData, textStatus, jqXHR) {
      errorCallback(responseData.responseText);
    }
  });
}

function updateEstimation(areas) {
  var areaSpan = document.getElementById('area');
  var area = 0;
  for(cartodbId in areas) { area += areas[cartodbId]; }
  areaSpan.innerText = area.toFixed(2);
  var peopleSpan = document.getElementById('people');
  peopleSpan.innerText = (area * LOW_DENSITY).toFixed() + ' < ' + (area * MEDIUM_DENSITY).toFixed() + ' < ' + (area * HIGH_DENSITY).toFixed();
}
