<script>
  import * as d3 from 'd3';

  export let width;
  export let height;
  export let data;
  export let scCountryAngle;
  export let scReduction;

  // the path generator
  $: path = d3.lineRadial()
    .angle(d => scCountryAngle(d.iso))
    .radius(d => scReduction(d.reduction))
    .curve(d3.curveCardinal);

</script>

<g transform="translate({width / 2} {height / 2})">
  <circle cx="0"
          cy="0"
          r={scReduction(0)}
          stroke="none"
          fill="#A6D9F7"
          filter="url(#reduction-shadow)"></circle>
  <path d={path(data)}
        stroke="none"
        fill="url(#reduction-gradient)"></path>
</g>

<style>
</style>
