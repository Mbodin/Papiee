export function restrictValueGeneric<T>(
	value: T,
	reference_points: T[],
	threshold: number = 0.05,
	map_to_reference: boolean = true,
	distance: (a: T, b: T) => number
) {
	let nearest_point_i = 0;
	let min_distance = Number.MAX_VALUE;

	reference_points.forEach((point, index) => {
		let current_distance = distance(value, point);
		if (current_distance < min_distance) {
			nearest_point_i = index;
			min_distance = current_distance;
		}
	});

	let point = value;

	if (min_distance < threshold || map_to_reference) {
		point = reference_points[nearest_point_i];
	}

	return point;
}
