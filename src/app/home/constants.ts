import {
  initialEducation,
  initialProfile,
  initialProject,
  initialWorkExperience,
} from "lib/redux/resumeSlice";
import type { Resume } from "lib/redux/types";
import { deepClone } from "lib/deep-clone";

export const END_HOME_RESUME: Resume = {
  profile: {
    name: "Amit Sharma",
    summary:
      "Senior Software Engineer with 4+ years of experience building scalable backend services and cloud-native applications. Proven track record delivering microservices-based systems, improving performance, and driving automation. Strong in Java, Spring Boot, AWS, and system design — focused on measurable business impact and ATS-optimized resume content.",
    email: "amit.sharma@gmail.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, Karnataka, India",
    url: "linkedin.com/in/amit-sharma",
  },
  workExperiences: [
    {
      company: "Flipkart (Bengaluru)",
      jobTitle: "Software Engineer — Backend",
      date: "Jul 2021 - Present",
      descriptions: [
        "Built microservices with Java & Spring Boot handling >2M daily requests; improved API latency by 30%.",
        "Led AWS migration (ECS & RDS) and CI/CD automation, reducing deployment time by 60%.",
      ],
    },
    {
      company: "IBM India Pvt Ltd",
      jobTitle: "Software Engineer — Cloud Services",
      date: "Jun 2019 - Jun 2021",
      descriptions: [
        "Developed RESTful APIs and backend components in Java/Spring Boot for enterprise SaaS.",
        "Implemented Prometheus/Grafana monitoring, improving MTTR by 35%.",
      ],
    },
    {
      company: "IIT Bombay",
      jobTitle: "Research Intern",
      date: "Summer 2018",
      descriptions: [
        "Built an NLP prototype for document parsing and entity extraction; improved NER accuracy by 8%.",
        "Authored technical documentation and presented results to the research group.",
      ],
    },
  ],
  educations: [
    {
      school: "Indian Institute of Technology Bombay",
      degree: "Bachelor of Technology, Computer Science",
      date: "Jul 2015 - May 2019",
      gpa: "8.2/10",
      descriptions: [
        "Relevant coursework: Data Structures & Algorithms, Operating Systems, Distributed Systems, Databases, Machine Learning",
        "Recipient: Institute Merit Scholarship (2017)",
      ],
    },
  ],
  projects: [
    {
      project: "SmartResume — AI Resume Parser (ATS Optimized)",
      date: "Dec 2022",
      descriptions: [
        "Built an AI-based resume parser to extract sections, keywords, and skills; achieved >90% field extraction accuracy on diverse Indian resume samples",
        "Optimized generated resumes for ATS by including job-specific keywords, clear section headings, and standardized date formats",
      ],
    },
  ],
  skills: {
    featuredSkills: [
      { skill: "Java", rating: 5 },
      { skill: "Spring Boot", rating: 5 },
      { skill: "AWS (ECS, RDS)", rating: 4 },
      { skill: "Docker & Kubernetes", rating: 4 },
      { skill: "PostgreSQL", rating: 4 },
      { skill: "React", rating: 3 },
    ],
    descriptions: [
      "Tech: Java, Spring Boot, Microservices, REST APIs, AWS, Docker, Kubernetes, PostgreSQL, Redis, CI/CD (Jenkins), Prometheus/Grafana",
      "Soft: Cross-functional collaboration, Problem solving, Mentoring, Agile/Scrum, Communication",
    ],
  },
  custom: {
    descriptions: [],
  },
};

export const START_HOME_RESUME: Resume = {
  profile: deepClone(initialProfile),
  workExperiences: END_HOME_RESUME.workExperiences.map(() =>
    deepClone(initialWorkExperience)
  ),
  educations: [deepClone(initialEducation)],
  projects: [deepClone(initialProject)],
  skills: {
    featuredSkills: END_HOME_RESUME.skills.featuredSkills.map((item) => ({
      skill: "",
      rating: item.rating,
    })),
    descriptions: [],
  },
  custom: {
    descriptions: [],
  },
};
