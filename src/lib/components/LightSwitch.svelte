<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';

	let dark = $state(false);

	$effect(() => {
		const mode = localStorage.getItem('mode') || 'light';
		dark = mode === 'dark';
	});

	const onCheckedChange = (event: { checked: boolean }) => {
		const mode = event.checked ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem('mode', mode);
		dark = event.checked;
	};
</script>

<svelte:head>
	<script>
		const mode = localStorage.getItem('mode') || 'light';
		document.documentElement.setAttribute('data-mode', mode);
	</script>
</svelte:head>

<button
	role="switch"
	aria-checked={dark}
	class="mx-5"
	onclick={() => onCheckedChange({ checked: !dark })}
>
	{#if dark}
		<Moon />
	{:else}
		<Sun />
	{/if}
</button>
