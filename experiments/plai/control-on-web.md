# Control on the Web


## Server-Side Programming

Consider a program like this:

print(read("First number") + read("Second number")) 

Imagine we were to run this program on a traditional command-line operating system. What happens when we call read? The operating system’s _synchronous_ input-reading commands are invoked: synchronous meaning that the program suspends its execution—that is, the stack stays intact—waiting for the user to respond (if ever they do), and when they do, the program’s stack resumes, with the value typed in by the user becoming the value returned by read.

This seems so straightforward that we might never think twice about how remarkable this ability is. To understand that, we should try to run this program on the Web. When we do, we run headlong into a central problem on the Web: that there is no such thing as a “read” operation. Why not?

On the Web, a hypothetical read function can certainly send the prompt to the client. In principle, it should then wait for the client to respond with a value, which it returns. However, the _stateless_ nature of the Web means that this can’t happen: the program has to terminate. This is an _asynchronous_ operation. When the user responds (if they ever do), there is no computation waiting to go back to.

Therefore, a Web computation has to be arranged in a very different way. The programmer must manually remember the rest of the computation, and store it somewhere. For instance, we would break up the above program in the following way: what is going to be done next:

read("First number")

and what is waiting for the result:

print(• + read("Second number")) 

(This is, of course, our old friend, a context.) But whereas the context is implicit on the program’s stack, because the program must terminate, the context needs to be written out explicitly. Of course, • is not a program operation; rather, we can think of the context as a function of one argument:

lam(•<sub>1</sub>): print(•<sub>1</sub> + read("Second number")) 

and this is the function that is stored in a way associated with the outgoing prompt. Then, when (if) the user responds, their response value is bound to •<sub>1</sub>, allowing the program to resume. Suppose, for instance, the user types 5. Then this program effectively becomes

print(5 + read("Second number"))

This needs to also perform a Web interaction, so we again split it into what must happen now

read("Second number")

and what is waiting for the result:

print(5 + •)

which we can represent as a function:

lam(•<sub>2</sub>): print(5 + •<sub>2</sub>)

If and when the user resumes, this function is applied to the value they supply, and the result prints as we would expect.

This explanation glosses over some important details. Real program evaluation, as we have seen, does not proceed by rewriting programs, so the second function is not really

lam(•<sub>2</sub>): print(5 + •<sub>2</sub>)

but rather a _closure_ with the body

lam(•<sub>2</sub>): print(•<sub>1</sub> + •<sub>2</sub>)

closed over an environment where •<sub>1</sub> is bound to 5. Getting into these details is interesting from a Web architecture perspective, but for us, all we care about is that _contexts must be saved and restored_.


## Client-Side Termination

On the client-side Web, in JavaScript, we see the same phenomenon, but for a completely different reason. Imagine we write a factorial computation in JavaScript:

function fact(n) {
  ans = 1;
  while (n != 0) {
    ans = ans * n;
    n = n - 1;
  }
  return ans;
}

Notice that the loop checks for n != 0 and not n > 0, so if we put this in a Web page and run it, the program will in principle run forever:

&lt;script type="application/javascript">
function fact(n) {
  ans = 1;
  while (n != 0) {
    ans = ans * n;
    n = n - 1;
  }
  return ans;
}
function show() {
  window.alert('here');
  ans = fact(-1);
  window.alert(ans);
  document.getElementById('answer').innerHTML = ans;
  
}
&lt;/script>
&lt;/head>

&lt;body>
&lt;button onclick="show()">Click me&lt;/button>
&lt;div id="answer">&lt;/div>

However, this creates a problem: the JavaScript virtual machine runs only one computation at a time, and the same JavaScript virtual machine also manages the page and the browser’s components. Therefore, if the program inside a page goes into an infinite loop, the entire page stops being responsive. For this reason, after a little while, the browser will pop up a window offering to kill the computation.

There is a solution to this in JavaScript, but it is hardly elegant. The programmer creates a closure—called a _callback_—that represents the rest of the computation. The programmer then calls

setTimeout(C, 0)

or, in more modern programs,

requestAnimationFrame(C)

(though the former version perhaps makes a bit clearer what is happening), where C is the callback. This creates an event to run C as soon as possible (after 0 units of time). The programmer then—does this sound familiar?—_terminates the program_. This returns control to the JavaScript virtual machine. It runs any other pending events, then arrives at this event, which it runs immediately—i.e., it “calls back” into the computation using C. If C was constructed correctly, then this properly resumes the computation, as if it had never halted. Phew!


## Abstracting the Problem

Thus, we have the same problem on both the server and client sides of the Web. The reasons are very different, but the net effect is the same: the programmer has to manually keep track of information that needs to persist, store it somewhere, halt the computation to return control to whatever called it and, when resumed, fetch information back from storage; all this code must run exactly as if an interruption had never occurred.

This programming quandary is not new. Back in the early days of computing, programmers had to manually keep track of where in memory values resided; then we got compilers that did this for us. Then we had to manually keep track of allocation on the heap to later reclaim it; then we got garbage collectors to do this for us. The history of programming languages is full of tasks that programmers did manually until we learned to create language constructs and compilers that could do these automatically. It would be nice if we could do the same here to reduce the burden of writing such programs.

To study these phenomena better, it would be helpful if we could abstract away from the details of servers, clients, JavaScript, Web pages, timeouts, and so on, and examine the phenomenon in its essence. It turns out that Racket has exactly the tools for this.

Imagine we have two tabs in DrRacket. In the first (let’s suppose we save it as "yielder.rkt") we have the following mysterious program:

\#lang racket

(provide yield resume)

(define resumer #f)

(define (yield)
  (let/cc k
    (set! resumer k)
    (raise 'yield)))

(define (resume)
  (resumer 'dummy))

None of this makes sense to us yet; but it will, soon!

In another tab, we will write a simple program that pretends to be our long-running computation: a factorial function. We can run this directly in Racket, of course. But fact could run for a very long time, depending on the input; so following the rules of JavaScript, we want it to halt periodically, let’s say every time n is divisible by 5 (i.e., roughly every five iterations). That is, we would like to run:

\#lang racket

(require "yielder.rkt")

(define (fact n)
  (if (= n 0)
      1
      (if (zero? (modulo n 5))
          (begin
            (yield)
            (* n (fact (- n 1))))
          (* n (fact (- n 1))))))

where (yield) makes it pause in a way that, when we run (resume), the computation will pick up exactly where it left off. Indeed, we see the following outcome:

\> (fact 7)
uncaught exception: 'yield
\> (resume)
5040

The first time it yields is when n is 5. Yielding, in this case, means _terminating_ the computation using the Racket exception mechanism. Resuming somehow causes computation to continue and run to completion but, remarkably, it produces the exact same answer as if computation had never halted at all!


## Yielding on a Web Server

The Racket Web server has a special primitive that does just this for the Web. We’ll build it up in stages. First, we’ll use a special Racket language, designed to make it easier to write server-side Web programs:

\#lang web-server/insta

Programs in this language must have a “main” function, called start, which is given an initial request (whatever information is provided when we first run the computation). This function is then written assuming a convenient fiction: the existence of a function get-number that will print a prompt, send out a Web page, _wait for its response_, extract the value entered, and return it as a number:

(define (start req)
  (let (\[result (+ (get-number "first") (get-number "second"))])
    (response/xexpr
     \`(html (body (p "The result is " ,(number->string result)))))))

If we can make this fiction reality, then we can write a program like the above: it calls get-number in a “deep” context, twice, adds the results, and then converts the result into a string to embed it into a Web page.

The question, of course, is how such a function can exist. First, we have to discuss some Web mechanics. When we create a Web form, it needs a field called the action, which holds a URL. When the user submits the form, the browser bundles up the information entered into the fields of the form and sends them—effectively, as a set of key-value pairs—_to the URL_, i.e., to the server, requesting it to run the program at that URL and provide the key-value pairs to that program.

Therefore, we can see that we’ve turned the problem of suspending the program’s execution into one of being able to fill in this URL with something meaningful. If the URL can somehow correspond to the stack, then perhaps the stack (and hence the computation) can be restored, and can be provided with these key-value pairs, from which the program can extract the required information.

The “secret sauce” that the Racket Web server provides is a primitive called send/suspend. It does the following:

- It takes a _single-argument function_ as a parameter. 
- It records the current stack as a value.
- It stores this stack in a hash-table, associated with a unique, unguessable string.
- It turns this string into a URL.
- It then _calls_ the given function with this URL string.

The resulting function can then use this URL string as the action field of the form.

**Aside:** This is not the only way to use it. The URL could also, for instance, be sent in an email message. This is a handy way to validate email addresses. Because the URL is unique and unguessable, the only way for someone to resume the computation would be to receive that URL, i.e., to have access to the email address. Thus, resuming the computation can be thought of as having validated the email address (assuming, of course, that an intruder is not reading emails and clicking on validation links that the email’s owner would not have clicked on).

So here is an actual working implementation of get-number:

(define (get-number which)
  (define title (format "What is the ~a number?" which))
  (define req
    (send/suspend
     (lambda (k-url)
       (response/xexpr
        \`(html (head (title ,title))
               (body
                (form (\[action ,k-url])
                      ,title ": "
                      (input (\[name "number"]))
                      (input (\[type "submit"])))))))))
  (string->number
    (extract-binding/single 'number
      (request-bindings req))))

Observe that most of this function is just HTML and API bookkeeping. We have to construct the Web page with the relevant components. When (if) the computation resumes, it returns with the key-value pairs sent from the form. These are bound to req. From there, it’s a simple matter of extracting the right value using the APIs.

And that’s it! That gives us a full, working program.


## Interaction with State

Now let’s think about how all this interacts with state. Let’s write a simple Web program that simply counts how many times we submitted a form.

One natural way to write it is as follows. We’ll have a mutable variable, count, that keeps the count. We’ll have a page that shows the current count and provides the user a button. When they click it, computation resumes; the resumed computation increments the count, and loops:

\#lang web-server/insta

(define count 0)
(define (show-count)
  (send/suspend
     (lambda (k-url)
       (response/xexpr
        \`(html (head "Counter")
               (body
                (p () "The current count is " ,(number->string count))
                (form (\[action ,k-url])
                      (input (\[type "submit"])))))))))
(define (start req)
  (show-count)
  (set! count (add1 count))
  (start 'dummy))

We’ll call it the _stateful counter_.

This works as you might expect. 

But now let’s think about a different way to write this same program. Instead of using a global mutable variable, we could instead keep the count as a local variable and functionally update it:

\#lang web-server/insta

(define (show-count count)
  (send/suspend
     (lambda (k-url)
       (response/xexpr
        \`(html (head "Counter")
               (body
                (p () "The current count is " ,(number->string count))
                (form (\[action ,k-url])
                      (input (\[type "submit"])))))))))
(define (loop count)
  (show-count count)
  (loop (add1 count)))
(define (start req)
  (loop 0))

We’ll call this the _functional counter_.

This, too, works as you would expect. And it works the same as the previous program. And yet, somehow, these programs seem to be different. Are they in fact _exactly_ the same?

They’re not!

**Exercise: **Map out the stacks, environments, and stores to simulate how these programs would run.


## Web Interactions

In conventional, desktop software, concurrency is an artifact of the _program_. If the program is not concurrent, we can’t really force it to behave concurrently.

Not so on the Web. There, we can copy URLs, duplicate them, and replay them. Therefore, the same program state can be invoked multiple times, returned to, and so on.

Consider the following sequence of interactions on the Web:

1. A user visits a travel Web site.
2. They enter a city and search for hotels.
3. They are given a list of hotels, L.
4. They click on one of the hotels, say L1.
5. This takes them to a page for L1.
6. They click the reservation link.

They obtain a reservation at L1. All this seems perfectly normal.

Now suppose instead they do the following:

1. A user visits a travel Web site.
2. They enter a city and search for hotels.
3. They are given a list of hotels, L.
4. They click on one of the hotels, say L1, in a _new_ tab.
5. They click on another of the hotels, say L2, in _another_ new tab.
6. They go back to L1’s tab.
7. They click the reservation link.

Think about these two questions:

1. At which hotel would you _like_ the reservation to be made: L1 or L2?
2. Where do you _expect_ the site to make the reservation: L1 or L2?

Naturally, we would _expect_ the reservation at L1, because we clicked on the reservation link from L1’s page. But on many Web sites, you used to get a reservation at L_2_, not L_1_. This suggests that there is some interaction between the two tabs: specifically, there seems to be mutable state, the “current hotel”, that is shared between the two tabs. Opening a hotel’s page sets this. Thus, this is initially set to L1; the new tab for L2 sets it to L2; when we return to L1’s tab and make a reservation, this act reads the mutable state, which makes the reservation at the “current hotel”, namely L2.


## Returning to the Counters

Now let’s return to the two counters, armed with the ideas from the interactions above.

Run the stateful counter program and submit, say, 3 times. After that, the page will list the count as 3, and the URL will look something like

http&#x3A;//localhost:51264/servlets/standalone.rkt;((%22k%22%20.%20%22(1%203%2097639995)%22))?

Now copy this URL, create a _new_ tab, paste it, and enter. This runs the computation associated with this URL. Perhaps surprisingly, this shows the count as 4. Now go back to the previous tab and submit the form. That tab now shows a count not of 4 but of 5. Return to the second tab and submit; it now shows 6. The stacks help us see why: every return mutates the _same_ counter variable.

Now repeat the same process with the functional counter. After 3 submissions, we get a URL like

http&#x3A;//localhost:51379/servlets/standalone.rkt;((%22k%22%20.%20%22(1%203%2028533532)%22))?

which seems very similar. Now copy _this_ URL into a new tab, and repeat the interactions above.

What we see is very different. Each tab has its own local “memory”, much as we expected of the pages on the travel Web site. The continuation does not mutate a single shared variable, but rather makes a new _call_ to loop, which creates a new binding that is distinct from previous bindings. Each time we submit we make another call, which makes another stack frame and its corresponding environment frame, which are distinct.

This distinction between creating a single, shared, mutable variable and creating distinct variables that each have their own immutable value should be familiar: it’s the exact same problem that we saw in the Loops assignment \[<https://cs.brown.edu/courses/cs173/2022/loops.html>].


## Mapping between Web and Programming Language Features

Interestingly, there is a deep connection between features of Web programs and ideas from programming languages. On the Web, we have

|               |                             |                              |
| ------------- | --------------------------- | ---------------------------- |
|               | **Server-side**             | **Client-side**              |
| **Mutable**   | Database (page-independent) | Cookie (page-independent)    |
| **Immutable** |                             | Hidden field (page-specific) |

Observe that when we have a single mutable entry, the net result will be that all pages that share it will end up seeing the effects of each other. Therefore, the bad travel Web site pattern is inherent in this style of programming. Unfortunately, Web APIs make cookies very easy to use, leading to programs following this bad pattern. In contrast, when we have immutable data that is specific to the page (the field is on the page…it’s just hidden), then each page keeps its own information separate from all the other pages. Notice also that hidden fields are key-value mappings. Therefore, a collection of hidden fields is an _environment_. Since a page also has a reference to code to run, a page with hidden fields is effectively a _closure_! In contrast, a page with shared mutable state is using the _store_ (or _heap_). The Racket Web server simply makes these implicit ideas explicit.
