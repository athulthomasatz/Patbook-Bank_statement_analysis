import PageTransition from "../components/PageTransition";

export default function About() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <section className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Bank Statements,<br />Beautifully Visualized
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                A sophisticated environment designed for focused financial stewardship. We prioritize discretion, calm, and clarity over loud interfaces.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
                  Get Started
                </button>
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  View Demo
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <img
                src="https://lh3.googleusercontent.com/aida/ADBb0uir0iDavdv0PiYjiR_2BWUvdwT1uAF0gqMNdIw2mnSFP64yKqzE4zvRZ4oM6r9-5DuqbsadMc8cffXnYXynbwZH3j5YTj11DEznqqp2Sbar02BBuaxpqznPadq3uHLTSpqji3B8iEa0eH2ufN7UQA_KMryQTcG2XAk1y2j--EOa8BXNwQKoaRko5bWkOqlvXy7Aet9NZ-qPId2NnmMgAFhD4Nq3IMKia_K7KdeL5GIGt8cDwXUq4deNwitzTWr3k3nIYQ_pBotJDw"
                alt="Dashboard preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/80 bg-white p-6 shadow-[0_18px_60px_rgba(25,28,30,0.08)] sm:p-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">Our Mission</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Demystifying the Spreadsheet.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900">Clarity Over Chaos</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                We transform raw transaction data into a quiet, trustworthy landscape. By using restrained tones and clear hierarchy, the interface recedes so your data stays prioritized.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Private Stewardship</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Built for users who value discretion and control. The product feels calm and dependable rather than noisy or overly technical.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Tonal Layering</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Visual weight is communicated through subtle value shifts instead of heavy borders, so scanning remains easy over long sessions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Structured Focus</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A centralized grid layout maintains spaciousness and order, helping insights breathe while actions stay obvious.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0uidBPkGzJJH-x9OLYNq9H_GZobZjBSWcXPfIrImpnBFgSDpdbO2VpUd0obbmQN5IxBjyIzTK_RGS47wf8BUKCfhwlZ_FLfU1BSbNj7hdHWRs1drbf0NyOzsAUVRiWpJiUpl3oJLoOjsws_3QPbkLvuwLRic5eTk3X1F2hdb_yzHtXfwaFj7Olgug0MhGjzu09vzPSseG8K8YpHhFcxTss9HMTutLvR5Mw9zrRdG4MOZ_JbB8CYAiPL-E0Mf5RczGFbKUyi6ta6vbw"
              alt="Workspace preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_18px_60px_rgba(25,28,30,0.08)]">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0ugzhwiLXfzShW5v0qXOA-THDqqTcAXQgyc2LtcLl-bHIBh8wyOK9bkzLXOFK9apJmCEO80EcKPlRJCyurW9Ykws_G3mCI_PcPYsJHU_cxstnDgNpZ-gTmmYb-VRFbgLcQmgvyi1Uazmck0JQ9ryJj4gV0qzvsjR8h8fT3cKCMfOMwAUl4hQDyi10yso1QnPJungWVFX0ositlZLfMiYYCFNKKIhZ9Gw_LWcCYSdbBao0hKkaXveYXVRBbH9OixYEh1xfw8igPARug"
              alt="Transactions preview"
              className="h-full w-full object-cover"
            />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
