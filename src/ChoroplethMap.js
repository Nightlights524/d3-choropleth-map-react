import React, { useRef, useEffect } from "react"
import * as d3 from "d3"
import * as topojson from "topojson-client";
import * as styles from "./ChoroplethMap.module.css"

const ChoroplethMap = (props) => {
  const chart = React.useRef(null);

  const colors = [
    '#f2f0f7',
    '#dadaeb',
    '#bcbddc',
    '#9e9ac8',
    '#807dba',
    '#6a51a3',
    '#4a1486'
  ]

  function fillColor(data) {
    for (let threshold = 10; threshold < 70; threshold += 10) {
      if (data < threshold) {
        return colors[(threshold / 10) - 1];
      }
    }
    return colors[colors.length - 1];
  }

  function tooltipDisplay(county) {
    const info = `${county.area_name}, ${county.state}\n${county.bachelorsOrHigher}%`;
    
    d3.select(`.${styles.tooltip}`).text(info);
  }

  const educationDataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json';
  const countyDataURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

  useEffect(() => {
    Promise.all([d3.json(educationDataURL), d3.json(countyDataURL)])
      .then(data => {
        const [educationData, topology] = data;

        const width = 960;
        const height = 600;
        const tooltipOffsetX = 20;
        const tooltipOffsetY = 73;
                        
        // SET UP TOOLTIP
        const tooltip = d3.select(chart.current)
                          .append('div')
                          .attr('class', 'hidden');
        
        // SET UP SVG
        const svg = d3.select(chart.current)
                      .append("svg")
                      .attr("viewBox", [0, 0, width, height]);

        // ADD COUNTIES
        const path = d3.geoPath();
        const g = svg.append("g");

        g.selectAll('path')
          .data(topojson.feature(topology, topology.objects.counties).features)
          .join('path')
          .attr('d', path)
          .attr('data-fips', d => d.id)
          .attr('data-education', d => educationData.find(e => e.fips === d.id).bachelorsOrHigher)
          .attr('class', styles.county)
          .style('fill', d => fillColor(educationData.find(e => e.fips === d.id).bachelorsOrHigher))
          .on("mouseover", (event, d) => {
              tooltip.attr("class", styles.tooltip)
                    .attr("data-education", educationData.find(e => e.fips === d.id).bachelorsOrHigher)
                    .style("left", event.pageX + tooltipOffsetX + "px")
                    .style("top", event.pageY - tooltipOffsetY + "px");
              tooltipDisplay(educationData.find(e => e.fips === d.id));
            })
          .on("mouseout", () => {
            tooltip.attr("class", styles.hidden);
          });

        // ADD STATE BORDERS
        svg.append("path")
          .datum(topojson.mesh(topology, topology.objects.states))
          .style("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-linejoin", "round")
          .attr("d", path)
          .attr("class", styles.state);
        
        // ADD LEGEND
        const legendRectWidth = 40;
        const legendRectHeight = 10;

        const legend = svg.append("g")
                          .attr("transform", "translate(" + 
                              (width - 400) + ", " + (height - 585) + ")");
                              
        for (const color of colors) {
          legend.append("rect")
                .attr("x", colors.indexOf(color) * legendRectWidth)
                .attr("width", legendRectWidth)
                .attr("height", legendRectHeight)
                .style("fill", color)
        }

        // LEGEND AXIS      
        const legendScale = d3.scaleLinear()
                              .domain([0, 70])
                              .range([0, colors.length * legendRectWidth]);

        const legendAxis = d3.axisBottom(legendScale)
                            .tickValues([0, 10, 20, 30, 40, 50, 60, 70]);
        
        legend.append("g")
              .attr("transform", "translate(0, " + legendRectHeight + ")")
              .call(legendAxis);
      }
    );
  });

  return (
    <div ref={chart} className={styles.chart}>
      <h1 className={styles.title}>United States Educational Attainment</h1>
      <h2 className={styles.subtitle}>Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</h2>
    </div>
  )
}

export default ChoroplethMap