
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function chart(weather_data, mta_data) {
    // set the dimensions and margins of the graph
    var barMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        barWidth = 1354 - barMargin.left - barMargin.right,
        barHeight = 1354 - barMargin.top - barMargin.bottom,
        barInnerRadius = 544,
        barOuterRadius = 944;   // the outerRadius goes from the middle of the SVG area to the border

    var tempMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        tempWidth = 500 - tempMargin.left - tempMargin.right,
        tempHeight = 500 - tempMargin.top - tempMargin.bottom,
        tempInnerRadius = 404,
        tempOuterRadius = 415;   // the outerRadius goes from the middle of the SVG area to the border

    // set the dimensions and margins of the graph
    var busMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        busWidth = 500 - busMargin.left - busMargin.right,
        busHeight = 500 - busMargin.top - busMargin.bottom,
        busInnerRadius = 252,
        busOuterRadius = 264;   // the outerRadius goes from the middle of the SVG area to the border

    var weekend_train_sum = 0;
    var weekday_train_sum = 0;
    var weekend_bus_sum = 0;
    var weekday_bus_sum = 0;
    var weekend_length = 0; 
    var weekday_length = 0;

    // Calculate weekend/weekday train/bus sums and lengths
    for (let s = 0; s < mta_data.length - 1; s++) {
        let train = +mta_data[s]["Subways: Total Estimated Ridership"];
        let bus = +mta_data[s]["Buses: Total Estimated Ridership"];
        let date = new Date(mta_data[s]["Date"]);
        let day = date.getDay();

        if (day == 0 || day == 6) {
            weekend_train_sum = +weekend_train_sum +train;
            weekend_bus_sum = +weekend_bus_sum + +bus;
            weekend_length = +weekend_length + 1;
        } else {
            weekday_train_sum = +weekday_train_sum + +train;
            weekday_bus_sum = +weekday_bus_sum + +bus;
            weekday_length = +weekday_length + 1;
        }
    }
    console.log(`weekend_train_sum: ${weekend_train_sum}`);
    console.log(`weekend_length: ${weekend_length}`);
    var tempmin_min;
    var tempmax_max;
    var temp_min;
    var temp_max;
    var rainy_days = [];
    // Get weather data mins and maxes
    for (let s = 0; s < weather_data.length - 1; s++) {
        let tempmax = +weather_data[s].tempmax;
        let tempmin = +weather_data[s].tempmin;
        let temp = +weather_data[s].temp;
        let precip = +weather_data[s].precip;
        let precip_type = weather_data[s].preciptype;
        let date = +weather_data[s].datetime;

        if (precip_type.includes("rain")) {
            rainy_days.push(date)
        }
        tempmax_max = Math.min(tempmax_max, tempmax);
        if (tempmin_min == undefined || tempmin < tempmin_min) {
            tempmin_min = tempmin
        }
        if (temp_min == undefined || temp < temp_min) {
            temp_min = temp
        }
        if (temp_max == undefined || temp > temp_max) {
            temp_max = temp
        }
    }

    // Calculate transit average diff min and maxes
    var weekend_train_avg = weekend_train_sum / weekend_length;
    var weekday_train_avg = weekday_train_sum / weekend_length;
    var weekend_bus_avg = weekend_bus_sum / weekday_length;
    var weekday_bus_avg = weekday_bus_sum / weekday_length;

    var weekend_train_avg_diff_min, weekend_train_avg_diff_max;
    var weekend_bus_avg_diff_min, weekend_bus_avg_diff_max;
    var weekday_train_avg_diff_min, weekday_train_avg_diff_max;
    var weekday_bus_avg_diff_min, weekday_bus_avg_diff_max;

    for (let s = 0; s < mta_data.length - 1; s++) {
        let date = new Date(mta_data[s]["Date"]);
        let day = date.getDay()
        if (day == 0 || day == 6) {
            let weekend_train = +mta_data[s]["Subways: Total Estimated Ridership"];
            let weekend_bus = +mta_data[s]["Buses: Total Estimated Ridership"];
            let weekend_train_diff = +weekend_train_avg - +weekend_train;
            let weekend_bus_diff = +weekend_bus_avg - +weekend_bus;

            let weekend_train_avg_diff = weekend_train_diff / weekend_train_avg;
            let weekend_bus_avg_diff = weekend_bus_diff / weekend_bus_avg;

            if (weekend_train_avg_diff_min == undefined || weekend_train_avg_diff < weekend_train_avg_diff_min) {
                weekend_train_avg_diff_min = weekend_train_avg_diff;
            }
            if (weekend_train_avg_diff_max == undefined || weekend_train_avg_diff > weekend_train_avg_diff_max) {
                weekend_train_avg_diff_max = weekend_train_avg_diff;
            }
            if (weekend_bus_avg_diff_min == undefined || weekend_bus_avg_diff < weekend_bus_avg_diff_min) {
                weekend_bus_avg_diff_min = weekend_bus_avg_diff;
            }
            if (weekend_bus_avg_diff_max == undefined || weekend_bus_avg_diff > weekend_bus_avg_diff_max) {
                weekend_bus_avg_diff_max = weekend_bus_avg_diff;
            }
        } else {
            let weekday_train = +mta_data[s]["Subways: Total Estimated Ridership"];
            let weekday_bus = +mta_data[s]["Buses: Total Estimated Ridership"];
            let weekday_train_diff = +weekday_train_avg - +weekday_train;
            let weekday_bus_diff = +weekend_bus_avg - +weekday_bus;

            let weekday_train_avg_diff = weekday_train_diff / weekend_train_avg;
            let weekday_bus_avg_diff = weekday_bus_diff / weekend_bus_avg;
            
            if (weekday_train_avg_diff_min == undefined || weekday_train_avg_diff < weekday_train_avg_diff_min) {
                weekday_train_avg_diff_min = weekday_train_avg_diff;
            }
            if (weekday_train_avg_diff_max == undefined || weekday_train_avg_diff > weekday_train_avg_diff_max) {
                weekday_train_avg_diff_max = weekday_train_avg_diff;
            }
            if (weekday_bus_avg_diff_min == undefined || weekday_bus_avg_diff < weekday_bus_avg_diff_min) {
                weekday_bus_avg_diff_min = weekday_bus_avg_diff;
            }
            if (weekday_bus_avg_diff_max == undefined || weekday_bus_avg_diff > weekday_bus_avg_diff_max) {
                weekday_bus_avg_diff_max = weekday_bus_avg_diff;
            }
        }
    }

    // temperature X scale
    var tempx = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(weather_data.map(function (d) { return d.datetime; })); // The domain of the X axis is the list of states.

    // temperature Y scale
    const tempy = d3.scaleLinear()
        .domain([temp_min, temp_max]).nice()
        .range([tempHeight - tempMargin.bottom, tempMargin.top]);

    // Color interpolator
    //const color = d3.scaleSequential(tempy.domain(), d3.interpolateRgb("#2D7BB6", "#D7191D"));
    /*
    const color = d3.scaleOrdinal().domain(tempy.domain()).range(["#2D7BB6", "#09CCBC", "#90EB9D", "#FFFF8C", "#F9CF58", "#E76918", "#D7191D"]);
    */
    console.log(`domain: ${tempy.domain()}`)
    const color = d3.scaleSequential(tempy.domain(), d3.interpolateRgbBasisClosed(["#2D7BB6", "#09CCBC", "#FFFF8C", "#F9CF58", "#E76918", "#D7191D"]));
    var tooltip_info = d3.select("#tooltip-info");
    var tooltip = d3.select("#tooltip");

    // append the svg object to the body of the page
    var dataviz_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + barWidth / 2 + "," + (barHeight / 2) + ")"); // Add 100 on Y translation, cause upper bars are longer
  
    // SET TRAIN X scale
    var train_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; })); // The domain of the X axis is the list of states.

    // SET TRAIN Y scale
    var train_y = d3.scaleRadial()
        .range([barInnerRadius, barOuterRadius])   // Domain will be define later.
        .domain([Math.min(+weekend_train_avg_diff_min, weekday_train_avg_diff_min) * 100, Math.max(+weekend_train_avg_diff_max, weekday_train_avg_diff_max) * 100]); // Domain of Y is from 0 to the max seen in the data

    // ADD TRAIN SVG
    dataviz_svg.append("g")
        .attr("id", "train-svg-g")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("class", "train-bar")
        .attr("fill", "#0038A4")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(barInnerRadius)
            .outerRadius(function (d) {
                let date = new Date(d["Date"]);
                let day = date.getDay();
                let x = d['Subways: Total Estimated Ridership'];
                if (day == 0 || day == 6) {
                    let avg_diff = (+x - +weekend_train_avg) / +weekend_train_avg;
                    return train_y(avg_diff * 100);
                } else {
                    let avg_diff = (+x - +weekday_train_avg) / +weekday_train_avg;
                    return train_y(avg_diff * 100);
                }
            })
            .startAngle(function (d) { return train_x(d.Date); })
            .endAngle(function (d) { return train_x(d.Date) + train_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(131))
        .on('mouseover', function (event, d) {
            let date = new Date(d["Date"]);
            let x = d['Subways: Total Estimated Ridership'];
            let avg_diff = (+x - +weekday_train_avg) / +weekday_train_avg;
            let val = avg_diff * 100;

            tooltip_info.html(`<p>${date.toDateString()}: ${val}</p> <p>${train_y.domain()}</p>`);
        });

    // ADD TEMPERATURE SVG
    dataviz_svg.append("g")
        .selectAll("path")
        .data(weather_data)
        .enter()
        .append("path")
        .attr("class", "temp-bar")
        .attr("fill", "#69b3a2")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(tempInnerRadius)
            .outerRadius(function (d) { return tempOuterRadius }) // Keep temp bar height uniform for styling. Color will represent range.
            .startAngle(function (d) { return tempx(d.datetime); })
            .endAngle(function (d) { return tempx(d.datetime) + tempx.bandwidth(); })
            .padAngle(0.05)
            .padRadius(-1)
        )
        .on('mouseover', function (event, d) {
            console.log(d.datetime)
            let date = new Date(d.datetime);
            console.log(date);
            console.log(`${date.toDateString()}`);

            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
        
            console.log(`precip: ${d.precip}`)
            let precip_info = d.precip != 0 ? `<p>${d.preciptype}: ${d.precip} </p>` : ``
            if (d.precip == 0) {    
                let rain_vid = document.getElementById("rain-vid-container");
                let snow_vid = document.getElementById("snow-vid-container");
                rain_vid.style.display = 'none';
                snow_vid.style.display = 'none';
            }
            if (d.precip > 0) {    
                let rain_vid = document.getElementById("rain-vid-container");
                let snow_vid = document.getElementById("snow-vid-container");
                if (d.preciptype.includes('snow')) {
                    snow_vid.style.display = 'block';
                }
                if (d.preciptype.includes('rain')) {
                    rain_vid.style.display = 'block';
                }
            }
            console.log(precip_info)
            tooltip_info.html( precip_info + `<p>${date.toDateString()}: ${d.temp} celsius </p>` + `<p> cloud cover: ${d.cloudcover}</p>`);
        })
        .style('fill', function (d) { return color(d.temp) });

    // X scale
    var bus_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; })); // The domain of the X axis is the list of states.

    // Y scale
    var bus_y = d3.scaleRadial()
        .range([busInnerRadius, busOuterRadius])   // Domain will be define later.
        .domain([Math.min(weekday_bus_avg_diff_min, weekend_bus_avg_diff_min) * 100, Math.max(weekday_bus_avg_diff_max, weekend_bus_avg_diff_max) * 100]); // Domain of Y is from 0 to the max seen in the data

    // ADD BUS SVG
    dataviz_svg.append("g")
        .attr("id", "bus-svg-g")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("class", "bus-bar")
        .attr("fill", "#6DBF45")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(busInnerRadius)
            .outerRadius(function (d) {
                let date = new Date(d["Date"]);
                let day = date.getDay();
                let x = d['Buses: Total Estimated Ridership'];
                if (day == 0 || day == 6) {
                    let avg_diff = (+x - +weekend_bus_avg) / +weekend_bus_avg;
                    return bus_y(+avg_diff * 100);
                } else {
                    let avg_diff = (+x - +weekday_bus_avg) / +weekday_bus_avg;
                    return bus_y(+avg_diff * 100);
                }
            })
            .startAngle(function (d) { return bus_x(d.Date); })
            .endAngle(function (d) { return bus_x(d.Date) + bus_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(33))
        .on('mouseover', function (event, d) {
            let date = new Date(d["Date"]);
            let day = date.getDay();
            let x = d['Buses: Total Estimated Ridership'];
            let val = 0;
            if (day == 0 || day == 6) {
                let avg_diff = (+x - +weekend_bus_avg) / +weekend_bus_avg;
                val = avg_diff * 100;
            } else {
                let avg_diff = (+x - +weekday_bus_avg) / +weekday_bus_avg;
                val = avg_diff * 100;
            }

            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
 
            tooltip_info.html(`<p>${date.toDateString()}: ${val}</p>`);
        });
}



export function buttonEventListeners() {
    var sun_button = document.getElementById('sun-button');
    var rain_button = document.getElementById('rain-button');
    var snow_button = document.getElementById('snow-button');
    var cloud_button = document.getElementById('cloud-button');

    const weather_info_default_html = "<p>Hover over a bar to see data for that day.</p>";
    
    rain_button.addEventListener("click", function(e) {
        e.preventDefault();

        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        let snow_button = document.getElementById("snow-button");

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            const rainy_days = d3.selectAll(".temp-bar").filter((d, i) => !d.preciptype.includes("rain")).style('opacity', '1');
            rain_vid.style.display = 'none'

            return; 
        } if (this.classList.contains('inactive')) {
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, this.animationDelay + 20);   
            if (snow_button.classList.contains("inactive")) {
                snow_vid.style.display = 'none';
            }
            rain_vid.style.display = 'block';

            const rainy_days = d3.selectAll(".temp-bar").filter((d, i) => !d.preciptype.includes("rain")).style('opacity', '.2');
            console.log(rainy_days);

            const rainy_bus_d = d3.selectAll(".bus-bar").filter((d,i) => d.Date);

            tooltip_info.innerHTML =`${weather_info_default_html}`;
            this.classList.remove('inactive');
            this.classList.add('active');
            return;
        }
    });
    
    snow_button.addEventListener("click", function(e) {
        e.preventDefault();

        console.log(`classes: ${this.className}`)
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            const snowy_days = d3.selectAll(".temp-bar").filter((d, i) => !d.preciptype.includes("snow")).style('opacity', '1');
            snow_vid.style.display = 'none'
            return; 
        } if (this.classList.contains('inactive')) {
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, this.animationDelay + 20);   
            snow_vid.style.display = 'block';
            rain_vid.style.display = 'none';

            const snowy_days = d3.selectAll(".temp-bar").filter((d, i) => !d.preciptype.includes("snow")).style('opacity', '.2');

            tooltip_info.innerHTML =`${weather_info_default_html}`;
            this.classList.remove('inactive');
            this.classList.add('active');
            return;
        }
    });
    
    cloud_button.addEventListener("click", function(e) {
        e.preventDefault();

        tooltip.transition()
            .duration(100)
            .style("opacity", 1);
    
        tooltip.html(`<p></p>`);
        return false;
    });
    return false;
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