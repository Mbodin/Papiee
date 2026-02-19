export function value_derived<T>(getter: () => T, equal: (a: T, b: T) => boolean) {
	let derived_state = $derived.by(getter);

	let cached_value = $state(derived_state);

	$effect(() => {
		if (!equal(derived_state, cached_value)) cached_value = derived_state;
	});

	return {
		get value() {
			return (() => cached_value)();
		}
	};
}

export function value_derived_trivial<T extends number | string | boolean>(getter: () => T) {
	return value_derived(getter, (a, b) => a === b);
}
