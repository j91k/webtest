document.addEventListener('DOMContentLoaded', function() {
    const filterSelect = document.getElementById('filter');
    const latePaymentsFilterSelect = document.getElementById('latePaymentsFilter');
    const creditScoreFilterSelect = document.getElementById('creditScoreFilter');
    const chart1Container = document.getElementById('chart1');
    const chart2Container = document.getElementById('chart2');
    const chart3Container = document.getElementById('chart3');

    let globalData;

    d3.json('data2.json').then(data => {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid data format');
            return;
        }

        globalData = data;

        updateAllCharts();

        filterSelect.addEventListener('change', updateAllCharts);
        latePaymentsFilterSelect.addEventListener('change', updateAllCharts);
        creditScoreFilterSelect.addEventListener('change', updateAllCharts);

        window.addEventListener('resize', updateAllCharts);
    }).catch(error => {
        console.error('Error loading data:', error);
    });

    function updateAllCharts() {
        updateChart1();
        updateChart2();
        updateChart3();
    }

    function updateChart1() {
        chart1Container.innerHTML = '';
        const filter = filterSelect.value;
        const latePayments = latePaymentsFilterSelect.value;

        let filteredData = latePayments !== 'all' ? globalData.filter(d => d.late_payments == latePayments) : globalData;
        let latePaymentsText = latePayments === 'all' ? 'All' : `${latePayments} times`;
        let aggregatedData;

        switch (filter) {
            case 'default':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.late_payments);
                aggregatedData = new Map([...aggregatedData.entries()].sort((a, b) => a[0] - b[0]));
                renderBarChart(Array.from(aggregatedData), 'NUMBER OF LATE PAYMENTS', 'COUNT', chart1Container, true);
                break;
            case 'gender':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.sex);
                renderPieChart(aggregatedData, `${latePaymentsText.toUpperCase()} LATE ACC GENDER DISTRIBUTION`, true, chart1Container);
                break;
            case 'marriage':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.marriage);
                renderPieChart(aggregatedData, `${latePaymentsText.toUpperCase()} LATE ACC MARITAL STATUS DISTRIBUTION`, true, chart1Container);
                break;
            case 'age_bin':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.age_bin);
                renderBarChart(Array.from(aggregatedData), `${latePaymentsText.toUpperCase()} LATE ACC AGE DISTRIBUTION`, 'COUNT', chart1Container);
                break;
            case 'education':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.education);
                renderBarChart(Array.from(aggregatedData), `${latePaymentsText.toUpperCase()} LATE ACC EDUCATION DISTRIBUTION`, 'COUNT', chart1Container);
                break;
            default:
                console.warn('Unknown filter type:', filter);
        }
    }

    function updateChart2() {
        chart2Container.innerHTML = '';
        const filter = filterSelect.value;
        const creditScoreFilter = creditScoreFilterSelect.value;

        let filteredData = globalData;

        if (creditScoreFilter === 'above30') {
            filteredData = globalData.filter(d => d.cur_sept_category !== '30 or below');
        } else if (creditScoreFilter === 'below30') {
            filteredData = globalData.filter(d => d.cur_sept_category === '30 or below');
        }

        let aggregatedData;

        switch (filter) {
            case 'default':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.cur_sept_category);
                renderBarChart(Array.from(aggregatedData), `CREDIT UTILIZATION RATIO - ${filter.toUpperCase()} DISTRIBUTION`, 'COUNT', chart2Container, false, true);
                break;
            case 'gender':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.sex);
                renderBarChart(Array.from(aggregatedData), `CREDIT UTILIZATION RATIO - ${filter.toUpperCase()} DISTRIBUTION`, 'COUNT', chart2Container);
                break;
            case 'marriage':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.marriage);
                renderBarChart(Array.from(aggregatedData), `CREDIT UTILIZATION RATIO - ${filter.toUpperCase()} DISTRIBUTION`, 'COUNT', chart2Container);
                break;
            case 'age_bin':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.age_bin);
                renderBarChart(Array.from(aggregatedData), `CREDIT UTILIZATION RATIO - ${filter.toUpperCase()} DISTRIBUTION`, 'COUNT', chart2Container);
                break;
            case 'education':
                aggregatedData = d3.rollup(filteredData, v => v.length, d => d.education);
                renderBarChart(Array.from(aggregatedData), `CREDIT UTILIZATION RATIO - ${filter.toUpperCase()} DISTRIBUTION`, 'COUNT', chart2Container);
                break;
            default:
                console.warn('Unknown filter type:', filter);
        }
    }

    function updateChart3() {
        chart3Container.innerHTML = '';
        const filter = filterSelect.value;
        console.log("Selected filter for chart3:", filter);
        let groupBy = filter === 'default' ? 'age_bin' : (filter === 'gender' ? 'sex' : filter);
        console.log("GroupBy for aggregation:", groupBy);
        let aggregatedData = aggregateDataForMultiLineChart(globalData, groupBy);
        console.log("Aggregated data:", aggregatedData);
        
        if (aggregatedData.length === 0) {
            console.error("No data to display for the selected filter");
            chart3Container.innerHTML = '<p>No data available for the selected filter.</p>';
            return;
        }
        
        renderMultiLineChart(aggregatedData, 'Month', 'Average Bill Amount', chart3Container, filter);
    }

    function aggregateDataForMultiLineChart(data, groupBy) {
        const months = ['apr', 'may', 'june', 'july', 'aug', 'sept'];
        let groups;
    
        if (groupBy === 'sex') {
            groups = ['male', 'female'];
        } else if (groupBy === 'age_bin') {
            groups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        } else {
            groups = Array.from(new Set(data.map(d => d[groupBy]))).sort();
        }
    
        return groups.map(group => {
            let groupData = data.filter(d => d[groupBy].toLowerCase() === group.toLowerCase());
            return {
                group: group,
                values: months.map(month => {
                    let avgBill = d3.mean(groupData, d => +d[`bill_amt_${month}`]);
                    return { month: month, avgBill: avgBill || 0 };
                })
            };
        });
    }

    function renderBarChart(data, xLabel, yLabel, container, useGradient = false, isChart2Default = false, barPadding = 0.1) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const margin = { top: 40, right: 20, bottom: 60, left: 50 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d[0]))
            .range([0, width])
            .padding(barPadding);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[1])])
            .nice()
            .range([height, 0]);

        let colorScale;
        if (useGradient) {
            colorScale = d3.scaleLinear()
                .domain([0, 6])
                .range(['green', 'red']);
        }

        const barWidth = container.id === 'chart2' ? x.bandwidth() * 0.5 : x.bandwidth();

        svg.append('g')
            .selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d[0]) + (x.bandwidth() - barWidth) / 2)
            .attr('y', d => y(d[1]))
            .attr('width', barWidth)
            .attr('height', d => height - y(d[1]))
            .attr('fill', (d, i) => {
                if (useGradient) {
                    return colorScale(i);
                } else if (isChart2Default) {
                    return d[0] === '30 or below' ? 'green' : 'red';
                } else {
                    return '#4A90E2';
                }
            });

        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y).tickFormat(d3.format('d')));

        svg.selectAll('.bar-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', d => x(d[0]) + x.bandwidth() / 2)
            .attr('y', d => y(d[1]) - 5)
            .attr('text-anchor', 'middle')
            .text(d => d[1]);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(xLabel.toUpperCase());
    }

    function renderPieChart(data, title, showLegend, container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const radius = Math.min(containerWidth, containerHeight) / 2 * 0.75;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight);

        const g = svg.append('g')
            .attr('transform', `translate(${containerWidth / 3},${containerHeight / 2})`);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const pie = d3.pie()
            .sort(null)
            .value(d => d[1]);

        const arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        const pieData = pie(Array.from(data.entries()));

        g.selectAll('path')
            .data(pieData)
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data[0]));

        if (showLegend) {
            const legendRectSize = 18;
            const legendSpacing = 4;
            const legend = svg.selectAll('.legend')
                .data(color.domain())
                .enter()
                .append('g')
                .attr('class', 'legend')
                .attr('transform', (d, i) => {
                    const height = legendRectSize + legendSpacing;
                    const offset = height * color.domain().length / 2;
                    const horizontal = containerWidth * 2 / 3;
                    const vertical = i * height + (containerHeight / 2 - offset);
                    return `translate(${horizontal},${vertical})`;
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', color)
                .style('stroke', color);

            legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(d => `${d}: ${data.get(d)}`);
        }

        svg.append('text')
            .attr('x', containerWidth / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text(title.toUpperCase());
    }

    function renderMultiLineChart(data, xLabel, yLabel, container, filter) {
        const margin = { top: 60, right: 150, bottom: 60, left: 80 };
        const width = container.clientWidth - margin.left - margin.right;
        const height = container.clientHeight - margin.top - margin.bottom;
    
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const months = ['apr', 'may', 'june', 'july', 'aug', 'sept'];
        const x = d3.scalePoint()
            .domain(months)
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d3.max(d.values, v => v.avgBill))])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const line = d3.line()
            .x(d => x(d.month))
            .y(d => y(d.avgBill));

        data.forEach(d => {
            svg.append('path')
                .datum(d.values)
                .attr('fill', 'none')
                .attr('stroke', color(d.group))
                .attr('stroke-width', 2)
                .attr('d', line);

            svg.selectAll('.dot')
                .data(d.values)
                .enter().append('circle')
                .attr('class', 'dot')
                .attr('cx', v => x(v.month))
                .attr('cy', v => y(v.avgBill))
                .attr('r', 4)
                .attr('fill', color(d.group));
        });

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .call(d3.axisLeft(y));

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(yLabel);

        svg.append('text')
            .attr('transform', `translate(${width/2}, ${height + margin.top + 20})`)
            .style('text-anchor', 'middle')
            .text(xLabel);

        // Add title
        const title = svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(`${yLabel} by ${filter === 'default' ? 'Age Group' : filter.charAt(0).toUpperCase() + filter.slice(1)}`);

    // Add legend
    const legendX = width + 3;
    const legendY = -margin.top;

    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);

    const legendItems = legend.selectAll('.legend-item')
        .data(data)
        .enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => color(d.group));

    legendItems.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('text-anchor', 'start')
        .text(d => d.group);
}
});