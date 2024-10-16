
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function chart(weather_data, mta_data) {
    // set the dimensions and margins of the graph
    var barMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        barWidth = 1354 - barMargin.left - barMargin.right,
        barHeight = 1354 - barMargin.top - barMargin.bottom,
        barInnerRadius = 544,
        barOuterRadius = 644;   // the outerRadius goes from the middle of the SVG area to the border

    var tempMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        tempWidth = 500 - tempMargin.left - tempMargin.right,
        tempHeight = 500 - tempMargin.top - tempMargin.bottom,
        tempInnerRadius = 311,
        tempOuterRadius = 322;   // the outerRadius goes from the middle of the SVG area to the border


    // set the dimensions and margins of the graph
    var busMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        busWidth = 500 - busMargin.left - busMargin.right,
        busHeight = 500 - busMargin.top - busMargin.bottom,
        busInnerRadius = 211,
        busOuterRadius = 213;   // the outerRadius goes from the middle of the SVG area to the border

    var train_sum = 0;
    var bus_sum = 0;

    for (let s = 0; s < mta_data.length - 1; s++) {
        let train = mta_data[s]["Subways: Total Estimated Ridership"];
        let bus = mta_data[s]["Buses: Total Estimated Ridership"]
        train_sum = +train_sum + +train;
        bus_sum = +bus_sum + +bus;
    }

    var train_avg = train_sum / mta_data.length;
    var bus_avg = bus_sum / mta_data.length;
    var train_avg_diff_min, train_avg_diff_max;
    var bus_avg_diff_min, bus_avg_diff_max;

    for (let s = 0; s < mta_data.length - 1; s++) {
        let train = +mta_data[s]["Subways: Total Estimated Ridership"];
        let bus = +mta_data[s]["Buses: Total Estimated Ridership"];

        let train_diff = +train_avg - +train;
        let bus_diff = +bus_avg - +bus;
        let train_avg_diff = train_diff / train_avg;
        let bus_avg_diff = bus_diff / bus_avg;
        if (train_avg_diff_min == undefined || train_avg_diff < train_avg_diff_min) {
            train_avg_diff_min = train_avg_diff;
        }
        if (train_avg_diff_max == undefined || train_avg_diff > train_avg_diff_max) {
            train_avg_diff_max = train_avg_diff;
        }
        if (bus_avg_diff_min == undefined || bus_avg_diff < bus_avg_diff_min) {
            bus_avg_diff_min = bus_avg_diff;
        }
        if (bus_avg_diff_max == undefined || bus_avg_diff > bus_avg_diff_max) {
            bus_avg_diff_max = bus_avg_diff;
        }
    }

    // Max temperature value observed:
    const tempmax = d3.max(weather_data, function (d) { return +d.tempmax; })
    const tempmin = d3.max(weather_data, function (d) { return +d.tempmin; })

    // temperature X scale
    var tempx = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(weather_data.map(function (d) { return d.datetime; })); // The domain of the X axis is the list of states.

    // temperature Y scale
    const tempy = d3.scaleLinear()
        .domain(d3.extent(weather_data, d => d.tempmax)).nice()
        .range([tempHeight - tempMargin.bottom, tempMargin.top]);

    // Color interpolator
    const color = d3.scaleSequential(tempy.domain(), d3.interpolateTurbo);

    var tooltip = d3.select("#tooltip");

    // append the svg object to the body of the page
    var train_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + barWidth / 2 + "," + (barHeight / 2 + 100) + ")")  // Add 100 on Y translation, cause upper bars are longer
        .attr("position", "absolute");


    // X scale
    var train_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; })); // The domain of the X axis is the list of states.

    // Y scale
    var train_y = d3.scaleRadial()
        .range([barInnerRadius, barOuterRadius])   // Domain will be define later.
        .domain([+train_avg_diff_min * 100, +train_avg_diff_max * 100]); // Domain of Y is from 0 to the max seen in the data

    // Add bars
    train_svg.append("g")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("fill", "#69b3a2")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(barInnerRadius)
            .outerRadius(function (d) {
                let x = d['Subways: Total Estimated Ridership'];
                let avg_diff = (+x - +train_avg) / +train_avg;
                return train_y(+avg_diff * 100);
            })
            .startAngle(function (d) { return train_x(d.Date); })
            .endAngle(function (d) { return train_x(d.Date) + train_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(131))
        .on('mouseover', function (event, d) {
            console.log("train!!!");

            //Makes div appear
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            tooltip.html(d['Date'] + ' ' + d['Subways: Total Estimated Ridership'] + ' subway riders')
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");

        })
        .on('mouseout', function (event, d) {
            console.log("bye");

            tooltip.transition()
                .duration('50')
                .attr('opacity', '1');          //Makes the new div disappear:
            tooltip.transition()
                .duration('50')
                .style("opacity", 0);
        });


    // Temperature svg add
    train_svg.append("g")
        .selectAll("path")
        .data(weather_data)
        .enter()
        .append("path")
        .attr("fill", "#69b3a2")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(tempInnerRadius)
            .outerRadius(function (d) { return tempOuterRadius })
            .startAngle(function (d) { return tempx(d.datetime); })
            .endAngle(function (d) { return tempx(d.datetime) + tempx.bandwidth(); })
            .padAngle(0.05)
            .padRadius(-1)
        )
        .on('mouseover', function (event, d) {
            console.log("temp");

            //Makes div appear
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            tooltip.html(d['datetime'] + ' ' + d.tempmax + ' celcius ')
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");

        })
        .on('mouseout', function (event, d) {
            console.log("temp bye");

            tooltip.transition()
                .duration('50')
                .attr('opacity', '1');          //Makes the new div disappear:
            tooltip.transition()
                .duration('50')
                .style("opacity", 0);
        })
        .style('fill', function (d) { return color(d.tempmax) });



    // X scale
    var bus_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; })); // The domain of the X axis is the list of states.

    // Y scale
    var bus_y = d3.scaleRadial()
        .range([busInnerRadius, busOuterRadius])   // Domain will be define later.
        .domain([bus_avg_diff_min, bus_avg_diff_max]); // Domain of Y is from 0 to the max seen in the data

    // Add bars
    train_svg.append("g")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("fill", "#143873")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(busInnerRadius)
            .outerRadius(function (d) {
                let x = d['Buses: Total Estimated Ridership'];
                let avg_diff = (+x - +bus_avg) / +bus_avg;
                return bus_y(+avg_diff * 10);
            })
            .startAngle(function (d) { return bus_x(d.Date); })
            .endAngle(function (d) { return bus_x(d.Date) + bus_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(33))
        .on('mouseover', function (event, d) {
            console.log("hi");

            //Makes div appear
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            tooltip.html(d['Date'] + ' ' + d['Buses: Total Estimated Ridership'] + ' bus riders')
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 15) + "px");

        })
        .on('mouseout', function (event, d) {
            console.log("bye");

            tooltip.transition()
                .duration('50')
                .attr('opacity', '1');          //Makes the new div disappear:
            tooltip.transition()
                .duration('50')
                .style("opacity", 0);
        });


}

/*
    // Add the labels
    train_svg.append("g")
        .selectAll("g")
        .data(mta_data)
        .enter()
        .append("g")
        .attr("text-anchor", function (d) { return (train_x(d.Date) + train_x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
        .attr("transform", function (d) { return "rotate(" + ((train_x(d.Date) + train_x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (train_y(d['Subways: Total Estimated Ridership']) + 10) + ",0)"; })
        .append("text")
        .text(function (d) { return (d.Date) })
        .attr("transform", function (d) { return (train_x(d.Date) + train_x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
        .style("font-size", "11px")
        .style("fill", "gray")
        .attr("alignment-baseline", "central");
        
    // Add the temperature labels
    temp_svg.append("g")
        .selectAll("g")
        .data(weather_data)
        .enter()
        .append("g")
        .attr("text-anchor", function (d) { return (tempx(d.datetime) + tempx.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
        .attr("transform", function (d) { return "rotate(" + ((tempx(d.datetime) + tempx.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (tempOuterRadius) + ",0)"; })
        .append("text")
        .text(function (d) { return (d.datetime + '---' + d.tempmax) })
        .attr("transform", function (d) { return (tempx(d.datetime) + tempx.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
        .style("font-size", "6px")
        .style("font-size", "6px")
        .style("fill", "white")
        .attr("alignment-baseline", "middle");

        
    // append the svg object to the body of the page
    var bus_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", busWidth + busMargin.left + busMargin.right)
        .attr("height", busHeight + busMargin.top + busMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + busWidth / 2 + "," + (busHeight / 2 + 100) + ")") // Add 100 on Y translation, cause upper bars are longer
        .attr("position", "absolute");

    var temp_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + barWidth / 2 + "," + (barHeight / 2 + 100) + ")") // Add 100 on Y translation, cause upper bars are longer
        .attr("position", "absolute");

*/