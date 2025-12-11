<script lang="ts">
	import LangSwitch from '$lib/components/LangSwitch.svelte';
	import LightSwitch from '$lib/components/LightSwitch.svelte';
	import { absolute } from '$lib/route.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={absolute(origin, '/assets/favicon.svg')} />
	<title>Papiée</title>
</svelte:head>

<header class="sticky flex min-h-20 w-full flex-row items-center bg-surface-50-950 p-2">
	<div class="flex flex-row items-center gap-1">
		<img class="m-0 max-h-10 rounded-md" src={absolute(origin, '/assets/icon.svg')} alt="Logo" />
		<h1 class="h1">Papiée</h1>
	</div>
	<div class="flex-1"></div>
	<LangSwitch />
	<LightSwitch />
</header>
{@render children?.()}
