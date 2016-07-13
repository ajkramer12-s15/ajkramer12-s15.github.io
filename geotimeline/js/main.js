/***
**** Primary Map
****/



// Set Primary Attributes
var width = d3.select("#primaryMapColumn").style("width").slice(0, -2);
var height = d3.select("#primaryMapColumn").style("height").slice(0, -2);
var latitude = height / 2;
var longitude = width / 2;

var currentZoom = 0;
var zoomConversionD3 = 163;
var zoomConversionGoogle = 2


// Declare/Initialize map variables
var primaryMap = d3.select("#primaryMap")
                .attr("width", width)
                .attr("height", height)
                .append("g");
var googleMap;




/* Constructor Calls & Functions */

// D3

// Set projection path
var projection = d3.geo.mercator()
    //.translate([width / 2, height / 1.43])
    .center([0, 30])
    .translate([longitude, latitude])
    .scale(Math.pow(2, currentZoom) * zoomConversionD3);

// Create the map object
var path = d3.geo.path()
    .projection(projection);

// Load map data
queue()
    .defer(d3.json, "data/world-110m.json")
    .await(initializeD3Map);


// Google
google.maps.event.addDomListener(window, 'load', initializeGoogleMap);



function initializeD3Map(error, mapData) {



    // Convert TopoJSON to GeoJSON (target object = 'countries')
    var world = topojson.feature(mapData, mapData.objects.countries).features;

    // Render map
    primaryMap.selectAll("path")
        .data(world)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country");

}
function initializeGoogleMap() {
    var mapProp = {
        center:new google.maps.LatLng(30,0),
        zoom: currentZoom + zoomConversionGoogle,
        mapTypeId:google.maps.MapTypeId.SATELLITE,
        disableDefaultUI: true
    };
    googleMap=new google.maps.Map(document.getElementById("primaryMapColumn"),mapProp);
}






/* User Triggers & Functions */
var zoomLock = false;
var zoomInterval = 200;

d3.select("body").on("wheel.zoom", function(){
    if(!zoomLock) {
        zoomLock = true;
        var zoomDelta = d3.event.wheelDeltaY;
        zoom(zoomDelta);
        setTimeout(function(){zoomLock = false;}, zoomInterval * 3);
    }
});


var panUpTriggerTimeout;
var panRightTriggerTimeout;
var panDownTriggerTimeout;
var panLeftTriggerTimeout;

var panUpTrigger = d3.select("#panUpTrigger")
    .on("mouseover", function(){panUpTrigger.style("opacity", "0.5"); panUpTriggerTimeout = setInterval(function(){travel(0);}, 100);})
    .on("mouseout", function(){panUpTrigger.style("opacity", "0.2"); clearTimeout(panUpTriggerTimeout);});
var panRightTrigger = d3.select("#panRightTrigger")
    .on("mouseover", function(){panRightTrigger.style("opacity", "0.5"); panRightTriggerTimeout = setInterval(function(){travel(1);}, 100);})
    .on("mouseout", function(){panRightTrigger.style("opacity", "0.2"); clearTimeout(panRightTriggerTimeout);});
var panDownTrigger = d3.select("#panDownTrigger")
    .on("mouseover", function(){panDownTrigger.style("opacity", "0.5"); panDownTriggerTimeout = setInterval(function(){travel(2);}, 100);})
    .on("mouseout", function(){panDownTrigger.style("opacity", "0.2"); clearTimeout(panDownTriggerTimeout);});
var panLeftTrigger = d3.select("#panLeftTrigger")
    .on("mouseover", function(){panLeftTrigger.style("opacity", "0.5"); panLeftTriggerTimeout = setInterval(function(){travel(3);}, 100);})
    .on("mouseout", function(){panLeftTrigger.style("opacity", "0.2"); clearTimeout(panLeftTriggerTimeout);});




function zoom(direction) {

    if(direction > 0 && currentZoom < 2){
        currentZoom++;
        projection.scale(Math.pow(2, currentZoom) * zoomConversionD3);
        googleMap.setZoom(currentZoom + zoomConversionGoogle);
    }
    if(direction < 0 && currentZoom > 0){
        currentZoom--;
        projection.scale(Math.pow(2, currentZoom) * zoomConversionD3);
        googleMap.setZoom(currentZoom + zoomConversionGoogle);
    }

    primaryMap.selectAll("path")
        .transition()
        .duration(zoomInterval)
        .attr("d", path);

    if(currentZoom == 0){
        projection.center([0,30]);
        googleMap.setCenter({lat: 30, lng: 0});
        primaryMap.selectAll("path")
            .transition()
            .duration(0)
            .attr("d", path);

        d3.selectAll(".panTrigger")
            .classed("hidden", true);
    } else {
        d3.selectAll(".panTrigger")
            .classed("hidden", false);
    }
}

/**
*** Move both the Google Map and the D3 map when a travel trigger is received
**/
function travel(direction){
    // Get current map center coordinates
    var pCenter = projection.center();

    // Calculate new map center coordinates & update D3 projection & Google Map position
    switch(direction){
        case 0: if(pCenter[1] < 70) {
                    projection.center([pCenter[0], pCenter[1] + 10]);
                    googleMap.setCenter({lat: pCenter[1] + 10, lng: pCenter[0]});
                }
                break;
        case 1: if(pCenter[0] < 180) {
                    projection.center([pCenter[0]+10,pCenter[1]]);
                    googleMap.setCenter({lat: pCenter[1], lng: pCenter[0]+10});
                }
                break;
        case 2: if(pCenter[1] > -70) {
                    projection.center([pCenter[0], pCenter[1] - 10]);
                    googleMap.setCenter({lat: pCenter[1] - 10, lng: pCenter[0]});
                }
                break;
        case 3: if(pCenter[0] > -180) {
                    projection.center([pCenter[0] - 10, pCenter[1]]);
                    googleMap.setCenter({lat: pCenter[1], lng: pCenter[0] - 10});
                }
                break;
    }

    // Update D3 map position
    primaryMap.selectAll("path")
        .transition()
        .duration(0)
        .attr("d", path);
}







/***
 **** Mini Map
 ****/



// Set Primary Attributes
var miniWidth = d3.select("#miniMapColumn").style("width").slice(0, -2);
var miniHeight = d3.select("#miniMapColumn").style("height").slice(0, -2);
var miniMapCenterY = miniHeight / 2;
var miniMapCenterX = miniWidth / 2;


// Initialize map variable
var miniMap = d3.select("#miniMap")
    .attr("width", miniWidth)
    .attr("height", miniHeight)
    .append("g");


// Set projection path
var miniProjection = d3.geo.mercator()
    .center([30, 0])
    .translate([miniMapCenterX, miniMapCenterY])
    .scale(33);

// Create the map object
var miniMapBase = d3.geo.path()
    .projection(miniProjection);

// Load map data
queue()
    .defer(d3.json, "data/world-110m.json")
    .await(initializeMiniMap);

function initializeMiniMap(error, mapData) {

    // Convert TopoJSON to GeoJSON (target object = 'countries')
    var world = topojson.feature(mapData, mapData.objects.countries).features;

    // Render map
    miniMap.selectAll("path")
        .data(world)
        .enter().append("path")
        .attr("d", miniMapBase)
        .attr("class", "country");

}