<script>
  import { arc as d3arc } from 'd3-shape';

  export let width;
  export let height;
  export let data;
  export let years;
  export let scYearRadius;

  const shrinkFactor = 0.62;
  const lineThicknessFactor = 1.05;
  const labelOffsetFactor = 1.1;

  let arc, labelArc;

  // The arcs
  function defineArcs() {
    const innerAreaRadius = scYearRadius(years[0]) * shrinkFactor;
    arc = d3arc()
      .startAngle(d => d.startAngle)
      .endAngle(d => d.endAngle)
      .innerRadius(innerAreaRadius)
      .outerRadius(innerAreaRadius * lineThicknessFactor)
      .cornerRadius(7);

    labelArc = d3arc()
      .startAngle(d => d.startAngle)
      .endAngle(d => d.endAngle)
      .innerRadius(innerAreaRadius * labelOffsetFactor)
      .outerRadius(innerAreaRadius * labelOffsetFactor);
  }

  $: if (scYearRadius) defineArcs();
</script>

{#if data}
  <g transform="translate({width / 2} {height / 2})">
    {#each data as d}
      <path class="continent-arc" d={arc(d)}></path>
      <path class="continent-label-arc" id="continent-label-arc-{d.continent}" d={labelArc(d)}></path>
      <text>
        <textPath class="continent-label" href="#continent-label-arc-{d.continent}" startOffset="25%">
          {d.continent}
        </textPath>
      </text>
    {/each}
  </g>
{/if}

<style>
  path.continent-arc {
    fill: var(--blue);
  }
  path.continent-label-arc {
    fill: none;
  }

  textPath.continent-label {
    fill: #A6D9F7;
    text-anchor: middle;
    font-family: Arial, sans-serif;
    font-size: 0.6rem;
  }
</style>
