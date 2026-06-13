import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface Faq3Props {
  heading?: string;
  description?: string;
  items?: FaqItem[];
}

const faqItems = [
  {
    id: "faq-1",
    question: "What is VulnLens?",
    answer:
      "VulnLens is an instant security vulnerability scanner that checks web URLs and GitHub repositories for misconfigurations, CORS errors, XSS vectors, cookie flag exposures, SSL/TLS handshake issues, and vulnerable package dependencies.",
  },
  {
    id: "faq-2",
    question: "How does the dependency audit scanner work?",
    answer:
      "For public GitHub repositories, VulnLens parses the package.json file to extract top dependencies and checks them in real-time against OSV.dev (the open source vulnerability database) to flag packages with known CVEs.",
  },
  {
    id: "faq-3",
    question: "Is there an API key required for scans?",
    answer:
      "No! VulnLens checks security headers, client-side scripts, and queries the OSV.dev API directly without requiring any login credentials, signup, or API keys.",
  },
  {
    id: "faq-4",
    question: "How is the risk score calculated?",
    answer:
      "Findings are weighted based on industry severity standards (Critical: 30, High: 15, Medium: 8, Low: 3, Info: 0). The aggregate risk score is calculated and capped at 100, which maps to a final Risk Level (Secure, Moderate, High, Critical).",
  },
  {
    id: "faq-5",
    question: "Can I download or share my security scan results?",
    answer:
      "Yes. Every scan creates a shareable link that links back to that specific report, generates a markdown security badge for your repository's README, and allows downloading a fully styled offline HTML report.",
  },
  {
    id: "faq-6",
    question: "Does VulnLens generate code-level fixes?",
    answer:
      "Absolutely. For headers, cookie flags, CORS configuration, and XSS issues, VulnLens suggests specific code configuration fixes (e.g. Next.js config, Express.js CORS middleware, Nginx rules) that you can copy directly from the finding card.",
  }
];

const Faq3 = ({
  heading = "Frequently asked questions",
  description = "Find answers to common questions about the VulnLens security scanner.",
  items = faqItems,
}: Faq3Props) => {
  return (
    <section style={{ padding: "80px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "48px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "center" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 400, fontFamily: "Google Sans", letterSpacing: "-0.5px" }}>
            {heading}
          </h2>
          <p style={{ color: "#5f6368", fontSize: "15px", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>{description}</p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="w-full flex flex-col gap-4"
        >
          {items.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="border-none"
              style={{
                background: "#f8f9fa",
                borderRadius: "12px",
                overflow: "hidden",
                padding: "8px 24px",
                transition: "all 0.2s"
              }}
            >
              <AccordionTrigger 
                className="hover:no-underline hover:opacity-80 transition-opacity" 
                style={{ 
                  fontFamily: "Google Sans", 
                  fontSize: "16px", 
                  fontWeight: 500,
                  border: "none",
                  padding: "16px 0"
                }}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent 
                style={{ 
                  fontSize: "14px", 
                  color: "#5f6368", 
                  lineHeight: 1.6,
                  paddingBottom: "16px"
                }}
              >
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export { Faq3 };
