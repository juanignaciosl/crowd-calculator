var map;

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
      url: 'https://juanignaciosl.cartodb.com/api/v2/sql',
      crossDomain: true,
      data: { q: sql },
      dataType: 'json',
      success: function(responseData, textStatus, jqXHR) {
        console.log('done');

        map.addLayer(layer);
      },
      error: function(responseData, textStatus, errorThrown) {
        console.log('error', errorThrown);
      }
    });
  });
}
