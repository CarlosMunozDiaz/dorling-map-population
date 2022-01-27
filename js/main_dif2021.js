let width = document.getElementById('map').clientWidth;
let height = 600;
let tooltip = d3.select('#tooltip');
let inside = false;

initMap();

function initMap() {
    d3.json('https://raw.githubusercontent.com/CarlosMunozDiaz/dorling-map-population/main/data/municipios_geo_dif21.json', function(error,data) {
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
            item.properties.radius = radiusScale(item.properties.dato_2020);
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
                if(d.properties.dif != undefined) {
                    if(d.properties.dif < -20) {
                        return '#5e3c99';
                    } else if (d.properties.dif < -10 && d.properties.dif >= -20) {
                        return '#a195c7';
                    } else if (d.properties.dif < -0.001 && d.properties.dif >= -10) {
                        return '#dcd9e9';
                    } else if (d.properties.dif == 0) {
                        return '#c6c6c6';
                    } else if (d.properties.dif > 0.001 && d.properties.dif <= 10) {
                        return '#fadebc';
                    } else if (d.properties.dif > 10 && d.properties.dif <= 20) {
                        return '#f9a74f';
                    } else {
                        return '#e66101';
                    }
                } else {
                    return '#000';
                }                
            })
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", function(d) {
                return d.properties.radius;
            })
            .style("stroke", "white")
            .style("stroke-width", ".15px")
            .on('mouseover', function(d,i,e) {
                console.log(d);

                //Propiedades círculos
                let circle = e[i];
                circle.style.strokeWidth = 1;
                circle.style.stroke = '#000';
                //Propiedades
                let html = '<p class="chart__tooltip--title">' + d.properties.NAMEUNIT + '</p>' + '<p class="chart__tooltip--text">Variación población: ' + d.properties.dif.toFixed(2) + '</p>' + '<p class="chart__tooltip--text">Población en 2020: ' + d.properties.dato_2020 + '</p>' + '<p class="chart__tooltip--text">Población en 2021: ' + d.properties.dato_2021 + '</p>';
                tooltip.html(html);

                //Tooltip
                getInTooltip(tooltip);                
                positionTooltip(window.event, tooltip);
            })
            .on('mouseout', function(d,i,e) {
                let circle = e[i];
                circle.style.strokeWidth = 0.15;
                circle.style.stroke = '#fff';
                getOutTooltip(tooltip);
            })

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
                return item.properties.dato_2020;
            }));

            let radio = d3.scaleSqrt()
              .domain([0, populationMax])
              .range([1.15, 15]);

            return radio(pobl);
        }
    });
}

//Helpers
function getInTooltip(tooltip) {
    tooltip.style('display','block').style('opacity', 1);
}

function getOutTooltip(tooltip) {
    tooltip.style('display','none').style('opacity', 0);
}

function positionTooltip(event, tooltip) {
    let x = event.pageX;
    let y = event.pageY;

    //Tamaño
    let ancho = parseInt(tooltip.style('width'));
    
    let distanciaAncho = isNaN(ancho) ? 100 : ancho;

    //Posición
    let horizontalPos = -172.5;

    tooltip.style('top', y + -50 + 'px');
    tooltip.style('left', (x + horizontalPos) + 'px');
}