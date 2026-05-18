
import * as d3 from "npm:d3@7/+esm";

let jQueryLoadPromise = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
            if (existing.dataset.loaded === "true") resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        }, { once: true });
        script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        document.head.appendChild(script);
    });
}

export function ensureJQuery() {
    if (globalThis.jQuery?.fn?.slider) {
        return Promise.resolve(globalThis.jQuery);
    }
    if (!jQueryLoadPromise) {
        jQueryLoadPromise = (async () => {
            await loadScript("https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js");
            await loadScript("https://cdn.jsdelivr.net/npm/jquery-ui@1.14.2/dist/jquery-ui.min.js");
            const jq = globalThis.jQuery;
            if (!jq?.fn?.slider) {
                throw new Error("jQuery UI slider plugin failed to load.");
            }
            if (typeof globalThis.window !== "undefined") {
                globalThis.window.jQuery = jq;
                globalThis.window.$ = jq;
            }
            return jq;
        })();
    }
    return jQueryLoadPromise;
}

function $(...args) {
    return globalThis.jQuery(...args);
}

let chartAbortController = null;
const CENTER_CIRCLE_BG = "#14171F";

export let tempSliderBounds = { min: -14.2, max: 33.7 };

const INACTIVE_BAR_FILL = "#EAEBEF";
let applyChartFiltersImpl = null;

function rememberBarFill(el) {
    const fill = el.attr("fill");
    if (fill && fill !== INACTIVE_BAR_FILL) {
        el.attr("data-active-fill", fill);
    }
}

export function setBarActive(el) {
    const activeFill = el.attr("data-active-fill");
    if (activeFill) el.attr("fill", activeFill);
    el.style("opacity", 1).attr("pointer-events", "all");
}

export function setBarInactive(el) {
    rememberBarFill(el);
    el.attr("fill", INACTIVE_BAR_FILL).style("opacity", 1).attr("pointer-events", "none");
}

export function restoreAllBars() {
    d3.selectAll(".temp-bar, .train-bar, .bus-bar").each(function () {
        setBarActive(d3.select(this));
    });
    const trainViz = document.getElementById("train-svg-g");
    const busViz = document.getElementById("bus-svg-g");
    if (trainViz) trainViz.style.opacity = 1;
    if (busViz) busViz.style.opacity = 1;
}

function getTransportFilterMode() {
    const busButton = document.getElementById("bus-button");
    const trainButton = document.getElementById("train-button");
    if (busButton?.classList.contains("inactive")) return "train";
    if (trainButton?.classList.contains("inactive")) return "bus";
    return "both";
}

export function setTransportFilter(mode) {
    const busButton = document.getElementById("bus-button");
    const trainButton = document.getElementById("train-button");
    const trainViz = document.getElementById("train-svg-g");
    const busViz = document.getElementById("bus-svg-g");
    if (!busButton || !trainButton) return;

    busButton.classList.toggle("active", mode === "both" || mode === "bus");
    busButton.classList.toggle("inactive", mode === "train");
    trainButton.classList.toggle("active", mode === "both" || mode === "train");
    trainButton.classList.toggle("inactive", mode === "bus");

    if (trainViz) trainViz.style.opacity = 1;
    if (busViz) busViz.style.opacity = 1;

    if (applyChartFiltersImpl) applyChartFiltersImpl();
}

export function initTransportFilters(signal) {
    const busButton = document.getElementById("bus-button");
    const trainButton = document.getElementById("train-button");
    if (!busButton || !trainButton) return;

    busButton.addEventListener("click", function (e) {
        e.preventDefault();
        const mode = getTransportFilterMode();
        setTransportFilter(mode === "bus" ? "both" : "bus");
    }, { signal });

    trainButton.addEventListener("click", function (e) {
        e.preventDefault();
        const mode = getTransportFilterMode();
        setTransportFilter(mode === "train" ? "both" : "train");
    }, { signal });

    setTransportFilter("both");
}

export function isTempFahrenheit() {
    const selected = document.querySelector(".selected-temp");
    return selected?.id === "fahrenheit";
}

export function formatTempForDisplay(celsius) {
    const value = isTempFahrenheit() ? c_to_f(celsius) : celsius;
    return String(Number(value.toPrecision(4)));
}

export function parseTempFromDisplay(value) {
    const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ""));
    if (Number.isNaN(parsed)) return null;
    return isTempFahrenheit() ? f_to_c(parsed) : parsed;
}

export function syncTempInputsFromSlider(valuesC) {
    const minEl = document.getElementById("temp-range-min");
    const maxEl = document.getElementById("temp-range-max");
    if (!minEl || !maxEl) return;
    minEl.value = formatTempForDisplay(valuesC[0]);
    maxEl.value = formatTempForDisplay(valuesC[1]);
}

export function updateSliderTrackLabels(valuesC) {
    const slider = $("#slider");
    const labels = $("#slider-labels");
    if (!slider.length || !slider.hasClass("ui-slider") || !labels.length) return;
    $("#left").remove();
    $("#right").remove();
    const min = slider.slider("option", "min");
    const max = slider.slider("option", "max");
    const left_val = isTempFahrenheit() ? c_to_f(valuesC[0]) : valuesC[0];
    const right_val = isTempFahrenheit() ? c_to_f(valuesC[1]) : valuesC[1];
    const range = max - min;
    const left_pos = range ? (valuesC[0] - min) / range : 0;
    const right_pos = range ? (valuesC[1] - min) / range : 1;
    const left_ele = $('<label id="left">' + left_val + '°</label>').css({
        left: `${left_pos * 100}%`,
    });
    const right_ele = $('<label id="right">' + right_val + '°</label>').css({
        left: `${right_pos * 100}%`,
    });
    labels.append(left_ele);
    labels.append(right_ele);
}

export function initTempRangeSlider(signal) {
    const slider = $("#slider");
    const minInput = document.getElementById("temp-range-min");
    const maxInput = document.getElementById("temp-range-max");
    if (!slider.length || !minInput || !maxInput) return;

    const { min, max } = tempSliderBounds;

    if (slider.hasClass("ui-slider")) {
        slider.slider("destroy");
    }

    slider.slider({
        range: true,
        min,
        max,
        values: [min, max],
        slide(event, ui) {
            syncTempInputsFromSlider(ui.values);
            updateSliderTrackLabels(ui.values);
            onSlide(event, ui, ui.values);
        },
        change(event, ui) {
            syncTempInputsFromSlider(ui.values);
            updateSliderTrackLabels(ui.values);
            onSlide(event, ui, ui.values);
        },
    });

    const applyFromInputs = () => {
        let minC = parseTempFromDisplay(minInput.value);
        let maxC = parseTempFromDisplay(maxInput.value);
        if (minC === null || maxC === null) {
            syncTempInputsFromSlider(slider.slider("values"));
            return;
        }
        minC = Math.max(min, Math.min(max, minC));
        maxC = Math.max(min, Math.min(max, maxC));
        if (minC > maxC) {
            [minC, maxC] = [maxC, minC];
        }
        slider.slider("values", [minC, maxC]);
        syncTempInputsFromSlider([minC, maxC]);
        updateSliderTrackLabels([minC, maxC]);
        onSlide(null, null, [minC, maxC]);
    };

    syncTempInputsFromSlider([min, max]);
    updateSliderTrackLabels([min, max]);
    onSlide(null, null, [min, max]);

    minInput.addEventListener("change", applyFromInputs, { signal });
    maxInput.addEventListener("change", applyFromInputs, { signal });
    minInput.addEventListener("blur", applyFromInputs, { signal });
    maxInput.addEventListener("blur", applyFromInputs, { signal });
    minInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyFromInputs();
            minInput.blur();
        }
    }, { signal });
    maxInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyFromInputs();
            maxInput.blur();
        }
    }, { signal });
}

export function c_to_f(deg) {
    let res = (deg * (9 / 5)) + 32;

    return Number(res.toPrecision(3))
}
export function f_to_c(deg) {
    let res = (deg - 32) * (5 / 9)
    return Number(res.toPrecision(3))
}
function to_slash_date(d) {
    let date = new Date(d);
    let day = ('0' + date.getDate()).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    return `${month}/${day}/${year}`
}
function to_dash_date(d) {
    let date = new Date(d);
    let day = ('0' + date.getDate()).slice(-2);
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    return `${year}-${month}-${day}`
}
export async function chart(weather_data, mta_data) {
    await ensureJQuery();
    d3.select("#my_dataviz").selectAll("*").remove();

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

    function set_tooltip_background() {
        const tooltip = document.getElementById("tooltip");
        const wrapper = document.getElementById("tooltip-wrapper");
        tooltip.style.backgroundColor = "transparent";
        wrapper.style.backgroundColor = CENTER_CIRCLE_BG;
    }

    function format_tooltip_date(date) {
        return `<p class="tooltip-date">${date.toDateString()}</p>`;
    }

    function format_tooltip_line(label, value) {
        return `<p><span class="tooltip-label">${label}</span> ${value}</p>`;
    }

    function format_tooltip_riders(value) {
        const display = value.toString().match(/^-?\d+(?:\.\d{0,2})?/)?.[0] ?? value;
        return `<p>${display} riders</p>`;
    }

    function show_weather_media(d) {
        turn_off_all_videos();
        let hasVideo = false;
        const rain_vid = document.getElementById("rain-vid-container");
        const snow_vid = document.getElementById("snow-vid-container");
        const sun_vid = document.getElementById("sun-vid-container");
        const cloud_vid = document.getElementById("cloud-vid-container");
        const precip_type = d.preciptype ?? "";

        if (d.precip > 0) {
            if (precip_type.includes("snow")) {
                snow_vid.style.display = "block";
                hasVideo = true;
            }
            if (precip_type.includes("rain")) {
                rain_vid.style.display = "block";
                hasVideo = true;
            }
        }
        if (d.cloudcover < 55) {
            sun_vid.style.display = "block";
            hasVideo = true;
        } else if (d.cloudcover > 55) {
            cloud_vid.style.display = "block";
            hasVideo = true;
        }

        set_tooltip_background();
        return hasVideo;
    }

    // Fixed coordinate space; SVG viewBox scales chart with the container on resize.
    const chartSize = 1000;
    const chartCenter = chartSize / 2;

    var tempMargin = { top: 10, right: 10, bottom: 10, left: 10 },
        tempWidth = 500 - tempMargin.left - tempMargin.right,
        tempHeight = 500 - tempMargin.top - tempMargin.bottom,
        barInnerRadius = chartSize * .4,
        barOuterRadius = chartSize * .454,
        tempInnerRadius = chartSize * .269,
        tempOuterRadius = chartSize * .329,
        busInnerRadius = chartSize * .215,
        busOuterRadius = chartSize * .255;

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

    tempSliderBounds = { min: tempmin_min, max: tempmax_max };
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
        .attr("viewBox", `0 0 ${chartSize} ${chartSize}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%")
        .append("g")
        .attr("transform", `translate(${chartCenter},${chartCenter})`);

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
        turn_off_all_videos();
        set_tooltip_background();
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");
        let date = new Date(d["Date"]);
        let day = date.getDay();
        let x = d['Subways: Total Estimated Ridership'];
        let val = 0;
        let weekday_or_end = "";
        let avg_riders;
        if (day == 0 || day == 6) {
            let avg_diff = (parseFloat(weekend_train_avg) - parseFloat(x)) / parseFloat(weekend_train_avg);
            val = avg_diff;
            weekday_or_end = "weekend";
            avg_riders = weekend_train_avg;
        } else {
            let avg_diff = (parseFloat(weekday_train_avg) - parseFloat(x)) / parseFloat(weekday_train_avg);
            val = avg_diff;
            weekday_or_end = "weekday";
            avg_riders = weekday_train_avg;
        }

        const pct = (val * 100).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        const avg_display = avg_riders.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        tooltip_info.html(
            format_tooltip_date(date)
            + `<p>${pct}% difference from ${weekday_or_end} average</p>`
            + format_tooltip_line(`${weekday_or_end} avg riders`, avg_display)
            + format_tooltip_riders(x)
        );
    }

    function on_mouseover_temp(that, d) {
        let date = new Date(d.datetime);
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");

        show_weather_media(d);
        const selected_temp_button = d3.select('.selected-temp');
        let temp = d.temp;
        let temp_unit = "°C";
        if (selected_temp_button.attr("id") == "fahrenheit") {
            temp_unit = "°F";
            temp = c_to_f(temp);
        }
        let weather_html = format_tooltip_date(date)
            + `<p class="tooltip-temp">${temp}${temp_unit}</p>`;
        if (d.precip != 0) {
            weather_html += format_tooltip_line(d.preciptype, d.precip);
        }
        weather_html += format_tooltip_line("cloud cover", d.cloudcover);
        tooltip_info.html(weather_html);
    }

    function on_mouseover_bus(that, d) {
        turn_off_all_videos();
        set_tooltip_background();
        let date = new Date(d["Date"]);
        let day = date.getDay();
        let x = d['Buses: Total Estimated Ridership'];
        let val = 0;
        d3.select(that).style("stroke", "white");
        d3.select(that).style("stroke-width", "2px");
        let weekday_or_end = "";
        let avg_riders;
        if (day == 0 || day == 6) {
            let avg_diff = parseFloat(parseFloat(x) - parseFloat(weekend_bus_avg)) / parseFloat(weekend_bus_avg);
            val = avg_diff;
            weekday_or_end = "weekend";
            avg_riders = weekend_bus_avg;
        } else {
            let avg_diff = parseFloat(parseFloat(x) - parseFloat(weekday_bus_avg)) / parseFloat(weekday_bus_avg);
            val = avg_diff;
            weekday_or_end = "weekday";
            avg_riders = weekday_bus_avg;
        }
        const pct = (val * 100).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        const avg_display = avg_riders.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        tooltip_info.html(
            format_tooltip_date(date)
            + `<p>${pct}% difference from ${weekday_or_end} average</p>`
            + format_tooltip_line(`${weekday_or_end} avg riders`, avg_display)
            + format_tooltip_riders(x)
        );
    }

    // ADD TRAIN SVG
    dataviz_svg.append("g")
        .attr("id", "train-svg-g")
        .attr("class", "train-ring")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("class", "train-bar")
        .attr("fill", "#0038A4")
        .attr("data-active-fill", "#0038A4")
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
                return tempx(to_slash_date(d.datetime))
            })
            .endAngle(function (d) {
                return tempx(to_slash_date(d.datetime)) + tempx.bandwidth();
            })
            .padAngle(0.05)
            .padRadius(-1)
        )
        .on('mouseover', function (event, d) {
            var that = this;
            on_mouseover_temp(that, d);
        })
        .on('mouseout', function (event, d) {
            set_tooltip_background();
            turn_off_all_videos();
            tooltip_info.html(tooltip_idle_html);

            d3.select(this).style("stroke", "");
            d3.select(this).style("stroke-width", "");
        })
        .each(function (d) {
            const fill = color(d.temp);
            d3.select(this).attr("fill", fill).attr("data-active-fill", fill);
        });

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
        .attr("class", "bus-ring")
        .selectAll("path")
        .data(mta_data)
        .enter()
        .append("path")
        .attr("class", "bus-bar")
        .attr("fill", "#6DBF45")
        .attr("data-active-fill", "#6DBF45")
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

    function getFirstDaysOfYear(year) {
        const firstDays = [];

        for (let month = 0; month < 12; month++) {
            firstDays.push(new Date(year, month, 1));
        }

        return firstDays;
    }

    // Example usage:
    const firstDaysOf2023 = getFirstDaysOfYear(2023);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    // month labels
    dataviz_svg.append("g")
        .selectAll("g")
        .data(weather_data)
        .enter()
        .append("g")
        .attr("text-anchor", function (d) {
            return (tempx(to_slash_date(d.datetime)) + tempx.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI;
        })
        .attr("transform", function (d) {
            return "rotate(" + ((tempx(to_slash_date(d.datetime)) + tempx.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (tempInnerRadius-20) + ",0)";
        })
        .append("text")
        .text(function (d) {
            if (firstDaysOf2023.find(item => {return to_dash_date(item) == d.datetime})) {
                return (monthNames[new Date(d.datetime).getMonth()])
            }
        })
        .attr("transform", function (d) {
            return (tempx(d.datetime) + tempx.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(90)" ;
        })
        .style("font-size", "11px")
        .style("font-family", "Roboto Mono, monospace")
        .attr("alignment-baseline", "middle");

    var sun_button = document.getElementById('sun-button');
    var rain_button = document.getElementById('rain-button');
    var snow_button = document.getElementById('snow-button');
    var cloud_button = document.getElementById('cloud-button');
    var reset_button = document.getElementById('reset-button');

    var fahrenheit_button = document.getElementById('fahrenheit');
    var celsius_button = document.getElementById('celsius');

    const tooltip_idle_html = "<p>Hover over a bar in the chart to display info for that day</p>";

    function format_filter_days_header(label) {
        return `<p class="tooltip-filter-days">${label}</p>`;
    }

    function syncFilterTooltipHeader() {
        const el = document.getElementById("tooltip-info");
        if (!el) return;
        if (rain_button.classList.contains("active")) {
            el.innerHTML = format_filter_days_header("rainy days") + tooltip_idle_html;
        } else if (snow_button.classList.contains("active")) {
            el.innerHTML = format_filter_days_header("snowy days") + tooltip_idle_html;
        } else if (cloud_button.classList.contains("active")) {
            el.innerHTML = format_filter_days_header("cloudy days") + tooltip_idle_html;
        } else if (sun_button.classList.contains("active")) {
            el.innerHTML = format_filter_days_header("sunny days") + tooltip_idle_html;
        } else {
            el.innerHTML = tooltip_idle_html;
        }
    }

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

        if (String(precip_type).includes("rain")) {
            rainy_days.push(date)
        }
        if (String(precip_type).includes("snow")) {
            snowy_days.push(date)
        }
        if (cloudcover > 55) {
            cloudy_days.push(date)
        }
        if (cloudcover < 24) {
            sunny_days.push(date)
        }
    }

    const weatherBySlashDate = new Map(
        weather_data.map((w) => [to_slash_date(w.datetime), w])
    );

    function mtaDateToKey(d) {
        const date = new Date(d.Date);
        const day = ("0" + date.getDate()).slice(-2);
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    applyChartFiltersImpl = function applyChartFilters() {
        const { min, max } = tempSliderBounds;
        const slider = $("#slider");
        const values = slider.hasClass("ui-slider") ? slider.slider("values") : [min, max];
        const minT = +values[0];
        const maxT = +values[1];
        const tempFiltering = minT > min + 0.001 || maxT < max - 0.001;
        const transportMode = getTransportFilterMode();

        d3.selectAll(".temp-bar").each(function (d) {
            let active = true;
            if (tempFiltering && !dayInTempRange(d, minT, maxT)) active = false;
            if (rain_button.classList.contains("active") && !String(d.preciptype).includes("rain")) active = false;
            if (snow_button.classList.contains("active") && !String(d.preciptype).includes("snow")) active = false;
            if (cloud_button.classList.contains("active") && !(+d.cloudcover > 55)) active = false;
            if (sun_button.classList.contains("active") && !(+d.cloudcover < 24)) active = false;
            const el = d3.select(this);
            if (active) setBarActive(el);
            else setBarInactive(el);
        });

        d3.selectAll(".train-bar").each(function (d) {
            let active = true;
            const dateKey = mtaDateToKey(d);
            const weather = weatherBySlashDate.get(d.Date);
            if (tempFiltering && weather && !dayInTempRange(weather, minT, maxT)) active = false;
            if (rain_button.classList.contains("active") && !rainy_days.includes(dateKey)) active = false;
            if (snow_button.classList.contains("active") && !snowy_days.includes(dateKey)) active = false;
            if (cloud_button.classList.contains("active") && !cloudy_days.includes(dateKey)) active = false;
            if (sun_button.classList.contains("active") && !sunny_days.includes(dateKey)) active = false;
            if (transportMode === "bus") active = false;
            const el = d3.select(this);
            if (active) setBarActive(el);
            else setBarInactive(el);
        });

        d3.selectAll(".bus-bar").each(function (d) {
            let active = true;
            const dateKey = mtaDateToKey(d);
            const weather = weatherBySlashDate.get(d.Date);
            if (tempFiltering && weather && !dayInTempRange(weather, minT, maxT)) active = false;
            if (rain_button.classList.contains("active") && !rainy_days.includes(dateKey)) active = false;
            if (snow_button.classList.contains("active") && !snowy_days.includes(dateKey)) active = false;
            if (cloud_button.classList.contains("active") && !cloudy_days.includes(dateKey)) active = false;
            if (sun_button.classList.contains("active") && !sunny_days.includes(dateKey)) active = false;
            if (transportMode === "train") active = false;
            const el = d3.select(this);
            if (active) setBarActive(el);
            else setBarInactive(el);
        });
    };

    if (chartAbortController) chartAbortController.abort();
    chartAbortController = new AbortController();
    const { signal } = chartAbortController;

    initTransportFilters(signal);
    initTempRangeSlider(signal);

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

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            rain_vid.style.display = 'none';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
        if (this.classList.contains('inactive')) {
            if (snow_button.classList.contains("inactive")) {
                snow_vid.style.display = 'none';
            }
            if (sun_button.classList.contains("inactive")) {
                sun_vid.style.display = 'none';
            }
            rain_vid.style.display = 'block';
            set_tooltip_background();
            this.classList.remove('inactive');
            this.classList.add('active');
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
    }, { signal });

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
            snow_vid.style.display = 'none';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
        if (this.classList.contains('inactive')) {
            this.classList.remove('inactive');
            this.classList.add('active');
            snow_vid.style.display = 'block';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
    }, { signal });

    cloud_button.addEventListener("click", function (e) {
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            cloud_vid.style.display = 'none';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
        if (this.classList.contains('inactive')) {
            this.classList.remove('inactive');
            this.classList.add('active');
            cloud_vid.style.display = 'block';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
    }, { signal });

    sun_button.addEventListener("click", function (e) {
        e.preventDefault();
        var tooltip = document.getElementById("tooltip");
        var tooltip_info = document.getElementById("tooltip-info");
        var rain_vid = document.getElementById("rain-vid-container");
        var snow_vid = document.getElementById("snow-vid-container");
        var cloud_vid = document.getElementById("cloud-vid-container");
        var sun_vid = document.getElementById("sun-vid-container");

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            this.classList.add('inactive');
            sun_vid.style.display = 'none';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
        if (this.classList.contains('inactive')) {
            this.classList.remove('inactive');
            this.classList.add('active');
            sun_vid.style.display = 'block';
            set_tooltip_background();
            syncFilterTooltipHeader();
            applyChartFiltersImpl();
            return;
        }
    }, { signal });

    function flashResetButton(button) {
        button.classList.remove("reset-pressed");
        void button.offsetWidth;
        button.classList.add("reset-pressed");
        const onEnd = () => {
            button.classList.remove("reset-pressed");
            button.removeEventListener("animationend", onEnd);
        };
        button.addEventListener("animationend", onEnd);
    }

    reset_button.addEventListener("click", function (e) {
        e.preventDefault();
        flashResetButton(reset_button);

        turn_off_all_videos();
        set_tooltip_background();
        setTransportFilter("both");
        snow_button.classList.remove('active');
        snow_button.classList.add('inactive');
        rain_button.classList.remove('active');
        rain_button.classList.add('inactive');
        sun_button.classList.remove('active');
        sun_button.classList.add('inactive');
        cloud_button.classList.remove('active');
        cloud_button.classList.add('inactive');
        syncFilterTooltipHeader();

        const { min, max } = tempSliderBounds;
        const slider = $("#slider");
        if (slider.hasClass("ui-slider")) {
            slider.slider("values", [min, max]);
            syncTempInputsFromSlider([min, max]);
            updateSliderTrackLabels([min, max]);
            onSlide(null, null, [min, max]);
        }
        return;
    }, { signal });

    // TEMP UNIT TOGGLE BUTTONS
    function toggle(context, old) {
        context.classList.add("selected-temp");
        document.getElementById(old).classList.remove("selected-temp");
        const values = $("#slider").slider("values");
        syncTempInputsFromSlider(values);
        updateSliderTrackLabels(values);
    }
    fahrenheit_button.addEventListener("click", function (e) {
        toggle(this, 'celsius')
    }, { signal });
    celsius_button.addEventListener("click", function (e) {
        toggle(this, 'fahrenheit')
    }, { signal });
}

function dayInTempRange(d, minT, maxT) {
    return +d.tempmax >= minT && +d.tempmin <= maxT;
}

export function onSlide(event, ui, values) {
    if (applyChartFiltersImpl) applyChartFiltersImpl();
}
