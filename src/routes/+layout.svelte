<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import icon from '$lib/assets/icon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Papiée</title>
</svelte:head>

<div class="relative flex min-h-20 w-full flex-row items-center bg-surface-500 p-2">
	<img class="m-0 max-h-20 w-40 rounded-md bg-white" src={icon} alt="Logo" />
</div>
{@render children?.()}
