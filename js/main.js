(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});

  // available to all
  KNIGHT.dispatch = d3.dispatch('filterChange');
  d3.rebind(KNIGHT, KNIGHT.dispatch, 'on');


  function isValidLocation(item) {
    if (!isNaN(item.latitude) && !isNaN(item.longitude)) return true;
    return false;
  }

  var map, dataList;

  KNIGHT.init = function() {
    d3.csv('data/output.csv', function(d){

      var catkeys = [];
      var cats = d.categories.split('|');
      if (cats.length < 1) {
        cats = [['Unknown','unknown']];
        catkeys.push('unknown');
      } else {
        cats = cats.map(function(cat){
          if (cat.length < 2) {
            catkeys.push('unknown');
            return ['Unknown','unknown'];
          }
          var parts = cat.split(';');
          catkeys.push(parts[1]);
          return parts
        });
      }

      return {
        name: d.name,
        'review_count': +d.review_count,
        rating: +d.rating,
        latitude: +d.latitude,
        longitude: +d.longitude,
        categories: cats,
        categoryKeys: catkeys.join(' ')
      };

    },
    function(err, data){

      data = data.filter(function(d){
        return isValidLocation(d);
      });

      data.forEach(function(d){
        if (typeof d.categories === 'undefined') d.categories = [];
      });

      STA.hasher.on('initialHash', function(d){
        STA.hasher.on('initialHash', null);
        var hash = STA.hasher.get();
      });

      STA.hasher.on('change', function(d){
        if (!map) return;
        //update();
      });

      STA.hasher.start();

      //map = exports.KNIGHT.heatmap('#map', data);
      map = exports.KNIGHT.heatmapSimple('#map', data);
      dataList = exports.KNIGHT.dataTable('#list', data);

      map.on('resize', function(){
        dataList.resize(map.getSize());
      });
      map.fire('resize');

    });
  };

})(this);