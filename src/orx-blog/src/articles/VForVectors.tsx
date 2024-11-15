import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/v-for-vectors-2024-11-18';
const title = 'Traits to Unify all Vectors';
const date = '2024-11-18';
const summary = 'vector traits, polymorphic inputs, monomorphization and the orx-v crate'

export const PageMetaVForVectors = () => {
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
                This article discusses the requirement for vector traits and
                motivation behind the <Link text="orx-v" href="https://crates.io/crates/orx-v" /> crate that provides
                discussed abstraction to unify the vectors.
            </p>

            <p>
                But unify which vectors (?_?)
            </p>

            <p>
                Beside more specialized data structures, we regularly use one dimensional vectors,
                matrices or more general jagged two dimensional vectors,
                and sometimes higher dimensional vectors.
                At first, the choice might seem straightforward, the standard vector.
                And vectors of vectors for higher dimensions.
            </p>

            <div className="boxes">
                <div className="box">
                    V1
                    <div className="hor-line"></div>
                    <code>Vec&lt;T&gt;</code>
                </div>

                <div className="box">
                    Matrix
                    <div className="hor-line"></div>
                    <code>Vec&lt;Vec&lt;T&gt;&gt;</code>
                </div>

                <div className="box">
                    V2
                    <div className="hor-line"></div>
                    <code>Vec&lt;Vec&lt;T&gt;&gt;</code>
                </div>
            </div>

            <p>
                But when we start calling the algorithm by inputs coming from practical use cases,
                it turns out that the choice is not always given.
            </p>

            <p>
                A popular case where we deviate from this obvious choice is when we choose a linear or
                flat <code>Vec&lt;T&gt;</code> even to represent higher dimensional vectors
                in order to reduce the level of indirection and improve cache locality.
            </p>

            <p>
                However, there is more to it.
            </p>

            <section>

                <h2>Use Cases Requiring a Different Kind of a Vector</h2>

                <h3>Sparsity by Input Nature</h3>

                <p>
                    Let's assume that our algorithm requires an n-by-n distance matrix and we write our algorithm to accept
                    a slice of vectors.
                </p>

                <Code code="fn algorithm(distance_matrix: &[Vec<Distance>], other_args: ...) -> Output { ... }" />

                <div className="side-note">
                    Every time we use a slice of vecs as an argument to some function is a sign of&nbsp;
                    <span className="inline-emphasis">the lack of some abstraction</span>.
                    What we actually want to use is something like <code>&[&[Distance]]</code>.
                    But there is no way to pass our owned <code>Vec&lt;Vec&lt;Distance&gt;&gt;</code> to this method without unnecessary
                    allocation.
                    It doesn't work because <span className="inline-emphasis">slice</span> is not the abstraction we are looking for.
                </div>

                <p>
                    We might call our algorithm with a distance matrix where all elements are interesting.
                    Then, this signature would be fine.
                </p>

                <p className="side-note">
                    By interesting, we mean different.
                    A matrix of all zeros is not very interesting.
                    And only interesting elements deserve to use memory (- ‿◦ )
                </p>

                <p>
                    It is also very common to work with sparse matrices where majority of elements are equal.
                    For instance, many elements might equal infinity (∞), indicating that we cannot travel from one
                    location to another for one reason or another.
                    Do we still need to fill the entire matrix?
                </p>

                <p>
                    To put this into perspective, let's assume we have 1000 (1k) locations.
                    Due to our routing rules, we can connect each location only to its 10 neighbor locations.
                    Then, we have 10k interesting elements in the matrix and remaining 990k elements are all equal to ∞.
                </p>

                <p>
                    If we had 100k locations instead of 1k, a complete matrix would require storing
                    10 billion❗ elements while only 1 million elements are interesting.
                </p>

                <p>
                    We could easily avoid huge memory requirement by wrapping a lookup table.
                </p>

                <Code code={sparseVec} />

                <p className="side-note"><code>HashMap</code> is interchangeable with any other lookup table.</p>

                <p>
                    Of course, this implementation is not complete, but with some additional work we can use it in our algorithm
                    as a two dimensional vector to efficiently handle sparsity.
                </p>

                <p>
                    <span className="inline-emphasis">The problem</span>, however, is that we cannot use this new data structure
                    with our prior function signature that accepts <code>&[Vec&lt;Distance&gt;]</code>.
                    What should we do?
                </p>

                <div className="seq">
                    <div>
                        We may change the signature to accept <code>&SparseVec&lt;Distance&gt;</code> instead.
                        But then we would underperform when the data is dense or small since lookup tables are slower.
                    </div>

                    <div>
                        We may try to understand the most common use case.
                        Is it sparse or is it dense?
                        And set the signature accordingly.
                        This would still be suboptimal since we know we can do better in the less frequent use case.
                    </div>

                    <div>
                        Then, we copy and paste the algorithm: one for dense cases and one for sparse cases.
                        Implementation is identical but the arguments have different types.
                        Ugly, annoying, error prone, not scalable, hard to maintain.
                        But it works ¯\_(ツ)_/¯
                    </div>
                </div>

                <p>
                    This observation sets the target.
                    We need the copies of the algorithm, made by the compiler of course.
                    Through traits, generics and monomorphization.
                </p>

                <div className="emphasis">
                    <p>
                        Sparse vectors backed with lookup tables are essential to reduce memory requirement when
                        working with sparse data.
                    </p>
                </div>

                <h3>Sparsity by Use Pattern and Lazy Evaluation</h3>

                <p>
                    Continuing on the topic, sparsity is not always a property of the input.
                    Sometimes we have a dense matrix; however, our algorithm will only access
                    a <span className="inline-emphasis">very small subset</span> of the elements.
                </p>

                <p>
                    Which elements?
                </p>

                <p>
                    We don't know ahead of time, this is dynamically determined by the direction of the search.
                </p>

                <p>
                    Let's assume we have <strong>n</strong> locations with their coordinates in the Euclidean plane,
                    and have Euclidean distances among these locations.
                </p>

                <Code code={euclideanDistance} />

                <p>
                    Consider the following two alternatives.
                </p>

                <div className="boxes">
                    <div className="box">
                        Allocated Complete Matrix
                        <div className="hor-line"></div>
                        <p>
                            We pre-compute n² elements, fill the matrix and pass it to the algorithm.
                        </p>
                        <p>
                            Whenever the algorithm requires an element, it is a random access in our matrix.
                        </p>
                    </div>

                    <div className="box">
                        No Allocation
                        <div className="hor-line"></div>
                        <p>
                            We do not pre-compute any elements, we pass in the function.
                        </p>
                        <p>
                            Whenever the algorithm requires an element, it is a call to
                            the <code>euclidean_distance</code> function with corresponding locations.
                        </p>
                    </div>
                </div>

                <p>
                    Which one is better?
                </p>

                <p>
                    The choice is not trivial.
                    The prior is more common and fits to cases where we reuse the distance matrix over and over again.
                    Reusing the same matrix justifies the O(n²) time complexity we eagerly pay to build the matrix beforehand.
                    However, there are also cases where function alternative is the dominating choice.
                </p>

                <div className="seq">
                    <div>
                        Assume that due to the design of our algorithm, we will never access the same element more than once.
                        In this case, the function approach is better in terms of computation time.
                        It benefits from laziness and does not waste any time for computing an unnecessary element.
                    </div>

                    <div>
                        Or consider a large <code>n</code>, so large that we cannot allocate our matrix that grows
                        exponentially in <code>n</code>.
                        Then, the function approach helps to overcome memory resource limitations.
                        Actually, there is always a large enough <code>n</code> beyond which functional vector is the only
                        feasible solution.
                    </div>
                </div>

                <p>
                    We could solve this problem by wrapping a function (a closure) which behaves as a two dimensional vector.
                </p>

                <Code code={funVec} />

                <div className="emphasis">
                    <p>
                        Functional vectors with lazy evaluation of elements are useful to reduce time complexity in sparse access
                        scenarios and reduce memory requirement when dealing with very large data.
                    </p>
                </div>

                <h3>Add Caching to Laziness</h3>

                <p>
                    Unfortunately, computing our elements is not always as cheap as calling the <code>euclidean_distance</code> function.
                    Maybe our problem requires the Haversine distance, which is a bit more involved to compute.
                    Or even worse, we might need to make api calls to an external routing engine to get distances.
                </p>

                <Code code={distanceApi} />

                <p>
                    In addition to the concerns discussed earlier, here we have an additional concern.
                    Computation of each element is time consuming so we want to avoid computing the same distance more than once.
                    In other words, we want to cache or memoize the values that we retrieve on the fly.
                </p>

                <p>
                    This time, we need a bit of unsafe and interior mutability, and we are not supposed to <code>Send</code> the vector.
                    But we could have a simple enough implementation to provide us with both laziness and caching.
                </p>

                <Code code={cachedVec} />

                <p className="side-note">
                    <code>HashMap</code> is again interchangeable and demonstrates the simplest cache implementation.
                    Depending on the use cases, we might want to limit the cache size naively or more intelligently to balance the computational
                    cost and memory requirement.
                </p>

                <div className="emphasis">
                    <p>
                        Caching vectors backed with lookup tables allow us to combine benefits of sparse vectors with functional vectors.
                    </p>
                </div>

                <h3>Special Cases</h3>

                <p>
                    While writing algorithms, it is appealing to provide its more general implementation so that we can solve more problems with it.
                </p>

                <p className="emphasis">
                    If our algorithm can solve the general case, it can also solve all of its special cases.
                </p>

                <p>
                    So why implement twice?
                </p>

                <p>
                    Consider, for instance, an algorithm that can solve the <Link text="shortest path problem" href="https://en.wikipedia.org/wiki/Shortest_path_problem" />.
                    It is capable of computing the shortest distance between any pair of nodes in a graph (<i>general case</i>).
                    We can also compute the minimum number of arcs between two nodes in a graph (<i>special case</i>).
                    All we need to do is to set all arc costs to one.
                </p>

                <p>
                    Going one level up, consider
                    the <Link text="minimum cost flow problem" href="https://en.wikipedia.org/wiki/Minimum-cost_flow_problem" /> (mcfp).
                    We have an algorithm that can solve the mcfp (<i>general case</i>).
                    We can also solve the shortest path problem with it by having only one source and sink, and sending one unit of flow
                    (<i>special case</i>).
                    And as a special case of its special case, we can compute the minimum number of arcs among two nodes with it.
                </p>

                <p>
                    This is wonderful!
                </p>

                <p>
                    But often practical considerations kick in and prevent us from using this nice computational property.
                </p>

                <p>
                    Most probably, we will never justify allocating a distance matrix where all elements are 1 and we will write
                    an additional algorithm for the special case, which is identical except that distance matrix elements are
                    replaced by 1.
                </p>

                <p>
                    We could actually avoid the allocation simply by wrapping a scalar.
                </p>

                <Code code={constVec} />


                <div className="emphasis">
                    <p>
                        We can have special vectors to represent special cases which would allow us to use a general algorithm implementation
                        efficiently.
                    </p>
                </div>


                <h3>Vector Traits & Monomorphization</h3>

                <p>
                    These are just some common examples where we might require different vector types.
                    The list goes on and hence the abstraction must be extensible.
                </p>

                <p>
                    To complete the example, let's assume that we want to be able to use our <code>algorithm</code> above
                    with the following concrete distance matrix types that fit different situations.
                </p>

                <div className="seq">
                    <div>
                        <code>&[Vec&lt;Distance&gt;]</code> → when the entire distance matrix is not expensive to create and store.
                        <ul>
                            <li>
                                <code>&[Distance]</code> → as a flattened complete distance matrix in the same situation but for the possibility
                                of performance improvements.
                            </li>
                            <li>
                                <code>&ndarray::Array2&lt;Distance&gt;</code> → also in the same situation but for performance optimization.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <code>SparseVec&lt;Distance&gt;</code> → when we can connect each address to a fixed number of neighbor addresses.
                    </div>
                    <div>
                        <code>FunVec&lt;Distance, _&gt;</code> → when storing the complete matrix is expensive but computing distances is cheap.
                    </div>
                    <div>
                        <code>CachedVec&lt;Distance, _&gt;</code> → when storing the complete matrix is expensive and computing distances is
                        expensive, as well.
                    </div>
                    <div>
                        <code>ConstVec&lt;Distance&gt;</code> → when working with vectors where all elements are equal.
                    </div>
                </div>

                <p className="side-note">
                    Alternative ctor types mentioned here, such as <code>SparseVec</code>, <code>FunVec</code> and <code>CachedVec</code> are
                    just prototypes to demonstrate the idea of use cases requiring different kinds of vectors.
                </p>

                <p>
                    Then, the goal is as follows.
                </p>

                <div className="emphasis">
                    <p>
                        ① We want to have a <strong>single</strong> generic implementation of the <strong>algorithm</strong> which
                        allows all (!) concrete data types that behaves as a distance matrix.
                    </p>
                    <p>
                        ② Running the algorithm with a concrete type must perform as fast as it would if we had a special implementation
                        for this specific type.
                    </p>
                </div>

                <p>
                    In order to achieve this, we need to define the shared behavior of one and higher dimensional vectors as traits.
                    The second goal will be achieved thanks to zero cost abstraction and monomorphization.
                </p>

            </section>

            <section>

                <h2>orx-v and Vector Traits</h2>

                <p>
                    Goal of the <Link text="orx-v" href="https://crates.io/crates/orx-v" /> crate is first to define the common behavior of one
                    and higher dimensional vectors as a trait; and then to provide a large number of implementations
                    to <span className="inline-emphasis">unify all the vectors!</span>
                </p>

                <p>
                    Consider the first two dimensions.
                </p>

                <div className="boxes">
                    <div className="box">
                        <p><code>V1&lt;T&gt;</code> ⇨ any 1 dimensional vector</p>
                        <div className="hor-line"></div>

                        <p><code>Vec&lt;T&gt;</code></p>
                        <p><code>[T; 1000]</code></p>
                        <p><code>&[T]</code></p>
                        <p><code>ndarray::Array1&lt;T&gt;</code></p>
                        <p><code>FunVec</code> where the <code>fun</code> is <code>usize -&gt; T</code></p>
                        <p><code>ConstVec</code></p>
                        <p><code>SparseVec</code> with any lookup</p>
                        <p><code>CachedVec</code> with any cache</p>
                        <p>...</p>
                    </div>

                    <div className="box">
                        <p><code>V2&lt;T&gt;</code> ⇨ any 2 dimensional vector</p>
                        <div className="hor-line"></div>

                        <p><code>Vec&lt;Vec&lt;T&gt;&gt;</code></p>
                        <p><code>Vec&lt;[T; 1000]&gt;</code></p>
                        <p><code>[Vec&lt;T&gt;; 1000]</code></p>
                        <p><code>FlatMatrix&lt;V1&lt;T&gt;&gt;</code> to use any <code>V1&lt;T&gt;</code> as a flat matrix</p>
                        <p><code>ndarray::Array2&lt;T&gt;</code></p>
                        <p><code>FunVec</code> where the <code>fun</code> is <code>[usize; 2] -&gt; T</code></p>
                        <p><code>ConstVec</code></p>
                        <p><code>SparseVec</code> with any lookup</p>
                        <p><code>CachedVec</code> with any cache</p>
                        <p>...</p>
                    </div>
                </div >

                <p>
                    Then, we have <code>V3</code> and <code>V4</code>.
                    They are actually just aliases for the trait <code>NVec&lt;D, T&gt;</code> where <code>D</code> represents
                    the dimension of the vector.
                    Among others, this underlying trait has the following core methods.
                </p>

                <Code code={nvecTrait} />

                <p>
                    In brief, <code>NVec&lt;D, T&gt;</code> trait defines the common interface or behavior of <code>D</code>&nbsp;
                    dimensional vectors as follows:
                </p>

                <div className="seq">
                    <div>They provide efficient random access using a <code>D</code> dimensional index.</div>
                    <div>They allow for efficient serial iteration.</div>
                    <div>They have complete cardinality information in all dimensions less than or equal to <code>D</code>.</div>
                </div>

                <p>
                    Next, we have the <code>mut</code> extension <code>NVecMut&lt;D, T&gt;</code> (and corresponding
                    aliases such as <code>V1Mut</code>, <code>V2Mut</code>, etc.) adding mutation functionality via basic
                    methods such as:
                </p>

                <Code code={nvecMutTrait} />

                <h3>Example Practical Use of the Vector Traits</h3>

                <p>
                    Finalizing our partially built example, let's assume that the algorithm we have discussed so far is
                    the <Link text="two-opt" href="https://en.wikipedia.org/wiki/2-opt" /> which is a local search algorithm
                    to solve the traveling salesperson problem.
                    The algorithm takes a tour and keeps modifying it until its distance can no longer be reduced within
                    the two-opt neighborhood.
                    We can have our generic implementation as follows:
                </p>

                <Code code={twoOptAlgorithm} />

                <p>
                    How the algorithm works is not relevant for this article.
                    The relevant part is the way the vector traits are used.
                </p>

                <div className="seq">
                    <div>
                        The argument <code>distances: impl V2&lt;u32&gt;</code> means that we can pass in any two dimensional
                        vector with <code>u32</code> elements.
                        Its concrete type does not matter as long as it implements <code>V2</code>.
                        Whether we pass in by value or reference does not matter either, that is the caller's decision and
                        not relevant to the algorithm.

                        <ul>
                            <li><code>d.at([i1, i2])</code> accesses the <code>(i1, i2)</code>-th element of the matrix.</li>
                        </ul>
                    </div>
                    <div>
                        Similarly, the argument <code>mut tour: impl V1Mut&lt;usize&gt;</code> means that we can pass in any one
                        dimensional vector that we can mutate.

                        <ul>
                            <li>
                                <code>tour.card([])</code> returns the immediate number of children of the one dimensional vector.
                                In the <code>D1</code> case, this is simply the number of elements, or number of cities in the tour.
                            </li>
                            <li><code>*tour.at_mut(j) = t;</code> sets the <code>j</code>-th element of the tour to <code>t</code>.</li>
                            <li>We could have alternatively called <code>tour.set(j, t);</code>.</li>
                        </ul>
                    </div>
                </div>

                <p>
                    As you may see, the implementation side is not very interesting.
                    This is nice.
                </p>

                <p>
                    Interesting things happen on the caller side.
                </p>

                <p>
                    Now we can call this algorithm with (<i>ideally</i>) all concrete input types that makes sense as one and two
                    dimensional vectors.
                    In the following, we illustrate calls with different distance matrices.
                </p>

                <Code code={twoOptAlgorithmCalls} />

                <p className="side-note">
                    You may find the entire example <Link text="here" href="https://github.com/orxfun/orx-v/blob/main/examples/two_opt.rs" />.
                </p>

            </section>

            <section>

                <h2>Conclusions & Moving Forward</h2>

                <p>
                    I spend quiet a lot of time developing algorithms, mostly optimization algorithms.
                    Due to its joyful type system and monomorphization, rust is a wonderful language for this
                    purpose ❤️<img src="https://rustacean.net/assets/rustacean-orig-noshadow.png" height="15px" />.
                </p>

                <p>
                    Therefore, vector traits defined in <span className="inline-emphasis">orx-v</span> crate are first meant to
                    make my life and fellow algorithm developers' lives easier.
                    Our implementations might readily be available for a wider range of real life situations.
                    Having a generic implementation, we can easily benchmark different concrete types.
                    And most importantly, while developing, we focus on the logic and flow of the algorithm rather than
                    decisions on concrete types, which is often difficult or impossible to make in early stages.
                </p>

                <p>
                    The crate is new and will hopefully evolve towards the clear goal:
                    if a concrete data structure makes sense as a vector, we must be able to use it as a vector.
                    Currently, a wide range of implementations for types in the core and std are provided in the crate.
                    Further, implementations of relevant and frequently used data structures such as the "ndarray" arrays are also
                    provided optionally, and can be used by adding the corresponding feature.
                </p>

                <p>
                    Please feel free to open an <Link text="issue" href="https://github.com/orxfun/orx-v/issues/new" /> or create a PR
                    if you notice an error, or you think something could be improved, or you have a suggestion to extend the trait definitions with
                    additional functionalities, or you think that certain concrete types must implement the vector traits, or to discuss something.
                    In brief, ideas and contributions are very welcome 😃
                </p>

            </section>

            <div className="end-space"></div>
        </>
    );
}

const sparseVec = `use std::collections::HashMap;

struct SparseVec<T: Copy> {
    default_value: T,
    lookup: HashMap<(usize, usize), T>,
}

impl<T: Copy> SparseVec<T> {
    fn at(&self, i: usize, j: usize) -> T {
        match self.lookup.get(&(i, j)) {
            Some(value) => *value,
            None => self.default_value,
        }
    }
}
`;

const euclideanDistance = `struct Location(u32, u32);

fn euclidean_distance(a: &Location, b: &Location) -> u32 {
    (((a.0 - b.0) * (a.0 - b.0) + (a.1 - b.1) * (a.1 - b.1)) as f64).sqrt() as u32
}
`;

const funVec = `struct FunVec<T, F>
where
    F: Fn(usize, usize) -> T,
{
    fun: F,
}

impl<T, F> FunVec<T, F>
where
    F: Fn(usize, usize) -> T,
{
    fn at(&self, i: usize, j: usize) -> T {
        (self.fun)(i, j)
    }
}
`;

const distanceApi = `struct Address {/* address fields */}

fn distance_api(a: &Address, b: &Address) -> u32 {
    // call to the external api and return the distance from a to b
}
`;

const cachedVec = `struct CachedVec<T, F>
where
    F: Fn(usize, usize) -> T,
{
    fun: F,
    cache: UnsafeCell<HashMap<(usize, usize), T>>,
}

impl<T, F> CachedVec<T, F>
where
    T: Copy,
    F: Fn(usize, usize) -> T,
{
    fn at(&self, i: usize, j: usize) -> T {
        let cache = unsafe { &mut *self.cache.get() };
        *cache.entry((i, j)).or_insert_with(|| (self.fun)(i, j))
    }
}
`;

const constVec = `struct ConstVec<T>(T);

impl<T: Copy> ConstVec<T> {
    fn at(&self, _i: usize, _j: usize) -> T {
        self.0
    }
}
`;

const nvecTrait = `/// this is our random access method => vec.at([2, 1])
fn at(&self, idx: impl IntoIdx<D>) -> T;

/// this method allows recursive definitions
/// each child of a V3 is a V2; and
/// each child of a V2 is a V1; ...
fn child(&self, i: D::ChildIdx) -> impl NVec<D::PrevDim, T>;

/// note that this is different than .iter() as it yields the
/// innermost scalars of the multi-dimensional vector.
///
/// a length 10 V1 yields its 10 elements
/// a 3x4 matrix yields its 12 elements
fn all(&self) -> impl Iterator<Item = T>;

/// and this is a generalization of the "len" method:
/// * vec.card([]) -> returns the number of immediate children
/// * vec.card([2]) -> returns the number of children of vec.child(2)
/// * vec.card([2, 1]) -> returns vec.child(2).child(1).card([])
/// * and so on.
fn card(&self, idx: impl Into<D::CardIdx>) -> usize;
`

const nvecMutTrait = `fn at_mut<Idx: IntoIdx<D>>(&mut self, idx: Idx) -> &mut T;

fn child_mut(&mut self, i: D::ChildIdx) -> impl NVecMut<D::PrevDim, T>;

fn mut_all<F: FnMut(&mut T)>(&mut self, f: F);
`

const twoOptAlgorithm = `fn apply_two_opt(mut tour: impl V1Mut<usize>, i: usize, j: usize) {
    let mut i = i + 1;
    let mut j = j;
    while i < j {
        let t = tour.at(i);
        *tour.at_mut(i) = tour.at(j);
        *tour.at_mut(j) = t;
        i += 1;
        j -= 1;
    }
}

fn two_opt(distances: impl V2<u32>, mut tour: impl V1Mut<usize>) -> u32 {
    let mut improvement = 0;
    let d = distances;
    let n = tour.card([]);

    let mut improved = true;
    while improved {
        improved = false;

        for i in 0..(n - 1) {
            let i1 = tour.at(i);
            let i2 = tour.at(i + 1);

            for j in (i + 2)..n {
                let j1 = tour.at(j);
                let j2 = tour.at((j + 1) % n);

                let removed_len = d.at([i1, i2]) + d.at([j1, j2]);
                let added_len = d.at([i1, j1]) + d.at([i2, j2]);

                if removed_len > added_len {
                    improved = true;
                    improvement += removed_len - added_len;
                    apply_two_opt(&mut tour, i, j);
                }
            }
        }
    }

    improvement
}
`;

const twoOptAlgorithmCalls = `let n = 100;
let mut tour: Vec<_> = initial_tour(n);

// complete matrix stored as a V2
{
    // Vec<Vec<u32>>
    let distances: Vec<Vec<u32>> = complete_distance_matrix_d2(n);
    let _ = two_opt(&distances, &mut tour);

    // ndarray::Array2
    let distances: Array2<u32> = complete_ndarray_d2(n);
    let _ = two_opt(&distances, &mut tour);
}

// complete matrix stored as a flattened V1
{
    // Vec<u32> as flattened matrix
    let distances: Vec<u32> = complete_distance_matrix_d1(n);
    let _ = two_opt(distances.as_jagged_with_uniform_lengths(n), &mut tour);

    // ndarray::Array1 as flattened matrix
    let distances: Array1<u32> = complete_ndarray_d1(n);
    let _ = two_opt(distances.as_jagged_with_uniform_lengths(n), &mut tour);
}

// sparse matrix
let finite_distances: HashMap<[usize; 2], u32> = finite_distances_map(n);
let distances = V.d2().sparse_from(finite_distances, 10000);
let _ = two_opt(&distances, &mut tour);

// functional matrix
let locations: Vec<Location> = get_locations(n);
let distances = V
    .d2()
    .fun(|[i, j]| euclidean_distance(&locations[i], &locations[j]));
let _ = two_opt(&distances, &mut tour);

// functional matrix: exclude from-to depot (node 0) distance from optimization
let locations: Vec<Location> = get_locations(n);
let distances = V.d2().fun(|[i, j]| match (i, j) {
    (0, _) => 0,
    (_, 0) => 0,
    _ => euclidean_distance(&locations[i], &locations[j]),
});
let _ = two_opt(&distances, &mut tour);

// cached matrix
let locations: Vec<Location> = get_locations(n);
let distances = V
    .d2()
    .fun(|[i, j]| routing_engine(&locations[i], &locations[j]))
    .into_cached();
let _ = two_opt(&distances, &mut tour);

// uniform distances
let distances = V.d2().constant(10);
`;