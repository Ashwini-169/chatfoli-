import Image from "next/image";
import featureFreeSrc from "public/assets/feature-free.svg";
import featureUSSrc from "public/assets/feature-us.svg";
import featurePrivacySrc from "public/assets/feature-privacy.svg";
import featureOpenSourceSrc from "public/assets/feature-open-source.svg";
import { Link } from "components/documentation";

const FEATURES = [
  {
    src: featureFreeSrc,
    title: "Free Forever",
    text: "OpenResume is built with the belief that everyone in India should have free and easy access to a modern AI-powered resume builder.",
  },
  {
    src: featureUSSrc,
    title: "Indian Job Market Ready",
    text: "OpenResume follows best practices for the Indian job market, supporting formats and details preferred by top Indian employers and job portals like Naukri and LinkedIn.",
  },
  {
    src: featurePrivacySrc,
    title: "Privacy First",
    text: "OpenResume keeps your data local in your browser, ensuring only you have access and full control over your resume information.",
  },
  {
    src: featureOpenSourceSrc,
    title: "Open-Source & AI Powered",
    text: (
      <>
        OpenResume is open-source and uses AI to help you build your resume faster.
        View the source code or contribute on its{" "}
        <Link href="https://github.com/ashwini-169/open-resume-main">
          GitHub repository
        </Link>
        .
      </>
    ),
  },
];

export const Features = () => {
  return (
    <section className="py-16 lg:py-36">
      <div className="mx-auto lg:max-w-4xl">
        <dl className="grid grid-cols-1 justify-items-center gap-y-8 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-16">
          {FEATURES.map(({ src, title, text }) => (
            <div className="px-2" key={title}>
              <div className="relative w-96 self-center pl-16">
                <dt className="text-2xl font-bold text-primary-fg">
                  <Image
                    src={src}
                    className="absolute left-0 top-1 h-12 w-12"
                    alt="Feature icon"
                  />
                  {title}
                </dt>
                <dd className="mt-2 text-secondary-fg">{text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
