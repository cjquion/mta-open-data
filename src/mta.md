
```js
import {chart} from "./components/mta.js";
```

```js
const mta_data = await FileAttachment("./data/MTA_Daily_Ridership_Data__Beginning_2020_20240930.csv").csv();
```
<div id="my_dataviz"></div>

```js
chart(mta_data)
```
