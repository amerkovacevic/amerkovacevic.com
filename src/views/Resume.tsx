export default function Resume() {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="rounded-2xl p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white">
        <h1 className="text-3xl font-bold tracking-tight">Amer Kovacevic</h1>
        <p className="mt-1 text-white/80">Arnold, MO 63010 · (314) 443-6491 · <a className="underline" href="mailto:Amerkovacevic99@gmail.com">Amerkovacevic99@gmail.com</a></p>
      </header>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Summary</h2>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          Information Systems graduate with professional experience as a Systems Platform Engineer and Software Developer.
          Strong communicator; fluent in Bosnian. Eager to learn and build skills that compound in both career and life.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold">Experience</h2>

        <div className="mt-3">
          <h3 className="font-medium">Systems Platform Engineer II — Mastercard (Aug 2022 – Present)</h3>
          <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 mt-1 space-y-1">
            <li>Support & maintain Oracle Linux and VMware environments for customers.</li>
            <li>Use configuration management & infra automation for repeatable tasks.</li>
            <li>Deliver status reports, implementations, troubleshooting, and teamwork comms.</li>
            <li>Design & implement OS build processes and automation with strong validation.</li>
            <li>Assist users with OS and hardware issues.</li>
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-medium">Software Developer — SpearTip (Sep 2021 – Aug 2022)</h3>
          <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 mt-1 space-y-1">
            <li>Build and maintain infrastructure & tools; support internal teams.</li>
            <li>Test and deploy new applications; bridge DevOps & Operations.</li>
            <li>Participate in team meetings and troubleshoot reported issues.</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Education</h2>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            B.S. in Information Systems and Technology — UMSL<br />
            Minor in Cybersecurity
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Projects (selected)</h2>
          <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 mt-2 space-y-1">
            <li>CRM app for RPM Music</li>
            <li>Amazon clone (React, NodeJS, AWS, Firebase)</li>
            <li>Spotify clone (React, Spotify Auth, NodeJS)</li>
            <li>LinkedIn clone (React, JavaScript, Firebase)</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Skills</h2>
          <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 mt-2 space-y-1">
            <li>OOP, Front-end UI, Back-end Integration</li>
            <li>End-user ticket management, Microsoft Office</li>
            <li>Security awareness; Windows, macOS & Linux; VMs</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Tools & Languages</h2>
          <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 mt-2 space-y-1">
            <li>React, JavaScript/TypeScript, Python, SQL, NodeJS</li>
            <li>AWS, Docker, Ansible, Git, PowerShell</li>
            <li>Oracle VirtualBox, Wireshark, ELK/OpenSearch, Jira, VSCode</li>
          </ul>
        </div>
      </section>

      <footer className="mt-8 text-xs text-gray-500 dark:text-gray-400">
        Source: Resume on file.
      </footer>
    </article>
  );
}
