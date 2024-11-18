// Dimensions and Projection
const width = 800;
const height = 500;

const projection = d3.geoNaturalEarth1()
  .scale(150)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

let groupedData; 
let colorScale; 

Promise.all([
  d3.csv("meat_consumption_worldwide.csv"), 
  d3.json("world-geojson.json")
]).then(([csvData, worldData]) => {
  processData(csvData, worldData);
});

function processData(csvData, worldData) {
  const filteredData = csvData.filter(d => d.measure === "KG_CAP");

  groupedData = d3.group(filteredData, d => d.time);

  const allValues = filteredData.map(d => +d.value);
  colorScale = d3.scaleSequential(d3.interpolateReds)
    .domain([0, d3.max(allValues)]);

  drawMap(worldData); 
  initYearDropdown(); 
  addLegend(); 
}

function drawMap(worldData) {
  const countries = worldData.features;

  svg.selectAll("path")
    .data(countries)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", "#ccc") 
    .attr("stroke", "#000")
    .attr("class", "country")
    .append("title") 
    .text(d => d.properties.name);
}

function updateMap(year) {
  const yearData = groupedData.get(year);

  const valueMap = {};
  yearData.forEach(d => {
    const countryCode = d.location;
    const value = +d.value;
    if (!valueMap[countryCode]) {
      valueMap[countryCode] = 0;
    }
    valueMap[countryCode] += value;
  });

  svg.selectAll(".country")
    .attr("fill", d => {
      const countryCode = d.id; 
      return valueMap[countryCode] ? colorScale(valueMap[countryCode]) : "#ccc";
    })
    .select("title")
    .text(d => {
      const countryCode = d.id;
      const value = valueMap[countryCode];
      return value ? `${d.properties.name}: ${value.toFixed(2)} kg/cap` : d.properties.name;
    });
}

function initYearDropdown() {
  const years = Array.from(groupedData.keys());
  const yearDropdown = d3.select("#yearDropdown");

  yearDropdown
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  yearDropdown.on("change", function () {
    const selectedYear = this.value;
    updateMap(selectedYear);
  });

  updateMap(years[0]);
}

function addLegend() {
  const legendWidth = 300;
  const legendHeight = 10;

  const legendSvg = d3.select("#map-container")
    .append("svg")
    .attr("width", legendWidth + 50)
    .attr("height", 50)
    .style("display", "block")
    .style("margin", "0 auto");

  const gradient = legendSvg.append("defs")
    .append("linearGradient")
    .attr("id", "legendGradient");

  gradient.selectAll("stop")
    .data(d3.range(0, 1.1, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => d3.interpolateReds(d));  

  legendSvg.append("rect")
    .attr("x", 20)
    .attr("y", 20)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legendGradient)");

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([20, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale).ticks(5);

  legendSvg.append("g")
    .attr("transform", `translate(0, ${20 + legendHeight})`)
    .call(legendAxis);

  legendSvg.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .attr("font-size", "12px")
    .attr("fill", "#000")
    .text("KG/CAP"); 
}

