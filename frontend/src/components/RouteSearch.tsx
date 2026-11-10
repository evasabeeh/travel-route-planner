import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getLocations, parsePreferences } from "../api";
import type { Location, SearchRequest, TransportType } from "../types";

const schema = z.object({
  origin: z.string().min(1, "Choose an origin"),
  destination: z.string().min(1, "Choose a destination"),
  preference: z.enum(["fastest", "cheapest"]),
  transportTypes: z.array(z.enum(["plane", "train", "bus", "other"])),
  maximumTransfers: z.coerce.number().int().min(0).max(10),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;
const transportOptions: { value: TransportType; label: string }[] = [
  { value: "plane", label: "Flights" },
  { value: "train", label: "Trains" },
  { value: "bus", label: "Buses" },
];

function CountryCombobox({ label, locations, value, onChange, loading, error }: {
  label: string;
  locations: Location[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = locations.filter((location) =>
    `${location.country ?? ""} ${location.capital ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  const visibleLocations = filtered.slice(0, visibleCount);

  useEffect(() => setQuery(value ?? ""), [value]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
      <span className="text-xs font-bold uppercase tracking-[.09em] text-muted-light">{label}</span>
      <input className="rounded-2xl border border-border-soft bg-white-soft p-3.5 text-navy outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" value={query} placeholder="Search a country"
        role="combobox" aria-expanded={open} aria-invalid={Boolean(error)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" && open) {
            event.preventDefault();
            containerRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setVisibleCount(10);
          setOpen(true);
          onChange(event.target.value);
        }} />
      {open && <div className="absolute left-0 right-0 top-[calc(100%+.6rem)] z-10 max-h-100 overflow-y-auto rounded-xl border border-border-soft bg-white p-1.5 shadow-[0_1.4rem_3rem_var(--color-shadow-dark)]" role="listbox" onScroll={(event) => {
        const menu = event.currentTarget;
        if (menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 24) {
          setVisibleCount((count) => Math.min(count + 10, filtered.length));
        }
      }}>
        {loading && <div className="p-3 text-xs text-muted-light">Loading countries…</div>}
        {!loading && visibleLocations.length === 0 && <div className="p-3 text-xs text-muted-light">No countries found</div>}
        {visibleLocations.map((location) => <button type="button" role="option"
          aria-selected={location.country === value} className="flex w-full flex-col items-start gap-0.5 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-navy hover:bg-green-pale"
          key={location.country} onMouseDown={(event) => event.preventDefault()}
          onClick={() => { setQuery(location.country); onChange(location.country); setOpen(false); }}>
          <strong>{location.country}</strong><small className="text-muted-light">{location.capital}</small>
        </button>)}
        {visibleCount < filtered.length && <div className="border-t border-border-faint p-3 text-center text-xs text-muted-light">Scroll for more</div>}
      </div>}
      {error && <small className="text-error-dark">{error}</small>}
    </div>
  );
}

export function RouteSearch({ onSubmitted }: { onSubmitted: () => void }) {
  const navigate = useNavigate();
  const { data: locations = [], isLoading, isError } = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { origin: "", destination: "", preference: "fastest", transportTypes: [], maximumTransfers: 3 },
  });
  const [prompt, setPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const applyAiPreferences = async () => {
    if (!prompt.trim()) {
      setAiMessage("Describe the journey you want first.");
      return;
    }
    setAiLoading(true);
    setAiMessage("");
    try {
      const preferences = await parsePreferences(prompt);
      setValue("origin", preferences.origin);
      setValue("destination", preferences.destination);
      setValue("preference", preferences.preference);
      setValue("transportTypes", preferences.transportTypes.filter((type) => type !== "other"));
      setValue("maximumTransfers", preferences.maximumTransfers ?? 10);
      setAiMessage("Preferences extracted. Review them below, then search.");
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "AI could not understand that request.");
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    const request: SearchRequest = {
      ...values,
      maximumTransfers: values.maximumTransfers,
    };
    sessionStorage.setItem("wayfinder-search", JSON.stringify(request));
    onSubmitted();
    navigate("/results");
  };

  return (
    <form className="rounded-4xl border border-border bg-white p-12 shadow-[0_1.4rem_4rem_var(--color-shadow)] max-sm:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between">
        <div><p className="mb-4 text-xs font-bold tracking-[.14em] text-muted">ROUTE PLANNER</p><h2 className="font-display text-[1.45rem] font-semibold">Where will you go?</h2></div>
        <span className="rounded-full bg-green-soft px-2.5 py-1.5 text-xs font-bold text-green">LIVE</span>
      </div>
      {isError && <p className="rounded-2xl bg-warning-bg p-3 text-sm text-warning-text" role="alert">Connect the routing API to load locations. Set <code>VITE_API_BASE_URL</code> to its address.</p>}
      <div className="mb-7 rounded-2xl bg-night-soft p-5 text-white">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-[.09em] text-blue-soft">Describe your trip</span>
          <textarea className="min-h-20 resize-y rounded-xl border border-blue-dim/30 bg-night p-3 text-sm text-white outline-none placeholder:text-blue-dim focus:border-coral-bright" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Cheapest route from France to Germany, no buses" />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <small className="text-blue-muted">AI extracts preferences only. The planner calculates the route.</small>
          <button type="button" className="rounded-xl border border-coral-bright px-4 py-2 text-sm font-bold text-coral-bright hover:bg-coral-bright hover:text-white disabled:opacity-50" onClick={applyAiPreferences} disabled={aiLoading}>
            {aiLoading ? "Understanding…" : "Use AI"}
          </button>
        </div>
        {aiMessage && <p className="mt-3 text-sm text-blue-soft" aria-live="polite">{aiMessage}</p>}
      </div>
      <div className="my-7 grid grid-cols-[1fr_3rem_1fr] items-end gap-3 max-sm:grid-cols-1">
        <Controller control={control} name="origin" render={({ field }) => (
        <CountryCombobox label="From" locations={locations} value={field.value} onChange={field.onChange} loading={isLoading} error={errors.origin?.message} />
        )} />
        <div className="pb-3 text-center text-xl text-coral max-sm:hidden" aria-hidden="true">↔</div>
        <Controller control={control} name="destination" render={({ field }) => (
          <CountryCombobox label="To" locations={locations} value={field.value} onChange={field.onChange} loading={isLoading} error={errors.destination?.message} />
        )} />
      </div>
      <div className="flex items-end justify-between border-t border-border-faint pt-[2.2rem] mb-8 max-sm:flex-col max-sm:items-stretch max-sm:gap-[1.6rem]">
        <div>
          <span className="text-xs font-bold uppercase tracking-[.09em] text-muted-light">Optimize for</span>
          <div className="mt-2 flex gap-1">
            <label className="rounded-lg border border-(--color-border-strong) px-3 py-2 text-sm"><input className="accent-coral" type="radio" value="fastest" {...register("preference")} /> Fastest</label>
            <label className="rounded-lg border border-(--color-border-strong) px-3 py-2 text-sm"><input className="accent-coral" type="radio" value="cheapest" {...register("preference")} /> Best value</label>
          </div>
        </div>
        <label className="flex flex-col gap-2"><span className="text-xs font-bold uppercase tracking-[.09em] text-muted-light">Max transfers</span><input className="mt-2 w-20 rounded-2xl border border-border-soft bg-white-soft p-3.5" type="number" min="0" max="10" {...register("maximumTransfers")} /></label>
      </div>
      <fieldset className="flex gap-[1.8rem] border-0 px-0 pt-5">
        <legend className="mr-2 text-xs font-bold uppercase tracking-[.09em] text-muted-light">Travel by</legend>
        {transportOptions.map((option) => (
          <label className="text-sm" key={option.value}><input className="accent-coral" type="checkbox" value={option.value} {...register("transportTypes")} /> {option.label}</label>
        ))}
      </fieldset>
      <button className="mt-6 flex w-full items-center justify-center gap-5 rounded-2xl border-0 bg-navy p-3.5 font-bold text-sm text-white transition hover:bg-coral" type="submit">Search routes <span>→</span></button>
    </form>
  );
}
