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
  });
}
