initSvg();
initSlide();
initGraph();
drawGraph();

var svg, slide, windowWidth, condition = {};

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
        leftOrig = windowWidth - 10;
    slide = d3.select('#slide-container')
        .style('display', 'block')
        .style('width', svg.node().clientWidth + 'px')
        .style('height', svg.node().clientHeight + 'px')
        .style('top', svg.node().getBoundingClientRect().top + 'px')
        .style('left', leftOrig + 'px')
    ;

    var lastPageX = false;
    d3.select('#container')
        .on('touchmove', function(){
            if( lastPageX !== false ){
                slide.style(
                    'left',
                    (parseInt(slide.style('left'), 10) +
                    ( d3.event.touches[0].pageX - lastPageX)) + 'px'
                );
            }
            lastPageX = d3.event.touches[0].pageX;
        })
        .on('touchend', function(){
            lastPageX = false;
            if( parseInt(slide.style('left'), 10) > windowWidth / 2 ){
                slide.transition()
                    .style('left', leftOrig + 'px');
            }
            else {
                slide.transition()
                    .style('left', leftDest + 'px');
            }
        });

}

function convertString(string){
    switch(string){
        case 'SPACE': return 'Space';
        case 'TIME': return 'Time';
        case 'DAMAGE': return 'Damage';
        case 'HP': return 'Hitpoints';
        case 'COST': return 'Cost';
        default:
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
}

function initGraph(){
    var columns = Object.keys(data[0].base).concat(Object.keys(data[0].level[0]));
    [
        ['#x-value1', 'HP'],
        ['#x-value2', 'COST'],
        ['#y-value1', 'DAMAGE'],
        ['#y-value2', 'COST'],
        ['#r-value1', 'COST'],
        ['#r-value2', ''],
    ]
    .forEach(function(ar){
        slide.select(ar[0])
            .on('change', onChangeCondition)
            .selectAll('option')
            .data(columns)
            .enter()
            .append('option')
            .attr('value', function(d){ return d; })
            .each(function(d){
                if( d === ar[1] ){
                    d3.select(this).attr('selected', '');
                }
            })
            .html(function(d){ return convertString(d); })
        ;
    });

    var operators = [
        ['', ''],
        ['add', '+'],
        ['div', '/'],
        ['mul', 'x'],
    ];
    [
        ['#x-operator', 'div',  '#x-value2'],
        ['#y-operator', 'div',  '#y-value2'],
        ['#r-operator', '',     '#r-value2'],
    ]
    .forEach(function(ar){
        slide.select(ar[0])
            .on('change', onChangeCondition)
            .selectAll('option')
            .data(operators)
            .enter()
            .append('option')
            .attr('value', function(d){ return d[0]; })
            .each(function(d){
                if( d[0] === ar[1] ){
                    d3.select(this).attr('selected', '');
                }
            })
            .html(function(d){ return d[1]; })
        ;
    });
    onChangeCondition();
}

function getSelectboxValue(node){
    return node.options[node.selectedIndex].value;
}

function onChangeCondition(){
    condition = {};
    [
        ['x', '#x-operator', '#x-value1', '#x-value2'],
        ['y', '#y-operator', '#y-value1', '#y-value2'],
        ['r', '#r-operator', '#r-value1', '#r-value2'],
    ]
    .forEach(function(ar){
        if( getSelectboxValue(slide.select(ar[1]).node()) === '' ){
            slide.select(ar[3])
                .attr('disabled', '');
        }
        else {
            slide.select(ar[3])
                .attr('disabled', null);
        }
        condition[ar[0]] = {
            value1: getSelectboxValue(slide.select(ar[2]).node()),
            operator: getSelectboxValue(slide.select(ar[1]).node()),
            value2: getSelectboxValue(slide.select(ar[3]).node()),
        };
    });
}

function drawGraph() {


}

function initGesture(){
}
