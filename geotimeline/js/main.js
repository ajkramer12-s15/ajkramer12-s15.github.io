var width = d3.select("#primaryMap").style("width").slice(0, -2);
var height = d3.select("#primaryMap").style("height").slice(0, -2);

var primaryMap = d3.select("#primaryMap");

// Set projection path
var projection = d3.geo.mercator()
    .translate([width / 2, height / 2])
    .scale(100);

var path = d3.geo.path()
    .projection(projection);

queue()
    .defer(d3.json, "data/world-110m.json")
    .await(renderData);


// Render Data
function renderData(error, mapData) {

    // Convert TopoJSON to GeoJSON (target object = 'countries')
    var world = topojson.feature(mapData, mapData.objects.countries).features;

    // Render map
    primaryMap.selectAll("path")
        .data(world)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country");

}