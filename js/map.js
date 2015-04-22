(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});

  var heatmapConfig = {
    // field from data that will be used to represent data value in heatmap
    valueKey: 'rating',
    settings: {
      // radius should be small ONLY if scaleRadius is true (or small radius is intended)
      "radius": 12,
      "maxOpacity": .8,
      "minOpacity": 0,
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
      valueField: 'count',
      gradient: {
        '.5': 'red',
        '.95': 'red'
      }
    }
  };

  var mapConfig = {
    options: {
      maxBounds: [[37.9, -81.1], [41.5, -69.1]],
      minZoom: 8,
      maxZoom: 18,
      center: [ 39.96239, -75.125885],
      zoom: 11,
      scrollWheelZoom: false,
      trackResize: false
    },
    baseLayer: {
      template: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
      }
    }
  };

  var map, heatmapLayer, markers, lastFiltered;
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
    setHeatMapDataToLayer(data, heatmapLayer, 1);


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

  exports.KNIGHT.heatmapSimple = function(selector, data) {

    // set height of map
    d3.select(selector)
      .style('height', window.innerHeight-150 + 'px');

    // config layers
    var baseLayer = L.tileLayer(mapConfig.baseLayer.template, mapConfig.baseLayer.options);
    mapConfig.options.layers = [baseLayer];

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
    setHeatmapData(data,[]);

    tooltips(data);

    // set event handlers for map
    map.on('moveend', function(){
      var center = map.getCenter(),
          zoom = map.getZoom();
      var h = STA.hasher.get();

      STA.hasher.setMapState(center, zoom);

      filterMarkers();
    });

    map.fire('moveend');

    KNIGHT.on('filterChange.map', function(filtered){
      lastFiltered = filtered;
      setHeatmapData(data, filtered);
      filterMarkers();
    });

    KNIGHT.on('windowResize.map', function(){
      d3.select(selector)
        .style('height', window.innerHeight-150 + 'px');
      map.invalidateSize();
    });

    return map;
  };

  function filterMarkers() {
    if (!markers || !lastFiltered) return;

    var bds = map.getBounds();

    markers.forEach(function(m){
      if (hasCategory(m.categoryKeys, lastFiltered) && bds.contains(m.getLatLng())) {
        if (m.disabled_) {
          m.disabled_ = false;
          m.addTo(map);
        }
      } else {
        m.closePopup();
        m.disabled_ = true;
        map.removeLayer(m);
      }
    });
  };

  function hasCategory(keys, filtered) {
    var match = false;
    filtered.forEach(function(k){
      if (keys.indexOf(k) > -1) match = true;
    });
    return match;
  }

  function setHeatmapData(data,filtered) {
    //filtered = ['churches'];
    var lowRatings = [];
    var avgRatings = [];
    var highRatings = [];
    var latlng;

    var filteredData = data.filter(function(d){
      return hasCategory(d.categoryKeys, filtered);
    });


    filteredData.forEach(function(d){
      if(d[heatmapConfig.valueKey] >= 0 && d[heatmapConfig.valueKey] < 1.75) {
        latlng = new L.latLng([d.latitude, d.longitude]);
        latlng.alt = d.rating;
        lowRatings.push(latlng);
      }else if(d[heatmapConfig.valueKey] >= 1.75 && d[heatmapConfig.valueKey] < 3.5) {
        latlng = new L.latLng([d.latitude, d.longitude]);
        latlng.alt = d.rating;
        avgRatings.push(latlng);
      }else if(d[heatmapConfig.valueKey] >= 3.5 ) {
        latlng = new L.latLng([d.latitude, d.longitude]);
        latlng.alt = d.rating;
        highRatings.push(latlng);
      }
    });

    if (!heatmapLayer) {
      heatmapLayer = L.heatLayer(lowRatings, {
        key: 'one',
        radius: 6,
        minOpacity: 0.3,
        maxOpacity: 0.85,
        blur: 4,
        gradient: {0: '#ff0000', 0.5: '#ff0000', 1: '#ff0000'}
      }).addTo(map);
    } else {
       heatmapLayer.setLatLngs(lowRatings, {
        key: 'one',
        radius: 6,
        minOpacity: 0.3,
        maxOpacity: 0.85,
        blur: 4,
        gradient: {0: '#ff0000', 0.5: '#ff0000', 1: '#ff0000'}
       });
    }

    heatmapLayer.setLatLngs(avgRatings, {
        key: 'two',
        radius: 6,
        blur: 4,
        minOpacity: 0.3,
        maxOpacity: 0.85,
        gradient: {0: '#00ffff', 0.5: '#00ffff', 1: '#00ffff'}

    });

   heatmapLayer.setLatLngs(highRatings, {
        key: 'three',
        radius: 6,
        blur: 4,
        minOpacity: 0.3,
        maxOpacity: 0.85,
        gradient: {0: '#aaff00', 0.5: '#aaff00', 1: '#aaff00'}
    });

  }

  var tooltips = function(data) {
    markers = [];
    var circle = L.divIcon({className: 'circle-6'});
    data.forEach(function(d){
      var m = L.marker( [d.latitude, d.longitude],{icon: circle}).addTo(map);

      var content ="<b>" + d.name + "</b>: " + d.rating;
      m.bindPopup(content);
      m.categoryKeys = d.categoryKeys;
      markers.push(m);
    });

  };

  var philadelphiaOutline = function() {
    d3.json('data/philadelphia.geojson', function(err, data){
      if (err) return;

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