import Link from "next/link";
import { FlexboxSpacer } from "components/FlexboxSpacer";
import { AutoTypingResume } from "home/AutoTypingResume";

export const Hero = () => {
  return (
    <section className="lg:flex lg:h-[825px] lg:justify-center">
      <FlexboxSpacer maxWidth={75} minWidth={0} className="hidden lg:block" />
      <div className="mx-auto max-w-xl pt-8 text-center lg:mx-0 lg:grow lg:pt-32 lg:text-left">
        <h1 className="text-primary pb-2 text-4xl font-bold lg:text-5xl">
          Create a professional
          <br />
          resume easily with AI
        </h1>
        <p className="mt-3 text-lg text-secondary-fg lg:mt-5 lg:text-xl">
          Build tailored, ATS-friendly resumes with ease using our AI-powered,
          open-source resume builder.
        </p>
        <Link href="/resume-import" className="btn-primary mt-6 lg:mt-14">
          Create Resume <span aria-hidden="true">→</span>
        </Link>
  <p className="ml-6 mt-3 text-sm text-tertiary-fg">No sign up required</p>
        {/* Parser CTA hidden for now */}
      </div>
      <FlexboxSpacer maxWidth={100} minWidth={50} className="hidden lg:block" />
      <div className="mt-6 flex justify-center lg:mt-4 lg:block lg:grow">
        <AutoTypingResume />
      </div>
    </section>
  );
};
