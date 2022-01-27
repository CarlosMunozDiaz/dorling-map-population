let width = document.getElementById('map').clientWidth;
let height = 550;

initMap();

function initMap() {
    d3.json('../data/municipios_razon21_geo.json', function(error,data) {
        if (error) throw error;
        let us = topojson.feature(data, data.objects.muni);
        
        //Desarrollo del mapa
        let map = d3.select("#map");

        let svg = map.append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const projection = d3.geoConicConformalSpain().scale(2000).fitSize([width,height], us);
        const path = d3.geoPath(projection);

        ///Centroide y radio
        for(let i = 0; i < us.features.length; i++) {
            let item = us.features[i];
            item.properties.radius = radiusScale(item.properties.Total);
            item.properties.centroid = path.centroid(item);
        }

        ///Prueba dorling
        let spreadMunicipios = applyForce(us.features);

        svg.append("g")
            .selectAll("circle")
            .data(spreadMunicipios)
            .enter()
            .append("circle")
            .attr("fill", function(d) {
                if(d.properties.razon_fem != undefined) {
                    if(d.properties.razon_fem <= 33.33) {
                        return '#5e3c99';
                    } else if (d.properties.razon_fem > 33.33 && d.properties.razon_fem <= 66.66) {
                        return '#a195c7';
                    } else if (d.properties.razon_fem > 66.66 && d.properties.razon_fem < 100) {
                        return '#dcd9e9';
                    } else if (d.properties.razon_fem == 100) {
                        return '#c6c6c6';
                    } else if (d.properties.razon_fem > 100 && d.properties.razon_fem <= 133.33) {
                        return '#fadebc';
                    } else if (d.properties.razon_fem > 133.33 && d.properties.razon_fem <= 166.66) {
                        return '#f9a74f';
                    } else {
                        return '#e66101';
                    }
                } else {
                    return 'grey';
                }                
            })
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", function(d) {
                return d.properties.radius;
            })
            .style("stroke", "white")
            .style("stroke-width", ".3px");

        function applyForce (nodes) {
            const simulation = d3.forceSimulation(nodes)
                .force("cx", d3.forceX().x(d => width / 2).strength(0.02))
                .force("cy", d3.forceY().y(d => width * (5/8) / 2).strength(0.02))
                .force("x", d3.forceX().x(d => d.properties.centroid ? d.properties.centroid[0] : 0).strength(1))
                .force("y", d3.forceY().y(d => d.properties.centroid ? d.properties.centroid[1] : 0).strength(1))
                .force("charge", d3.forceManyBody().strength(-1))
                .force("collide", d3.forceCollide().radius(d => d.properties.radius + 0.1).strength(1))
                .stop();
          
            let i = 0;

            while (simulation.alpha() > 0.01 && i < 200) {
              simulation.tick(); 
              i++;
            }          
          
            return simulation.nodes();
        }

        function radiusScale(pobl) {
            const populationMax = d3.max(us.features.map(function(item) {
                return item.properties.Total;
            }));

            let radio = d3.scaleSqrt()
              .domain([0, populationMax])
              .range([1.15, 15]);

            return radio(pobl);
        }
    });
}