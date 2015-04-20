(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});

  var heatmapConfig = {
    // field from data that will be used to represent data value in heatmap
    valueKey: 'rating',
    settings: {
      // radius should be small ONLY if scaleRadius is true (or small radius is intended)
      "radius": 8,
      "maxOpacity": .8,
      // scales the radius based on map zoom
      "scaleRadius": false,
      // if set to false the heatmap uses the global maximum for colorization
      // if activated: uses the data maximum within the current map boundaries
      //   (there will always be a red spot with useLocalExtremas true)
      "useLocalExtrema": false,
      // which field name in your data represents the latitude - default "lat"
      latField: 'lat',
      // which field name in your data represents the longitude - default "lng"
      lngField: 'lng',
      // which field name in your data represents the data value - default "value"
      valueField: 'count'
    }
  };

  var mapConfig = {
    options: {
      maxBounds: [[37.9, -81.1], [41.5, -69.1]],
      minZoom: 8,
      maxZoom: 18,
      center: [ 39.96239, -75.125885],
      zoom: 11,
      scrollWheelZoom: false
    },
    baseLayer: {
      template: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      }
    }
  };

  var map, heatmapLayer;
  exports.KNIGHT.heatmap = function(selector, data) {

    // set height of map
    d3.select(selector)
      .style('height', window.innerHeight-150 + 'px');

    // config layers
    var baseLayer = L.tileLayer(mapConfig.baseLayer.template, mapConfig.baseLayer.options);
    heatmapLayer = new HeatmapOverlay(heatmapConfig.settings);
    mapConfig.options.layers = [baseLayer, heatmapLayer];

    // update map coordinates if present in hash
    var hashCoords = STA.hasher.getMapState();
    if (hashCoords) {
      mapConfig.options.center = hashCoords.center;
      mapConfig.options.zoom = hashCoords.zoom;
    }

    // create map
    map = L.map('map', mapConfig.options);

    // draw Philadelphia mask
    philadelphiaOutline();

    // config heatmap
    var max = d3.max(data, function(d){
      return d[heatmapConfig.valueKey];
    });
    var min = d3.min(data, function(d){
      return d[heatmapConfig.valueKey];
    });

    var heatmapData = [];

    data.forEach(function(d){
      heatmapData.push({
        lat: d.location.coordinate.latitude,
        lng: d.location.coordinate.longitude,
        count: 1
      });
    });

    heatmapLayer.setData({
      max: max,
      min: min,
      data: heatmapData
    });

    // set event handlers for map
    map.on('moveend', function(){
      var center = map.getCenter(),
          zoom = map.getZoom();
      var h = STA.hasher.get();

      STA.hasher.setMapState(center, zoom);
    });

    map.fire('moveend');

    return map;
  };

  var philadelphiaOutline = function() {
    d3.json('data/philadelphia.geojson', function(err, data){
      if (err) return;

      console.log(data);

      var outsideExtent = {
        's': 36,
        'w': -82,
        'n': 42,
        'e': -68
      };
      var outerRing = [];
      outerRing.push([outsideExtent.w, outsideExtent.n]);
      outerRing.push([outsideExtent.e, outsideExtent.n]);
      outerRing.push([outsideExtent.e, outsideExtent.s]);
      outerRing.push([outsideExtent.w, outsideExtent.s]);

      data.features[0].geometry.coordinates.push(outerRing);

      L.geoJson(data, {
        style: {
          'fillColor': '#000',
          'fillOpacity': 0.1,
          'weight': 0
        }
      }).addTo(map);

    });
  };

})(this);