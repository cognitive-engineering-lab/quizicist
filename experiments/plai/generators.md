# Control: Generators


## A Canonical Example

Consider the following canonical Python program that uses generators:

def nats():
  n = 0
  while True:
    yield n
    n += 1

g = nats()

next(g) + next(g) + next(g)

produces 0 + 1 + 2 = 3. But how does it work?

At a textual level, we can understand it as follows. nats looks like a function, but it has the keyword yield in it. This makes it not a function but a _generator_. Its body initializes n to 0, then goes into an infinite loop. Each time through the loop, it _yields_ the current value of n, then increments it, before continuing the loop.

Outside the definition of nats, we define g to be an _instance_ of the generator, and each call to next gets the next yielded value. This explains the result. What we need to do is understand what is going on inside nats, and hence what happens with generators in general.

It is clear that we _cannot_ think of nats (or of the generator returned by it) as a function. If we do, then clearly it goes into an infinite loop. That means the very first next call would run forever; it would never produce a value, which enables the next next call, and then the third, producing the sum. To see this, imagine we had the following version instead:

def natsr():
  n = 0
  while True:
    return n
    n += 1

natsr() + natsr() + natsr()

Here, even though natsr (“nats with return”) has an infinite loop, every time Python runs the return, it halts the function and returns. Furthermore, on the next call, we start again from the beginning of natsr. As a result, each call produces 0 so the sum is also 0.

In contrast, that is clearly not what is happening in (the generator created by) nats. Rather, it’s clear that—as the name yield suggests—the computation is _halting_ when the yield occurs. When we call next, computation does not start at the top of nats; if it did, n would be 0. Instead, it _resumes_ from where it left off, so that the value of n is incremented and the next iteration of the while loop occurs.

If all of this sounds suspiciously like variables in a scope being held on to by a closure, you’re on the right track. To understand this more, though, we need to peer a bit more closely at the evaluation. While we could run this in the [Python Tutor](https://pythontutor.com/python-debugger.html#mode=edit), that tool does not really have the support necessary for us to understand what is happening in this program. Instead, we will turn to our Stacker.

**Aside: **In Python, generators are merely syntactic over the more general notion of _iterators_. Iterators response to the next protocol. To learn how a generator desugars into an iterator, see [this StackOverflow post](https://stackoverflow.com/questions/2776829/difference-between-pythons-generators-and-iterators). To understand Python generators in more depth, see sections 4.1 and 4.3 of [this paper](https://cs.brown.edu/~sk/Publications/Papers/Published/pmmwplck-python-full-monty/).


## Translating to SMoL

The following program is a rough simulation of the above Python program _if_ SMoL had a notion of yield, which it does not. To avoid unbound identifier errors, we will use the following simple definition of yield:

(deffun (yield n)
  n)

We can then translate the above code as follows:

(deffun (gen)
  (defvar n 0)
  (deffun (loop)
    (yield n)
    (set! n (+ n 1))
    (loop))
  (loop))

(+ (gen) (gen) (gen))

For simplicity, we’re ignoring the step where we _instantiate_ the generator: i.e., we can have only one copy of the generator in this version, whereas the Python version lets us instantiate multiple. We will return to this later.

Observe that running the above program goes into an infinite loop, because yield does not “yield”. However, because the Stacker shows us intermediate steps in the computation, it still provides something very useful.

Now that we have this program, let’s run it through the Stacker.

At this point, the oldest frame represents the top-level expression, which is waiting for the first call to gen to compute. Inside gen, we have initialized n to 0. Now we are about to start computing the (potentially) infinite loop.

Here is what is happening here. The top-level computation is waiting for the call to gen to finish and produce an answer. _Within_ the generator, the computation has initialized n and is about to yield its current value. What is critical is the _context_ of this operation:

(begin
  •
  (set! n (+ n 1))
  (loop))

in @1678, which has no bindings and hence defers to @1909. This binds n to 0.

Now, suppose we could break up this stack into two parts (with the environment and store shared as needed):

(+ • (gen) (gen))
in @1233


(begin
  •
  (set! n (+ n 1))
  (loop))
in @1678

Observe that each part looks like a full-fledged stack in its own right! The environment @1233 refers to names that the top-level uses (such as gen), while the environment @1678 (and hence @1909) refers to ones that the generator uses (such as n).

Until now, however, we have acted as if a program has only one stack. The simplest conceptual model for a generator is:

Each generator has its own local stack.

That is, the generator’s stack does not know about the computation in the main program or in any other generators. It only knows about the computation that it is performing. A yield does two things:

1. It transparently (i.e., without the programmer’s knowledge) stores the _local_ stack with the generator data structure.
2. It returns the yielded value to the stack that invoked the generator.

Everything else—variables, aliasing, closures, growth and decline of the stack with functions calls and returns, etc.—stays exactly the same. The only difference is that calling a generator causes computation to start, or resume the context, in a separate, disconnected stack.

Thus, in the above model, after the first yield succeeds, the top-level stack frame would be

(+ 0 • (gen))
in @1233

invoking the generator. This would resume the previous stack, so n would be set to 1, and the next iteration of the loop would run, which would

1. Store the generator’s stack (which, conceptually, is exactly the same—only the value of n has changed, but that is in the environment), and
2. return the new value of n (i.e., 1) to the top-level stack.

This would result in 

(+ 0 1 •)
in @1233

repeating the above process, and hence producing 3.


## A Richer Example

Using what we have learned, let us consider another Python example:

def nats():
  n = 0
  while True:
    yield n
    n += 1

def odds():
  ns = nats()
  while True:
    n = next(ns)
    if n % 2:
      yield n

g = odds()

next(g) + next(g) + next(g)

This program has two distinct generator creators: the one we’ve already seen for natural numbers, and one more that filters the natural numbers to produce only odd numbers.

We can now think of control proceeding as follows. First, we make an instance of odds and bind it to g. This immediately creates an instance of nats and binds it (within the instance of odds) to ns. Now all our generators are set up and ready to compute.

We now begin the infinite loop in odds. This calls the natural number generator. At this point, the odd number generator’s local stack looks like

while True:
  n = •
  if n % 2:
    yield n

in an environment where ns is bound to a generator and n is uninitialized

Because we have called a generator, not a function, computation now runs in that generator’s own stack. This is the natural number generator, which we have already studied. It binds n to 0 and then yields, storing its local stack—

while True:
  •
  n += 1
in an environment where n is bound to 0

—and returning 0 to the odd number generator.

This resumes the odd generator’s stack. This binds n to 0 and performs the comparison. It fails, continuing the loop body:

    n = next(ns)
    if n % 2:
      yield n

Now we are again ready to invoke the natural number generator. The odd number generator’s _local_ stack is unchanged from before (same context, same environment, except this time the environment does have a binding for n, to 0). Meanwhile, the natural’s generator resumes from

while True:
  •
  n += 1

in an environment where n is bound to 0

This increments n and resumes the loop body:

    yield n
    n += 1

This immediately causes it to yield 1, leaving the stack

while True:
  •
  n += 1

in an environment where n is bound to 1

This resumes the odd generator’s stack. This binds n to 1, so the conditional succeeds. Therefore, the stack at the point of yielding becomes

  while True:
    n = next(ns)
    if n % 2:
      •

in an environment where ns is bound to a generator and n is bound to 1

This completes the first call to next(g), enabling the top-level stack frame to have the context

1 + • + next(g)

From this, we can see the next two computations will produce 3 and 5, and hence the total of 9.
