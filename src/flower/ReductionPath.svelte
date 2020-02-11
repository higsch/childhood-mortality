<script>
  import { lineRadial, curveCardinal } from 'd3-shape';

  export let width;
  export let height;
  export let data;
  export let scCountryAngle;
  export let scReduction;

  // the path generator
  $: path = lineRadial()
    .angle(d => scCountryAngle(d.iso))
    .radius(d => scReduction(d.reduction))
    .curve(curveCardinal);

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
