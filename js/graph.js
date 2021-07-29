var isInfoShown = false;

$(document).ready(function() {
    console.log('INITIALISATION');


    var nodeMinimumDegreeList = [1, 5,10,20,50,100,1000];


        // List of groups (here I have one group per column)
    // var allGroup = ["valueA", "valueB", "valueC"]

    // add the options to the button
    d3.select("#selectButton")
      .selectAll('myOptions')
     	.data(nodeMinimumDegreeList)
      .enter()
    	.append('option')
      .text(function (d) { return d; }) // text showed in the menu
      .attr("value", function (d) { return d; })

   d3.select("#selectButton").on("change", function(d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    // update(selectedOption)
    console.log('select button', selectedOption);
    remove();
    draw(selectedOption);

    })

});



function draw(minimumDegree){
    // d3.select("body").select('#viz1').selectAll('svg').remove()
    console.log('REMOVE')
    console.log('DRAW')
     var strengthValue = 5;
    var strengthLink = 0.5;
    var minRadius = 1;
    var maxRadius = 20;
    const radiusRange = [minRadius, maxRadius];
    var collideStrenght = 50;
    // var minimumDegree = 1;
    var edgealpha = 0.5;
    var maximumEdgeWeight = 0.8;
    var maxedgewidth = 1;
    var uni = 'UB';

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
        const data = await d3.json('graphs/kewords.json');
        console.log('data test',data);
        // var degreeNodes = _.filter(data['nodes'], (d) => d['collabs']>= minimumDegree);
        var degreeNodes = _.filter(data['nodes'], (d) => d['deg']>= minimumDegree);
        // console.log('degreeNodes',degreeNodes);
        var listDegreeNodes = _.map(degreeNodes, 'id');
        // console.log('listDegreeNodes', listDegreeNodes);
        var degreeLinks = _.filter(data['links'], function (d) {
        return (_.includes(listDegreeNodes, d['source'])) && (_.includes(listDegreeNodes, d['target']))
        });
        // console.log('degreeLinks', degreeLinks);
        var graph = {'nodes': degreeNodes, 'links':degreeLinks} ;
        console.log('graph', graph);
        var nodeRadiusScale = d3.scaleLinear(d3.extent(_.map(graph.nodes, 'deg')), radiusRange);

        //    interactive_network
        const links = graph.links.map(d => Object.create(d));
        const nodes =  graph.nodes.map(d => Object.create(d));
        // console.log('graph.nodes', graph.nodes)
        // console.log('nodes', nodes)
        // console.log('links', links)

        const simulation = d3.forceSimulation(graph.nodes)
          .force("link", d3.forceLink(graph.links).distance(maxRadius/8).strength(strengthLink).id(d => d.id))
          .force("charge", d3.forceManyBody().strength(-strengthValue))
          .force("center", d3.forceCenter(width / 2 , height / 2))
          .force('collision', d3.forceCollide().radius(() => maxRadius/2));


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
            .selectAll("circle")
            .data(graph.nodes)
            // .join("a")
            // .attr("href", "#")
            // .attr('tabindex', 0)
            // .append("circle")
            .join('circle')
            // .attr("r", nodeRadius)
            .attr("r",(d) => d.size)
            // .attr("fill", color)
            .attr("fill", function (node){
                return node.color;
            })
            .call(drag(simulation))
            .on("click", infoFunction);

        node.append("title")
            .text(d => d.id);

          simulation.on("tick", () => {
              graph.nodes.forEach( function (node_i) {
                  node_i.x = Math.max(margin.left, Math.min(width - margin.right, node_i.x));
                  node_i.y = Math.max(margin.top, Math.min(height - margin.bottom , node_i.y));
              })

            node
                // .attr("cx", d => Math.max(margin.left, Math.min(width - margin.right , d.x)) )
                // .attr("cy", d => Math.max(margin.top, Math.min(height - margin.bottom , d.y)) );
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);


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
        .append("h4").append("strong").text(node.id);

    for (const property in node){
     if (['name','id','DOI','deg','community','weight'].includes(property)){
         if (property=='DOI'){
             var doi = node[property].split("~")
             var doiInfoDiv = d3.select("#info1").append("p").text(property +":")
             for (let doi_i of doi) {
                 doiInfoDiv
                     .append("p")
                     .append("a")
                     .attr('href', "https://www.doi.org/"+doi_i)
                     .text("  " + doi_i);
             };
         }
         else {
             infoDiv
                .append("p")
                .text(property+ ": "+node[property]);
         };

         };
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





