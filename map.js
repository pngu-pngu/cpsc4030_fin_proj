import updateChart from './chart.js';
import updatePie from './pie.js';

const updateMap = (yearInput = "All Years", subjectInput = "All Subjects") => {

    d3.csv("meat_consumption_worldwide.csv").then(data => {

        // show EU values as spanning across all the EU countries
        const EU28 = [
            "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN",
            "FRA", "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX",
            "MLT", "NLD", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"
        ];
        
        // Clear the previous chart before creating a new one
        // when we change our updateMap inputs must clear previous map before implement new one
        const svgContainer = d3.select("#map");
        svgContainer.selectAll("*").remove(); 
        const svgLegendContainer = d3.select("#legend-container");
        svgLegendContainer.selectAll("*").remove(); 

        const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "5px 10px")
        .style("display", "none")
        .style("pointer-events", "none");


        //filter our data to include only parameters
        const filteredData = data.filter(d =>
            d.measure === "KG_CAP" &&
            (subjectInput === "All Subjects" || d.subject === subjectInput)  &&
            (yearInput === "All Years" || parseInt(d.time) <= parseInt(yearInput))
        );

       // console.log("input",yearInput);
        //console.log(filteredData);

        // Group data 
        const percentChanges = d3.groups(filteredData.filter(d => d.measure  ), d => d.location, d => d.subject)
            .map(([location, subjects]) => {
                const subjectValues = subjects.map(([subject, records]) => {
                    const sortedRecords = records
                        .map(d => ({ ...d, value: +d.value, time: +d.time }))
                        .sort((a, b) => a.time - b.time);
                    
                    // starting and ending years for our dates
                    const startValues = sortedRecords.filter(d => d.time === sortedRecords[0].time);
                    const endValues = sortedRecords.filter(d => d.time === sortedRecords[sortedRecords.length - 1].time);

                    // Sum start and end values for all records
                    const startValue = d3.sum(startValues, d => d.value);
                    const endValue = d3.sum(endValues, d => d.value);

                    return { location, subject, startValue, endValue };
                }).flat();

                let startTotal = 0, endTotal = 0; 

                subjectValues.forEach((c) => {
                    startTotal += c.startValue; 
                    endTotal += c.endValue; 
                }); 

                const percentChange = (endTotal - startTotal) / 100; 

                //console.log("%s Data:", location, { location, percentChange });

                return { location, percentChange };
            });

        // filter results for valid percent changes
        const flattenedData = percentChanges
            .filter(d => !isNaN(d.percentChange))  
            .map(d => ({ location: d.location, percentChange: d.percentChange }));  

        // Map to easily access percentage change by country code
        const percentChangeByCountry = {};
        flattenedData.forEach(d => {
            if (d.location === "EU28") {
                EU28.forEach(country => {
                    if (!percentChangeByCountry[country]) {
                        percentChangeByCountry[country] = [];
                    }
                    percentChangeByCountry[country].push(d.percentChange);
                });
            } else {
                if (!percentChangeByCountry[d.location]) {
                    percentChangeByCountry[d.location] = [];
                }
                percentChangeByCountry[d.location].push(d.percentChange);
            }
        });

        // Load and process the GeoJSON data for the world map
        d3.json("countries.geo.json").then(worldData => {
            const svg = d3.select("#map").append("svg")
                .attr("width", 800)
                .attr("height", 600);

            const projection = d3.geoMercator()
                .scale(150)
                .translate([400, 300])
                .center([0, 0]) 
                .clipExtent([[0, 0], [1200, 600]]);

            const path = d3.geoPath().projection(projection);

            // Color scale for percentage changes
            const colorScale = d3.scaleLinear()
                .domain([-0.1, 0.5]) 
                .range(["#ffe5e5", "#8b0000"]); 


            // Draw the map
            svg.selectAll(".polygon")
            .data(worldData.features.filter(d => d.geometry.type === "Polygon"))
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const isoCode = d.id; // Match ISO codes with `location`
                const percentChange = percentChangeByCountry[isoCode];
                return percentChange != null ? colorScale(percentChange) : "#ffffff"; 
            })
            .attr("stroke", "#000000")
            .attr("stroke-width", .5)
            .on("click", function (event, d) {
                let selectedCountry = d.id; 
                console.log("%s clicked", selectedCountry);
                if (selectedCountry === "BMU") selectedCountry = "All Locations";
                updateChart(selectedCountry); 
                updatePie(selectedCountry);
            });

            svg.selectAll(".multipolygon")
            .data(worldData.features.filter(d => d.geometry.type === "MultiPolygon"))
            .enter()
            .append("path")
            .attr("class", "multipolygon")
            .attr("d", path)
            .attr("fill", d => {
                const isoCode = d.id; 
                const percentChange = percentChangeByCountry[isoCode];
                return percentChange != null ? colorScale(percentChange) : "#ffffff"; 
            })
            .attr("stroke", "#000000")
            .attr("stroke-width", 0.5)
            // update the other visualizations based on a mouse click on the country
            .on("click", function (event, d) {
                let selectedCountry = d.id; 
                console.log("%s clicked", selectedCountry);
                if (selectedCountry === "BMU") selectedCountry = "All Locations";
                updateChart(selectedCountry); 
                updatePie(selectedCountry);
            })
            .on("mouseover", (event, d) => {
                const mouseCountry = d.id; 
                const mouseValue = Math.round(percentChangeByCountry[mouseCountry] * 100) + "%"; // Get the value for the country

                tooltip.style("display", "block")
                    .style("color", "white")
                    .style("background-color", "#063806")
                    .html(`<strong>${mouseCountry}</strong><br>Kg/Cap: ${mouseValue}`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("display", "none");
            });

            // SVG for the legend
            const legendSvg = d3.select("#legend-container")
                .append("svg")
                .attr("width", 350) 
                .attr("height", 50); 


            // Calculate the min and max percentChange 
            // Calculate the min and max percentChange values from the percentChangeByCountry
            const allPercentChanges = flattenedData.map(d => d.percentChange).filter(d => !isNaN(d));
            const minValue = Math.floor(d3.min(allPercentChanges) * 10) / 10;
            const maxValue = Math.ceil(d3.max(allPercentChanges) * 10) / 10;

            // Generate ticks at 10% intervals
            const legendTicks = d3.range(minValue, maxValue + 0.1, 0.1);

            const legendScale = d3.scaleLinear()
                .domain([minValue, maxValue])
                .range([0, legendTicks.length + 20]); // space between rectangles

            // Append rectangles to legend
            legendSvg.selectAll("rect")
                .data(legendTicks)
                .enter()
                .append("rect")
                .attr("x", (d, i) => legendScale(i)) 
                .attr("width", 40) 
                .attr("height", 20) 
                .attr("fill", d => colorScale(d));

            // Add percentage labels to the legend
            legendSvg.selectAll("text")
                .data(legendTicks)
                .enter()
                .append("text")
                .attr("x", (d, i) => legendScale(i) + 20) // Center the text over each rectangle
                .attr("y", 40) // Ptext below the rectangles
                .text(d => `${(d * 100).toFixed(0)}%`)
                .style("font-size", "12px")
                .style("text-anchor", "middle"); 


        });
    });
}


export default updateMap;