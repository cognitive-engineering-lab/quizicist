# Parsing: From Source to ASTs


## The Problem

**Note:** What follows is purely for your edification. You will be given a parse function that does everything described below. The text is only to help you understand what it does. If on your first reading all this feels a bit too complicated, you can safely ignore it; just make sure you understand _what_ parse does (if not _how_).

Earlier we went through the basic steps of the SImPl, but we left open a big question: how do we get programs _into_ the AST representation? Of course, the simplest way is what we already did: to write the AST constructors directly, e.g.,

(num 1)

(plus (num 1) (num 2))

(plus (num 1)

      (plus (num 2) (num 3)))

However, this can get very tedious. We don’t want to have to write (num …) every time we want to write a number, for instance! That is, we’d like a more convenient surface syntax, along with a _program_ to translate that into ASTs.

As we have already seen, there is a large number of surface syntaxes we can use, and we aren’t even limited to textual syntax: it could be graphical; spoken; gestural (imagine you’re in a virtual reality environment); and so on. As we have noted, this wide range of modalities is important—especially so if the programmer has physical constraints—but it’s outside the range of our current study. Even with textual syntax, we have to deal with issues like ambiguity (e.g., order of operations in arithmetic).

In general, the process of converting the input syntax into ASTs is called _parsing_. We can spend months just on parsing…so we won’t. Instead, we’re going to pick one syntax that strikes a reasonable balance between convenience and simplicity, which is the parenthetical syntax of Racket, and has special support in plait. That is, we will write the above examples as

1

(+ 1 2)

(+ 1 (+ 2 3))

and see how Racket can help us make these convenient to work with. In fact, in this book we will follow a convention (that Racket doesn’t care about, because it treats (), \[], and {} interchangeably): we’ll write programs to be represented using {} instead of (). Thus, the above three programs become

1

{+ 1 2}

{+ 1 {+ 2 3}}


## S-Expressions

There is a name for this syntax: these are called _s-expressions_ (the _s-_ is for historical reasons). In plait, we will write these expressions _preceded by a back-tick_ (\`). A back-tick followed by a Racket term is of type S-Exp. Here are examples of s-expressions:

\`1

\`2.3

\`-40

These are all numeric s-expressions. We can also write

\`{+ 1 2}

\`{+ 1 {+ 2 3}}

It’s not obvious, but these are actually _list_ s-expressions. We can tell by asking

\> (s-exp-list? \`1)

\- Boolean

\#f

\> (s-exp-list? \`{+ 1 2})

\- Boolean

\#t

\> (s-exp-list? \`{+ 1 {+ 2 3}})

\- Boolean

\#t

So the first is not but the second two are; similarly,

\> (s-exp-number? \`1)

\- Boolean

\#t

\> (s-exp-number? \`{+ 1 {+ 2 3}})

\- Boolean

\#f

The S-Exp type is a container around the actual number or list, which we can extract:

\> (s-exp->number \`1)

\- Number

1

\> (s-exp->list \`{+ 1 2})

\- (Listof S-Exp)

(list \`+ \`1 \`2)

**Do Now: **What happens if you apply s-exp->number to a list s-exp or s-exp->list to a number s-expression? Or either to something that isn't an s-expression at all? Try it right now and find out! Do you get somewhat different results?

Let’s look at that last output above a bit more closely. The resulting list has three elements, two of which are numbers, but the third is something else:

\`+

is a _symbol_ s-expressions. Symbols are like strings but somewhat different in operations and performance. Whereas there are numerous string operations (like substrings), symbols are treated atomically; other than being converted to strings, the only other operation they support is equality. But in return, symbols can be checked for equality in _constant_ time.

Symbols have the same syntax as Racket variables, and hence are perfect for representing variable-like things. Thus

\> (s-exp-symbol? \`+)

\- Boolean

\#t

\> (s-exp->symbol \`+)

\- Symbol

'+

This output shows how symbols are written in Racket: with a single-quote ('). 

There are other kinds of s-expressions as well, but this is all we need for now! With this, we can write our first parser!


## Primus Inter Parsers

**Do Now: **Think about what type we want for our parser.

What does our parser need to produce? Whatever the calculator consumes, i.e., Expr. What does it consume? Program source expressions written in a “convenient” syntax, i.e., S-Exp. Hence, its type must be

(parse : (S-Exp -> Expr))

That is, it converts the human-friendly(ier) syntax into the computer’s internal representation.

Writing this requires a certain degree of pedantry. First, we need a conditional to check what kind of s-exp we were given:

(define (parse s)

  (cond

    \[(s-exp-number? s) …]

    \[(s-exp-list? s) …]))

If it’s a numeric s-exp, then we need to extract the number and pass it to the num constructor:

(num (s-exp->number s))

Otherwise, we need to extract the list and check whether the first thing in the list is an addition symbol. If it is not, we signal an error:

     (let (\[l (s-exp->list s)])

       (if (symbol=? '+

                     (s-exp->symbol (first l)))

           …

           (error 'parse "list not an addition")))

Otherwise, we create a plus term by recurring on the two sub-pieces.

            (plus (parse (second l))

                  (parse (third l)))

 

Putting it all together:

(define (parse s)

  (cond

    \[(s-exp-number? s)

     (num (s-exp->number s))]

    \[(s-exp-list? s)

     (let (\[l (s-exp->list s)])

       (if (symbol=? '+

                     (s-exp->symbol (first l)))

           (plus (parse (second l))

                 (parse (third l)))

           (error 'parse "list not an addition")))]))

It’s all a bit much, but fortunately this is about as hard as parsing will get in this book! Everything you see from now on will basically be this same sort of pattern, which you can freely copy.

We should, of course, make sure we’ve got good tests for our parser. For instance:

(test (parse \`1) (num 1))

(test (parse \`2.3) (num 2.3))

(test (parse \`{+ 1 2}) (plus (num 1) (num 2)))

(test (parse \`{+ 1

                 {+ {+ 2 3}

                    4}})

      (plus (num 1)

            (plus (plus (num 2)

                        (num 3))

                  (num 4))))

**Do Now:** Are there other kinds of tests we should have written?

We have only written _positive_ tests. We can also write _negative_ tests for situations where we expect errors:

(test/exn (parse \`{1 + 2}) "")

test/exn takes a string that must be a substring of the error message. You might be surprised that the test above uses the empty string rather than, say, "addition". Try out this example to investigate why. How can you improve your parser to address this?

Other situations we should check for include there being too few or too many sub-parts. Addition, for instance, is defined to take exactly two sub-expressions. What if a source program contains none, one, three, four, …? This is the kind of pedantry that parsing calls for.

Once we have considered these situations, we’re in a happy place, because parse produces output that calc can consume. We can therefore compose the two functions! Better still, we can write a helper function that does it for us:

(run : (S-Exp -> Number))

(define (run s)

  (calc (parse s)))

So we can now rewrite our old evaluator tests in a much more convenient way:

(test (run \`1) 1)

(test (run \`2.3) 2.3)

(test (run \`{+ 1 2}) 3)

(test (run \`{+ {+ 1 2} 3})

      6)

(test (run \`{+ 1 {+ 2 3}})

      6)

(test (run \`{+ 1 {+ {+ 2 3} 4}})

      10)

Compare this against the calc tests we had earlier!
