import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/imp-vec-motivation/2024-10-03';
const title = 'Index Trait, Pinned Elements and Immutable Push Vector';
const date = '2024-10-03';
const summary = 'The motivation behind the ImpVec.'

export const PageMetaImpVecMotivation = () => {
    const content = <Content />;
    const page = <Article content={content} />;
    return { path, title, date, summary, page };
}

const Content = () => {
    return (
        <>
            <h1>{title}</h1>
            <span className="date"><Link text="orxfun" href="https://github.com/orxfun/" /> | {date}</span>

            <p>
                The title sounds like a list of unrelated topics.
                While I was working on a completely different topic, they somehow came together and led to ImpVec.
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
                an ImpVec is not meant to be shared across threads.
            </p>

            <p>
                Then, why would we need this?
            </p>

            <section>

                <h2>The Goal</h2>
                <p>
                    The actual goal is to create a macro-free, type-safe, concise and expressive mathematical programming crate in rust.
                    In order to illustrate the targeted api and potential challenges, a linear expression is sufficient:
                </p>

                <Code code="let le = 3 * x[0] + 4 * x[7];" />

                <p>
                    Here, <code>x</code> is a vector of unknowns or variables; and <code>le</code> is a linear expression.
                </p>

                <p>
                    Importantly note that <code>x</code> is a symbolic vector, say <code>Vector</code>, which is nothing like the
                    materialized <code>std::vec::Vec</code>. <code>x[i]</code> still represents the i-th element of this vector, which is
                    another symbolic type, let's call it <code>Var</code>. As a result, <code>le</code> is not an eagerly evaluated value
                    but an expression.
                </p>

                <p className="emphasis">
                    The goal is to create a library that makes the code block above valid rust code defining the linear expression;
                    which is not longer and not more verbose than on-paper version.
                </p>

                <p>
                    In order to achieve this expressive and concise syntax demonstrated above, we want to avoid any <code>&</code> usage.
                    And we need to avoid typing <code>clone()</code> at all costs.
                </p>

                <p>
                    If we take a closer look at the example expression, we see three types:
                </p>

                <ul>
                    <li><code>Expr</code> ⇒ <code>3 * x[0] + 4 * x[7]</code></li>
                    <li><code>Term</code> ⇒ <code>3 * x[0]</code> or <code>4 * x[7]</code></li>
                    <li><code>Var</code> ⇒ <code>x[0]</code> or <code>x[7]</code></li>
                </ul>

                <p>
                    And of course, we have <code>x</code> which is a <code>Vector</code>.
                    Its Index operator outputs a <code>Var</code> which leads to the following ..
                </p>

            </section>

            <section>

                <h2>The Index Problem</h2>
                <p>
                    Fast forward; it turns out that we can achieve the desired expressive syntax if we can solve the index problem.
                </p>

                <p>
                    Before defining the problem, let's introduce two relevant types:
                </p>

                <Code code={codeRelevantTypes} />

                <p>
                    <code>Vector</code> is nothing but a symbol.
                    A <code>Var</code> is defined by two things: an <code>index</code> and a reference to its parent <code>vector</code> that created it.
                </p>

                <p className="side-note">
                    The choice of <code>&'a Vector</code> over <code>Rc&lt;Vector&gt;</code> to store the vector of a <code>Var</code> is intentional
                    in order to be able to derive <code>Copy</code> which is another crucial requirement to achieve the desired expressiveness.
                    However, the index problem is independent of this choice.
                </p>

                <p>
                    The index problem we have here is as follows:
                </p>

                <ul>
                    <li><code>Vector</code> does not actually store <code>Var</code>s.</li>
                    <li>
                        Even if we wanted, we wouldn't be able to store <code>Var</code>s because there are infinitely many of them.
                    </li>
                    <li>
                        When <code>x[i]</code> is called, <code>x</code> has to produce a <code>Var &#123; index = i, vector = x &#125;</code>.
                        No index is out of bounds.
                    </li>
                    <li>
                        The method we need to implement for the <code>Index</code> trait is <code>fn index(&self, index: usize) -&gt; &Var&lt;'a&gt;</code>.
                        We have to return a reference.
                        <ul>
                            <li>We cannot return a reference to the temporary <code>Var</code> that we create inside the index function.</li>
                            <li>We must store the <code>Var</code> somewhere, and we must store it long enough.</li>
                        </ul>
                    </li>
                </ul>

                <p><strong>
                    Unfortunately, we cannot get around the reference requirement even if we are returning a <code>Copy</code> value such as <code>Var</code>.
                </strong></p>

                <p>
                    Then, the solution seems to be as follows:
                </p>
                <div className="boxes-flow">
                    <div className="box">
                        each time <code>x[i]</code> is called for some i
                    </div>

                    <div className="box">
                        we create the <code>Var</code> inside the <code>index</code> method
                    </div>

                    <div className="box">
                        store it in <code>created_vars</code> field of the <code>Vector</code>
                    </div>

                    <div className="box">
                        and return the reference to the element of <code>created_vars</code>
                        that we stored the new variable
                    </div>
                </div>

                <p>
                    Since <code>index</code> method only requires a <code>&self</code> we would require <strong>interior mutability</strong> to store the <code>Var</code>.
                </p>

            </section>

            <section>
                <h2>Solution Attempt with <code>UnsafeCell&lt;Vec&lt;Var&lt;'_&gt;&gt;&gt;</code></h2>

                <p>
                    A straightforward approach is to use <code>UnsafeCell&lt;Vec&lt;Var&lt;'_&gt;&gt;&gt;</code> to cache the variables that we create.
                </p>

                <p className="side-note">
                    The cache will keep growing; however, this is insignificant for the use case.
                    We will represent systems of arbitrary sizes with several linear expressions.
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

                <p>
                    In the demonstration, we create the vector <code>x</code> and create a <code>Var</code> out of it by calling <code>x[0]</code>.
                    Note that we don't need to use <code>&x[0]</code> since <code>Var</code> implements <code>Copy</code>.
                    The assertion passes, all good.
                </p>

                <p>
                    To test it a little further, we create a thousand vars and collect them in <code>vars1</code> vec.
                    Then, we test them one by one.
                    All tests succeed.
                    Still good.
                </p>

                <p>
                    We do (almost!) the same thing again to create <code>vars2</code> vec
                    and we suddenly get an <span style={{ fontWeight: 'bold', color: 'red' }}>undefined behavior</span>.
                </p>

                <p>
                    What went wrong?
                </p>

                <p>
                    Why is <code>vars1</code> memory safe but using <code>vars2</code> leads to UB?
                </p>

                <p>
                    The problem might be immediately clear for some,
                    and it might be a bit hidden for others.
                    Different types of elements of the two vectors help us to understand:
                </p>
                <ul>
                    <li>
                        <code>let vars1: Vec&lt;Var&gt; = (0..1000).map(|i| x[i]).collect();</code>
                        <ul>
                            <li>
                                <code>index</code> operator returns <code>&Var</code>.
                                However, while creating <code>vars1</code>,
                                we copy the value and store it as an owned <code>Var</code>,
                                and immediately throw away the reference.
                            </li>
                        </ul>
                    </li>
                    <li>
                        <code>let vars2: Vec&lt;&Var&gt; = (0..1000).map(|i| &x[i]).collect();</code>
                        <ul>
                            <li>
                                Here, we don't copy.
                            </li>
                            <li>
                                We directly store returned references in our vector, hence the type <code>Vec&lt;&Var&gt;</code>.
                            </li>
                            <li>
                                However, these <strong>references are invalid</strong> and using them is UB.
                            </li>
                            <li>
                                This is because our cache is a <code>std::vec::Vec</code>,
                                and <code>Vec</code> has the freedom to move elements
                                around in order to keep the storage contagious.
                            </li>
                        </ul>
                    </li>
                </ul>

                <p>
                    You may run the program and see that all assertions succeed and program exits normally.
                </p>
                <ul><li>
                    <code>cargo run --example vector_var_unsafe_cell_vec</code>
                </li></ul>

                <p>
                    This does not prove the absence of the memory problem.
                    If we keep using it, we will eventually encounter the UB.
                    Thankfully, we have <strong>miri</strong> which would immediately tell us the problem.
                </p>
                <ul>
                    <li><code>cargo run +nightly miri --example vector_var_unsafe_cell_vec</code></li>
                    <li><span style={{ fontWeight: 'bold', color: 'red' }}>constructing invalid value: encountered a dangling reference (use-after-free)</span></li>
                </ul>

                <p>We can have a few takeaways from this attempt:</p>
                <p className="emphasis">
                    <p>◉ Things would be much easier if <code>Index</code> could return a <code>Copy</code> type by value.</p>
                    <p>◉ As we all know very well, things can go wrong in various ways in the <code>unsafe</code> land.</p>
                    <p>◉ It would be nice if memory positions of elements could remain intact.</p>
                </p>

            </section>

            <section>
                <h2>Open Rust Issue</h2>

                <p>
                    There is an open <Link text="rust-lang issue" href="https://github.com/rust-lang/rfcs/issues/997" /> about extensions of the <code>Index</code> trait.
                    It is closely related and there are several very common use cases discussed in the issue.
                    Recommended <code>IndexGet</code> extension seems to be promising to solve the problem discussed here, and many others.
                    Watching closely :)
                </p>

            </section>

            <section>
                <h2>Solution with Pinned Elements and <code>ImpVec</code></h2>

                <p>Converging back to the title.</p>

                <p>
                    First, we observed that our workaround fails due to vec elements moving around in memory as our vector grows.
                    How can we fix this?
                </p>

                <p className="emphasis">
                    A vector implementing the <Link text="PinnedVec" href="https://crates.io/crates/orx-pinned-vec" /> trait
                    guarantees that elements added to the vector are pinned to their memory locations unless explicitly changed.
                </p>

                <p>
                    Second, we saw that unsafe usage of interior mutability on a vec is <strong>way too powerful</strong> for our use case.
                    It allows us to do so many wrong things.
                    Can we have a safe wrapper that allows us only to cache <code>Var</code>s?
                </p>

                <p className="emphasis">
                    An <Link text="ImpVec" href="https://crates.io/crates/orx-imp-vec" /> is a simple wrapper over a <code>PinnedVec</code>.
                    It only adds the capability to push to the vector with an immutable reference, as demonstrated below.
                </p>

                <Code code={codeImpVecDemo} />

                <p>
                    Here, having an immutable <code>vec</code>, we know with certainty that <code>my_ref</code> will
                    remain valid throughout the lifetime of the <code>vec</code>.
                </p>

                <p>
                    You may see the solution with the <code>ImpVec</code> in the following code block or in the&nbsp;
                    <Link text="vector_var_imp_vec.rs" href="https://github.com/orxfun/orx-imp-vec/blob/main/examples/vector_var_imp_vec.rs" /> example file.
                </p>

                <Code code={codeImpVec} />

                <p>
                    Note that we only made two changes:
                </p>

                <div className="boxes-flow">
                    <div className="box">
                        We changed the type of our cache from <code>UnsafeCell&lt;Vec&lt;Var&lt;'a&gt;&gt;&gt;</code> to <code>ImpVec&lt;Var&lt;'a&gt;&gt;</code>
                    </div>

                    <div className="box">
                        We replaced the unsafe code in the <code>index</code> method with the safe <code>imp_push_get_ref</code> method of the <code>ImpVec</code>
                    </div>
                </div>

                <p className="side-note">
                    Note that <code>vec.imp_push_get_ref(value)</code> is simply a shorthand for the common use pattern of
                    the <code>vec.imp_push(value);</code> call followed by <code>&vec[vec.len() - 1]</code>.
                </p>

                <p>
                    Now <strong>miri</strong> is happy, so we are.
                </p>

                <p>
                    Implementation will be much cleaner once we have <code>IndexGet</code>, until then we can safely cache with imp vec 👿.
                </p>

            </section>

            <section>
                <h2>The Goal ?</h2>

                <p>
                    While trying to have the desired expressive api for my use case,
                    I dived into pinned elements which led to <code>PinnedVec</code> and <code>ImpVec</code>.
                    Pinned elements turned out to be useful for other data structures as well.
                    Especially for self-referential data structures, concurrent collections and parallel processing.
                    So I had to diverge a bit more :)
                </p>
                <p>
                    That happens a lot with rust, at least to me, in a fun way ❤️
                    Converging back to the goal soon.
                </p>

            </section>

            <div className="end-space"></div>

        </>
    )
}

const codeRelevantTypes = `struct Vector {
    symbol: String,
}

#[derive(Clone, Copy)]
struct Var<'a> {
    index: usize,
    vector: &'a Vector,
}`;

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

// still good

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
        self.created_vars.imp_push_get_ref(var)
    }
}

#[derive(Clone, Copy)]
struct Var<'a> {
    vector: &'a Vector<'a>,
    index: usize,
}

impl<'a> Display for Var<'a> {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result {
        write!(f, "{}[{}]", &self.vector.symbol, self.index)
    }
}

let x = &Vector::new("x");

// good

let x0: Var = x[0];
assert_eq!(x0.to_string(), "x[0]");

// still good

let vars1: Vec<Var> = (0..1000).map(|i| x[i]).collect();

for (i, x) in vars1.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}

// also good

let vars2: Vec<&Var> = (0..1000).map(|i| &x[i]).collect();

for (i, x) in vars2.iter().enumerate() {
    assert_eq!(x.to_string(), format!("x[{}]", i));
}
`;