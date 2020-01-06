<script>
  export let width;
  export let height;
  export let data;
  export let scMortRate;
  export let scReduction;

  const offset = 5;

  let mortalityCircles = [];

  function draw(width, height) {
    mortalityCircles = [100, 50, 25, 12, 6].map((d, i, a) => {
      return {
        mortalityRate: d,
        r: scMortRate(d),
        cx: scMortRate(a.slice(0, i + 1).reduce((a, c) => a + c)) + scMortRate(a.slice(0, Math.max(i, 1)).reduce((a, c) => a + c)) - (i === 0 ? scMortRate(d) : 0) + i * 5,
        cy: actualHeight / 2
      };
    });
  }

  $: actualWidth = width - offset;
  $: actualHeight = height - offset;
  $: titleHeight = actualHeight / 10;

  $: if (data) draw(width, height);
</script>

<svg width={actualWidth} height={actualHeight}>
  <g class="titles" transform="translate(0 {titleHeight})">
    <text>Under five-years deaths / 1,000 births</text>
  </g>
  <g class="mortality-circles" transform="translate(0 {titleHeight})">
    {#each mortalityCircles as circle}
      <circle class="mortality-circle"
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}></circle>
    {/each}
  </g>
</svg>

<style>
  g.titles text {
    fill: var(--blue);
  }

  circle.mortality-circle {
    fill: var(--red);
    stroke: none;
    opacity: 0.6;
  }
</style>
