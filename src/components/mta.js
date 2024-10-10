
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function chart(mta_data) {
    var min = d3.min(mta_data, d => d['Subways: Total Estimated Ridership']);
    var max = d3.max(mta_data, d => d['Subways: Total Estimated Ridership']);

    console.log(min)
    console.log(max)
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 10, bottom: 10, left: 10 },
        width = 1152 - margin.left - margin.right,
        height = 1087 - margin.top - margin.bottom,
        innerRadius = 60,
        outerRadius = Math.min(width, height) / 3;   // the outerRadius goes from the middle of the SVG area to the border

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 100) + ")"); // Add 100 on Y translation, cause upper bars are longer


    // X scale
    var x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; })); // The domain of the X axis is the list of states.

    // Y scale
    var y = d3.scaleRadial()
        .range([innerRadius, outerRadius])   // Domain will be define later.
        .domain([min, max]); // Domain of Y is from 0 to the max seen in the data

    // Add bars
    svg.append("g")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("fill", "#69b3a2")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(innerRadius)
            .outerRadius(function (d) { return y(d['Subways: Total Estimated Ridership']); })
            .startAngle(function (d) { return x(d.Date); })
            .endAngle(function (d) { return x(d.Date) + x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(innerRadius))

    // Add the labels
    svg.append("g")
        .selectAll("g")
        .data(mta_data)
        .enter()
        .append("g")
        .attr("text-anchor", function (d) { return (x(d.Date) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
        .attr("transform", function (d) { return "rotate(" + ((x(d.Date) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (y(d['Subways: Total Estimated Ridership']) + 10) + ",0)"; })
        .append("text")
        .text(function (d) { return (d.Date) })
        .attr("transform", function (d) { return (x(d.Date) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
        .style("font-size", "11px")
        .attr("alignment-baseline", "middle")

}