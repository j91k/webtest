document.addEventListener('DOMContentLoaded', function() {
    const filterSelect = document.getElementById('filter');
    const latePaymentsFilterSelect = document.getElementById('latePaymentsFilter');
    const creditScoreFilterSelect = document.getElementById('creditScoreFilter');
    const chart1Container = document.getElementById('chart1');
    const chart2Container = document.getElementById('chart2');
    const chart3Container = document.getElementById('chart3');
    const chart4Container = document.getElementById('chart4');

    d3.json('data2.json').then(data => {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid data format');
            return;
        }

        updateChart1('default', 'all', data);
        updateChart2('default', 'all', data);
        updateChart3(data);
        updateChart4(data);

        filterSelect.addEventListener('change', function() {
            updateChart1(filterSelect.value, latePaymentsFilterSelect.value, data);
            updateChart2(filterSelect.value, creditScoreFilterSelect.value, data);
        });

        latePaymentsFilterSelect.addEventListener('change', function() {
            updateChart1(filterSelect.value, latePaymentsFilterSelect.value, data);
        });

        creditScoreFilterSelect.addEventListener('change', function() {
            updateChart2(filterSelect.value, creditScoreFilterSelect.value, data);
        });

        window.addEventListener('resize', function() {
            updateChart1(filterSelect.value, latePaymentsFilterSelect.value, data);
            updateChart2(filterSelect.value, creditScoreFilterSelect.value, data);
            updateChart3(data);
            updateChart4(data);
        });
    }).catch(error => {
        console.error('Error loading data:', error);
    });

    function updateChart1(filter, latePayments, data) {
        chart1Container.innerHTML = '';
        let filteredData = latePayments !== 'all' ? data.filter(d => d.late_payments == latePayments) : data;
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

    function updateChart2(filter, creditScoreFilter, data) {
        chart2Container.innerHTML = '';
        let filteredData = data;

        if (creditScoreFilter === 'above30') {
            filteredData = data.filter(d => d.cur_sept_category !== '30 or below');
        } else if (creditScoreFilter === 'below30') {
            filteredData = data.filter(d => d.cur_sept_category === '30 or below');
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
                return;
        }
    }

    function updateChart3(data) {
        chart3Container.innerHTML = '';
        // Add your chart 3 logic here
        // For now, let's just add a placeholder text
        chart3Container.textContent = 'Chart 3 placeholder';
    }

    function updateChart4(data) {
        chart4Container.innerHTML = '';
        // Add your chart 4 logic here
        // For now, let's just add a placeholder text
        chart4Container.textContent = 'Chart 4 placeholder';
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
});