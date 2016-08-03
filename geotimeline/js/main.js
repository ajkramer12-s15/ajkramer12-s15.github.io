/***
**** Primary Map
****/
// Declare Map Data Variables
var nationTable;
var eraTable;
var eventTable;
var characterTable;
var currentEra = 0;

// Declare Map Path Variables
var world;
var previousEraBoundaries;
var currentEraBoundaries;
var nextEraBoundaries;


// Set Primary Attributes
var primaryMapWidth = d3.select("#primaryMapColumn").style("width").slice(0, -2);
var primaryMapHeight = d3.select("#primaryMapColumn").style("height").slice(0, -2);
var latitude = primaryMapHeight / 2;
var longitude = primaryMapWidth / 2;

var currentZoom = 0;
var zoomConversionD3 = 163;
var zoomConversionGoogle = 2;
var fontThreshold = 15;

var eraChangeDuration = 5000;


// Declare Stat Variables
var eraDateSpan = d3.select("#eraDate");
var largestRegions = [{name: "test", size: 0},{name: "test", size: 0},{name: "test", size: 0},{name: "test", size: 0},{name: "test", size: 0}];


// Declare/Initialize map variables
var primaryMap = d3.select("#primaryMap")
                .attr("width", primaryMapWidth)
                .attr("height", primaryMapHeight)
                .append("g");
var googleMap;


// Declare Audio
var backgroundMusic;
var nextEraAudio;
var eventBattleAudio;
var eventConquerAudio;




/* Constructor Calls & Functions */

// D3

// Set projection path
var projection = d3.geo.mercator()
//var projection = d3.geo.equirectangular()
    //.translate([primaryMapWidth / 2, primaryMapHeight / 1.43])
    .center([0, 30])
    .translate([longitude, latitude])
    .scale(Math.pow(2, currentZoom) * zoomConversionD3);

// Create the map object
var path = d3.geo.path()
    .projection(projection);

// Load map data
queue()
    .defer(d3.tsv, "data/nationTable.tsv")
    .defer(d3.tsv, "data/eraTable.tsv")
    .defer(d3.tsv, "data/eventTable.tsv")
    .defer(d3.tsv, "data/characterTable.tsv")
    .await(loadInitialMapData);


// Google
google.maps.event.addDomListener(window, 'load', initializeGoogleMap);


function loadInitialMapData(error, nationData, eraData, eventData, characterData){
    nationTable = nationData;
    eraTable = eraData;
    eventTable = eventData;
    characterTable = characterData;
    updateEraDate();
    updateEraSummary();
    updateCharacters();


    queue()
        .defer(d3.json, "data/" + getJsonFilename(-1) + ".json")
        .defer(d3.json, "data/" + getJsonFilename(0) + ".json")
        .defer(d3.json, "data/" + getJsonFilename(1) + ".json")
        .await(initializeD3Map);
}
function getJsonFilename(direction){
    switch(direction){
        case -1: if(currentEra == 0){
                    return eraTable[currentEra].filename;
                } else {
                    return eraTable[currentEra-1].filename;
                }
                break;
        case 0: return eraTable[currentEra].filename;
                break;
        case 1: if(currentEra == eraTable.length-1){
                    return eraTable[currentEra].filename;
                } else {
                    return eraTable[currentEra+1].filename;
                }
                break;
        default: return eraTable[currentEra].filename;
    }
}
function initializeD3Map(error, previousMapData, currentMapData, nextMapData) {

    previousEraBoundaries = homogenizeNodeCount(previousMapData.features);
    currentEraBoundaries = homogenizeNodeCount(currentMapData.features);
    nextEraBoundaries = homogenizeNodeCount(nextMapData.features);

    // Render map
    primaryMap.selectAll("path")
        .data(currentEraBoundaries)
        .enter().append("path")
        .attr("d", path)
        .attr("id", function(d){ return "region" + d.id;})
        .attr("class", function(d){return "primaryMapRegion " + nationTable[d.id].culture})
        .on("click", function(d){updateRegionStats(d);});

    d3.select("#primaryMap")
        .on("click", function(){
            if(d3.event.path[0].id == "primaryMap"){
                updateRegionStats(-1);
            }
        });

    labelRegions(0);
    calculateRegionAreas();


    queue()
        .defer(loadAudio)
        .await(startPage);



}
function loadAudio(callback) {
    backgroundMusic = new Audio('audio/backgroundMusic.mp3'); // https://www.youtube.com/watch?v=u01Dk8O53JQ
    nextEraAudio = new Audio('audio/nextEra.mp3'); // https://www.youtube.com/watch?v=aEaniKgfRRY
    eventBattleAudio = new Audio('audio/eventBattle.mp3'); // https://www.youtube.com/watch?v=rhFkafqZj58
    eventConquerAudio = new Audio('audio/eventConquer.mp3'); // https://www.youtube.com/watch?v=JSNlNMnsPn0

    callback(null);
    console.log("done");
}
function startPage(error){
    console.log("done");
    toggleEraSummaryBox();
    toggleCharacterSummaryBox();
    d3.select("#loadScreen")
        .transition()
        .duration(5000)
        .style("opacity", "0");
    backgroundMusic.play();
    setTimeout(function(){
        d3.select("#loadScreen").remove();
    }, 4000);
}
function homogenizeNodeCount(mapData){

    var homogenizedMapData = mapData;

    for(var region = 0; region < mapData.length; region++){
        var regionData = mapData[region].geometry.coordinates[0];
        var currentRegionNodeNumber = regionData.length;
        var targetRegionNodeNumber = nationTable[mapData[region].id].nodes;
        var homogenizedRegionData = regionData;
        if(targetRegionNodeNumber > currentRegionNodeNumber){
            var startingNode = regionData = mapData[region].geometry.coordinates[0][0];
            for(var node = 0; node < targetRegionNodeNumber - currentRegionNodeNumber; node++){
                homogenizedRegionData.push(startingNode);
            }
            homogenizedMapData[region].geometry.coordinates[0] = homogenizedRegionData;
        }
    }

    return homogenizedMapData;
}
function updateRegionStats(d){
    if(d == -1){
        d3.select("#selectedRegionName").attr("regionId", -1);
        d3.select("#selectedRegionName").text("");
        d3.select("#selectedRegionStats").html("");
        d3.select("#selectedRegionDescription").text("");
    } else if(d == 0){
        var regionId = d3.select("#selectedRegionName").attr("regionId");
        if(regionId > -1){
            d3.select("#selectedRegionName").text(nationTable[regionId].name);
            d3.select("#selectedRegionStats").html("<li>Culture: " + nationTable[regionId].culture.charAt(0).toUpperCase() + nationTable[regionId].culture.slice(1) + "</li><li>Religion: " + nationTable[regionId].religion + "</li><li>Eras in Existence: " + (currentEra - nationTable[regionId].yearFounded) + "</li>");
            d3.select("#selectedRegionDescription").text(nationTable[regionId].description);
        }
    } else {
        d3.select("#selectedRegionName").attr("regionId", d.id);
        d3.select("#selectedRegionName").text(nationTable[d.id].name);
        d3.select("#selectedRegionStats").html("<li>Culture: " + nationTable[d.id].culture.charAt(0).toUpperCase() + nationTable[d.id].culture.slice(1) + "</li><li>Religion: " + nationTable[d.id].religion + "</li><li>Eras in Existence: " + (currentEra - nationTable[d.id].yearFounded) + "</li>");
        d3.select("#selectedRegionDescription").text(nationTable[d.id].description);
    }
}
function labelRegions(duration){

    // Data Join
    var currentLabels = primaryMap.selectAll(".regionLabel")
        .data(currentEraBoundaries);

    currentLabels
        .enter().append("text")
        .attr("class", "regionLabel");

    currentLabels
        .attr("id", function(d){ return "label" + d.id;})
        .text(function(d){ return nationTable[d.id].name; })
        .transition()
        .duration(duration)
        .attr("transform", function(d) {
            var textWidth = d3.select("#label"+ d.id)[0][0].clientWidth;
            return "translate(" + (path.centroid(d)[0]-textWidth/2) + "," + path.centroid(d)[1] + ")";
        })
        .attr("font-size", function(d){
            var regionArea = path.area(d);
            var fontSize = Math.floor(Math.log(regionArea))*2;
            if(path.area(d) > 0 && fontSize >= (fontThreshold)){
                return (Math.floor(Math.log(regionArea))*2) + "px";
            } else {
                return "0";
            }
        });

    currentLabels.exit().remove();
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
    updateMap(zoomInterval);

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
        updateMap(0);

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
    updateMap(0);

    //Redraw minimap viewbox
    miniMapSizeConversion = miniProjection.scale()/projection.scale();
    viewBox
        .attr("x", miniProjection(projection.center())[0] - primaryMapWidth * miniMapSizeConversion/2)
        .attr("y", miniProjection(projection.center())[1] - primaryMapHeight * miniMapSizeConversion/2)
        .attr("width", primaryMapWidth * miniMapSizeConversion)
        .attr("height", primaryMapHeight * miniMapSizeConversion);
}
function updateMap(duration){
    primaryMap.selectAll("path")
        .transition()
        .duration(duration)
        .attr("d", path);
    labelRegions(duration);
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
    // Update Primary Map
    projection.center(vCenter);
    googleMap.setCenter({lat: vCenter[1], lng: vCenter[0]});
    // Update D3 map position
    updateMap(0);
}




/*
 ** Stats Box
 **/
d3.select("#statsBox")
    .append("img")
    .attr("id", "nextArrow")
    .attr("src", "img/nextArrow.png") // http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons/antique-glowing-copper-orbs-icons-media/001362-antique-glowing-copper-orb-icon-media-a-media22-arrow-forward1.png
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("height", "25%");

// Called in initialize map and update era
function calculateRegionAreas(){
    for(var i = 0; i < 5; i++){
        largestRegions[i].size = 0;
    }

    currentEraBoundaries.forEach(function(d){
        var regionSize = path.area(d);
        if(regionSize > largestRegions[0].size && nationTable[d.id].nation == 1){

            largestRegions[4].name = largestRegions[3].name;
            largestRegions[4].size = largestRegions[3].size;

            largestRegions[3].name = largestRegions[2].name;
            largestRegions[3].size = largestRegions[2].size;

            largestRegions[2].name = largestRegions[1].name;
            largestRegions[2].size = largestRegions[1].size;

            largestRegions[1].name = largestRegions[0].name;
            largestRegions[1].size = largestRegions[0].size;

            largestRegions[0].name = nationTable[d.id].name;
            largestRegions[0].size = regionSize;

        } else if(regionSize > largestRegions[1].size && nationTable[d.id].nation == 1){
            largestRegions[4].name = largestRegions[3].name;
            largestRegions[4].size = largestRegions[3].size;

            largestRegions[3].name = largestRegions[2].name;
            largestRegions[3].size = largestRegions[2].size;

            largestRegions[2].name = largestRegions[1].name;
            largestRegions[2].size = largestRegions[1].size;

            largestRegions[1].name = nationTable[d.id].name;
            largestRegions[1].size = regionSize;

        } else if(regionSize > largestRegions[2].size && nationTable[d.id].nation == 1){
            largestRegions[4].name = largestRegions[3].name;
            largestRegions[4].size = largestRegions[3].size;

            largestRegions[3].name = largestRegions[2].name;
            largestRegions[3].size = largestRegions[2].size;

            largestRegions[2].name = nationTable[d.id].name;
            largestRegions[2].size = regionSize;

        } else if(regionSize > largestRegions[3].size && nationTable[d.id].nation == 1){
            largestRegions[4].name = largestRegions[3].name;
            largestRegions[4].size = largestRegions[3].size;

            largestRegions[3].name = nationTable[d.id].name;
            largestRegions[3].size = regionSize;

        } else if(regionSize > largestRegions[4].size && nationTable[d.id].nation == 1){
            largestRegions[4].name = nationTable[d.id].name;
            largestRegions[4].size = regionSize;
        }

        for(i = 0; i < 5; i++){
            d3.select("#nationSize" + i).text(largestRegions[i].name);
        }
    });
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
    .on("click", toggleEraSummaryBox);

function toggleEraSummaryBox(){
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
}


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
    .on("click", toggleCharacterSummaryBox);

function toggleCharacterSummaryBox(){
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
}







/***
 **** Dynamic Era Information
 ****/
d3.select("#nextArrow")
    .on("click", function(){updateEra();});


function updateEra(){

    nextEraAudio.play();
    updateEraMap();
    setTimeout(calculateRegionAreas, eraChangeDuration);

    previousEraBoundaries = currentEraBoundaries;
    currentEraBoundaries = previousEraBoundaries;
    queue()
        .defer(d3.json, "data/" + getJsonFilename(1) + ".json")
        .await(updateEraMapWrapup);

    currentEra++;

    updateEraDate();
    updateEraSummary();
    updateRegionStats(0);
    updateCharacters();
    triggerEvents();


}
function updateEraMapWrapup(error, nextData){
    nextEraBoundaries = nextData;
    nextEraBoundaries = homogenizeNodeCount(nextEraBoundaries.features);
}

function updateEraDate(){
    eraDateSpan.text(eraTable[currentEra].date);
}
function updateEraSummary(){
    d3.select("#eraSummary").text(eraTable[currentEra].summary);
}


function updateEraMap(){
    var i, j;
    var found = false;

    for(i=0; i < currentEraBoundaries.length; i++){
        for(j=0; j < nextEraBoundaries.length && !found; j++){
            if(currentEraBoundaries[i].id == nextEraBoundaries[j].id){

                /* This won't work here because the data is already homogenized, but I need it to work somewhere to test
                ** for conquered nations.

                if(nextEraBoundaries[j].geometry.coordinates[0].length == 3){
                    d3.select("#region"+currentEraBoundaries[i].id)
                        .classed("conquered", true);
                }
                */
                currentEraBoundaries[i].geometry.coordinates[0] = nextEraBoundaries[j].geometry.coordinates[0];
                found = true;
            }
        }
        if(!found){
            d3.select("#region"+currentEraBoundaries[i].id)
                .classed("transitioned", true)
                .transition()
                .duration(eraChangeDuration)
                .style("opacity", 0);
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
                .style("opacity","0")
                .on("click", function(d){updateRegionStats(d);});
        }
        found = false;
    }



    // Redraw map
    primaryMap.selectAll("path:not(.transitioned)")
        .transition()
        .duration(eraChangeDuration)
        .attr("d", path)
        .style("opacity", "0.5");
    labelRegions(eraChangeDuration);

}

function triggerEvents(){
    d3.select(".eventNotification").remove();

    var eventCount = 0;

    for(var i = 0; i < eventTable.length && eventTable[i].era <= currentEra; i++){
        if(eventTable[i].era == currentEra){
            eventCount++;
            var eventData = eventTable[i];
            var event = d3.select("#pageContainer").append("div")
                .attr("id", function(){ return "event" + eventData.id;})
                .attr("class", function(){return "eventNotification " + eventData.type + "event " + "eventCount" + eventCount;})
                .style("height", "8vh")
                .style("width", "8vh")
                .style("top", function(){return primaryMapHeight/-10 + "px";})
                .style("left", "0.5vh")
                .style("background-image", "url(img/event"+eventTable[i].type+".jpg)")
                /*
                * battle: http://cdn.pcwallart.com/images/fantasy-medieval-battle-art-wallpaper-3.jpg
                * coalition: http://alison-morton.com/wp-content/uploads/2015/04/Roman-handshake.jpg
                * conquer: http://img09.deviantart.net/74a0/i/2014/241/c/f/sword_in_the_ground_by_taaks-d7x3gms.jpg
                * independence: http://kaposiadays.org/wp-content/uploads/fireworks-file1.jpg
                * resurface: http://www.phoenixtradingstrategies.com/wp-content/uploads/2014/09/Phoenix.jpg
                * vassal: http://awoiaf.westeros.org/images/thumb/6/69/Davos_Kneeling_King_Stannis.jpg/350px-Davos_Kneeling_King_Stannis.jpg
                * war: http://us.123rf.com/450wm/andreykuzmin/andreykuzmin1502/andreykuzmin150200118/37177744-medieval-knight-shield-and-crossed-swords-on-wooden-gate.jpg?ver=6
                * */
                .style("background-size", "contain")
                .on("click", function(d, i){
                    var eventId = d3.event.srcElement.id.slice(5);
                    d3.select("#detailsWindowCloseButton").attr("eventId", "event"+eventId);
                    if(eventTable[eventId].image != "NULL") {
                        d3.select("#detailsWindowImage")
                            .style("height", "30vh")
                            .style("border", "3px groove #333333")
                            .style("background-image", "url(img/"+eventTable[eventId].image+")");
                    } else {
                        d3.select("#detailsWindowImage")
                            .style("height", "0")
                            .style("border", "0")
                            .style("background-image", "none");
                    }
                    d3.select("#detailsWindowTitle").html(eventTable[eventId].title);
                    d3.select("#detailsWindowSubTitle").html(eventTable[eventId].subTitle);
                    d3.select("#detailsWindowDescription").html(eventTable[eventId].description);
                    $('#detailsModal').modal('show');
                    if(eventTable[eventId].type == "Battle"){
                        eventBattleAudio.play();
                    } else if(eventTable[eventId].type == "Conquer") {
                        eventConquerAudio.play();
                    }
                });
            event
                .transition()
                .delay((eventCount-1)*(eraChangeDuration/10))
                .duration(eraChangeDuration/1.5)
                .ease("linear")
                .style("top", function(){
                    return (80 - 8*eventCount)+"vh"
                });
        }
    }


    var events = d3.selectAll(".eventNotification")[0];
}

d3.select("#detailsWindowCloseButton").on("click", function(){
    $('#detailsModal').modal('hide');
    var closedElementId = d3.select("#detailsWindowCloseButton").attr("eventId");
    if(closedElementId.slice(0, 5) == "event") {
        d3.select("#" + closedElementId).remove();
        var shiftedEvents = 0;
        d3.selectAll(".eventNotification")[0].forEach(function (event) {
            if (+event.id.slice(5) > +closedElementId.slice(5)) {
                shiftedEvents++;
                var eventSelect = d3.select("#" + event.id);
                eventSelect
                    .transition()
                    .delay(100 * shiftedEvents)
                    .duration(eraChangeDuration / 15)
                    .ease("linear")
                    .style("top", function () {
                        return (Math.floor(eventSelect.style("top").slice(0, -2)) + Math.floor(eventSelect.style("height").slice(0, -2))) + "px";
                    });
            }
        });
    }
});


function updateCharacters(){

    for(var i = 0; i < characterTable.length && characterTable[i].startEra <= currentEra; i++) {
        var characterData = characterTable[i];
        var character;

        if (characterTable[i].endEra == currentEra) {
            var killedCharacter = d3.select("#character" + characterData.id)
                .transition()
                .duration(500)
                .ease("linear")
                .style("height", "1px")
                .style("width", "1px")
                .style("opacity", "0");
            setTimeout(function(){killedCharacter.remove();}, 500)

        }
        if (characterTable[i].startEra == currentEra) {
            var addedCharacter = d3.select("#characterSummaryBox").append("div")
                .attr("id", function(){ return "character" + characterData.id;})
                .attr("class", function(){return "characterThumbnailBox";})
                .style("margin-bottom", characterSummaryBoxWidth*0.1 + "px")
                .style("width", (characterSummaryBoxWidth*0.8+6) + "px")
                .style("top", characterSummaryBoxWidth*0.1 + "px")
                .style("left", characterSummaryBoxWidth*0.1 + "px")
                .style("opacity", "0")
                .on("click", function(d, i){
                    var characterId = d3.event.srcElement.id.slice(18);
                    d3.select("#detailsWindowCloseButton").attr("eventId", "character"+characterId);
                    if(characterTable[characterId].image != "NULL") {
                        d3.select("#detailsWindowImage")
                            .style("height", "30vh")
                            .style("border", "3px groove #333333")
                            .style("background-image", "url(img/"+characterTable[characterId].image+")");
                    } else {
                        d3.select("#detailsWindowImage")
                            .style("height", "0")
                            .style("border", "0")
                            .style("background-image", "none");
                    }
                    d3.select("#detailsWindowTitle").html("");
                    d3.select("#detailsWindowSubTitle").html(characterTable[characterId].name);
                    d3.select("#detailsWindowDescription").html(characterTable[characterId].description);
                    $('#detailsModal').modal('show');
                });
            addedCharacter
                .append("div")
                .attr("id", "characterThumbnail"+characterData.id)
                .attr("class", "characterThumbnail " + characterData.culture)
                .style("height", characterSummaryBoxWidth*0.8 + "px")
                .style("width", characterSummaryBoxWidth*0.8 + "px")
                .style("background-image", "url(img/"+characterTable[i].image);
            addedCharacter
                .append("div")
                .attr("class", "characterLabel")
                .style("width", characterSummaryBoxWidth*0.8 + "px")
                .text(characterTable[i].name);
            addedCharacter
                .transition()
                .duration(1000)
                .ease("linear")
                .style("opacity", "1");
        }
    }
}