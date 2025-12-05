<script lang="ts">
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={'assets/favicon.svg'} />
	<title>Papiée</title>
</svelte:head>

<header class="sticky flex min-h-20 w-full flex-row items-center bg-surface-50-950 p-2">
	<div class="flex flex-row items-center gap-1">
		<img class="m-0 max-h-10 rounded-md" src={'assets/icon.svg'} alt="Logo" />
		<h1 class="h1">Papiée</h1>
	</div>
	<div class="flex-1"></div>
	<LightSwitch />
</header>
{@render children?.()}
