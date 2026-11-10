import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { RouteSearch } from "./components/RouteSearch";
import { ResultsPage } from "./pages/ResultsPage";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">✦</span>
          <span>wayfinder</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>
      </header>
      {children}
      <footer className="footer">Plan less. Go further.</footer>
    </div>
  );
}

function HomePage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</p>
          <h1>Find the route<br /><em>worth taking.</em></h1>
          <p className="hero-description">
            Compare flights, trains and buses to build a smarter journey across the world.
          </p>
        </div>
        <div className="compass" aria-hidden="true">✦</div>
      </section>
      <section className="search-wrap" aria-label="Route search">
        <RouteSearch onSubmitted={() => setSubmitted(true)} />
      </section>
      {submitted && (
        <section className="demo-hint">
          <span>✓</span> Your route is ready — compare options below.
        </section>
      )}
      <section className="feature-grid" id="how-it-works">
        <article><span>01</span><h2>Tell us where</h2><p>Choose your origin and destination with quick autocomplete.</p></article>
        <article><span>02</span><h2>Set your pace</h2><p>Prioritize the fastest journey or the best value.</p></article>
        <article><span>03</span><h2>Make it yours</h2><p>Filter transport, transfers and compare every leg.</p></article>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Shell>
  );
}
