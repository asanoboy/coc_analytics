var svg, slide, graph, activeCircle,
    windowWidth, condition = {},
    xScale, yScale, rScale, xAxis, yAxis,
    costScaleFromDark, isSlideVisible = false;
initData();
initSvg();
initSlide();
initGraph();

function initData(){
    var maxCost = 0, maxDarkCost = 0;
    data.forEach(function(each){
        each.level.forEach(function(eachLevel){
            if( each.isDark ){
                maxDarkCost = Math.max(maxDarkCost, eachLevel.COST);
            }
            else {
                maxCost = Math.max(maxCost, eachLevel.COST);
            }
        });
    });
    costScaleFromDark = d3.scale.linear()
        .domain([0, maxDarkCost])
        .range([0, maxCost])
    ;
}

function initSvg(){
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        windowHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
    windowWidth = w.innerWidth || e.clientWidth || g.clientWidth;

    var minMargin = 30,
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

    xScale = d3.scale.linear().range([0, graphWidth]);
    yScale = d3.scale.linear().range([graphHeight, 0]);
    rScale = d3.scale.linear().range([5, 20]);
    xAxis = d3.svg.axis().scale(xScale).ticks(4).tickSize(3);
    yAxis = d3.svg.axis().scale(yScale).ticks(4).tickSize(3).orient('left');

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

    graph.append("g")
        .attr("class", "y axis")
        // .attr("transform", "translate(" + minMargin + ",0)") 
        .call(yAxis);

    graph.append("g")
        .attr("class", 'circle');
}

function initSlide(){
    var leftDest = svg.node().getBoundingClientRect().left,
        leftOrig = windowWidth + 10;
    slide = d3.select('#slide-container')
        .style('display', 'block')
        .style('width', svg.node().clientWidth + 'px')
        .style('height', svg.node().clientHeight + 'px')
        .style('top', svg.node().getBoundingClientRect().top + 'px')
        .style('left', leftOrig + 'px')
    ;

    var lastPageX = false;
    d3.select('.toggle-cond')
        .on('touchend', function(){
            if( isSlideVisible ){
                slide
                    // .transition()
                    .style('left', leftOrig + 'px');
                isSlideVisible = false;
            }
            else {
                slide
                    // .transition()
                    .style('left', leftDest + 'px');
                isSlideVisible = true;
            }
        });

}

function convertString(string){
    switch(string){
        case 'SPACE':   return 'Space';
        case 'TIME':    return 'Time';
        case 'DAMAGE':  return 'Damage';
        case 'HP':      return 'Hitpoints';
        case 'COST':    return 'Elixir';
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
    drawGraph();
}

function applyOperator(value1, value2, operator){
    switch(operator){
        case 'div':
            return value1 / value2;
        case 'mul':
            return value1 * value2;
        default:
            return value1;
    }
}

function calcValue(eachData, eachLevel, eachCond){
    var value1, value2, result;
    if( eachCond.value1 in eachData.base ){
        value1 = eachData.base[eachCond.value1];
    }
    else if( eachCond.value1 in eachLevel ){
        value1 = eachLevel[eachCond.value1];
    }
    if(eachCond.value1 === 'COST' && eachData.isDark ){
        value1 = costScaleFromDark(value1);
    }

    if( eachCond.value2 in eachData.base ){
        value2 = eachData.base[eachCond.value2];
    }
    else if( eachCond.value2 in eachLevel ){
        value2 = eachLevel[eachCond.value2];
    }
    if(eachCond.value2 === 'COST' && eachData.isDark ){
        value2 = costScaleFromDark(value2);
    }

    result = applyOperator(value1, value2, eachCond.operator);

    return result;
}

function drawGraph() {
    var maxX = 0,
        maxY = 0,
        maxR = 0,
        inputData = data.reduce(function(rt, each){
            return rt.concat(each.level.map(function(eachLevel){
                var x = calcValue(each, eachLevel, condition.x),
                    y = calcValue(each, eachLevel, condition.y),
                    r = calcValue(each, eachLevel, condition.r);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                maxR = Math.max(maxR, r);
                return {
                    x:x,
                    y:y,
                    r:r,
                    className: each.name.split('.').join('').slice(0, 3),
                    base: each,
                    level: eachLevel,
                };
            }));
        }, []);

    xScale.domain([0, maxX]);
    yScale.domain([0, maxY]);
    rScale.domain([0, maxR]);
    graph.select('.x.axis').call(xAxis);
    graph.select('.y.axis').call(yAxis);

    var circle = graph.select(".circle")
        .selectAll("circle")
        .data(inputData);

    circle
        .on("touchstart", onTouchStart)
        // .on('touchend', onTouchEnd)
        // .transition()
        .attr("class", function(d){ return "troop-circle " + d.className; })
        .attr("r", function(d){ return rScale(d.r);})
        .attr("cx", function(d){ return xScale(d.x); })
        .attr("cy", function(d){ return yScale(d.y); })
        ;

    circle.enter()
        .append("circle")
        .on("touchstart", onTouchStart)
        // .on('touchend', onTouchEnd)
        .attr("class", function(d){ return "troop-circle " + d.className; })
        .attr("r", function(d){ return rScale(d.r);})
        .attr("cx", function(d){ return xScale(d.x); })
        .attr("cy", function(d){ return yScale(d.y); })
        ;

    circle.exit()
        .remove()
        ;

    function onTouchStart(d){
        if( activeCircle ){
            d3.select(activeCircle)
                .classed("active", false);
        }

        if( activeCircle === this ){
            activeCircle = false;
        }
        else {
            activeCircle = this;
            d3.select(this)
                .classed("active", true)
            ;
        }

    }
}
