<script>
  import Defs from './Defs.svelte';
  import Continents from './Continents.svelte';
  import ReductionPath from './ReductionPath.svelte';

  export let width;
  export let height;
  export let offset;
  export let data;
  export let years;
  export let scCountryAngle;
  export let scYearRadius;
  export let scReduction;

  let continentsData;

  function loadContinentsData() {
    const uniqueContinents = [...new Set(data.map(d => d.continent))];
    continentsData = uniqueContinents.map(continent => {
      const raw = data.map(d => d.continent);
      return {
        startAngle: scCountryAngle(data[raw.indexOf(continent)].iso),
        endAngle: scCountryAngle(data[raw.lastIndexOf(continent)].iso),
        continent
      };
    });
  }

  // Prepare data for continent labels
  $: if (data) loadContinentsData();
</script>

<svg class="svg-visual"
     width={width}
     height={height}
     style="margin: {offset / 2}px;">
  <Defs scReduction={scReduction} />
  <ReductionPath width={width}
                 height={height}
                 data={data}
                 scCountryAngle={scCountryAngle}
                 scReduction={scReduction} />
  <Continents width={width}
              height={height}
              data={continentsData}
              years={years}
              scYearRadius={scYearRadius} />
</svg>

<style>
  svg {
    position: absolute;
  }
</style>
