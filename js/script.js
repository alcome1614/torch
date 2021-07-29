var isInfoShown = false;
var selectedMinimumDegree = 1;
var selectedOption = 'authors';

$(document).ready(function() {
    console.log('INITIALISATION');


    var nodeMinimumDegreeList = [1, 5,10,20,50,100,200,500,1000];
    var graphDisplayOptions = ['authors','words'];



    // add the options to the button
    d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(graphDisplayOptions)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; });



   d3.select("#selectButton").on("change", function(d) {
    // recover the option that has been chosen
    selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    // update(selectedOption)
    console.log('select button', selectedOption);
    remove();
    draw();

    })

    d3.select("#selectButton2")
      .selectAll('myOptions2')
     	.data(nodeMinimumDegreeList)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; });

    d3.select("#selectButton2").on("change", function(d) {
    // recover the option that has been chosen
    selectedMinimumDegree = d3.select(this).property("value");
    // run the updateChart function with this selected option
    console.log('select degree', selectedMinimumDegree);
    remove();
    draw();

    })

    console.log('PRE SELECTED',selectedOption)
    draw();

});



function draw(){
    console.log('DRAW', selectedOption)

    var minRadius = 1;
    var maxRadius = 20;
    const radiusRange = [minRadius, maxRadius];
    var collideStrenght = 50;
    var edgealpha = 0.5;
    var maximumEdgeWeight = 0.8;
    var maxedgewidth = 1;
    // var linkLengthCoefficient = 1/8;

    if (selectedOption=='authors'){
        var file='collaboration3';
        var displayNodeName = false;
        var strengthValue = 5;
        var strengthLink = 0.5;
        var linkLengthCoefficient = 1/8;
        var collisionCoefficient = 1/2;
    }
    else if(selectedOption=='words'){
        var file='keywords';
        var displayNodeName = true;
        var strengthValue = -1;
        var strengthLink = 0.5;
        var linkLengthCoefficient = 1/8;
        var collisionCoefficient = 2;
    } ;

    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 40};
    width = 800 - margin.left - margin.right;
    height = 800 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#viz1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

    color = function(d){
      const scale = d3.scaleOrdinal(d3.schemeCategory10);
      scale.domain(['ELTE', 'TCD', 'UB', 'UU'])
      // return scale(d.university);
        return scale(d.university);
        };


    function drag (simulation)  {

        function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.03).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        };

        function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
        };

        function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        };

        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);

        };



    async function loadData(){
        // const data = await d3.json('graph.json');
        const data = await d3.json('graphs/'+file+'.json');
        console.log('DATA test',data);
        // var degreeNodes = _.filter(data['nodes'], (d) => d['collabs']>= minimumDegree);
        var degreeNodes = _.filter(data['nodes'], (d) => d['deg']>= selectedMinimumDegree);
        // console.log('degreeNodes',degreeNodes);
        var listDegreeNodes = _.map(degreeNodes, 'id');
        // console.log('listDegreeNodes', listDegreeNodes);
        var degreeLinks = _.filter(data['links'], function (d) {
        return (_.includes(listDegreeNodes, d['source'])) && (_.includes(listDegreeNodes, d['target']))
        });
        // console.log('degreeLinks', degreeLinks);
        var graph = {'nodes': degreeNodes, 'links':degreeLinks} ;
        console.log('graph', graph);
        // var nodeRadiusScale = d3.scaleLinear(d3.extent(_.map(graph.nodes, 'deg')), radiusRange);

        //    interactive_network
        const links = graph.links.map(d => Object.create(d));
        const nodes =  graph.nodes.map(d => Object.create(d));
        // console.log('graph.nodes', graph.nodes)
        // console.log('nodes', nodes)
        // console.log('links', links)

        const simulation = d3.forceSimulation(graph.nodes)
          .force("link", d3.forceLink(graph.links).distance(maxRadius*linkLengthCoefficient).strength(strengthLink).id(d => d.id))
          .force("charge", d3.forceManyBody().strength(-strengthValue))
          .force("center", d3.forceCenter(width / 2 , height / 2))
          .force('collision', d3.forceCollide().radius(() => maxRadius*collisionCoefficient));


        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(graph.links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.weight))
            .on("click", edgeInfoFunction);

        // Initialize the nodes
        const node = svg.append("g")
            .attr("stroke", "#c31010")
            .attr("stroke-width", 1.5)
            .selectAll("g")
            .data(graph.nodes)
            // .join("a")
            // .attr("href", "#")
            // .attr('tabindex', 0)
            // .append("circle")
            .join('g')
            .call(drag(simulation))
            .classed('node',true)


        node.append('circle')
            // .attr("r", nodeRadius)
            // .attr("r",(d) => d.size)
            .attr("r",(d) => 10)
            // .attr("fill", color)
            .attr("fill", function (node){
                return node.color;
            })
            // .call(drag(simulation))
            .on("click", infoFunction);

        if (displayNodeName) {
            node.append('text')
                .attr("x", 8)
                .attr("y", "0.31em")
                .text(d => d.id).attr("fill", "white")
              .attr("stroke", "blue")
              .attr("stroke-width", 1);
        };


        // var test = d3.select('.node').append('text')
        //     .text('hola');


        // node.append("title")
        //     .text(d => d.id);

          simulation.on("tick", () => {
              graph.nodes.forEach( function (node_i) {
                  node_i.x = Math.max(margin.left, Math.min(width - margin.right, node_i.x));
                  node_i.y = Math.max(margin.top, Math.min(height - margin.bottom , node_i.y));
              });

          node.attr("transform", d => `translate(${d.x},${d.y})`);

          // node.select('circle')
          //   //     // .attr("cx", d => Math.max(margin.left, Math.min(width - margin.right , d.x)) )
          //   //     // .attr("cy", d => Math.max(margin.top, Math.min(height - margin.bottom , d.y)) );
          //       .attr("cx", d => d.x)
          //       .attr("cy", d => d.y);



            link
                // .attr("x1", d => Math.max(margin.left, Math.min(width - margin.right , d.source.x)) )
                // .attr("y1", d => Math.max(margin.top, Math.min(height - margin.bottom , d.source.y)) )
                // .attr("x2", d => Math.max(margin.left, Math.min(width - margin.right , d.target.x)) )
                // .attr("y2", d => Math.max(margin.top, Math.min(height - margin.bottom , d.target.y)) );
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);


            });

    };

    loadData().then(() => {console.log('then');});

};

function remove(){
    var container = d3.selectAll("svg");
    console.log('REMOVE');
    container.remove();
};

function fap(){
    console.log("function f activated");
};

function showInfo(node){
    console.log('showInfo 2');
    var infoDiv = d3.select("#info1");
    console.log('infodiv', infoDiv)

    infoDiv
        .attr('class','panel_on')
        .append("p")
        .append("h4").append("strong").text(node['full-name']);

    for (const property in node){
        if (property=='DOI'){
             var doi = node[property].split("---")
             var doiInfoDiv = d3.select("#info1").append("p").text("Publications:")
             for (let doi_i of doi) {
                 doiInfoDiv
                     .append("p")
                     .append("a")
                     .attr('href', "https://www.doi.org/"+doi_i)
                     .text("  " + doi_i);
             };
         }

        if (property=='ORCID'){
            infoDiv
                .append("p")
                .text(property + ": ")
                .append("a")
                .attr('href', "https://orcid.org/" + node[property])
                .text(node[property]);
        }

        else if(property=='full-name'){
             infoDiv
                .append("p")
                .text("Name"+ ": "+node[property]);

         }

        else if (['community', 'University', 'Department'].includes(property)){
             infoDiv
                .append("p")
                .text(property+ ": "+node[property]);
         }
    };

    infoDiv
        .style("display", "block")
    // .style('left',document.getElementById('container-visual').offsetWidth-0-node.x+'px')
     .style('left', (50+ node.x)+'px')
    .style('top', (20 + node.y)+'px')
    //     .html('<p> <h4><strong>'+ node.index+'</strong></h4></p>');
};

function closeInfo(){
    console.log('closeInfo disabled');
// d3.select('#info').attr('class','panel_off');
};

function infoFunction(event, node){
    d3.select('#info1').html("");
    // selectedNode = node;
    // closeInfo();
    showInfo(node);
};

function edgeInfoFunction(event, edge){
    console.log("CLICKING EDGE");
    // d3.select('#info1').html("");
    showInfo(edge.source);

};





