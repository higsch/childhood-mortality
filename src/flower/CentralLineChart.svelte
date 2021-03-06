<script>
  import { extent, max } from 'd3-array';
  import { scaleLinear } from 'd3-scale';
  import { line as d3line, curveCardinal } from 'd3-shape';

  export let width;
  export let height;
  export let data;
  export let selectedIso;
  export let radius;

  let dataArr, xScale, yScale, line, yLabels;

  function updateScalesAndGenerators(radius) {
    xScale = scaleLinear()
      .domain(extent([].concat(...data.map(d => d.dataArr)).map(d => d.year)))
      .range([-radius / 1.5, radius / 1.5]);

    yScale = scaleLinear()
      .domain([-10, max([].concat(...data.map(d => d.dataArr)).map(d => d.value))])
      .range([radius / 2, -radius / 2]);
      
    line = d3line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(curveCardinal);

    yLabels = [
      {
        x: xScale(dataArr[0].year) * 1.05,
        y: yScale(dataArr[0].value) + Math.min(width, height) / 200,
        text: Math.round(dataArr[0].value),
        textAnchor: 'end'
      },
      {
        x: xScale(dataArr[dataArr.length - 1].year) * 1.05,
        y: yScale(dataArr[dataArr.length - 1].value) + Math.min(width, height) / 200,
        text: Math.round(dataArr[dataArr.length - 1].value),
        textAnchor: 'start'
      }
    ];
  }

  $: if (data && selectedIso) dataArr = data.find(d => d.iso === selectedIso).dataArr.filter(d => !isNaN(d.value));
  $: if (data && dataArr) updateScalesAndGenerators(radius);
</script>

{#if (data && selectedIso)}
  <g transform="translate({width / 2} {height / 2})">
    <text class="title"
          transform="translate(0 {yScale.range()[1] * 1.4})">deaths / 1000 births</text>
    <path d={line(dataArr)}
          stroke="white"
          stroke-width="2"
          fill="none"></path>
    {#each yLabels as yLabel}
      <text class="y-label"
            transform="translate({yLabel.x} {yLabel.y})"
            text-anchor={yLabel.textAnchor}>{yLabel.text}</text>
    {/each}
    <line x1={xScale.range()[0]}
          y1={yScale.range()[0]}
          x2={xScale.range()[1]}
          y2={yScale.range()[0]}></line>
    {#each xScale.domain() as xLabel, i}
      <text class="x-label"
            transform="translate({xScale(xLabel)} {yScale.range()[0] * 1.25})"
            text-anchor={i % 2 === 0 ? 'start' : 'end'}>{xLabel}</text>
    {/each}
  </g>
{/if}

<style>
  text.title {
    font-size: calc(0.4rem + 0.5vmin);
    text-anchor: middle;
    fill: white;
  }

  text.y-label {
    font-size: 0.7rem;
    fill: white;
  }
  
  line {
    stroke: white;
    stroke-width: 1;
  }

  text.x-label {
    font-size: 0.6rem;
    fill: white;
  }

</style>
