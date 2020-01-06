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
  let container, reductionCircle;

  function update() {
    reduction = data.find(d => d.iso === selectedIso).reduction || 0;

    d3.select(container).selectAll('.year-circle')
      .data(data.find(d => d.iso === selectedIso).dataArr.filter(d => years.includes(d.year)))
      .join('circle')
        .attr('class', 'year-circle')
        .attr('fill', 'white')
        .attr('opacity', 0.4)
        .transition().duration(100)
          .attr('cx', d => Math.sin(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
          .attr('cy', d => Math.cos(Math.PI - scCountryAngle(selectedIso)) * scYearRadius(d.year))
          .attr('r', d => scMortRate(d.value));

    d3.select(reductionCircle)
      .transition().duration(100)
      .attr('cx', Math.sin(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03))
      .attr('cy', Math.cos(Math.PI - scCountryAngle(selectedIso)) * scReduction(reduction) * (reduction <= 0 ? 0.97 : 1.03));
  }

  $: if (selectedIso && reductionCircle) update();
</script>

{#if selectedIso}
  <g transform="translate({width / 2} {height / 2})" bind:this={container}>
    <circle bind:this={reductionCircle}
            class={reduction <= 0 ? 'decreased' : 'increased'}
            r={Math.min(width, height) / 200}></circle>
  </g>
{/if}

<style>
  circle.increased {
    opacity: 1;
    fill: var(--red);
  }

  circle.decreased {
    opacity: 1;
    fill: var(--blue);
  }
</style>
