function initialize() {
    var mapProp = {
        center:new google.maps.LatLng(51.508742,-0.120850),
        zoom:5,
        mapTypeId:google.maps.MapTypeId.ROADMAP
    };
    var map=new google.maps.Map(document.getElementById("primaryMapColumn"),mapProp);
}
google.maps.event.addDomListener(window, 'load', initialize);






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
    .await(temp);

//temp
function temp() {
    window.setTimeout(renderData, 3000);
}


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








