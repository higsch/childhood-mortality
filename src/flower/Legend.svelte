<script>
  import * as d3 from 'd3';

  export let data;
  export let scMortRate;
  export let scReduction;

  let width = 0;
  let height = 0;
  let mortalityCircles = [];
  let titleHeight = 0;

  $: mortalityCircles = [80, 40, 20, 10, 5].map((d, i, a) => {
      return {
        mortalityRate: d,
        r: scMortRate(d),
        cx: scMortRate(a.slice(0, i + 1).reduce((a, c) => a + c)) + scMortRate(a.slice(0, Math.max(i, 1)).reduce((a, c) => a + c)) - (i === 0 ? scMortRate(d) : 0) + i * 20,
        cy: height / 2
      };
    });

  $: xScale = d3.scaleLinear()
      .domain([0, 10])
      .range([mortalityCircles[mortalityCircles.length - 1].cx + width / 15, width - width / 20]);

  $: yScale = d3.scaleLinear()
      .domain(d3.extent(data.map(d => d.reduction)))
      .range([height * 2/3, height / 3]);

  $: reductionPath = d3.line()
    .x((_, i) => xScale(i))
    .y(d => yScale(d.reduction))
    .curve(d3.curveCardinal);

  $: titleHeight = height * 0.1;
</script>

<div class="container" bind:offsetWidth={width} bind:offsetHeight={height}>
  <svg width="100%" height="100%">
    <g class="titles" transform="translate(0 {titleHeight})">
      <text>deaths / 1,000 births</text>
    </g>
    <g class="mortality-circles" transform="translate(0 0)">
      {#each mortalityCircles as d}
        <circle class="mortality-circle"
                cx={d.cx}
                cy={d.cy}
                r={d.r}></circle>
        <text class="mortality-labels" transform="translate({d.cx} {d.cy - d.r - 10})">{d.mortalityRate}</text>
      {/each}
    </g>
    <g class="reduction">
      <path class="reduction-path" d={reductionPath(data.slice(55, 66))} />
    </g>
  </svg>
</div>

<style>
  .container {
    max-width: 500px;
  }

  text {
    fill: var(--blue);
  }

  g.titles {
    font-size: 0.9rem;
  }

  circle.mortality-circle {
    fill: var(--red);
    stroke: none;
    opacity: 0.6;
  }

  text.mortality-labels {
    font-size: 0.8rem;
    text-anchor: middle;
  }

  path.reduction-path {
    fill: none;
    stroke: white;
    stroke-width: 2;
  }
</style>
