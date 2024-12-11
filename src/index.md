<link rel="stylesheet" href="./jquery-ui.css" type="text/css">

<link rel="stylesheet" href="npm:jquery-ui/dist/themes/base/jquery-ui.css">

```js
const $ = self.jQuery = (await import("npm:jquery/dist/jquery.js/+esm")).default;
await import("npm:jquery-ui/dist/jquery-ui.js/+esm");
```

<nav id="left-panel" class="mta-sidebar">
    <ol id="" class="sidebar-contents">
        <li id="splash-title" class="">
            <h1>
            <p id="year-of-text">A Year of</p> 
            <p id="mta-transit-text">MTA Transit</p>
            </h1>
        </li>
        <li id="subtitle" class="">
        How did weather affect ridership for trains and buses in 2023?
        </li>
        <li id="blurb" class="">
        This infographic shows the MTA’s daily public transportation ridership as the percentage change from average (calculated for both weekdays and weekends). Explore how weather impacts ridership using the filters below.
        </li>
        <li id="temps">
            <div id="temp-filter">
                <div id="temp-filter-title">
                    <div id="temp-unit-selector">
                        <label for="temp-range" id="temp-label">Temperature Range:</label>
                        <div id="temp-toggle">
                            <div class="temp-unit-button" id="fahrenheit">°F</div>
                            <div class="temp-unit-button selected-temp" id="celsius">°C</div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="temp-range-container">
                <div id="temp-range-inputs">
                    <p>
                        <input class="temp-range-input" type="text" id="temp-range-min" readonly="" style="border:0; color:white; font-weight:bold;" placeholder="Min">
                    </p>
                    <p>
                        <input class="temp-range-input" type="text" id="temp-range-max" readonly="" style="border:0; color:white; font-weight:bold;" placeholder="Max">
                    </p>
                </div>
                <div class="slider-container">
                    <div style="max-width: 320px;" id="slider"></div>
                </div>
            </div>
        </li>
        <li id="filters-groups">
            <div id="filters-title" class="">Filters</div>
            <ol id="transport-icon-list">
                <li class="icon-li" id="bus-button"><img src="./icons/icons_bus.svg"/></li>
                <li class="icon-li" id="train-button"><img src="./icons/icons_train.svg"/></li>
            </ol> 
            <ol id="weather-icon-list">
                <li class="icon-li inactive" id="rain-button"><img src="./icons/icons_rain.svg"/></li>
                <li class="icon-li inactive" id="sun-button"><img src="./icons/icons_sun.svg"/></li>
                <li class="icon-li inactive" id="snow-button"><img src="./icons/icons_snow.svg"/></li>
                <li class="icon-li inactive" id="cloud-button"><img src="./icons/icons_cloudy.svg"/></li>
            </ol>
            <ol id="buttons-list">
                <li id="reset-button" class="button"><p>Reset</p></li>
            </ol>
        </li>
    </ol>
</nav>

<div id="container">
    <div id="legend"><img src="assets/Legend.png"/></div>
    <div id="tooltip-wrapper">
            <div id="tooltip">
                <div id="tooltip-info">
                    <p> Hover over a bar in the chart to display info for that day </p>
                </div>
                <div id="rain-vid-container">
                    <video autoplay muted loop>
                        <source src="assets/rain.mp4" type="video/mp4">
                    </video>
                </div>
                <div id="snow-vid-container">
                    <video autoplay muted loop>
                        <source src="assets/snow.mp4" type="video/mp4">
                    </video>
                </div>
                <div id="sun-vid-container">
                    <video autoplay muted loop>
                        <source src="assets/sun.mp4" type="video/mp4">
                    </video>
                </div>
                <div id="cloud-vid-container">
                    <video autoplay muted loop>
                        <source src="assets/cloud.mp4" type="video/mp4">
                    </video>
                </div>
            </div>
        </div>
    <div id="my_dataviz">
    </div>
</div>

```js
import {chart} from "./components/mta.js";
import {onSlide} from "./components/mta.js";
import {c_to_f, f_to_c} from "./components/mta.js";

const mta_data = await FileAttachment("./data/MTA_Daily_Ridership_Data__Beginning_2020_20240930.csv").csv();
const weather_data = await FileAttachment("./data/new york city 2023-01-01 to 2023-12-31.csv").csv();

chart(weather_data, mta_data)

var bus_button = document.getElementById('bus-button');

bus_button.addEventListener("click", function(e) {
    e.preventDefault();
    console.log("toggle");
    var train_viz = document.getElementById('train-svg-g');
    var opacity = window.getComputedStyle(train_viz).getPropertyValue("opacity");
    console.log(opacity);
    if (opacity == .2) {
        train_viz.style.opacity = 1;
        bus_button.style.backgroundColor = "black";
    } else {
        train_viz.style.opacity = .2;
        bus_button.style.backgroundColor = "#2F2F3A";
    }
});

var train_button = document.getElementById('train-button');

train_button.addEventListener("click", function(e) {
    e.preventDefault();
    console.log("toggle");
    var bus_viz = document.getElementById('bus-svg-g');
    var opacity = window.getComputedStyle(bus_viz).getPropertyValue("opacity");
    console.log(opacity);
    if (opacity == .2) {
        bus_viz.style.opacity = 1;
        train_button.style.backgroundColor = "black";
    } else {
        bus_viz.style.opacity = .2;
        train_button.style.backgroundColor = "#2F2F3A";
    }
});

const slider = $("#slider");
slider.slider({
    range: true,
    min: -14.2,
    max: 33.7,
    values: [-14.2, 33.7],
    slide: function(event, ui) {
        var opt = $(this).data().uiSlider.options;
        $("#left").remove();
        $("#right").remove();
        var left_val = opt.values[0];
        var left_pos = left_val/(Math.abs(opt.min) + opt.max);
        var right_val = opt.values[1];
        var right_pos = right_val/(Math.abs(opt.min) + opt.max);

        const selected_temp_button = $('.selected-temp');
        if (selected_temp_button.attr("id") == "fahrenheit") {
            left_val = c_to_f(left_val)
            right_val = c_to_f(right_val)
        }

        var left_ele = $('<label id="left">' + (left_val) + '°</label>').css('left', left_pos*100+29 + '%');
        var right_ele = $('<label id="right">' + (right_val) + '°</label>').css('left',  + (right_pos*100)+29 + '%');
        $("#slider").append(left_ele);
        $("#slider").append(right_ele);
        console.log(opt.values)
        onSlide(event, ui, opt.values);
    } // report changed value
})
$(
    function () {
        $('#slider').data("uiSlider")._slide();
    }
)
```

<style>
#year-of-text {
    font-size: 2vw;
    margin-bottom: 5px;
    margin-top: 5px;
}
#mta-transit-text {
    font-size: 2vw;
    margin-top: 5px;
}
#filters-groups div {
    padding-bottom: 25px;
    padding-top: 0px;
}
#filters-groups ol {
    padding-bottom: 5px;
    padding-top: 10px;
}
#filters-title {
    border-bottom: solid;
    font-size: .8vw;
    padding-bottom: 5px !important;
}
#buttons-list {
    display: flex;
    flex-flow: row;
    justify-content: space-evenly;
    padding: 0px;
}
.button {
    border-radius: 25px;
    width: 75px;
    height: 45px;
    border: solid;
    text-align: center;
    padding-bottom: 0px;
}
#transport-icon-list, #weather-icon-list {
    display: flex;
    flex-flow: row;
    justify-content: space-evenly;
    padding-left: 0px;
    gap: 25px;
}
#weather-icon-list {
    border-bottom: solid;
    padding-bottom: 10px !important;
}
.sidebar-contents {
    margin-top: 0px;
    padding-left: 0px;
    width: 100%;
    height: 100%;
    max-height: 100%;
    position: relative;
}
#transport-icon-list li {
    padding: 10px;
    width: 50px;
}
#transport-icon-list li img {
    max-width: 30px;
}
.icon-li {
    width: 40px;
    border-radius: 25px;
    border: 2px solid;
    display: flex;
    align-items: center;
    align-content: center;
    justify-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;
}
#subtitle {
    font-size: 1vw;
}
#reset-button p{
    margin: 0px;
    text-align: center;
}
#reset-button {
      display: flex;
    align-items: center;
    justify-items: center;
    align-content: center;
    justify-content: center;
}
#left-panel {
    font-family: "Roboto Mono", monospace;
    height: 100%;
    overflow: hidden;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 8rem;
  text-wrap: balance;
  text-align: center;
}
#blurb {
    font-size: .7vw;
}
.mta-sidebar {
    display: flex;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    background: black;
    width: 21.75vw;
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    padding: 40px;
    padding-left: 20px;
    padding-right: 20px;
}
li {
    list-style: none;
    padding-bottom: 15px;
}
#splash-title {
    height: 11vh;
}
#splash-title h1 {
    font-size: 35px;
}
#observablehq-center {
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: 0px;
    background-color: white;
    padding-right: 0px;
    overflow: hidden;
}
#observablehq-footer {
    display: none;
}
#bus_dataviz {
    position: absolute;
}
#train_dataviz {
    position: absolute;
}
#temp_dataviz {
    position: absolute;
}
#my_dataviz {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    width: 100%;
    height: 100%;
    display: block;
    margin: auto;
    text-align: center;
}
#container {
    max-width: 78.25vw;
    position: absolute;
    width: 78.25vw;
    height: 100vh;
    transform: translate(21.75vw, 0);
    text-align: center;
}
#observablehq-main {
    min-width: 100vw;
    margin-top: 0px;
    margin: 0;
    padding: 0;
    padding-right: 0 !important;
    margin-bottom: 0px;
    height: 100%;
    min-height: 100%;
}
#observablehq-center {
    margin-right: 0px;
    max-width: 100vw;
    height: 100%;
}
#tooltip-wrapper {
    position: absolute;
    box-sizing: border-box;
    height: 29.5vh;
    width: 29.5vh;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Roboto Mono", monospace;
    font-family: "Roboto Mono", monospace;
    overflow: hidden;
    border-radius: 50%;
}
body {
    box-sizing: border-box;
    margin: 0;
    width: 100%;
    height: 100vh;
    max-width: none;
}
#tooltip {
    position: relative;
    text-align: center;
    background: black;
    color: white;    
    padding: 1rem;
    border: 0px;
    pointer-events: none;
    font-size: 1rem;
    height: 100%;
    width: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Roboto Mono", monospace;
    overflow: hidden;
}
#tooltip video {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    opacity: 1;
}
#observablehq-toc {
    display: none;
}
#rain-vid-container {
    display: none;
    position: absolute;
    height: 1000px;
    width: 1000px;
}
#snow-vid-container {
    display: none;
    position: absolute;
    height: 1000px;
    width: 1000px;
}
#cloud-vid-container {
    display: none;
    position: absolute;
    height: 1000px;
    width: 1000px;
}
#sun-vid-container {
    display: none;
    position: absolute;
    height: 29.5vh;
    width: 69vh;
}
#tooltip-info {
    position: absolute;
    font-size: .8vw;
    z-index: 100;
    padding: 1vw;
}
#legend {
    display: block;
    position: absolute;
    width: 20%;
    height: auto;
}
#legend img {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
}
.active {
    background-color: #2F2F3A;
}
#temp-unit-selector {
    display: flex;
    gap: 35px;
}
.temp-unit-button {
    border: 1px solid white;
    font-size: 8px;
}
#temp-filter {
    display: flex;
    flex-direction: column;
}
#fahrenheit {
    border-radius: 50% 0% 0% 50%;
    padding-top: 5px;
    padding-left: 8px;
    padding-right: 7px;
    padding-bottom: 5px;
}
#celsius {
    border-radius: 0% 50% 50% 0%;
    padding-top: 5px;
    padding-left: 7px;
    padding-right: 8px;
    padding-bottom: 5px;
}
#temp-filter-title {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.selected-temp {
    background-color: white;
    color: black;
}
#temp-range-container {
    position: relative;
    width: 100%;
}
#temp-range-inputs {
    display: flex;
    flex-direction: row;
    gap: 20px;
    width: 100%;
}
#temp-range-inputs input { 
    width: 95%;
    height: 25px;
    padding: 4px;
    background-color: white;
    border: none;
    color: black;
    font-size: .6vw;
}
#temp-range-sliders input {
    position: absolute;
    pointer-events: none;
}
#temps {
    height: 19%;
    border-top: 1px solid white;
    padding-top: 15px;
    padding-left: 5px;
    padding-right: 5px;
}
#temp-filter-title {
    font-size: .9vw;
}
#slider {
    width: 100%;
    height: 2px;
}
#temp-toggle {
    display: flex;
    flex-direction: row;
}
.temp-range-input {
    border-radius: 5px;
}
.ui-slider .ui-slider-handle {
    width: .6em;
    height: .6em;
    border-radius: 50%;
    background-color: rgb(52, 104, 228);
    border: 1px solid white;
}
.ui-slider-range.ui-corner-all.ui-widget-header {
    background-color: rgb(52, 104, 228);
}
.ui-widget.ui-widget-content {
    border: 0;
}
#temp-label {
    font-size: .8vw;
    font-weight: bold;
    display: flex;
    align-items: center;
}
#left, #right {
    position: absolute;
    color: white;
    bottom: 6px;
    font-size: .8em;
}
.slider-container {
    height: 40px;
    width: 100%;
    display: flex;
    align-items: center;
}
</style>

