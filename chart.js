import updatePie from './pie.js';
import updateMap from './map.js';

const updateChart = (selectedLocation = "All Locations") => {
    d3.csv("meat_consumption_worldwide.csv").then(data => {
        const width = 400; // Chart width
        const height = 350; // Chart height
        const margin = { top: 50, right: 100, bottom: 50, left: 50 };

        // Clear the previous chart before creating a new one
        const svgContainer = d3.select("#line-chart");
        svgContainer.selectAll("*").remove(); // Remove all previous chart elements

        const svg = svgContainer
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const subjects = ["BEEF", "PIG", "POULTRY", "SHEEP"];
        const color = d3.scaleOrdinal()
            .domain(subjects)
            .range(["#6e2701", "#f58696", "#d38f13", "#8A507C"]);

        const tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("padding", "5px 10px")
            .style("display", "none")
            .style("pointer-events", "none");

        const filteredData = data.filter(d =>
            d.measure === "KG_CAP" &&
            (selectedLocation === "All Locations" || d.location === selectedLocation)
        );

        const averagedData = d3.group(filteredData, d => d.subject, d => d.time);
        const averagedBySubject = Array.from(averagedData, ([subject, yearData]) => {
            return Array.from(yearData, ([year, records]) => {
                const avgValue = d3.mean(records, r => +r.value);
                return { subject, time: +year, value: avgValue };
            });
        }).flat();

        averagedBySubject.sort((a, b) => a.time - b.time);

        const x = d3.scaleLinear()
            .domain(d3.extent(averagedBySubject, d => +d.time))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(averagedBySubject, d => +d.value)])
            .range([height, 0]);

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
            .call(d3.axisLeft(y))
            .selectAll("path, line")
            .attr("stroke", "black") 
            .style("stroke-width", "1px"); 

        svg.selectAll(".tick text") 
            .style("fill", "black") 
            .style("font-weight", "300") 
            .style("font-size", "10px"); 

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left)
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Meat Consumption (KG per Capita)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Year");

        const line = d3.line()
            .x(d => x(+d.time))
            .y(d => y(+d.value));

        subjects.forEach(subject => {
            const subjectData = averagedBySubject.filter(d => d.subject === subject);

            svg.append("path")
                .datum(subjectData)
                .attr("fill", "none")
                .attr("stroke", color(subject))
                .attr("stroke-width", 2)
                .attr("d", line)
                .on("click", function (event, d) {
                    const mouseYear = d3.pointer(event)[0];
                    const closest = d.reduce((a, b) =>
                        Math.abs(x(+a.time) - mouseYear) < Math.abs(x(+b.time) - mouseYear) ? a : b
                    );
                    console.log("selected year", closest.time);
                    updatePie("All Locations", closest.time);
                    updateMap( closest.time, subject);
                })
                .on("mouseover", (event, d) => {
                    const mouseYear = d3.pointer(event)[0];
                    const closest = d.reduce((a, b) =>
                        Math.abs(x(+a.time) - mouseYear) < Math.abs(x(+b.time) - mouseYear) ? a : b
                    );
                    tooltip.style("display", "block")
                        .style("color", "white")
                        .style("background-color", "#063806")
                        .html(`<strong>${subject}</strong><br>Year: ${closest.time}<br>Kg/Cap: ${closest.value.toFixed(2)}`);
                })
                .on("mousemove", event => {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("display", "none");
                });
        });

        // Add legend
        const legend = svg.selectAll(".legend")
            .data(subjects)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${width + 10}, ${i * 20})`);

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
};


export default updateChart;
