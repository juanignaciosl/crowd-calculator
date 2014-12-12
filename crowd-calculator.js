var map;
var loadedCrowd;
var areas = {};
var layers = [];
var cartodbIds = {};

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

    loadSavedCrowds();
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
    var crowdName = document.getElementById('crowd-name').value;
    if(crowdName === '') {
      alert('Please set crowd name before editing');
      return;
    }

    var type = e.layerType,
        layer = e.layer;

    var geoJSON = "'" + JSON.stringify(layer.toGeoJSON().geometry) + "'";

    var sql = "select crowd_calculator_insert_leaflet_data('" + crowdName + "', " + geoJSON + ")";
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
        updateArea(cartodbId);

        layers.push(layer);
        map.addLayer(layer);
      },
      error: function(responseData, textStatus, errorThrown) {
        console.log('error', errorThrown);
      }
    });
  });
}

function updateArea(cartodbId) {
  calculateArea(cartodbId, function(area) {
    areas[cartodbId] = area;
    updateEstimation();
  }, function(error) {
    console.log('error', error);
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

function updateEstimation() {
  var areaSpan = document.getElementById('area');
  var area = 0;
  for(cartodbId in areas) { area += areas[cartodbId]; }
  areaSpan.innerText = area.toFixed(2);
  var peopleSpan = document.getElementById('people');
  peopleSpan.innerText = (area * LOW_DENSITY).toFixed() + ' < ' + (area * MEDIUM_DENSITY).toFixed() + ' < ' + (area * HIGH_DENSITY).toFixed();
}

function loadSavedCrowds() {
  var selectCrowdsSql = 'select crowd_name, array_agg(cartodb_id) as cartodb_ids from crowd_data group by crowd_name order by crowd_name';
  var select = document.getElementById('crowd-selection');

  $.getJSON(SQL_API_URL + '/?q=' + selectCrowdsSql, function(data) {
    $.each(data.rows, function(key, val) {
      var crowdName = val.crowd_name;
      $(select).append('<option value="' + crowdName + '">' + crowdName + '</option>');
      cartodbIds[crowdName] = val.cartodb_ids;
    });
  });

  select.disabled = false;
  document.getElementById('crowd-name').disabled = false;
}

function loadCrowd(crowdName) {
  cleanMap();

  var crowdNameField = document.getElementById('crowd-name');
  crowdNameField.value = crowdName;
  if(crowdName == '') {
    crowdNameField.disabled = false;
  } else {
    crowdNameField.disabled = true;

    loadLayer(crowdName);
    loadAreas(cartodbIds[crowdName]);
  }

}

function loadLayer(crowdName) {
  var layerUrl = "http://team.cartodb.com/api/v2/viz/13e13fd6-81fb-11e4-8dbe-0e4fddd5de28/viz.json"
  var subLayerOptions = {
    sql: "select * from crowd_data where crowd_name = '" + crowdName + "'"
  }
  cartodb.createLayer(map, layerUrl, {
    legends: false
  })
  .on('done', function(layer) {
    loadedCrowd = layer;
    layer.getSubLayer(0).set(subLayerOptions);
    layer.addTo(map);
  }).on('error', function() {
    console.log('error', error);
  });
}

function loadAreas(cartodbIds) {
  cartodbIds.map(function(cartodbId) {
      updateArea(cartodbId);
  });
}

function cleanMap() {
  layers.map(function(layer) {
    map.removeLayer(layer);
  });
  layers = [];
  areas = {};
  updateEstimation();
  if(loadedCrowd) {
    loadedCrowd.remove();
    loadedCrowd = null;
  }
}
