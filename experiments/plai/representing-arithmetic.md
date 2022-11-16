# SImPl: Representing Arithmetic

Let’s start thinking about actually writing an evaluator. We’ll start with a simple arithmetic language, and then build our way up from there. So our language will have

- numbers
- some arithmetic operations: in fact, _just_ addition

and nothing more for now, so we can focus on the basics. Over time we’ll build this up.

Before we can think about the body of an evaluator, however, we need to figure out its type: in particular, what will it consume?


## Representing Programs

Well, what _does_ an evaluator consume? It consumes **programs**. So we need to figure out how to _represent programs_.

Of course, computers represent programs all the time. When we’re writing code, our text editor holds the program source. Every executable on disk and in memory is a representation of a program. When we visit a Web page, it sends down a JavaScript program. These are all programs represented in the computer. But all these are a bit inconvenient for our needs, and we’ll come up with a better representation in a moment.

Before thinking about represent_ations_, let’s think about what we’re represent_ing_. Here are some example (arithmetic) programs:

1
0
\-1
2.3
1 + 2
3 + 4

Already we have a question. How should we _write_ our program? You can see where this is going: should we be writing the sum of 1 and 2 as

1 + 2

or as

(+ 1 2)

\+ 1 2

1 2 +

and so on. (For that matter, we can even ask what numeral system to use for basic numbers: e..g, should we write 3 or III? You can [program with the latter](https://github.com/shriram/roman-numerals) if you’d really like to.)

These are questions of what _surface syntax_ to use. And they are very important! And interesting! And important! People get really attached to some surface syntaxes over the other (you may already be having some feelings about Racket’s parenthetical syntax…I certainly do).

Thus, these are great human-factors considerations. But for now these are a distraction in terms of getting to understand the _models_ underlying languages. Therefore, we need a way to represent all these different programs in a way that ignores these distinctions.


## Abstract Syntax

This leads us to the first part of SImPl (the Standard Implementation Plan): the creation of what is called _abstract syntax_. In abstract syntax, we represent the essence of the input, ignoring the superficial syntactic details. Thus, in abstract syntax, all of the above programs will have the exact same representation.

An abstract syntax is an in-computer representation of programs. There are many kinds of data we can use as a representation, so let’s think about the kinds of programs we might want to represent. For simplicity, we’ll assume that our language has only numbers and addition; once we can handle that, it’ll be easy to handle additional operations. Here are some sample (surface syntax) programs:

1
2.3
1 + 2
1 + 2 + 3
1 + 2 + 3 + 4

In conventional arithmetic notation, of course, we have to worry about the order of operations and what operations take precedence over what others. In abstract syntax, that’s another detail we want to ignore; we’ll instead assume that we are working internally with the equivalent of fully-parenthesized expressions, where all these issues have been resolved. Thus, it’s as if the last two expressions above were as

(1 + 2) + 3
1 + (2 + 3)
1 + ((2 + 3) + 4)

Observe, then, that each side of the addition operation can be a full-blown expression in its own right. This gives us a strong hint as to what kind of representation to use internally: a _tree_. Indeed, it’s so common to use _abstract syntax trees_ that the abbreviation, AST, is routinely used without explanation; you can expect to see it in books, papers, blog posts, etc. on this topic.

You have quite possibly seen this idea before: it’s called _sentence diagramming_ (read more on [Wikipedia](https://en.wikipedia.org/wiki/Sentence_diagram)).

An NP is a Noun Phrase, V is a Verb, and so on. Observe how the sentence diagram takes a _linear_ sentence and turns it into a _tree-shaped_ representation of the grammatical structure. We want to do the same for programs.


## Representing Abstract Syntax

In the rest of this book, except where indicated otherwise, we will implement things in the [plait](https://docs.racket-lang.org/plait/index.html)  language of Racket. Please make sure you have plait installed to follow along.

We will create a new tree datatype in plait to represent ASTs. In the sentence diagram above, the leaves of the tree are words, and the nodes are grammatical terms. In our AST, the leaves will be numbers, while the nodes will be operations on the trees representing each sub-expression. For now, we have only one operation: addition. Here’s how we can represent this in plait syntax:

(define-type Exp
  \[num (n : Number)]
  \[plus (left : Exp) (right : Exp)])

This says:

- We are defining a new type, Exp

- There are two ways of making an Exp

- One way is through the constructor num:

  - A num takes one argument
  - That argument must be an actual number

- The other way is through the constructor plus:

  - A plus takes two arguments
  - Both arguments must be Exps

If it helps as you read what follows, this is very analogous to the following Java pseudocode skeleton (or the analog with Python dataclasses):

abstract class Exp {}

class num extends Exp {
  num(Number n) { … }
}

class plus extends Exp {
  plus(Exp left, Exp right) { … }
}

Let’s look at how some of the previous examples would be represented:

|                    |                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Surface Syntax** | **AST**                                                                               |
| 1                  | (num 1)                                                                               |
| 2.3                | (num 2.3)                                                                             |
| 1 + 2              | (plus (num 1) (num 2))                                                                |
| (1 + 2) + 3        | (plus (plus (num 1) (num 2))      (num 3))                                            |
| 1 + (2 + 3)        | (plus (num 1)      (plus (num 2) (num 3)))                                            |
| 1 + ((2 + 3) + 4)  | (plus (num 1)      (plus (plus (num 2)                  (num 3))            (num 4))) |

Observe a few things about these examples:

- The datatype definition does not let us _directly_ represent surface syntax terms such as 1 + 2 + 3 + 4; any ambiguity has to be handled by the time we construct the corresponding AST term.
- The number representation might look a bit odd: we have a num constructor whose only job is to “wrap” a number. We do this for consistency of representation. As we start writing programs to process these data, it’ll become clear why we did this.
- Notice that every significant part of the expression went into its AST representation, though not always in the same way. In particular, the + of an addition is represented by the _constructor_; it is not part of the parameters.
- The AST really doesn’t care what surface syntax was used. The last term could instead have been written as(+ 1   (+ (+ 2 3)      4)) and it would presumably produce the same AST. 

In short, ASTs are tree-structured data that **represent programs in programs**. This is a profound idea! In fact, it’s one of the great ideas of the 20th century, building on the brilliant work of Gödel (encoding), Turing (universal machine), von Neumann (stored program computer), and McCarthy (metacircular interpreter).

**Aside:** Not every part of the source program has been represented in the AST. For instance, presumably both 1 + 2 and 1    +  2 would be represented the same way, ignoring the spaces. In practice, a real language implementation does need to know something about the syntax: for instance, to highlight pieces of the program source when there is an error, as DrRacket does. Therefore, real-world implementations use abstract syntax but with metadata relating it back to the source.
