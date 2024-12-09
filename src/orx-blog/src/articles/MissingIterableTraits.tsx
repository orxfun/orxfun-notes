import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/missing-iterable-traits-2024-12-13';
const title = 'Missing Iterable Traits';
const date = '2024-12-13';
const summary = 'and how to effortlessly introduce them'

export const PageMetaMissingIterableTraits = () => {
    const content = <Content />;
    const page = <Article content={content} />;
    return { path, title, date, summary, page };
}

const Indent = () => <span style={{ marginLeft: '2rem' }}>&nbsp;</span>

const Content = () => {
    return (
        <>
            <h1>{title}</h1>
            <span className="date">{date}</span>
            <span className="date">{summary}</span>

            <div className="side-note">
                (WIP warning) still work in progress but already includes the idea
            </div>

            <p>
                This article discusses iterable and collection traits that represent types that can be iterated over repeatedly,
                and how they are introduced almost effortlessly thanks to the powerful type system of rust.
            </p>

            <p>
                Definitions and implementations of the traits are published at <Link text="orx-iterable" href="https://crates.io/crates/orx-iterable" /> crate.
            </p>

            <section>
                <h2>Background</h2>

                <p>
                    In this section, we briefly discuss what we have in the core library, namely Iterator and IntoIterator.
                    Then, we discuss possible iterable or collection abstractions.
                </p>

                <h3>Iterator</h3>

                <p>
                    Luckily, we have the <code>Iterator</code> trait.
                </p>

                <p>
                    Iterators allow to sequentially traverse elements of a collection or elements that are created as a result of a computation.
                    They are very general, flexible and efficient.
                    Further, we often use and chain iterator-to-iterator transformations to conveniently compose computations over some data.
                </p>

                <div className="side-note">
                    Example iterator-to-iterator methods are <code>filter</code>, <code>map</code>,&nbsp;
                    <code>flat_map</code> or <code>filter_map</code>.
                </div>

                <p>
                    An iterator is lazy.
                    Defined computation is executed only once and only when one of the consuming methods is called.
                </p>

                <div className="side-note">
                    Example Iterator consuming methods are <code>collect</code>, <code>reduce</code>,&nbsp;
                    <code>fold</code> or <code>find</code>.
                </div>

                <p>
                    Iterators are included and widely used in many other languages.
                    Although they might have different names such as enumerators or streams,
                    they are everywhere and they are great (￣ー￣)ｂ
                </p>

                <h3>IntoIterator</h3>

                <p>
                    On the other hand, <code>IntoIterator</code> is pretty much a rust concept fitting nicely to its ownership model
                    (at least I haven't seen them elsewhere).
                    As the name suggests, its behavior resembles that of the <code>Into</code> trait; however, specialized for iterators.
                </p>

                <Code code={intoIterator} />

                <p>
                    It promises that the implementing type can be consumed and converted into an iterator yielding elements of type <code>Item</code>.
                </p>

                <p>
                    This is very interesting, very flexible and something that we will most certainly revisit.
                </p>

                <h3>Iterable & Collection Traits</h3>

                <p>
                    The missing piece is the iterable and / or collection traits; i.e.,
                    the common behavior of creating iterators repeatedly from collection types, and maybe from other source types too.
                </p>

                <p>
                    We are actually able to repeatedly iterate over collections by using <code>iter</code> and <code>iter_mut</code> methods.
                </p>

                <Code code={iterAndIterMut} />

                <p>
                    This is the pattern in the standard library collections.
                    Even if we start using a new collection from a new crate, we know that these methods will be there if they make sense for the collection.&nbsp;
                    <strong>However, this is nothing but a nice convention.</strong>&nbsp;
                    And this is a bit problematic.
                    Why?
                </p>

                <div className="seq">
                    <div>
                        We rely on standard library to continue sticking to this convention whenever a new collection is introduced.
                        Further, we rely on crates of specialized collections to follow this convention.
                        There exists no trait guaranteeing that these methods will exist with these names and signatures.
                    </div>
                    <div>
                        More importantly, we lack an important abstraction.
                        We are not able to implement a function that operates on any iterable or on any collection;
                        or we cannot have a type having a field with such a generic type.
                    </div>
                </div>

                <div className="side-note">
                    Actually majority of crates developed by community both follow the iter & iter_mut convention which is great (◑‿◐).
                </div>

            </section>

            <section>

                <h2>Goal</h2>

                <p>
                    Usefulness of iterable and collection traits is straightforward, and hence,
                    the goal is to introduce them.
                </p>

                <div className="emphasis">
                    <p>
                        Define <code>Collection</code> trait to represent collections which can repeatedly produce an iterator
                        over shared references of its elements (<code>iter</code>).
                    </p>
                    <p>
                        Define <code>CollectionMut: Collection</code> trait for collections which are additionally
                        capable of producing iterators over mutable references of its elements (<code>iter_mut</code>).
                    </p>
                    <p>
                        Define the most general <code>Iterable</code> trait which represents not necessarily collections but any type
                        that can repeatedly create an iterator of elements of an associated type (also <code>iter</code>).
                    </p>
                </div>

                <p>
                    Notice that the <code>Collection</code> and <code>CollectionMut</code> target collections that actually store
                    their data such as vectors or lists. <code>Iterable</code>, on the other hand, provides the more general
                    definition of the iterable behavior.
                </p>

                <p>
                    There are numerous iterables and collections in the standard library and in various crates.
                    Therefore, we want to introduce these traits in a particular way, which sets our final goal.
                </p>

                <div className="emphasis">
                    <p>
                        <code>Collection</code>, <code>CollectionMut</code> and <code>Iterable</code> traits must be implicitly
                        implemented for types that agree with their definitions.
                    </p>
                </div>

                <p>
                    Before discussing implementation details, the following examples demonstrate the use of
                    each of the abovementioned traits.
                </p>

                <h3>Example: Collection</h3>

                <p>
                    Consider a method which creates statistics from a collection of numbers.
                    In order to be able to compute the required values, it needs at least two iterations over the data.
                    In the following example, we use the Collection trait to define this requirement&nbsp;
                    <span style={{ color: 'gray', fontStyle: 'italic' }}>(please ignore the obvious div-by-zero error for empty collections ⊙︿⊙)</span>.
                </p>

                <Code code={exampleCollection} />

                <h3>Example: CollectionMut</h3>

                <p>
                    The <code>increment_by_sum</code> method below first computes the sum of all elements and then increments each element by this sum.
                    Therefore, we require both <code>iter</code> and <code>iter_mut</code> methods, which can be represented by the CollectionMut trait.
                </p>

                <Code code={exampleCollectionMut} />

                <h3>Example: Iterable</h3>

                <p>
                    In the following example, we relax the <code>Collection</code> requirement on numbers to more general <code>Iterable</code> requirement.
                    Notice that now we can also additionally cloneable iterators and lazy generators which do not store their elements, such as the range.
                </p>

                <Code code={exampleIterable} />

            </section>

            <section>
                <h2>Define & Implement <code>Collection</code> and <code>CollectionMut</code></h2>

                <p>
                    Definitions of the collection traits are straightforward.
                    They are basic and each have one required method: <code>iter</code> and <code>iter_mut</code>, respectively.
                </p>

                <Code code={collectionTraits} />

                <p>
                    Implementing these traits was not clear until I noticed the beauty of the <code>IntoIterator</code> trait.
                </p>

                <p>
                    To demonstrate, consider the standard vector <code>Vec&lt;T&gt;</code>.
                    As expected, it implements <code>IntoIterator&lt;Item = T&gt;</code>.
                    Once we call <code>x.into_iter()</code> where <code>x: Vec&lt;T&gt;</code>, the vector will be consumed,
                    its elements will be moved out and returned by the iterator.
                </p>
                <div className="seq">
                    <div>
                        However, there exists another implementation.&nbsp;
                        <code>&Vec&lt;T&gt;</code> implements <code>IntoIterator&lt;Item = &T&gt;</code>.
                        What does this mean?
                        This means that once we call <code>(&x).into_iter()</code>, we will receive an iterator which yields references to
                        elements of the vector.
                        It will consume the reference, not the vector.
                        This is nothing but the definition of <code>iter(&self)</code> <span className="tick"></span>
                    </div>

                    <div>
                        Further, we find out that <code>&mut Vec&lt;T&gt;</code> implements <code>IntoIterator&lt;Item = &mut T&gt;</code>.
                        Similarly, this is equivalent to <code>iter_mut(&mut self)</code> <span className="tick"></span>
                    </div>
                </div>

                <p>
                    This design pattern introduced by the standard library is wonderful,
                    nicely dividing the IntoIterator behavior for collections into three implementations.
                </p>

                <p>
                    We have everything we need for implementing both collection traits
                    <br /><Indent />
                    for all collections
                    <br /><Indent />
                    in less than 30 lines of code ❤️🦀
                </p>

                <Code code={collectionTraitsImplementation} />

                <div className="side-note">
                    Maps do not follow the definition above as their iterators behave slightly differently, and hence, they deserve their own trait.
                </div>

            </section>

            <section>
                <h2>Define & Implement <code>Iterable</code></h2>

                <p>
                    Collection traits are great but they do not represent all iterables.
                    By definition, they are bound to yield shared or mutable references to their elements.
                    Consider iterators that produce their elements on the fly during iteration.
                    They cannot return a reference to temporarily computed values.
                    Further notice that mutation is irrelevant for such iterators.
                    Therefore, we require a more general definition for immutable iterables.
                </p>

                <p>
                    We provide the iterable definition as general as possible.
                </p>

                <Code code={iterableTrait} />

                <p>
                    We want this trait to implicitly cover collections, as well as, cloneable iterators.
                </p>

                <p>
                    Furthermore, unlike the collection traits, it must be extensible.
                    In other words, we must be able to implement iterable on any custom non-collection type, whenever it makes sense.
                </p>

                <h3>Collections as Iterables</h3>

                <p>
                    Using our previous observation, we can easily implement iterable for references (!) of all collections.
                </p>

                <Code code={iterableImplForCollections} />

                <p>
                    This implementation also establishes the useful relationship between the <code>Iterable</code> and <code>Collection</code> traits:
                </p>

                <p>
                    <Indent />
                    If a type <code>X</code> implements <code>Collection</code>, then <code>&X</code> implements <code>Iterable</code>.
                    Therefore, we can always provide a reference of a Collection to a function expecting an Iterable.
                </p>

                <h3>Cloneable Iterators</h3>

                <p>
                    An iterator is not limited to visiting elements of a collection.
                    Thanks to chainable methods transforming one iterator to another, such as <code>filter</code> or <code>map</code>,
                    iterators are capable of carrying definition of a computation over some data.
                </p>

                <p>
                    The trouble is, an iterator can be used only once.
                </p>

                <p>
                    Some languages allow resetting and reusing an iterator.
                    However, the iterators are stateful and we are better off if we consume them at once.
                    Resetting an iterator actually sounds like a very dangerous idea <span className="fail"></span>
                </p>

                <p>
                    But what if we could move it into a wrapper struct, and return a clone of it every time <code>iter</code> is called.
                    Then, we can actually turn any cloneable iterator into an iterable.
                    Simply by calling <code>into_iterable</code>.
                </p>

                <p>
                    As you may see below, we can achieve this for all cloneable iterators at once.
                </p>

                <Code code={iterableImplForCloneableIterators} />

            </section>

            <section>
                <h2>Transformations among Iterables and Collections</h2>

                <p>
                    As mentioned before, iterator-to-iterator transformations are extremely useful.
                    Standard library provides a rich set of functions that we frequently reach in all kinds of applications.
                    Iterable and collection traits follow the same design pattern to provide these transformations among
                    themselves.
                    The following example demonstrates a chain of transformations of iterables.
                </p>

                <Code code={iterableTransformations} />

            </section>

            <section>
                <h2>Conclusion</h2>

                <p>
                    Goals of implementing <code>Collection</code> and <code>CollectionMut</code> traits have been achieved.
                    And all it took was 30 lines to implement them.
                    Rust's type system keeps amazing us ❤️🦀.
                </p>

                <p>
                    Similarly, implementing <code>Iterable</code> trait for collections and cloneable iterators was
                    as brief and as convenient.
                </p>

                <div className="side-note">
                    Collection traits would not be possible before generic associated types (GAT).
                    Iterable trait, on the other hand, would have been possible.
                </div>

                <p>
                    Lastly, it was a very happy moment to see that the traits are automatically implemented by <code>SmallVec</code>,
                    which was the first out-of-std collection I tried.
                    This is probably the nicest result; these traits are and will be implicitly implemented for custom or specialized
                    collections as long as we do not have missing <code>IntoIterator</code> implementations.
                </p>

            </section>

            <div className="end-space"></div>
        </>
    );
}



const intoIterator = `pub trait IntoIterator {
    type Item;
    type IntoIter: Iterator<Item = Self::Item>;

    fn into_iter(self) -> Self::IntoIter;
}
`;

const iterAndIterMut = `fn iter(&self) -> SomeIteratorOverSharedReferences { ... }

fn iter_mut(&mut self) -> SomeIteratorOverMutableReferences { ... }
`;

const exampleCollection = `use orx_iterable::*;
use arrayvec::ArrayVec;
use smallvec::{smallvec, SmallVec};
use std::collections::{BinaryHeap, BTreeSet, HashSet, LinkedList, VecDeque};

struct Stats {
    count: usize,
    mean: i64,
    std_dev: i64,
}

/// we need multiple iterations over numbers to compute the stats
fn statistics(numbers: &impl Collection<Item = i64>) -> Stats {
    let count = numbers.iter().count() as i64;
    let sum = numbers.iter().sum::<i64>();
    let mean = sum / count;
    let sum_sq_errors: i64 = numbers.iter().map(|x| (x - mean) * (x - mean)).sum();
    let std_dev = f64::sqrt(sum_sq_errors as f64 / (count - 1) as f64) as i64;
    Stats {
        count: count as usize,
        mean,
        std_dev,
    }
}

// example collections that automatically implement Collection

statistics(&[3, 5, 7]);
statistics(&vec![3, 5, 7]);
statistics(&LinkedList::from_iter([3, 5, 7]));
statistics(&VecDeque::from_iter([3, 5, 7]));
statistics(&HashSet::<_>::from_iter([3, 5, 7]));
statistics(&BTreeSet::<_>::from_iter([3, 5, 7]));
statistics(&BinaryHeap::<_>::from_iter([3, 5, 7]));

let x: SmallVec<[_; 128]> = smallvec![3, 5, 7];
statistics(&x);

let mut x = ArrayVec::<_, 16>::new();
x.extend([3, 5, 7]);
statistics(&x);
`;

const exampleCollectionMut = `use orx_iterable::*;
use arrayvec::ArrayVec;
use smallvec::{smallvec, SmallVec};
use std::collections::{LinkedList, VecDeque};

/// first computes sum, and then adds it to each of the elements
fn increment_by_sum(numbers: &mut impl CollectionMut<Item = i32>) {
    let sum: i32 = numbers.iter().sum();

    for x in numbers.iter_mut() {
        *x += sum;
    }
}

// example collections that automatically implement CollectionMut

let mut x = [1, 2, 3];
increment_by_sum(&mut x);
assert_eq!(x, [7, 8, 9]);

let mut x = vec![1, 2, 3];
increment_by_sum(&mut x);

let mut x = LinkedList::from_iter([1, 2, 3]);
increment_by_sum(&mut x);

let mut x = VecDeque::from_iter([1, 2, 3]);
increment_by_sum(&mut x);

let mut x: SmallVec<[_; 128]> = smallvec![3, 5, 7];
increment_by_sum(&mut x);

let mut x = ArrayVec::<_, 16>::new();
x.extend([3, 5, 7]);
increment_by_sum(&mut x);
`;

const exampleIterable = `use orx_iterable::*;
use arrayvec::ArrayVec;
use smallvec::{smallvec, SmallVec};
use std::collections::{BTreeSet, BinaryHeap, HashSet, LinkedList, VecDeque};

/// we need multiple iterations over numbers to compute the stats
fn statistics(numbers: impl Iterable<Item = i64>) -> Stats {
    /* implementation is identical to Collection example */
}

// (i) collections as Iterable

// x is an Iterable yielding &i64;
// => x.copied() is an Iterable yielding i64
let x = [3, 5, 7];
statistics(x.copied());

let x = vec![3, 5, 7];
statistics(x.copied());

let x = LinkedList::from_iter([3, 5, 7]);
statistics(x.copied());

let x = VecDeque::from_iter([3, 5, 7]);
statistics(x.copied());

let x = HashSet::<_>::from_iter([3, 5, 7]);
statistics(x.copied());

let x = BTreeSet::from_iter([3, 5, 7]);
statistics(x.copied());

let x = BinaryHeap::from_iter([3, 5, 7]);
statistics(x.copied());

let x: SmallVec<[_; 128]> = smallvec![3, 5, 7];
statistics(x.copied());

let mut x = ArrayVec::<_, 16>::new();
x.extend([3, 5, 7]);
statistics(x.copied());

// (ii) cloneable iterators as Iterable

let x = (0..10).map(|x| x * 2).into_iterable();
statistics(x);

let x = vec![1, 2, 3];
let y = x
    .iter()
    .copied()
    .filter(|x| x % 2 == 1)
    .flat_map(|x| [-x, x])
    .into_iterable();
statistics(y);

// (iii) lazy generators as Iterable

statistics(7..21i64);

// FibUntil(10) is a custom Iterable that creates an iterator
// of Fib numbers up to 10, you may see the implementation at
// https://docs.rs/orx-iterable/latest/orx_iterable/#b3-lazy-generators
statistics(FibUntil(10));
`;

const collectionTraits = `trait Collection {
    type Item;

    type Iter<'i>: Iterator<Item = &'i Self::Item>
    where
        Self: 'i;

    fn iter(&self) -> Self::Iter<'_>;
}
    
trait CollectionMut: Collection {
    type IterMut<'i>: Iterator<Item = &'i mut Self::Item>
    where
        Self: 'i;

    fn iter_mut(&mut self) -> Self::IterMut<'_>;
}`;

const collectionTraitsImplementation = `impl<X> Collection for X
where
    X: IntoIterator,
    for<'a> &'a X: IntoIterator<Item = &'a <X as IntoIterator>::Item>,
{
    type Item = <X as IntoIterator>::Item;

    type Iter<'i> = <&'i X as IntoIterator>::IntoIter
    where
        Self: 'i;

    fn iter(&self) -> Self::Iter<'_> {
        <&X as IntoIterator>::into_iter(self)
    }
}
    
impl<X> CollectionMut for X
where
    X: IntoIterator,
    for<'a> &'a X: IntoIterator<Item = &'a <X as IntoIterator>::Item>,
    for<'a> &'a mut X: IntoIterator<Item = &'a mut <X as IntoIterator>::Item>,
{
    type IterMut<'i> = <&'i mut X as IntoIterator>::IntoIter
    where
        Self: 'i;

    fn iter_mut(&mut self) -> Self::IterMut<'_> {
        <&mut X as IntoIterator>::into_iter(self)
    }
}
`;

const iterableTrait = `trait Iterable {
    type Item;

    type Iter: Iterator<Item = Self::Item>;

    fn iter(&self) -> Self::Iter;
}`;


const iterableImplForCollections = `impl<'a, X> Iterable for &'a X
where
    &'a X: IntoIterator,
{
    type Item = <&'a X as IntoIterator>::Item;

    type Iter = <&'a X as IntoIterator>::IntoIter;

    fn iter(&self) -> Self::Iter {
        self.into_iter()
    }
}`;

const iterableImplForCloneableIterators = `struct CloningIterable<I>(I)
where
    I: Iterator + Clone;

impl<I> Iterable for CloningIterable<I>
where
    I: Iterator + Clone,
{
    type Item = I::Item;

    type Iter = I;

    fn iter(&self) -> Self::Iter {
        self.0.clone()
    }
}

trait IntoCloningIterable: Iterator + Clone {
    fn into_iterable(self) -> CloningIterable<Self> {
        CloningIterable(self)
    }
}

impl<I> IntoCloningIterable for I where I: Iterator + Clone {}
`;

const iterableTransformations = `use orx_iterable::*;
use std::collections::HashSet;

let a = vec![3, 7, 1];
let b = HashSet::<_>::from_iter([8]);
let c = [true, false, false, true];

let it = a
    .chained(&b)                // [&3, &7, &1, &8]
    .zipped(&c)                 // [(&3, &t), (&7, &f), (&1, &f), (&8, &t)]
    .filtered(|(_, b)| **b)     // [(&3, &t), (&8, &t)]
    .mapped(|(a, _)| a)         // [&3, &8]
    .copied()                   // [3, 8]
    .flat_mapped(|x| [x, -x]);  // [3, -3, 8, -8]

// now we have a transformed Iterable that we can repeatedly iter() over
assert_eq!(it.iter().count(), 4);
assert_eq!(it.iter().sum::<i32>(), 0);
`;