export function debounced_get<T extends unknown[], U>(
	func: (...args: T) => U | PromiseLike<U>,
	debounce_time: number
): {
	(...args: T): Promise<U>;
	readonly waiting: boolean;
	readonly running: boolean;
} {
	let timeout: NodeJS.Timeout | undefined = undefined;
	let waiting = $state(false);
	let running = $state(false);
	async function reset_timeout(...args: T): Promise<U> {
		if (timeout) clearTimeout(timeout);
		waiting = true;

		return new Promise((resolve, _reject) => {
			timeout = setTimeout(() => {
				waiting = false;
				running = true;
				return Promise.try(() => func(...args))
					.then(resolve)
					.finally(() => (running = false));
			}, debounce_time);
		});
	}

	const callable: any = async (...args: T) => reset_timeout(...args);

	Object.defineProperty(callable, 'waiting', {
		get() {
			return waiting;
		}
	});

	Object.defineProperty(callable, 'running', {
		get() {
			return running;
		}
	});

	return callable;
}

export function debounced_task<T extends unknown[]>(
	func: (...args: T) => void | Promise<void>,
	debounce_time: number
): {
	(...args: T): Promise<void>;
	readonly waiting: boolean;
	readonly running: boolean;
} {
	return debounced_get(func, debounce_time);
}
