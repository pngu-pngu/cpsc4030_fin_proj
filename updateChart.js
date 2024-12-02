function updateChart(selectedLocation) {

    // Filter data based on the dropdown selection
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

    // Update scales
    const x = d3.scaleLinear()
        .domain(d3.extent(averagedBySubject, d => +d.time))
        .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(averagedBySubject, d => +d.value)])
        .range([height - margin.top - margin.bottom, 0]);

    // Clear existing chart
    svg.selectAll("*").remove();

    // Add axes
    const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));

    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`)
        .call(xAxis);

    svg.append("g").call(yAxis);

    svg.append("text")
        .attr("class", "y-axis-title")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -(height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Meat Consumption (KG per Capita)");


    svg.append("text")
        .attr("class", "x-axis-title")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom + 35)
        .style("text-anchor", "middle")
        .text("Year");

    // Draw lines
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
            .attr("d", line);
    });

    // Add legend
    svg.selectAll(".legend")
        .data(subjects)
        .enter()
        .append("text")
        .attr("class", "legend")
        .attr("x", width - margin.right)
        .attr("y", (d, i) => margin.top + i * 20)
        .attr("fill", d => color(d))
        .text(d => d)
        .style("font-size", "12px");
}
export default updateChart;