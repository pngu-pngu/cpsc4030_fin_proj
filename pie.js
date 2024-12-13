import updateMap from './map.js';
import updateChart from './chart.js';


const updatePie = (selectedLocation = "All Locations", year = "All Years") => {

d3.csv("meat_consumption_worldwide.csv").then(data => {
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 110;


    const filteredData = data.filter(d =>
        d.measure === "KG_CAP" &&
        (selectedLocation === "All Locations" || d.location === selectedLocation) &&
        (year === "All Years" || parseInt(d.time) === parseInt(year))
    );


    const pieData = d3.rollups(
        filteredData,
        v => d3.sum(v, d => +d.value),
        d => d.subject
    ).map(([key, value]) => ({ subject: key, value }));

    const color = d3.scaleOrdinal()
        .domain(pieData.map(d => d.subject))
        .range(["#6e2701", "#f58696", "#d38f13", "#8A507C"]);

     const svgContainer = d3.select("#pie-chart");
    svgContainer.selectAll("*").remove(); // Remove all previous chart elements

    const svg = svgContainer
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    const outerArc = d3.arc()
        .innerRadius(radius + 10) // Labels outside the pie
        .outerRadius(radius + 10);

    // Draw pie chart
    svg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .on("click", function (event, d) {
            console.log(d);
            const mouseSubject = d.data.subject;
            console.log("suby", mouseSubject);
            updateMap( "All Years", mouseSubject);
        })
        .attr("fill", d => color(d.data.subject))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    // Add labels
    svg.selectAll("text")
        .data(pie(pieData))
        .enter()
        .append("text")
        .text(d => `${d.data.subject}: ${((d.data.value / d3.sum(pieData, d => d.value)) * 100).toFixed(2)}%`)
        .attr("transform", d => `translate(${outerArc.centroid(d)})`) 
        .style("text-anchor", d => (d.endAngle + d.startAngle) / 2 > Math.PI ? "end" : "start")
        .style("font-size", "12px");
});
}

export default updatePie;