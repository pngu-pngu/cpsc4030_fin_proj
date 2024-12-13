// Load the data
d3.csv("meat_consumption_worldwide.csv").then(data => {
    // Filter out unwanted locations
    // Filter data to include only "KG_CAP"
    const filteredData = data.filter(d => d.measure === "KG_CAP" && !["WLD", "BRICS", "OECD"].includes(d.location));

    // Set dimensions
    const width = 1300;
    const height = 350;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    const subjects = ["BEEF", "PIG", "POULTRY", "SHEEP"];
    const color = d3.scaleOrdinal()
        .domain(subjects)
        .range(["#6e2701", "#f58696", "#d38f13", "#8A507C"]);

    // Create scales for each dimension
    const dimensions = [ "location", "value"];
    const x = d3.scalePoint()
        .domain(dimensions)
        .range([margin.left, width - margin.right]);

    const yScales = {};
    dimensions.forEach(dim => {
        if (dim === "value") {
            yScales[dim] = d3.scaleLinear()
                .domain(d3.extent(filteredData, d => +d[dim]))
                .range([height - margin.bottom, margin.top]);
        } else {
            yScales[dim] = d3.scalePoint()
                .domain([...new Set(filteredData.map(d => d[dim]))])
                .range([height - margin.bottom, margin.top]);
        }
    });

    // Create SVG container
    const svg = d3.select("#parallel")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw axes
    dimensions.forEach(dim => {
        svg.append("g")
            .attr("transform", `translate(${x(dim)}, 0)`)
            .call(d3.axisLeft(yScales[dim]))
            .append("text")
            .attr("y", margin.top - 10)
            .attr("x", 0)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text(dim);
    });

    // Draw paths
    const line = d3.line()
        .x((d, i) => x(dimensions[i]))
        .y((d, i) => yScales[dimensions[i]](d));

    
    subjects.forEach(subject => {
        const subjectData = averagedBySubject.filter(d => d.subject === subject);
        svg.selectAll("path")
            .data(subjectData)
            .enter()
            .append("path")
            .attr("d", d => line(dimensions.map(dim => d[dim])))
            .attr("fill", "none")
            .attr("stroke", color(subject))
            .attr("stroke-width", 1)
            .attr("opacity", 0.7);
    });

    // Add interactivity (e.g., tooltip)
    svg.selectAll("path")
        .on("mouseover", (event, d) => {
            d3.select(event.target).attr("stroke", "orange").attr("stroke-width", 2);
        })
        .on("mouseout", (event, d) => {
            d3.select(event.target).attr("stroke", "steelblue").attr("stroke-width", 1);
        });
});
