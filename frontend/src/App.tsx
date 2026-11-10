import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { RouteSearch } from "./components/RouteSearch";
import { WelcomeGlobe } from "./components/WelcomeGlobe";
import { ResultsPage } from "./pages/ResultsPage";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_85%_12%,var(--color-cloud-glow)_0,transparent_28%),var(--color-cloud)]">
      <header className="mx-auto flex h-32 max-w-[118rem] items-center justify-between px-[2.8rem] max-sm:h-[6.4rem] max-sm:px-[1.8rem]">
        <Link className="flex items-center gap-2.5 font-display text-[1.35rem] font-bold text-navy no-underline" to="/">
          <span className="grid size-12 place-items-center rounded-full bg-coral text-white">✦</span>
          <span>wayfinder</span>
        </Link>
        <nav className="flex gap-7 max-sm:hidden" aria-label="Main navigation">
          <a className="text-sm text-slate no-underline" href="#how-it-works">How it works</a>
          <a className="text-sm text-slate no-underline" href="#about">About</a>
        </nav>
      </header>
      {children}
      <footer className="py-9 text-center text-xs text-footer">Plan less. Go further.</footer>
    </div>
  );
}

function HomePage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main>
      <section className="mx-auto flex max-w-[118rem] items-center justify-between px-[2.8rem] pb-42 pt-30 max-sm:pb-20 max-sm:pt-12">
        <div>
          <p className="mb-4 text-[.69rem] font-bold tracking-[.14em] text-muted">YOUR NEXT ADVENTURE STARTS HERE</p>
          <h1 className="font-display text-[clamp(3rem,7vw,5.8rem)] font-bold leading-[.98] tracking-[-.07em] text-navy">Find the route<br /><em className="text-coral not-italic">worth taking.</em></h1>
          <p className="mt-6 max-w-156 text-[1.05rem] leading-7 text-slate">
            Compare flights, trains and buses to build a smarter journey across the world.
          </p>
        </div>
        <div className="rotate-18 text-[10rem] text-border-green max-sm:hidden" aria-hidden="true">✦</div>
      </section>
      <section className="mx-auto -mt-10 max-w-372 px-[2.8rem]" aria-label="Route search">
        <RouteSearch onSubmitted={() => setSubmitted(true)} />
      </section>
      {submitted && (
        <section className="mx-auto mt-[1.8rem] max-w-372 px-[2.8rem] text-sm text-green">
          <span>✓</span> Your route is ready — compare options below.
        </section>
      )}
      <section className="mx-auto grid max-w-[118rem] grid-cols-3 gap-11 px-[2.8rem] py-[9.2rem] max-sm:grid-cols-1 max-sm:gap-7 max-sm:pt-24" id="how-it-works">
        <article className="border-t border-border-muted pt-[1.8rem]"><span className="font-display text-xs font-bold text-coral">01</span><h2 className="my-[1.8rem] mb-2 font-display text-[1.2rem] font-semibold">Tell us where</h2><p className="leading-6 text-muted">Choose your origin and destination with quick autocomplete.</p></article>
        <article className="border-t border-border-muted pt-[1.8rem]"><span className="font-display text-xs font-bold text-coral">02</span><h2 className="my-[1.8rem] mb-2 font-display text-[1.2rem] font-semibold">Set your pace</h2><p className="leading-6 text-muted">Prioritize the fastest journey or the best value.</p></article>
        <article className="border-t border-border-muted pt-[1.8rem]"><span className="font-display text-xs font-bold text-coral">03</span><h2 className="my-[1.8rem] mb-2 font-display text-[1.2rem] font-semibold">Make it yours</h2><p className="leading-6 text-muted">Filter transport, transfers and compare every leg.</p></article>
      </section>
    </main>
  );
}

function WelcomePage() {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden bg-night px-[2.8rem] py-[4.8rem] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_42%,var(--color-night-glow)_0,transparent_38%),linear-gradient(145deg,var(--color-night),var(--color-night-soft))]" />
      <div className="absolute left-[8%] top-[18%] size-2 rounded-full bg-coral-bright shadow-[0_0_2.4rem_.8rem_var(--color-coral-bright)55]" />
      <div className="absolute right-[14%] top-[30%] size-1.5 rounded-full bg-blue shadow-[0_0_1.8rem_.6rem_var(--color-blue)55]" />
      <div className="mx-auto flex w-full max-w-[118rem] flex-col items-center text-center">
        <p className="animate-[welcome-fade-up_.7s_ease-out_both] mb-5 text-[.7rem] font-bold tracking-[.28em] text-blue-soft">A BETTER WAY TO TRAVEL</p>
        <h1 className="animate-[welcome-fade-up_.8s_.12s_ease-out_both] max-w-304 font-display text-[clamp(2.7rem,7vw,6.2rem)] font-bold leading-[.94] tracking-[-.07em]">
          Your next route<br /><span className="text-coral-bright">starts here.</span>
        </h1>
        <p className="animate-[welcome-fade-up_.8s_.24s_ease-out_both] mt-6 max-w-176 text-base leading-7 text-blue-muted">
          Explore the world, compare your options, and find the journey worth taking.
        </p>
        <div className="animate-[welcome-globe_1.3s_.35s_cubic-bezier(.22,1,.36,1)_both]">
          <WelcomeGlobe />
        </div>
        <Link
          to="/planner"
          className="animate-[welcome-fade-up_.8s_.65s_ease-out_both] mt-[-2.8rem] inline-flex items-center gap-4 rounded-full bg-coral-bright px-8 py-4 font-bold text-white no-underline shadow-[0_1.4rem_3.6rem_var(--color-coral-bright)44] transition hover:-translate-y-1 hover:bg-coral-hover"
        >
          Go ahead <span aria-hidden="true">→</span>
        </Link>
        <p className="animate-[welcome-fade-up_.8s_.8s_ease-out_both] mt-5 text-xs text-blue-dim">Drag the globe to explore</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/planner" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Shell>
  );
}
