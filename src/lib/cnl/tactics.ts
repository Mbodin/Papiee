import { createTacticFromTextual } from './cnl_tactic';

const COMMENT = createTacticFromTextual<{ comment: string }>(
	'Comment',
	'{*|(|comment|)|}',
	({ value }) => `(*${value.comment}.*)`
);

const SPACES = createTacticFromTextual<{ comment: string }>('Spaces', '{*| |}', ({ value }) => ``);

/**
 * For testing purpose we define crude tactics the looks like rocq tactics
 */

/**
 * r : reasoning
 * end : the goal is supposedly empty
 */

const START = createTacticFromTextual<{}>('start', '{START||-+reasoning}', ({}) => '');

const ADMITTED = createTacticFromTextual<{}>('admitted', '{reasoning||-+end}', ({}) => 'admit.');

const DESTRUCTION = createTacticFromTextual<{ identifier: string }>(
	'destruction',
	'{reasoning|Analyse de cas sur |identifier|.|>+destruction}',
	({ value }) => `destruct ${value.identifier}.\n`
);

const DESTRUCT_ITEM = createTacticFromTextual<{}>(
	'destruct_item',
	'{destruction|-|+reasoning}',
	({ value }) => ``
);

const DESTRUCT_ITEM_END = createTacticFromTextual<{}>(
	'destruct_item_end',
	'{destruction end||#-}',
	({ value }) => ``
);

const DESTRUCTION_END = createTacticFromTextual<{}>(
	'destruction_end',
	'{destruction||--+end}',
	() => ''
);

const REWRITE_LEFT = createTacticFromTextual<{ rewrite: string }>(
	'rewrite_left',
	'{reasoning|rewrite < |rewrite|.|}',
	({ value }) => `rewrite < ${value.rewrite}.`
);

const REWRITE_RIGHT = createTacticFromTextual<{ rewrite: string }>(
	'rewrite_right',
	'{reasoning|rewrite > |rewrite|.|}',
	({ value }) => `rewrite < ${value.rewrite}.`
);

const REFLEXIVITY = createTacticFromTextual<{}>(
	'rewrite_right',
	'{reasoning|L\'égalité est triviale.|-+end}',
	({ value }) => `reflexivity.`
);

const APPLY = createTacticFromTextual<{ apply: string }>(
	'apply',
	'{reasoning|apply |apply|.|}',
	({ value }) => `apply ${value.apply}.`
);

const INTROS = createTacticFromTextual<{ identifier: string, inset: string }>(
	'intros',
	'{reasoning|Soit |identifier| \\in |inset|.|}',
	({ value }) => `\\letIn{${value.identifier}}{${value.inset}}.`
);

const SIMPL = createTacticFromTextual<{}>('simpl', '{reasoning|Simplifions.|}', () => `simpl.`);

const LEFT = createTacticFromTextual<{}>('left', '{reasoning|Montrons la propriété de gauche.|}', () => `left.`);

const RIGHT = createTacticFromTextual<{}>('right', '{reasoning|Montrons la propriété de droite.|}', () => `right.`);
