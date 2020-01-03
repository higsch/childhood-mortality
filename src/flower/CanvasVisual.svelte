<script>
  import { onMount } from 'svelte';

  export let width;
  export let height;
  export let offset;
  export let data;
  export let years;
  export let scYearColor;
  export let scCountryAngle;
  export let scYearRadius;
  export let scMortRate;
  export let faint = false;

  const canvasScaleFactor = 2;

  // Elements
  let canvas, ctx;

  function init() {
    canvas.width = canvasScaleFactor * width;
    canvas.height = canvasScaleFactor * height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.margin = `${offset / 2}px`;

    ctx.scale(canvasScaleFactor, canvasScaleFactor);
    ctx.translate(width / 2, height / 2);
  }

  function draw(width, height) {
    ctx.clearRect(-width / 2, -height / 2, width, height);
    ctx.globalAlpha = 0.4;

    years.forEach(year => {
      ctx.fillStyle = scYearColor(year);
      data.forEach(d => {
        const yearData = d.dataArr.find(d => d.year === year);
        const x = Math.sin(Math.PI - scCountryAngle(d.iso)) * scYearRadius(year);
        const y = Math.cos(Math.PI - scCountryAngle(d.iso)) * scYearRadius(year);
        ctx.beginPath();
        ctx.arc(x, y, scMortRate(yearData.value), 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
  });

  $: if (ctx) init(width, height);
  $: if (ctx && data) draw(width, height);
</script>

<canvas class="canvas-visual"
        bind:this={canvas}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
