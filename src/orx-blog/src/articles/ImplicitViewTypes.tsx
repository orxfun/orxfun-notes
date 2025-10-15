import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/implicit-view types-2025-02-26';
const title = 'Implicit View Types';
const date = '2025-02-26';
const summary = 'complexity perspective on view types'

export const PageMetaImplicitViewTypes = () => {
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
                This article discusses from a user perspective, the view types suggestion presented in the
                &nbsp;<Link text="view types-redux" href="https://smallcultfollowing.com/babysteps/blog/2025/02/25/view-types-redux/" />&nbsp;
                blogpost by Nicholas Matsakis.
            </p>

            <p>
                Subjective and limited to how I use rust, I tried to imagine and understand the impact of view types
                while I am developing an application or maintaining a general purpose library.
            </p>

            <h2>The Problem</h2>

            The following is an example situation of the problem that is described in the blogpost.

            <Code code={problem} />

            <p>
                This is a great observation pinpointing a very common problem we experience.
            </p>

            <p>
                This code doesn't compile today, but it will hopefully compile with the recommended view types 🤞
            </p>

            <p>
                It is explained clearly in the blogpost but to briefly mention why this code is actually okay:
            </p>


            <div className="seq">
                <div>
                    We mutably borrow the <code>successful</code> field while we are using a shared reference to the <code>experiments</code> field.
                </div>

                <div>
                    Therefore, this code block in this form does not violate borrow rules and is not likely to cause mutation related bugs.
                </div>
            </div>

            <h2>The Solution with View Types</h2>

            The recommended solution involves using view types in method signatures as follows.

            <Code code={viewTypesSolution} />

            <p>
                Notice the changes in the <code>self</code> arguments of the methods.
            </p>

            <div className="emphasis">
                We explicitly mention the fields that are used, and how they are used, mutably or not.
            </div>

            <p>
                You may see from the comments that we do not use a shared and mutable reference (or multiple mutable references) to any of the fields simultaneously.
                This code is just fine and <code>count_successful_experiments</code> can now happily compile thanks to view types!
            </p>

            <p>
                This seems to be an explicit and exact solution to the problem we are facing, and it is exciting to see this <i>proposal</i>.
            </p>

            <h2>The Problem, Revisited, Simplified</h2>

            <p>
                Below are some simplified definitions to help compare the current approach and the potential new approach with view types.
            </p>

            <p>
                Let <code>f</code>, <code>g</code>, ... be all methods of one particular type which require a shared or mutable reference to <code>self</code>.
            </p>

            <p>
                Let <code>self_ref(f)</code> be either <code>&self</code> or <code>&mut self</code> depending on the current rust method
                signature of method <code>f</code>.
            </p>

            <p>
                Finally, let <code>ref_fields(f)</code> be the set of fields that are used as a shared reference in method <code>f</code>,
                and <code>mut_fields(f)</code> be the set of those that are mutated.
                Notice that these sets are as defined with the view types in the blogpost, and hence, assumed to be available
                in the new version.
            </p>

            <p>
                Note the relation:
            </p>

            <div className="seq">
                <div>
                    <code>self_ref(f)</code> is <code>&self</code> iff <code>mut_fields(f) = ∅</code>;
                </div>

                <div>
                    <code>self_ref(f)</code> is <code>&mut self</code> otherwise.
                </div>
            </div>

            <p>
                A simplified definition of the problem would be to know the pairwise compatibility of methods.
            </p>

            <p>
                More precisely, given two methods <code>f</code> and <code>g</code>, can we know whether or not it is okay
                to call these methods simultaneously?
                Let's call this magic function <code>is_compatible(f, g)</code> which answers this question.
            </p>

            <p>
                Note that in the current rust, without the recommended view types, we have:
            </p>
            <div className="seq">
                <div>
                    <code>is_compatible_old(f, g)</code> is true iff both <code>self_ref(f) = &self</code> and <code>self_ref(g) = &self</code>,
                </div>
            </div>

            <p>
                With this definition, <code>is_compatible_old(experiment_names, add_successful)</code> would return false.
                As we see that the <code>count_successful_experiments</code> method doesn't compile today.
            </p>

            <p>
                Using the recommended view types, we can have a straightforward re-definition of this function.
            </p>

            <div className="seq">
                <div>
                    <code>is_compatible(f, g)</code> is true iff&nbsp;
                    <ul>
                        <li><code>mut_fields(f) ∩ (ref_fields(g) ∪ mut_fields(g)) = ∅</code> and</li>
                        <li><code>(ref_fields(f) ∪ mut_fields(f)) ∩ mut_fields(g) = ∅</code>.</li>
                    </ul>
                </div>
            </div>

            <p>
                Notice that we have a <span className="inline-emphasis">much weaker requirement</span> for <code>is_compatible</code> to be true.
                Yet, it is strong enough to be correct.
            </p>

            <p>
                This is awesome!
                Less correct code to be marked as incorrect.
            </p>

            <p>
                As described in the example, the new condition would allow the <code>count_successful_experiments</code> method to compile.
            </p>

            <p>
                In the following, I tried to imagine how this could affect the development experience apart from the benefit shown here.
            </p>

            <h2>Concerns on Complexity</h2>

            <p>
                The problem definition and recommended solution both seem great.
                However, there might be concerns on adding complexity.
                Limited to my experience and use cases, I tried to imagine the impact in two different scenarios.
            </p>

            <h3>Developing an Application</h3>

            <p>
                <span className="inline-emphasis">Firstly</span>, assume that we are developing an application to address a particular business problem
                where we are working on a relatively high level.
            </p>

            <p>
                In such use cases, we enjoy rust's default design choices and expressiveness.
            </p>

            <p>
                We avoid <code>mut</code> keyword as much as possible.
                This brings so many benefits.
                The code becomes less error prone, more concise, more expressive that is easier to follow and reason about.
                As a side bonus, we may <code>pub</code>-reveal fields that we want without the anxiety of harmful mutations.
            </p>

            <p>
                Notice that current implementation of the <code>is_compatible_old</code> suffices here.
                If we never use <code>&mut self</code> methods, <code>is_compatible_old</code> always returns true.
            </p>

            <div className="side-note">
                The discussed problem is completely absent for the pure functional programmer (◑‿◐).
            </div>

            <p>
                In summary,
            </p>

            <div className="emphasis">
                There are use cases where this problem is not, or is less, significant.
            </div>

            <p>
                Therefore, it would be great if we can continue to develop these applications as convenient as we do today.
            </p>

            <h3>Maintaining a General Purpose Library</h3>

            <p>
                <span className="inline-emphasis">Secondly</span>, assume that we are maintaining a utility library or some data structure.
                We will likely use <code>mut</code> within the library code.
                Further, we will most likely expose useful <code>&mut self</code> methods in the api.
                The discussed problem and the solution with the view types might become very crucial here.
            </p>

            <p>
                Such cases often differ from the application code in that we do not have access to all use cases.
                We make methods available in the public api; however, we do not exactly know how these methods are used together in different
                use cases (although we might have some idea).
                More specifically, we do not know for which pairs the compiler will call <code>is_compatible</code> in applications
                that use our library.
            </p>

            <p>
                Let's focus on how we would develop the exposed <code>&mut self</code> methods differently than how we do today.
            </p>

            <p>
                We would of course do our best to make use of view types and prevent more of the false-error cases.
            </p>

            <p>
                Not knowing all the use patterns,
                this might push us to define view types for every accessed field in every exposed method.
            </p>

            <p>
                Then, we could lose benefits we get from bundling up smaller types to make a larger aggregate type.
                From the point of view of a consumer of the type:
            </p>

            <div className="emphasis">
                It is often nicer and simpler to think of an instance of the type as <strong>one whole thing</strong>,
                rather than considering its pieces.
            </div>

            <p>
                Further, our signatures might get complicated as I believe:
            </p>

            <div className="emphasis">
                <code>fn add_successful(self: &mut &#123;successful&#125; Self)</code><br />
                is significantly more complex than<br />
                <code>fn add_successful(&mut self)</code><br />
                which is often good enough.
            </div>

            <p>
                So could the view types <span className="inline-emphasis">somehow*</span> exist but not in the method signature?
            </p>

            <h2>Could View Types Exist Implicitly?</h2>

            <p>
                Could we have both the exactness of view types and simplicity of the current <code>&self</code> and <code>&mut self</code> signatures?
            </p>

            <p>
                Could the compiler implicitly figure out the view types from the implementation of the method so that:
            </p>

            <div className="seq">
                <div>
                    it correctly allows <code>count_successful_experiments</code> to compile,
                </div>

                <div>
                    and when there is a violation, it reveals the details of the view type signatures to pinpoint to the field
                    for which the borrow rules are violated?
                </div>
            </div>

            <p>
                Relevant to the type inference section of the blogpost,
                could the experience be <span className="inline-emphasis">somehow*</span> similar to closures?
            </p>

            <div className="seq">
                <div>
                    Our closures are strongly typed; however, we rarely type these types or look at the signatures.
                </div>
                <div>
                    We need to see the type signature only when we make a mistake and compiler pinpoints to the problem.
                </div>
                <div>
                    Similarly, could we not type and see the view types by default;
                    yet, they exist and they are available whenever we need them?
                </div>
            </div>

            <p>
                Might be asking too much :-)
            </p>

            <h2>Conclusion</h2>

            <p>
                I am excited to see that this problem is in the focus with a great recommendation.
                Some developers consider rust to be a complex language.
                Correct code that is rejected by the compiler is likely to be contributing to this perception.
            </p>

            <p>
                However, this situation keeps on getting better.
                And view types seem to be an exciting suggestion, promising further significant improvements.
                Looking forward to it ❤️<img src="https://rustacean.net/assets/rustacean-orig-noshadow.png" height="15px" />
            </p>

            <div className="end-space"></div>
        </>
    );
}

const problem = `use std::collections::HashMap;

struct Data {
    experiments: HashMap<String, Vec<f32>>,
    successful: u32,
}

impl Data {
    fn experiment_names(&self) -> impl Iterator<Item = &String> {
        self.experiments.keys()
    }

    fn for_experiment(&self, experiment: &str) -> &[f32] {
        match self.experiments.get(experiment) {
            Some(x) => x,
            None => &[],
        }
    }

    fn add_successful(&mut self) {
        self.successful += 1;
    }
}

fn is_successful(data_points: &[f32]) -> bool {
    true
}

fn count_successful_experiments(data: &mut Data) {
    for n in data.experiment_names() { // => immutable borrow occurs here!
        if is_successful(data.for_experiment(n)) {
            data.add_successful(); // => mutable borrow occurs here
        }
    }
}`;

const viewTypesSolution = `use std::collections::HashMap;

struct Data {
    experiments: HashMap<String, Vec<f32>>,
    successful: u32,
}

impl Data {
    fn experiment_names(& {experiments} self) -> impl Iterator<Item = &String> {
        self.experiments.keys()
     }
 

    fn for_experiment(& {experiments} self, experiment: &str) -> &[f32] {
        match self.experiments.get(experiment) {
            Some(x) => x,
            None => &[],
        }
    }

    fn add_successful(self: &mut {successful} Self) {
        self.successful += 1;
    }
}

fn is_successful(data_points: &[f32]) -> bool {
    true
}

fn count_successful_experiments(data: &mut Data) {
    for n in data.experiment_names() { // => immutable borrow of 'experiments' occurs here
        if is_successful(data.for_experiment(n)) {
            data.add_successful(); // => mutable borrow of 'successful' occurs here
        }
    }
    // we are fine (￣ー￣)ｂ
}`;
