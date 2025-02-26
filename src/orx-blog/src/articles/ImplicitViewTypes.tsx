import { Article } from "../pages/Article";
import { Code } from "./Code";
import { Link } from "./Link";

const path = '/implicit-view-types-2025-02-26';
const title = 'View Types, but Implicit Please';
const date = '2024-02-26';
const summary = 'ergonomics perspective on view types'

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
                This article discusses from a user ergonomics perspective the suggestion presented in the
                &nbsp;<Link text="view-types-redux" href="https://smallcultfollowing.com/babysteps/blog/2025/02/25/view-types-redux/" />&nbsp;
                blogpost by Nicholas Matsakis.
            </p>

            <p>
                Subjective to, and limited to, how I use rust, the discussion is separated into two view points:
                (i) application developer and (ii) library maintainer.
                Application developer aims to solve a specific problem of a known use case.
                Library maintainer, on the other hand, aims to help people solve problems which is not necessarily completely known to the developer.
            </p>

            <h2>The Problem</h2>

            Firstly, the following is an example situation of the problem that is described in the blogpost.

            <Code code={problem} />

            <p>
                This is a great observation and summary of the problem we frequently stumble upon.
                Hoping that we will be able to write this code with the view types suggestion.
            </p>

            <p>
                Just to clarify why this code actually is okay,
                we immutably borrow the <code>experiments</code> field and mutably borrow the <code>successful</code> field.
                Therefore, this code is not doing something violating memory safety, or not even something wrong which is as important in many situations.
            </p>

            <h2>The Solution with View Types</h2>

            The recommended solution involves using view types in three of the methods as follows.

            <Code code={viewTypesSolution} />

            <p>
                Notice the changes in the <code>self</code> arguments of the methods.
                We explicitly mention the fields that are used, mutably or not.
            </p>

            <p>
                You may see from the comments that we do not need a shared and mutable reference of any of the fields simultaneously.
                Therefore, this code is just fine and <code>count_successful_experiments</code> now compiles.
            </p>

            <p>
                This seems to be an explicit and exact solution to the problem we are facing an it is great to see the <i>proposal</i>.
            </p>

            <p>
                However, there might be concerns on the ergonomics that we love and appreciate.
            </p>

            <h2>The Problem, Revisited, Simplified</h2>

            <p>
                Let <code>m(i)</code> be the i-th method of a type which requires a shared or mutable reference to <code>self</code>.
            </p>

            <p>
                Let <code>self_ref(i)</code> be either <code>&self</code> or <code>&mut self</code> depending on the current rust method
                signature.
            </p>

            <p>
                Finally, let <code>ref_fields(i)</code> be the set of fields that are used as a shared reference in the i-th method,
                and <code>mut_fields(i)</code> be those fields that are mutated.
                Notice that these sets are as defined in the original blogpost.
            </p>

            <p>
                Note the relation:
            </p>

            <div className="seq">
                <div>
                    <code>self_ref(i)</code> is <code>&self</code> iff <code>mut_fields(i) = ∅</code>;
                </div>

                <div>
                    <code>self_ref(i)</code> is <code>&mut self</code> otherwise.
                </div>
            </div>

            <p>
                A simplified definition of the problem would be to know the pairwise compatibility of two methods.
                More precisely, given two methods <code>f</code> and <code>g</code>, can we know whether or not it is okay
                to call these methods simultaneously?
                Let's call this magic function <code>is_compatible(f, g)</code> which answers this question.
            </p>

            <p>
                Note that in the current rust, without the recommended view-types, we have:
            </p>
            <div className="seq">
                <div>
                    <code>is_compatible_old(m(i), m(j))</code> is true iff both <code>self_ref(i) = &self</code> and <code>self_ref(i) = &self</code>,
                </div>
            </div>

            <p>
                With this definition, <code>is_compatible_old(experiment_names, add_successful)</code> would return false, and hence,
                the <code>count_successful_experiments</code> method doesn't compile today.
            </p>

            <p>
                As described in the blogpost, we can have a straightforward re-definition of this function using view types.
            </p>

            <div className="seq">
                <div>
                    <code>is_compatible(m(i), m(j))</code> is true iff <code>ref_fields(i) ∩ mut_fields(j) = ∅</code> and <code>mut_fields(i) ∩ ref_fields(j) = ∅</code>,
                </div>
            </div>

            <p>
                Notice that we have a much weaker requirement for <code>is_compatible</code> to be true.
                However, it is strong enough to be correct.
                It actually allows to define the weakest requirement to be correct.
            </p>

            <p>
                This is awesome!
                Less correct code to be treated as incorrect.
            </p>

            <p>
                As described in the example, the new condition would allow the <code>count_successful_experiments</code> method.
            </p>

            <h2>Concerns on Complexity</h2>

            <p>
                The problem definition and recommended solution both seem great.
                However, there might be concerns on the ergonomics and possibility of adding complexity to the language.
            </p>

            <p>
                <span className="inline-emphasis">Firstly</span>, assume that we are developing an application to address a particular known problem where we are working on a relatively
                higher level where we are not required to focus on micro performance optimizations.
            </p>

            <p>
                I love using rust in such use cases as it allows for very expressive implementations.
            </p>

            <p>
                On such situations, we avoid <code>mut</code> keyword as much as possible.
                This brings so many benefits.
                The code becomes more expressive and easier to follow.
                Implementation is much less error prone.
                As a side bonus, we may <code>pub</code>-reveal all the fields without the need to hide them in order to be cautious against mutations.
            </p>

            <p>
                And notice that current implementation of the <code>is_compatible_old</code> suffices here since it always return true if we never use <code>&mut self</code> methods.
                The focused problem is completely absent for the pure programmer (◑‿◐).
            </p>

            <p>
                I would be very happy if we can write exactly the same code after a potential addition of view types.
            </p>

            <p>
                <span className="inline-emphasis">Secondly</span>, assume that we are maintaining a complex data structure.
                We will be using <code>mut</code> in our implementations and we will expose <code>&mut self</code> methods in the api.
                The discussed problem and the solution with the view types might be much more crucial here.
            </p>

            <p>
                Our goal is to provide useful methods to support relevant use cases.&nbsp;
                <span className="inline-emphasis">However, we do not have access to all use cases, so we do not know which methods will be used together.</span>&nbsp;
                More specifically, we do not know for which pairs the compiler will call <code>is_compatible</code>.
            </p>

            <p>
                As a good maintainer, we would do our best to enable correct code to compile.
                This might push us to define view types for every method.
            </p>

            <p>
                Although, I like the explicitness in the signature,
                I think <code>fn add_successful(self: &mut &#123;successful&#125; Self)</code> is a more complex signature
                than <code>fn add_successful(&mut self)</code>, which is good enough in most of the cases.
            </p>

            <p>
                From a different point of view, as a consumer of the type, in most of the cases it is simpler, nicer and less
                exhausting to think of the instance of the type as <strong>one whole thing</strong>.
            </p>

            <h2>Could View Types be Implicit?</h2>

            <p>
                Could we have both the exactness of view types and simplicity of the current <code>&self</code> and <code>&mut self</code> signatures?
            </p>

            <p>
                Could the compiler implicitly figure out the view types from the implementation of the method so that
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

            <h2>Conclusion</h2>

            <p>
                I am very happy that this problem is in the focus.
                Some developers consider rust to be a complex language with a steep learning curve.
                And correct code that is rejected by the compiler might be one of the reasons of this perception.
                However, it keeps getting better and view types seem to be very promising in this regard.
            </p>

            <p>
                I would only hope that we don't compromise the ergonomics of rust that we love  ❤️<img src="https://rustacean.net/assets/rustacean-orig-noshadow.png" height="15px" />.
            </p>

            <div className="side-note">
                We enjoy every keyword that doesn't enter rust.
            </div>

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
        if is_successful(data.for_experiment(n)) { // => immutable borrow of 'experiments' occurs here
            data.add_successful(); // => mutable borrow of 'successful' occurs here
        }
    }
    // we are fine (￣ー￣)ｂ
}`;

const isCompatible = ``