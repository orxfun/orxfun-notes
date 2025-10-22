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
                To demonstrate, let's consider the classical example about polymorphism.
            </p>

            <div className="emphasis">
                We want to implement a screen that can draw all elements of a heterogeneous collection of components that can be drawn.
            </div>

            <p>
                Two well-known solutions are the trait object & enum solutions.
            </p>

            <p>
                This article proposes a third approach, which is considerably different :)
            </p>

            <p>
                Before diving in, a brief note on the generic associated types (GATs).
            </p>

            <p>
                GATs are often associated with lifetimes.
                This is natural since it solves important lifetime-related issues as demonstrated in the&nbsp;
                <Link text="article on iterables" href="https://rust-lang.github.io/generic-associated-types-initiative/explainer/iterable.html" />.
                However, its power goes way beyond.&nbsp;
                To understand this, it might suffice to consider <span className="inline-emphasis">GATs as functions of the type system</span>.
                The approach described in this article is based on this.
            </p>

            <p>
                Discussed solution is published in the <span className="inline-emphasis">queue</span> module of the <span className="inline-emphasis">orx-meta</span>&nbsp;
                <Link text="repo" href="https://github.com/orxfun/orx-meta" /> and <Link text="crate" href="https://crates.io/crates/orx-meta" />.
            </p>

            <h2>Another Way to Draw Components on the Screen</h2>

            <p>
                The classical example about polymorphism, which is also used in rust book's&nbsp;
                <Link text="trait objects chapter" href="https://doc.rust-lang.org/book/ch18-02-trait-objects.html" />, is as follows:
            </p>

            <div className="seq">
                <div>We have a <code>Draw</code> trait and various components, such as button and select box, implement this trait.</div>
                <div>The <code>Screen</code> is a collection of components that we can draw.</div>
                <div>We need to create screens containing components of heterogeneous concrete types and draw all components on the screen.</div>
            </div>

            <p>We first set up the draw trait and a couple of implementations for demonstration.</p>

            <Code code={drawTrait} />




            <h2>Approach #1: Trait Objects</h2>

            <p>
                Using trait objects can be considered as the standard way to solve this problem.
                It is very close to solutions in object-oriented languages such as Java or C#.
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
                It is simple, convenient and dynamic.
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
                            No heap allocation required for components&nbsp;
                            (<i>we might waste some memory when sizes of different components vary significantly</i>⚠️).
                        </div>
                        <div>
                            No virtual method calls&nbsp;
                            (<i>it might have runtime branching cost due to potentially large <code>match</code> clause</i>⚠️).
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
                            And adding the variant is a breaking change ‼️
                            Therefore, this approach is most suitable when only <i>we</i> extend and we don't extend often.
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
                One thing in common: we use a dynamic container to store components, such as <code>Vec</code>.
                This will change in the third approach.
            </p>




            <h2>Approach #3: Statically-Typed Queue and Zero Cost Composition</h2>

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
                <li><code>StScreen</code> is a trait representing a statically-typed queue of heterogeneous components 「(°ヘ°)</li>
                <li>Single-component <code>ScreenSingle</code> and multiple-component <code>Screen</code> structs are the two <code>StScreen</code> implementations.</li>
                <li>The screen, or queue of components, can only have elements that implement <code>Draw</code>.</li>
            </ul>

            <p>
                Note that <span className="inline-emphasis">queue</span> is the general term, while <span className="inline-emphasis">screen</span> is used
                for this example; they are often used interchangeably throughout this article.
            </p>

            <p>
                Lastly, in addition to individual components,&nbsp;
                <span className="inline-emphasis">we require screens to implement Draw</span>.
                This is the key idea behind zero-cost compositions.
            </p>

            <Code code={solutionComposition} />

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
                            definitions of the shared behavior <code>Draw</code>.
                        </div>
                    </div>
                </div>
                <div>
                    <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', }}>CONS</p>
                    <div className="seq">
                        <div>
                            <code>Screen</code> with generic parameters is a more complicated type than the <code>Vec</code> wrappers used in the previous approaches.
                            On the other hand, we can conveniently work with it without needing its concrete type since it can be used as <code>impl Draw</code>.
                        </div>
                        <div>
                            It is statically-typed.
                            This means that concrete types of all of its elements must be known at the compile time.
                        </div>
                    </div>
                </div>
            </div>


            <p>
                The queue has nice properties due to being statically-typed,
                but on the other hand, this brings serious limitations on where it can be used.
                We will discuss potential use cases later.
            </p>

            <p>Let's first clarify the pros.</p>
            <p>
                Consider the following implementation which is hand-written specifically for a screen with three buttons
                and one select-box.
                It is easy to notice that this solution attains the above-mentioned pros.
            </p>

            <Code code={solutionCompositionHandWritten} />

            <p>Under the hood, this is identical to the screen implementation as a statically-typed queue.</p>

            <p>We will see <i>how</i> in the next section.</p>




            <h2>Expansion and the Power of GATs</h2>

            <p>You might have figured out that every time we push a component to the screen, we obtain a new queue type.</p>

            <p>Every concrete queue type is statically-typed in its components.</p>

            <p>This works all thanks to the rust-type system and the power of GATs 💪</p>

            <p>To understand the queue types better, let's check the expanded version of the solution provided above.</p>

            <Code code={solutionCompositionExpansion} />

            <div className="emphasis">
                Note the resemblance of <code>push</code> method and <code>PushBack</code> type,&nbsp;
                <span className="inline-emphasis">GATs are functions of the type system</span>.
            </div>

            <p>Let's check each of the three queue definitions in detail.</p>


            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>i. <code>StScreen</code>: the trait for statically-typed queues</h3>

            <p>
                The <code>StScreen</code> trait defines a queue with statically-typed elements and a constant <code>LEN</code>.
            </p>

            <p>
                <i>
                    Although this is not important for this article, it is useful to clarify that this a queue.
                    We <code>push</code> to the back of the queue.
                    The <code>Front</code> element can be popped,
                    and <code>Back</code> represents the queue containing the remaining elements when the front element is popped.
                    This is a choice regarding other use cases, we could've chosen a stack or a double-ended queue as well.
                </i>
            </p>

            <p>Most important detail of this trait is the following GAT:</p>

            <Code code={stScreenPushBack} />

            <p><code>PushBack&lt;T&gt;</code> is the concrete type we obtain if we push an element of type <code>T</code> to this queue.</p>

            <div className="seq">

                <div>Firstly, the condition <code>T: Draw</code> ensures that our queue may only contain <code>Draw</code> types.</div>

                <div>
                    Secondly, whatever the type we get by pushing <code>T</code> to the queue, it also has to implement <code>StScreen</code>, the trait itself.
                    This has <span className="inline-emphasis">the most useful consequence</span>.
                    It means that we can call <code>PushBack</code> on the resulting type;
                    and then we can call <code>PushBack</code> on the resulting type;
                    ... (♾️ or 256?).
                    We will always get another queue.
                </div>

            </div>

            <p>Now, all we need is two concrete implementations of this trait.</p>



            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>ii. Queue with a single element</h3>

            <p><code>ScreenSingle&lt;F&gt;</code> is a queue containing only one element of type <code>F</code>.</p>

            <p>
                The only important detail here is that, when we push component <code>T</code> to the back of it,
                we receive <code>Screen&lt;F, ScreenSingle&lt;T&gt;&gt;</code>.
                This is a screen with two components of types <code>F</code> and <code>T</code>, respectively.
            </p>



            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>iii. Queue with multiple elements</h3>

            <p>The <code>Screen</code> is a queue that has at least two elements.</p>

            <p>It is composed of two parts.</p>

            <p><code>Front</code> is the element in the front of the queue.</p>

            <p>
                <code>Back</code> is the queue containing all elements except for the one in the front; i.e.,
                it is the queue we would obtain if we popped the element in the front.
                It can be a single-element queue or another multiple-element queue.
                Therefore, this generic struct can represent all queues with multiple number of elements.
            </p>

            <p>See the implementation of the <code>PushBack</code> GAT.</p>

            <Code code={screenPushBack} />

            <div className="seq">
                <div>
                    It is straightforward to see that the resulting type must be another multiple-element <code>Screen</code> since
                    we are adding an element to it.
                </div>
                <div>We need to keep the front <code>F</code> in the front of the new queue as well.</div>
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
                        <td>1</td>
                        <td><code>C1</code></td>
                        <td><code>ScreenSingle&lt;C1&gt;</code></td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td><code>C1, C2</code></td>
                        <td><code>Screen&lt;C1, ScreenSingle&lt;C2&gt;&gt;</code></td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td><code>C1, C2, C3</code></td>
                        <td><code>Screen&lt;C1, Screen&lt;C2, ScreenSingle&lt;C3&gt;&gt;&gt;</code></td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td><code>C1, C2, C3, C4</code></td>
                        <td><code>Screen&lt;C1, Screen&lt;C2, Screen&lt;C3, ScreenSingle&lt;C4&gt;&gt;&gt;&gt;</code></td>
                    </tr>
                </tbody>
            </table>

            <p>This is all we need to represent all statically-typed queues!</p>





            <h2>Side Quest, a Generic Builder for Any Struct</h2>

            <p>Consider what we would have if we removed the <code>Draw</code> requirement from elements and queues.</p>

            <p>We would end up with a statically-typed queue of <span className="inline-emphasis">anything</span>. This is an ad-hoc struct.</p>

            <p>We already have tuples for this.</p>

            <p>
                However, incremental build capability of queues is handy.
                For instance, it allows us to create a generic&nbsp;
                <Link text="QueueBuilder" href="https://docs.rs/orx-meta/latest/orx_meta/queue/struct.QueueBuilder.html" /> that we can use for any struct.
                Since the queues are statically-typed in its elements,
                the builder prevents calling <code>push</code> with wrong types or in wrong order,
                and prevents us from <code>finish</code>ing early or late.
            </p>

            <p>
                You may you may find the details&nbsp;
                <Link text="here" href="https://github.com/orxfun/orx-meta/blob/main/docs/2_generic_builder.md" /> if you are interested.
            </p>

            <Code code={genericQueueBuilder} />





            <h2>The Idea of Composition</h2>

            <p>After the side quest, we bring back the <code>Draw</code> requirement.</p>

            <p>
                We do not want a queue of anything.
                Instead, we want a queue of things that share a common behavior.
            </p>

            <p>
                In addition, <span className="inline-emphasis"> we want the queue itself to implement the common behavior</span>.
                This is how we achieve zero-cost composition.
            </p>

            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>Identity: Draw for Single-Element Queue</h3>

            <p>We need to implement the common behavior for the queue containing a single element which satisfies the common behavior.</p>

            <p>This is straightforward.</p>

            <p>
                There is only one way to implement this.
                The single-element queue behaves exactly as its element.
            </p>


            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>Composition: Draw for Multiple-Element Queue</h3>

            <p>
                In order to implement the common behavior for multiple-element queue, we need to define the expected behavior when
                there are multiple elements.
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
                When we have two elements, our queue type is <code>Screen&lt;C1, ScreenSingle&lt;C2&gt;&gt;</code>.
                Omitting the <code>self.</code> for brevity, we would have <code>f: C1</code>, <code>b: ScreenSingle&lt;C2&gt;</code>.
                We can substitute <code>b.draw()</code> with <code>b.f.draw()</code>.
                Therefore, the draw call on a two element queue could be inlined as <code>f.draw(); b.f.draw();</code> drawing both components.
                This is the expected behavior.
            </p>

            <p>
                Notice that everything would work exactly the same if we had a queue of three elements; i.e., <code>Screen&lt;C1, Screen&lt;C2, ScreenSingle&lt;C3&gt;&gt;&gt;</code>.
                We would do one more substitution to reach the single-element queue and we would end up with <code>f.draw(); b.f.draw(); b.b.f.draw();</code>.
                This would draw three of the components, which is again the expected behavior.
            </p>

            <p>Therefore, once we define how to compose two elements, we attain the expected behavior for any number of elements in the queue.</p>





            <h3>Another Example, Composing Business Criteria</h3>

            <p>
                We can define different ways to compose elements sharing a common behavior depending on the use case.
                A second example might help demonstrate the power of composition.
            </p>

            <p>
                Assume that we are evaluating vehicle tours with respect to different business criteria.
                Our shared behavior is the <code>Criterion</code> trait.
                Its <code>evaluate</code> method takes the <code>tour</code> to evaluate and <code>previous_status</code> of the tour,
                and returns the new status.
            </p>

            <p>We define three example criteria, <code>Distance</code>, <code>Capacity</code> and <code>Precedence</code>, in the example below.</p>

            <p>
                However, one criterion often does not suffice to solve a real life problem.
                Different kinds of operations and different regions require different <span className="inline-emphasis">sets of criteria</span>.
            </p>

            <p>To define the composition of criteria, we can use the queue approach.</p>

            <div className="seq">
                <div>We again define our criteria queue with the <code>define_queue</code> macro.</div>

                <div>
                    First, we implement <code>Criterion</code> for the single-element queue.
                    This is straightforward, it just evaluates the tour with its criterion.
                </div>

                <div>
                    Second, we implement <code>Criterion</code> for multiple-element queue, <code>Criteria</code>.
                    Here, we first evaluate the tour with respect to the first criterion in the front.
                    Then, we pass on the resulting status to the back of the queue to evaluate.
                    This is how we define composition for this use case.
                </div>
            </div>

            <p><i>
                You may skip the example criterion implementations and see the composition using the queues after the <code>// COMPOSITION</code> line.
            </i></p>

            <Code code={exampleCriteria} />





            <h2>Why do we need the macro?</h2>

            <p>It felt so close to represent this pattern without macros, but no luck ~( ´•︵•` )~</p>

            <p>
                orx-meta crate provides the <code>StQueue</code> trait together with&nbsp;
                <code>QueueSingle</code> and <code>Queue</code> implementations.
                Naturally, these default implementations do not have the requirement on elements to be <code>Draw</code> or <code>Criterion</code>.
                Therefore, they define <span className="inline-emphasis">statically-typed queue of anything</span>.
                As explained in the builder side quest, this can still be useful.
            </p>

            <p>But the queue is most useful when it is coupled with a shared behavior of heterogeneous types.</p>

            <p>To achieve this, what we actually need is something like the following.</p>

            <Code code={wontCompile} />

            <p>
                If we substitute <code>X</code> with <code>Draw</code>, we obtain the <code>StScreen</code> trait in our example;
                if we substitute with <code>Criterion</code> we get <code>StCriteria</code>.
            </p>

            <p><code>X</code> here is a trait, or I should say, it can be any trait.</p>

            <p>We need our <code>StQueue</code> trait to be generic over another trait.</p>

            <p>This won't compile today (⌣_⌣”)</p>

            <p>For now, I used the escape patch.</p>

            <ul>
                <li>We cannot represent our solution within the type system.</li>
                <li>Abstraction seems to be as simple as a string substitution.</li>
            </ul>

            <p>Luckily, this is one of the straightforward cases for <code>macro_rules!</code></p>

            <Code code={macro} />

            <p>
                The macro call above has two blocks.
            </p>

            <p>
                The <code>queue</code> block is just giving names to (i) the statically-typed queue trait, (ii) single-element queue struct
                and (iii) multiple-element queue struct.
            </p>

            <p>
                The <code>elements</code> block is the important part.
                Here, we provide a comma-separated list of traits that define the common behavior of heterogeneous elements of the queue.
            </p>

            <p>
                Then, the macro defines the queue types exactly as we saw in the expansion with only one difference.
                It adds the traits listed in <code>elements</code> as requirements to elements of the queues,
                and it requires the queues to implement the traits themselves
                (in other words, it replaces <code>X</code> above with these traits).
            </p>







            <h2>Limitations and Use Cases</h2>

            <p>As mentioned in the cons, having statically-typed elements limits potential use cases of the queue.</p>

            <p>In the following, we discuss two use cases where this pattern can be utilized.</p>




            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>A. As a Collection, <code>Draw</code> Example</h3>

            <p>
                Although it is statically-typed, we can still use the queue as a collection, as in the <code>Draw</code> example,
                when know types of all elements during compile time.
            </p>

            <p>This fits to situations where we instantiate the collection during the <span className="inline-emphasis">start up</span> of a service.</p>

            <p>
                We often parse configuration files into the collection.
                For instance, we can have a json file listing components to be included in the screen.
            </p>

            <p>
                In the following, we see screen initialization as a vector of trait objects parsed from a json file on the left,
                and as a statically-typed queue on the right.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Code code={startupTraitObjects} />
                <Code code={startupQueue} />
            </div>

            <p>
                With the queue approach, we need to re-compile the code every time the configuration changes.
                And due to compiler limitations, the queue cannot have too many elements.
                As far as I experienced, the compiler seems to struggle when we add more than 256 elements.
            </p>

            <p>On the other hand, initialization can never fail, runtime errors are not possible.</p>

            <p>Further, the queue brings performance and memory advantages.</p>

            <p>
                For a screen containing 200 components with toy draw implementations,
                statically-typed queue approach is two times faster than trait objects or enum-components approaches.
                You may see the corresponding benchmarks <Link text="here" href="https://github.com/orxfun/orx-meta/tree/main/benches" />.
            </p>

            <p>Further, being memory efficient and not requiring heap allocation might make it beneficial for embedded applications.</p>



            <h3 style={{ textAlign: 'left', paddingLeft: '1rem' }}>B. Tool to deal with Custom Requirements, <code>Criteria</code> Example</h3>

            <p>This is the main goal.</p>

            <p>
                Assume that we are maintaining a performance-critical tool with with, say, <code>5</code> features.
                We want our tool to be useful for as many use cases as possible.
                Every use case requires a different subset of our features.
                There exist <code>2^5-1 = 31</code> potential use cases.
                How can we cover them all?
            </p>

            <p>
                We will not have fun if we need to manually combine the features;
                or if we lose performance due to abstraction.
            </p>

            <p>On the other hand, if we can define the composition of these features using a statically-typed queue:</p>

            <div className="seq">
                <div>We can work on and maintain each feature in isolation.</div>
                <div>
                    Implementing the <code>6</code>-th feature allows us cover <code>32</code> more potential use cases,
                    making it well-worth the effort.
                </div>
                <div>And we will have access to all combinations of these features without any manual work and without loss of performance.</div>
            </div>

            <p>
                Recall the example for evaluating vehicle tours, where we implemented three criteria.
                The following demonstrates how we can use them in four different use cases.
            </p>

            <Code code={criteriaCombinations} />









            <h2>Summary</h2>

            <p>This pattern is powerful for composing zero-cost abstractions.</p>

            <p>Although, having to know types of elements in compile time limits its use cases, there are situations that we can benefit from it.</p>

            <p>Especially in performance critical programs since it allows us to avoid dynamic dispatch, heap allocation and run-time branching all together.</p>


            <p>
                I first started experimenting with GATs for composing business constraints and objectives for a performance-critical route optimization library.
                If you are interested, you may check a relevant <Link text="talk" href="https://orxfun.github.io/talk-composing-zero-cost-abstractions-in-route-optimization/" />&nbsp;
                discussing the importance of zero cost composition.
                It seems to be the solution to achieve a <span className="inline-emphasis">performant, extensible and maintainable solution at the same time</span>.
                The generalization led to the queue explained here, and seems like I will be using it more for algorithm abstractions such as the local search.
            </p>

            <p>
                The approach is still new, at least to me.
                Feel free to contact <Link text="me" href="mailto:orx.ugur.arikan@gmail.com" /> to share your thoughts and experiences
                (and certainly contact me if you find a macro-free solution 🫶).
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
    queue => [ StScreen; ScreenSimple, Screen ];
);

impl<F: Draw> Draw for ScreenSimple<F> {
    // identity: just draw the single element
    fn draw(&self) {
        self.f.draw();
    }
}

impl<F: Draw, B: StScreen> Draw for Screen<F, B> {
    // composition: draw them both
    fn draw(&self) {
        self.f.draw();
        self.b.draw();
    }
}

let screen = Screen::new(Button::new(3, 4, "home".to_string()))
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
    type PushBack<Elem>: StScreen
    where
        Elem: Draw;

    type Front: Draw;

    type Back: StScreen;

    const LEN: usize;

    fn push<Elem>(self, element: Elem) -> Self::PushBack<Elem>
    where
        Elem: Draw;

    fn len(&self) -> usize {
        Self::LEN
    }

    fn front(&self) -> &Self::Front;
}

// single-element queue
struct ScreenSingle<F: Draw> {
    front: F,
}

impl<F: Draw> StScreen for ScreenSingle<F> {
    type PushBack<Elem>
        = Screen<F, ScreenSingle<Elem>>
    where
        Elem: Draw;

    type Front = F;

    type Back = Self;

    const LEN: usize = 1;

    fn push<Elem>(self, element: Elem) -> Self::PushBack<Elem>
    where
        Elem: Draw,
    {
        Screen {
            front: self.front,
            back: ScreenSingle { front: element },
        }
    }

    fn front(&self) -> &Self::Front {
        &self.front
    }
}

// multiple-element queue
struct Screen<F: Draw, B: StScreen> {
    front: F,
    back: B,
}

impl<F: Draw, B: StScreen> StScreen for Screen<F, B> {
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
            front: self.front,
            back: self.back.push(element),
        }
    }

    fn front(&self) -> &Self::Front {
        &self.front
    }
}

impl<F: Draw> Screen<F, ScreenSingle<F>> {
    pub fn new(element: F) -> ScreenSingle<F> {
        ScreenSingle { front: element }
    }
}


// remaining is same as above

impl<F: Draw> Draw for ScreenSimple<F> {
    // identity: just draw the single element
    fn draw(&self) {
        self.f.draw();
    }
}

impl<F: Draw, B: StScreen> Draw for Screen<F, B> {
    // composition: draw them both
    fn draw(&self) {
        self.f.draw();
        self.b.draw();
    }
}

let screen = Screen::new(Button::new(3, 4, "home".to_string()))
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


const exampleCriteria = `use std::collections::HashMap;

#[derive(PartialEq, Eq, Hash, Clone, Copy)]
pub struct City(usize);

pub struct Tour(Vec<City>);

#[derive(Default, Debug)]
pub struct Status {
    penalty_cost: u64,
    violations: Vec<String>,
}

pub trait Criterion {
    fn evaluate(&self, tour: &Tour, previous_status: Status) -> Status;
}

// distance

pub struct Distance {
    distances: HashMap<(City, City), u64>,
    penalty_per_km: u64,
}

impl Distance {
    fn new() -> Self {
        Distance {
            distances: [
                ((City(0), City(1)), 10), ((City(0), City(2)), 7), ((City(0), City(3)), 20),
                ((City(1), City(0)), 57), ((City(1), City(2)), 9), ((City(1), City(3)), 11),
                ((City(2), City(0)), 3), ((City(2), City(1)), 15), ((City(2), City(3)), 7),
                ((City(3), City(0)), 88), ((City(3), City(1)), 18), ((City(3), City(2)), 8),
            ]
            .into_iter()
            .collect(),
            penalty_per_km: 1,
        }
    }
}

impl Criterion for Distance {
    fn evaluate(&self, tour: &Tour, mut status: Status) -> Status {
        for (a, b) in tour.0.iter().zip(tour.0.iter().skip(1)) {
            let distance_km = self.distances.get(&(*a, *b)).unwrap();
            status.penalty_cost += self.penalty_per_km * distance_km;
        }
        status
    }
}

// capacity

pub struct Capacity {
    vehicle_capacity: u64,
    shipment_volumes: HashMap<City, i64>,
}

impl Capacity {
    fn new() -> Self {
        Self {
            vehicle_capacity: 10,
            shipment_volumes: [(City(0), 5), (City(1), 7), (City(2), -4), (City(3), -8)]
                .into_iter()
                .collect(),
        }
    }
}

impl Criterion for Capacity {
    fn evaluate(&self, tour: &Tour, mut status: Status) -> Status {
        let vehicle_capacity = self.vehicle_capacity as i64;
        let mut current_capacity = 0;
        for city in &tour.0 {
            let volume = self.shipment_volumes.get(city).unwrap();
            current_capacity += volume;
            if current_capacity > vehicle_capacity {
                let violation = format!(
                    "Capacity reached {} while vehicle capacity is {}.",
                    current_capacity, self.vehicle_capacity
                );
                status.violations.push(violation);
            }
        }
        status
    }
}

// precedence

pub struct Precedence {
    must_precede: Vec<(City, City)>,
    penalty_per_violation: u64,
}

impl Precedence {
    fn new() -> Self {
        Self {
            must_precede: vec![(City(2), City(0))],
            penalty_per_violation: 100,
        }
    }
}

impl Criterion for Precedence {
    fn evaluate(&self, tour: &Tour, mut status: Status) -> Status {
        for (a, b) in &self.must_precede {
            let pos_a = tour.0.iter().position(|x| x == a).unwrap();
            let pos_b = tour.0.iter().position(|x| x == b).unwrap();
            if pos_a > pos_b {
                status.penalty_cost += self.penalty_per_violation;
                let violation = format!("Precedence {}->{} is violated.", a.0, b.0);
                status.violations.push(violation);
            }
        }
        status
    }
}

// COMPOSITION

orx_meta::define_queue!(
    elements => [ Criterion ];
    queue => [ StCriteria; CriteriaSingle, Criteria ];
);

impl<F: Criterion> Criterion for CriteriaSingle<F> {
    // identity: evaluate wrt the single criterion
    fn evaluate(&self, tour: &Tour, status: Status) -> Status {
        self.f.evaluate(tour, status)
    }
}

impl<F: Criterion, B: StCriteria> Criterion for Criteria<F, B> {
    // composition: evaluate them both
    fn evaluate(&self, tour: &Tour, status: Status) -> Status {
        let status = self.f.evaluate(tour, status);
        self.b.evaluate(tour, status)
    }
}

// example

let tour = Tour(vec![City(0), City(1), City(2), City(3)]);

let criteria = Criteria::new(Distance::new())
    .push(Capacity::new())
    .push(Precedence::new());

let status = criteria.evaluate(&tour, Status::default());

println!("{status:?}");

// prints out:
// Status { penalty_cost: 126, violations: ["Capacity reached 12 while vehicle capacity is 10.", "Precedence 2->0 is violated."] }`;


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
    queue => [ StScreen; ScreenSingle, Screen ];
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


const startupTraitObjects = `// # json file
[
    {
        "type": "Button",
        "width": 3,
        "height": 4,
        "label": "home"
    },
    {
        "type": "Button",
        "width": 5,
        "height": 4,
        "label": "about"
    },
    {
        "type": "SelectBox",
        "width": 5,
        "height": 4,
        "options": [
            "one"
        ]
    },
    {
        "type": "Button",
        "width": 6,
        "height": 6,
        "label": "login"
    }
]
    
// # start up code (trait objects)

fn new_screen() -> Vec<Box<dyn Draw>> {
    let data = std::fs::read_to_string("path").unwrap();
    serde_json::from_str(&data).unwrap()
}
`;


const startupQueue = `// # start up code (statically-typed queue)

fn new_screen() -> impl Draw {
    Screen::new(Button {
        width: 3,
        height: 4,
        label: "home".to_string(),
    })
    .push(Button {
        width: 5,
        height: 4,
        label: "about".to_string(),
    })
    .push(SelectBox {
        width: 5,
        height: 4,
        options: vec!["one".to_string()],
    })
    .push(Button {
        width: 6,
        height: 6,
        label: "login".to_string(),
    })
}`;


const criteriaCombinations = `fn use_case1() {
    println!("# Use case with criteria [Distance]");
    let tour = Tour(vec![City(0), City(1), City(2), City(3)]);

    let criteria = Criteria::new(Distance::new());
    let status = criteria.evaluate(&tour, Status::default());
    println!("{status:?}");
}

fn use_case2() {
    println!("# Use case with criteria [Distance, Precedence]");
    let tour = Tour(vec![City(0), City(1), City(2), City(3)]);

    let criteria = Criteria::new(Distance::new()).push(Precedence::new());
    let status = criteria.evaluate(&tour, Status::default());
    println!("{status:?}");
}

fn use_case3() {
    println!("# Use case with criteria [Distance, Capacity]");
    let tour = Tour(vec![City(0), City(1), City(2), City(3)]);

    let criteria = Criteria::new(Distance::new()).push(Capacity::new());
    let status = criteria.evaluate(&tour, Status::default());
    println!("{status:?}");
}

fn use_case4() {
    println!("# Use case with criteria [Distance, Capacity, Precedence]");
    let tour = Tour(vec![City(0), City(1), City(2), City(3)]);

    let criteria = Criteria::new(Distance::new())
        .push(Capacity::new())
        .push(Precedence::new());
    let status = criteria.evaluate(&tour, Status::default());
    println!("{status:?}");
}`;
