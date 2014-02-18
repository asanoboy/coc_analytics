initSvg();
initSlide();
initGesture();

var svg, slide, windowWidth;

function initSvg(){
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        windowHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
    windowWidth = w.innerWidth || e.clientWidth || g.clientWidth;

    var minMargin = 50,
        canvasWidth = d3.select('#inner-container').node().offsetWidth,
        canvasHeight = windowHeight - d3.select('#inner-container').node().offsetHeight,
        graphWidth = Math.min(canvasWidth - minMargin * 2, canvasHeight - minMargin * 2),
        graphHeight = graphWidth,
        margin = {
            top:    (canvasHeight - graphHeight)/2,
            bottom: (canvasHeight - graphHeight)/2,
            left:   (canvasWidth - graphWidth)/2,
            right:  (canvasWidth - graphWidth)/2,
        };

    // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    var x = d3.scale.linear().range([0, graphWidth]),
        y = d3.scale.linear().range([graphHeight, 0]),
        xAxis = d3.svg.axis().scale(x).ticks(4).tickSize(3);
        yAxis = d3.svg.axis().scale(y).ticks(4).tickSize(3).orient('left');


    // An area generator, for the light fill.
    // var area = d3.svg.area()
    //     .interpolate("monotone")
    //     .x(function(d) { return x(d.date); })
    //     .y0(graphWidth)
    //     .y1(function(d) { return y(d.price); });

    // A line generator, for the dark stroke.
    // var line = d3.svg.line()
    //     .interpolate("monotone")
    //     .x(function(d) { return x(d.date); })
    //     .y(function(d) { return y(d.price); });

    svg = d3.select("#main_content").append("svg");
    graph = svg
            .attr("width", canvasWidth)
            .attr("height", canvasHeight)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;
    graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(xAxis);

    // Add the y-axis.
    graph.append("g")
        .attr("class", "y axis")
        // .attr("transform", "translate(" + minMargin + ",0)") 
        .call(yAxis);

    // graph.append("g")
    //     .attr("class", "circle")
    //     .selectAll("circle")
    //     .data(data)
    //     .enter()
    //     .append("circle")
    //     .attr("r", function(d){ return Math.random() * 30;})
    //     .attr("cx", function(d){ return Math.random() * 30;})
    //     .attr("cy", function(d){ return Math.random() * 30;})
    //     .on("click", click)
    //     ;

    function click(d){
        debugger;
    }
}

function initSlide(){
    var leftDest = svg.node().getBoundingClientRect().left,
        leftOrig = windowWidth - 100;
    slide = d3.select('#slide-container')
        .style('display', 'block')
        .style('width', svg.node().clientWidth + 'px')
        .style('height', svg.node().clientHeight + 'px')
        .style('top', svg.node().getBoundingClientRect().top + 'px')
        .style('left', leftOrig + 'px')
    ;
}

function initGesture(){


}
