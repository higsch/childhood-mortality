<script>
  export let scReduction;
</script>

<defs>
  <!-- gradient for the reduction path -->
  <radialGradient id="reduction-gradient"
                  gradientUnits="userSpaceOnUse"
                  cx="0"
                  cy="0"
                  r={scReduction.range()[1]}>
    <stop offset="0"
          stop-color="#1C0118"></stop>
    <stop offset={scReduction(0) / scReduction.range()[1]}
          stop-color="#1C0118"></stop>
    <stop offset={scReduction(0) / scReduction.range()[1]}
          stop-color="#F40000"></stop>
    <stop offset="1"
          stop-color="#F40000"></stop>
  </radialGradient>

  <!-- blur filter for the outer circle -->
  <filter id="reduction-shadow">
    <feDropShadow dx="0"
                  dy="0"
                  stdDeviation="7"
                  flood-color="#A6D9F7"></feDropShadow>
  </filter>
</defs>

<style>
</style>
