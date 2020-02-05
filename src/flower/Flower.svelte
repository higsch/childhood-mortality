<script>
  import * as d3 from 'd3';

  import CanvasVisual from './CanvasVisual.svelte';
  import SVGVisualBelow from './SVGVisualBelow.svelte';
  import SVGVisualOver from './SVGVisualOver.svelte';
  import Tour from './Tour.svelte';

  import Legend from './Legend.svelte';

  export let data;
  export let years;

  const offset = 10;
  const angleOffset = 0;

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
	<div class="intro">
    <div class="text">
      5.3 million children under five <span class="red">died</span> in 2018.
      This is on average 15,000 children per day. However, the mortality rates are in fact declining.
      Still 30 years ago, 12.5 million kids <span class="red">died</span> before their fifth birthday.
      Within the last 20 years, the mortality rates fell for every country in the world. Almost.
    </div>
    <div class="tour">
      <!--<div class="tour-title">Take a tour to these countries:</div>
      <div class="tour-countries">
        <Tour data={data} />
      </div>-->
    </div>
	</div>
	<div class="legend">
    <div class="text">How to read this chart:</div>
    <Legend data={data}
            scMortRate={scMortRate}
            scReduction={scReduction} />
    <div class="data-info">Median under five-year mortality rates are taken from the <a href="https://data.unicef.org/topic/child-survival/under-five-mortality/">official resource</a> of the UN Inter-agency Group for Child Mortality Estimation.</div>
    <div class="imprint">
      <img src="logo.svg" alt="higsch-logo" />
      Higsch Data Visuals,&nbsp; <a href="https://www.linkedin.com/in/matthias-stahl/">Matthias Stahl</a>, 2020
    </div>
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
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: space-between;
		width: 100%;
		height: auto;
    color: var(--blue);
  }

  .info > div {
    width: 47%;
    height: 100%;
    margin-bottom: 0;
  }

  @media (max-width: 600px) {
    .info > div {
      width: 100%;
      margin-bottom: 1.5rem;
    }
  }

  .intro {
    display: flex;
    flex-direction: column;
  }

  .text {
    text-align: justify;
    line-height: 1.7;
  }

  .tour {
    display: flex;
    flex-direction: column;
    margin: 1rem 0 0 0;
  }
  
  .data-info {
    font-size: 0.9rem;
    font-style: italic;
    line-height: 1.7;
  }

  .imprint {
    display: flex;
    margin: 1rem 0;
    align-items: center;
    font-size: 0.7rem;
  }

  .imprint img {
    width: 1.7rem;
    margin: 0 0.6rem 0 0;
  }

  .wrapper {
    width: 100%;
    height: 100%;
  }
</style>
