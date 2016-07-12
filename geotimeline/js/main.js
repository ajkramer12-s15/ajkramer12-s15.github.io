var map

function initialize() {
    var mapProp = {
        center:new google.maps.LatLng(30,0),
        zoom:2,
        mapTypeId:google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true
    };
    map=new google.maps.Map(document.getElementById("primaryMapColumn"),mapProp);
}
google.maps.event.addDomListener(window, 'load', initialize);






var width = d3.select("#primaryMapColumn").style("width").slice(0, -2);
var height = d3.select("#primaryMapColumn").style("height").slice(0, -2);
//var latitude = height / 1.53;
var latitude = height / 2;
var longitude = width / 2;

var primaryMap = d3.select("#primaryMap")
                .attr("width", width)
                .attr("height", height)
                .append("g");

// Set projection path
var projection = d3.geo.mercator()
    //.translate([width / 2, height / 1.43])
    .center([0, 30])
    .translate([longitude, latitude])
    .scale(163);
    //.scale((width - 1) / 2 / Math.PI);

/*var zoom = d3.behavior.zoom()
    .scaleExtent([1, 3])
    .on("zoom", zoomed);
*/

var path = d3.geo.path()
    .projection(projection);

/*primaryMap
    .call(zoom);
    //.call(zoom.event);
*/
queue()
    .defer(d3.json, "data/world-110m.json")
    .await(renderData);


var miniMap = d3.select("#miniMap")
    .on("mouseover", travel);



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

function zoomed() {
    var e = d3.event;
    //var tx = Math.min(0, Math.max(e.translate[0], width - width * e.scale));
    //var ty = Math.min(0, Math.max(e.translate[1], height - height * e.scale));
    var x = e.sourceEvent.x;
    var y = e.sourceEvent.y;
    var tx = e.translate[0];
    var ty = e.translate[1];
    zoom.translate([tx, ty]);


    //primaryMap.attr("transform", "translate(" + [tx, ty] + ")scale(" + e.scale + ")");
    //projection.center([tx, ty]);
    //console.log(tx+", "+ty+" | "+ e.scale);
    //console.log(projection.center());
    console.log(projection.invert([x, y]));
    //console.log(x + " " + y);
    longitude = tx;
    latitude = ty;
}

function travel(){
    var pCenter = projection.center();
    projection.center([pCenter[0]-10,pCenter[1]]);
    console.log(projection.center());

    primaryMap.selectAll("path")
        .transition()
        .duration(0)
        .attr("d", path);

    var translate = projection.translate();
    map.setCenter({lat: pCenter[1], lng: pCenter[0]-10});
}