import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/v-for-vectors-2024-11-18';
const title = 'Vector Traits, Polymorphic Inputs and Monomorphization';
const date = '2024-11-18';
const summary = 'Vector traits, motivation & examples & orx-v crate.'

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

            <p>
                I am frequently working algorithms, mainly on optimization algorithms.
                With a great type system and monomorphization, rust is a wonderful language for this
                purpose ❤️<img src="https://rustacean.net/assets/rustacean-orig-noshadow.png" height="15px" />.
            </p>

            <p>
                Among others, we often need a one dimensional vector (<Link text="V1" href="https://docs.rs/orx-v/latest/orx_v/trait.NVec.html" />),
                a matrix (<Link text="Matrix" href="https://docs.rs/orx-v/latest/orx_v/trait.Matrix.html" />)
                or a more general jagged two dimensional vector (<Link text="V2" href="https://docs.rs/orx-v/latest/orx_v/trait.V2.html" />),
                and less frequently but sometimes a higher dimensional vector.
                The choice might seem straightforward, the standard vector and its nested higher dimensions.
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
                But when we start using the algorithm with practical use cases, it turns out that the choice is not always given.
            </p>

            <p>
                One well known case is to choose a linear or flat <code>Vec&lt;T&gt;</code> even to represent higher
                dimensional vectors such as a matrix or a jagged array in order to reduce the level of indirection
                and improve cache locality.
            </p>

            <p>
                However, there is more to it.
                I list here some of the use cases that I experienced where I needed a different kind of vector.
            </p>

            <h2>Use Cases Requiring a Different Vector</h2>

            <h3>Sparsity by Input Nature</h3>

            <p>
                Let's assume that our algorithm requires an n-by-n distance matrix and we write our algorithm to accept
                a slice of vectors.
            </p>

            <Code code="fn algorithm(distance_matrix: &[Vec<Distance>], other_args: ...) -> Output { ... }" />

            <p>
                Now, there are situations where we will run this algorithm with a distance matrix where all elements are
                interesting.
                A matrix of all zeros is not very interesting.
                So by interesting, we mean different.
            </p>

            <p>
                And it is very common to work with sparse matrices where majority of elements of this matrix are
                equal. For instance, many elements might equal infinity (∞), indicating that we cannot travel from one
                location to another for one reason or another.
                Do we still need to fill the entire matrix?
            </p>

            <p className="side-note">Only interesting elements deserve to use memory 😊</p>

            <p>
                To put this into perspective, let us assume we have 1000 (1k) locations.
                Due to our routing rules, we can connect each location only to its 10 neighbor locations.
                Then, we have 10k interesting elements in the matrix and remaining 990k elements are all equal to ∞.
            </p>

            <p>
                If we had 100k locations instead of 1k, a complete matrix would require storing
                10 billion❗ elements while only 1 million elements are interesting.
            </p>

            <p>
                We can easily avoid this by simply wrapping a lookup table.
            </p>

            <Code code={sparseVec} />

            <p className="side-note"><code>HashMap</code> here is interchangeable with other lookup tables.</p>

            <p>
                Of course, this implementation is not complete, but with some additional we can use it in our algorithm
                as a two dimensional vector (<code>V2</code>) to efficiently handle sparsity.
            </p>

            <p>
                <span className="inline-emphasis">The problem</span>, however, is that we cannot use this new data structure
                with our prior function signature that accepts <code>&[Vec&lt;Distance&gt;]</code>.
                What should we do?
            </p>

            <div className="seq">
                <div>
                    We may change the signature to accept <code>&SparseVec&lt;Distance&gt;</code> instead.
                    But then we would underperform when the data is dense or small.
                </div>

                <div>
                    We may try to understand the most common use case, sparse or dense, and decide accordingly.
                    This is still suboptimal since we know we can do better in the less frequent use case.
                </div>

                <div>
                    Then, we copy and paste the algorithm: one for dense and one for sparse.
                    Implementation is identical but the arguments have different types.
                    Ugly, annoying, error prone, hard to maintain.
                    But it works ¯\_(ツ)_/¯
                </div>
            </div>

            <p className="side-note">
                Proposed solution will of course <strong>not</strong> be manual copies of the algorithm but compiler copies
                through vector traits and monomorphization.
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
                Sometimes we have a very interesting dense matrix; however, our algorithm will only access
                a <span className="inline-emphasis">very small subset</span> of the elements.
            </p>

            <p>
                Which elements?
            </p>

            <p>
                We don't know ahead of time, this is dynamically determined by the direction of the search.
            </p>

            <p>
                Let us assume we have <strong>n</strong> locations with their coordinates in the Euclidean plane.
                Further, our distances are Euclidean distances among these locations.
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
                Reusing the same matrix justifies the O(n²) time complexity we pay ahead of time.
                However, there are also cases where function alternative is the dominating choice.
            </p>

            <div className="seq">
                <div>
                    Assume that due its nature of search, the algorithm never accesses the same element more than once.
                    The latter approach benefits from laziness and does not waste any computation time for an unnecessary
                    element.
                </div>

                <div>
                    Or consider a large <code>n</code>, so large that we cannot allocate our matrix that grows exponentially.
                    Actually, there is always a large enough <code>n</code> beyond which functional vector is the only
                    feasible solution.
                </div>
            </div>

            <p>
                We solve this problem by wrapping a function (a closure) which behaves as a two dimensional vector.
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
                Unfortunately, generation of our inputs are not as cheap as the `euclidean_distance`.
                Maybe our problem requires the Haversine distance, computing which is a bit more involved.
                Or even worse, we might need to make api calls to an external routing api to get distances.
            </p>

            <Code code={distanceApi} />

            <p>
                In addition to the concerns with filling up the entire matrix, here we have an additional concern.
                We never want to compute the same distance twice as each computation is time consuming.
                In other words, we want to cache or memoize the values that we retrieved on the fly.
            </p>

            <p>
                This time, we need a bit of unsafe and interior mutability, and we are not supposed to `Send` it,
                but the following wrapper is simple enough to implement and would provide us with both laziness and caching.
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
                While writing algorithms, it is appealing to provide its more generic version so that we can solve more problems with it.
                If our implementation can solve the general case, it can also solve all its special cases.
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
                And as a special case of its special case, we can compute the minimum number of arcs among two nodes.
            </p>

            <p>
                This is wonderful!
                But practical considerations often kick in and prevent us to take benefit from it.
            </p>

            <p>
                To have the simplest example, consider the dot product function below (<i>general case</i>).
            </p>

            <Code code={dotProduct} />

            <p>
                Notice that we can use this function to sum the values of an array, all we need to do is to use a vector of ones as the rhs
                (<i>special case</i>).
                However, we would probably implement the sum method separately as we would never want to allocate the boring vector just to receive
                1 at each position.
            </p>

            <p>
                We could actually avoid the allocation if we gave scalars the ability to behave like vectors with the same elements.
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
                Let us assume that our <code>algorithm</code> above is a routing algorithm where we create a tour to visit a set
                of addresses.
                We want to be able to use this algorithm with the following concrete distance matrix types in different situations.
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
                    <code>FunVec&lt;Distance, _&gt;</code> → when computing distances is cheap and storing the complete matrix is expensive.
                </div>
                <div>
                    <code>CachedVec&lt;Distance, _&gt;</code> → when computing distances is expensive and storing the complete matrix is
                    expensive as well.
                </div>
                <div>
                    <code>ConstVec&lt;Distance&gt;</code> → when working with vectors where all elements are equal.
                </div>
            </div>

            <p className="side-note">
                These types such as <code>SparseVec</code>, <code>FunVec</code> and <code>CachedVec</code> are just prototypes
                to demonstrate the idea of use cases requiring different kinds of vectors.
            </p>

            <p>
                Then, the goal is as follows.
            </p>

            <div className="emphasis">
                <p>
                    First, We want to have a <strong>single</strong> generic implementation of the <strong>algorithm</strong> which ideally
                    allows all concrete data types which makes sense as a distance matrix.
                    This would prevent code repetition which leads to annoyance, maintenance problems and errors.
                </p>
                <p>
                    Second, running the algorithm with a concrete type must perform as fast as it would if we had a special implementation
                    for this specific type.
                    This is critical since the target use cases are mainly time critical algorithms.
                </p>
            </div>

            <p>
                In order to achieve this, we need the traits defining the shared behavior of one and higher dimensional vectors.
                <Link text="orx-v" href="https://crates.io/crates/orx-v" /> crate addresses this and aims to&nbsp;
                <span className="inline-emphasis">unify all the vectors!</span>.
            </p>

            <p>
                The second goal will be achieved without any effort thanks to zero cost abstraction and monomorphization.
            </p>

            <h2>orx-v Crate and Vector Traits</h2>

            <p>
                Goal of the <span className="inline-emphasis">orx-v</span> crate is first to define the common behavior of one
                and higher dimensional vectors as a trait; and then to provide a large number of implementations.
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
                    <p><code>&[T]</code></p>
                    <p><code>ndarray::Array2&lt;T&gt;</code></p>
                    <p><code>FunVec</code> where the <code>fun</code> is <code>[usize; 2] -&gt; T</code></p>
                    <p><code>ConstVec</code></p>
                    <p><code>SparseVec</code> with any lookup</p>
                    <p><code>CachedVec</code> with any cache</p>
                    <p>...</p>
                </div>
            </div >

            <p>
                And of course, we have <code>V3</code> and <code>V4</code>; and they are actually just aliases
                (sort of) for the trait <code>NVec&lt;D, T&gt;</code> where <code>D</code> represents the dimension
                of the vector. Among others, this underlying trait has the following core methods.
            </p>

            <Code code={nvecTrait} />

            <p>
                In brief, <code>NVec&lt;D, T&gt;</code> trait establishes the common interface for <code>D</code>&nbsp;
                dimensional vectors with (i) efficient random access, (ii) efficient serial iteration and complete
                cardinality information in all dimensions less than or equal to <code>D</code>.
            </p>

            <p>
                And of course, we have the <code>mut</code> extension <code>NVecMut&lt;D, T&gt;</code> (and corresponding
                aliases such as <code>V1Mut</code>, <code>V2Mut</code>, etc.) adding mutation functionality via basic
                methods such as:
            </p>

            <Code code={nvecMutTrait} />

            <h3>Example Practical Use of the Vector Traits</h3>

            <p>
                To have a practical example, let's assume that our algorithm is the&nbsp;
                <Link text="two-opt" href="https://en.wikipedia.org/wiki/2-opt" /> which is a local search algorithm
                to solve the traveling salesperson problem.
                The algorithm takes a tour and keeps modifying it until its distance can no longer be reduced within
                the two-opt neighborhood.
                We can have our generic implementation as follows:
            </p>

            <Code code={twoOptAlgorithm} />

            <p>
                Notice that this implementation is almost equivalent to the special implementation where we would fix
                the argument types as:
            </p>

            <Code code={twoOptAlgorithmFixedTypes} />

            <p>
                However, it is much more general as illustrated with calls using various different concrete types below.
            </p>

            <Code code={twoOptAlgorithmCalls} />

            <p className="side-note">
                You may find the entire example <Link text="here" href="https://github.com/orxfun/orx-v/blob/main/examples/two_opt.rs" />.
            </p>

            <h2>Conclusions & Moving Forward</h2>

            <p>
                The vector traits have been very helpful in extending the situations that we can handle with a single algorithm
                implementation. Further, in development phase, they allow us to focus on the logic and flow of the algorithm rather than
                decisions on concrete input vector types, which is often difficult to make in early stages.
            </p>

            <p>
                Additionally, <code>Matrix</code> traits are defined which is closely related to <code>V2</code>; however, they guarantee
                that the cardinality is rectangular rather than having variable length rows.
            </p>

            <p>
                The goal of the <span className="inline-emphasis">orx-v</span> is to make life of an algorithm developer better and hopefully
                keep evolving in this direction.
                Please feel free to open an <Link text="issue" href="https://github.com/orxfun/orx-v/issues/new" /> or create a PR if you notice
                an error, think something could be improved, or have a suggestion to extend the trait definitions with additional useful methods.
            </p>



            <br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br><br></br>
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
    ...
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
    ...
}
`;

const distanceApi = `struct Address { /* address fields */ }

fn distance_api(a: &Address, b: &Address) -> u32 {
    // call to the external api and return the distance from a to b
    ...
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

const dotProduct = `fn dot_product(a: &[u32], b: &[u32]) -> u32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
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
fn child(&self, i: D::ChildIdx) -> impl NVec<D::PrevDim, T>;

/// note that this is different than iter as it yields the
/// innermost scalars of the multi-dimensional vector.
fn all(&self) -> impl Iterator<Item = T>;

/// and this is a generalization of the "len" method:
/// * vec.card([]) -> returns the number of children
/// * vec.card([2]) -> returns the number of children of vec.child(2)
/// * vec.card([2, 1]) -> returns vec.child(2).child(1).card([])
/// * and so on.
fn card(&self, idx: impl Into<D::CardIdx>) -> usize;
`

const nvecMutTrait = `fn at_mut<Idx: IntoIdx<D>>(&mut self, idx: Idx) -> &mut T;

fn child_mut(&mut self, i: D::ChildIdx) -> impl NVecMut<D::PrevDim, T>;

fn mut_all<F: FnMut(&mut T)>(&mut self, f: F);
`

const twoOptAlgorithm = `fn apply_two_opt(tour: &mut impl V1Mut<usize>, i: usize, j: usize) {
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

fn two_opt(distances: impl V2<u32>, tour: &mut impl V1Mut<usize>) -> u32 {
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
                    apply_two_opt(tour, i, j);
                }
            }
        }
    }

    improvement
}
`;

const twoOptAlgorithmFixedTypes = `fn two_opt(distances: &Vec<Vec<u32>>, tour: &mut [i32]) -> u32 {
    ...
}
`;

const twoOptAlgorithmCalls = `let n = 100;
let mut tour: Vec<_> = initial_tour(n);

// complete matrix stored as a V2
{
    // Vec<Vec<u32>>
    let distances: Vec<Vec<u32>> = complete_distance_matrix_d2(n);

    let _improvement = two_opt(&distances, &mut tour);

    // ndarray::Array2
    let distances: Array2<u32> = complete_ndarray_d2(n);

    let _improvement = two_opt(&distances, &mut tour);
}

// complete matrix stored as a flattened V1
{
    // Vec<u32> as flattened matrix
    let distances: Vec<u32> = complete_distance_matrix_d1(n);

    let _improvement = two_opt(distances.as_jagged_with_uniform_lengths(n), &mut tour);

    // ndarray::Array1 as flattened matrix
    let distances: Array1<u32> = complete_ndarray_d1(n);

    let _improvement = two_opt(distances.as_jagged_with_uniform_lengths(n), &mut tour);
}

// sparse matrix
let finite_distances: HashMap<[usize; 2], u32> = finite_distances_map(n);
let distances = V.d2().sparse_from(finite_distances, 10000);
let _improvement = two_opt(&distances, &mut tour);

// functional matrix
let locations: Vec<Location> = get_locations(n);
let distances = V
    .d2()
    .fun(|[i, j]| euclidean_distance(&locations[i], &locations[j]));
let _improvement = two_opt(&distances, &mut tour);

// functional matrix: ignore from-to depot (node 0) links
let locations: Vec<Location> = get_locations(n);
let distances = V.d2().fun(|[i, j]| match (i, j) {
    (0, _) => 0,
    (_, 0) => 0,
    _ => euclidean_distance(&locations[i], &locations[j]),
});
let _improvement = two_opt(&distances, &mut tour);

// cached matrix
let locations: Vec<Location> = get_locations(n);
let distances = V
    .d2()
    .fun(|[i, j]| routing_engine(&locations[i], &locations[j]))
    .into_cached();
let _improvement = two_opt(&distances, &mut tour);

// uniform distances
let distances = V.d2().constant(10);
let _improvement = two_opt(&distances, &mut tour);
`;