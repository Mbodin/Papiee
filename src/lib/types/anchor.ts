import { restrictValueGeneric } from '$lib/animation';

export type AnchorVDirection = 'bottom' | 'top';
export type AnchorHDirection = 'left' | 'right';
export type AnchorDiagonalDirection = `${AnchorVDirection}-${AnchorHDirection}`;

export type CardinalAnchor = AnchorVDirection | AnchorHDirection;
export type InBeetweenAnchor = `${CardinalAnchor}-middle` | AnchorDiagonalDirection;

export type AnchorPoint = { x: number; y: number };

export type CardinalAnchorPoint = AnchorPoint | CardinalAnchor;
export type InbeetweenAnchorPoint = AnchorPoint | InBeetweenAnchor;

export function fromAnchorToRelative(v: CardinalAnchor | InBeetweenAnchor): {
	x: -1 | 1 | 0;
	y: -1 | 1 | 0;
} {
	switch (v) {
		case 'top-middle':
		case 'top':
			return { x: 0, y: 1 };
		case 'top-right':
			return { x: 1, y: 1 };
		case 'right-middle':
		case 'right':
			return { x: 1, y: 0 };
		case 'bottom-right':
			return { x: 1, y: -1 };
		case 'bottom-middle':
		case 'bottom':
			return { x: 0, y: -1 };
		case 'bottom-left':
			return { x: -1, y: -1 };
		case 'left-middle':
		case 'left':
			return { x: -1, y: 0 };
		case 'top-left':
			return { x: -1, y: 1 };
	}
}

export function fromRealPointToCardinalAnchorPoint(point: AnchorPoint): CardinalAnchorPoint {
	return restrictValueGeneric<CardinalAnchorPoint>(
		point,
		['bottom', 'left', 'right', 'top'],
		undefined,
		false,
		(a, b) => {
			const point_a = fromAnchorToRealPoint(a);
			const point_b = fromAnchorToRealPoint(b);

			const dx = point_b.x - point_a.x;
			const dy = point_b.y - point_a.y;
			return 0;
		}
	) as CardinalAnchor;
}

export function fromRealPointToInbeetweenAchorPoint(point: AnchorPoint): InbeetweenAnchorPoint {
	return restrictValueGeneric<InbeetweenAnchorPoint>(
		point,
		[
			'bottom-left',
			'bottom-middle',
			'bottom-right',
			'left-middle',
			'right-middle',
			'top-left',
			'top-middle',
			'top-right'
		],
		0,
		true,
		(a, b) => {
			const point_a = fromAnchorToRealPoint(a);
			const point_b = fromAnchorToRealPoint(b);

			const dx = point_b.x - point_a.x;
			const dy = point_b.y - point_a.y;
			return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		}
	) as InBeetweenAnchor;
}

export function fromAnchorToRealPoint(v: CardinalAnchorPoint | InbeetweenAnchorPoint): AnchorPoint {
	if (typeof v === 'string') return fromAnchorToRelative(v);
	return v;
}
