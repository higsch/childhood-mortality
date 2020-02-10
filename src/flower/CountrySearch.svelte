<script>
  import { createEventDispatcher } from 'svelte';

  export let data = [];

  const dispatch = createEventDispatcher();
  
  let searchString = '';

  function handleSearch(searchString) {
    const searchedObj = searchData.find(d => d.tobesearched.indexOf(searchString.toUpperCase()) >= 0);
    if (searchString && searchedObj && searchedObj.iso) {
      dispatch('isochanged', searchedObj.iso);
    } else {
      dispatch('isochanged', undefined);
    }
  }

  $: searchData = data.map(d => ({iso: d.iso, tobesearched: `${d.iso}|${d.country}`.toUpperCase()}));

  $: handleSearch(searchString);
</script>

<label for="country">Search by country</label>
<input id="country"
       name="country"
       autocomplete="off"
       type="search"
       placeholder="Country name"
       bind:value={searchString}
       on:click|stopPropagation={() => handleSearch(searchString)} />

<style>
  label {
    margin: 0 0 0.7rem 0;
  }

  input {
    width: 55%;
    min-width: 200px;
    padding: 0.4rem;
    font-size: 1.1rem;
    color: var(--dark);
    background-color: var(--blue);
    border: none;
    border-radius: 0.5vmin;
  }
</style>
