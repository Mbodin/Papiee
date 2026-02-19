import { createTacticFromTextual } from './cnl_tactic';

const COMMENT = createTacticFromTextual<{ comment: string }>(
	'Comment',
	'{*|(|comment|)|}',
	({ value }) => `(*${value.comment}.*)`
);

const SPACES = createTacticFromTextual<{ comment: string }>('Spaces', '{*| |}', ({ value }) => ``);

/**
 * Main states:
 * - reasoning: main reasonning state.
 * - case: we are performing a case analysis.
 * - end: the goal is supposedly empty.
 */

const START = createTacticFromTextual<{}>('start', '{START||-+reasoning}', ({}) => '');

const ALREADY_PROVEN = createTacticFromTextual<{ property: string }>(
	'already_proven',
	'{reasoning|On a déjà montré que |property|.|}',
	({ value }) => `\\alreadyProven{${value.property}}`
);

const TO_BE_PROVEN = createTacticFromTextual<{ property: string }>(
	'to_be_proven',
	'{reasoning|Il faut montrer que |property|.|}',
	({ value }) => `\\toBeProven{${value.property}}`
);

const LET_IN = createTacticFromTextual<{ identifier: string, inset: string }>(
	'let_in',
	'{reasoning|Soit |identifier| \\in |inset|.|}',
	({ value }) => `\\letIn{${value.identifier}}{${value.inset}}.`
);

/* TODO: Soient x, y \in R, i \in N. → Implique d'ajouter des étoiles dans la grammaire cnl_tactic_specifier.ne
const INTRODUCTIONS1 = createTacticFromTextual<{ identifier: string, inset: string }>(
	'introductions1',
	'{reasoning|Soient |identifier| \\in |inset|,|-+intros}',
	({ value }) => `\\letIn{${value.identifier}}{${value.inset}}.`
);

const INTRODUCTIONS2 = createTacticFromTextual<{ identifier: string, inset: string }>(
	'introductions2',
	'{intros||identifier| \\in |inset|,|-+intros}',
	({ value }) => `\\letIn{${value.identifier}}{${value.inset}}.`
);

const INTRODUCTIONS3 = createTacticFromTextual<{}>(
	'introductions3',
	'{intros|.|-+reasoning}',
	({ value }) => `\\letIn{${value.identifier}}{${value.inset}}.`
);
*/

const LET_IN_PAIR = createTacticFromTextual<{ identifier1: string, identifier2: string,
																						  inset1: string, inset2: string }>(
	'let_in_pair',
	'{reasoning|Soient (|identifier1|, |identifier2|) \\in |inset1| \\times |inset2|.|}',
	({ value }) => `\\letInPair{${value.identifier1}}{${value.identifier2}}{${value.inset1}}{${value.inset2}}.`
);

const THEREFORE = createTacticFromTextual<{ property: string }>(
	'therefore',
	'{reasoning|On a donc |property|.|}',
	({ value }) => `\\therefore{${value.property}}`
);

const INTRODUCE_NAMED = createTacticFromTextual<{ identifier: string, property: string }>(
	'introduce_named',
	'{reasoning|Supposons la propriété |identifier| que |property|.|}',
	({ value }) => `\\introduceNamed{${value.identifier}}{${value.property}}.`
);

const INTRODUCE = createTacticFromTextual<{ property: string }>(
	'introduce',
	'{reasoning|Supposons que |property|.|}',
	({ value }) => `\\introduce{${value.property}}.`
);

const LETS_PROVE = createTacticFromTextual<{ property: string }>(
	'lets_prove',
	'{reasoning|Montrons que |property|.|}',
	({ value }) => `\\letsProve{${value.property}}.`
);

const QED = createTacticFromTextual<{}>(
	'qed',
	'{reasoning|Ce qu\'il fallait démontrer.|-+end}',
	({ value }) => `\\closeGoal{}`
);

const CASE_ANALYSIS = createTacticFromTextual<{}>(
	'case_analysis',
	'{reasoning|Procédons par analyse de cas.|>+case}',
	({ value }) => `\\caseBegin{}`
);

const CASE_ITEM = createTacticFromTextual<{ property: string }>(
	'case_item',
	'{case|- Si |property|.|+reasoning}',
	({ value }) => `\\caseItem{${value.property}}`
);

const CASE_ITEM_END = createTacticFromTextual<{}>(
	'case_item_end',
	'{case end||#-}',
	({ value }) => `\\caseItemEnd{}`
);

const DESTRUCTION_END = createTacticFromTextual<{}>(
	'case_end',
	'{case||--+end}',
	({ value }) => '\\caseEnd{}'
);

