<script>
  import Defs from './Defs.svelte';
  import CentralLineChart from './CentralLineChart.svelte';

  export let width;
  export let height;
  export let offset;
  export let data;
  export let years;
  export let scCountryAngle;
  export let scYearRadius;
  export let scReduction;
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
</svg>

<style>
  svg {
    position: absolute;
  }
</style>
