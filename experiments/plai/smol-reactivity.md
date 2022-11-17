# Non-SMoL: Reactivity

We learned early on that SMoL languages evaluate formal arguments at a function call. We then saw laziness as a contrast to this: an argument is evaluated _zero_ times at the call, and is maybe only evaluated later. (Of course, if the result is not cached, it may be evaluated many times.)

Now we will see another contrast to SMoL, focusing this time on the function call itself: where what syntactically looks like a single function call can actually be numerous, even an unbounded number.

## GUIs through Callbacks

To do so, it helps to remind ourselves of the evaluation model in most graphical applications, these days embodied by JavaScript. Suppose we want to make a Web page with a timer that counts up every second, and whose value resets when we click on a Reset button.

One version of the JavaScript code would look as follows:

var timerID = null;
var elapsedTime = 0;

function doEverySecond() {
  elapsedTime += 1;
  document.getElementById('curTime').innerHTML = elapsedTime; }
function startTimer() {
  timerId = setInterval(doEverySecond, 1000); }
function resetElapsed() {
  elapsedTime = 0; }

&lt;body onload="startTimer()">
&lt;input id="reset" type="button" value="Reset" onclick="resetElapsed()" />
&lt;div id='curTime'>  &lt;/div>
&lt;/body>

There are three parts to the logic here:

1. Updating the elapsed time every second.
2. Resetting the timer on a button-press.
3. Initiating the computation.

These are accomplished as follows:

1. When loaded, the Web page invokes startTimer. 
2. We use elapsedTime to record how much time has elapsed, and create a timer, referenced by timerID. This installs a timer (and records a reference to it in case we need it later, which we don’t in this program) that runs every second (1000 milliseconds). Whenever the timer goes off, it invokes the function doEverySecond. That function increments the elapsed time, and writes the current value into the Web page.
3. Finally, the reset button has resetElapsed as its callback. This resets the value of elapsedTime, whose updated value is then shown the next time the display is updated. (In principle, we might want to update the display in this callback too.)

Let us suppose we were given this program to maintain. We want to ask a simple question: what is the value of the Web page’s curTime element? Observe the reasoning we have to perform:

- It is set inside doEverySecond.
- It’s set to the value of elapsedTime.
- That value is incremented in the previous statement.
- That increment takes place every time doEverySecond is called.
- That call takes place in the first argument of setInterval.
- That event is installed by startTimer.
- Which is called on page load.
- Wait. We also need to know the initial value, where elapsedTime is declared.
- Oh, but wait. We also see it reset.
- That happens inside resetElapsed.
- Which is called when the button is clicked.

## Reactivity

There is an alternative, called _functional-reactive programming_ (FRP). We will see one particular instantiation, which is baked into Racket with an interesting user interface. The language is called FrTime. For technical reasons, we will not use a #lang but rather choose it from the Language menu (under Other Languages).

**Do Now! **Below are some expressions whose output is best experienced in DrRacket. Run them in DrRacket and see the output for yourself!

FrTime essentially provides a basic version of Racket, so basic computations work exactly as we would expect:

\> 5
5
\> (+ 2 3)
5
\> (string-length "hello")
5

We can also ask for values like the current system time:

\> (current-seconds)
1668363009
\> (add1 (current-seconds))
1668363010

You will likely see a different value than the one shown above, because you are not reading this at the same time as when I wrote it. But that is a problem: indeed, even I am seeing a _stale_ value, because time has passed since I ran the command.

The typical solution is to use callbacks. We can imagine a timer that takes a callback, which is called every time the time changes. However, this would invert control, which is exactly what happens in our timer example.

But FrTime, following the principles of FRP, provides a special kind of value. Try it:

\> seconds

See what happens? seconds is a _time-varying value_: i.e., it is (technically: evaluates to) a value, but what it evaluates to changes over time. (It changes, in fact, every second.)

Naturally, we should ask: if seconds evaluates to a value, we can use it in expressions, so what happens if we write expressions like these?

\> (add1 seconds)

\> (modulo seconds 10)

Notice that both add1 and modulo demand that their first argument be numbers. seconds is a time-varying value that at every point in time is a number. Therefore, these expressions are well-typed, producing no errors, and in fact produce the answer we might expect (but also perhaps be a bit surprised by).

Nothing prevents us from writing even longer expressions. Consider the function build-list:

\> (build-list 5 (lambda (n) n))
'(0 1 2 3 4)

What happens if we now use a time-varying value?

\> (build-list (modulo seconds 10) (lambda (n) n))

Or build an even deeper expression:

\> (length (build-list (modulo seconds 10) (lambda (n) n)))


## How Evaluation Works


### Dataflow Graphs

What happens when we write these expressions? FrTime rewrites the way function applications happen. If _no_ argument to a function is time-varying, then the function evaluates just as it would in regular Racket. If, however, any of its arguments is time-varying, then FrTime constructs a node in a _dataflow_ graph. This node is attached to the nodes corresponding to the time-varying arguments.

Consider this expression:

(length (build-list (modulo seconds 10) (lambda (n) n)))

The act of calling length evaluates its argument, which is a call to build-list, which evaluates its two arguments. The second argument is an ordinary closure. The first argument is a call to modulo, which evaluates _its_ two arguments. Again, the second argument is just a number, but the first argument is time-varying. Consequently, this turns into a dataflow graph node, where we use the context notation to indicate where time-varying values go.

Because (modulo seconds 10) evaluates to a time-varying value, so does the next outer expression.

and finally the outermost one.

The program source therefore evaluates to this dataflow graph. Now, each time-varying value may evaluate at different rates and for different reasons. seconds, naturally, updates once every second. When it does, its updated value is _pushed_ to all the nodes that depend on it, which update their value and push their values, and so on all the way through the graph. Finally, values may arrive at the REPL, which in FrTime is designed to display them automatically updating.

### Non-Linear Graphs

The above example may be a bit misleading in suggesting that an expression must always have at most one time-varying parameter. Consider this program:

(= (modulo seconds 3) (modulo seconds 5))

On every update of seconds, _both_ expressions that depend on it update, and their result flows to the equality comparison. Every 15 seconds, we would expect to see 12 consecutive values of #f followed by three consecutive values of #t, and that is what we see.

### Avoiding Glitches

These forks in the graph, however, might be a cause for concern. Let us see an even simpler example:

(&lt; seconds (add1 seconds))

Let us first be clear about what we expect this to produce: we want it to always be #t.

However, let us view how a simplistic dataflow graph evaluator might work.

Suppose the value of seconds updates to become 10. This value is pushed, as we would expect, to _both_ its _listeners_. This causes the (add1 seconds) node to update its value from 10 to 11. However, the update to seconds might have caused the comparison to occur immediately. At that point FrTime would be evaluating (&lt; 10 10), which is clearly false. So for one instant this expression would evaluate to #t, before the update from (add1 seconds) arrives and it reverts to the value #f. This is called a _glitch_, a term borrowed from the same phenomenon in [electrical circuits](https://en.wikipedia.org/wiki/Glitch).

Avoiding glitches is actually quite simple. Rather than updating a node in this eager manner, FrTime schedules the graph to be updated in [topographical order](https://en.wikipedia.org/wiki/Topological_sorting). That ensures that no node will ever see old, or “stale”, values, and the expression will evaluate correctly. Of course, we can only apply topological sorting to directed _acyclic_ graphs, so handling cycles requires some additional work, which we do not discuss here.

## Other Time-Varying Values

So far we have seen only one basic time-varying value, seconds. FrTime provides many others. For instance, mouse-pos is the current position of the mouse. If we run the following program:

(require frtime/animation)

(display-shapes
 (list
  (make-circle mouse-pos 10 "blue")))

we see a blue circle, and it _automatically_ follows the mouse.

The function display-shapes in the FrTime animation library takes a list of shapes; above, we have only one. This function builds a list of (four) circles whose positions are determined by the mouse’s location, except each one is _delayed_, i.e., represents where the mouse used to be. (One might call this the Rhode Island mouse.) Therefore, as the mouse moves these circles appear to “follow” it around.

(display-shapes
 (let (\[n 4])
   (build-list
    n
    (lambda (i)
      (make-circle (delay-by mouse-pos (\* 200 (- (- n 1) i)))
                   10
                   "green")))))


## More Time-Varying Values

We have actually seen only one kind of time-varying value, called a _behavior_. There are actually two kinds of time-varying values, which is easy to see if we consider a few different kinds of stimuli from the world:

- Current mouse position
- Sequence of keystrokes
- Current user location
- Sequence of network responses
- Current status of mode keys
- Sequence of mouse-clicks
- Current time

Notice that several of those are “current…” and others are “sequence of…”. The former have the property that they always have a value, and the value may change at any time. The latter have the property that at any given moment they may not have a value—for instance, there may not be a “current keystroke”—and we don’t know when (or if) the next one will come, and there may be an infinite number of them. The latter are, of course, just _streams_, often called _event streams_.

If we go back to our original counter example, we had both present. The elapsed time was a behavior (always has a value, which changes either when a second finishes or when a button is clicked). The sequence of button presses is, conversely, an event stream: at any given moment there may not be a press, we don’t know when or even if the next one will come, and there may be an unbounded number of them (assuming a very bored user). To learn more, see the papers about the design and implementation of [FrTime](https://cs.brown.edu/~sk/Publications/Papers/Published/ck-frtime/), and a similar language for JavaScript called [Flapjax](https://cs.brown.edu/~sk/Publications/Papers/Published/mgbcgbk-flapjax/), and to see how a large [GUI library](https://cs.brown.edu/~sk/Publications/Papers/Published/ick-adapt-oo-fwk-frp/) can be turned into a functional-reactive one.
