<script>
	import * as d3 from 'd3';

	import Flower from './flower/Flower.svelte';

	const years = [1998, 2008, 2018];

	let data;

	async function load() {
		data = await d3.csv('/child_mortality.csv', d => {
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

<div id="visual">
	{#if data}
		<Flower {data}
						{years} />
	{/if}
</div>

<style>
	#visual {
		width: 100%;
		height: 100%;
	}
</style>
