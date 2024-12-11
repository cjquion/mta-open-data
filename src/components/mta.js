
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import $ from 'jquery';
import 'jquery-ui-bundle';


export function c_to_f(deg) {
    let res = (deg * (9/5)) + 32;

    return Number( res.toPrecision(3) )
}
export function f_to_c(deg) {
    let res = (deg - 32) * (5/9)
    return Number( res.toPrecision(3) )
}
function to_slash_date(d) {
    let date = new Date(d);
    let day = ('0' + date.getDate()).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    return `${month}/${day}/${year}`
}
export function chart(weather_data, mta_data) {
 
    function turn_off_all_videos() {
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");
        var sun_vid = document.getElementById("sun-vid-container");
        rain_vid.style.display = 'none'
        snow_vid.style.display = 'none'
        cloud_vid.style.display = 'none'
        sun_vid.style.display = 'none'
    }

    var height_test = window.innerHeight;

    // set the dimensions and margins of the graph
    var barMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        barWidth = height_test - barMargin.left - barMargin.right,
        barHeight = height_test - barMargin.top - barMargin.bottom,
        barInnerRadius = parseFloat(height_test) * .4,
        barOuterRadius = parseFloat(height_test) * .454;   // the outerRadius goes from the middle of the SVG area to the border

    var tempMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        tempWidth = 500 - tempMargin.left - tempMargin.right,
        tempHeight = 500 - tempMargin.top - tempMargin.bottom,
        tempInnerRadius = parseFloat(height_test) * .269,
        tempOuterRadius = parseFloat(height_test) * .329;   // the outerRadius goes from the middle of the SVG area to the border

    // set the dimensions and margins of the graph
    var busMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        busWidth = 900 - busMargin.left - busMargin.right,
        busHeight = 900 - busMargin.top - busMargin.bottom,
        busInnerRadius = parseFloat(height_test) * .215,
        busOuterRadius = parseFloat(height_test) * .255;   // the outerRadius goes from the middle of the SVG area to the border

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
            weekend_train_sum = parseFloat(weekend_train_sum) + parseFloat(train);
            weekend_bus_sum = +weekend_bus_sum + +bus;
            weekend_length = parseFloat(weekend_length) + 1;
        } else {
            weekday_train_sum = parseFloat(weekday_train_sum) + parseFloat(train);
            weekday_bus_sum = +weekday_bus_sum + +bus;
            weekday_length = parseFloat(weekday_length) + 1;
        }
    }
    var tempmin_min;
    var tempmax_max;
    var temp_min;
    var temp_max;
    var temp_avg;
    var temp_sum = 0;
    // Get weather data mins and maxes
    for (let s = 0; s < weather_data.length - 1; s++) {
        let tempmax = +weather_data[s].tempmax;
        let tempmin = +weather_data[s].tempmin;
        let temp = +weather_data[s].temp;

        if (tempmin_min == undefined || +tempmin < +tempmin_min) {
            tempmin_min = tempmin
        }
        if (temp_min == undefined || +temp < +temp_min) {
            temp_min = temp
        }
        if (temp_max == undefined || +temp > +temp_max) {
            temp_max = temp
        }
        if (tempmax_max == undefined || +tempmax > +tempmax_max) {
            tempmax_max = tempmax
        }
        temp_sum = +temp_sum + +temp;
    }
    temp_avg = temp_sum / weather_data.length - 1;

    // Calculate transit average diff min and maxes
    var weekend_train_avg = weekend_train_sum / weekend_length;
    var weekday_train_avg = weekday_train_sum / weekday_length;
    var weekend_bus_avg = weekend_bus_sum / weekend_length;
    var weekday_bus_avg = weekday_bus_sum / weekday_length;

    var weekend_train_avg_diff_min, weekend_train_avg_diff_max;
    var weekend_bus_avg_diff_min, weekend_bus_avg_diff_max;
    var weekday_train_avg_diff_min, weekday_train_avg_diff_max;
    var weekday_bus_avg_diff_min, weekday_bus_avg_diff_max;

    for (let s = 0; s < mta_data.length - 1; s++) {
        let date = new Date(mta_data[s]["Date"]);
        let day = date.getDay();
        if (day == 0 || day == 6) {
            let weekend_train = +mta_data[s]["Subways: Total Estimated Ridership"];
            let weekend_bus = +mta_data[s]["Buses: Total Estimated Ridership"];
            let weekend_train_diff = +weekend_train_avg - +weekend_train;
            let weekend_bus_diff = +weekend_bus_avg - +weekend_bus;

            let weekend_train_avg_diff = weekend_train_diff / weekend_train_avg;
            let weekend_bus_avg_diff = weekend_bus_diff / weekend_bus_avg;

            if (weekend_train_avg_diff_min == undefined || parseFloat(weekend_train_avg_diff) < parseFloat(weekend_train_avg_diff_min)) {
                weekend_train_avg_diff_min = weekend_train_avg_diff;
            }
            if (weekend_train_avg_diff_max == undefined || parseFloat(weekend_train_avg_diff) > parseFloat(weekend_train_avg_diff_max)) {
                weekend_train_avg_diff_max = weekend_train_avg_diff;
            }
            if (weekend_bus_avg_diff_min == undefined || parseFloat(weekend_bus_avg_diff) < parseFloat(weekend_bus_avg_diff_min)) {
                weekend_bus_avg_diff_min = weekend_bus_avg_diff;
            }
            if (weekend_bus_avg_diff_max == undefined || parseFloat(weekend_bus_avg_diff) > parseFloat(weekend_bus_avg_diff_max)) {
                weekend_bus_avg_diff_max = weekend_bus_avg_diff;
            }

        } else {
            let weekday_train = +mta_data[s]["Subways: Total Estimated Ridership"];
            let weekday_bus = +mta_data[s]["Buses: Total Estimated Ridership"];
            let weekday_train_diff = +weekday_train_avg - +weekday_train;
            let weekday_bus_diff = +weekday_bus_avg - +weekday_bus;

            let weekday_train_avg_diff = weekday_train_diff / weekday_train_avg;
            let weekday_bus_avg_diff = weekday_bus_diff / weekday_bus_avg;

            if (weekday_train_avg_diff_min == undefined || parseFloat(weekday_train_avg_diff) < parseFloat(weekday_train_avg_diff_min)) {
                weekday_train_avg_diff_min = weekday_train_avg_diff;
            }
            if (weekday_train_avg_diff_max == undefined || parseFloat(weekday_train_avg_diff) > parseFloat(weekday_train_avg_diff_max)) {
                weekday_train_avg_diff_max = weekday_train_avg_diff;
            }
            if (weekday_bus_avg_diff_min == undefined || parseFloat(weekday_bus_avg_diff) < parseFloat(weekday_bus_avg_diff_min)) {
                weekday_bus_avg_diff_min = weekday_bus_avg_diff;
            }
            if (weekday_bus_avg_diff_max == undefined || parseFloat(weekday_bus_avg_diff) > parseFloat(weekday_bus_avg_diff_max)) {
                weekday_bus_avg_diff_max = weekday_bus_avg_diff;
            }
        }
    }

    // temperature X scale
    var tempx = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(weather_data.map(function (d) {
            return to_slash_date(d.datetime)
        }));

    // temperature Y scale
    const tempy = d3.scaleLinear()
        .domain([temp_min, temp_max]).nice()
        .range([tempHeight - tempMargin.bottom, tempMargin.top]);

    const color = d3.scaleSequential(tempy.domain(), d3.interpolateRgbBasis(["#2D7BB6", "#09CCBC", "#FFFF8C", "#F9CF58", "#E76918", "#D7191D"]));
    var tooltip_info = d3.select("#tooltip-info");

    // append the svg object to the body of the page
    var dataviz_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", barWidth + barMargin.left + barMargin.right)
        .attr("height", barHeight + barMargin.top + barMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + parseFloat(parseFloat(barWidth / 2) + parseFloat(10)) + "," + parseFloat(parseFloat(barHeight / 2) + parseFloat(10)) + ")"); // Add 100 on Y translation, cause upper bars are longer

    // SET TRAIN X scale
    var train_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain(mta_data.map(function (d) { return d.Date; }));
    // SET TRAIN Y scale
    var train_y = d3.scaleRadial()
        .range([barInnerRadius, barOuterRadius])   // Domain will be define later.
        .domain([Math.min(parseFloat(weekend_train_avg_diff_min), parseFloat(weekday_train_avg_diff_min)) - .02, Math.max(parseFloat(weekend_train_avg_diff_max), parseFloat(weekday_train_avg_diff_max)) + .02]); // Domain of Y is from 0 to the max seen in the data

    function on_mouseover_train(that, d) {
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");
        let date = new Date(d["Date"]);
        let day = date.getDay();
        let x = d['Subways: Total Estimated Ridership'];
        let val = 0;
        let domain = train_y.domain();
        let weekday_or_end = "";
        let avg_diff_str = "";
        if (day == 0 || day == 6) {
            let avg_diff = (parseFloat(weekend_train_avg) - parseFloat(x)) / parseFloat(weekend_train_avg);
            val = avg_diff;
            weekday_or_end = "weekend";
            avg_diff_str += `${weekend_train_avg} ${weekday_or_end} avg riders. ${x} riders.`
        } else {
            let avg_diff = (parseFloat(weekday_train_avg) - parseFloat(x)) / parseFloat(weekday_train_avg);
            val = avg_diff;
            weekday_or_end = "weekday";
            avg_diff_str += `${weekend_train_avg} ${weekday_or_end} avg riders. ${x} riders.`
        }

        var tooltip_text = `<p> ${date.toDateString()}: ${val * 100}% difference from ${weekday_or_end} average.</p> <p>${avg_diff_str}</p>`;
        tooltip_info.html(tooltip_text);
    }

    function on_mouseover_temp(that, d) {
        let date = new Date(d.datetime);
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");

        let rain_vid = document.getElementById("rain-vid-container");
        let snow_vid = document.getElementById("snow-vid-container");
        let sun_vid = document.getElementById("sun-vid-container");
        let cloud_vid = document.getElementById("cloud-vid-container");
        let tooltip = document.getElementById("tooltip");
        tooltip.style.background = 'white'
        let precip_info = d.precip != 0 ? `<p>${d.preciptype}: ${d.precip} </p>` : ``;
        if (d.precip == 0) {
            rain_vid.style.display = 'none';
            snow_vid.style.display = 'none';
        }
        if (d.precip > 0) {
            turn_off_all_videos();
            if (d.preciptype.includes('snow')) {
                snow_vid.style.display = 'block';
            }
            if (d.preciptype.includes('rain')) {
                rain_vid.style.display = 'block';
            }
        }
        if (d.cloudcover < 55) {
            sun_vid.style.display = 'block';
        }
        if (d.cloudcover > 55) {
            cloud_vid.style.display = 'block';
        }
        const selected_temp_button = d3.select('.selected-temp');
        let temp = d.temp;
        let temp_unit = "celsius"
        if (selected_temp_button.attr("id") == "fahrenheit") {
            temp_unit = "fahrenheit"
            temp = c_to_f(temp);
        }
        tooltip_info.html(
            `<p>${date.toDateString()}: ${temp} ${temp_unit} </p>` + precip_info + `<p> cloud cover: ${d.cloudcover}</p>`
        );
    }

    function on_mouseover_bus(that, d) {
        let date = new Date(d["Date"]);
        let day = date.getDay();
        let x = d['Buses: Total Estimated Ridership'];
        let val = 0;
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");
        let weekday_or_end = ""
        let avg_diff_str = ""
        if (day == 0 || day == 6) {
            let avg_diff = parseFloat(parseFloat(x) - parseFloat(weekend_bus_avg)) / parseFloat(weekend_bus_avg);
            val = avg_diff;
            weekday_or_end = "weekend"
            avg_diff_str += `${weekend_bus_avg} ${weekday_or_end} avg riders. ${x} riders.`
        } else {
            let avg_diff = parseFloat(parseFloat(x) - parseFloat(weekday_bus_avg)) / parseFloat(weekday_bus_avg);
            val = avg_diff;
            weekday_or_end = "weekday"
            avg_diff_str += `${weekday_bus_avg} ${weekday_or_end} avg. ${x} riders.`
        }
        tooltip_info.html(`<p>${date.toDateString()}: ${val * 100}% difference from ${weekday_or_end} average</p> <p>${avg_diff_str}</p>`);
    }

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
                    let avg_diff = (parseFloat(weekend_train_avg) - parseFloat(x)) / parseFloat(weekend_train_avg);

                    if (avg_diff < 0) {
                        return barInnerRadius - (train_y(avg_diff) - barInnerRadius);
                    } else {
                        return train_y(avg_diff);
                    }
                } else {
                    let avg_diff = (parseFloat(weekday_train_avg) - parseFloat(x)) / parseFloat(weekday_train_avg);
                    if (avg_diff < 0) {
                        return barInnerRadius - (train_y(avg_diff) - barInnerRadius);
                    } else {
                        return train_y(avg_diff);
                    }
                }
            })
            .startAngle(function (d) { return train_x(d.Date); })
            .endAngle(function (d) { return train_x(d.Date) + train_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(83))
        .on('mouseover', function (event, d) {
            var that = this;
            on_mouseover_train(that, d);
        })
        .on('mouseout', function (event, d) {
            d3.select(this).style("stroke", "");
            d3.select(this).style("stroke-width", "");
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
            .startAngle(function (d) {
                let date = new Date(d.datetime);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                return tempx(`${month}/${day}/${year}`);
            })
            .endAngle(function (d) {
                let date = new Date(d.datetime);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                return tempx(`${month}/${day}/${year}`) + tempx.bandwidth();
            })
            .padAngle(0.05)
            .padRadius(-1)
        )
        .on('mouseover', function (event, d) {
            var that = this;
            on_mouseover_temp(that, d);
        })
        .on('mouseout', function (event, d) {
            tooltip.style.background = 'black'

            d3.select(this).style("stroke", "");
            d3.select(this).style("stroke-width", "");
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
        .domain([Math.min(weekday_bus_avg_diff_min, weekend_bus_avg_diff_min), Math.max(weekday_bus_avg_diff_max, weekend_bus_avg_diff_max)]); // Domain of Y is from 0 to the max seen in the data

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
                    let avg_diff = (parseFloat(weekend_bus_avg) - parseFloat(x)) / parseFloat(weekend_bus_avg);
                    if (avg_diff > 0) {
                        return busInnerRadius - (bus_y(avg_diff) - busInnerRadius);
                    } else {
                        return bus_y(avg_diff);
                    }
                } else {
                    let avg_diff = (parseFloat(weekday_bus_avg) - parseFloat(x)) / parseFloat(weekday_bus_avg);
                    if (avg_diff > 0) {
                        return busInnerRadius - (bus_y(avg_diff) - busInnerRadius);
                    } else {
                        return bus_y(avg_diff);
                    }
                }
            })
            .startAngle(function (d) { return bus_x(d.Date); })
            .endAngle(function (d) { return bus_x(d.Date) + bus_x.bandwidth(); })
            .padAngle(0.05)
            .padRadius(33))
        .on('mouseover', function (event, d) {
            var that = this;
            on_mouseover_bus(that, d)
        })
        .on('mouseout', function (event, d) {
            d3.select(this).style("stroke", "");
            d3.select(this).style("stroke-width", "");
        });

    var sun_button = document.getElementById('sun-button');
    var rain_button = document.getElementById('rain-button');
    var snow_button = document.getElementById('snow-button');
    var cloud_button = document.getElementById('cloud-button');
    var reset_button = document.getElementById('reset-button');

    var fahrenheit_button = document.getElementById('fahrenheit');
    var celsius_button = document.getElementById('celsius');

    const weather_info_default_html = "<p>Hover over a bar to see data for that day.</p>";

    var rainy_days = [];
    var snowy_days = [];
    var cloudy_days = [];
    var sunny_days = [];

    // Get weather data mins and maxes
    for (let s = 0; s < weather_data.length - 1; s++) {
        let precip = +weather_data[s].precip;
        let precip_type = weather_data[s].preciptype;
        let cloudcover = weather_data[s].cloudcover;
        let date = weather_data[s].datetime;

        if (precip_type.includes("rain")) {
            rainy_days.push(date)
        }
        if (precip_type.includes("snow")) {
            snowy_days.push(date)
        }
        if (cloudcover > 55) {
            cloudy_days.push(date)
        }
        if (cloudcover < 24) {
            sunny_days.push(date)
        }
    }

    // RAIN BUTTON
    rain_button.addEventListener("click", function (e) {
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var sun_vid = document.getElementById("sun-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");

        let snow_button = document.getElementById("snow-button");

        if (this.classList.contains('active')) { // then turn off
            this.classList.remove('active');
            this.classList.add('inactive');
            const nonrainy_temp_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !d.preciptype.includes("rain")).style('opacity', '1').attr("pointer-events", "all");

            const nonrainy_train_d = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_rainy = rainy_days.includes(`${year}-${month}-${day}`);
                return !is_rainy;
            }).style("opacity", 1);

            const nonrainy_bus_d = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_rainy = rainy_days.includes(`${year}-${month}-${day}`);
                return !is_rainy;
            }).style("opacity", 1);

            nonrainy_train_d.attr("pointer-events", "all");
            nonrainy_bus_d.attr("pointer-events", "all");

            rain_vid.style.display = 'none';
            return;
        } if (this.classList.contains('inactive')) {
            if (snow_button.classList.contains("inactive")) {
                snow_vid.style.display = 'none';
            }
            if (sun_button.classList.contains("inactive")) {
                sun_vid.style.display = 'none';
            }
            rain_vid.style.display = 'block';
            const nonrainy_temp_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !d.preciptype.includes("rain")).style('opacity', '.2').attr("pointer-events", "none");;

            const nonrainy_bus_d = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_rainy = rainy_days.includes(`${year}-${month}-${day}`);
                return !is_rainy;
            }).style("opacity", 0).attr("pointer-events", "none");

            const nonrainy_train_d = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_rainy = rainy_days.includes(`${year}-${month}-${day}`);
                return !is_rainy;
            }).style("opacity", 0).attr("pointer-events", "none");

            tooltip_info.innerHTML = `${weather_info_default_html}`;
            this.classList.remove('inactive');
            this.classList.add('active');

            return;
        }
    });

    // SNOW BUTTON
    snow_button.addEventListener("click", function (e) { // TURN OFF
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            const nonsnowy_temp_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !d.preciptype.includes("snow"))
                .style('opacity', '1')
                .attr("pointer-events", "all");;

            const nonsnowy_bus_d = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 1).attr("pointer-events", "all");

            const nonsnowy_train_d = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 1).attr("pointer-events", "all");

            snow_vid.style.display = 'none'
            tooltip.style.background = 'black';

            return;
        } if (this.classList.contains('inactive')) {
            this.classList.remove('inactive');
            this.classList.add('active');
            const nonsnowy_temp_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !d.preciptype.includes("snow"))
                .style('opacity', '.2')
                .attr("pointer-events", "none");;

            const nonsnowy_bus_d = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 0).attr("pointer-events", "none");

            const nonsnowy_train_d = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 0).attr("pointer-events", "none");

            tooltip_info.innerHTML = `${weather_info_default_html}`;
            snow_vid.style.display = 'block';
            tooltip.style.background = 'white';

            return;
        }
    });

    cloud_button.addEventListener("click", function (e) {
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");

        if (this.classList.contains('active')) { // then turn off
            this.classList.remove('active');
            this.classList.add('inactive');
            const nonsnowy_temp_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !d.preciptype.includes("snow"))
                .style('opacity', '1')
                .attr("pointer-events", "all");

            const nonsnowy_bus_d = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 1).attr("pointer-events", "all");

            const nonsnowy_train_d = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_snowy = snowy_days.includes(`${year}-${month}-${day}`);
                return !is_snowy;
            }).style("opacity", 1).attr("pointer-events", "all");

            cloud_vid.style.display = 'none'
            tooltip.style.background = 'black';

            return;
        } if (this.classList.contains('inactive')) {  // then turn on
            const disable_noncloudy_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !(d.cloudcover > 55))
                .style('opacity', '.2')
                .attr("pointer-events", "none");

            const disable_noncloudy_bus_days = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_cloudy = cloudy_days.includes(`${year}-${month}-${day}`);
                return !is_cloudy;
            }).style("opacity", 0).attr("pointer-events", "none");

            const disable_noncloudy_train_days = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_cloudy = cloudy_days.includes(`${year}-${month}-${day}`);
                return !is_cloudy;
            }).style("opacity", 0).attr("pointer-events", "none");

            tooltip_info.innerHTML = `<p>cloudy days:</p>${weather_info_default_html}`;
            this.classList.remove('inactive');
            this.classList.add('active');
            cloud_vid.style.display = 'block';
            tooltip.style.background = 'white';

            return;
        }
    });

    sun_button.addEventListener("click", function (e) {
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");
        var sun_vid = document.getElementById("sun-vid-container");

        if (this.classList.contains('active')) { // then turn off
            this.classList.remove('active');
            this.classList.add('inactive');
            const enable_nonsunny_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !(d.cloudcover < 24))
                .style('opacity', '1')
                .attr("pointer-events", "all");

            const enable_nonsunny_bus_days = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_sunny = sunny_days.includes(`${year}-${month}-${day}`);
                return !is_sunny;
            }).style("opacity", 1).attr("pointer-events", "all");

            const enable_nonsunny_train_days = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_sunny = sunny_days.includes(`${year}-${month}-${day}`);
                return !is_sunny;
            }).style("opacity", 1).attr("pointer-events", "all");

            sun_vid.style.display = 'none'

            return;
        } if (this.classList.contains('inactive')) {  // then turn on
            const disable_nonsunny_days = d3.selectAll(".temp-bar")
                .filter((d, i) => !(d.cloudcover < 24))
                .style('opacity', '.2')
                .attr("pointer-events", "none");

            const disable_nonsunny_bus_days = d3.selectAll(".bus-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_sunny = sunny_days.includes(`${year}-${month}-${day}`);
                return !is_sunny;
            }).style("opacity", 0).attr("pointer-events", "none");

            const disable_nonsunny_train_days = d3.selectAll(".train-bar").filter(function (d, i) {
                let date = new Date(d["Date"]);
                let day = ('0' + date.getDate()).slice(-2);
                let month = ('0' + (date.getMonth() + 1)).slice(-2);
                let year = date.getFullYear();
                let is_sunny = sunny_days.includes(`${year}-${month}-${day}`);
                return !is_sunny;
            }).style("opacity", 0).attr("pointer-events", "none");

            tooltip_info.innerHTML = `<p>cloudy days:</p>${weather_info_default_html}`;
            this.classList.remove('inactive');
            this.classList.add('active');
            sun_vid.style.display = 'block';

            return;
        }
    });

    reset_button.addEventListener("click", function (e) {
        e.preventDefault();

        d3.selectAll(".temp-bar").style('opacity', '1');
        d3.selectAll(".train-bar").style('opacity', '1');
        d3.selectAll(".bus-bar").style('opacity', '1');
        snow_button.classList.remove('active');
        snow_button.classList.add('inactive');
        rain_button.classList.remove('active');
        rain_button.classList.add('inactive');
        sun_button.classList.remove('active');
        sun_button.classList.add('inactive');
        cloud_button.classList.remove('active');
        cloud_button.classList.add('inactive');
        return;
    });

    // TEMP UNIT TOGGLE BUTTONS
    function toggle(context, old) {
        context.classList.add("selected-temp");
        document.getElementById(old).classList.remove("selected-temp");
        if (old == "celsius") {
            let old_left = $("#left").text()
            let old_right = $("#right").text()

            $("#left").text(c_to_f(old_left.substring(0, old_left.length - 1)) + '°')
            $("#right").text(c_to_f(old_right.substring(0, old_right.length - 1)) + '°')
        }
        if (old == "fahrenheit") {
            let old_left = $("#left").text()
            let old_right = $("#right").text()

            $("#left").text(f_to_c(old_left.substring(0, old_left.length - 1)) + '°')
            $("#right").text(f_to_c(old_right.substring(0, old_right.length - 1)) + '°')
        }

    }
    fahrenheit_button.addEventListener("click", function (e) {
        toggle(this, 'celsius')
    });
    celsius_button.addEventListener("click", function (e) {
        toggle(this, 'fahrenheit')
    });
}

export function onSlide(event, ui) {
    var out_of_range = d3.selectAll(".temp-bar")
        .filter((d, i) => d.tempmin < ui.values[0] || d.tempmin > ui.values[1])
            .style('opacity', '0')
            .attr("pointer-events", "none");
    var in_range = d3.selectAll(".temp-bar")
    .filter((d, i) => d.tempmin > ui.values[0] && d.tempmax < ui.values[1])
        .style('opacity', '1')
        .attr("pointer-events", "all");
    var out_of_range_dates = d3.selectAll(".temp-bar")
        .filter((d, i) => d.tempmin < ui.values[0] || d.tempmin > ui.values[1])
        ._groups[0].map(d=>to_slash_date(d.__data__.datetime))
    const out_of_range_train_bars = d3.selectAll(".train-bar")
        .filter((d, i) => out_of_range_dates.includes(d.Date))
        .style('opacity', '0')
        .attr("pointer-events", "none");
    const in_range_train_bars = d3.selectAll(".train-bar")
        .filter((d, i) => !out_of_range_dates.includes(d.Date))
        .style('opacity', '1')
        .attr("pointer-events", "all");
    const out_of_range_bus_bars = d3.selectAll(".bus-bar")
        .filter((d, i) => out_of_range_dates.includes(d.Date))
        .style('opacity', '0')
        .attr("pointer-events", "none");
    const in_range_bus_bars = d3.selectAll(".bus-bar")
        .filter((d, i) => !out_of_range_dates.includes(d.Date))
        .style('opacity', '1')
        .attr("pointer-events", "all");

    console.log(out_of_range_train_bars)
    console.log(out_of_range_dates)
}
