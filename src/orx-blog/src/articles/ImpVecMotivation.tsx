import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/imp-vec-motivation-2024-10-03';
const title = 'Index Trait, Pinned Elements and Immutable Push Vector';
const date = '2024-10-03';
const summary = 'motivation behind the ImpVec'

export const PageMetaImpVecMotivation = () => {
    const content = <Content />;
    const page = <Article content={content} />;
    return { path, title, date, summary, page };
}

const Content = () => {
    return (
        <>
            <h1>{title}</h1>
            <span className="date">{date}</span>
            <span className="date">{summary}</span>

            <p>
                The title sounds like a list of unrelated topics.
                As I was working on yet another unrelated topic, they came together and led to ImpVec.
            </p>

            <p>
                <Link text="ImpVec" href="https://crates.io/crates/orx-imp-vec" /> stands for immutable push vector.
                It is a vector that allows appending elements using a shared reference with the following method (and such):
            </p>

            <Code code="fn imp_push(&self, value: T) { ... }" />

            <p>
                Not to be confused with concurrent collections such as&nbsp;
                <Link text="ConcurrentVec" href="https://crates.io/crates/orx-concurrent-vec" />,&nbsp;
                <Link text="AppendOnlyVec" href="https://crates.io/crates/append-only-vec" /> or&nbsp;
                <Link text="boxcar::Vec" href="https://crates.io/crates/boxcar" />;
                an <code>ImpVec</code> is not meant to be shared across threads.
            </p>

            <p>
                Then, why would we need this?
            </p>

            <section>

                <h2>The Goal</h2>
                <p>
                    The actual goal is to create a macro-free, type-safe, concise and expressive mathematical programming crate in rust.
                    In order to illustrate the target api and potential challenges, a linear expression will be sufficient:
                </p>

                <Code code="let le = 3 * x[0] + 4 * x[7];" />

                <p>
                    Here, <code>x</code> is a vector of unknowns or variables; and <code>le</code> is a linear expression.
                </p>

                <p>
                    Importantly note that <code>x</code> is a symbolic vector, say <code>Vector</code>, which is nothing like a
                    materialized <code>std::vec::Vec</code>.
                </p>

                <p>
                    <code>x[i]</code> still represents the i-th element of this vector, which is another symbolic type.
                    Let's call it <code>Var</code>. As a result, <code>le</code> is not an eagerly evaluated value
                    but an expression.
                </p>

                <p>
                    If we take a closer look at the example expression, we see four types:
                </p>

                <div className="boxes">
                    <div className="box">
                        Vector
                        <div className="hor-line"></div>
                        <code>x</code>
                    </div>

                    <div className="box">
                        Var
                        <div className="hor-line"></div>
                        <code>x[7]</code>
                    </div>

                    <div className="box">
                        Term
                        <div className="hor-line"></div>
                        <code>3 * x[0]</code>
                    </div>

                    <div className="box">
                        Expr
                        <div className="hor-line"></div>
                        <code>3 * x[0] + 4 * x[7]</code>
                    </div>
                </div>

                <p>
                    The easiest way to demonstrate the target syntax is to look at what we <span className="inline-emphasis">don't</span> want.
                </p>

                <Code code={codeUglySolution} />

                <p>
                    This is a nice and clean rust code.
                    We can read, follow and understand it.
                    However, seeing the expression is not immediate.
                    Since we aim to use this library to work with systems of inequalities,
                    understanding this simple expression should have been immediate.
                </p>

                <p>
                    Hence, we want the <span className="inline-emphasis">opposite</span>;
                    we don't want rust code that we can understand, we want rust to understand our syntax :)
                </p>

                <div className="emphasis">
                    The goal is to create a library that makes the following a valid rust code

                    <Code code="let le = 3 * x[0] + 4 * x[7];" />

                    which is not longer and not more verbose than on paper version.
                </div>

            </section>

            <section>

                <h2>The Index Problem</h2>
                <p>
                    Fast forward; it turns out that we can achieve the desired expressive syntax if we can solve the index problem.
                </p>

                <p>
                    Two types are relevant to the problem.
                    First is <code>Vector</code> which is nothing but a symbol.
                    Second is the <code>Var</code> which contains an <code>index</code> and a reference to its parent <code>vector</code> that created it.
                </p>

                <p className="side-note">
                    The choice of <code>&'a Vector</code> over <code>Rc&lt;Vector&gt;</code> to store the vector of a <code>Var</code> is intentional
                    in order to be able to derive <code>Copy</code> which is another crucial requirement to achieve the desired expressiveness.
                    However, the index problem is independent of this choice.
                </p>

                <p>
                    The problem we have here is a familiar one and can be summarized as follows:
                </p>

                <div className="seq">
                    <div>
                        <code>Vector</code> does not actually store any <code>Var</code>.
                    </div>

                    <div>
                        We couldn't store even if we wanted to since there are infinitely many of them.
                    </div>

                    <div>
                        When <code>x[i]</code> is called, <code>x</code> has to produce <code>Var &#123; index = i, vector = x &#125;</code> for any <code>i</code>.
                    </div>

                    <div>
                        For the <code>Index</code> trait, we need to implement <code>fn index(&self, index: usize) -&gt; &Var&lt;'a&gt;</code>.
                    </div>

                    <div>
                        We have to return a reference.
                    </div>

                    <div>
                        We cannot return a reference to the temporary <code>Var</code> that we create inside the <code>index</code> function.
                    </div>

                    <div>
                        We must store the <code>Var</code> somewhere, we must store it long enough.
                    </div>
                </div>

                <div className="side-note">
                    <p>
                        Unfortunately, we cannot get around the reference requirement even if we are returning a <code>Copy</code> value such as <code>Var</code>.
                    </p>
                </div>

                <p>
                    The following workaround might solve our problem:
                </p>

                <div className="seq">
                    <div>each time <code>x[i]</code> is called for some <code>i</code>,</div>
                    <div>we create the <code>Var</code> inside the <code>index</code> method,</div>
                    <div>store it in <code>created_vars</code> field of the <code>Vector</code>, and then</div>
                    <div>return the reference to the last element of <code>created_vars</code> which is the new variable.</div>
                </div>

                <p>
                    Since <code>index</code> method only requires a <code>&self</code> we need to use interior mutability to cache the <code>Var</code>.
                </p>

            </section>

            <section>
                <h2>Solution Attempt with <code>UnsafeCell&lt;Vec&lt;Var&lt;'_&gt;&gt;&gt;</code></h2>

                <p>
                    A straightforward approach is to use <code>UnsafeCell&lt;Vec&lt;Var&lt;'_&gt;&gt;&gt;</code> to cache the variables that we create on demand.
                </p>

                <p className="side-note">
                    The cache will keep growing; however, this is insignificant for the use case.
                    We will represent systems of arbitrary sizes with several symbolic expressions.
                </p>

                <p>
                    You may see the solution attempt in the following code block or in the&nbsp;
                    <Link text="vector_var_unsafe_cell_vec.rs" href="https://github.com/orxfun/orx-imp-vec/blob/main/examples/vector_var_unsafe_cell_vec.rs" /> example file.
                </p>

                <Code code={codeUnsafeCellVecVar} />

                <p>
                    As planned, we create a local <code>var</code> inside the <code>index</code> method.
                    Then, we push it to <code>created_vars</code> vector and return a reference to it.
                </p>

                <p>In the demo:</p>
                <div className="seq">
                    <div>
                        We create the vector <code>x</code> and create a <code>Var</code> out of it by calling <code>x[0]</code>.
                        We don't need to use <code>&x[0]</code> since <code>Var</code> implements <code>Copy</code>.
                        The assertion passes, all good
                        <span className="tick" />
                    </div>

                    <div>
                        To test it a little further, we create a thousand vars and collect them in <code>vars1</code> vec.
                        We test them one by one, all succeed
                        <span className="tick" />
                    </div>

                    <div>
                        We do <span className="inline-emphasis">almost</span> the same thing again to create <code>vars2</code> vec
                        and we suddenly have <span className="danger">undefined behavior</span>
                        <span className="fail" />
                    </div>

                </div>

                <div className="emphasis">
                    <p>
                        Why is <code>vars1</code> memory safe but using <code>vars2</code> leads to UB?
                    </p>
                </div>

                <p>
                    The problem might be immediately clear for some
                    but it might be a bit hidden for others.
                    Zooming in the types of the vectors reveals the problem.
                </p>

                <div className="boxes">
                    <div className="box">
                        <code>vars1: Vec&lt;Var&gt;</code>
                        <div className="hor-line" />
                        <p><code>index</code> operator returns <code>&Var</code></p>
                        <p>we copy and store the variable as an owned <code>Var</code></p>
                        <p>and immediately throw away the reference</p>
                    </div>

                    <div className="box">
                        <code>vars2: Vec&lt;&Var&gt;</code>
                        <div className="hor-line" />
                        <p>here, we don't copy</p>
                        <p>we directly store returned references in our vector</p>
                        <p>these <span className="danger">references are invalid</span> and using them is UB</p>
                    </div>
                </div>

                <p>
                    The references are invalid because our cache is a <code>std::vec::Vec</code>,
                    and <code>Vec</code> has the freedom to move elements
                    around in order to keep the storage contagious.
                </p>

                <p>
                    You may run the program and see that all assertions succeed and program exits normally.
                    This does not prove the absence of the memory problem.
                    If we keep using it, we will eventually encounter the UB.
                    Thankfully, we have <strong>miri</strong> to tell us the problem right away.
                </p>

                <code>cargo run +nightly miri --example vector_var_unsafe_cell_vec</code>
                <br />
                <code className="danger">constructing invalid value: encountered a dangling reference (use-after-free)</code>

                <p>
                    This is an interesting case because actually there exists a safe way to use the api,
                    by always using <code>x[i]</code> and never using <code>&x[i]</code>.
                    We can be careful and never encounter memory safety issues.
                    This is of course too optimistic to be the correct decision.
                    What matters is, there exists a use pattern that leads to UB and we don't have any means
                    to eliminate the innocent-looking <code>&x[i]</code> call.
                </p>

                <p>We can have a few takeaways from this attempt:</p>
                <div className="emphasis">
                    <p>◉ Solution would be much simpler and cleaner if <code>Index</code> could return a <code>Copy</code> type by value.</p>
                    <p>◉ Things can go wrong in many different ways in the <code>unsafe</code> land.</p>
                    <p>◉ It would be nice if memory positions of elements could remain intact.</p>
                </div>

            </section>

            <section>
                <h2>Open Rust Issue</h2>

                <p>
                    There is an open <Link text="rust-lang issue" href="https://github.com/rust-lang/rfcs/issues/997" /> about extensions
                    of the <code>Index</code> trait.
                    It is closely related and there are several very common use cases discussed in the issue.
                    Recommended <code>IndexGet</code> extension seems to be promising to solve the problem discussed here, and many others.
                    Watching closely 👀
                </p>

            </section>

            <section>
                <h2>Solution with Pinned Elements and <code>ImpVec</code></h2>

                <p>
                    Back to the title.
                    We iterate the workaround
                    using <Link text="PinnedVec" href="https://crates.io/crates/orx-pinned-vec" />&nbsp;
                    and <Link text="ImpVec" href="https://crates.io/crates/orx-imp-vec" />.
                </p>

                <p>
                    Our workaround failed due to elements of the vec moving around in memory as the vector grows.
                </p>

                <p className="emphasis">
                    A vector implementing the <code>PinnedVec</code> trait
                    guarantees that elements added to the vector are pinned to their memory locations unless explicitly changed.
                </p>

                <p>
                    We saw that unsafe usage of interior mutability on a vec is <span className="inline-emphasis">way too powerful</span> for
                    our use case. It allows us to do so many wrong things.
                </p>

                <p className="emphasis">
                    <code>ImpVec</code> is a simple wrapper over a <code>PinnedVec</code>.
                    It only adds the capability to push to the vector with an immutable reference.
                </p>

                <p>
                    The feature that <code>ImpVec</code> adds to pinned vectors is demonstrated below.
                </p>

                <Code code={codeImpVecDemo} />

                <p>
                    Here, having an immutable <code>vec</code>, we know with certainty that <code>my_ref</code> will&nbsp;
                    <span className="inline-emphasis">always be valid</span> throughout the lifetime of the <code>vec</code>.
                </p>

                <p>
                    You may see the solution using <code>ImpVec</code> in the following code block or in the&nbsp;
                    <Link text="vector_var_imp_vec.rs" href="https://github.com/orxfun/orx-imp-vec/blob/main/examples/vector_var_imp_vec.rs" /> example file.
                    And the <Link text="system_of_linear_inequalities.rs" href="https://github.com/orxfun/orx-imp-vec/blob/main/examples/system_of_linear_inequalities.rs" /> example
                    takes the demo one step further making the simple linear expression a valid rust code while using <code>ImpVec</code> as a scope.
                </p>

                <Code code={codeImpVec} />

                <p>
                    Note that we only made two changes:
                </p>

                <div className="seq">
                    <div>
                        We changed the type of our cache from <code>UnsafeCell&lt;Vec&lt;Var&lt;'a&gt;&gt;&gt;</code> to <code>ImpVec&lt;Var&lt;'a&gt;&gt;</code>.
                    </div>

                    <div>
                        We replaced the unsafe code in the <code>index</code> method with the safe <code>imp_push_get_ref</code> method of the <code>ImpVec</code>.
                    </div>
                </div>

                <p className="side-note">
                    <code>vec.imp_push_get_ref(value)</code> function is simply a shorthand for the common use pattern of
                    the <code>vec.imp_push(value)</code> call followed by <code>&vec[vec.len() - 1]</code>.
                </p>

                <p>
                    Now <strong>miri</strong> is happy, we are happy
                    <span className="tick" />
                </p>

                <p>
                    Solution will be cleaner once we have the rust-lang issue fixed,
                    maybe with <code>IndexGet</code> trait.
                    Until then we can safely cache with <code>ImpVec</code> 👿
                </p>

            </section>

            <section>
                <h2>The Goal ?</h2>

                <p>
                    Waiting for <code>IndexGet</code>, caching with <code>ImpVec</code> provided the safe workaround
                    to achieve the desired syntax.
                    Next steps to build the mathematical programming crate are straightforward;
                    however, one thing led to another and got distracted :)
                </p>

                <p>
                    <code>ImpVec</code> relies on pinned position guarantee of the underlying <code>PinnedVec</code>.
                    It turns out, working with pinned elements is useful for various other things.
                    One can imagine the benefits for concurrent collections that will be shared among threads.
                    We can hang onto references of elements knowing that they will be valid
                    even though another thread is pushing new elements to the collection.
                    So started working on concurrent data structures on a path going all the way to parallel processing.
                    On a separate path, I wanted to experiment with self referential data structures
                    since pinned elements make it conveniently safe to work with references.
                    Started with linked lists as it is the tradition, and now moving towards trees and graphs.
                </p>
                <p>
                    In brief, I am taking a lot of fun side steps ❤️<img src="https://rustacean.net/assets/rustacean-orig-noshadow.png" height="15px" /> but
                    original goal to be revisited soon.
                </p>

            </section>

            <div className="end-space"></div>

        </>
    )
}

const codeUglySolution = `struct Expr<'a> {
    terms: Vec<Term<'a>>,
}

struct Term<'a> {
    coefficient: u64,
    var: Var<'a>,
}

struct Vector {
    symbol: String,
}

#[derive(Clone, Copy)]
struct Var<'a> {
    index: usize,
    vector: &'a Vector,
}

// demo

let x = Vector {
    symbol: "x".to_string(),
};

let term1 = Term {
    coefficient: 3,
    var: Var {
        index: 0,
        vector: &x,
    },
};

let term2 = Term {
    coefficient: 4,
    var: Var {
        index: 7,
        vector: &x,
    },
};

let le = Expr {
    terms: vec![term1, term2],
};
`;

const codeUnsafeCellVecVar = `use std::fmt::{Display, Formatter, Result};
use std::{cell::UnsafeCell, ops::Index};

struct Vector<'a> {
    symbol: String,
    created_vars: UnsafeCell<Vec<Var<'a>>>,
}

impl<'a> Vector<'a> {
    fn new(symbol: &str) -> Self {
        Self {
            symbol: symbol.into(),
            created_vars: Default::default(),
        }
    }
}

impl<'a> Index<usize> for &'a Vector<'a> {
    type Output = Var<'a>;

    fn index(&self, index: usize) -> &Self::Output {
        let var = Var {
            index,
            vector: self,
        };

        let cache = unsafe { &mut *self.created_vars.get()};
        cache.push(var);
        &cache[cache.len() - 1]
    }
}

#[derive(Clone, Copy)]
struct Var<'a> {
    vector: &'a Vector<'a>,
    index: usize,
}

impl<'a> Display for Var<'a> {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        write!(f, "{}[{}]", & self.vector.symbol, self.index)
    }
}

// demo

let x = &Vector::new("x");

// good

let x0: Var = x[0];
assert_eq!(x0.to_string(), "x[0]");

// also good

let vars1: Vec<_> = (0..1000).map(|i| x[i]).collect();

for (i, x) in vars1.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}

// ¯\\_(ツ)_/¯ UNDEFINED BEHAVIOR !!

let vars2: Vec<_> = (0..1000).map(|i| &x[i]).collect();

for (i, x) in vars2.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}
`;

const codeImpVecDemo = `use orx_imp_vec::*;

let vec = ImpVec::new();

vec.imp_push(42);
let my_ref = &vec[0];
assert_eq!(my_ref, &42);

for i in 0..10000 {
    vec.imp_push(i);
}

assert_eq!(my_ref, &42);
`;

const codeImpVec = `use orx_imp_vec::*;
use std::fmt::{Display, Formatter, Result};
use std::ops::Index;

struct Vector<'a> {
    symbol: String,
    created_vars: ImpVec<Var<'a>>,
}

impl<'a> Vector<'a> {
    fn new(symbol: &str) -> Self { /* same as before */ }
}

impl<'a> Index<usize> for &'a Vector<'a> {
    type Output = Var<'a>;

    fn index(&self, index: usize) -> &Self::Output {
        let var = Var {
            index,
            vector: self,
        };
        self.created_vars.imp_push_get_ref(var)
    }
}

#[derive(Clone, Copy)]
struct Var<'a>  { /* same as before */ }

impl<'a> Display for Var<'a> { /* same as before */ }

// demo

let x = &Vector::new("x");

// good

let x0: Var = x[0];
assert_eq!(x0.to_string(), "x[0]");

// also good

let vars1: Vec<Var> = (0..1000).map(|i| x[i]).collect();

for (i, x) in vars1.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}

// still good

let vars2: Vec<&Var> = (0..1000).map(|i| &x[i]).collect();

for (i, x) in vars2.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}
`;