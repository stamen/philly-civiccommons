(function(exports){

  var KNIGHT = exports.KNIGHT || (exports.KNIGHT = {});

  // table data config
  var fields = [
    {label:'Categories', key:'categories', extract: function(d){
      var t = [];
      d.forEach(function(cat){
        t.push(cat[0]);
      });
      return t.join(', ');
    }},
    {label:'Name', key:'name'},
    {label:'Rating', key:'rating'},
    {label:'Review Count', key:'review_count'},
  ];

  exports.KNIGHT.dataTable = function(selector, data) {
    var root = d3.select(selector).append('table');
    var thead = root.append('thead');
    var tbody = root.append('tbody');

    // fill in header
    thead.selectAll("th")
      .data(fields)
      .enter().append("th").text(function(d){return d.label});

    // pull out fields
    var parsed = [];
    data.forEach(function(row){
      var o = {};
      fields.forEach(function(f){
        if (f.extract && typeof f.extract === 'function') {
          o[f.key] = f.extract(row[f.key]);
        } else {
          o[f.key] = row[f.key];
        }
      });
      parsed.push(o);
    });

    // create table rows
    var tr = d3.select("tbody").selectAll("tr")
      .data(parsed).enter().append("tr");

    // fill in row cells
    var td = tr.selectAll("td")
      .data(function(d){return d3.values(d)})
      .enter().append("td")
      .text(function(d) {return d});


    // Filter tool
    var categories = [];
    var catKeys = [];
    data.forEach(function(d){
      d.categories.forEach(function(c){
        if (catKeys.indexOf(c[1]) < 0) {
          catKeys.push(c[1]);
          categories.push({label: c[0], key: c[1]});
        }
      });
    });

    // sort categories
    categories.sort(function(a,b){
      if(a.label < b.label) return -1;
      if(a.label > b.label) return 1;
      return 0;
    });

    var filterParent = d3.select('#category-filters');

    var filterTitle = filterParent.select('.toggle-buttons');

    var filterWrapper = filterParent.append('div')
      .attr('class', 'filter-wrapper');

    var filter = filterWrapper.append('ul')
      .attr('class', 'filters');

    var filterItems = filter.selectAll('li')
      .data(categories)
        .enter().append('li')
        .attr('class', 'filter');


    var label = filterItems.append('label');

    label.append("input")
      .attr("checked", true)
      .attr("type", "checkbox")
      .attr('data-key', function(d){
          return d.key;
        });

    label.append('span').text(function(d){
      return d.label;
    });

    var checkboxes = filter.selectAll('input[type="checkbox"]');
    filter.on('change', onFilterChange);

    function onFilterChange() {
      var unchecked = checkboxes.filter(function(item){
        return !this.checked;
      });
      unchecked = unchecked[0].map(function(item){
        return item.getAttribute('data-key');
      });

      KNIGHT.dispatch.filterChange(unchecked);
    }

    d3.select('#cat-show-all').on('click', function(){
      d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
      checkboxes.each(function(){
        this.checked = "checked";
      });
      onFilterChange();
    });

    d3.select('#cat-hide-all').on('click', function(){
      d3.event.preventDefault ? d3.event.preventDefault() : d3.event.returnValue = false;
      checkboxes.each(function(){
        this.checked = "";
      });
      onFilterChange();
    });

    return {
      resize: function(size) {
        var parentHeight = size.y - 40;
        filterParent.style('height', parentHeight + 'px');
        var titleHeight = parentHeight - (filterTitle.node().offsetHeight + 20);
        filterWrapper.style('height', titleHeight + 'px');
      }
    };
  };

})(this);
