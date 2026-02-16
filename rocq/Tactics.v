
From Stdlib Require Import Bool String.
From Stdlib Require Import Rdefinitions.
From Stdlib Require Import Lia Lra.
From Stdlib Require Import Logic.Classical_Prop.

Import List.ListNotations.


(* Hopefully, this function will never be called, but if it is, it should provide enough
  information for debugging. *)
Ltac internal_error fct msg :=
  fail "Error_internal{"fct"}{"msg"}".


(* * Common Notions *)

(* ** Sets *)

Definition set {T : Type} := T -> Prop.

Definition in_set {T : Type} (x : T) (S : set) := S x.

Notation "x '\in' S" := (in_set x S) (at level 70, no associativity).

Notation "'\forall' x .. y '\in' S ',' P" :=
  (forall x, x \in S -> .. (forall y, y \in S -> P) .. )
  (at level 99, x binder, y binder, P at level 200, right associativity).

Definition fullset (T : Type) : @set T := fun _ => True.
Opaque fullset.

Definition emptyset (T : Type) : @set T := fun _ => False.
Opaque emptyset.

Notation "'\emptyset'" := (emptyset _).

Definition setminus {T : Type} (S : @set T) (x : T) : @set T :=
  fun y => y \in S /\ y <> x.
Opaque setminus.

Notation "S '\setminus' x" := (setminus S x) (at level 52, left associativity).

Definition union {T : Type} (S1 S2 : @set T) : @set T :=
  fun x => x \in S1 \/ x \in S2.
Opaque union.

Notation "S1 '\union' S2" := (union S1 S2) (at level 57, right associativity).

Definition intersection {T : Type} (S1 S2 : @set T) : @set T :=
  fun x => x \in S1 /\ x \in S2.
Opaque intersection.

Notation "S1 '\inter' S2" := (intersection S1 S2) (at level 62, right associativity).

Definition Rset : set := fullset R.
Notation "'\mathbb{R}'" := Rset.

Definition Rsetstar : set := \mathbb{R} \setminus 0%R.
Notation "'\mathbb{R}^\star'" := Rsetstar.

Lemma Rsetstar_def : forall x, x \in \mathbb{R}^\star <-> (x <> 0)%R.
Proof. intro x. split; intro I; [apply I | repeat split; auto]. Qed.

Definition Rsetpositive : @set R := fun x => (x >= 0)%R.
Notation "'\mathbb{R}_+'" := Rsetpositive.

Lemma Rsetpositive_def : forall x, x \in \mathbb{R}_+ <-> (x >= 0)%R.
Proof. intro x. split; intro I; apply I. Qed.

Definition Rsetnegative : @set R := fun x => (x <= 0)%R.
Notation "'\mathbb{R}_-'" := Rsetnegative.

Lemma Rsetnegative_def : forall x, x \in \mathbb{R}_- <-> (x <= 0)%R.
Proof. intro x. split; intro I; apply I. Qed.

Definition Rsetpositivestar : @set R := fun x => (x > 0)%R.
Notation "'\mathbb{R}^\star_+'" := Rsetpositivestar.

Lemma Rsetpositivestar_def : forall x, x \in \mathbb{R}^\star_+ <-> (x > 0)%R.
Proof. intro x. split; intro I; apply I. Qed.

Definition Rsetnegativestar : @set R := fun x => (x < 0)%R.
Notation "'\mathbb{R}^\star_-'" := Rsetnegativestar.

Lemma Rsetnegativestar_def : forall x, x \in \mathbb{R}^\star_- <-> (x < 0)%R.
Proof. intro x. split; intro I; apply I. Qed.

Definition Nset : set := fullset nat.
Notation "'\mathbb{N}'" := Nset.

Definition Nsetstar : set := \mathbb{N} \setminus 0.
Notation "'\mathbb{N}^\star'" := Nsetstar.

Lemma Nsetstar_def : forall n, n \in \mathbb{N}^\star <-> (n <> 0)%N.
Proof. intro x. split; intro I; [apply I | repeat split; auto]. Qed.

Definition setprod {T1 T2 : Type} (S1 : @set T1) (S2 : @set T2) : @set (T1 * T2) :=
  fun '(x, y) => x \in S1 /\ y \in S2.
Opaque setprod.

Notation "S1 × S2" := (setprod S1 S2) (at level 67, right associativity).

Fixpoint typepower (T : Set) (n : nat) :=
  match n with
  | 0 => unit
  | 1 => T
  | S n => (T * typepower T n)%type
  end.

Fixpoint setpower_aux {T : Set} (S' : @set T) (n : nat) {struct n} : @set (typepower T (1 + n)) :=
  match n with
  | 0 => S'
  | S n' => S' × setpower_aux S' n'
  end.

Definition setpower {T : Set} (S' : @set T) (n : nat) : @set (typepower T n) :=
  match n with
  | 0 => fullset unit
  | S n' => setpower_aux S' n'
  end.

Notation "S '^{' n '}'" := (setpower S n) (at level 96, left associativity).

Definition powerset {T : Set} (S : @set T) : @set (@set T) := fullset set.

Notation "'\powerset' '{' S '}'" := (powerset S).


(* * Helper Tactics *)

(* ** Imports from LibTactics *)

(* [ltac_Mark] and [ltac_mark] are dummy definitions used as sentinel by tactics,
  to mark a certain position in the context or in the goal. *)

Inductive ltac_Mark : Type :=
  | ltac_mark : ltac_Mark.

(* [gen_until_mark] repeats generalize on hypotheses from the context, starting from
  the bottom and stopping as soon as reaching an hypothesis of type [ltac_Mark].
  It fails if [ltac_Mark] does not appear in the context. *)

Ltac gen_until_mark :=
  lazymatch goal with H: ?T |- _ =>
    lazymatch T with
    | ltac_Mark => clear H
    | _ => generalize H; clear H; gen_until_mark
    end
  end.

(* [intro_until_mark] repeats [intro] until reaching an hypothesis of type [ltac_Mark].
  It throws away the hypothesis [ltac_Mark].
  It fails if [ltac_Mark] does not appear as an hypothesis in the goal. *)

Ltac intro_until_mark :=
  lazymatch goal with
  | |- (ltac_Mark -> _) => intros _
  | _ => intro; intro_until_mark
  end.

(* [show tac] executes a tactic tac that produces a result, and then display its result. *)

Tactic Notation "show" tactic(tac) :=
  let R := tac in pose R.

(* Get the last introduced hypothesis (useful to know what is its default name). *)
Ltac get_last_hypothesis :=
  lazymatch goal with
  | H : _ |- _ => constr:(H)
  end.


(* ** Other local tactics *)

(* *** Unit tests *)

(* Check that two expressions are identical. *)
Ltac check_same x y :=
  lazymatch x with
  | y => idtac
  | _ => fail
  end.

(* This file contains several unit tests, in the form of [Check ltac:(...)].
  The tactic called within are defined here.
  They are accompagnied by their own unit tests, checking that they are working,
  and that they are indeed failing when they need to (hence the [Fail Check] below. *)

(* Given a tactic result and the expected result, check that they are the same.
  Useful for unit tests. *)
Ltac unit_test v1 v2 :=
  (check_same v1 v2 ; exact tt) || fail "Failed unit test".

Check ltac:(unit_test ltac:(constr:(1)) 1).
Fail Check ltac:(unit_test ltac:(constr:(1)) 2).
Fail Check ltac:(unit_test ltac:(fail) 1).

(* Given a tactic and a goal, the tactic should solve this goal. *)
Ltac goal_test_solve tac g :=
  let P := fresh in
  (assert (P : g) ; [ solve [ tac ] | exact tt ]) || fail "Failed unit test".

Check ltac:(goal_test_solve ltac:(exact I) True).
Fail Check ltac:(goal_test_solve ltac:(exact I) False).
Fail Check ltac:(goal_test_solve ltac:(fail) True).

(* Given a tactic and a goal, the tactic should not solve this goal. *)
Ltac goal_test_solve_fail tac g :=
  let P := fresh in
  (assert (P : g) ; [ solve [ tac ] |] ; fail 1 "This unit test should have failed") || exact tt.

Fail Check ltac:(goal_test_solve_fail ltac:(exact I) True).
Check ltac:(goal_test_solve_fail ltac:(exact I) False).
Check ltac:(goal_test_solve_fail ltac:(fail) True).

(* Given a tactic and two goals, the tactic should move from one goal to the other. *)
Ltac goal_test_step tac g1 g2 :=
  let P := fresh in
  ((assert (P : g1) ; [
      tac ;
      repeat lazymatch goal with H : _ |- _ => generalize H; clear H end ;
      lazymatch goal with |- g2 => fail 1 end
    | exact tt ]) || fail 1 "Failed unit test") || exact tt.

Check ltac:(goal_test_step ltac:(idtac) False False).
Check ltac:(goal_test_step ltac:(intro x) (forall x : nat, x = x) (forall x : nat, x = x)).
Fail Check ltac:(goal_test_step ltac:(idtac) False True).
Fail Check ltac:(goal_test_step ltac:(fail) True True).

(* Given a tactic and a goal, the tactic should fail to apply on this goal. *)
Ltac goal_test_step_fail tac g :=
  let P := fresh in
  ((assert (P : g) ; [
      tac ;
      repeat lazymatch goal with H : _ |- _ => clear H || (generalize H; clear H) end ;
      fail 1
    | exact tt ]) || exact tt) || fail "This unit test should have failed".

Fail Check ltac:(goal_test_step_fail ltac:(idtac) True).
Check ltac:(goal_test_step_fail ltac:(fail) True).


(* *** Tactics for expressions *)

Inductive Kind :=
  | Kind_Expression
  | Kind_Type
  | Kind_Property (* Proof statement *)
  | Kind_Proof (* Proof term *)
  .

(* Return the kind (expression / type / property) of a Gallina object. *)
Ltac get_kind t :=
  lazymatch type of t with
  | Prop => constr:(Kind_Property)
  | ?t' =>
    lazymatch type of t' with
    | Set => constr:(Kind_Expression)
    | Prop => constr:(Kind_Proof)
    | Type => constr:(Kind_Type)
    | _ => internal_error "get_kind"%string t
    end
  end.

Check ltac:(unit_test ltac:(get_kind 1) Kind_Expression).
Check ltac:(unit_test ltac:(get_kind true) Kind_Expression).
Check ltac:(unit_test ltac:(get_kind (1 > 2)) Kind_Property).
Check ltac:(unit_test ltac:(get_kind (eq_refl true)) Kind_Proof).
Check ltac:(unit_test ltac:(get_kind (true = false)) Kind_Property).
Check ltac:(unit_test ltac:(get_kind True) Kind_Property).
Check ltac:(unit_test ltac:(get_kind nat) Kind_Type).


(* *** Tactics for dealing with goals and hypotheses *)

(* Create a new internal name.
  Both its name and its type should be hidden from the user. *)
Ltac new_private := fresh "__private_prop_".

(* Create a new internal name.
  Its name should be hidden from the user, but not its type. *)
Ltac new_name := fresh "__internal_name_".

Inductive warning (s : string) : Type := Warn.

(* Add a warning among the hypotheses. *)
Ltac add_warning msg :=
  let H := fresh "__warning" in
  pose proof (H := @Warn msg).

(* Return the current goal. *)
Ltac current_goal :=
  lazymatch goal with
  |- ?g => constr:(g)
  end.

(* The interface communicate to the proof assistant by chaining tactics.
  It does not know anything about the structure of the inner proof.
  In particular, the interface is not aware whether a proof solved the current goal or not.
  Thus, tactics should not solve the current goals without explicitely asked by the interface.
  If a tactic morally should have solved the goal, it replaces it by this trivial goal. *)
Inductive solved_goal : Type := Solved.

(* Forces a tactic to solve the goal, but keep the current goal with this place-holder goal. *)
Ltac conclude tac :=
  let H := new_private in
  (assert (H : solved_goal); [| solve [ tac ] ]) ;
  repeat lazymatch goal with
  | H : _ |- _ => clear H
  end.

Check ltac:(goal_test_step ltac:(conclude trivial) True solved_goal).

Ltac solve_solved := exact Solved.

Check ltac:(goal_test_solve ltac:(solve_solved) solved_goal).

(* If the goal is not solved, execute the tactic, otherwise add a warning. *)
Ltac assume_not_solved tac :=
  lazymatch goal with
  | |- solved_goal => add_warning "The goal has already been solved."%string
  | |- _ => tac tt
  end.

(* Some tactics leave the goal in a state in which only a specific set of tactics can be
  applied: this type traces this restriction. *)
Inductive restriction : Type :=
  | restriction_caseItem (* Expects a \caseItem or a \caseEnd. *).

(* This is the type of the goal once restricted. *)
Inductive tactic_restriction (r : restriction) (P : Prop) : Prop := Tactic_restriction (p : P).

Notation "P" := (tactic_restriction _ P) (only printing, at level 200).

Lemma tactic_restriction_intro : forall r P, tactic_restriction r P -> P.
Proof. intros r P []. trivial. Qed.

(* Restrict the goal with the provided restriction. *)
Ltac restrict_goal r :=
  let g := current_goal in
  apply (@tactic_restriction_intro r g).

Lemma tactic_restriction_elim : forall r P, P -> tactic_restriction r P.
Proof. intros. constructor. trivial. Qed.

(* Remove the current restriction from the goal. *)
Ltac unrestrict :=
  lazymatch goal with
  | |- tactic_restriction _ _ => apply tactic_restriction_elim
  | |- _ => internal_error "unrestrict"%string
  end.

(* Like [assume_not_solved], but also checks that the goal is not restricted. *)
Ltac assume_proof_mode tac :=
  assume_not_solved ltac:(fun _ =>
    lazymatch goal with
    | |- tactic_restriction _ _ =>
      add_warning "Unexpected tactic at this point (call \help{} for more detail)."%string
    | |- _ => tac tt
    end).

(* On the contrary, this tactic checks that indead the goal is restricted as expected. *)
Ltac assume_proof_restriction r tac :=
  assume_not_solved ltac:(fun _ =>
    lazymatch goal with
    | |- tactic_restriction r _ => unrestrict ; tac tt
    | |- _ =>
      add_warning "Unexpected tactic at this point (call \help{} for more detail)."%string
    end).


(* * Solver Tactics *)

(* Whether an object is a syntactic natural number. *)
Ltac is_nat_literal n :=
  lazymatch n with
  | (S ?x)%nat => is_nat_literal x
  | 0%nat => constr:(true)
  | _ => constr:(false)
  end.

Check ltac:(unit_test ltac:(is_nat_literal 42%nat) true).
Check ltac:(unit_test ltac:(is_nat_literal (1 + 1)%nat) false).
Check ltac:(unit_test ltac:(is_nat_literal 42%R) false).

Ltac is_positive_literal p :=
  lazymatch p with
  | xI ?p' => is_positive_literal p'
  | xO ?p' => is_positive_literal p'
  | xH => constr:(true)
  | _ => constr:(false)
  end.

(* Whether an object is a syntactic real number. *)
Ltac is_real_literal r :=
  lazymatch r with
  | IZR ?z =>
    lazymatch z with
    | Zpos ?p => is_positive_literal p
    | Zneg ?p => is_positive_literal p
    | Z0 => constr:(true)
    | _ => constr:(false)
    end
  | R1 => constr:(true)
  | R0 => constr:(true)
  | _ => constr:(false)
  end.

Check ltac:(unit_test ltac:(is_real_literal 42%R) true).
Check ltac:(unit_test ltac:(is_real_literal 42%nat) false).
Check ltac:(unit_test ltac:(is_real_literal (1 + 1)%R) false).

(* Number of non-trivial subterms of a term. *)
Ltac num_non_trivial_subterms x :=
  lazymatch x with
  | ?op ?y ?z =>
    let op_simple :=
      lazymatch op with
      | Nat.add => constr:(true)
      | Nat.mul => constr:(true)
      | Nat.sub => constr:(true)
      | Rplus => constr:(true)
      | Rmult => constr:(true)
      | Rminus => constr:(true)
      | _ => constr:(false)
      end in
    lazymatch op_simple with
    | true =>
      let n1 := num_non_trivial_subterms y in
      let n2 := num_non_trivial_subterms z in
      (eval compute in (n1 + n2)%nat)
    | false => constr:(1%nat)
    end
  | _ =>
    let xnat := is_nat_literal x in
    let xreal := is_real_literal x in
    (eval compute in (if xnat || xreal then 0 else 1)%nat)
  end.
       

(* Whether an object is basic, or composed of more complex objects. *)
Ltac is_basic_def o :=
  lazymatch o with
  | _ _ =>
    let onat := is_nat_literal o in
    let oreal := is_real_literal o in
    (eval compute in (if onat || oreal then true else false))
  | _ => constr:(true)
  end.

Check ltac:(unit_test ltac:(is_basic_def \mathbb{R}) true).
Check ltac:(unit_test ltac:(is_basic_def \mathbb{N}) true).
Check ltac:(unit_test ltac:(is_basic_def (\mathbb{R} \setminus 1)%R) false).
Check ltac:(unit_test ltac:(is_basic_def 42%nat) true).

(* Check whether a property is simple.
  We consider a property to be “simple” in the following cases:
  - x \in S, where S is a definition (and not a composition of several sets with e.g. [\union]),
  - An equality involving only two variables or non-trivial objects. *)
Ltac is_simple P :=
  lazymatch P with
  | ?x \in ?S =>
    let xBasic := is_basic_def x in
    let SBasic := is_basic_def S in
    (eval compute in (xBasic && SBasic))
  | ?c ?x ?y =>
    let cmp_ok :=
      lazymatch c with
      | @eq _ => constr:(true)
      | lt => constr:(true)
      | gt => constr:(true)
      | Rlt => constr:(true)
      | Rgt => constr:(true)
      | _ => constr:(false)
      end in
    lazymatch cmp_ok with
    | true =>
      let nx := num_non_trivial_subterms x in
      let ny := num_non_trivial_subterms y in
      (eval compute in (nx + ny <=? 2)%nat)
    | false => constr:(false)
    end
  | ~ ~ _ => constr:(false)
  | ~ ?P' => is_simple P'
  | True => constr:(true)
  | False => constr:(true)
  | _ =>
    let k := get_kind P in
    lazymatch k with
    | Kind_Type => constr:(true) (* This is just a definition, not really a proposition. *)
    | _ => constr:(false)
    end
  end.

Check ltac:(unit_test ltac:(is_simple (42 = 1 + 1)%R) true).
Check ltac:(unit_test ltac:(is_simple (1%nat \in \mathbb{N}^\star)) true).
Check ltac:(unit_test ltac:(is_simple (1 \in \mathbb{N} \setminus 2)%nat) false).

(* Given a statement, provide a lemma that unfold its definitions, or [None]. *)
Ltac unfold_def_lemma H :=
  lazymatch H with
  | _ \in ?S =>
    lazymatch S with
    | \mathbb{R}^\star => constr:(Rsetstar_def)
    | \mathbb{R}_+ => constr:(Rsetpositive_def)
    | \mathbb{R}_- => constr:(Rsetnegative_def)
    | \mathbb{R}^\star_+ => constr:(Rsetpositivestar_def)
    | \mathbb{R}^\star_- => constr:(Rsetnegativestar_def)
    | \mathbb{N}^\star => constr:(Nsetstar_def)
    end
  | _ => constr:(@None Prop)
  end.

(* Simplify even further simple hypotheses. *)
Ltac simplify H :=
  let t := type of H in
  let T := unfold_def_lemma t in
  lazymatch T with
  | @None Prop => idtac
  | _ => apply T in H
  end.

(* Simplify even further simple goals. *)
Ltac simplify_goal :=
  let t := current_goal in
  let T := unfold_def_lemma t in
  lazymatch T with
  | @None Prop => idtac
  | _ => apply T
  end.

(* Only keep simple hypotheses. *)
Ltac filter_simple :=
  generalize ltac_mark ;
  repeat lazymatch goal with
  | H : ?t |- _ =>
    let s := is_simple t in
    lazymatch s with
    | true => simplify H ; generalize H ; clear H
    | false => clear H
    end
  end ;
  intro_until_mark.

(* Only succeeds (and do nothing) if the goal is simple. *)
Ltac goal_is_simple :=
  lazymatch goal with
  | |- ?g =>
    let s := is_simple g in
    lazymatch s with
    | true => idtac
    | false => fail
    end
  end.

(* This tactic should correspond to a “trivial” step in the proof for the students's level. *)
Ltac trivial_to_prove :=
  solve [
   intros ;
   repeat first
     [ (* Really, really simple proofs. *)
       solve [ trivial ]
     | (* Proofs of the form [exists x, P x] when there is an object [P x] in the context. *)
       (* FIXME: Do we want to force the students to do it explicitly? *)
       eassumption
     | (* Proofs by computations. *)
       goal_is_simple ; filter_simple ; simplify_goal ; (assumption || lia || lra)
     | split; intros ] ]
  || lazymatch goal with |- ?g => fail "Error_trivial_to_prove{"g"}" end.

Check ltac:(goal_test_solve ltac:(trivial_to_prove) (1%R \in \mathbb{R})).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (1%R \in \mathbb{R}^\star)).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (1%R \in \mathbb{R}_+)).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (\forall x \in \mathbb{R}^\star, (x <> 0)%R)).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (\forall n \in \mathbb{N}^\star, n \in \mathbb{N})).
Check ltac:(goal_test_solve_fail ltac:(trivial_to_prove) (forall x, exists y, x = y + 1)).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (forall x : nat, x = x)).
Check ltac:(goal_test_solve ltac:(trivial_to_prove) (forall x : nat, x + 1 = 1 + x)).


(* * Interface Tactics *)

(* All the tactics defined below in the shape of a LaTeX command
  (like \letIn{…}{…}) are meant to be use by the GUI as basic blocks
  for student reasonning.
  The rationnale is that the same script could be used to format TeX documents
  into a readable proof.
  When these tactics fail, they always return a string of the form
  [fail "Error_code"{args}{…}] to simplify the parsing of their response. *)

(* ** Linear Tactics (don't add or remove goals) *)

(* *** \letIn{variable}{set}: Introduce a variable. *)

(* Ensure that the provided variable is fresh within the environment. *)
Ltac ensure_variable_fresh x :=
  try (let t := type of x in fail 1 (* Passes through the [try]. *)).

Check ltac:(goal_test_step_fail ltac:(intro x; ensure_variable_fresh x) (forall x : unit, x = x)).
Check ltac:(goal_test_step ltac:(intro x; ensure_variable_fresh y)
              (forall x : unit, x = x) (forall x : unit, x = x)).

(* The tactic notation [tac1 || tac2] doesn't mean that [tac2] will be executed iff [tac1] failed:
  instead it means that [tac2] will be executed iff [tac1] failed *to progress*.
  We thus use the less readable [first [tac1 | fail 1 msg]]-style instead. *) 

Tactic Notation "\letIn" "{" ident(x) "}" "{" constr(S) "}" :=
  assume_proof_mode ltac:(fun _ =>
    first [ ensure_variable_fresh x | fail 1 "Error_letIn_alreadyTaken{"x"}" ] ;
    (* We first introduce an hypothesis as-is. *)
    first [ intro | fail 1 "Error_letIn_nothingToIntro" ] ;
    let y := get_last_hypothesis in
    first [ check_same y x | fail 1 "Error_letIn_wrongName{"x"}{"y"}" ] ;
    let k := get_kind y in
    lazymatch k with
    | Kind_Property =>
      let t := type of y in
      fail "Error_letIn_introProp{"t"}"
    | Kind_Proof =>
      let t := type of y in
      fail "Error_letIn_introProp{"t"}"
    | _ =>
      let next _ :=
        let H' := new_name in
        assert (H' : y \in S) ; [ trivial_to_prove |] in
      lazymatch goal with
      | |- y \in ?S' -> _ =>
        let H := new_private in
        intro H ;
        next tt ;
        first [ check_same S S' | add_warning "not_same_set"%string ] ;
        clear H
      | |- _ => next tt
      end
    end).

(* ===============================
   \forall x \in \mathbb{N}, x = x
\letIn{x}{\mathbb{N}}
   x \in \mathbb{N}
   ================
   x = x *)
Check ltac:(goal_test_step ltac:(\letIn{x}{\mathbb{N}})
              (\forall x \in \mathbb{N}, x = x) (\forall x \in \mathbb{N}, x = x)).

(* =====================================
   \forall x \in \mathbb{N}^\star, x = x
\letIn{x}{\mathbb{N}}
   x \in \mathbb{N}
   ================
   x = x *)
Check ltac:(goal_test_step ltac:(\letIn{x}{\mathbb{N}})
              (\forall x \in \mathbb{N}^\star, x = x)
              (\forall x \in \mathbb{N}, warning "not_same_set" -> x = x)).

(* =====================
   forall x : nat, x = x
\letIn{x}{\mathbb{N}}
   x \in \mathbb{N}
   ================
   x = x *)
Check ltac:(goal_test_step ltac:(\letIn{x}{\mathbb{N}})
              (forall x : nat, x = x) (\forall x \in \mathbb{N}, x = x)).

(* ==============================
   forall x \in \mathbb{N}, x = x
\letIn{y}{\mathbb{N}}
   fail "Error_letIn_wrongName{x}{y}" *)
Check ltac:(goal_test_step_fail ltac:(\letIn{y}{\mathbb{N}})
              (\forall x \in \mathbb{N}, x = x)).

(* ==============================
   forall x \in \mathbb{N}, x = x
\letIn{1}{\mathbb{N}} (* This currently returns a syntax error. *)
   fail "Error_letIn_notAnIdentifier{1}" *)

(* ============
   True -> True
\letIn{x}{Type}
   fail "Error_letIn_introProp{True}" *)
Check ltac:(goal_test_step_fail ltac:(\letIn{x}{Type}) (True -> True)).

(* ====
   True
\letIn{x}{Type}
   fail "Error_letIn_nothingToIntro" *)
Check ltac:(goal_test_step_fail ltac:(\letIn{x}{Type}) (True)).

(* ===============================
   \forall x \in \mathbb{N}, x = x
\letIn{x}{\mathbb{N}^\star}
   fail "Error_trivial_to_prove{( x <> 0 )}" *)
Check ltac:(goal_test_step_fail ltac:(\letIn{x}{\mathbb{N}^\star}) (\forall x \in \mathbb{N}, x = x)).


(* *** \letInPair{variable}{set}: Introduce a pair of variables. *)

Ltac applyIfPair f t :=
  lazymatch t with
  | (?a * ?b)%type => f a b t
  | _ => fail "Error_letInPair_notAPair"
  end.

(* This function calls [\letIn{}{}], and thus some of its error codes will be in [Error_letIn]
  instead of [Error_letInPair]. *)

Tactic Notation "\letInPair" "{" ident(x) "}" "{" ident(y) "}" "{" constr(S1) "}" "{" constr(S2) "}" :=
  assume_proof_mode ltac:(fun _ =>
    first [ ensure_variable_fresh x | fail 1 "Error_letIn_alreadyTaken{"x"}" ] ;
    first [ ensure_variable_fresh y | fail 1 "Error_letIn_alreadyTaken{"y"}" ] ;
    let go xy :=
      \letIn{xy}{(S1 × S2)} ;
      destruct xy as [x y] ;
      let H1 := new_name in
      let H2 := new_name in
      (assert (H1 : x \in S1) ; [ trivial_to_prove |]) ;
      (assert (H2 : y \in S2) ; [ trivial_to_prove |]) ;
      lazymatch goal with H : (x, y) \in (S1 × S2) |- _ => try clear H end in
    lazymatch goal with
    | |- forall xy, _ => go xy
    | |- _ => fail "Error_letIn_nothingToIntro"
    end).

(* ===========================================
   \forall p \in \mathbb{N} × \mathbb{N}, p = p
\letInPair{x}{y}{\mathbb{N}}{\mathbb{N}}
   x \in \mathbb{N}
   y \in \mathbb{N}
   ================
   (x, y) = (x, y) *)
Check ltac:(goal_test_step ltac:(\letInPair{x}{y}{\mathbb{N}}{\mathbb{N}})
              (\forall p \in \mathbb{N} × \mathbb{N}, p = p)
              (forall x y, x \in \mathbb{N} -> y \in \mathbb{N} -> (x, y) = (x, y))).


(* *** \therefore{property}: Add an hypothesis that can easily be deduced from the context, or solve the current goal if the goal was syntactically provided. *)

Tactic Notation "\therefore" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    let H := new_name in
    assert (H : P) ; [ trivial_to_prove |] ;
    lazymatch goal with
    | |- P => conclude ltac:(exact H)
    | |- _ => idtac
    end).

(* =====
   False
\therefore{True}
   True
   =====
   False *)
Check ltac:(goal_test_step ltac:(\therefore{True}) False (True -> False)).

(* x \in \mathbb{N}
   y \in \mathbb{N}
   z \in \mathbb{N}
   x = y
   z = y
   ================
   False
\therefore{(x = z)}
   x \in \mathbb{N}
   y \in \mathbb{N}
   z \in \mathbb{N}
   x = y
   z = y
   x = z
   ================
   False *)
Check ltac:(goal_test_step ltac:(intros; \therefore{(x = z)})
              (\forall x y z \in \mathbb{N}, x = y -> z = y -> False)
              (\forall x y z \in \mathbb{N}, x = y -> z = y -> x = z -> False)).

(* ===============================
   \forall x \in \mathbb{N}, x = x
\therefore{\forall x \in \mathbb{N}, x = x}
   Solves the goal. *)
Check ltac:(goal_test_step ltac:(\therefore{(\forall x \in \mathbb{N}, x = x)})
              (\forall x \in \mathbb{N}, x = x) solved_goal).


(* *** \introduceNamed{name}{property}: Introduce a named property. *)

Tactic Notation "\introduceNamed" "{" ident(H) "}" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    first [ ensure_variable_fresh H | fail 1 "Error_introduceNamed_alreadyTaken{"H"}" ] ;
    first [ intro H | fail 1 "Error_letIn_nothingToIntro" ] ;
    let k := get_kind H in
    lazymatch k with
    | Kind_Proof =>
      let HP := type of H in
      let E := new_private in
      (assert (E : HP <-> P); [ clear H; trivial_to_prove |]) ;
      try (
        add_warning "not_same_property"%string ;
        progress rewrite E in H (* Fails if identical. *)) ;
      clear E
    | _ =>
      let t := type of H in
      fail "Error_introduce_notAProp{"t"}"
    end).

(* =============
   True -> False
\introduceNamed{H}{True}
   H : True
   ========
   False *)
Check ltac:(goal_test_step ltac:(\introduceNamed{H}{True}) (True -> False) (True -> False)).

(* =====================
   forall x : nat, x = x
\introduceNamed{x}{nat}
   fail "Error_introduce_notAProp{nat}" *)
Check ltac:(goal_test_step_fail ltac:(\introduceNamed{H}{nat}) (forall x : nat, x = x)).

(* x \in \mathbb{N}
   ================
   True -> x = x
\introduceNamed{x}{True}.
   fail "Error_introduceNamed_alreadyTaken{x}" *)
Check ltac:(goal_test_step_fail ltac:(\letIn{x}{\mathbb{N}} ; \introduceNamed{x}{True})
              (\forall x \in \mathbb{N}, True -> x = x)).

(* ** \introduce{property}: Introduce a property. *)

Tactic Notation "\introduce" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    let H := new_name in
    \introduceNamed{H}{P}).

(* =============
   True -> False
\introduce{True}
   True
   =====
   False *)
Check ltac:(goal_test_step ltac:(\introduce{True}) (True -> False) (True -> False)).

(* =====================
   forall x : nat, x = x
\introduce{nat}
   fail "Error_introduce_notAProp{nat}" *)
Check ltac:(goal_test_step_fail ltac:(\introduce{nat}) (forall x : nat, x = x)).

(* x \in \mathbb{N}
   y \in \mathbb{N}
   ================
   x = y -> False
\introduce{(y = x)}
   x \in \mathbb{N}
   y \in \mathbb{N}
   y = x
   ================
   False *)
Check ltac:(goal_test_step ltac:(\letIn{x}{\mathbb{N}} ; \letIn{y}{\mathbb{N}} ; \introduce{(y = x)})
              (\forall x y \in \mathbb{N}, x = y -> False)
              (\forall x y \in \mathbb{N}, y = x -> warning "not_same_property" -> False)).

(* x \in \mathbb{N}
   y \in \mathbb{N}
   ================
   x = y -> False
\introduce{(x = x)}
   fail *)
Check ltac:(goal_test_step_fail ltac:(\letIn{x}{\mathbb{N}} ; \letIn{y}{\mathbb{N}} ; \introduce{(x = x)})
              (\forall x y \in \mathbb{N}, x = y -> False)).

(* *** Assertive tactics (don't change much in the context) *)

(* These tactics don't change anything in the goal, but help to structure the proof. *)

(* **** \alreadyProven{P}: check that something has already been proven. *)

Tactic Notation "\alreadyProven" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    let H := new_private in
    assert (H : P) ; [ trivial_to_prove || add_warning "not_yet_proven"%string |] ;
    clear H).

Check ltac:(goal_test_step ltac:(\letIn{n}{\mathbb{N}} ; \introduce{(n > 2)} ; \alreadyProven{(n > 2)})
              (\forall n \in \mathbb{N}, n > 2 -> n > 1)
              (\forall n \in \mathbb{N}, n > 2 -> n > 1)).

Check ltac:(goal_test_step_fail ltac:(\letIn{n}{\mathbb{N}} ; \alreadyProven{(n > 2)})
              (\forall n \in \mathbb{N}, n > 1)).

(* **** \toBeProven{P}: check that the goal is of the form. *)

Tactic Notation "\toBeProven" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    lazymatch goal with
    | |- ?G =>
      let E := new_private in
      assert (E : G <-> P) ; [ trivial_to_prove |] ;
      rewrite E;
      clear E
    end).

Check ltac:(goal_test_step ltac:(\letIn{n}{\mathbb{N}} ; \introduce{(n > 2)} ; \toBeProven{(1 < n)})
              (\forall n \in \mathbb{N}, n > 2 -> n > 1)
              (\forall n \in \mathbb{N}, n > 2 -> 1 < n)).


(* ** (Linears) Tactics with Databases *)

(* TODO *)
(*
\addFromContext{forall x, ...}
  Ajoute l'énoncé du théorème dans le contexte, avec une base de données de noms.
  « D'après le théorème des valeurs intermédiaires, il existe x »
  Question : une notation par théorème ?


\have{forall x, ...}
    « On a ... »
    Propriété dans une base de donnée (ou qui en découle vu le contexte) ajoutée au contexte.

(* =====================
   True *)
\byNamed{Th_pythagorean}
(* Th_pythagorean : a^2 + b^2 = c^2
   ================
   True *)

(* =====================
   True *)
\forwardUnnamed{forall x, P x}{P 1}
(* __anonymous__ : P 1
   ================
   True *)
 *)


(* ** Structural Tactics (add and/or remove goals) *)

(* *** \letsProve{P}: Prove an intermediary lemma. *)

Tactic Notation "\toBeProven" "{" constr(P) "}" :=
  assume_proof_mode ltac:(fun _ =>
    let E := new_name in
    assert (E : P)).


(* *** \closeGoal{}: Closes the goal (possibly admitting its result). *)

Tactic Notation "\closeGoal" "{" "}" :=
  lazymatch goal with
  | |- solved_goal => solve_solved
  | |- _ =>
      (* The goal was not solved, but for structual reason we need to close it.
      We thus try to solve it or we admit it (preventing the ability to QED the theorem). *)
      trivial_to_prove || admit
  end.

(* *** Case Analysis *)

(* In a case analysis, we need to check at the end of it that all cases have indeed been considered.
  In contrary to Vanilla Rocq, we let the user state all the cases, in any order.
  We thus need a way to track the considered cases, as a list of propositions.
  As case-analyses can be nested, we also need to keep track of the parents's propositions, hence
  the list of lists.
  As an invariant, there exists an hypothesis of the form [P -> current_goal] for each of the
  properties [P] of the head of the current list. *)
Inductive case_item_prop_lists (hyps : list (list Prop)) := Case_item_props.

(* Called before a case analysis, setting up the environment for it. *)
Tactic Notation "\caseBegin" "{" "}" :=
  assume_proof_mode ltac:(fun _ =>
    let go L :=
      let H := new_private in
      pose proof (H := @Case_item_props (nil :: L)%list) ;
      restrict_goal restriction_caseItem in
    lazymatch goal with
    | H : case_item_prop_lists ?L |- _ => clear H ; go L
    | _ => go (@nil (list Prop))
    end).

Check ltac:(goal_test_step ltac:(\caseBegin{}) False
              (case_item_prop_lists (nil :: nil)%list ->
               tactic_restriction restriction_caseItem False)).
Check ltac:(goal_test_step ltac:(intros; \caseBegin{})
             (case_item_prop_lists [[True; False]%list] -> False)
             (case_item_prop_lists [nil; [True; False]]%list ->
              tactic_restriction restriction_caseItem False)).

Ltac get_case_item_prop_lists :=
  lazymatch goal with
  | H : case_item_prop_lists ?L |- _ => constr:(L)
  | _ => internal_error "get_case_item_prop_lists"%string
  end.

Ltac set_case_item_prop_lists L :=
  lazymatch goal with
  | H : case_item_prop_lists _ |- _ =>
    clear H ;
    pose proof (H' := @Case_item_props L)
  | _ => internal_error "set_case_item_prop_lists"%string
  end.

Ltac add_case_item_prop_lists P :=
  let L := get_case_item_prop_lists in
  lazymatch L with
  | (?Ps :: ?L')%list => set_case_item_prop_lists ((P :: Ps) :: L')%list
  | _ => internal_error "add_case_item_prop_lists"%string
  end.

(* Called within a case analysis, in the beginning of a case, with the considered property. *)
Tactic Notation "\caseItem" "{" constr(P) "}" :=
  assume_proof_restriction restriction_caseItem ltac:(fun _ =>
    let k := get_kind P in
    lazymatch k with
    | Kind_Property =>
      let L := get_case_item_prop_lists in
      let H := new_private in
      let G := current_goal in
      assert (H : P -> G) ;
      [ let Hp := new_name in intro Hp
      | add_case_item_prop_lists P ;
        restrict_goal restriction_caseItem ]
    | _ => fail "Error_caseItem_{"P"}"
    end).

(* Called at the end of a case-item. *)
Tactic Notation "\caseItemEnd" "{" "}" :=
  \closeGoal{}.

(* Called at the end of a case: checks that all cases have been covered. *)
Tactic Notation "\caseEnd" "{" "}" :=
  assume_proof_restriction restriction_caseItem ltac:(fun _ =>
    let L := get_case_item_prop_lists in
    lazymatch L with
    | (?Ps :: ?L')%list =>
      let G := current_goal in
      let rec test_all Ps :=
        lazymatch Ps with
        | (?P :: ?Ps')%list =>
          let H := new_name in  
          destruct (classic P) as [H|H] ;
          [ (* Case [P] *)
            lazymatch goal with
            | I : P -> G |- _ => exact (I H)
            | _ => internal_error "caseEnd_missingImplication"%string
            end
          | (* Case [~P] *)
            test_all Ps' ]
        | nil =>
          (* There should be enough properties to cover all cases, and we took the
            negation of all these properties along the way: this case should be
            proven inconsistent. *)
          try (
           exfalso ;
           trivial_to_prove || fail 1 "Error_caseEnd_notAllCases")
        | _ => internal_error "caseEnd_NotAPropList"%string
        end in
      test_all Ps
    | _ => internal_error "caseEnd_NotACaseList"%string
    end).

(* Example usage with natural numbers. *)
Goal \forall n \in \mathbb{N}^\star, n = n.
  \letIn{n}{\mathbb{N}^\star}.
  \caseBegin{}.
  (* At this point, a tactic like \therefore{True} will fail: we are out of focus. *)
  \caseItem{(n = 2)%N}.
    \caseItemEnd{}.
  \caseItem{(n = 1)%N}.
    \caseItemEnd{}.
  \caseItem{(n > 2)%N}.
    \caseItemEnd{}.
  \caseEnd{}.
Qed.

(* Example usage with reals. *)
Goal \forall x \in \mathbb{R}, (x > x - 1)%R.
  \letIn{x}{\mathbb{R}}.
  \caseBegin{}.
  \caseItem{(x = 0)%R}.
    \caseItemEnd{}.
  \caseItem{(x < 0)%R}.
    \caseItemEnd{}.
  \caseItem{(x > 0)%R}.
    \caseItemEnd{}.
  \caseEnd{}.
Qed.

(* Example of a nested usage. *)
Goal \forall a b \in \mathbb{N}, True.
  \letIn{a}{\mathbb{N}}.
  \letIn{b}{\mathbb{N}}.
  \caseBegin{}.
  \caseItem{(a = 0)%N}.
    \caseItemEnd{}.
  \caseItem{(a > 0)%N}.
    \caseBegin{}.
    \caseItem{(b = 0)%N}.
      \caseItemEnd{}.
    \caseItem{(b > 0)%N}.
      \caseItemEnd{}.
    \caseEnd{}.
  \caseEnd{}.
Qed.


(* ** Helper Tactic *)

(* Store a hint in the environment.
  The hint itself can be a function if it depends on free variables.
  Example: [fun x => (x > 1)%N] if proving that some variable is greater than [1] is
  important for the exercise. *)
Inductive hint {T : Type} (t : T) := Hint.

(* Provide a hint that the \help{} tactic might suggest. *)
Tactic Notation "\hint" "{" constr(h) "}" :=
  let H := new_private in
  pose proof (H := Hint h).

Ltac suggest_hint :=
  generalize ltac_mark ;
  repeat match goal with
  | H : hint ?t |- _ =>
    let rec aux_instantiate t :=
      lazymatch t with
      | fun x : ?T => _ =>
        (* We try-out all the possible instantiations of the predicate. *)
        match goal with
        | x : T |- _ =>
          let t' := eval simpl in (t x) in
          aux_instantiate t'
        end
      | _ =>
        lazymatch goal with
        | _ : t |- _ => idtac (* This assumption is already present in the proof. *)
        | |- _ =>
          let H' := new_private in
          (assert (H' : t) ; [ trivial_to_prove | clear H' ]) ;
          idtac "\suggest{\therefore{"t"}}"
        end
      end in
    (try aux_instantiate t) ;
    generalize H ; clear H
  | _ => idtac
  end ;
  intro_until_mark.

Ltac suggest_goal :=
  try lazymatch goal with
  | |- solved_goal => idtac
  | |- ?g =>
    let H := new_private in
    (assert (H : g) ; [ trivial_to_prove |]) ;
    idtac "\suggest{\therefore{"g"}}"
  end.

(* Suggest tactics that could be typed for the current goal. *)
Tactic Notation "\help" "{" "}" :=
  suggest_hint ;
  suggest_goal ;
  lazymatch goal with
  | |- solved_goal => idtac "\suggest{\closeGoal{}}"
  | |- tactic_restriction ?r ?P =>
    lazymatch r with
    | restriction_caseItem =>
      idtac "\suggest{\caseItem{_}}" ;
      idtac "\suggest{\caseEnd{}}"
    | _ => internal_error "help"%string
    end
  | |- forall x, _ => idtac "\suggest{\letIn{"x"}{_}}"
  | |- _ => idtac
  end.

(* Example usage. *)
Goal \forall x \in \mathbb{N}^\star, x * x * x >= 1.
  \help{}. (* \suggest{\letIn{ x }{_}} *)
  \hint{(fun y => y > 0)}.
  \hint{(fun y => y * y > 0)}.
  \help{}. (* \suggest{\letIn{ x }{_}} *)
  \letIn{x}{\mathbb{N}^\star}.
  \help{}. (* \suggest{\therefore{ (x * x > 0) }} \suggest{\therefore{ (x > 0) }} *)
  \therefore{(x > 0)}.
  \help{}. (* \suggest{\therefore{ (x * x > 0) }} *)
  \therefore{(x * x > 0)}.
  \help{}. (* No hint. *)
  \caseBegin{}.
  \help{}. (* \suggest{\caseItem{_}} \suggest{\caseEnd{}} *)
  \caseItem{(x = 0)}.
    \help{}. (* No hint. *)
    conclude lia.
    \help{}. (* \suggest{\closeGoal{}}. *)
    \caseItemEnd{}.
  \help{}. (* \suggest{\caseItem{_}} \suggest{\caseEnd{}} *)
  \caseItem{(x > 0)}.
    conclude lia.
    \caseItemEnd{}.
  \caseEnd{}.
Qed.

