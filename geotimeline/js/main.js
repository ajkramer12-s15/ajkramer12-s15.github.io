/***
**** Primary Map
****/

// Declare Map Data Variables
var world;
var currentEraBoundaries;
var nextEraBoundaries;
var nationTable;


// Set Primary Attributes
var primaryMapWidth = d3.select("#primaryMapColumn").style("width").slice(0, -2);
var primaryMapHeight = d3.select("#primaryMapColumn").style("height").slice(0, -2);
var latitude = primaryMapHeight / 2;
var longitude = primaryMapWidth / 2;

var currentZoom = 0;
var zoomConversionD3 = 163;
var zoomConversionGoogle = 2;

var eraChangeDuration = 10000;


// Declare/Initialize map variables
var primaryMap = d3.select("#primaryMap")
                .attr("width", primaryMapWidth)
                .attr("height", primaryMapHeight)
                .append("g");
var googleMap;




/* Constructor Calls & Functions */

// D3

// Set projection path
var projection = d3.geo.mercator()
    //.translate([primaryMapWidth / 2, primaryMapHeight / 1.43])
    .center([0, 30])
    .translate([longitude, latitude])
    .scale(Math.pow(2, currentZoom) * zoomConversionD3);

// Create the map object
var path = d3.geo.path()
    .projection(projection);

// Load map data
queue()
    .defer(d3.csv, "data/nationTable.csv")
    .defer(d3.json, "data/ad362.json")
    .defer(d3.json, "data/ad406.json")
    .await(initializeD3Map);


// Google
google.maps.event.addDomListener(window, 'load', initializeGoogleMap);



function initializeD3Map(error, nationData, currentMapData, nextMapData) {

    nationTable = nationData;

    currentEraBoundaries = currentMapData.features;
    nextEraBoundaries = nextMapData.features;

    // Render map
    primaryMap.selectAll("path")
        .data(currentEraBoundaries)
        .enter().append("path")
        .attr("d", path)
        .attr("id", function(d){ return "region" + d.id;})
        .attr("class", function(d){return "primaryMapRegion " + nationTable[d.id].culture});

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
var baseTravelSpeed = 5;
var travelSpeed = baseTravelSpeed;

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

    // Redraw map
    primaryMap.selectAll("path")
        .transition()
        .duration(zoomInterval)
        .attr("d", path);

    //Redraw minimap viewbox
    miniMapSizeConversion = miniProjection.scale()/projection.scale();
    viewBox
        .transition()
        .duration(500)
        .attr("x", miniProjection(projection.center())[0] - primaryMapWidth * miniMapSizeConversion/2)
        .attr("y", miniProjection(projection.center())[1] - primaryMapHeight * miniMapSizeConversion/2)
        .attr("width", primaryMapWidth * miniMapSizeConversion)
        .attr("height", primaryMapHeight * miniMapSizeConversion);


    if(currentZoom == 0){
        projection.center([0,30]);
        googleMap.setCenter({lat: 30, lng: 0});
        primaryMap.selectAll("path")
            .transition()
            .duration(0)
            .attr("d", path);

        // Disable primary map navigation
        d3.selectAll(".panTrigger")
            .classed("hidden", true);

        // Disable minimap viewbox
        viewBox
            .attr("fill", "none")
            .attr("stroke", "none");
    } else {
        // Update Travel speed
        travelSpeed = Math.floor(baseTravelSpeed / currentZoom);

        // Enable primary map navigation
        d3.selectAll(".panTrigger")
            .classed("hidden", false);

        // Enable minimap viewbox navigation
        viewBox
            .attr("fill", "rgba(255,240,240,.1)")
            .attr("stroke", "rgba(255,0,0,1)");
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
                    projection.center([pCenter[0], pCenter[1] + travelSpeed]);
                    googleMap.setCenter({lat: pCenter[1] + travelSpeed, lng: pCenter[0]});
                }
                break;
        case 1: if(pCenter[0] < 180) {
                    projection.center([pCenter[0]+travelSpeed,pCenter[1]]);
                    googleMap.setCenter({lat: pCenter[1], lng: pCenter[0]+travelSpeed});
                }
                break;
        case 2: if(pCenter[1] > -70) {
                    projection.center([pCenter[0], pCenter[1] - travelSpeed]);
                    googleMap.setCenter({lat: pCenter[1] - travelSpeed, lng: pCenter[0]});
                }
                break;
        case 3: if(pCenter[0] > -180) {
                    projection.center([pCenter[0] - travelSpeed, pCenter[1]]);
                    googleMap.setCenter({lat: pCenter[1], lng: pCenter[0] - travelSpeed});
                }
                break;
    }

    // Update D3 map position
    primaryMap.selectAll("path")
        .transition()
        .duration(0)
        .attr("d", path);

    //Redraw minimap viewbox
    miniMapSizeConversion = miniProjection.scale()/projection.scale();
    viewBox
        .attr("x", miniProjection(projection.center())[0] - primaryMapWidth * miniMapSizeConversion/2)
        .attr("y", miniProjection(projection.center())[1] - primaryMapHeight * miniMapSizeConversion/2)
        .attr("width", primaryMapWidth * miniMapSizeConversion)
        .attr("height", primaryMapHeight * miniMapSizeConversion);
}







/***
 **** Mini Map
 ****/



// Set Primary Attributes
var miniWidth = d3.select("#miniMapColumn").style("width").slice(0, -2);
var miniHeight = d3.select("#miniMapColumn").style("height").slice(0, -2);
var miniMapCenterY = miniHeight / 2;
var miniMapCenterX = miniWidth / 2;
var miniMapSizeConversion;
var viewBox;


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

// Create the drag behavior for the view box
var viewBoxDrag = d3.behavior.drag()
    .on("drag", viewBoxDragBehavior)
    .on("dragend", viewBoxDragRelease);

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

    //Render View Box
    miniMapSizeConversion = miniProjection.scale()/projection.scale();

    viewBox = miniMap.append("rect")
        .attr("id", "viewBox")
        .attr("x", miniProjection(projection.center())[0] - primaryMapWidth * miniMapSizeConversion/2)
        .attr("y", miniProjection(projection.center())[1] - primaryMapHeight * miniMapSizeConversion/2)
        .attr("width", primaryMapWidth * miniMapSizeConversion)
        .attr("height", primaryMapHeight * miniMapSizeConversion)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", "none")
        .call(viewBoxDrag);

}

function viewBoxDragBehavior() {

    d3.select(this)
        .attr("x", d3.event.x - viewBox.attr("width")/2)
        .attr("y", d3.event.y - viewBox.attr("height")/2);
}
function viewBoxDragRelease() {
    var vCenter = miniProjection.invert([d3.event.sourceEvent.offsetX, d3.event.sourceEvent.offsetY]);
    console.log(vCenter);
    console.log(d3.event.sourceEvent);
    // Update Primary Map
    projection.center(vCenter);
    googleMap.setCenter({lat: vCenter[1], lng: vCenter[0]});
    // Update D3 map position
    primaryMap.selectAll("path")
        .transition()
        .duration(0)
        .attr("d", path);
}




/***
 **** Summary Boxes
 ****/

/*
 ** Era Summary Box
 **/
var eraSummaryBoxOpen = false;
var eraSummaryBoxWidth = d3.select("#primaryCommand").style("width").slice(0, -2) * 0.95;
var eraSummaryBoxOffset = parseInt(d3.select("#miniMapColumn").style("width").slice(0, -2)) + (eraSummaryBoxWidth * 0.025);


// Initialize Era Summary Box
var eraSummaryBox = d3.select("#eraSummaryBox")
    .style("width", eraSummaryBoxWidth + "px")
    .style("height", "15vh")
    .style("top", primaryMapHeight + "px")
    .style("left", eraSummaryBoxOffset + "px");


var eraSummaryBoxHeight = eraSummaryBox.style("height").slice(0, -2);

var eraSummaryBoxToggle = d3.select("#eraSummaryBoxToggle")
    .style("left", eraSummaryBoxWidth/2-(d3.select("#eraSummaryBoxToggle").style("width").slice(0, -2)/2) + "px")
    .on("click", function(){
        if(eraSummaryBoxOpen){
            eraSummaryBox
                .transition()
                .duration(1500)
                .style("top", primaryMapHeight + "px");
            setTimeout(function(){eraSummaryBoxToggle.html("<span class='glyphicon glyphicon-chevron-up'></span>");}, 1500);
            eraSummaryBoxOpen = false;
        } else {
            eraSummaryBox
                .transition()
                .duration(1500)
                .style("top", (primaryMapHeight - eraSummaryBoxHeight) + "px");
            setTimeout(function(){eraSummaryBoxToggle.html("<span class='glyphicon glyphicon-chevron-down'></span>");}, 1500);
            eraSummaryBoxOpen = true;
        }

    });


/*
 ** Character Summary Boxes
 **/
var characterSummaryBoxOpen = false;
var characterSummaryBoxHeight = primaryMapHeight * 0.95;
var characterSummaryBoxOffset = primaryMapHeight * 0.025;


// Initialize Character Summary Box
var characterSummaryBox = d3.select("#characterSummaryBox")
    .style("width", "10vw")
    .style("height", characterSummaryBoxHeight + "px")
    .style("top", characterSummaryBoxOffset + "px")
    .style("left", primaryMapWidth-5 + "px");


var characterSummaryBoxWidth = characterSummaryBox.style("width").slice(0, -2);

var characterSummaryBoxToggle = d3.select("#characterSummaryBoxToggle")
    .style("top", characterSummaryBoxHeight/2-(d3.select("#characterSummaryBoxToggle").style("height").slice(0, -2)/2) + "px")
    .on("click", function(){
        if(characterSummaryBoxOpen){
            characterSummaryBox
                .transition()
                .duration(1500)
                .style("left", primaryMapWidth-5 + "px");
            setTimeout(function(){characterSummaryBoxToggle.html("<span class='glyphicon glyphicon-chevron-left'></span>");}, 1500);
            characterSummaryBoxOpen = false;
        } else {
            characterSummaryBox
                .transition()
                .duration(1500)
                .style("left", (primaryMapWidth - characterSummaryBoxWidth) + "px");
            setTimeout(function(){characterSummaryBoxToggle.html("<span class='glyphicon glyphicon-chevron-right'></span>");}, 1500);
            characterSummaryBoxOpen = true;
        }

    });








/***
 **** Dynamic Era Information
 ****/

var eraDateSpan = d3.select("#eraDate");

// Initialize stats
updateEraDate("AD 362");



d3.select("#statsBox")
    .on("click", function(){updateEra("AD 406");});


function updateEra(eraDate){
    updateEraDate(eraDate);
    updateEraMap();

}

function updateEraDate(eraDate){
    eraDateSpan.text(eraDate);
}


function updateEraMap(){
    var i, j;
    var found = false;

    for(i=0; i < currentEraBoundaries.length; i++){
        for(j=0; j < nextEraBoundaries.length && !found; j++){
            if(currentEraBoundaries[i].id == nextEraBoundaries[j].id){
                currentEraBoundaries[i].geometry.coordinates[0] = nextEraBoundaries[j].geometry.coordinates[0];
                found = true;
            }
        }
        if(!found){
            d3.select("#region"+currentEraBoundaries[i].id)
                //.transition()
                //.duration(eraChangeDuration)
                .attr("class", "conquered");
        }
        found = false;
    }

    for(i=0; i < nextEraBoundaries.length; i++){
        for(j=0; j < currentEraBoundaries.length && !found; j++){
            if(nextEraBoundaries[i].id == currentEraBoundaries[j].id){
                found = true;
            }
        }
        if(!found){
            currentEraBoundaries.push(nextEraBoundaries[i]);
            primaryMap.selectAll("path")
                .data(currentEraBoundaries)
                .enter().append("path")
                .attr("d", path)
                .attr("id", function(d){ return "region" + d.id;})
                .attr("class", function(d){return "primaryMapRegion " + nationTable[d.id].culture})
                .style("opacity","0");
        }
        found = false;
    }



    // Redraw map
    primaryMap.selectAll("path:not(.conquered)")
        .transition()
        .duration(eraChangeDuration)
        .attr("d", path)
        .style("opacity", "0.5");
}