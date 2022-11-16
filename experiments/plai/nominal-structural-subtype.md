# Nominal Types, Structural Types, and Subtyping

Let’s go back to

(define-type BT
  \[mt]
  \[node (v : Number) (l : BT) (r : BT)])

and ask how we could have represented this in Java.

**Do Now:** Represent this in Java!

How did you do it? Did you create a single class with null for the empty case?

**Exercise:** Why is that solution not object-oriented?


## Algebraic Datatypes Encoded With Nominal Types

We’ll take a different approach. Observe from the datatype definition that we have two constructors, and one type that represents their union. We can encode this in Java as:

abstract class BT {
  abstract public int size();
}

class mt extends BT {
  public int size() {
    return 0;
  }
}

class node extends BT {
  int v;
  BT l, r;
  node(int v, BT l, BT r) {
    this.v = v;
    this.l = l;
    this.r = r;
  }
  public int size() {
    return 1 + this.l.size() + this.r.size();
  }
}

class Main {
  public static void main(String\[] args) {
    BT t = new node(5, new node(3, new mt(), new mt()), new mt());
    System.out.println(t.size());
  }
}

How is the “if-splitting” addressed here? It’s done in a hidden way, through dynamic dispatch. When we invoke a method, Java makes sure we run the right method: there are actually two concrete size methods, and the run-time picks the right one. Once that choice is made, the class in which the method resides automatically determines what is bound. Thus, the size in node can safely use this.l and this.r, and the type-checker knows that those fields exist.

This is, then, similar to, yet different from, our two prior solutions: using algebraic datatypes and union types. The solutions are structurally different, but they are all similar in that some _syntactic_ pattern must be used to make the program statically type-able. With algebraic datatypes, it was pattern-matching; with union types, it was if-splitting; in Java, it’s the splitting of the code into separate methods.

The algebraic datatype and Java solutions are even more connected than we might imagine. With algebraic datatypes, we fixed the set of variants; but we were free to add new functions _without having to edit existing code_. In Java, we fix the set of behaviors (above, one method), but can add new variants without having to edit existing code. Therefore, neither has an inherent advantage over the other, and one’s strengths are the other’s weakness. How to do _both_ at once is the essence of the [Expression Problem](https://en.wikipedia.org/wiki/Expression_problem). See also the concrete examples and approaches given in these two papers, one focusing on a [Java-based approach](https://cs.brown.edu/~sk/Publications/Papers/Published/kff-synth-fp-oo/) and another [function-centric](https://cs.brown.edu/~sk/Publications/Papers/Published/kf-ext-sw-def/).


## Nominal Types

The type system in Java is representative of an entire class of languages. These have _nominal_ types, which means the _name_ of a class matters. (“Nominal” comes from the Latin _nomen_, or name.) It’s easiest to explain with an example.

Above we have the following class:

class mt extends BT {
  public int size() {
    return 0;
  }
}

Let’s now suppose we create another class that is identical in every respect but its name:

class empty extends BT {
  public int size() {
    return 0;
  }
}

Let’s say we have a method that takes mt objects:

class Main {
  static int m(mt o) {
    return o.size();
  }
  public static void main(String\[] args) {
    System.out.println(m(new mt()));
  }
}

But observe that empty is a perfectly good substitute for mt: it too has a size method, which too takes no arguments, and it too returns an int (in fact, the very same value). Therefore, we try:

class Main {
  static int m(mt o) {
    return o.size();
  }
  public static void main(String\[] args) {
    System.out.println(m(new empty()));
  }
}

But Java rejects this. That’s because it expects an object that was constructed by the actual class mt, not just one that “looks like” it. That is, what matters is which actual (named) class, not what _structure_ of class, created the value.


## Structural Types

In contrast, we can imagine a different type system: one where the type of each of the above classes is not its name but rather a description of what fields and methods it has: i.e., it’s structure, or its “services”. For instance, we might have:

mt : {size : ( -> int)}
node : {size : ( -> int)}

That is, each of these is a collection of names (one name, to be precise), which is a method that takes no parameters and returns an int. Whenever two types are the same, objects of one can be used where objects of the other kind are expected. Indeed, it is unsurprising that both kinds of trees have the same type, because programs that process one will invariably also need to process the other because trees are a union of these two types. Similarly, we also have

empty : {size : ( -> int)}

The above m method might be written as:

static int m(o : {size : (-> int)}) {
  return o.size();
}

That is, it only indicates what shape of object it expects, and doesn’t indicate which constructor should have made it. This is called _structural_ typing, though the Internet appears to have decided to call this “duck” typing (though it’s hard to be clear: there is no actual theory of duck typing to compare against well-defined theories of structural typing: [Abadi and Cardelli](https://www.springer.com/gp/book/9780387947754) represent a classical viewpoint, and here’s an [extension](https://cs.brown.edu/~sk/Publications/Papers/Published/pgk-sem-type-fc-member-name/) for modern “scripting” languages).


## Nominal Subtyping

We’ve been writing a bit gingerly about Java above: because we know that the m method will accept not only mt’s but also anything that is a sub-class of mt. Let’s explore this further.

To simplify things, let’s make some basic classes:

class A { String who = "A"; }
class B extends A { String who = "B"; }
class C extends A { String who = "C"; }
class D { String who = "D"; }

We’ll also create a shell “runner”:

class Main {
 public static void main(String\[] args) {
   System.out.println((true ? \_\_\_\_\_ : \_\_\_\_\_).who);
 }
}

and try filling in different values for the blanks and seeing what output we get:

System.out.println((true ? new B() : new B()).who);

Unsurprisingly, this prints "B". What about:

System.out.println((true ? new B() : new A()).who);

You might expect this to also print "B", because that’s the value that we created. However, it actually prints "A"! Let’s see a few more examples:

System.out.println((true ? new B() : new C()).who);

Will this print "B"? No, in fact, this also prints "A"! How about:

System.out.println((true ? new B() : new D()).who)

System.out.println((true ? new B() : 3).who)

Both of these produce a static error. It’s instructive to read the error message: in both cases they reference Object. In the former case, it’s because there is nothing else common to B and D. But in the latter case, the primitive value 3 was effectively converted into an object—new Integer(3)—and those two object types were compared.

What is happening in the type system that causes this error? The cause is documented here:

<https://docs.oracle.com/javase/specs/jls/se8/html/jls-15.html#jls-15.25.3>

Specifically, the document says:

The type of the conditional expression is the result of applying capture conversion (§5.1.10) to lub(T1, T2).

where “lub” stands for “least upper bound”: the “lowest” class “above” all the given ones. This type is determined _statically_. That is, the type rule is essentially:

Γ |- C : Bool    Γ |- T : V    Γ |- E : W    X = lub(V, W)
\----------------------------------------------------------
Γ |- (if C T E) : X

Contrast this to the other rules we’ve seen for conditionals! The first type rule we saw was the most rigid, but produced the most usable values (because there was no ambiguity). The second type rule, for union types, was less rigid, but as a result the output type could have a union that needed to be split. This type rule is even less rigid (in terms of what the two branches produce), but the result could be as general as Object, with which we can do almost nothing.


## Subtyping

The general principle here is called _subtyping_: we say that type X is a subtype of Y, written X &lt;: Y (read the &lt;: like a “less than” or “contained”), whenever X can be used wherever a Y was expected: i.e., X can _safely_ be _substituted_ for Y.

Java chose to make sub-_classes_ into sub-_types_. Not all object-oriented languages do this, and indeed many consider it to be a mistake, but that’s the design Java has. Therefore, a sub-class is expected to offer at least as many services as its super-class; and hence, it can be substituted where a super-class is expected. The lub computation above finds the _most specific_ common super-type.

This is an account of how subtyping works for _nominal_ systems. This has the virtue of being fairly easy to understand. We can also define subtyping for _structural_ systems, but that is rather more complex: some parts are easy to follow, other parts are a bit more tricky (but essential to obtain a sound type system). For a detailed explanation, with an illustrative example, see [section 33.6.1 of PAPL](https://papl.cs.brown.edu/2020/objects.html#%28part._subtyping%29).
