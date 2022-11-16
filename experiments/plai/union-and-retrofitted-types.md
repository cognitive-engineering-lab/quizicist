# Union Types and Retrofitted Types

Typed Racket is an instance of a _retrofitted_ type system: adding a type system to a language that did not previously have types. The original language, which does not have a static type system, is usually called _dynamic_. There are now numerous retrofitted type systems: e.g., TypeScript for JavaScript and Static Python for Python. There are even multiple retrofitted type systems for some languages: e.g., both TypeScript and Flow add types to JavaScript.

The goal of a retrofitted type system is to turn run-time errors into static type errors. Due to the Halting Problem, we cannot precisely turn every single run-time error into a static one, so the designer of the type system must make some decisions about which errors matter more than others. In addition, programmers have already written considerable code in many dynamic languages, so changes that require programmers to rewrite code significantly would not be adopted. Instead, as much as possible, type system designers need to accommodate _idiomatic type-safe programs_.

Algebraic datatypes present a good example. Typically, they have tended to not be found in dynamic languages. Instead, these languages have some kind of structure definition mechanism (such as classes, or lightweight variants thereof, like Python’s [dataclasses](https://docs.python.org/3/library/dataclasses.html)). Therefore, the elegant typing that goes with algebraic datatypes and their pattern-matching does not apply. Because it is not practical to force dynamic language programmers to wholesale change to this “new” (to that dynamic language) style of programming, type system designers must find the idioms they use (that happen to be type-safe) and try to bless them. We will look at some examples of this.

A good working example of a retrofitted typed language is Typed Racket, which adds types to Racket while trying to preserve idiomatic Racket programs. (This is in contrast to plait, which is also a typed form of Racket but does _not_ try very hard to preserve Racket idioms. The accessors we saw earlier, in [Algebraic Datatypes and Union Types](https://docs.google.com/document/d/1RhTdj6Tzf1lU7pT1t5SZJNQTFvfUUDhWdQniwdkKEG8/edit#), are forgiving in what they accept, at the cost of static safety.)


## You Get a Type! And You Get a Type! And You Get a Type!

Let’s return \[[Algebraic Datatypes and Union Types](https://docs.google.com/document/d/1RhTdj6Tzf1lU7pT1t5SZJNQTFvfUUDhWdQniwdkKEG8/edit#)] to our non-statically-type-safe accessors in plait: e.g.,

(node-v : (BT -> Number))

In a way, it’s not fair to blame the accessor: the fault is really with the constructor, because

(node : (Number BT BT -> BT))

Once the node constructor creates a BT, the information about node-ness is lost, and there’s not much that the accessors can do. So perhaps the alternative is to _not_ create a BT, but instead create a value of the node type.

So let’s start over. This time, we’ll use a different typed language, Typed Racket:

\#lang typed/racket

In Typed Racket, we can create products, called structures, which define a new type:

(struct mt ())

This creates a constructor with the type we’d expect:

\> mt
\- : (-> mt)
\#&lt;procedure:mt>

It also creates a predicate, whose type is a bit different; previously we had a function that could only take a BT, because it didn’t make sense to apply mt? to any other type. Now, however, there isn’t even a concept of a BT (yet), so mt? will take values of any type:

\> mt?
\- : (-> Any Boolean : mt)
\#&lt;procedure:mt?>

(The additional text, : mt, is telling us when the boolean is true; ignore this for now.)

Now let’s try to define nodes. Here we run into a problem:

(struct nd (\[v : Number] \[l : 


## Union Types

Oops—what do we write here?!? We have to also introduce a notion of a binary tree. But we already have two existing types, mt and (in progress) nd. Therefore, we need a way to define a binary tree that has a sum that combines these two existing types. This suggests that we have a way of describing a new type as a _union_ of existing types:

(define-type-alias BT (U mt nd))

Now we can go back and complete our definition of nd:

(struct nd (\[v : Number] \[l : BT] \[r : BT]))

Now let’s look at what Typed Racket tells us are the types of nd’s constructor, predicate, and selectors:

\> nd
\- : (-> Number BT BT nd)
\> nd-v
\- : (-> nd Number)
\> nd-l
\- : (-> nd BT)
\> nd-r
\- : (-> nd BT)

Using these definitions we can create trees: e.g.,

(define t1
  (nd 5
      (nd 3
          (nd 1 (mt) (mt))
          (mt))
      (nd 7
          (mt)
          (nd 9 (mt) (mt)))))

But now let’s try to write a program to compute its size:

(define (size-tr \[t : BT]) : Number
  (cond
    \[(mt? t) 0]
    \[(nd? t) (+ 1 (size-tr (nd-l t)) (size-tr (nd-r t)))]))

It is not clear at all that this program should type-check. Consider the expression (nd-l t). The type of nd-l expects its argument to be of type nd. However, all we know is that t is of type BT. Yet this program type-checks!

The fact that this does type-check, however, should not fill us with too much joy. We saw how size-wrong type-checked, only to halt with an undesired run-time error. So what if we instead write its analog, which is this?

(define (size-tr-wrong \[t : BT]) : Number
  (+ 1 (size (nd-l t)) (size (nd-r t))))

This program does **not** type-check! Instead, it gives us a type error of exactly the sort we would have expected: nd-l and nd-r both complain that they were expecting an nd and were given a BT. So the wonder is not that size-tr-wrong has a type-error, but rather that size-tr does not!

To understand why it type-checks, we have to go back to the types of the predicates:

\> mt?
\- : (-> Any Boolean : mt)
\> nd?
\- : (-> Any Boolean : nd)

Critically, the : mt and : nd are Typed Racket’s way of saying that the boolean will be true only when the input is an mt or nd, respectively. This crucial _refinement_ information is picked up by the type-checker. In the right-hand-side of the cond clauses, it _narrows_ the type of t to be mt and nd, respectively. Thus, (nd-l t) is type-checked in a type environment where the type of t is nd and not BT.

To test this theory, we can try another wrong program:

(define (size-tr-w2 \[t : BT]) : Number
  (cond
    \[(nd? t) 0]
    \[(mt? t) (+ 1 (size-tr-w2 (nd-l t)) (size-tr-w2 (nd-r t)))]))

Here, we have swapped the predicates. It is not only important that this version produces a type error, it is also instructive to understand why, by reading the type error. This explicitly says that the program expected an nd (for instance, in nd-l) and was given an mt (based on the mt?). This confirms that Typed Racket is refining the types in branches based on predicates.


## If-Splitting

To summarize, size-tr type-checks is because the type-checker is doing something special when it sees the pattern

(define (size-tr \[t : BT]) : Number
  (cond
    \[(mt? t) …]
    \[(nd? t) …]))

It knows that every BT is related to mt and nd through the union. When it sees the predicate, it _narrows_ the type from the full union to the branch of the union that the predicate has checked. Thus, in the mt? branch, it narrows the type of t from BT to mt; in the nd? branch, similarly, it narrows the type of t to just nd. Now, nd-l, say, gets confirmation that it is indeed processing an nd value, and the program is statically type-safe. In the absence of those predicates, in size-tr-wrong, the type of t does not get narrowed, resulting in the error. In size-tr-w2, swapping the predicates also gives an error. Here is one more version:

(define (size-tr-else \[t : BT]) : Number
  (cond
    \[(mt? t) 0]
    \[else (+ 1 (size-tr (nd-l t)) (size-tr (nd-r t)))]))

This program could go either way! It just so happens that it does type-check in typed/racket, because typed/racket is “smart” enough to determine that there are only two kinds of BT and one has been excluded, so in the else case, it must be the other kind. But one could also imagine a less clever checker that expects to see an explicit test of nd? to be able to bless the second clause.

In short, both the algebraic datatype and union type approaches need some special treatment of syntax by the type-checker to handle variants. In the former case it’s through pattern-matching. The narrowing technique above is sometimes called _if-splitting_, because an if (which cond and other conditional constructs desugar to) “splits” the union. 

**Aside:** This idea was invented by [Typed Racket](https://docs.racket-lang.org/ts-guide/occurrence-typing.html) by studying how programmers write code in Scheme and Racket programs. It has later proved to be relevant to many real-world retrofitted type systems.


## Introducing Union Types

What we’ve just seen is that with if-splitting, we can eliminate union types. That then raises the possibility that we can also introduce union types! Previously we had rejected such a solution: if we introduced a union, we had no way to deal with it. Now we can safely introduce them in languages that have solutions for deconstructing them.

Indeed, many dynamic languages make free use of union types. For instance, it is common to return #f in Racket or None in Python as an error code, and a proper value for normal execution, resulting in a type of (V U Boolean) or (V U None), respectively, where V is the normal type. Consider this Racket example:

(define (g s)
  (+ 1 (or (string->number s) 0)))

This function accepts a string that may or may not represent a number. If it does, it returns one bigger number; otherwise it returns 1:

(test (g "5") 6)
(test (g "hello") 1)

This works because string->number returns a number or, if the string is not legal, #f. In Racket, all values other than #f are truthy. Thus, legitimate strings short-circuit evaluation of the or, while non-numeric strings result in 0. These therefore serve as a rough-and-ready option types in languages that don’t (or didn’t) have proper datatype constructors.

How can we introduce union types? Curiously, using essentially the same construct that eliminates them! Observe that we no longer need both branches of a conditional to return the same type:

Γ |- C : Bool    Γ |- T : V    Γ |- E : W
\-----------------------------------------
Γ |- (if C T E) : (U V W)

where our notation means “the union of the types represented by V and W”.


## How Many Unions?

When we wrote an algebraic datatype, the variants “belonged” to the new type. We had no mechanism for mixing-and-matching variants.

In contrast, with union types, a new type is a collection of existing types. There’s nothing that prevents those existing types from engaging in several different unions. For instance, we had

(define-type-alias BT (U mt nd))

But we could also write, say,

(struct link ((v : Number) (r : LinkedList)))

and reusing mt to define

(define-type-alias LinkedList (U mt link))

Therefore, given an mt, what “is” it? Is it a BT? A LinkedList? It’s all those, but it’s also just an mt, which can participate in any number of unions. This provides a degree of flexibility that we don’t get with algebraic datatypes—since we can create ad-hoc unions of existing types—but that also means it becomes harder to tell all the ways a value might be used, and also complicates inferring types (if we see an mt constructed, are we also constructing a BT? a LinkedList?). The Hindley-Milner inference algorithm, as we saw it, doesn’t cover these cases, though it can be extended to do so.


## Union Types and Space

Therefore, union types combined with if-splitting gives us an alternate approach of obtaining something akin to algebraic datatypes in our programming language. However, we don’t obtain the space benefits of the algebraic datatype definition. We created two distinct types; in principle, that’s not a problem. However, to write programs, we needed to have predicates (mt? and nd?) that took _any_ value. Therefore, those predicates need type-tags on the values to be able to tell what kind of value they are looking at. Observe that these are _type_ tags, not _variant_ tags, so the amount of space they need is proportional to the number of types in the whole program, not just the number of variants in that particular algebraic datatype definition.


## If-Splitting with Control Flow

This pattern, of dispatching based on type-tests and values, is quite common in dynamic (or “scripting”) languages. These languages do not have a static type system, but they do have safe run-times, which attach type tags to values and provide predicates that can check them. Programmers then adopt programming patterns that take advantage of this.

**Aside:** The term _dynamic_ language seems to have no clear fixed definition. It means, at least, that the language doesn't have static types. Sometimes it's implicit that the language is nevertheless safe. But some people use it to mean that the language has features that let you do things like inspect or even modify the program as it's running (features like eval). In this book I use it in the second sense: not-statically typed, but still safe.

**Aside:** What, then, is a “scripting” language? I use the term to mean a dynamic language that is also very liberal with its types: e.g., many operations are either overloaded and/or very forgiving of what a statically-typed language would consider an error. Scripting languages tend to be dynamic in all three senses: they do not have a static type-system, they are safe, and they tend to have rich features for introspection and even modification. They are designed to maximize expressiveness and thus minimize just about any useful static analysis.

For instance, here’s an example from JavaScript, of a serialization function. A serializer takes a value of (almost) _any_ type and converts it into a string to be stored or transmitted. (This version is adapted from version 1.6.1 of Prototype.js.)

​​function serialize(val) {
  switch (typeof val) {
    case "undefined":
    case "function":
      return false;
    case "boolean":
      return val ? "true" :
                   "false";
    case "number":
      return "" + val;
    case "string":
      return val;
  }
  if (val === null)
    { return "null"; } 

  var fields = \[ ];
  for (var p in val) {
    var v = serialize(val\[p]);
    if (typeof v === "string") {
      fields.push(p + ": " + v);
    }
  }
  return "{ " + 
         fields.join(", ") + 
         " }";
}

Now suppose we’re trying to retrofit a type system onto JavaScript. We would need to type-check such programs. But before we even ask _how_ to do it, we should know what answer to expect: i.e., is this program even type-safe?

The answer is quite subtle. It uses JavaScript’s typeof operator to check the tags. For two kinds of values, it returns false (that is, the type of this function is not Any -> String, it’s actually Any -> (String U Boolean), where the false value is used to signal that the value can’t be serialized—observe that an actual false value is serialized to "false"). For booleans, numbers, and strings, it translates them appropriately into strings. In all these cases, execution returns. (Note, however, that the code also exploits JavaScript’s “fall-through” behavior in switch, so that "undefined" and "function" are treated the same without having to repeat code. The type-checker needs to understand this part of JavaScript semantics.)

If none of these cases apply, then execution falls through; we need to know enough JavaScript to know that this corresponds to the one other return from typeof, namely objects. Now the code splits between objects that are and aren’t null. In the non-null case, it iterates through each field, serializing it in turn. Therefore, this program is actually type-safe…but for very complicated reasons!


## If-Splitting with Control Flow and State

Here’s another program, taken from the Python 2.5.2 standard library:

def insort_right(a, x, lo=0, hi=None):
    if hi is None:
        hi = len(a)
    while lo &lt; hi:
        mid = (lo+hi)//2
        if x &lt; a\[mid]: hi = mid
        else: lo = mid+1
    a.insert(lo, x)

This function inserts an element (x) into an already-sorted list (a). It also takes a low search interval index (lo), which defaults to 0, and a high interval (hi), which defaults to None. It inserts the element into the right place in the array.

Now let’s ask whether this is actually type-correct. Observe that lo and hi are used in several arithmetic operations. These are the ones we’re most interested in.

If it helps, here’s the code with type annotations in [Static Python](https://github.com/facebookincubator/cinder):

from typing import Optional

def insort_right(a, x, lo: int = 0, hi: Optional\[int] = None):
    if hi is None:
        hi = len(a)
    while lo &lt; hi:
        mid = (lo+hi)//2
        if x &lt; a\[mid]:
            hi = mid
        else:
            lo = mid+1
    a.insert(lo, x)

(In Static Python, Optional\[T] is an abbreviation for (T U None). So the annotation on hi above allows the user to pass in either an int or None. What makes the last two arguments optional is (perhaps confusingly) not the type Optional but rather the fact that they have default values in the function header.)

It’s easier to see what’s happening with lo: it’s allowed to be optional; if the optional argument is provided, it must be an int; and if it’s not provided, it has value 0, which also has type int. So its type is effectively (int U int), which is just int, so all uses of lo as an int are fine.

But now consider the type of hi. It is also optional. If it is provided, it has to be an int, which would be fine. But if it’s _not_ provided, its value is None, which cannot be used in arithmetic. However, right at the top, the function checks whether it is None and, if so, _changes_ it to the result of len(a)—which is an int. Therefore, once the if is done, no matter which path the program takes, hi is an int. Thus, the program is actually type-safe.

That’s all well and good for us to reason about by hand. However, our job is to build a type-checker that will neither reject programs needlessly nor approve type-incorrect programs. This balance is very hard to maintain.

This represents the challenge retrofitted type system designers face: they must either reject idiomatic programs or add complexity to the type system to handle them. If we reject the program, we reject many other programs like it, which are idiomatically found in many “scripting” languages. The result would be very safe, but also very useless—indeed, safe _because_ it would be very useless—type-checker (a type-checker that rejects every program would be extremely safe…). Instead, we need an even more complicated solution than what we have seen until now.

**Aside:** See [this paper](https://cs.brown.edu/people/sk/Publications/Papers/Published/gsk-flow-typing-theory/) for how to type such programs.


## The Price of Retrofitting

Retrofitting a type-system onto an existing untyped language clearly puts a heavy burden on the creator of the type system. But it also puts a burden on developers. If the type system is to not reject a bunch of existing code, then it must be based on some heuristics about program structure. The more complex these heuristics grow (as we’ve seen hints of in this chapter), the stranger it will be when a program falls outside what they can handle.

You might argue that it was ever thus: when type-checking algebraic datatypes, too, we had to use pattern-matching to help the type-checker. The difference there is that the type-checker was around at program _construction_ time, so we adhered to its rules from the very start; we didn’t try to add types after the fact. The problem arises when programmers are allowed to write code however they like, and the type-checker must retroactively try to bless them.


## Types and Tags

Finally, we should clarify something important about the typeof operator in JavaScript, which is analogous to the type function in Python. When we impose a type system on JavaScript, we expect, say, the type (Number -> String) to be different from the type (String -> Boolean). Similarly, an object that contains only the fields x and y is very different from the object that contains only the method draw.

However, these nuances are lost on typeof, which is innocent to even the existence of any such type systems. Therefore, all those functions are lumped under one tag, "function", and all those objects are similarly treated uniformly as one tag, "object" (and analogously in Python). This is because their names are misleading: what they are reporting are not the _types_ but rather the run-time _tags_.

The difference between types and tags can grow arbitrarily big. After all, the number of types in a program can grow without bound, and so can their size (e.g., you can have a list of lists of arrays of functions from …). But the set of tags is fixed in many languages, though in those that allow you to define new (data)classes, this set might grow. Nevertheless, tags are meant to take up a fixed amount of space and be checked in a small constant amount of time.

Of course, this difference is not inherently problematic. After all, even in statically-typed languages with algebraic datatypes, we still need space to track variants, which requires a kind of (intra-type) tag. The issue is rather with the choice of _name_: that typeof and type do not, actually, return “types”. A more accurate name for them would be something like tagof, leaving the term “type” free for actual static type systems.
