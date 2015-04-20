(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});


  function isValidLocation(item) {
    if (!item.location) return false;
    if (!item.location.coordinate) return false;
    if (!item.location.coordinate.latitude || !item.location.coordinate.longitude) return false;

    return true;
  }

  var map, dataList;

  KNIGHT.init = function() {
    d3.json('data/output.json', function(err,data){

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

      map = exports.KNIGHT.heatmap('#map', data);
      dataList = exports.KNIGHT.dataTable(data);

    });
  };

})(this);