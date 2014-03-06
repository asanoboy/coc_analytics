var svg, slide, graph, activeCircle,
    tooltip, xAxisLabel, yAxisLabel,
    windowHeight, windowWidth, condition = {},
    xScale, yScale, rScale, xAxis, yAxis, margin,
    costScaleFromDark, isSlideVisible = false,
    IS_SP = 'ontouchstart' in window,
    CLICK_EVENT = IS_SP ? 'touchstart' : 'mousedown';
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
        g = d.getElementsByTagName('body')[0];
    windowHeight = w.innerHeight|| e.clientHeight|| g.clientHeight;
    windowWidth = w.innerWidth || e.clientWidth || g.clientWidth;

    var canvasWidth = d3.select('#inner-container').node().offsetWidth,
        canvasHeight = windowHeight - d3.select('#inner-container').node().offsetHeight,
        minMargin = canvasWidth > 350 ? canvasWidth / 10 : 35,
        graphWidth = Math.min(canvasWidth - minMargin * 2, canvasHeight - minMargin * 2),
        graphHeight = graphWidth,
        maxRadius = graphWidth / 10,
        minRadius = maxRadius / 2;
    margin = {
        top:    (canvasHeight - graphHeight)/2,
        bottom: (canvasHeight - graphHeight)/2,
        left:   (canvasWidth - graphWidth)/2 + 8,
        right:  (canvasWidth - graphWidth)/2 - 12,
    };

    xScale = d3.scale.linear().range([0, graphWidth]);
    yScale = d3.scale.linear().range([graphHeight, 0]);
    rScale = d3.scale.linear().range([minRadius, maxRadius]);
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


    xAxisLabel = d3.select('#x-axis-label')
        .style('width', graphWidth + 'px')
        .style('left', (margin.left) + 'px')
        .style('top', (graphHeight + margin.top + 20) + 'px')
        .select('p')
        ;

    yAxisLabel = d3.select('#y-axis-label')
        .style('width', graphHeight + 'px')
        .style('left', ( -graphWidth + margin.left - 40) + 'px')
        .style('top', ( margin.top ) + 'px')
        .select('p')
        ;

}

function initSlide(){
    slide = d3.select('#slide-container')
        .style('display', 'none')
        .style('width', svg.node().clientWidth + 'px')
        .style('height', svg.node().clientHeight + 'px')
        .style('top', svg.node().getBoundingClientRect().top + 'px')
    ;

    var lastPageX = false;
    function toggleSlide(){
        d3.event.stopPropagation();
        if( isSlideVisible ){
            d3.select(this).classed('active', false);
            slide
                // .transition()
                .style('display', 'none');
            isSlideVisible = false;
        }
        else {
            d3.select(this).classed('active', true);
            slide
                // .transition()
                .style('display', 'block')
                .style('left', svg.node().getBoundingClientRect().left + 'px');
            isSlideVisible = true;
        }
    }
    d3.select('.toggle-cond')
        .on(CLICK_EVENT, toggleSlide)
        ;

}

function convertString(string){
    switch(string){
        case 'SPACE':   return 'Space';
        case 'TIME':    return 'Time';
        case 'DAMAGE':  return 'Damage';
        case 'HP':      return 'Hitpoints';
        case 'COST':    return 'Cost';
        default:
            return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
}

function getFromStorage(key){
    return localStorage ?
        localStorage.getItem(key):
        false;
}

function setToStorage(key, value){
    if( localStorage ){
        localStorage.setItem(key, value);
    }
}

function initGraph(){
    var columns = Object.keys(data[0].base).concat(Object.keys(data[0].level[0]));
    [
        ['#x-value1', getFromStorage('x1') || 'DAMAGE'],
        ['#x-value2', getFromStorage('x2') || 'SPACE'],
        ['#y-value1', getFromStorage('y1') || 'HP'],
        ['#y-value2', getFromStorage('y2') || 'SPACE'],
        ['#r-value1', getFromStorage('r1') || 'LEVEL'],
        ['#r-value2', getFromStorage('r2') || ''],
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
        ['', 'none'],
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

    var filter = getFromStorage('filter');
    if( filter ){
        slide.selectAll('input[name=filter]')
            .each(function(){
                if( this.value === filter ){
                    this.checked = true;
                }
            });
    }
    slide.selectAll("input[name=filter]")
        .on('change', onChangeCondition)
    ;

    onChangeCondition();
    svg.on(CLICK_EVENT, onTouchSvg);
}

function getSelectboxValue(node){
    return node.options[node.selectedIndex].value;
}

function getSelectboxText(node){
    return node.options[node.selectedIndex].text;
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

    condition.filter = slide.select("input[name=filter]:checked").node().value;

    [
        ['#x-value1', 'x1'],
        ['#x-value2', 'x2'],
        ['#y-value1', 'y1'],
        ['#y-value2', 'y2'],
        ['#r-value1', 'r1'],
        ['#r-value2', 'r2'],
    ]
    .forEach(function(ar){
        setToStorage(
            ar[1],
            getSelectboxValue(slide.select(ar[0]).node())
        );
    });
    setToStorage('filter', condition.filter);
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
    hideData();

    [
        [xAxisLabel, '#x-operator', '#x-value1', '#x-value2'],
        [yAxisLabel, '#y-operator', '#y-value1', '#y-value2'],
    ].forEach(function(ar){
        var label = ar[0],
            value1 = getSelectboxText(slide.select(ar[2]).node()),
            operator = getSelectboxText(slide.select(ar[1]).node()),
            operatorValue = getSelectboxValue(slide.select(ar[1]).node()),
            value2 = getSelectboxText(slide.select(ar[3]).node());
        label.html(
            operatorValue ?
            value1 + ' ' + operator + ' ' + value2:
            value1
        );

    });
    var maxX = 0,
        maxY = 0,
        maxR = 0,
        inputData = data.reduce(function(rt, each){
            if( (condition.filter!=='normal' && each.isDark) ||
                (condition.filter!=='dark' && !each.isDark)
            ){
                rt = rt.concat(each.level.map(function(eachLevel){
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
            }
            return rt;
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
        .on(CLICK_EVENT, onTouchStart)
        .on('mouseover', onTouchStart)
        .attr("class", function(d){ return "troop-circle " + d.className; })
        .attr("r", function(d){ return rScale(d.r);})
        .attr("cx", function(d){ return xScale(d.x); })
        .attr("cy", function(d){ return yScale(d.y); })
        ;

    circle.enter()
        .append("circle")
        .on(CLICK_EVENT, onTouchStart)
        .on('mouseover', onTouchStart)
        .attr("class", function(d){ return "troop-circle " + d.className; })
        .attr("r", function(d){ return rScale(d.r);})
        .attr("cx", function(d){ return xScale(d.x); })
        .attr("cy", function(d){ return yScale(d.y); })
        ;

    circle.exit()
        .remove()
        ;

}

function showData(circle){
    var data = d3.select(circle)
        .classed("active", true)
        .data().pop();

    [
        ['#troop-name', data.base.name],
        ['#troop-level', data.level.LEVEL],
        ['#troop-damage', data.level.DAMAGE],
        ['#troop-hitpoints', data.level.HP],
        ['#troop-cost', data.level.COST],
        ['#troop-space', data.base.base.SPACE],
        ['#troop-time', data.base.base.TIME],
    ]
    .forEach(function(ar){
        d3.select(ar[0])
            .html(ar[1]===false ? '-' : ar[1])
            ;
    });

    var cx = parseFloat(d3.select(circle).attr('cx')),
        cy = parseFloat(d3.select(circle).attr('cy')),
        r = parseFloat(d3.select(circle).attr('r'));

    d3.select('#tooltip')
        .style('display', 'block')
        .style('top', function(){
            var height = d3.select('#tooltip').node().offsetHeight,
                top = margin.top + svg.node().getBoundingClientRect().top + cy + r + 3;
            top = Math.max(top, 0);
            top = Math.min(top, windowHeight - height);
            return top + 'px';
        })
        .style('left', function(){
            var width = d3.select('#tooltip').node().offsetWidth,
                left = margin.left + svg.node().getBoundingClientRect().left + cx - width / 2;
            left = Math.max(left, 0);
            left = Math.min(left, windowWidth - width);
            return left + 'px';
        })
        ;


    activeCircle = circle;
}

function hideData(){
    d3.select(activeCircle)
        .classed("active", false);
    d3.select('#tooltip')
        .style('display', 'none');
}

function onTouchSvg(){
    if( activeCircle ){
        hideData();
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();
}

function onTouchStart(d){
    if( activeCircle ){
        hideData();
    }

    if( activeCircle === this ){
        activeCircle = false;
    }
    else {
        showData(this);
    }
    d3.event.stopPropagation();
    d3.event.preventDefault();
}
