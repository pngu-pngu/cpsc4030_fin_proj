
d3.csv("meat_consumption_worldwide.csv").then(data => {
    const width = 400; // Chart width
    const height = 400; // Chart height
    const margin = { top: 50, right: 100, bottom: 50, left: 50 };
    const sparklineHeight = 50; // Height for each sparkline

    // Filter data to include only "KG_CAP"
    const filteredData = data.filter(d => d.measure === "KG_CAP" && !["WLD", "BRICS", "OECD"].includes(d.location));

    const locations = Array.from(new Set(filteredData.map(d => d.location)));
    const subjects = Array.from(new Set(filteredData.map(d => d.subject)));
    const years = Array.from(new Set(filteredData.map(d => +d.time))).sort((a, b) => a - b);



    /*
    const color = d3.scaleOrdinal()
        .domain(subjects)
        .range(["#6e2701", "#f58696", "#d38f13", "#8A507C"]);

    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => +d.time))
        .range([0, width]);

    const yLocation = d3.scalePoint()
        .domain(locations)
        .range([height, 0])
        .padding(1);

    const yValue = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => +d.value)])
        .range([height, 0]);

    const svg = d3.select("#scatter-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Calculate the range of the x-axis (e.g., years)
    const xDomain = d3.extent(data, d => +d.time); // Find the first and last year in your data
    const tickValues = d3.range(xDomain[0], xDomain[1] + 1, 5); // Every 5 years
    const filteredTickValues = tickValues.filter(year => year !== 2025);

    // Ensure the last year is included if it's not already in the list
    if (filteredTickValues[filteredTickValues.length - 1] !== xDomain[1]) {
        filteredTickValues.push(xDomain[1]); // Add the last year if it's not already included
    }

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(
            d3.axisBottom(x)
                .tickValues([...new Set(filteredTickValues)]) // Remove duplicates if the last year is already in the filtered range
                .tickFormat(d3.format("d"))
        )
        .selectAll("path, line") 
        .attr("stroke", "black")
        .style("stroke-width", "1px");

    svg.selectAll(".tick text") 
        .style("fill", "black") 
        .style("font-weight", "300") 
        .style("font-size", "10px"); 
        
    
    svg.append("g")
        .call(d3.axisLeft(yLocation)
            .tickValues(locations)) // Show all locations as ticks
        .selectAll("path, line")
        .attr("stroke", "black");
    
    svg.selectAll(".tick text") 
        .style("fill", "black") 
        .style("font-weight", "300") 
        .style("font-size", "8px"); 
    */

    // Add Sparklines for Each Location
    const color = d3.scaleOrdinal()
    .domain(subjects)
    .range(["#6e2701", "#f58696", "#d38f13", "#8A507C"]);

const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, width - margin.right - margin.left]);

const y = d3.scaleLinear()
    .domain([0, d3.max(filteredData, d => +d.value)])
    .range([sparklineHeight, 0]);

const svg = d3.select("#scatter-plot")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

 // Add Sparklines for Each Location
 locations.forEach((location, i) => {
    const locationData = filteredData.filter(d => d.location === location);

    const sparklineGroup = svg.append("g")
        .attr("transform", `translate(0, ${i * (sparklineHeight + 20)})`);

    // Add dots for each year and subject
    sparklineGroup.selectAll("circle")
        .data(locationData)
        .enter()
        .append("circle")
        .attr("cx", d => x(+d.time))
        .attr("cy", d => y(+d.value))
        .attr("r", 1) // Dot size
        .attr("fill", d => color(d.subject))
        .attr("stroke", "black")
        /*
        .on("mouseover", (event, d) => {
            const tooltip = d3.select("body")
                .append("div")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid black")
                .style("padding", "5px")
                .style("border-radius", "5px")
                .style("pointer-events", "none")
                .html(`Location: ${d.location}<br>Subject: ${d.subject}<br>Year: ${d.time}<br>Kg/Cap: ${d.value}`);

            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => d3.select("body").selectAll("div").remove());
        */
    // Add location label
    sparklineGroup.append("text")
        .attr("x", -10)
        .attr("y", sparklineHeight / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .text(location);

    // Add X-axis (Years)
    const xAxis = d3.axisBottom(x)
        .tickValues(years)
        .tickFormat(d3.format("d"));

    sparklineGroup.append("g")
        .attr("transform", `translate(0, ${sparklineHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "8px");
});

// Add Legend
const legend = svg.selectAll(".legend")
    .data(subjects)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width - margin.right + 20}, ${i * 20})`);

legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 12)
    .attr("height", 12)
    .style("fill", d => color(d));

legend.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .style("text-anchor", "start")
    .style("font-size", "12px")
    .text(d => d);
});
