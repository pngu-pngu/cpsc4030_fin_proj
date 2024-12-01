import updateChart from './updateChart.js';

d3.csv("meat_consumption_worldwide.csv").then(data => {
    const width = 800;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };


    const locations = [...new Set(data.map(d => d.location))];

    // Create the dropdown
    const dropdown = d3.select("#controls")
        .append("select")
        .attr("id", "locationDropdown")
        .style("margin-bottom", "10px");
    
    console.log(dropdown.node());


    dropdown.selectAll("option")
        .data(["All Locations", ...locations])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => {
            return d;
        });


    // Initial chart setup
    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const subjects = [...new Set(data.map(d => d.subject))];
    const color = d3.scaleOrdinal()
        .domain(subjects)
        .range(["#ff6347", "#87ceeb", "#ffa500", "#4682b4"]);

    // Set up the chart with the default location (All Locations)
    updateChart("All Locations");


    // Add event listener for dropdown change
    dropdown.on("change", function () {
        const selectedLocation = d3.select(this).property("value");
        console.log("selected Location:", selectedLocation);
        updateChart(selectedLocation);
    });
});


