<script>
  import Defs from './Defs.svelte';
  import CentralLineChart from './CentralLineChart.svelte';
  import CountryHighlighter from './CountryHighlighter.svelte';
  import IsoDetector from './IsoDetector.svelte';

  export let width;
  export let height;
  export let offset;
  export let data;
  export let years;
  export let scCountryAngle;
  export let scYearRadius;
  export let scReduction;
  export let scMortRate;
  export let selectedIso;

  $: innerRadius = scYearRadius(years[0]) * 0.62;
</script>

<svg class="svg-visual"
     width={width}
     height={height}
     style="margin: {offset / 2}px;">
  <Defs scReduction={scReduction} />
  <CentralLineChart width={width}
                    height={height}
                    data={data}
                    selectedIso={selectedIso}
                    radius={innerRadius}></CentralLineChart>
  <CountryHighlighter width={width}
                      height={height}
                      data={data}
                      years={years}
                      scCountryAngle={scCountryAngle}
                      scYearRadius={scYearRadius}
                      scMortRate={scMortRate}
                      scReduction={scReduction}
                      selectedIso={selectedIso}></CountryHighlighter>
  <IsoDetector width={width}
               height={height}
               radius={scReduction.range()[1]}
               scCountryAngle={scCountryAngle}
               selectedIso={selectedIso}
               on:isochanged></IsoDetector>
</svg>

<style>
  svg {
    position: absolute;
  }
</style>
