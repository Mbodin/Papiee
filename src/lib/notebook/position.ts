export function array_position<T extends { position?: U }, U>(
	values: T[],
	update?: (v: T[]) => void
): { value: { index: number; position: U } | undefined } {
	return {
		get value() {
			const i0 = values.findIndex((v) => v.position != null);
			const i1 = values.findLastIndex((v) => v.position != null);
			if (i0 !== i1 || i0 === -1) return undefined;
			const i = i0;

			return {
				index: i,
				position: values[i].position!
			};
		},

		set value(v) {
			const { index, position } = v || { index: -1, position: undefined };
			if (!update) throw Error("Can't set array, no update function was given");
			update(
				values.map((v, i) => (i === index ? { ...v, position } : { ...v, position: undefined }))
			);
		}
	};
}
