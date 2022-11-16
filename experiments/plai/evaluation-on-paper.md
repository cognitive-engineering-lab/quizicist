# Evaluation on Paper


## Evaluators

We’re trying to implement a programming language: that is, to write an _evaluator_ (i.e., something that “reduces programs to values”). It helps if we can first understand how evaluation works on paper, before we start dealing with computer complexities.

Before we get into the details, it’s worth knowing that there are broadly speaking two kinds of evaluators (as well as many combinations of them). They follow very different strategies:

- An _interpreter_ consumes a program and _simulates its execution_. That is, the interpreter does what we would expect “running the program” should do.
- A _compiler_ consumes a program and _produces another program_. That output program must then be further evaluated.

That is, an interpreter maps programs in some language _L_ to values:

interpreter :: Program_<sub>L</sub>_ → Value

We leave open exactly what a _value_ is for now, informally understanding it to be an answer the user would want to see—put differently, something that either cannot or does not need to be further e-valu-ated. In contrast,

compiler :: Program_<sub>L</sub>_ → Program_<sub>T</sub>_

That is, a compiler from _L_ to _T_ (we use _T_ for “target”) consumes programs in _L_ and produces programs in _T_. We aren’t saying about how this _T_ program must be evaluated. It may be interpreted directly, or it may be further compiled. For instance, one can compile a Scheme program to C. The C program may be interpreted directly, but it may very well be compiled to assembly. However, we can’t keep compiling ad infinitum: at the bottom, there must be some kind of interpreter (e.g., in the computer’s hardware) to provide answers.

Note that interpreters and compilers are themselves programs written in some language and must themselves run. Naturally, this can lead to interesting ideas and problems.

In our study, we will focus primarily on interpreters, but also see a very lightweight form of compilers. Interpreters are useful because:

1. A simple interpreter is often much easier to write than a compiler.
2. Debugging an interpreter can sometimes be much easier than debugging a compiler.

Therefore, they provide a useful “baseline” implementation technology that everyone can reach for. Compilers can often take an entire course of study.


## Terminology

It is common, on the Web, to read people speak of “interpreted languages” and “compiled languages”. These terms are **nonsense**. That isn’t just a judgment; that’s a literal statement: they do not make sense. Interpretation and compilation are techniques one uses to evaluate programs. A _language_ (almost) never specifies how it should be evaluated. As a result, each implementer is free to choose whatever strategy they want.

Just as an example, C is often chosen as a canonically “compiled language”, while Scheme is often presented as an “interpreted language”. However, there have been (a handful of) interpreters for C; indeed, I used one when I first learned C. Likewise, there are numerous compilers for Scheme; I used one when I first learned Scheme. Python has several interpreters and compilers.

Furthermore, this seemingly hard distinction is frequently broken down in practice. Many languages now have a “JIT”, which stands for _just-in-time_ compilation. That is, the evaluator starts out as an interpreter. If it finds itself interpreting the same code over and over, it compiles it and uses the compiled code instead. When and how to do this is a complex and fascinating topic, but it makes clear that the distinction is not a bright line.

Some people are confused by the _interface_ that an implementation presents. Many languages provide a _read-eval-print loop_ (REPL), i.e., an interactive interface. It is often easier for an interpreter to do this. However, many systems with such an interface accept code at a prompt, compile it, run it, and present the answer back to the user; they mask all these steps. Therefore, the interface is not an indicator of what kind of implementation you are seeing. It is perhaps meaningful to refer to an _implementation_ as “interactive” or “non-interactive”, but that is not a reflection of the underlying language.

In short, please remember: 

- (Most) Languages do not dictate implementations. Different platforms and other considerations dictate what implementation to use. 
- Implementations usually use one of two major strategies—interpretation and compilation—but many are also hybrids of these.
- A specific implementation may offer an interactive or non-interactive interface. However, this does automatically reveal the underlying implementation strategy.
- Therefore, the terms “interpreted language” and “compiled language” are nonsensical.


## Simulating an Interpreter by Hand

Since we have decided to write an interpreter, let’s start by understanding _what_ we are trying to get it to do, before we start to investigate _how_ we will make it do it.

Let’s consider the following program:

(define (f x) (+ x 1))
(f 2)

What does it produce? We can all guess that it produces 3. Now suppose we’re asked, _why_ does it produce 3? What might you say?

There’s a good chance you’ll say that it’s because x gets replaced with 2 in the body of f, then we compute the body, and that’s the answer:

  (f 2)
→ (+ x 1) where x is replaced by 2
→ (+ 2 1)
→ 3

These programs are written in Racket. You can put these programs into DrRacket in an early student language level (like Beginning Student) and watch them run, step-by-step, using the Step button in the menu bar.

Now let’s look at an extended version of the program:

;; f is the same as before
(define (g y)
  (f (+ y 4)))
(g 5)

We can use the same process:

  (g 5)
→ (f (+ y 4)) where y is replaced by 5
→ (f (+ 5 4))
→ (f 9)
→ (+ x 1) where x is replaced by 9
→ (+ 9 1)
→ 10

**Terminology:** We call the variables in the function header the _formal parameters_ and the expressions in the function call the _actual parameters_. So in f, x is the formal parameter, while 9 is an actual parameter. Some people also use _argument_ in place of _parameter_, but there’s no real difference between these terms.

Observe that we had a choice: we could have gone either

→ (f (+ 5 4))
→ (f 9)

or

→ (f (+ 5 4))
→ (+ x 1) where x is replaced by (+ 5 4)

For now, both will produce the same _answer_, but this is actually a very consequential decision! It is in fact one of the most profound choices in programming language design.

**Terminology:** The former choice is called _eager_ evaluation: think of it as “eagerly” reducing the actual parameter to a value before starting the function call. The latter choice is called _lazy_ evaluation: think of it as not rushing to perform the evaluation.

_SMoL is eager_. There are good reasons for this, which we will explore later.

Okay, so back to evaluation. Let’s do one more step:

;; f is the same as before
;; g is the same as before
(define (h z w)
  (+ (g z) (g w)))
(h 6 7)

Once again, we can look at the steps:

  (h 6 7)
→ (+ (g z) (g w)) where z is replaced by 6 and w is replaced by 7
→ (+ (g 6) (g 7))
→ (+ (f (+ y 4)) (g 7)) where y is replaced by 6
→ (+ (f (+ 6 4)) (g 7))
→ (+ (f 10) (g 7))
→ (+ (+ x 1) (g 7)) where x is replaced by 10
→ (+ (+ 10 1) (g 7))
→ (+ 11 (g 7))
→ (+ 11 (f (+ y 4))) where y is replaced by 7
→ (+ 11 (f (+ 7 4)))
→ (+ 11 (f 11))
→ (+ 11 (+ x 1)) where x is replaced by 11
→ (+ 11 (+ 11 1))
→ (+ 11 12)
→ 23


Observe that we again had some choices:

- Do we replace both calls at once, or do one at a time?
- If the latter, do we do the left or the right one first?

Languages have to make decisions about these, too! Above, we’ve again done what SMoL does: it finishes one call before starting the other, which makes SMoL _sequential_. Had we replaced both calls at once, we’d be exploring a _parallel_ language. Conventionally, most languages choose a left-to-right order, so that’s what we choose in SMoL.


## Substitution

By the way, observe that you didn’t need to know any computer programming to answer these questions. You did something similar in middle- and high-school algebra classes. You probably learned the phrase _substitution_ for “replaced with”. That’s the same process we’re following here. And indeed, we can think of programming as a natural outgrowth of algebra, except with much more interesting datatypes: not only numbers but also strings, images, lists, tables, vector fields, videos, and more.

Okay, so this gives us a way to implement an evaluator:

- Find a way to represent program source (e.g., a string or a tree).
- Look for the next expression to evaluate.
- Perform substitution (textually) to obtain a new program.
- Continue evaluating until there’s nothing left but a value.

However, as you might have guessed, that’s not how most programming languages _actually_ work: in general it would be painfully slow. So we’ll have to find a better way!
