import PageTransition from "../components/PageTransition";

export default function About() {
  return (
    <PageTransition>
      <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        {/* Hero Section */}
        <section className="glass-card p-6 sm:p-10 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--primary-accent)]/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-center relative z-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary-accent)] mb-3">The Vision</p>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--text-main)] sm:text-5xl leading-tight">
                Bank Statements,<br />Beautifully Visualized
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-muted)] max-w-lg">
                A sophisticated environment designed for focused financial stewardship. We prioritize discretion, calm, and clarity over loud interfaces.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button type="button" className="rounded-xl bg-[var(--primary-accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--primary-accent)]/20 transition-all hover:bg-[var(--primary-accent-hover)] hover:-translate-y-0.5">
                  Get Started
                </button>
                <button type="button" className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-6 py-3 text-sm font-semibold text-[var(--text-main)] transition-all hover:border-[var(--primary-accent)]/50 hover:bg-[var(--bg-color)]">
                  View Demo
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary-accent)] to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)] shadow-xl">
                <img
                  src="https://lh3.googleusercontent.com/aida/ADBb0uir0iDavdv0PiYjiR_2BWUvdwT1uAF0gqMNdIw2mnSFP64yKqzE4zvRZ4oM6r9-5DuqbsadMc8cffXnYXynbwZH3j5YTj11DEznqqp2Sbar02BBuaxpqznPadq3uHLTSpqji3B8iEa0eH2ufN7UQA_KMryQTcG2XAk1y2j--EOa8BXNwQKoaRko5bWkOqlvXy7Aet9NZ-qPId2NnmMgAFhD4Nq3IMKia_K7KdeL5GIGt8cDwXUq4deNwitzTWr3k3nIYQ_pBotJDw"
                  alt="Dashboard preview"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Redesigned Mission Section - Modern Bento Layout */}
        <section className="relative py-8">
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary-accent)] mb-3">Our Core Philosophy</p>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-main)] tracking-tight">The Art of Financial Clarity.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] md:auto-rows-[220px]">
            {/* Main Mission - Large Bento Card */}
            <div className="md:col-span-8 md:row-span-2 glass-card p-8 md:p-12 flex flex-col justify-center relative overflow-hidden group">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[var(--primary-accent)]/5 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-6">Demystifying the Spreadsheet.</h3>
                <p className="text-lg md:text-xl text-[var(--text-muted)] leading-relaxed max-w-2xl">
                  We transform raw transaction data into a quiet, trustworthy landscape. By using restrained tones and clear hierarchy, the interface recedes so your data stays prioritized. Our mission is to make financial stewardship feel as natural as breathing.
                </p>
              </div>
            </div>

            {/* Individual Values - Staggered Bento Cards */}
            <div className="md:col-span-4 md:row-span-1 glass-card p-6 flex flex-col justify-between hover:border-[var(--primary-accent)]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform">🛡️</div>
              <div>
                <h4 className="font-bold text-[var(--text-main)] text-lg mb-1">Private Stewardship</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Built for users who value discretion and control above all.</p>
              </div>
            </div>

            <div className="md:col-span-4 md:row-span-1 glass-card p-6 flex flex-col justify-between hover:border-[var(--primary-accent)]/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl border border-amber-500/20 group-hover:scale-110 transition-transform">🎨</div>
              <div>
                <h4 className="font-bold text-[var(--text-main)] text-lg mb-1">Tonal Layering</h4>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Visual weight communicated through subtle value shifts.</p>
              </div>
            </div>

            {/* Wide Value Cards */}
            <div className="md:col-span-6 md:row-span-1 glass-card p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-[var(--primary-accent)]/40 transition-all group">
               <div className="w-16 h-16 rounded-2xl bg-[var(--primary-accent)]/10 flex items-center justify-center text-3xl shrink-0 border border-[var(--primary-accent)]/20 group-hover:rotate-6 transition-transform">✨</div>
               <div>
                 <h4 className="font-bold text-[var(--text-main)] text-xl mb-2">Clarity Over Chaos</h4>
                 <p className="text-sm text-[var(--text-muted)] leading-relaxed">Quiet, trustworthy landscapes that make scanning easy over long sessions.</p>
               </div>
            </div>

            <div className="md:col-span-6 md:row-span-1 glass-card p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-[var(--primary-accent)]/40 transition-all group">
               <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl shrink-0 border border-indigo-500/20 group-hover:-rotate-6 transition-transform">📐</div>
               <div>
                 <h4 className="font-bold text-[var(--text-main)] text-xl mb-2">Structured Focus</h4>
                 <p className="text-sm text-[var(--text-muted)] leading-relaxed">A centralized grid layout that helps insights breathe while actions stay obvious.</p>
               </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="glass-card p-6 sm:p-10">
          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary-accent)]">Workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-main)]">How it works</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-[var(--border-color)] z-0"></div>

            {[
              {
                step: "01",
                title: "Upload Statement",
                desc: "Drop your PDF bank statement securely into the analyzer. We process it locally without sending sensitive data to servers."
              },
              {
                step: "02",
                title: "Automatic Parsing",
                desc: "Our engine extracts transactions, dates, payees, and amounts, automatically categorizing them based on smart patterns."
              },
              {
                step: "03",
                title: "Gain Insights",
                desc: "Explore visual dashboards, filter by categories, spot trends, and export your cleaned data for further use."
              }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--card-bg)] border-4 border-[var(--bg-color)] shadow-[0_0_0_2px_var(--primary-accent)] flex items-center justify-center text-lg font-bold text-[var(--primary-accent)] mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-3">{item.title}</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Image Grid */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-color)] shadow-lg group">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0uidBPkGzJJH-x9OLYNq9H_GZobZjBSWcXPfIrImpnBFgSDpdbO2VpUd0obbmQN5IxBjyIzTK_RGS47wf8BUKCfhwlZ_FLfU1BSbNj7hdHWRs1drbf0NyOzsAUVRiWpJiUpl3oJLoOjsws_3QPbkLvuwLRic5eTk3X1F2hdb_yzHtXfwaFj7Olgug0MhGjzu09vzPSseG8K8YpHhFcxTss9HMTutLvR5Mw9zrRdG4MOZ_JbB8CYAiPL-E0Mf5RczGFbKUyi6ta6vbw"
              alt="Workspace preview"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-color)] shadow-lg group">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0ugzhwiLXfzShW5v0qXOA-THDqqTcAXQgyc2LtcLl-bHIBh8wyOK9bkzLXOFK9apJmCEO80EcKPlRJCyurW9Ykws_G3mCI_PcPYsJHU_cxstnDgNpZ-gTmmYb-VRFbgLcQmgvyi1Uazmck0JQ9ryJj4gV0qzvsjR8h8fT3cKCMfOMwAUl4hQDyi10yso1QnPJungWVFX0ositlZLfMiYYCFNKKIhZ9Gw_LWcCYSdbBao0hKkaXveYXVRBbH9OixYEh1xfw8igPARug"
              alt="Transactions preview"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
