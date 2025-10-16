import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/zero-cost-composition-2025-10-15';
const title = 'Zero Cost Composition';
const date = '2025-10-15';
const summary = 'zero cost composition and the power of GATs'

export const PageMetaZeroCostComposition = () => {
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
                The goal of the approach discussed in this article is to enable zero-cost composition of heterogeneous types sharing a common behavior.
            </p>

            <p>
                This might sound confusing ｢(ﾟﾍﾟ)
            </p>

            <p>
                Let's consider the classical polymorphism problem where
            </p>

            <div className="emphasis">
                we want to implement a screen that can draw all elements of a heterogeneous collection of components that can be drawn.
            </div>

            <p>
                Two well-known solutions are the trait object & enum solutions, which are quite different.
            </p>

            <p>
                This article proposes a third approach, which is even more different :)
            </p>

            <p>
                Finally, generic associated types (GATs) are relatively recent additions to rust.
                Most of the time, usage of GATs are considered together with lifetimes as it solves important lifetime-related issues.
                However, its usage is not limited to lifetimes.&nbsp;
                <span className="inline-emphasis">GATs are like functions of the type system</span>.
                The approaches described in this article demonstrates an example of the power of GATs.
            </p>

            <p>
                Discussed approach is published in the <code>queue</code> module of the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate.
            </p>

            <h2>Another Way to Draw Components on the Screen</h2>

            <p>
                The classical problem about polymorphism, which is also used in rust book's&nbsp;
                <Link text="trait objects chapter" href="https://doc.rust-lang.org/book/ch18-02-trait-objects.html" />, is as follows:
            </p>

            <div className="seq">
                <div>We have a <code>Draw</code> trait and various components, such as button and select box, implement this trait.</div>
                <div>The <code>Screen</code> is a collection of components that we can draw.</div>
                <div>Three methods are required for the screen.</div>
                <div>
                    Since screen is sort of a collection, we need <code>new</code> to
                    create an empty screen and <code>push</code> to add a component to it.
                </div>
                <div>The third method <code>draw</code> is related to the common behavior and draws all components on the screen.</div>
            </div>

            <p>We first set up the draw trait and a couple of implementations for the example.</p>

            <Code code={drawTrait} />

            <h2>Approach #1: Trait Objects</h2>

            <p>
                Using trait objects can be considered as the standard way to solve this problem.
                It is pretty much identical to solutions in object-oriented languages such as Java or C#.
            </p>

            <Code code={solutionTraitObjects} />

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div>
                    <p style={{ color: 'lime', fontWeight: 'bold', textAlign: 'center' }}>PROS</p>
                    <div className="seq">
                        <div>
                            It is open for extension. Another codebase can define a new component, implement <code>Draw</code> for it and add it to the screen.
                        </div>
                        <div>
                            No boilerplate code is required.
                            We only iterate over elements of the vec and call draw on each item.
                        </div>
                        <div>
                            <code>Screen</code> is nothing but a wrapper for <code>Vec</code>.
                            No additional types are required.
                        </div>
                    </div>
                </div>
                <div>
                    <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>CONS</p>
                    <div className="seq">
                        <div>Requires heap allocation for components in <code>Box</code>.</div>
                        <div><code>draw</code> calls of components are virtual; hence, requires dynamic dispatch.</div>
                    </div>
                </div>
            </div>

            <p>
                When the cons are not critical, we usually prefer this approach due to its simplicity and convenience.
                Otherwise, we consider the following approach.
            </p>

            <h2>Approach #2: Enums</h2>

            <p>
                Another elegant way to represent polymorphic behavior in rust is to use sum types or enums.
                Enum solution for this example could look like the following.
            </p>

            <Code code={solutionEnums} />

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div>
                    <p style={{ color: 'lime', fontWeight: 'bold', textAlign: 'center' }}>PROS</p>
                    <div className="seq">
                        <div>
                            No heap allocation required.
                            We might waste some memory when sizes of component variants vary significantly.
                            Nevertheless, this is preferable over boxing in most cases.
                        </div>
                        <div>
                            No virtual method calls.
                            All of the <code>component.draw()</code> calls are direct method calls.
                            There still exists runtime branching cost due to potentially large <code>match</code> clause.
                            This is still preferable over dynamic dispatch in most cases.
                        </div>
                        <div>
                            <code>Screen</code> is nothing but a wrapper for <code>Vec</code>.
                            No additional types are required.
                        </div>
                    </div>
                </div>
                <div>
                    <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>CONS</p>
                    <div className="seq">
                        <div>
                            It is closed for extension.
                            Defining a new component and implementing <code>Draw</code> for it is not sufficient.
                            The variant must also be added to the <code>Component</code> enum.
                            This is a breaking change ‼️
                            Therefore, this approach is most practical when only we extend and we don't extend often.
                        </div>
                        <div>
                            Some boilerplate involved in <code>Component::draw</code> implementation.
                            The <code>match</code> statement gets longer and longer as we define more variants.
                            However, crates such as <Link text="enum_dispatch" href="https://crates.io/crates/enum_dispatch" /> let us overcome this issue 🚀
                        </div>
                    </div>
                </div>
            </div>

            <p>
                Notice that this implementation has significantly different properties.
            </p>

            <h2>Approach #3: Zero Cost Compositions</h2>

            <p>
                How about a completely different third approach?
            </p>

            <p>
                We will first see the solution in the following code block.
                Due to use of the <Link text="define_queue" href="https://docs.rs/orx-meta/latest/orx_meta/macro.define_queue.html" /> macro,
                it will not be clear at first.
                Then, we will dive into details which will demonstrate the power of <strong>generic associated types (GAT)</strong>.
                We will also discuss what we cannot represent the composition within the type system and why we need the macro.
            </p>

            <p>
                But for now, knowing the following would be sufficient:
            </p>

            <ul>
                <li><code>StScreen</code> is a trait representing statically typed queue of heterogeneous components 「(°ヘ°)</li>
                <li><code>EmptyScreen</code> and non-empty <code>Screen</code> structs are the two implementations, they are self-explanatory.</li>
                <li>The screen, or queue of components, can only have elements that implement <code>Draw</code>.</li>
            </ul>

            <p>
                Lastly, in addition to elements of the queue, or the components on the screen,&nbsp;
                <span className="inline-emphasis">we require both empty and non-empty screen to implement Draw</span>.
                This is the key idea behind zero-cost compositions.
            </p>

            <Code code={solutionComposition} />

            <p>
                Looks ergonomic, similar to the previous solutions.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div>
                    <p style={{ color: 'lime', fontWeight: 'bold', textAlign: 'center', }}>PROS</p>
                    <div className="seq">
                        <div>
                            It is open for extension. Another codebase can define a new component, implement <code>Draw</code> for it and add it to the screen.
                        </div>
                        <div>
                            No heap allocation required for the components.
                            Further, there is not even an allocation for a <code>Vec</code>.
                        </div>
                        <div>
                            No virtual method calls, all <code>draw</code> calls are statically dispatched.
                            Further, there is no run-time branching.&nbsp;
                            <code>screen.draw()</code> call can completely be inlined by the compiler
                            as <code>btn1.draw(); btn2.draw(); sbox.draw(); btn3.draw();</code>.
                        </div>
                    </div>
                </div>
                <div>
                    <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', }}>CONS</p>
                    <div className="seq">
                        <div>
                            <code>Screen</code> is a new type specific to the <code>Draw</code> trait, it has two generic parameters and it is more complex than
                            the <code>Vec</code> wrappers used in the previous approaches.
                        </div>
                    </div>
                </div>
            </div>

            <p>
                The con is clear and one of the objectives of the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate
                is to overcome this as conveniently as possible.
            </p>
            <p>
                The pros, on the other hand, might sound confusing.
                In order to clarify consider the following implementation which is hand-written specifically for a screen with three buttons
                and one select-box.
                It is easy to notice that this solution has the above-mentioned advantages.
                Under the hood, this is identical to the screen implementation as a statically typed queue.
            </p>

            <Code code={solutionCompositionHandWritten} />




            <h2>Expansion and the Power of GATs</h2>

            <p>
                You might have figured out that every time we push a component to the screen, we obtain a new concrete screen type.
            </p>

            <p>
                This screen type is statically-typed in its components.
                Just like an ad-hoc struct.
            </p>

            <p>But how does this work?</p>

            <p>Thanks to the rust-type system and power of GATs 💪</p>

            <p>
                To understand better,
                let's check the expansion of the <Link text="define_queue" href="https://docs.rs/orx-meta/latest/orx_meta/macro.define_queue.html" /> macro.
            </p>

            <Code code={solutionCompositionExpansion} />

            <div className="emphasis">
                Note the resemblance of <code>push</code> method and <code>PushBack</code> type,&nbsp;
                <span className="inline-emphasis">GATs are like functions of the type system</span>.
            </div>


            <h3>Statically-typed Screen Trait</h3>

            <p>
                The <code>StScreen</code> trait defines a queue with statically-typed elements and a constant <code>LEN</code>.
            </p>

            <p>Although this is not critical here, it is useful to clarify that this a queue due to the following:</p>
            <ul>
                <li>It <code>push</code>es to the back of the queue.</li>
                <li><code>Front</code> of the queue is an element that can be popped (not discussed here, but in the crate documentation).</li>
                <li><code>Back</code> is the queue containing elements except for the front element; i.e., resulting queue if the front element is popped.</li>
            </ul>

            <p>
                Notice the GAT: <code>type PushBack&lt;T&gt;: StScreen where T: Draw;</code> which handles a couple of critical tasks:
            </p>
            <ul>
                <li>It restricts that we can only push types that implement <code>Draw</code>.</li>
                <li>
                    It makes sure that the queue obtained by pushing a component to it also implements <code>StScreen</code>.
                    This means that we can keep calling <code>push</code> since we always get another <code>StScreen</code>.
                </li>
            </ul>

            <p>
                Then, we have two concrete implementations: empty and non-empty screen.
            </p>

            <h3>Empty Screen</h3>

            <p>
                This can be considered as the <code>Nil</code> of our queue.
                There is nothing special about its <code>StScreen</code> implementation as well.
            </p>

            <p>
                The only important detail is that, when we push component <code>T</code> to it,
                we receive <code>Screen&lt;T, EmptyScreen&gt;</code>.
                This is a screen with one component <code>T</code>.
            </p>

            <h3>Non-empty Screen</h3>

            <p>
                The <code>Screen</code> is a queue that is guaranteed to have at least one element that is the <code>Front</code>.
                The back might be an <code>EmptyScreen</code> or another non-empty <code>Screen</code>.
                Therefore, this struct can represent non-empty screens with any number of components.
            </p>

            <p>
                Note the implementation of the <code>PushBack</code> GAT.
            </p>

            <Code code={screenPushBack} />

            <div className="seq">
                <div>Since this is a queue, we want to keep the front <code>F</code> in the front of the new queue as well.</div>
                <div>
                    Since the back <code>B</code> is also a <code>StScreen</code>, we can call <code>B::PushBack&lt;T&gt;</code> to determine
                    type of back of the new queue.
                </div>
            </div>

            <p>
                To make it more concrete, consider the following table summarizing concrete types of screens given the types of its components.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>LEN</th>
                        <th>Types of Components (Elements)</th>
                        <th>Type of the Screen (Queue)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>0</td>
                        <td></td>
                        <td><code>EmptyScreen</code></td>
                    </tr>
                    <tr>
                        <td>1</td>
                        <td><code>C1</code></td>
                        <td><code>Screen&lt;C1, EmptyScreen&gt;</code></td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td><code>C1, C2</code></td>
                        <td><code>Screen&lt;C1, Screen&lt;C2, EmptyScreen&gt;&gt;</code></td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td><code>C1, C2, C3</code></td>
                        <td><code>Screen&lt;C1, Screen&lt;C2, Screen&lt;C3, EmptyScreen&gt;&gt;&gt;</code></td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td><code>C1, C2, C3, C4</code></td>
                        <td><code>Screen&lt;C1, Screen&lt;C2, Screen&lt;C3, Screen&lt;C4, EmptyScreen&gt;&gt;&gt;&gt;</code></td>
                    </tr>
                </tbody>
            </table>

            <p>
                This is all we needed!
            </p>

            <p>
                All these concrete types are available to us through one trait and two implementations.
                We can incrementally build one type from another very ergonomically which almost feels like working with dynamic types.
                This is only possible thanks to the power of GATs.
            </p>




            <h2>Side Quest, a Generic Builder for Any Struct</h2>

            <p>
                Consider what would happen if we removed the <code>Draw</code> requirement in the expansion above.
                We would end up with a statically-typed queue of anything.
                This is an ad-hoc struct.
            </p>

            <p>
                We already have tuples for this.
            </p>

            <p>
                The queue that we can incrementally build has other advantages though.
                For instance, we can use the type system to create a type-safe
                generic <Link text="QueueBuilder" href="https://docs.rs/orx-meta/latest/orx_meta/queue/struct.QueueBuilder.html" /> that can be used
                for any struct.
            </p>

            <Code code={genericQueueBuilder} />

            <p>
                This was not the main goal but if you are interested, you may find the details&nbsp;
                <Link text="here" href="https://github.com/orxfun/orx-meta/blob/main/docs/2_generic_builder.md" />.
            </p>






            <h2>The Idea of Composition</h2>

            <p>
                After the side quest, we bring back the <code>Draw</code> requirement which is central to the composition idea.
            </p>

            <p>
                It represents the common behavior of elements of the queue.
                We only allow to push elements implementing this trait.
            </p>

            <p>
                Furthermore, we require empty and non-empty queues to implement the common behavior.
                This is how we achieve zero-cost composition.
            </p>

            <h3>Draw for empty Queue, Identity</h3>

            <p>
                Implementing the common behavior for the empty queue describes what we should do in the absence
                of any elements.
                This was straightforward for the screen example, we do nothing when there is nothing to draw.
            </p>


            <h3>Draw for non-empty Queue, Composition</h3>

            <p>
                Implementing the common behavior for the non-empty queue describes what we should do when there are multiple
                elements.
            </p>

            <p>
                This might be a bit confusing when the front of the queue is an element but the back of the queue is another queue
                containing the remaining elements.
            </p>

            <p>
                To make it easier, let's assume the back is a queue of a single element.
                In other words, our queue has two elements.
                What should <code>draw</code> do in this case?
                We should probably draw both of them.
            </p>

            <p>
                Recall our implementation.
            </p>

            <Code code={screenImplDraw} />

            <p>
                In a two-element queue, the back would be another non-empty queue with a single element.
                Omitting the <code>self.</code> prefixes, we can inline the <code>b.draw()</code> with <code>b.f.draw(); b.b.draw();</code>.
                Then, the entire call on two-element queue would be equivalent to <code>f.draw(); b.f.draw(); b.b.draw();</code>.
                So this call would draw both components, as we intended.
            </p>

            <p>
                What if we had three elements instead?
                We could first inline the call as <code>f.draw(); b.f.draw(); b.b.draw();</code>.
                Here, <code>b.b</code> is another queue with a single element.
                We can inline once more to obtain <code>f.draw(); b.f.draw(); b.b.f.draw(); b.b.b.draw();</code>.
                This would draw the three components, again as intended.
            </p>

            <p>
                So once we define what to do with an empty queue and how to compose two elements,
                we attain the expected behavior for any number of elements in the queue.
            </p>

            <h3>Another Example for Composition</h3>

            <p>
                We can define different ways to compose elements sharing a common behavior depending on our use case.
                In the <code>Draw</code> example, we simply draw all components one after the other.
            </p>

            <p>
                To understand the flexibility of the approach, we need a second example.
                Assume that we want a queue of whole numbers with different concrete types.
                Our shared behavior is <code>Sum</code>.
            </p>

            <Code code={exampleSum} />

            <p>
                Various types of numbers that can be turned into <code>i64</code> can implement <code>Sum</code>,
                since sum of a single number is itself.
            </p>

            <p>
                Next, we implement <code>Sum</code> for the <code>EmptyQueue</code>.
                This defines identity as <code>0</code>.
            </p>

            <p>
                Lastly, we implement <code>Sum</code> for a non-empty <code>Queue</code> as addition of its front and back.
                This defines composition as the <code>+</code>.
            </p>

            <p>
                Although the usage has a dynamic look and feel, and although the <code>sum</code> implementation of the queue
                seems recursive; everything is statically dispatched without any recursion.
                The compiler can actually inline the <code>queue.sum()</code> call as <code>1 + 2 + ... + 7 + 0</code>.
            </p>








            <h2>Why do we need the macro?</h2>

            <p>
                <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate provides the <code>StQueue</code> trait together with&nbsp;
                <code>EmptyQueue</code> and <code>Queue</code> implementations, naturally without the requirement on elements to be <code>Draw</code>.
            </p>

            <p>
                As explained in the side quest, this can still be useful.
            </p>

            <p>
                But the queue is most useful when it is coupled with a shared behavior of heterogeneous types.
            </p>

            <p>
                Therefore, what we actually need is the following.
            </p>

            <Code code={wontCompile} />

            <p>
                Notice that if we substitute <code>X</code> with <code>Draw</code> we obtain our <code>StScreen</code> trait.
            </p>

            <p>
                So here, <code>X</code> is a trait.
                We need our <code>StQueue</code> trait to be generic over another trait.
            </p>

            <p>
                This won't compile today (⌣_⌣”)
            </p>

            <p>
                Please let <Link text="me" href="mailto:orx.ugur.arikan@gmail.com" /> know if you can represent this 😊
            </p>

            <p>
                So what do we do when we cannot represent our solution within the type system where the fix seems to be as simple
                as a string substitution?
                Macros to the rescue ＼（＾▽＾）／
            </p>

            <Code code={macro} />

            <p>
                The macro call above has two blocks.
            </p>

            <p>
                The <code>queue</code> block is just for naming (i) the statically-typed queue trait, (ii) empty queue struct
                and (iii) non-empty queue struct.
            </p>

            <p>
                The <code>elements</code> block is the important part.
                Here, we provide a comma-separated list of traits that define the common behavior of heterogeneous elements of the queue.
            </p>

            <p>
                Then, all the macro expansion does is to define the queue types exactly as they are defined in the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate
                with only one difference.
                It adds the <code>Draw</code> requirement to elements of the queues and to the queues themselves.
            </p>




            <h2>Summary</h2>

            <p>
                This pattern is very powerful for composing zero-cost abstractions.
            </p>

            <p>
                Especially for performance critical programs, it allows us to avoid dynamic dispatch, heap allocation and run-time branching.
            </p>

            <p>
                Although this approach involves more complex types with generic parameters,
                the complexity is kept limited with one trait and two structs.
            </p>

            <p>
                Furthermore, using the queue is comparably convenient.
                Thanks to GATs, usage feels very dynamic, while the queue is strongly typed.
            </p>

            <p>
                The idea was originated while trying to compose business constraints of route optimization without any performance penalty.
                You may find a <Link text="talk" href="https://orxfun.github.io/talk-composing-zero-cost-abstractions-in-route-optimization/" /> that
                discusses the critical importance of zero cost composition in achieving an extensible and maintainable solution.
            </p>

            <p>
                Further, similar ideas are used in the generic <Link text="orx-local-search" href="https://crates.io/crates/orx-local-search" /> crate
                which aims to establish a local search framework that allows flexible constraint and objective definitions without loss of performance.
            </p>


            <div className="end-space"></div>
        </>
    );
}

const drawTrait = `pub trait Draw {
    fn draw(&self);
}

#[derive(Debug)]
struct Button {
    width: u32,
    height: u32,
    label: String,
}

impl Button {
    fn new(width: u32, height: u32, label: String) -> Self {
        Self { width, height, label }
    }
}

impl Draw for Button {
    fn draw(&self) {
        println!("{self:?}");
    }
}

#[derive(Debug)]
struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl SelectBox {
    fn new(width: u32, height: u32, options: Vec<String>) -> Self {
        Self { width, height, options }
    }
}

impl Draw for SelectBox {
    fn draw(&self) {
        println!("{self:?}");
    }
}`;

const solutionTraitObjects = `struct Screen {
    components: Vec<Box<dyn Draw>>,
}

impl Screen {
    fn new() -> Self {
        Self { components: vec![] }
    }

    fn push(&mut self, component: Box<dyn Draw>) {
        self.components.push(component);
    }

    fn draw(&self) {
        for component in &self.components {
            component.draw();
        }
    }
}

let mut screen = Screen::new();
screen.push(Box::new(Button::new(3, 4, "home".to_string())));
screen.push(Box::new(Button::new(5, 4, "about".to_string())));
screen.push(Box::new(SelectBox::new(5, 4, vec!["one".to_string()])));
screen.push(Box::new(Button::new(6, 6, "login".to_string())));
screen.draw();

// prints out:
//
// Button { width: 3, height: 4, label: "home" }
// Button { width: 5, height: 4, label: "about" }
// SelectBox { width: 5, height: 4, options: ["one] }
// Button { width: 6, height: 6, label: "login" }`;

const solutionEnums = `enum Component {
    Button(Button),
    SelectBox(SelectBox),
}

impl Draw for Component {
    fn draw(&self) {
        match self {
            Self::Button(x) => x.draw(),
            Self::SelectBox(x) => x.draw(),
        }
    }
}

struct Screen {
    components: Vec<Component>,
}

impl Screen {
    fn new() -> Self {
        Self { components: vec![] }
    }

    fn push(&mut self, component: Component) {
        self.components.push(component);
    }

    fn draw(&self) {
        for component in &self.components {
            component.draw();
        }
    }
}

let mut screen = Screen::new();
screen.push(Component::Button(Button::new(3, 4, "home".to_string())));
screen.push(Component::Button(Button::new(5, 4, "about".to_string())));
screen.push(Component::SelectBox(SelectBox::new(5, 4, vec!["one".to_string()])));
screen.push(Component::Button(Button::new(6, 6, "login".to_string())));
screen.draw();`;

const solutionComposition = `orx_meta::define_queue!(
    elements => [ Draw ];
    queue => [ StScreen; EmptyScreen, Screen ];
);

impl Draw for EmptyScreen {
    // identity: do nothing
    fn draw(&self) {}
}

impl<F: Draw, B: StScreen> Draw for Screen<F, B> {
    // composition: draw them both
    fn draw(&self) {
        self.f.draw();
        self.b.draw();
    }
}

let screen = EmptyScreen::new()
    .push(Button::new(3, 4, "home".to_string()))
    .push(Button::new(5, 4, "about".to_string()))
    .push(SelectBox::new(5, 4, vec!["one".to_string()]))
    .push(Button::new(6, 6, "login".to_string()));
screen.draw();`;

const solutionCompositionHandWritten = `struct Screen { // no heap allocation
    btn1: Button,
    btn2: Button,
    sbox: SelectBox,
    btn3: Button,
}

impl Screen {
    fn draw(&self) { // no virtual calls & no branching
        self.btn1.draw();
        self.btn2.draw();
        self.sbox.draw();
        self.btn3.draw();
    }
}

let screen = Screen {
    btn1: Button::new(3, 4, "home".to_string()),
    btn2: Button::new(5, 4, "about".to_string()),
    sbox: SelectBox::new(5, 4, vec!["one".to_string()]),
    btn3: Button::new(6, 6, "login".to_string()),
};
screen.draw();`;

const solutionCompositionExpansion = `trait StScreen: Draw {
    type PushBack<T>: StScreen
    where
        T: Draw;

    type Front;

    type Back: StScreen;

    const LEN: usize;

    fn len(&self) -> usize {
        Self::LEN
    }

    fn push<T>(self, element: T) -> Self::PushBack<T>
    where
        T: Draw;
}

struct EmptyScreen;

impl StScreen for EmptyScreen {
    type PushBack<T>
        = Screen<T, EmptyScreen>
    where
        T: Draw;

    type Front = Self;

    type Back = Self;

    const LEN: usize = 0;

    fn push<T>(self, element: T) -> Self::PushBack<T>
    where
        T: Draw,
    {
        Screen {
            f: element,
            b: EmptyScreen,
        }
    }
}

struct Screen<F, B>
where
    F: Draw,
    B: StScreen,
{
    f: F,
    b: B,
}

impl<F, B> StScreen for Screen<F, B>
where
    F: Draw,
    B: StScreen,
{
    type PushBack<T>
        = Screen<F, B::PushBack<T>>
    where
        T: Draw;

    type Front = F;

    type Back = B;

    const LEN: usize = 1 + B::LEN;

    fn push<T>(self, element: T) -> Self::PushBack<T>
    where
        T: Draw,
    {
        Screen {
            f: self.f,
            b: self.b.push(element),
        }
    }
}

impl Draw for EmptyScreen {
    // identity: do nothing
    fn draw(&self) {}
}

impl<F: Draw, B: StScreen> Draw for Screen<F, B> {
    // composition: draw them both
    fn draw(&self) {
        self.f.draw();
        self.b.draw();
    }
}

let screen = EmptyScreen
    .push(Button::new(3, 4, "home".to_string()))
    .push(Button::new(5, 4, "about".to_string()))
    .push(SelectBox::new(5, 4, vec!["one".to_string()]))
    .push(Button::new(6, 6, "login".to_string()));
screen.draw();`;

const genericQueueBuilder = `use orx_meta::queue::*;
use orx_meta::queue_of;

#[derive(PartialEq, Eq, Debug)]
struct ComplexStruct {
    a: u32,
    b: bool,
    c: char,
    d: String,
}

impl From<queue_of!(u32, bool, char, String)> for ComplexStruct {
    fn from(queue: queue_of!(u32, bool, char, String)) -> Self {
        let (a, b, c, d) = queue.into_tuple();
        Self { a, b, c, d }
    }
}

let val: ComplexStruct = QueueBuilder::<queue_of!(u32, bool, char, String)>::new()
    .push(42) // cannot call with wrong type, or
    .push(true) // cannot call in wrong order
    .push('x')
    .push("foo".to_string())
    .finish() // cannot finish before pushing all fields
    .into();

assert_eq!(
    val,
    ComplexStruct {
        a: 42,
        b: true,
        c: 'x',
        d: "foo".to_string()
    }
);`;


const exampleSum = `pub trait Sum {
    fn sum(self) -> i64;
}

impl Sum for i16 {
    fn sum(self) -> i64 {
        self as i64
    }
}

impl Sum for i32 {
    fn sum(self) -> i64 {
        self as i64
    }
}

impl Sum for i64 {
    fn sum(self) -> i64 {
        self
    }
}

orx_meta::define_queue!(
    elements => [ Sum ];
    queue => [ StQueue ; EmptyQueue, Queue ];
);

impl Sum for EmptyQueue {
    fn sum(self) -> i64 {
        0 // identity
    }
}

impl<F: Sum, B: StQueue> Sum for Queue<F, B> {
    fn sum(self) -> i64 {
        self.f.sum() + self.b.sum() // composition
    }
}

let queue = EmptyQueue::new()
    .push(1i16)
    .push(2i32)
    .push(3i32)
    .push(4i64)
    .push(5i32)
    .push(6i64)
    .push(7i16);
let sum = queue.sum();
assert_eq!(sum, 28);`;


const wontCompile = `trait StQueue<X>: X {
    type PushBack<T>: StQueue<X>
    where
        T: X;

    type Front: X;

    type Back: StQueue<X>;

    const LEN: usize;

    fn push<T>(self, element: T) -> Self::PushBack<T>
    where
        T: X;
}`;

const macro = `orx_meta::define_queue!(
    elements => [ Draw ];
    queue => [ StScreen; EmptyScreen, Screen ];
);`;


const screenPushBack = `type PushBack<T>
    = Screen<F, B::PushBack<T>>
where
    T: Draw;`;

const screenImplDraw = `impl<F: Draw, B: StScreen> Draw for Screen<F, B> {
    fn draw(&self) {
        self.f.draw();
        self.b.draw();
    }
}`;
