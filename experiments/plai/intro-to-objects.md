# Introduction to Objects

Now we’re ready to start looking at our first major language feature that goes beyond SMoL: objects. Not all SMoL languages have objects; though many do, they have them in very different ways. Nevertheless, what we will see is that there is a fairly uniform way to think about objects across all these languages, and furthermore this way of thinking really builds on our understanding of SMoL.

When building the essence of objects, though, we now have a choice: we can do it either in the core or through syntactic sugar. The former is frustrating in several ways:

- We have to do more low-level bookkeeping (e.g., with environments) that may not necessarily be _instructive_.
- The interpreter gets larger and more unwieldy, because all the new constructs go in the same place rather than each being independent definitions.
- Most of all: it becomes a lot harder to write illustrative programs and tests, because the core language may not have all the features we need to make this convenient.

In contrast, all these problems go away if we use syntactic sugar instead. Therefore, even though a real implementation may well have at least parts of objects (especially the parts needed for efficiency) in the core language, we are going to build objects entirely through desugaring, using macros. In fact, in this book, we will do something even simpler: we will give _concrete examples _of what programs desugar _to_. Figuring out the general desugaring will be left as an exercise for you. To aid in that process, we will write code in as stylized a form as possible, not using any short-cuts that might obscure the macro rules.

**Note:** The programs in this section cannot be written in the language plait. Instead, we will use  #lang racket, which does not perform static type-checking. Add the line

(require \[only-in plait test print-only-errors])

at the top to access the testing operator and printing control parameter from plait.

**Exercise:** Spot the point at which the type-checker would become problematic. **Hint:** The easiest way is, of course, to keep using #lang plait until you run into a problem. Make sure you understand what the problem is!


## What is an Object?

The central question we must answer, before we start thinking about implementations, is what an object is. There is a lot of variation between languages, but they all seem to agree that an object is

- a value, that
- maps names to 
- stuff: either other values or “methods”.

From a minimalist perspective, methods seem to be just functions, and since we already have those in the language, we can put aside this distinction.

**Terminology:** We will use the term _member_ to refer to a generic entry in an object, when we don’t want to make a distinction between fields and methods.

How can we capture this? An object is just a value that dispatches on a given name. For simplicity, we’ll use lambda to represent the object and Racket’s case construct to implement the dispatching. Here’s an object that responds to either add1 or sub1, and in each case returns a function that either increments or decrements:

(define o-1
  (lambda (m)
    (case m
      \[(add1) (lambda (x) (+ x 1))]
      \[(sub1) (lambda (x) (- x 1))])))

We would use this as follows:

(test ((o-1 'add1) 5) 6)

**Aside:** Observe that basic objects are a generalization of lambda to have multiple “entry-points”. Conversely, a lambda is an object with only _one_ entry-point; therefore, it doesn’t need a “method name” to disambiguate.

Of course, writing method invocations with these nested function calls is unwieldy (and is about to become even more so), so we’d be best off equipping ourselves with a convenient syntax for invoking methods:

(define (msg o m . a)
  (apply (o m) a))

This enables us to rewrite our test:

(test (msg o-1 'add1 5) 6)

**Aside:** We’ve taken advantage of Racket’s variable-arity syntax: . a says “bind all the remaining—zero or more—arguments to a list named a”. The apply function “splices” in such lists of arguments to call functions.

Observe something very subtle about our language: nothing precludes us from writing an arbitrary expression in the second position of a call to msg. That is, we can _compute_ which member we want to access. For instance:

(test (msg o-1 (first '(add1)) 5) 6)

This is unlike many languages with objects, which force you to write the literal _name_ of the member (e.g., in Java, in most cases). We’ll return to this later!

**Aside:** This is a general problem with desugaring: the target language may allow expressions that have no counterpart in the source, and hence cannot be mapped back to it. Fortunately we don’t often need to perform this inverse mapping, though it does arise in some debugging and program comprehension tools. More subtly, however, we must ensure that the target language does not produce _values_ that have no corresponding equivalent in the source.

Now that we have basic objects, let’s start adding the kinds of features we’ve come to expect from most object systems.


## The “Object” Pattern

We can consolidate what we have written above as the “object” pattern: code that looks like

  (lambda (m)
    (case m
      … dispatch on each of the members …))


## Constructors

A constructor is simply a function that is invoked at object construction time. We currently lack such a feature, but by turning an object from a literal into a function that takes constructor parameters, we achieve this effect:

(define (o-constr-1 x)
  (lambda (m)
    (case m
      \[(addX) (lambda (y) (+ x y))])))

(test (msg (o-constr-1 5) 'addX 3) 8)
(test (msg (o-constr-1 2) 'addX 3) 5)

In the first example, we pass 5 as the constructor’s argument, so adding 3 yields 8. The second is similar, and shows that the two invocations of the constructors don’t interfere with one another (just as we would expect from static scope).


## The “Class” Pattern

We’ve actually made quite a momentous change with this small addition: we’ve gone from objects to functions-that-make-objects (notice the object pattern inside the function). But traditionally, what makes objects? Classes! And classes typically have constructors. So in the process of introducing constructors, we have actually also shifted from objects to classes. The “class” pattern, at its simplest, is:

(define (class constructor-params)
  … the object pattern …)


## State

Many people believe that objects primarily exist to encapsulate state.

**Aside:** Curiously, Alan Kay, who won a Turing Award for inventing Smalltalk and modern object technology, disagrees. In [_The Early History of Smalltalk_](http://worrydream.com/EarlyHistoryOfSmalltalk/), he says, “\[t]he small scale \[motivation for OOP] was to find a more flexible version of assignment, and then to try to eliminate it altogether”. He adds, “It is unfortunate that much of what is called ‘object-oriented programming’ today is simply old style programming with fancier constructs. Many programs are loaded with ‘assignment-style’ operations now done by more expensive attached procedures.”

We certainly haven’t lost that ability. If we desugar to a language with variables, we can easily have multiple methods mutate common state, such as a constructor argument:

(define (mk-o-state-1 count)
  (lambda (m)
    (case m
      \[(inc) (lambda () (set! count (+ count 1)))]
      \[(dec) (lambda () (set! count (- count 1)))]
      \[(get) (lambda () count)])))

We have changed the name to mk-o-… to reflect the fact that this is an object-_maker_, i.e., analogous to a class. For instance, we can test a sequence of operations:

(test (let (\[o (mk-o-state-1 5)])
        (begin (msg o 'inc)
               (msg o 'inc)
               (msg o 'dec)
               (msg o 'get)))
      6)

and also notice that mutating one object doesn’t affect another:

(test (let (\[o1 (mk-o-state-1 3)]
            \[o2 (mk-o-state-1 3)])
        (begin (msg o1 'inc)
               (msg o1 'inc)
               (+ (msg o1 'get)
                  (msg o2 'get))))
      (+ 5 3))


## Private Members

Another common object language feature is private members: ones that are visible only inside the object, not outside it.  

**Aside:** Except that, in Java, instances of other classes of the same type are privy to “private” members. Otherwise, you would simply never be able to implement an Abstract Data Type. Note that classes are not Abstract Data Types!

These may seem like an additional feature we need to implement, but we already have the necessary mechanism in the form of locally-scoped, lexically-bound variables:

(define (mk-o-state-2 init)
  (let (\[count init])
    (lambda (m)
      (case m
        \[(inc) (lambda () (set! count (+ count 1)))]
        \[(dec) (lambda () (set! count (- count 1)))]
        \[(get) (lambda () count)]))))

The code above uses lexical scoping to ensure that count remains hidden to the world. Trying to access count directly from the outside will fail.


## A Refined “Class” Pattern

With this change, we can now refine our pattern for classes:

(define (class-w/-private constructor-params)
  (let (\[private-vars …] …)
    … the object pattern …))

which we can also write as:

(define class-w/-private
  (lambda (constructor-params)
    (let (\[private-vars …] …)
      … the object pattern …)))

We’ll see in a moment why we might want to do this.


## Static Members

Another feature often valuable to users of objects is static members: those that are common to all instances of the same type of object. This, however, is merely a lexically-scoped identifier (making it private) that lives outside the constructor (making it common to all uses of the constructor).

Suppose we want to keep a count of how many instances of a kind of object are created. This count cannot be inside any one of those objects, because they would not “know” about each other; rather, the constructor needs to keep track of this. This is the role of static members, and the variable counter plays this role in the following example:

(define mk-o-static-1
  (let (\[counter 0])
    (lambda (amount)
      (begin
        (set! counter (+ 1 counter))
        (lambda (m)
          (case m
            \[(inc) (lambda (n) (set! amount (+ amount n)))]
            \[(dec) (lambda (n) (set! amount (- amount n)))]
            \[(get) (lambda () amount)]
            \[(count) (lambda () counter)]))))))

We’ve written the counter increment where the “constructor” for this object would go, though it could just as well be manipulated inside the methods.

To test it, we should make multiple objects and ensure they each affect the global count:

(test (let (\[o (mk-o-static-1 1000)])
        (msg o 'count))
      1)

(test (let (\[o (mk-o-static-1 0)])
        (msg o 'count))
      2)

It is productive to see how this program runs through the Stacker. For simplicity, we can ignore most of the details and focus just on the core static pattern. Here is a Stacker-friendly translation:

\#lang stacker/smol/hof

(defvar mk-o-static-1
  (let (\[counter 0])
    (lambda (amount)
      (begin
        (set! counter (+ 1 counter))
        (lambda (m)
          (if (equal? m "get")
              (lambda () amount)
              (if (equal? m "count")
                  counter
                  (error "no such member"))))))))

(defvar o1 (mk-o-static-1 1000))
(defvar o2 (mk-o-static-1 0))
(o1 "count")
(o2 "count")

Run this and see how the static member works!


## A Re-Refined “Class” Pattern

Now we can refine our pattern for classes even further:

(define class-w/-private&static
  (let (\[static-vars …] …)
    (lambda (constructor-params)
      (let (\[private-vars …] …)
        … the object pattern …))))

Put differently:

(define class-w/-private&static
  (let (\[static-vars …] …)
    … the class-w/-private pattern …))

**Exercise: **Statics, as defined here, are accessed through _objects_. However, statics by definition belong to a _class_, not to objects, and hence should be accessible through the class itself — for instance, even if no instances of the class have ever been created. (In the working example above, one should be able to access the count when it is still 0.) Modify the pattern above to respect this by making static members be accessible directly through the _class_ rather than through objects.


## Objects with Self Reference

Until now, our objects have simply been packages of named functions: functions with multiple named entry-points, if you will. We’ve seen that many of the features considered important in object systems are actually simple patterns over functions and scope, and have indeed been used—without names assigned to them—for decades by programmers armed with lambdas.

What this means is that the different members are actually independent of each other: they can’t, for instance, directly reference one another. This is too limiting for a true object system, where a method has a way of referencing the object it is part of so that it can use other members of that object. To enable this, many object systems automatically equip each object with a reference to itself, often called self or this. Can we implement this?

**Aside**: I prefer this slightly dry way of putting it to the anthropomorphic “knows about itself” terminology often adopted by object advocates. Indeed, note that we have gotten this far into object system properties without ever needing to resort to anthropomorphism. 


### Self-Reference Using Mutation

Yes, we can! This relies on a pattern that sets up the name for the recursive reference, then uses that to create the body that will employ the recursion, and finally uses mutation to make the name refer to the defined body. For simplicity, we will go back to the_ object_ pattern, ignoring the class-related features:

(define o-self!
  (let (\[self 'dummy])
    (begin
      (set! self
            (lambda (m)
              (case m
                \[(first) (lambda (x) (msg self 'second (+ x 1)))]
                \[(second) (lambda (x) (+ x 1))])))
      self)))

We can test it by having first invoke second. Sure enough, this produces the expected answer:

(test (msg o-self! 'first 5) 7)

Here is the above program translated into the simpler smol/fun language. Once translated, we can run it in the Stacker:

\#lang stacker/smol/hof

(defvar o-self!
  (let (\[self 0])
    (begin
      (set! self
            (lambda (m)
              (if (equal? m "first")
                  (lambda (x) ((self "second") (+ x 1)))
                  (if (equal? m "second")
                      (lambda (x) (+ x 1))
                      (error "no such member")))))
      self)))

((o-self! "first") 5)

Run it for yourself! What do you learn from it? Do you see how self works?

**Exercise:** This change to the object pattern is essentially _independent_ of the class pattern. Extend the class pattern to include self-reference.


### Self-Reference Without Mutation

There’s another pattern we can use that avoids mutation, which is to send the object itself as a parameter:

(define o-self-no!
  (lambda (m)
    (case m
      \[(first) (lambda (self x) (msg/self self 'second (+ x 1)))]
      \[(second) (lambda (self x) (+ x 1))])))

Each method now takes self as an argument. That means method invocation must be modified to follow this new pattern:

(define (msg/self o m . a)
  (apply (o m) o a))

That is, when invoking a method on o, we must pass o as a parameter to the method. Notice that we did not do any such thing when invoking a function! This distinguishes functions and methods.

Obviously, this approach is dangerous because we can potentially pass a different object as the “self”. Exposing this to the developer is therefore probably a bad idea; if this implementation technique is used, it should only be done in desugaring. (Unfortunately, Python exposes exactly this in its surface syntax.) Sure enough:

(test (msg/self o-self-no! 'first 5) 7)


## Dynamic Dispatch

Finally, we should make sure our objects can handle a characteristic attribute of object systems, which is the ability to invoke a method without the caller having to know or decide which object will handle the invocation.

Suppose we have a binary tree data structure, where a tree consists of either empty nodes or leaves that hold a value. In traditional functions, we are forced to implement some form of conditional—such as a type-case—that exhaustively lists and selects between the different kinds of trees. If the definition of a tree grows to include new kinds of trees, each of these code fragments must be modified.

Dynamic dispatch solves this problem by making that conditional branch disappear from the user’s program and instead be handled by the method selection code built into the language. The key feature that this provides is an extensible conditional. This is one dimension of the extensibility that objects provide.

Let’s first define our two kinds of tree objects:

(define (mt)
  (let (\[self 'dummy])
    (begin
      (set! self
            (lambda (m)
              (case m
                \[(sum) (lambda () 0)])))
      self)))

 

(define (node v l r)
  (let (\[self 'dummy])
    (begin
      (set! self
            (lambda (m)
              (case m
                \[(sum) (lambda () (+ v
                                     (msg l 'sum)
                                     (msg r 'sum)))])))
      self)))

With these, we can make a concrete tree:

(define a-tree
  (node 10
        (node 5 (mt) (mt))
        (node 15 (node 6 (mt) (mt)) (mt))))

And finally, test it:

(test (msg a-tree 'sum) (+ 10 5 15 6))

Observe that both in the test case and in the sum method of node, there is a reference to ’sum without checking whether the recipient is a mt or node. Instead, the _language’s run-time system_ extracts the recipient’s sum method and invokes it. This conditional missing from the user’s program, and handled automatically by the language,  is the essence of dynamic dispatch.

It’s worth noting that we didn’t have to change our pattern to add dynamic dispatch; _it simply followed as a result of the rest of the design_.

**Aside:** This property—which appears to make systems more black-box extensible because one part of the system can grow without the other part needing to be modified to accommodate those changes—is often hailed as a key benefit of object-orientation. While this is indeed an advantage objects have over functions, there is a dual advantage that functions have over objects, and indeed many object programmers end up contorting their code—using the Visitor pattern—to make it look more like a function-based organization. Read [_Synthesizing Object-Oriented and Functional Design to Promote Re-Use_](http://www.cs.brown.edu/~sk/Publications/Papers/Published/kff-synth-fp-oo/) for a running example that will lay out the problem in its full glory. Try to solve it in your favorite language, and see the [Racket solution](http://www.cs.utah.edu/plt/publications/icfp98-ff/paper.shtml).
