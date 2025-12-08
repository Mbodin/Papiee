<script lang="ts">
	import { setLocale, getLocale } from '$lib/paraglide/runtime';

	let locale = getLocale();

	const toggleLang = () => {
		setLocale(locale === 'en' ? 'fr' : 'en');
	};
</script>

<button class="mx-5" onclick={() => toggleLang()}>
	{#if locale === 'fr'}
		🇫🇷
	{:else}
		🇬🇧
	{/if}
</button>
