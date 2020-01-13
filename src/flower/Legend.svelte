<script>
  import * as d3 from 'd3';

  export let data;
  export let scMortRate;
  export let scReduction;

  let width = 0;
  let height = 0;
  let mortalityCircles = [];
  let titleHeight = 0;

  let scalesSet = false;
  let xScale, yScale, reductionPath;

  $: mortalityCircles = [80, 40, 20, 10, 5].map((d, i, a) => {
      return {
        mortalityRate: d,
        r: scMortRate(d),
        cx: scMortRate(a.slice(0, i + 1).reduce((a, c) => a + c)) + scMortRate(a.slice(0, Math.max(i, 1)).reduce((a, c) => a + c)) - (i === 0 ? scMortRate(d) : 0) + i * 20,
        cy: height / 2
      };
    });

  function setupScales(width, height) {
    if (width === 0 || height === 0) return;

    xScale = d3.scaleLinear()
      .domain([0, 10])
      .range([mortalityCircles[mortalityCircles.length - 1].cx + width / 15, width - width / 20]);

    yScale = d3.scaleLinear()
      .domain(d3.extent(reductionData.map(d => d.reduction)))
      .range([height * 2/3, height / 3]);

    reductionPath = d3.line()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.reduction))
      .curve(d3.curveCardinal);
  }

  $: titleHeight = mortalityCircles[0].cy - mortalityCircles[0].r - 30;
  $: reductionData = [...data.slice(55, 65), data[55]];
  $: if (mortalityCircles && reductionData) setupScales(width, height);
  $: if (xScale && yScale && reductionPath) scalesSet = true;

</script>

<div class="container" bind:offsetWidth={width} bind:offsetHeight={height}>
  <svg width="100%" height="100%">
    {#if scalesSet}
      <defs>
        <linearGradient id="legend-reduction-gradient"
                        x1="0"
                        y1="100%"
                        x2="0"
                        y2="0">
          <stop offset="0" stop-color="#A6D9F7" />
          <stop offset="0.40" stop-color="#A6D9F7" />
          <stop offset="0.40" stop-color="#F40000" />
          <stop offset="1" stop-color="#F40000" />
        </linearGradient>
      </defs>
      <g class="titles" transform="translate(0 {titleHeight})">
        <text>deaths / 1,000 births</text>
        <text transform="translate({xScale.range()[0]} 0)">Change from 1998 to 2018</text>
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
        <path class="reduction-path"
              d={reductionPath(reductionData)}
              fill="url(#legend-reduction-gradient)" />
        <text class="reduction-label red"
              transform="translate({(xScale.range()[0] + xScale.range()[1]) / 2} {yScale.range()[1] - 7})">increased</text>
        <text class="reduction-label blue"
              transform="translate({(xScale.range()[0] + xScale.range()[1]) / 2} {yScale.range()[0] + 7})">decreased</text>
      </g>
    {/if}
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
    font-size: 0.8rem;
  }

  circle.mortality-circle {
    fill: var(--red);
    stroke: none;
    opacity: 1;
  }

  text.mortality-labels {
    font-size: 0.7rem;
    text-anchor: middle;
  }

  path.reduction-path {
    stroke: none;
  }

  text.reduction-label {
    font-size: 0.7rem;
    text-anchor: middle;
  }

  .red {
    fill: var(--red);
  }

  .blue {
    fill: var(--blue);
  }
</style>
