import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/zero-cost-composition-2025-10-15';
const title = 'Zero Cost Composition';
const date = '2025-10-15';
const summary = 'zero cost composition approach for classical polymorphism problem'

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
                The goal is to enable zero-cost composition of heterogeneous types sharing a common behavior.
            </p>

            <p>
                This might sound confusing ｢(ﾟﾍﾟ)
            </p>

            <p>
                Let's consider the classical polymorphism problem where we want to implement a screen that can draw
                all elements of a heterogeneous collection of components that can be drawn.
            </p>

            <p>
                Here, in addition to trait object & enum solutions, we propose a very different approach.
            </p>

            <p>
                This new approach is published in the <code>queue</code> module of the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate.
            </p>

            <h2>Another Way to Draw Components on the Screen</h2>

            <p>
                The classical problem about polymorphism, which is also used in rust book's&nbsp;
                <Link text="trait objects chapter" href="https://doc.rust-lang.org/book/ch18-02-trait-objects.html" />, is as follows:
            </p>

            <ul>
                <li>We have a <code>Draw</code> trait and various components such as button and select box implement this trait.</li>
                <li>We have a <code>Screen</code> which is a collection of components that we can draw.</li>
                <li>Three methods are required for the screen.</li>
                <li>
                    Since screen is a collection of components, we need <code>new</code> to
                    create an empty screen and <code>push</code> to add a component to it.
                </li>
                <li>The third method <code>draw</code> is related to the common behavior and draws all components on the screen.</li>
            </ul>

            <p>
                The following demonstrates the setup and a couple of example component implementations.
            </p>

            <Code code={drawTrait} />

            <h2>Approach #1: Trait Objects</h2>

            <p>
                Using trait objects can be considered as the standard way to solve this problem.
                It is pretty much identical to solutions in object-oriented languages such as Java or C#.
            </p>

            <Code code={solutionTraitObjects} />

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'lime', fontWeight: 'bold' }}>PROS</p>
                    <p>It is open for extension. Another codebase can implement a new component and add it to the screen.</p>
                    <p>
                        No boilerplate code is required.
                        We only iterate over elements of the vec and call draw on each item.
                    </p>
                    <p>
                        <code>Screen</code> is nothing but a wrapper for <code>Vec</code>.
                        No additional types are required.
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'red', fontWeight: 'bold' }}>CONS</p>
                    <p>Requires heap allocation for components in <code>Box</code>.</p>
                    <p><code>draw</code> calls of components are virtual; hence, requires dynamic dispatch.</p>
                </div>
            </div>

            <p>
                When the cons are not critical, we usually prefer this approach due to its simplicity and convenience.
                Otherwise, we consider the following approach.
            </p>

            <h2>Approach #2: Enums</h2>

            <p>
                Another elegant way to represent polymorphic behavior in rust is to use sum types or enums.
                Enum solution for this example could look like as the following.
            </p>

            <Code code={solutionEnums} />

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'lime', fontWeight: 'bold' }}>PROS</p>
                    <p>
                        No heap allocation required.
                        We might waste some memory when sizes of component variants vary significantly.
                        Nevertheless, this is preferable over boxing in most cases.
                    </p>
                    <p>
                        No virtual method calls.
                        All of the <code>component.draw()</code> calls are direct method calls.
                        There still exists runtime branching cost due to potentially large <code>match</code> clause.
                        This is still preferable over dynamic dispatch in most cases.
                    </p>
                    <p>
                        <code>Screen</code> is nothing but a wrapper for <code>Vec</code>.
                        No additional types are required.
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'red', fontWeight: 'bold' }}>CONS</p>
                    <p>
                        It is closed for extension.
                        If we or someone else creates a new component that can be drawn, it must be added as a variant to the <code>Component</code> enum.
                        This is a breaking change ‼️
                        Therefore, it fits to situations where only we extend and we don't extend often.
                    </p>
                    <p>
                        Some boilerplate involved in <code>Component::draw</code> implementation that gets longer and longer as we have more variants.
                        However, crates such as <Link text="enum_dispatch" href="https://crates.io/crates/enum_dispatch" /> let us overcome this issue ❤️
                    </p>
                </div>
            </div>

            <p>
                Notice that this implementation has significantly different properties.
            </p>

            <p>
                How about a completely different third approach (｡♥‿♥｡)
            </p>

            <h2>Approach #3: Zero Cost Compositions</h2>

            <p>
                Due to use of the <code>orx_meta::define_queue</code> macro, the following will look a bit magical.
                We will desugar it to make it completely clear, which will demonstrate the power of <strong>generic associated types (GAT)</strong>.
                We will also discuss what we cannot represent within the type system and why we need the macro.
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
                Most importantly <span className="inline-emphasis">we require both empty and non-empty screen to implement Draw</span>.
                This is the key idea behind zero-cost compositions.
            </p>

            <ul>
                <li>
                    (identity)
                    While implementing the common behavior (<code>Draw</code>) for empty queue (<code>EmptyScreen</code>),
                    we express the expected common behavior in the absence of any element.
                </li>
                <li>
                    (composition)
                    While implementing the common behavior for the non-empty queue (<code>Screen</code>),
                    we express how we should compose the common behavior of multiple elements.
                </li>
            </ul>

            <Code code={solutionComposition} />

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'lime', fontWeight: 'bold' }}>PROS</p>
                    <p>It is open for extension. Another codebase can implement a new component and add it to the screen.</p>
                    <p>
                        No heap allocation required.
                        Memory layout of the <code>screen</code> above is identical to the <code>struct MyScreen(Button, Button, SelectBox, Button)</code>.
                        Further, there is not even an allocation for the <code>Vec</code>.
                    </p>
                    <p>
                        No virtual method calls, all <code>draw</code> calls are statically dispatched.
                        Further, there is no run-time branching.
                        Final <code>screen.draw()</code> call can completely be inlined by the compiler
                        as <code>btn1.draw(); btn2.draw(); sbox.draw(); btn3.draw();</code>.
                    </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'red', fontWeight: 'bold' }}>CONS</p>
                    <p>
                        <code>Screen</code> is a new type specific to the <code>Draw</code> trait, has two generic parameters and it is more complex than
                        the <code>Vec</code> wrappers used in the previous approaches.
                    </p>
                </div>
            </div>

            <p>
                The con is clear and one of the objectives of the <strong>orx-meta</strong> crate is to overcome this as conveniently as possible.
            </p>
            <p>
                The pros, on the other hand, might sound confusing.
                Consider the following implementation which is hand-written specifically for a screen of three buttons
                and a select-box.
                Knowing that this is identical to the screen implementation above helps to understand how the pros are achieved.
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

            <p>Thanks to the great rust-type system and power of GATs 💪</p>

            <p>Expansion of the <Link text="define_queue" href="https://docs.rs/orx-meta/latest/orx_meta/macro.define_queue.html" /> macro reveals this.</p>

            <Code code={solutionCompositionExpansion} />

            <h3>Statically-typed Screen Trait</h3>

            <p>
                The <code>StScreen</code> trait defines a queue with statically-typed elements and constant <code>LEN</code>.
            </p>

            <p>Although this is not critical here, it is useful to clarify that this a queue due to the following:</p>
            <ul>
                <li>It <code>push</code>es to the back of the queue.</li>
                <li><code>Front</code> of the queue is an element that can be popped (not discussed here, but in the crate documentation).</li>
                <li><code>Back</code> is the queue containing elements except for the front element; i.e., resulting queue if the front element is popped.</li>
            </ul>

            <p>
                Notice GAT <code>type PushBack&lt;T&gt;: StScreen where T: Draw;</code> which handles a couple of important things:
            </p>
            <ul>
                <li>It restricts that we can only push types that implement <code>Draw</code>.</li>
                <li>
                    It tells the queue obtained by pushing a component to it also implements <code>StScreen</code>.
                    This means that we can keep calling <code>push</code> since we always get a <code>StScreen</code>.
                </li>
            </ul>

            <p>
                Then, we have two concrete implementations: empty and non-empty screen (or queue).
            </p>

            <h3>Empty Screen</h3>

            <p>
                This can be considered as the <code>Nil</code> of our queue.
                There is nothing special about its <code>StScreen</code> implementation as well.
            </p>

            <p>
                The only important detail is that, when we push component <code>T</code> to it,
                we receive <code>Screen&lt;T, EmptyScreen&gt;</code>.
                Notice that a non-empty <code>Screen</code> where the back is <code>EmptyScreen</code> contains one component.
            </p>

            <h3>Non-empty Screen</h3>

            <p>
                The <code>Screen</code> is a queue that is guaranteed to have at least one element that is the <code>Front</code>.
                The back might be an <code>EmptyScreen</code> or another non-empty <code>Screen</code>.
                Therefore, this struct can represent non-empty screens with any number of components.
            </p>

            <p>
                Consider GAT <code>type PushBack&lt;T&gt; = Screen&lt;F, B::PushBack&lt;T&gt;&gt; whereT: Draw;</code>.
            </p>

            <ul>
                <li>Since this is a queue, we keep the front <code>F</code> in the front.</li>
                <li>Since the back <code>B</code> is also a <code>StScreen</code>, we can call <code>B::PushBack&lt;T&gt;</code> to determine the type of the new back.</li>
            </ul>

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
                This is all!
            </p>

            <p>
                All these concrete types are available to us through one trait and two implementations.
                This is one of the examples showing the power of GATs.
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
                This is still useful though.
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
                We bring back the <code>Draw</code> requirement which is central to the composition idea.
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
                This was straightforward for the screen example, we do nothing when there are not components to draw.
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
                If we had three elements instead, the back would be a queue of two elements using this composition definition.
                Therefore, <code>self.f.draw(); self.b.draw();</code> call would be equivalent to <code>self.f.draw(); self.b.f.draw(); self.b.b.f.draw();</code>.
                The definition of composition is carried on to any non-empty queue.
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
                Sum of every whole number is trivially itself.
            </p>

            <p>
                Next, we implement <code>sum</code> of the <code>EmptyQueue</code>.
                This defines identity as <code>0</code>.
            </p>

            <p>
                Lastly, we implement <code>sum</code> of a non-empty <code>Queue</code> as addition of its front and back.
                This defines composition as the <code>+</code>.
            </p>

            <p>
                Although the usage has a dynamic look and feel, and although the <code>sum</code> implementation of the queue
                seems recursive; everything is statically dispatched without any recursion.
                The compiler can actually inline the <code>queue.sum()</code> call as <code>1 + 2 + ... + 7</code>.
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
                The <code>queue</code> blocks is just naming (i) the statically-typed queue trait, (ii) empty queue struct
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
                The idea originated while trying to compose business constraints of route optimization without any performance penalty.
                You may find a <Link text="talk" href="https://orxfun.github.io/talk-composing-zero-cost-abstractions-in-route-optimization/" /> that
                discusses the critical importance of achieving this goal in achieving an extensible and maintainable solution.
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
    pub fn new(width: u32, height: u32, options: Vec<String>) -> Self {
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
    pub fn new() -> Self {
        Self { components: vec![] }
    }

    pub fn push(&mut self, component: Box<dyn Draw>) {
        self.components.push(component);
    }

    pub fn draw(&self) {
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
    pub fn new() -> Self {
        Self { components: vec![] }
    }

    pub fn push(&mut self, component: Component) {
        self.components.push(component);
    }

    pub fn draw(&self) {
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

pub struct Screen<F, B>
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
    .push(42) // cannot call in wrong order
    .push(true)
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
