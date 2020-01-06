<script>
	import * as d3 from 'd3';

	import Flower from './flower/Flower.svelte';

	const years = [1998, 2008, 2018];

	let data;

	async function load() {
		data = await d3.csv('/childhood-mortality/child_mortality.csv', d => {
			const dataArr = [];
			const returnObj = {
				iso: d.iso,
				country: d.country,
				reduction: +d.reduction,
				continent: d.continent
			};
			for (let key in d) {
				if (key.match('^19|^20')) dataArr.push({year: +key, value: +d[key]});
			}
			returnObj['dataArr'] = dataArr;
			return returnObj;
		});
	}

	load();
</script>

<div class="wrapper">
	<div class="header">
		<h1>The circle of hope</h1>
	</div>
	<div id="visual">
		{#if data}
			<Flower {data} {years} />
		{/if}
	</div>
</div>

<style>
	.wrapper {
		width: 95%;
		height: 100%;
		margin: 0 auto;
	}

	.header {
		width: 100%;
		margin: 1.5rem 0;
		color: var(--blue);
	}

	.header h1 {
		font-family: 'Ibarra Real Nova', serif;
		font-weight: normal;
		font-size: calc(3rem + 7px);
		/* text-align: center; */
	}

	#visual {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
