d3.csv("movie.csv").then(data => {
    let processedMovies = data.map(movie => {
        let updatedMovie = { ...movie };
        Object.keys(updatedMovie).forEach(key => {
            let value = updatedMovie[key];
            if (typeof value === "string") {
                let cleaned = value.replace(/,/g, ""); 
                let num = cleaned.match(/\d+(\.\d+)?/g);
                updatedMovie[key] = num ? Math.round(parseFloat(num[0])) : (key === "rating" ? 0 : value);
            }
        });
        return updatedMovie;
    });

    let numCols = [], strCols = [];
    Object.keys(processedMovies[0]).forEach(col => {
        let isNum = processedMovies.every(m => !isNaN(m[col]));
        isNum ? numCols.push(col) : strCols.push(col);
    });

    function populateDropdown(id, opts) {
        document.getElementById(id).innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join("");
    }

    populateDropdown("x-axis", numCols);
    populateDropdown("y-axis", numCols);
    populateDropdown("opacity", numCols);
    populateDropdown("size", numCols);
    populateDropdown("color", strCols);

    let w = 800, h = 500, m = { top: 20, right: 30, bottom: 60, left: 60 };
    let gw = w - m.left - m.right, gh = h - m.top - m.bottom;

    let svg = d3.select("#scatterplot").append("svg")
        .attr("width", w).attr("height", h)
        .append("g").attr("transform", `translate(${m.left},${m.top})`);

    let brush = d3.brush()
        .extent([[0, 0], [gw, gh]])
        .on("brush end", brushEventHandler);

    let brushGrp = svg.append("g").attr("class", "brush").call(brush);

    function getVals(k) {
        return processedMovies.map(m => m[k]);
    }

    function updateGraph() {
        let xA = document.getElementById("x-axis").value;
        let yA = document.getElementById("y-axis").value;
        let cA = document.getElementById("color").value;
        let sA = document.getElementById("size").value;
        let oA = document.getElementById("opacity").value;

        let xS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[xA])).range([0, gw]);
        let yS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[yA])).range([gh, 0]);
        let sS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[sA])).range([4, 20]);
        let oS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[oA])).range([0.3, 1]);
        let cS = d3.scaleOrdinal(d3.schemeCategory10);

        let vals = getVals(cA);
        let uniqVals = [...new Set(vals)];
        genLegend(uniqVals, cS);

        svg.selectAll("*").remove();
        svg.append("g").attr("transform", `translate(0, ${gh})`).call(d3.axisBottom(xS));
        svg.append("g").call(d3.axisLeft(yS));

        svg.selectAll("circle")
            .data(processedMovies).enter().append("circle")
            .attr("cx", d => xS(+d[xA]))
            .attr("cy", d => yS(+d[yA]))
            .attr("r", d => sS(+d[sA]))
            .attr("fill", d => cS(d[cA]))
            .attr("opacity", d => oS(+d[oA]))
            .style("stroke", "black").style("stroke-width", 0.5);

        svg.append("g").attr("class", "brush").call(brush);
    }

    function brushEventHandler(event) {
        if (!event.selection) return;
        let [[x0, y0], [x1, y1]] = event.selection;

        let xA = document.getElementById("x-axis").value;
        let yA = document.getElementById("y-axis").value;

        let xS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[xA])).range([0, gw]);
        let yS = d3.scaleLinear().domain(d3.extent(processedMovies, d => +d[yA])).range([gh, 0]);

        let selected = processedMovies.filter(m => {
            let x = xS(+m[xA]), y = yS(+m[yA]);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });

        updateTable(selected);
    }

    function genLegend(cats, cS) {
        const legend = d3.select("#legend").attr("width", 150).attr("height", cats.length * 30);
        legend.selectAll("*").remove();
        cats.forEach((cat, i) => {
            let item = legend.append("g").attr("transform", `translate(0, ${i * 30})`);
            item.append("rect").attr("width", 20).attr("height", 20).attr("fill", cS(cat));
            item.append("text").attr("x", 30).attr("y", 15).text(cat).style("font-size", "12px");
        });
    }

    function updateTable(data) {
        let header = Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join("");
        let rows = data.map(d => `<tr>${Object.values(d).map(v => `<td>${v}</td>`).join("")}</tr>`).join("");
        document.getElementById("table-header").innerHTML = header;
        document.getElementById("table-body").innerHTML = rows;
    }

    updateGraph();
    document.querySelectorAll("select").forEach(s => s.addEventListener("change", updateGraph));
});
