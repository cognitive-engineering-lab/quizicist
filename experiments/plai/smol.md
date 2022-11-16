# Non-SMoL: Laziness


## Evaluation Strategies

Back in [Evaluation on Paper](https://docs.google.com/document/d/1LgPZkcs3stJss9O7C4lqDaaBgg6fOGZaaJaa3BG_5Fw/edit#), we saw that we had a choice when performing evaluation. During function application, we could substitute the actual parameter as an _expression_ or as a _value_. At the time, we indicated that SMoL is eager. Now we will investigate the other option, laziness.

Consider the following program:

(deffun (f x)
  (g (+ x x)))

(deffun (g y)
  (h (\* y 2)))

(deffun (h x)
  (+ x 5))

(f (+ 2 3))

Both the call and the environment reinforce that parameters are evaluated _before_ the function body begins to execute, so names are bound to _values_.


## Why Lazy Evaluation

Suppose, instead, we evaluate this lazily. The evaluation would look like this:

  (f (+ 2 3))
→ (g (+ (+ 2 3) (+ 2 3)))
→ (h (\* (+ (+ 2 3) (+ 2 3))) 2))
→ (+ (\* (+ (+ 2 3) (+ 2 3))) 2) 5)

A natural question might be, why bother doing this? 

1. A reason people often cite is that it can save time, in that we don’t need to evaluate parameters we don’t need. For instance, suppose we have

(deffun (f x y z)
  (if (zero? x)
      y
      z))

and we call f with two expensive-to-compute parameters in the last two positions. In an eager language, we have evaluated both whether we want to or not. In a lazy language, we only evaluate the one we need. As we will see below, this is actually not a very compelling argument.
2. A second reason is that it enables us to add new, non-eager constructs to the language through functions. Consider if: in an eager language it can’t be a function because the whole point of if is to not evaluate one of the branches (which would become parameters that are evaluated). Again, this argument has somewhat limited merit: we have seen how we can add such constructs using macros, which can do a great deal more as well.
3. The most interesting reason is probably that _the set of equations that govern the language changes_. Consider the following. Suppose we have the expressions E and (lambda (x) (E x)). Are they the “same”? It would seem, intuitively, that they are. Suppose E is a function. In any setting where we apply E to a parameter, the second expression does exactly the same: it takes that parameter, binds it to x, and then applies E to x, which has the same effect. However, note that E may not be a function! It could be a print statement, (/ 1 0), and so on. In those cases, E evaluates right away and has some observable effect, but the version “hidden under the lambda” will not until it is used. Why does this matter? It matters because many parts of programming implementations and tools want to replace some terms with other terms. An optimizing compiler does this (replacing a term with an equivalent one that is better by whatever optimizing criterion is in use), as do program refactoring engines, and more. Thus, the more terms that can be replaced, or the fewer conditions under which terms can be replaced, the better. Lazy languages allow more terms to be replaced.

**Terminology: **This equivalence is called “rule eta” (η).

**Terminology: **You may see some people say that lazy languages have “referential transparency”. If you ask them to define it, they may say something like “you can replace equals with equals”. Think about that for a moment: you can _always_ replace equals with equals. That is (by some definitions) literally what equality _means_: two things are equal exactly when you can replace one with the other. So that phrase tells us nothing. In fact, every language has some degree of “referential transparency”: you can always replace some things with other equivalent things. In lazy languages, the set of things you can replace is usually bigger: the referential transparency relation is larger. That’s all.


## Strictness Points

Coming back to our example from earlier: when we run such a program in a language with lazy evaluation, when, if ever, does all this arithmetic resolve and print a value?

Before we answer that question, let us also observe that sometimes programs can’t really defer decisions indefinitely. For instance, consider this program:

(deffun (f x)
  (if (even? x)
      7
      11))

(f (+ 2 3))

What happens when we try to evaluate it? Presumably substitution reduces this to

(if (even? (+ 2 3))
    7
    11)

and now what? Presumably that could be considered “the answer”, but that doesn’t seem very useful; and in real programs, these terms would just grow larger and larger. Furthermore, suppose the program were

(deffun (fact n)
  (if (zero? n)
      1
      (\* n (fact (- n 1)))))

(fact 5)

We can certainly produce as an answer

  (if (zero? 5)
      1
      (\* 5 (fact (- 5 1)))))

but…then what? And for that matter, what is fact in this response? This does not seem like a very useful programming language.

Instead, lazy programming languages define certain points in the language as _strictness_ points, which are points where expressions are forced to compute and produce an answer. Different choices of strictness points will result in languages that behave slightly differently. Conventionally, the following are considered _useful_ strictness points:

1. The conditional portion of a conditional expression. This enables the language to determine which branch to take and which branch to ignore.
2. Arithmetic. This avoids long chains of computations building up.
3. The printer in an interactive environment. This makes the environment useful.

All three of these are _pragmatic_ choices. Notice that our first example above concerned the top-level printer, while the second example has to do with conditionals.

Because of these strictness points, a typical lazy language will in fact compute the programs we have seen above very similarly to an eager language. To get to something that really differentiates eagerness from laziness, we need to get to richer programs.


## Evaluating Without Substitution

Above, we saw how we can think of lazy evaluation using substitution. While this is a useful mental model, as we have seen in earlier interpreters, we don’t really want to use substitution as our implementation strategy. That involves repeatedly rewriting program source, which is not how our interpreter worked.

So let’s say we don’t pass the value but instead “the expression”. Does it mean the above sequence becomes this?

  (f (+ 2 3))
→ (g (+ x x)) where x is bound to (+ 2 3)
→ (h (\* y 2)) where y is bound to (+ (+ 2 3) (+ 2 3)))
→ (+ x 5) where x is bound to (\* (+ (+ 2 3) (+ 2 3)) 2)

In fact, even this isn’t quite right. It should rather be

  (f (+ 2 3))
→ (g (+ x x)) where x is bound to (+ 2 3)
→ (h (\* y 2)) where y is bound to (+ x x)) whose x is (+ 2 3)
→ (+ x 5) where x is bound to (\* y 2) whose y is (+ x x)) whose x is (+ 2 3)

In other words, we want to pass the unevaluated expression…but you can probably see where this is going! If we’re not careful, we will end up with dynamic scope. Even setting that aside, we can’t just pass the expression on its own, because when we eventually get a strictness point, we simply will have no idea what value a variable resolves to.

However, the solution also presents itself very naturally. We don’t just pass an expression, we pass along its corresponding environment. An expression and environment combine to form a…closure! Of course, this closure does not take any parameters; its only job is to _suspend the evaluation of the expression_ until we reach a strictness point, and at that point, _evaluate it in the right environment_. Fortunately, we don’t need to do any new work here; closure application already does it for us.


## Laziness Via Closures: Beyond Numbers

Laziness becomes more interesting when we consider data structures. Conventionally, data constructors are _not_ strict, so their arguments are not evaluated eagerly. We can illustrate this using lists, though technically we will be constructing _streams_ (which are infinite, as opposed to lists, which are finite).

First, read about streams represented using closures:

<https://dcic-world.org/2022-08-28/func-as-data.html#%28part._streams-from-funs%29>

What would the same code look like in a language that was already lazy?

To experiment with that, we’ll now use the Racket language

\#lang lazy

(define ones (cons 1 ones))

(define (nats-from n)
  (cons n (nats-from (add1 n))))

(define nats (nats-from 0))

(define (take n s)
  (if (zero? n)
      empty
      (cons (first s) (take (sub1 n) (rest s)))))

Observe how some of these values print:

\> ones
\#&lt;promise:ones>
\> nats
\#&lt;promise:nats>

The word “promise” means these are _thunks_ that represent the stream. To view the thunk’s content, we need to “force” the “promise”, which we do using the ! operator:

\> (! ones)
\#0='(1 . #&lt;promise!#0#>)
\> (! nats)
'(0 . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

In the case of ones, Racket is telling us that the rest of the stream is the _same_ stream as the one we are viewing: i.e., it’s a cyclic stream. For nats, it tells us that the first element is 0, followed by another promise. We can explore these streams a bit further:

\> (! (rest ones))
\#0='(1 . #&lt;promise!#0#>)
\> (! (rest (rest (rest ones))))
\#0='(1 . #&lt;promise!#0#>)
\> (! (rest nats))
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)
\> (! (rest (rest (rest nats))))
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

Unsurprisingly, ones does not change. But with nats, as we explore more of the stream, we run into more thunks. This is where take is useful: it gives us a finite prefix of the potentially infinite stream. Unfortunately, that also seems to just produce more thunks, and it seems like we would need to laboriously apply ! to each part:

\> (take 10 ones)
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)
\> (take 10 nats)
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

For situations like this, where we _know_ the output is going to be finite, we might want to resolve all the thunks. For this, Lazy Racket provides !!, which recursively applies strictness to all contained thunks:

\> (!! (take 10 ones))
'(1 1 1 1 1 1 1 1 1 1)
\> (!! (take 10 nats))
'(0 1 2 3 4 5 6 7 8 9)

Sure enough, we get the expected answer.

**Exercise:** What happens if we apply !! to ones and to nats? Try it out, and explain what you see.


## Laziness and Side-Effects

Given the (potential) benefits of lazy evaluation, why is laziness not more widely used?

The problem is that laziness makes it much harder to predict what will happen in programs that use state. Therefore, popular lazy languages do not have state, or have it in very controlled forms. (This is not a bad thing! State _should_ only be used in very controlled ways, and Haskell, for instance, has very interesting designs that help with that. But programmers have traditionally expected to have unfettered access to state.)

Consider, for instance, the following pair of functions:

(define (f x y)
  (g x y))

(define (g x y)
  (if (zero? (random 2)) x y))

On their own, they seem harmless. However, now consider this call:

(f (print "X") (print "Y"))

In an eager language, we know both strings would be printed right away. However, in a lazy language, only one will, and we cannot tell which one. To understand which, we can no longer treat f as an abstraction but instead have to peer into its implementation, which in turn forces us to examine the source of g as well. We would have to examine every call, and track all the strictness points along the way, to determine which effects will occur and when. Here is another example:

(define n 0)
(f (set! n (add1 n)) (set! n (sub1 n)))

Again, if we ran this eagerly, we know n would be set back to 0 before the body of f even begins to evaluate. In lazy evaluation, we cannot be sure what value n will have: it could be -1 or 1. Furthermore if, tomorrow, g were altered to be

(define (g x y)
  (if (zero? (random 2)) "X" "Y"))

then n remains 0—but we can’t know without examining its code!

A natural reaction to reading these programs might be, “Don’t do that!” That is in fact an entirely legitimate reaction. The problem is not laziness: it’s the interaction between laziness and state. As we deprecate the use of unfettered state in programming, that increases the potential for laziness. Still, there are other situations—like errors—that we cannot avoid, and that can stay latent under lazy evaluation.


## Caching Results

If we use lazy programming without side effects, we get a nice benefit: each expression always produces the same result. In that case, we don’t ever have to recompute an expression; we can just store its result and reuse it on subsequent accesses. That is, we can _cache_ the result, enabling us to trade space for time.

**Aside: **If you are not familiar with trading space for time in computation—as found in techniques such as memoization and dynamic programming—see DCIC:<https://dcic-world.org/2022-08-28/part_advtopics.html#%28part._avoid-recomp%29>

This is what Lazy Racket does. We can test this quite easily by running a standard test of memoization: computing Fibonacci numbers. Without memoization, this produces an exponentially large computation tree. With memoization, it takes linear time.

(define (fib n)
  (cond
    \[(zero? n) 1]
    \[(= n 1) 1]
    \[else (+ (fib (- n 1)) (fib (- n 2)))]))

(fib 30)


## Space Consumption

The ability to automatically memoize computation seems to show even more benefit to making lazy evaluation a default. Why not do it?

One problem is that lazy evaluation can often take up significant amounts of space, _beyond_ the space consumed by memoization. To understand this, consider this squaring function:

(define (sq x)
  (\* x x))

Because we are evaluating lazily, x is bound to an _expression_ represented as a closure. Now suppose our program looks like

(define v (make-vector 1000 0))
(sq (vector-ref v 2))

and beyond this we make no further reference to v. In an eager language, we would extract the second element of v and can reclaim all the remaining storage. But in a lazy language, the _entire vector_ needs to stay alive until the last use of the closure that refers to it. Seemingly straightforward programs that have an intuitive space model in an eager language can have much more subtle and complicated space models in lazy programming. Observe that the issue above has nothing to do with memoization; it’s inherent in laziness.


## Laziness in Eagerness

As a result of these issues, laziness has not gained popularity as a default option. At the same time, it is very useful in some settings. As we have seen above, we can always _simulate_ laziness by using thunks. This can, however, be syntactically unwieldy, so some languages provide syntactic support for it. In languages like Racket, for instance, delay is a syntactic form that thunks its expression, and force is a function that evaluates it (caching the result).
# Non-SMoL: Laziness


## Evaluation Strategies

Back in [Evaluation on Paper](https://docs.google.com/document/d/1LgPZkcs3stJss9O7C4lqDaaBgg6fOGZaaJaa3BG_5Fw/edit#), we saw that we had a choice when performing evaluation. During function application, we could substitute the actual parameter as an _expression_ or as a _value_. At the time, we indicated that SMoL is eager. Now we will investigate the other option, laziness.

Consider the following program:

(deffun (f x)
  (g (+ x x)))

(deffun (g y)
  (h (\* y 2)))

(deffun (h x)
  (+ x 5))

(f (+ 2 3))

Both the call and the environment reinforce that parameters are evaluated _before_ the function body begins to execute, so names are bound to _values_.


## Why Lazy Evaluation

Suppose, instead, we evaluate this lazily. The evaluation would look like this:

  (f (+ 2 3))
→ (g (+ (+ 2 3) (+ 2 3)))
→ (h (\* (+ (+ 2 3) (+ 2 3))) 2))
→ (+ (\* (+ (+ 2 3) (+ 2 3))) 2) 5)

A natural question might be, why bother doing this? 

1. A reason people often cite is that it can save time, in that we don’t need to evaluate parameters we don’t need. For instance, suppose we have

(deffun (f x y z)
  (if (zero? x)
      y
      z))

and we call f with two expensive-to-compute parameters in the last two positions. In an eager language, we have evaluated both whether we want to or not. In a lazy language, we only evaluate the one we need. As we will see below, this is actually not a very compelling argument.
2. A second reason is that it enables us to add new, non-eager constructs to the language through functions. Consider if: in an eager language it can’t be a function because the whole point of if is to not evaluate one of the branches (which would become parameters that are evaluated). Again, this argument has somewhat limited merit: we have seen how we can add such constructs using macros, which can do a great deal more as well.
3. The most interesting reason is probably that _the set of equations that govern the language changes_. Consider the following. Suppose we have the expressions E and (lambda (x) (E x)). Are they the “same”? It would seem, intuitively, that they are. Suppose E is a function. In any setting where we apply E to a parameter, the second expression does exactly the same: it takes that parameter, binds it to x, and then applies E to x, which has the same effect. However, note that E may not be a function! It could be a print statement, (/ 1 0), and so on. In those cases, E evaluates right away and has some observable effect, but the version “hidden under the lambda” will not until it is used. Why does this matter? It matters because many parts of programming implementations and tools want to replace some terms with other terms. An optimizing compiler does this (replacing a term with an equivalent one that is better by whatever optimizing criterion is in use), as do program refactoring engines, and more. Thus, the more terms that can be replaced, or the fewer conditions under which terms can be replaced, the better. Lazy languages allow more terms to be replaced.

**Terminology: **This equivalence is called “rule eta” (η).

**Terminology: **You may see some people say that lazy languages have “referential transparency”. If you ask them to define it, they may say something like “you can replace equals with equals”. Think about that for a moment: you can _always_ replace equals with equals. That is (by some definitions) literally what equality _means_: two things are equal exactly when you can replace one with the other. So that phrase tells us nothing. In fact, every language has some degree of “referential transparency”: you can always replace some things with other equivalent things. In lazy languages, the set of things you can replace is usually bigger: the referential transparency relation is larger. That’s all.


## Strictness Points

Coming back to our example from earlier: when we run such a program in a language with lazy evaluation, when, if ever, does all this arithmetic resolve and print a value?

Before we answer that question, let us also observe that sometimes programs can’t really defer decisions indefinitely. For instance, consider this program:

(deffun (f x)
  (if (even? x)
      7
      11))

(f (+ 2 3))

What happens when we try to evaluate it? Presumably substitution reduces this to

(if (even? (+ 2 3))
    7
    11)

and now what? Presumably that could be considered “the answer”, but that doesn’t seem very useful; and in real programs, these terms would just grow larger and larger. Furthermore, suppose the program were

(deffun (fact n)
  (if (zero? n)
      1
      (\* n (fact (- n 1)))))

(fact 5)

We can certainly produce as an answer

  (if (zero? 5)
      1
      (\* 5 (fact (- 5 1)))))

but…then what? And for that matter, what is fact in this response? This does not seem like a very useful programming language.

Instead, lazy programming languages define certain points in the language as _strictness_ points, which are points where expressions are forced to compute and produce an answer. Different choices of strictness points will result in languages that behave slightly differently. Conventionally, the following are considered _useful_ strictness points:

1. The conditional portion of a conditional expression. This enables the language to determine which branch to take and which branch to ignore.
2. Arithmetic. This avoids long chains of computations building up.
3. The printer in an interactive environment. This makes the environment useful.

All three of these are _pragmatic_ choices. Notice that our first example above concerned the top-level printer, while the second example has to do with conditionals.

Because of these strictness points, a typical lazy language will in fact compute the programs we have seen above very similarly to an eager language. To get to something that really differentiates eagerness from laziness, we need to get to richer programs.


## Evaluating Without Substitution

Above, we saw how we can think of lazy evaluation using substitution. While this is a useful mental model, as we have seen in earlier interpreters, we don’t really want to use substitution as our implementation strategy. That involves repeatedly rewriting program source, which is not how our interpreter worked.

So let’s say we don’t pass the value but instead “the expression”. Does it mean the above sequence becomes this?

  (f (+ 2 3))
→ (g (+ x x)) where x is bound to (+ 2 3)
→ (h (\* y 2)) where y is bound to (+ (+ 2 3) (+ 2 3)))
→ (+ x 5) where x is bound to (\* (+ (+ 2 3) (+ 2 3)) 2)

In fact, even this isn’t quite right. It should rather be

  (f (+ 2 3))
→ (g (+ x x)) where x is bound to (+ 2 3)
→ (h (\* y 2)) where y is bound to (+ x x)) whose x is (+ 2 3)
→ (+ x 5) where x is bound to (\* y 2) whose y is (+ x x)) whose x is (+ 2 3)

In other words, we want to pass the unevaluated expression…but you can probably see where this is going! If we’re not careful, we will end up with dynamic scope. Even setting that aside, we can’t just pass the expression on its own, because when we eventually get a strictness point, we simply will have no idea what value a variable resolves to.

However, the solution also presents itself very naturally. We don’t just pass an expression, we pass along its corresponding environment. An expression and environment combine to form a…closure! Of course, this closure does not take any parameters; its only job is to _suspend the evaluation of the expression_ until we reach a strictness point, and at that point, _evaluate it in the right environment_. Fortunately, we don’t need to do any new work here; closure application already does it for us.


## Laziness Via Closures: Beyond Numbers

Laziness becomes more interesting when we consider data structures. Conventionally, data constructors are _not_ strict, so their arguments are not evaluated eagerly. We can illustrate this using lists, though technically we will be constructing _streams_ (which are infinite, as opposed to lists, which are finite).

First, read about streams represented using closures:

<https://dcic-world.org/2022-08-28/func-as-data.html#%28part._streams-from-funs%29>

What would the same code look like in a language that was already lazy?

To experiment with that, we’ll now use the Racket language

\#lang lazy

(define ones (cons 1 ones))

(define (nats-from n)
  (cons n (nats-from (add1 n))))

(define nats (nats-from 0))

(define (take n s)
  (if (zero? n)
      empty
      (cons (first s) (take (sub1 n) (rest s)))))

Observe how some of these values print:

\> ones
\#&lt;promise:ones>
\> nats
\#&lt;promise:nats>

The word “promise” means these are _thunks_ that represent the stream. To view the thunk’s content, we need to “force” the “promise”, which we do using the ! operator:

\> (! ones)
\#0='(1 . #&lt;promise!#0#>)
\> (! nats)
'(0 . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

In the case of ones, Racket is telling us that the rest of the stream is the _same_ stream as the one we are viewing: i.e., it’s a cyclic stream. For nats, it tells us that the first element is 0, followed by another promise. We can explore these streams a bit further:

\> (! (rest ones))
\#0='(1 . #&lt;promise!#0#>)
\> (! (rest (rest (rest ones))))
\#0='(1 . #&lt;promise!#0#>)
\> (! (rest nats))
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)
\> (! (rest (rest (rest nats))))
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

Unsurprisingly, ones does not change. But with nats, as we explore more of the stream, we run into more thunks. This is where take is useful: it gives us a finite prefix of the potentially infinite stream. Unfortunately, that also seems to just produce more thunks, and it seems like we would need to laboriously apply ! to each part:

\> (take 10 ones)
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)
\> (take 10 nats)
'(#&lt;promise:...e/pkgs/lazy/base.rkt:299:29> . #&lt;promise:...e/pkgs/lazy/base.rkt:299:29>)

For situations like this, where we _know_ the output is going to be finite, we might want to resolve all the thunks. For this, Lazy Racket provides !!, which recursively applies strictness to all contained thunks:

\> (!! (take 10 ones))
'(1 1 1 1 1 1 1 1 1 1)
\> (!! (take 10 nats))
'(0 1 2 3 4 5 6 7 8 9)

Sure enough, we get the expected answer.

**Exercise:** What happens if we apply !! to ones and to nats? Try it out, and explain what you see.


## Laziness and Side-Effects

Given the (potential) benefits of lazy evaluation, why is laziness not more widely used?

The problem is that laziness makes it much harder to predict what will happen in programs that use state. Therefore, popular lazy languages do not have state, or have it in very controlled forms. (This is not a bad thing! State _should_ only be used in very controlled ways, and Haskell, for instance, has very interesting designs that help with that. But programmers have traditionally expected to have unfettered access to state.)

Consider, for instance, the following pair of functions:

(define (f x y)
  (g x y))

(define (g x y)
  (if (zero? (random 2)) x y))

On their own, they seem harmless. However, now consider this call:

(f (print "X") (print "Y"))

In an eager language, we know both strings would be printed right away. However, in a lazy language, only one will, and we cannot tell which one. To understand which, we can no longer treat f as an abstraction but instead have to peer into its implementation, which in turn forces us to examine the source of g as well. We would have to examine every call, and track all the strictness points along the way, to determine which effects will occur and when. Here is another example:

(define n 0)
(f (set! n (add1 n)) (set! n (sub1 n)))

Again, if we ran this eagerly, we know n would be set back to 0 before the body of f even begins to evaluate. In lazy evaluation, we cannot be sure what value n will have: it could be -1 or 1. Furthermore if, tomorrow, g were altered to be

(define (g x y)
  (if (zero? (random 2)) "X" "Y"))

then n remains 0—but we can’t know without examining its code!

A natural reaction to reading these programs might be, “Don’t do that!” That is in fact an entirely legitimate reaction. The problem is not laziness: it’s the interaction between laziness and state. As we deprecate the use of unfettered state in programming, that increases the potential for laziness. Still, there are other situations—like errors—that we cannot avoid, and that can stay latent under lazy evaluation.


## Caching Results

If we use lazy programming without side effects, we get a nice benefit: each expression always produces the same result. In that case, we don’t ever have to recompute an expression; we can just store its result and reuse it on subsequent accesses. That is, we can _cache_ the result, enabling us to trade space for time.

**Aside: **If you are not familiar with trading space for time in computation—as found in techniques such as memoization and dynamic programming—see DCIC:<https://dcic-world.org/2022-08-28/part_advtopics.html#%28part._avoid-recomp%29>

This is what Lazy Racket does. We can test this quite easily by running a standard test of memoization: computing Fibonacci numbers. Without memoization, this produces an exponentially large computation tree. With memoization, it takes linear time.

(define (fib n)
  (cond
    \[(zero? n) 1]
    \[(= n 1) 1]
    \[else (+ (fib (- n 1)) (fib (- n 2)))]))

(fib 30)


## Space Consumption

The ability to automatically memoize computation seems to show even more benefit to making lazy evaluation a default. Why not do it?

One problem is that lazy evaluation can often take up significant amounts of space, _beyond_ the space consumed by memoization. To understand this, consider this squaring function:

(define (sq x)
  (\* x x))

Because we are evaluating lazily, x is bound to an _expression_ represented as a closure. Now suppose our program looks like

(define v (make-vector 1000 0))
(sq (vector-ref v 2))

and beyond this we make no further reference to v. In an eager language, we would extract the second element of v and can reclaim all the remaining storage. But in a lazy language, the _entire vector_ needs to stay alive until the last use of the closure that refers to it. Seemingly straightforward programs that have an intuitive space model in an eager language can have much more subtle and complicated space models in lazy programming. Observe that the issue above has nothing to do with memoization; it’s inherent in laziness.


## Laziness in Eagerness

As a result of these issues, laziness has not gained popularity as a default option. At the same time, it is very useful in some settings. As we have seen above, we can always _simulate_ laziness by using thunks. This can, however, be syntactically unwieldy, so some languages provide syntactic support for it. In languages like Racket, for instance, delay is a syntactic form that thunks its expression, and force is a function that evaluates it (caching the result).
