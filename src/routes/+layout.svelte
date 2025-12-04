<script lang="ts">
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={'assets/favicon.svg'} />
	<title>Papiée</title>
</svelte:head>

<div class="relative flex min-h-20 w-full flex-row items-center bg-surface-50-950 p-2">
	<img
		class="m-0 max-h-20 w-40 rounded-md bg-surface-50-950 scheme-light"
		src={'assets/icon.svg'}
		alt="Logo"
	/>

	<LightSwitch />
</div>
{@render children?.()}
