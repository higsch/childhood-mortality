<script>
  import { arc as d3arc } from 'd3-shape';
  import { select } from 'd3-selection';

  export let width;
  export let height;
  export let data;
  export let scCountryAngle;
  export let radius;
  export let selectedIso;

  const countryLabelArc = d3arc()
    .startAngle(d => d.angle - Math.PI)
    .endAngle(d => d.angle + Math.PI)
    .innerRadius(d => d.radius)
    .outerRadius(d => d.radius);

  let container;
  let model;

  function update(selectedIso) {
    if (!selectedIso) {
      model = [];
    } else {
      const angle = scCountryAngle(selectedIso);
      const realRadius = radius * (angle > Math.PI / 2 && angle < 1.5 * Math.PI ? 1.04 : 1.02);
      model = [{
        angle,
        radius: realRadius,
        iso: selectedIso,
        country: data.find(d => d.iso === selectedIso).country
      }];
    }

    select(container).selectAll('.country-label-path')
      .data(model)
      .join('path')
        .attr('class', 'country-label-path')
        .attr('id', d => `country-label-path-${d.iso}`)
        .attr('d', countryLabelArc)
        .attr('fill', 'none')
        .attr('stroke', 'none');

    select(container).selectAll('.country-label')
      .data(model)
      .join('text')
        .attr('class', 'country-label')
        .append('textPath')
          .attr('href', d => `#country-label-path-${d.iso}`)
          .attr('font-size', '0.9rem')
          .attr('text-anchor', 'middle')
          .attr('startOffset', d => `${d.angle > Math.PI / 2 && d.angle < 1.5 * Math.PI ? '75%' : '25%'}`)
          .attr('fill', 'white')
          .text(d => d.country);
  }

  $: if (container) update(selectedIso);
</script>

<g transform="translate({width / 2} {height / 2})" bind:this={container}></g>

<style>
</style>
