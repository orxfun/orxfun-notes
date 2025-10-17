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
                Sounds confusing ｢(ﾟﾍﾟ)
            </p>

            <p>
                Let's consider the classical example on polymorphism.
            </p>

            <div className="emphasis">
                We want to implement a screen that can draw all elements of a heterogeneous collection of components that can be drawn.
            </div>

            <p>
                Two well-known and different solutions are the trait object & enum solutions.
            </p>

            <p>
                This article proposes a third approach, which is significantly more different :)
            </p>

            <p>
                Before we dive in, a note on the generic associated types (GATs) which is a relatively recent feature of rust type system.
            </p>

            <p>
                GATs are often considered together with lifetimes.
                This is because it solves important lifetime-related issues.
                Even when explaining the initiative, the examples focused on solving lifetime issues,
                as in this <Link text="amazing article" href="https://rust-lang.github.io/generic-associated-types-initiative/explainer/iterable.html" />.
                However, its power may go way beyond.&nbsp;
                <span className="inline-emphasis">GATs are functions of the type system</span> and functions are powerful.
                The approach described in this article will hopefully be an example of its power.
            </p>

            <p>
                Discussed solution is published in the <code>queue</code> module of the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate.
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
                    Screen is sort of a collection, so we need <code>new</code> to
                    create an empty screen and <code>push</code> to add components.
                </div>
                <div>The third method <code>draw</code> is related to the common behavior and draws all components on the screen.</div>
            </div>

            <p>We first set up the draw trait and a couple of implementations for demonstration.</p>

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
                        <div>Requires heap allocation for each component since they need to be <code>Box</code>ed.</div>
                        <div><code>draw</code> calls of components are virtual; hence, requires dynamic dispatch.</div>
                    </div>
                </div>
            </div>

            <p>
                When the cons are not critical, we usually prefer this approach.
                It is simple and convenient.
            </p>

            <p>For other cases, we consider the second approach.</p>

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
                            No virtual method calls.&nbsp;
                            <code>component.draw()</code> is a method call.
                            It might have runtime branching cost due to potentially large <code>match</code> clause.
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
                            The <code>match</code> statement gets larger and larger as we define more variants.
                            Thankfully, crates such as <Link text="enum_dispatch" href="https://crates.io/crates/enum_dispatch" /> let us overcome this issue 🚀
                        </div>
                    </div>
                </div>
            </div>

            <p>Notice that we end up with significantly different properties.</p>

            <p>
                One thing in common though: in both solutions, we have a simple collection type, a <code>Vec</code>.
                We will change this in the third approach.
            </p>




            <h2>Approach #3: Zero Cost Compositions</h2>

            <p>As mentioned before, this will be a completely different approach.</p>

            <div className="seq">
                <div>
                    We will first see the solution in the following code block.
                    Due to use of the <Link text="define_queue" href="https://docs.rs/orx-meta/latest/orx_meta/macro.define_queue.html" /> macro,
                    it will not be clear at first.
                </div>
                <div>Then, we will see the expansion, dive into details and discuss how GATs make it possible.</div>
                <div>Finally, we will discuss what we cannot represent and why we need the macro.</div>
            </div>

            <p>For now, knowing the following will be helpful:</p>

            <ul>
                <li><code>StScreen</code> is a trait representing statically typed queue of heterogeneous components 「(°ヘ°)</li>
                <li><code>EmptyScreen</code> and non-empty <code>Screen</code> structs are the two <code>StScreen</code> implementations.</li>
                <li>The screen, or queue of components, can only have elements that implement <code>Draw</code>.</li>
            </ul>

            <p>Note that queue is the general term, while screen is used for this example; they are often used interchangeable in this article.</p>

            <p>
                Lastly, in addition to  components on the screen,&nbsp;
                <span className="inline-emphasis">we require both empty and non-empty screen to implement Draw</span>.
                This is the key idea behind zero-cost compositions.
            </p>

            <Code code={solutionComposition} />

            <p>Looks concise and ergonomic, similar to the previous solutions.</p>

            <div style={{ display: "grid", gridTemplateColumns: '1fr 1fr', }}>
                <div>
                    <p style={{ color: 'lime', fontWeight: 'bold', textAlign: 'center', }}>PROS</p>
                    <div className="seq">
                        <div>
                            It is open for extension. Another codebase can define a new component, implement <code>Draw</code> for it and add it to the screen.
                        </div>
                        <div>
                            No heap allocation required for the components.
                            There is not even an allocation for a <code>Vec</code>.
                        </div>
                        <div>
                            No virtual method calls, all <code>draw</code> calls are statically dispatched.
                            Further, there is no run-time branching.&nbsp;
                            <code>screen.draw()</code> call can completely be inlined by the compiler
                            as <code>btn1.draw(); btn2.draw(); sbox.draw(); btn3.draw();</code>.
                        </div>
                        <div>
                            No boilerplate code is required.
                            We only define the <span className="inline-emphasis">identity</span> and <span className="inline-emphasis">composition</span>&nbsp;
                            definitions of the shared behavior, <code>Draw</code>.
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
                is to overcome the complexity as conveniently as possible.
            </p>
            <p>On the other hand, it might not be clear how the pros are achieved.</p>
            <p>
                In order to demonstrate, consider the following implementation which is hand-written specifically for a screen with three buttons
                and one select-box.
                It is easy to notice that this solution attains the above-mentioned pros.
            </p>

            <Code code={solutionCompositionHandWritten} />

            <p>Under the hood, this is identical to the screen implementation as a statically typed queue.</p>

            <p>We will see how in the next section.</p>




            <h2>Expansion and the Power of GATs</h2>

            <p>
                You might have figured out that every time we push a component to the screen, we obtain a new concrete queue type.
            </p>

            <p>
                This queue type is statically-typed in its components.
                Just like an ad-hoc struct.
            </p>

            <p>This works all thanks to the rust-type system and power of GATs 💪</p>

            <p>To understand the queue types better, let's check the expanded version of the solution provided above.</p>

            <Code code={solutionCompositionExpansion} />

            <div className="emphasis">
                Note the resemblance of <code>push</code> method and <code>PushBack</code> type,&nbsp;
                <span className="inline-emphasis">GATs are functions of the type system</span>.
            </div>

            <p>Let's check each of the three queue types in detail.</p>


            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>i. <code>StScreen</code>: the trait for statically-typed queues</h3>

            <p>
                The <code>StScreen</code> trait defines a queue with statically-typed elements and a constant <code>LEN</code>.
            </p>

            <p>
                Although this is not important for this problem, it is useful to clarify that this a queue.
                We <code>push</code> to the back of the queue.
                The <code>Front</code> element can be popped,
                and <code>Back</code> represents the queue containing the remaining elements when the front element is popped.
                This is a choice regarding other use cases, we could've chosen a stack or a double-ended queue as well.
            </p>

            <p>Most important detail of this trait is the following GAT:</p>

            <Code code={stScreenPushBack} />

            <p><code>PushBack&lt;T&gt;</code> is the concrete type we obtain if we push an element of type <code>T</code> to this queue.</p>

            <div className="seq">

                <div>Firstly, the condition <code>T: Draw</code> ensures that our queue may contain heterogeneous types, but they can only be <code>Draw</code> types.</div>

                <div>
                    Secondly, whatever the type we get by pushing <code>T</code> to the queue, it also has to implement <code>StScreen</code>, the trait itself.
                    This has <span className="inline-emphasis">the most useful consequence</span>.
                    It means that we can call <code>PushBack</code> on the resulting type;
                    and then we can call <code>PushBack</code> on the resulting type;
                    and then we can call <code>PushBack</code> on the resulting type;
                    ♾️.
                    We will always get another queue.
                </div>

            </div>

            <p>Now, all we need is two concrete implementations: one for empty queue and one non-empty.</p>



            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>ii. Empty queue</h3>

            <p>
                This can be considered as the <code>Nil</code> of our queue.
                There is nothing special about its <code>StScreen</code> implementation as well.
            </p>

            <p>
                The only important detail is that, when we push component <code>T</code> to it,
                we receive <code>Screen&lt;T, EmptyScreen&gt;</code>.
                This is a screen with one component which is of type <code>T</code>.
            </p>



            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>iii. Non-empty queue</h3>

            <p>
                The <code>Screen</code> is a queue that has at least one element which is at the <code>Front</code>.
                The back might be an <code>EmptyScreen</code> or another non-empty <code>Screen</code>.
                Therefore, this struct can represent non-empty queues with any number of elements.
            </p>

            <p>See the implementation of the <code>PushBack</code> GAT.</p>

            <Code code={screenPushBack} />

            <div className="seq">
                <div>
                    It is straightforward to see that the resulting type must be a non-empty <code>Screen</code> since we are pushing an element
                    to the current queue.
                </div>
                <div>Since this is a queue, we want to keep the front <code>F</code> in the front of the new queue as well.</div>
                <div>
                    Back of the current queue <code>B</code> is also a queue; i.e., <code>StScreen</code>.
                    This allows us to call <code>B::PushBack&lt;T&gt;</code> to determine type of back of the new queue.
                </div>
                <div>
                    Combining these two, we obtain a new <code>Screen</code> where the front remains to be <code>F</code> and
                    the back is determined by <code>B::PushBack&lt;T&gt;</code>.
                </div>
            </div>

            <p>
                To make it more concrete, consider the following table summarizing concrete types of queues
                up to four elements, given the types of its elements.
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

            <p>This is all we need to represent all statically-typed queues!</p>

            <p>All these concrete types are available to us through one trait and two implementations.</p>

            <p>
                We can incrementally build one type from another very ergonomically which almost feels like working with dynamic types.
                ❤️ GATs!
            </p>




            <h2>Side Quest, a Generic Builder for Any Struct</h2>

            <p>Consider what we would have we removed the <code>Draw</code> requirement from elements and queues.</p>

            <p>We would end up with a statically-typed queue of <span className="inline-emphasis">anything</span>. This is an ad-hoc struct.</p>

            <p>We already have tuples for this.</p>

            <p>
                However, incremental build capability of queues come in handy.
                For instance, it allows us to create a generic&nbsp;
                <Link text="QueueBuilder" href="https://docs.rs/orx-meta/latest/orx_meta/queue/struct.QueueBuilder.html" /> that we can use for any struct.
                Since the queues are statically-typed in its elements,
                the builder prevents calling <code>push</code> with wrong types or in wrong order,
                and prevents us from <code>finish</code>ing early or late.
            </p>

            <p>
                This was not the main focus. You may you may find the details&nbsp;
                <Link text="here" href="https://github.com/orxfun/orx-meta/blob/main/docs/2_generic_builder.md" /> if you are interested.
            </p>

            <Code code={genericQueueBuilder} />





            <h2>The Idea of Composition</h2>

            <p>After the side quest, we bring back the <code>Draw</code> requirement.</p>

            <p>
                We do not want a queue of anything.
                We want a queue of things that share a common behavior.
                This is central to the composition idea.
            </p>

            <p>
                In addition to elements of the queue,&nbsp;
                <span className="inline-emphasis"> we require the queue itself to implement the common behavior</span>.
                This is how we achieve zero-cost composition.
            </p>

            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>Identity: Draw for empty Queue</h3>

            <p>
                Implementing the common behavior for the empty queue describes what we should do in the absence of any elements.
                This is straightforward for the screen example, we do nothing when there is nothing to draw.
            </p>


            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>Composition: Draw for non-empty Queue</h3>

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
                It seems sensible to draw both of them.
            </p>

            <p>
                Recall our implementation.
            </p>

            <Code code={screenImplDraw} />

            <p>
                When we have two elements, our queue type is <code>Screen&lt;C1, Screen&lt;C2, EmptyScreen&gt;&gt;</code>.
                Omitting the <code>self.</code> for brevity, we would have <code>f: C1</code>, <code>b: Screen&lt;C2, EmptyScreen&gt;</code>.
                We can substitute <code>b.draw()</code> with <code>b.f.draw()</code> and <code>b.b.draw()</code>.
                Since <code>b.b</code> is an empty queue, we would not go any deeper.
                Therefore, the draw call on a two element queue could be inlined as <code>f.draw(); b.f.draw(); b.b.draw();</code>.
                Since the last draw call on empty screen does nothing, this method would draw two of our components.
                This is the expected behavior.
            </p>

            <p>
                Notice that everything would work exactly the same if we had a queue of three elements; i.e., <code>Screen&lt;C1, Screen&lt;C2, Screen&lt;C3, EmptyScreen&gt;&gt;&gt;</code>.
                Our inlining would only go one more level until we reach the empty queue and we would end up with <code>f.draw(); b.f.draw(); b.b.f.draw(); b.b.b.draw();</code>.
                This would draw three of the components, again the expected behavior.
            </p>

            <p>
                Therefore, once we define what to do with an empty queue and how to compose two elements,
                we attain the expected behavior for any number of elements in the queue.
            </p>





            <h3>Another Example for Composition</h3>

            <p>
                We can define different ways to compose elements sharing a common behavior depending on our use case.
                In the <code>Draw</code> example, we simply draw all components one after the other.
            </p>

            <p>
                A second example might help demonstrate the power of composition.
                Assume that we want a queue of whole numbers with different concrete types.
                Our shared behavior is <code>Sum</code>.
            </p>

            <Code code={exampleSum} />

            <p>Numbers which can be turned into <code>i64</code> can implement <code>Sum</code>, since sum of a single number is itself.</p>

            <p>
                Next, we implement <code>Sum</code> for the <code>EmptyQueue</code>.
                This defines identity as <code>0</code>.
            </p>

            <p>
                Finally, we implement <code>Sum</code> for a non-empty <code>Queue</code> as addition of its front and back.
                This defines composition as the <code>+</code>.
            </p>

            <p>
                The usage might look dynamic and <code>sum</code> implementation might seem recursive.
                However, everything is statically dispatched without any recursion.
                The compiler can actually inline the <code>queue.sum()</code> call as <code>1 + 2 + ... + 7 + 0</code>.
            </p>






            <h2>Why do we need the macro?</h2>

            <p>It felt so close to represent this without macros, but no luck ~( ´•︵•` )~</p>

            <p>
                <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate provides the <code>StQueue</code> trait together with&nbsp;
                <code>EmptyQueue</code> and <code>Queue</code> implementations.
                This implementation naturally does not have the requirement on elements to be <code>Draw</code>; and hence,
                represents the <span className="inline-emphasis">statically-typed queue of anything</span>.
                As explained in the builder side quest, this can still be useful.
            </p>

            <p>But the queue is most useful when it is coupled with a shared behavior of heterogeneous types.</p>

            <p>To achieve this, what we actually need is something like the following.</p>

            <Code code={wontCompile} />

            <p>
                Notice that if we substitute <code>X</code> with <code>Draw</code> we obtain our <code>StScreen</code> trait.
                In another use case, we can replace it with <code>Component</code>, or <code>Rule</code>, or whichever shared behavior we are working with.
            </p>

            <p>In other words, <code>X</code> here is a trait, or I should say any trait.</p>

            <p>We need our <code>StQueue</code> trait to be generic over another trait.</p>

            <p>This won't compile today (⌣_⌣”)</p>

            <p>For now, I used the escape patch.</p>

            <ul>
                <li>We cannot represent our solution within the type system.</li>
                <li>Abstraction seems to be as simple as a string substitution.</li>
            </ul>

            <p>This is one of the easy cases for <code>macro_rules!</code></p>

            <Code code={macro} />

            <p>
                The macro call above has two blocks.
            </p>

            <p>
                The <code>queue</code> block is just giving names to (i) the statically-typed queue trait, (ii) empty queue struct
                and (iii) non-empty queue struct.
            </p>

            <p>
                The <code>elements</code> block is the important part.
                Here, we provide a comma-separated list of traits that define the common behavior of heterogeneous elements of the queue.
            </p>

            <p>
                Then, the macro defines the queue types exactly as we saw in the expansion with only one difference.
                It adds the traits listed in <code>elements</code> as requirements to elements of the queues,
                and it requires the queues to implement these traits themselves.
            </p>




            <h2>Summary</h2>

            <p>This pattern is very powerful for composing zero-cost abstractions.</p>

            <p>Especially for performance critical programs, as it allows us to avoid dynamic dispatch, heap allocation and run-time branching all together.</p>

            <p>On the downside, the approach involves more complex types with generic parameters than alternative solutions.</p>

            <p>
                Using the queues is still convenient though :)
                GATs make working with statically-typed queues feel like we are in a dynamic language.
            </p>

            <p>
                I first started experimenting with GATs for composing business constraints for a performance-critical route optimization library.
                If you are interested, you may check a relevant <Link text="talk" href="https://orxfun.github.io/talk-composing-zero-cost-abstractions-in-route-optimization/" /> where
                we discuss the critical importance of zero cost composition.
                Actually, it seems to be the only way to achieve <span className="inline-emphasis">performant, extensible and maintainable solution at the same time</span>.
            </p>

            <p>
                The possibility of zero-cost composition allows us to focus and work on each feature in isolation
                because we know that each feature will compose nicely without loss of performance.
            </p>

            <p>This is why the approach is generalized in the <Link text="orx-meta" href="https://crates.io/crates/orx-meta" /> crate.</p>

            <p>
                Nevertheless, the idea is still very young, at least to me.
                Feel free to contact <Link text="me" href="mailto:orx.ugur.arikan@gmail.com" /> to share your thoughts and experience
                (certainly contact me if you find a macro-free solution 🫶).
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

const solutionCompositionHandWritten = `struct Screen { // no heap allocation, no Vec
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

const solutionCompositionExpansion = `// expansion of the macro
trait StScreen: Draw {
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

// remaining is same as above

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


const stScreenPushBack = `type PushBack<T>: StScreen
where
    T: Draw;`;

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
