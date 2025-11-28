export class Cache<K, V> {
	private map: Map<K, { value: V; time: number }> = new Map();

	public constructor(
		public capacity: number,
		public ondrop: (k: K, v: V) => void = () => {}
	) {}

	set(key: K, value: V): this {
		this.map.set(key, { value, time: new Date().getTime() });

		while (this.map.size > this.capacity) {
			const minimum = this.map
				.entries()
				.reduce(
					(a, b) => (a ? (Math.min(a[1].time, b[1].time) === a[1].time ? a : b) : b),
					undefined as [K, { value: V; time: number }] | undefined
				)!;
			this.ondrop(minimum[0], minimum[1].value);
			this.map.delete(minimum[0]);
		}

		return this;
	}

	get(key: K): { value: V } | undefined {
		const value = this.map.get(key);

		if (value) {
			this.map.set(key, { value: value.value, time: new Date().getTime() });
			return { value: value.value };
		}

		return undefined;
	}

	keys(): K[] {
		return [...this.map.keys()];
	}

	values(): V[] {
		return [...this.map.values()].map((v) => v.value);
	}
}
