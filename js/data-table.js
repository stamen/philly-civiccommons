(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});

  exports.KNIGHT.dataTable = function(data) {
    var root = d3.select('#list tbody');
    root.selectAll('tr')
      .data(data)
      .enter()
      .append('tr')

    var items = root.selectAll('tr');

    items.append('td')
    .text(function(d){
      return d.name;
    });
    items.append('td')
    .text(function(d){
      return d.rating;
    });
    items.append('td')
    .text(function(d){
      return d.review_count;
    });
    items.append('td')
    .text(function(d){
      var t = [];
      d.categories.forEach(function(cat){
        t.push(cat[1]);
      })
      return t.join(', ');
    });
  };

})(this);
