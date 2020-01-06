<script>
  import * as d3 from 'd3';

  export let width;
  export let height;
  export let data;
  export let years;
  export let scCountryAngle;
  export let scYearRadius;
  export let scMortRate;
  export let scReduction;
  export let selectedIso;

  let reduction;
  let container;
  let modelYears, modelReduction;

  function update(selectedIso) {
    if (!selectedIso) {
      modelYears = [];
      reduction = 0;
      modelReduction = [];
    } else {
      reduction = data.find(d => d.iso === selectedIso).reduction;
      modelReduction = [{
        cx: Math.sin(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03),
        cy: Math.cos(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03),
        r: Math.min(width, height) / 200
      }];
      modelYears = data.find(d => d.iso === selectedIso).dataArr.filter(d => years.includes(d.year)) || [];
    }

    // the three year highlighters
    d3.select(container).selectAll('.year-circle')
      .data(modelYears)
      .join(enter => enter.append('circle')
                      .attr('class', 'year-circle')
                      .attr('fill', 'white')
                      .attr('opacity', 0.4)
                      .attr('cx', 0)
                      .attr('cy', 0)
                      .attr('r', 0)
                      .call(enter => enter.transition().duration(100)
                        .attr('cx', d => Math.sin(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
                        .attr('cy', d => Math.cos(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
                        .attr('r', d => scMortRate(d.value))),
            update => update.transition().duration(100)
                        .attr('cx', d => Math.sin(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
                        .attr('cy', d => Math.cos(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
                        .attr('r', d => scMortRate(d.value)),
            exit => exit.transition().duration(100)
                      .attr('cx', 0)
                      .attr('cy', 0)
                      .attr('r', 0)
                      .remove()
      );

    // the reduction highlighter
    d3.select(container).selectAll('.reduction-circle')
      .data(modelReduction)
      .join(enter => enter.append('circle')
                      .attr('class', `reduction-circle ${reduction <= 0 ? 'decreased' : 'increased'}`)
                      .attr('cx', 0)
                      .attr('cy', 0)
                      .attr('r', 0)
                      .call(enter => enter.transition().duration(100)
                        .attr('cx', d => d.cx)
                        .attr('cy', d => d.cy)
                        .attr('r', d => d.r)),
            update => update
                        .attr('class', `reduction-circle ${reduction <= 0 ? 'decreased' : 'increased'}`)
                        .transition().duration(100)
                          .attr('cx', d => d.cx)
                          .attr('cy', d => d.cy)
                          .attr('r', d => d.r),
            exit => exit.transition().duration(100)
                      .attr('cx', 0)
                      .attr('cy', 0)
                      .attr('r', 0)
                      .remove()
      );
  }

  $: if (container) update(selectedIso);
</script>

<g transform="translate({width / 2} {height / 2})" bind:this={container}></g>

<style>
  :global(circle.increased) {
    opacity: 1;
    fill: var(--red);
  }

  :global(circle.decreased) {
    opacity: 1;
    fill: var(--blue);
  }
</style>
