# Algebraic Datatypes

We have written numerous define-type definitions so far, e.g., for expressions. Now we will study this mechanism, which is increasingly found in many new programming languages, in more detail.

To simplify things, consider a simple plait data definition of a binary tree of numbers:

(define-type BT
  \[mt]
  \[node (v : Number) (l : BT) (r : BT)])

The define-type construct here is doing three different things, and it’s worth teasing them apart:

1. Giving a _name_ to a new type, BT.
2. Allowing the type to be defined by multiple cases or _variants_ (mt and node).
3. Permitting a _recursive_ definition (BT references BT).

It’s worth asking whether all these pieces of functionality really have to be bundled together, or whether they can be handled separately. While they can indeed be separated, they often end up working in concert, especially when it comes to recursive definitions, which are quite common. A recursive definition needs a name for creating the recursion; therefore, the third feature requires the first. Furthermore, a recursive definition often needs a non-recursive case to “bottom out”; this requires there to be more than one variant, using the second feature. Putting the three together, therefore, makes a lot of sense.

This construct is called an _algebraic datatype_, sometimes also known as a “sum of products”. That is because the variants are read as an “or”: a BT is an mt _or_ a node. Each variant is an “and” of its fields: a node has a v _and_ an l _and_ an r. In Boolean algebra, “or” is analogous to a sum and “and” is analogous to a product.


## Generated Bindings

Now the question is, how do we type code that uses such a definition? First, let’s take an inventory of all the definitions that this might create. It at least creates two _constructors_:

(mt : ( -> BT))
(node : (Number BT BT -> BT))

We have been starting our interpretation and type-checking with the empty environment, but there is no reason we need to, nor do we do so in practice: the primordial environment can contain all kinds of pre-defined values and their types. Thus, we can imagine the define-type above adding the above two definitions to the initial type environment, enabling uses of mt and node to be type-checked.

This much is standard across various languages. But less commonly, in plait you get two more families of functions: _predicates_ for distinguishing between the variants:

(mt? : (BT -> Boolean))
(node? : (BT -> Boolean))

and _accessors_ for getting the values out of fields:

(node-v : (BT -> Number))
(node-l : (BT -> BT))
(node-r : (BT -> BT))


## Static Type Safety

We should be troubled by the types of these accessors. They seem to indiscriminately try to pull out field values, _whether the variant has them or not_. For instance, we can write and type-check this program, which is appealing:

(size-correct : (BT -> Number))

(define (size-correct (t : BT))
  (if (mt? t)
      0
      (+ 1 (+ (size-correct (node-l t)) (size-correct (node-r t))))))

(test (size-correct (mt)) 0)

However, we can just as well type-check _this_ program:

(define (size-wrong (t : BT))
  (+ 1 (+ (size-wrong (node-l t)) (size-wrong (node-r t)))))

This should not type-check because it has a clear type-error. The type of size-wrong is

(size-wrong : (BT -> Number))

so it is perfectly type-correct to write:

(size-wrong (mt))

But running this, of course, results in a run-time error, the very kind of error we might have hoped the type-checker would catch.


## Pattern-Matching and Type-Checking

This kind of error cannot occur naturally in languages like OCaml and Haskell. Instead of exposing all these predicates and accessors, instances of an algebraic datatype are deconstructed using pattern-matching. Thus, the size computation would be written as (-pm stands for “pattern matching”):

(size-pm : (BT -> Number))

(define (size-pm t)
  (type-case BT t
    \[(mt) 0]
    \[(node v l r) (+ 1 (+ (size-pm l) (size-pm r)))]))

This might seem like a convenience—it certainly makes the code much more compact and perhaps also much more readable—but it’s also doing something more. The pattern-matcher is effectively baked into the way programs are type-checked. That is, the above algebraic datatype definition effectively adds the following typing rule to the type checker:

Γ |- e : BT
Γ |- e1 : T
Γ\[V &lt;- Number, L &lt;- BT, R &lt;- BT] |- e2 : T
\-----------------------------------------
Γ |- (type-case BT e
       \[(mt) e1]
       \[(node V L R) e2]) : T

The first antecedent is clear: we have to confirm that the expression e evaluates to a BT before we pattern-match BT patterns against it. The second type-checks e1 in the same environment as in the consequent because the mt variant does not add any local bindings. The type of this expression needs to be the same as the type from the other branch, due to how we’re handling conditionals. Finally, to type-check e2, we have to extend the consequent’s type environment with the bound variables; their types we can read off directly from the data _definition_. In short, the above typing rule can be defined automatically by desugaring.

**Aside:** Notice that there is also an assume-guarantee here: we type-check e2 in an environment that _assumes_ the annotated types; this is _guaranteed_ by the node constructor.

In particular, observe what we _couldn’t_ do! We didn’t have awkward selectors, like node-v, for which we had to come up with some type. By saying they consumed a BT, we had to let them statically consume any kind of BT, which caused a problem at run-time. Here, there is _no selector_: pattern-matching means we can only write pattern-variables in variants where the algebraic datatype definition permits it, and the variables automatically gets the right type. Thus, pattern-matching plays a crucial role in the _statically safe_ handling of types.


## Algebraic Datatypes and Space

Earlier, we’ve seen that types can save us both time and space. We have to be a little more nuanced when it comes to algebraic datatypes.

The new type introduced by an algebraic datatype still enjoys the space saving. Because the type checker can tell a BT apart from every other type, at run-time we don’t need to record that a value is a BT: it doesn’t need a type-tag. However, we still need to tell apart the different _variants_: the function size-pm effectively desugars into (-ds stands for “desugared”):

(define (size-pm-ds (t : BT))
  (cond
    \[(mt? t) 0]
    \[(node? t)
     (let (\[v (node-v t)]
           \[l (node-l t)]
           \[r (node-r t)])
       (+ 1 (+ (size-pm-ds l) (size-pm-ds r))))]))

(We’ve introduced the let to bind the names introduced by the pattern.) What this shows is that at run-time, there are conditional checks that need to know what kind of BT is bound to t on this iteration. Therefore, we need just enough tagging to tell the variants apart. In practice, this means we need as many bits as the logarithm of the number of variants; since this number is usually small, this information can often be squeezed into other parts of the data representation.
