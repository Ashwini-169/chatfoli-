import { Link } from "components/documentation";

const QAS = [
  {
    question:
      "Q1. What is a resume builder? Why resume builder is better than resume template doc?",
    answer: (
      <>
        <p>
          There are two ways to create a resume today. One option is to use a
          resume template, such as an office/google doc, and customize it
          according to your needs. The other option is to use a resume builder,
          an online tool that allows you to input your information and
          automatically generates a resume for you.
        </p>
        <p>
          Using a resume template requires manual formatting work, like copying
          and pasting text sections and adjusting spacing, which can be
          time-consuming and error-prone. It is easy to run into formatting
          issues, such as using different bullet points or font styles after
          copying and pasting. On the other hand, a resume builder like
              ChatFolio saves time and prevents formatting mistakes by
          automatically formatting the resume. It also offers the convenience of
          easily changing font types or sizes with a simple click. In summary, a
          resume builder is easier to use compared to a resume template.
        </p>
      </>
    ),
    },
    {
      question:
      "Q2. What features and principles make ChatFolio different from other resume builders and templates?",
      answer: (
      <>
        <p>
        ChatFolio focuses on practical, privacy-first resume creation for job
        seekers. Instead of exposing every possible customization, it provides
        a small set of well-considered features that produce clean, ATS‑friendly
        resumes out of the box.
        </p>
        <ul className="list-disc pl-5">
        <li>
          <strong>Privacy‑first:</strong> All data stays in your browser — no
          signup or server storage required.
        </li>
        <li>
          <strong>ATS‑optimized defaults:</strong> Single‑column layouts,
          clear section headings, and consistent date/format rules to improve
          parsing by applicant tracking systems.
        </li>
        <li>
          <strong>AI‑assisted drafting:</strong> Helpful suggestions and the
          ability to prefill fields using the integrated AI chat while keeping
          all inputs fully editable.
        </li>
        <li>
          <strong>Local PDF export:</strong> Generate downloadable PDFs
          client‑side so your resume never needs to leave your machine.
        </li>
        </ul>
        <p>
        These focused design choices keep the app simple, reduce bias risk,
        and help users produce professional resumes quickly.
        </p>
      </>
      ),
    },
        
  
  
  {
    question: "Q3. Who created ChatFolio and why?",
    answer: (
      <p>
        ChatFolio was created by <Link href="https://github.com/ashwini-169">Ashwini
        Kumar</Link> as an AI assignment project. As early-career professionals in
        India, we made many mistakes when creating our first resumes and
        applying for internships and jobs. It took time to learn the hiring
        market expectations and resume best practices. While mentoring college
        students and reviewing resumes during placements and career events,
        we noticed the same recurring mistakes: unclear section headings, poor
        keyword coverage for ATS, inconsistent date formats, and unfocused
        bullet points.

        That experience motivated us to build a simple, privacy-first tool that
        encodes regional and ATS-friendly best practices. We began collaborating
        over weekends and integrated our learnings into ChatFolio. Our goal is
        to help candidates across India create clear, modern, and ATS-optimized
        resumes so they can apply with confidence.
      </p>
    ),
  },
  {
  question: "Q4. How can I support ChatFolio?",
    answer: (
      <>
        <p>
            The best way to support ChatFolio is to share your thoughts and
          feedback with us to help further improve it. You can send us an email
          at{" "}
            <Link href="mailto:hello@chatfolio.org">hello@chatfolio.org</Link>{" "}
          or{" "}
          <Link href="https://github.com/ashitwini-169/">
            open an issue
          </Link>{" "}
          at our Github repository. Whether you like it or not, we would love to
          hear from you.
        </p>
        <p>
      Another great way to support ChatFolio is by spreading the words.
          Share it with your friends, on social media platforms, or with your
          school’s career center. Our goal is to reach more people who struggle
          with creating their resume, and your word-of-mouth support would be
          greatly appreciated. If you use Github, you can also show your support
          by{" "}
          {/*
            <Link href="https://github.com/ashwini-169/">
            </Link>{" "}
          */}giving the project a star
          to help increase its popularity and reach.
        </p>
      </>
    ),
  },
];

export const QuestionsAndAnswers = () => {
  return (
    <section className="mx-auto max-w-3xl divide-y divide-border-color lg:mt-4 lg:px-2">
      <h2 className="text-center text-3xl font-bold text-primary-fg">Questions & Answers</h2>
      <div className="mt-6 divide-y divide-border-color">
        {QAS.map(({ question, answer }) => (
          <div key={question} className="py-6">
            <h3 className="font-semibold leading-7 text-primary-fg">{question}</h3>
            <div className="mt-3 grid gap-2 leading-7 text-secondary-fg">
              {answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
