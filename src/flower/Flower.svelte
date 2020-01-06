<script>
  import * as d3 from 'd3';

  import CanvasVisual from './CanvasVisual.svelte';
  import SVGVisualBelow from './SVGVisualBelow.svelte';
  import SVGVisualOver from './SVGVisualOver.svelte';

  export let data;
  export let years;

  const offset = 10;
  const padding = 50;
  const angleOffset = 0;
  const reductionOffset = 40;

  let selectedIso;

  // Dimensions
  let rawWidth = offset;
  let rawHeight = offset;

  // Scales
  let scYearColor, scCountryAngle, scYearRadius, scMortRate, scReduction;

  function initScales(minDim) {
    scYearColor = d3.scaleOrdinal()
      .domain(years)
      .range(['#F40000', 'rgb(236, 54, 9)', 'rgb(245, 120, 86)']);

    scCountryAngle = d3.scaleOrdinal()
      .domain(data.map(d => d.iso))
      .range(d3.range(angleOffset, 2 * Math.PI - angleOffset, (2 * Math.PI - 2 * angleOffset) / data.length));

    scYearRadius = d3.scaleLinear()
      .domain([years[0], years[years.length - 1]])
      .range([minDim / 5, minDim / 2.6 - padding]);

    scMortRate = d3.scaleLinear()
      .domain([0, 1.2 * d3.max([].concat(...data.map(d => d.dataArr.filter(d => years.includes(d.year)).map(d => d.value))))])
      .range([0, minDim / 15]);

    scReduction = d3.scaleLinear()
      .domain(d3.extent(data.map(d => d.reduction)))
      .range([Math.min(scYearRadius(years[years.length - 1]) + reductionOffset, minDim / 2 - padding), minDim / 2 - padding]);
  }

  $: width = rawWidth - offset;
  $: height = rawHeight - offset;
  $: minDim = Math.min(width, height);

  $: if (data && years) initScales(minDim);
</script>

<div class="wrapper" bind:offsetWidth={rawWidth} bind:offsetHeight={rawHeight}>
  {#if (minDim > 0)}
  <SVGVisualBelow width={width}
                  height={height}
                  offset={offset}
                  data={data}
                  years={years}
                  scCountryAngle={scCountryAngle}
                  scYearRadius={scYearRadius}
                  scReduction={scReduction}
                  selectedIso={selectedIso} />
  <CanvasVisual width={width}
              height={height}
              offset={offset}
              data={data}
              years={years}
              scYearColor={scYearColor}
              scCountryAngle={scCountryAngle}
              scYearRadius={scYearRadius}
              scMortRate={scMortRate}
              selectedIso={selectedIso} />
  <SVGVisualOver width={width}
                 height={height}
                 offset={offset}
                 data={data}
                 years={years}
                 scCountryAngle={scCountryAngle}
                 scYearRadius={scYearRadius}
                 scReduction={scReduction}
                 scMortRate={scMortRate}
                 selectedIso={selectedIso}
                 on:isochanged={(e) => selectedIso = e.detail} />
  {/if}
</div>

<style>
  .wrapper {
    width: 100%;
    height: 100%;
  }
</style>
