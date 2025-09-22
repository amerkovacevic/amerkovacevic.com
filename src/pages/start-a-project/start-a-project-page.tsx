import { FormEvent, useState } from "react";
import { Mail, Phone, Sparkles, TriangleAlert } from "lucide-react";

import { PageHero, PageSection } from "../../shared/components/page";

export default function StartAProjectPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recipientEmail = "amerkovacevic99@gmail.com";
  const emailJsEndpoint = "https://api.emailjs.com/api/v1.0/email/send";
  const emailJsServiceId =
    import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_g7if0xb";
  const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const buttonBaseClasses =
    "inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-brand-sm transition-transform duration-300";
  const buttonHoverClasses = "hover:-translate-y-0.5 hover:shadow-brand";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const company = (formData.get("company") as string | null) ?? "";
    const companyWebsite = (formData.get("companyWebsite") as string | null) ?? "";
    const name = (formData.get("name") as string | null) ?? "";
    const email = (formData.get("email") as string | null) ?? "";
    const phone = (formData.get("phone") as string | null) ?? "";
    const timeline = (formData.get("timeline") as string | null) ?? "";
    const projectDetails = (formData.get("projectDetails") as string | null) ?? "";
    const extras = (formData.get("extras") as string | null) ?? "";

    const subjectPieces = ["New project inquiry", name].filter(Boolean);
    const subject = subjectPieces.join(" from ");

    const lines = [
      `Company: ${company}`,
      companyWebsite ? `Website: ${companyWebsite}` : null,
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      timeline ? `Ideal timeline: ${timeline}` : null,
      "", // spacer
      "Project details:",
      projectDetails,
      extras ? "\nAdditional context:\n" + extras : null,
    ].filter((line): line is string => Boolean(line));

    if (!emailJsTemplateId || !emailJsPublicKey) {
      console.error(
        "EmailJS template ID or public key missing. Please configure the environment variables.",
      );
      setStatus("error");
      setErrorMessage(
        "Something went wrong while preparing your request. Please email me directly.",
      );
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    const templateParams = {
      company,
      companyWebsite,
      name,
      email,
      phone,
      timeline,
      projectDetails,
      extras,
      subject,
      message: lines.join("\n"),
      recipientEmail,
      reply_to: email,
    };

    try {
      const response = await fetch(emailJsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          template_params: templateParams,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send email via EmailJS");
      }

      form.reset();
      setStatus("success");
    } catch (error) {
      console.error("Failed to send project request via EmailJS", error);
      setStatus("error");
      setErrorMessage(
        "We couldn't send your request automatically. Please email or call me directly.",
      );
    }
  };

  const inputClasses =
    "w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-brand-strong shadow-brand-sm placeholder:text-brand-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 dark:border-white/10 dark:bg-white/10 dark:text-brand-foreground";
  const isSending = status === "sending";
  const showFallbackContact = status === "error";

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow={
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            Start a project
          </>
        }
        title="Let's build a website that works as hard as you do"
        description="Share a few details about your company, the project you're dreaming about, and how to reach you. I'll follow up within two business days with next steps."
        align="center"
      />

      <PageSection
        title="Project brief"
        description="The more context you can share, the faster we can tailor a roadmap and an estimate."
        contentClassName="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Company name
              </span>
              <input
                name="company"
                type="text"
                required
                placeholder="AK Sales & Marketing"
                className={inputClasses}
                autoComplete="organization"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Company website
              </span>
              <input
                name="companyWebsite"
                type="url"
                placeholder="https://example.com"
                className={inputClasses}
                autoComplete="url"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Your name
              </span>
              <input
                name="name"
                type="text"
                required
                placeholder="Jane Contractor"
                className={inputClasses}
                autoComplete="name"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="amerkovacevic99@gmail.com"
                className={inputClasses}
                autoComplete="email"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Phone number
              </span>
              <input
                name="phone"
                type="tel"
                placeholder="3144436491"
                className={inputClasses}
                autoComplete="tel"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
                Ideal timeline
              </span>
              <input
                name="timeline"
                type="text"
                placeholder="Kickoff in June, launch by August"
                className={inputClasses}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
              What are you looking to build?
            </span>
            <textarea
              name="projectDetails"
              required
              rows={5}
              placeholder="Tell me about the services you offer, the goals for the site, and any inspiration you love."
              className={inputClasses + " min-h-[160px]"}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted dark:text-brand-subtle">
              Anything else I should know?
            </span>
            <textarea
              name="extras"
              rows={4}
              placeholder="Budget guidance, stakeholders, favorite sites, or questions you want answered."
              className={inputClasses + " min-h-[120px]"}
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isSending}
              className={`${buttonBaseClasses} ${
                isSending ? "cursor-not-allowed opacity-60" : buttonHoverClasses
              }`}
            >
              {isSending ? "Sending..." : "Send project request"}
            </button>
            {status === "success" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-strong shadow-brand-sm dark:border-brand/40 dark:bg-white/10 dark:text-brand-foreground">
                <Sparkles className="h-3 w-3" aria-hidden />
                Thanks! I'll be in touch shortly.
              </span>
            ) : null}
            {status === "error" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-red-600 shadow-brand-sm dark:border-red-500/40 dark:bg-white/10 dark:text-red-400">
                <TriangleAlert className="h-3 w-3" aria-hidden />
                {errorMessage ?? "Please reach out via email or phone."}
              </span>
            ) : null}
          </div>
        </form>

        {showFallbackContact ? (
          <aside className="surface-card flex flex-col gap-6 rounded-[2rem] border border-white/30 bg-white/70 p-6 text-sm text-brand-muted shadow-brand-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-brand-subtle">
            <div className="space-y-2 text-brand-strong dark:text-brand-foreground">
              <h3 className="font-display text-xl font-semibold">What happens next</h3>
              <p>
                Looks like the form couldn't send automatically. Reach out directly and we'll pick things up right away.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/80 px-4 py-3 text-brand-strong shadow-brand-sm dark:border-white/10 dark:bg-white/10 dark:text-brand-foreground">
                <Mail className="h-5 w-5 text-brand" aria-hidden />
                <a href={`mailto:${recipientEmail}`} className="hover:underline">
                  {recipientEmail}
                </a>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/80 px-4 py-3 text-brand-strong shadow-brand-sm dark:border-white/10 dark:bg-white/10 dark:text-brand-foreground">
                <Phone className="h-5 w-5 text-brand" aria-hidden />
                <a href="tel:+13144436491" className="hover:underline">
                  (314) 443-6491
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/60 p-4 text-xs uppercase tracking-[0.24em] text-brand-muted shadow-brand-sm dark:border-white/10 dark:bg-white/10 dark:text-brand-subtle">
              Prefer to skip the form? Email or call me directly and we can coordinate a kickoff call.
            </div>
          </aside>
        ) : null}
      </PageSection>
    </div>
  );
}
