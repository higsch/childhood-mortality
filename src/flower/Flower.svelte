<script>
  import * as d3 from 'd3';

  import CanvasVisual from './CanvasVisual.svelte';
  import SVGVisualBelow from './SVGVisualBelow.svelte';
  import SVGVisualOver from './SVGVisualOver.svelte';

  import Legend from './Legend.svelte';

  export let data;
  export let years;

  const offset = 10;
  const angleOffset = 0;

  let selectedIso;

  // Dimensions
  let rawWidth = offset;
  let rawHeight = offset;
  let legendWidth = 0;
  let legendHeight = 0;

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
      .range([minDim / 5, minDim / 2.4 - padding]);

    scMortRate = d3.scaleLinear()
      .domain([0, 1.2 * d3.max([].concat(...data.map(d => d.dataArr.filter(d => years.includes(d.year)).map(d => d.value))))])
      .range([0, minDim / 9]);

    scReduction = d3.scaleLinear()
      .domain(d3.extent(data.map(d => d.reduction)))
      .range([Math.min(scYearRadius(years[years.length - 1]) + reductionOffset, minDim / 2 - padding), minDim / 2 - padding]);
  }

  $: width = rawWidth - offset;
  $: height = rawHeight - offset;
  $: minDim = Math.min(width, height);
  $: padding = minDim / 40;
  $: reductionOffset = minDim / 40;

  $: if (data && years) initScales(minDim);
</script>

<svelte:body on:click={() => selectedIso = undefined}/>

<div class="info">
	<div class="intro" bind:offsetWidth={legendWidth} bind:offsetHeight={legendHeight}>
		5.3 million children under five <span class="red">died</span> in 2018.
		This is on average 15,000 children per day.<br />However, the mortality rates are declining for decades.
    Still 30 years ago, 12.5 million kids <span class="red">died</span> before their fifth birthday.
    Within the last 20 years, the mortality rates fell for every country in the world. Almost.
	</div>
	<div class="legend">
    <Legend width={legendWidth}
            height={legendHeight}
            data={data}
            scMortRate={scMortRate}
            scReduction={scReduction} />
	</div>
</div>
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
  .info {
    display: flex;
    flex-direction: row;
    align-items: stretch;
		width: 100%;
		height: auto;
    color: var(--blue);
    font-family: 'Ibarra Real Nova', serif;
  }
  
  @media (max-width: 600px) {
    .info {
      flex-direction: column;
    }
  }

  .info > div {
    flex: 1;
  }

  .intro {
    font-size: 1.1rem;
    line-height: 1.5;
  }

	span.red {
		color: var(--red);
	}

  .wrapper {
    width: 100%;
    height: 100%;
  }
</style>
