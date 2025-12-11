import { resolve } from '$app/paths';

export function absolute(origin: string, value: string): string {
	if (value.startsWith('/')) value = value.substring(1);
	let route = origin + resolve('/') + value;
	route = route.endsWith('/') ? route.substring(0, route.length - 1) : route;
	return route;
}
