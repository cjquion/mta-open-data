<nav id="left-panel" class="mta-sidebar">
    <ol id="" class="sidebar-contents">
        <li id="splash-title" class="">
            <h1>
            A Year of MTA Transit
            </h1>
        </li>
        <li id="subtitle" class="">
        How did weather affect ridership for trains and buses in 2023?
        </li>
        <li id="blurb" class="">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
        </li>
        <li id="">
            <div class="">Explore the chart with filters</div>
            <ol id="transport-icon-list">
                <li class="icon-li"><img src="./icons/Aiga_bus.svg"/></li>
                <li class="icon-li"><img src="./icons/Aiga_railtransportation.svg"/></li>
            </ol> 
            <ol id="weather-icon-list">
                <li class="icon-li"><img src="./icons/rainy_heavy_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"/></li>
                <li class="icon-li"><img src="./icons/sunny_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"/></li>
                <li class="icon-li"><img src="./icons/snowing_heavy_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"/></li>
                <li class="icon-li"><img src="./icons/cloud_24dp_FFFFFF_FILL0_wght400_GRAD0_opsz24.svg"/></li>
            </ol>
            <ol id="buttons-list">
                <li class="button">Reset</li>
                <li class="button">Apply</li>
            </ol>
        </li>
    </ol>
</nav>


<div id="container">
    <div id="tooltip"></div>
    <div id="my_dataviz">
        <div id="temp_dataviz"></div>
        <div id="train_dataviz"></div>
        <div id="bus_dataviz"></div>
    </div>
</div>



```js
import {chart} from "./components/mta.js";

const mta_data = await FileAttachment("./data/MTA_Daily_Ridership_Data__Beginning_2020_20240930.csv").csv();
const weather_data = await FileAttachment("./data/new york city 2023-01-01 to 2023-12-31.csv").csv();

chart(weather_data, mta_data)
```

<style>
#buttons-list {
    display: flex;
    flex-flow: row;
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
    border-top: solid;
    border-bottom: solid;
    padding-left: 0px;
}
.sidebar-contents {
    padding-left: 0px;
}
#transport-icon-list li {
    padding: 10px;
}
#weather-icon-list li {
    padding: 10px;
}
.icon-li {
    width: 40px;
}
#left-panel {
    font-family: "Roboto Mono", monospace;
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
.mta-sidebar {
    display: flex;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    background: black;
    width: 557px;
    box-sizing: border-box;
    overflow-y: auto;
    padding: 50px;
}
li {
    list-style: none;
    padding-bottom: 15px;
}
#splash-title h1 {
    font-size: 40px;
}
#observablehq-center {
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: 0px;
    background-color: white;
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
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
#container {
    position: relative;
    width: 100vw;
    height: 100vh;
    padding-left: 557px;
}
#observablehq-main {
    min-width: 100vw;
    margin-top: 0px;
    max-height: 100vh;
}
#observablehq-center {
    margin-right: 0px;
    max-height: 100vh;
}
#tooltip {
    position: absolute;
    text-align: center;
    padding: .2rem;
    background: #313639;
    opacity: 0;
    color: #f9f9f9;
    border: 0px;
    border-radius: 8px;
    pointer-events: none;
    font-size: .7rem;
}
</style>