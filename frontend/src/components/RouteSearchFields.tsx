import { useEffect, useId, useRef, useState } from "react";
import type { Location, TransportType } from "../types";

export function CountryCombobox({ label, locations, value, onChange, loading, error }: {
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const errorId = `${listboxId}-error`;
  const statusId = `${listboxId}-status`;
  const filtered = locations.filter((location) =>
    `${location.country ?? ""} ${location.capital ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );
  const visibleLocations = filtered.slice(0, visibleCount);

  useEffect(() => {
    setQuery(value ?? "");
    setActiveIndex(-1);
  }, [value]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selectLocation = (location: Location) => {
    setQuery(location.country);
    onChange(location.country);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    if (filtered.length === 0) return;
    setOpen(true);
    setVisibleCount(filtered.length);
    setActiveIndex((current) => {
      const next = current + direction;
      return next < 0 ? filtered.length - 1 : next >= filtered.length ? 0 : next;
    });
  };

  return (
    <div className="relative flex flex-col gap-2" ref={containerRef}>
      <span className="text-xs font-bold uppercase tracking-[.09em] text-muted-light">{label}</span>
      <input ref={inputRef} id={`${listboxId}-input`} className="rounded-2xl border border-border-soft text-sm bg-white-soft p-3.5 text-navy outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 focus-visible:ring-4" value={query} placeholder="Search a country"
        role="combobox" aria-expanded={open} aria-controls={listboxId} aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-invalid={Boolean(error)} aria-describedby={error ? errorId : statusId}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setActiveIndex(-1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
          } else if (event.key === "Home" && open && filtered.length > 0) {
            event.preventDefault();
            setVisibleCount(filtered.length);
            setActiveIndex(0);
          } else if (event.key === "End" && open && filtered.length > 0) {
            event.preventDefault();
            setVisibleCount(filtered.length);
            setActiveIndex(filtered.length - 1);
          } else if (event.key === "Enter" && open && activeIndex >= 0) {
            event.preventDefault();
            selectLocation(filtered[activeIndex]);
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setVisibleCount(10);
          setActiveIndex(-1);
          setOpen(true);
          onChange(event.target.value);
        }} />
      <span id={statusId} className="sr-only" aria-live="polite">
        {open ? `${filtered.length} ${filtered.length === 1 ? "country" : "countries"} available.` : ""}
      </span>
      {open && <div id={listboxId} className="absolute left-0 right-0 top-[calc(100%+.6rem)] z-10 max-h-100 overflow-y-auto rounded-xl border border-border-soft bg-white p-1.5 shadow-[0_1.4rem_3rem_var(--color-shadow-dark)]" role="listbox" aria-label={`${label} country suggestions`} onScroll={(event) => {
        const menu = event.currentTarget;
        if (menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 24) {
          setVisibleCount((count) => Math.min(count + 10, filtered.length));
        }
      }}>
        {loading && <div className="p-3 text-xs text-muted-light">Loading countries…</div>}
        {!loading && visibleLocations.length === 0 && <div className="p-3 text-xs text-muted-light">No countries found</div>}
        {visibleLocations.map((location, index) => <div id={`${listboxId}-option-${index}`} role="option"
          aria-selected={location.country === value} className={`flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg border-0 px-3 py-3 text-left text-navy outline-none hover:bg-green-pale focus:bg-green-pale focus-visible:ring-2 focus-visible:ring-coral/40 ${activeIndex === index ? "bg-green-pale ring-2 ring-coral/40" : ""}`}
          key={location.country} onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)} onClick={() => selectLocation(location)} tabIndex={-1}>
          <strong className="text-sm font-semibold">{location.country}</strong><small className="text-xs text-muted-light">{location.capital}</small>
        </div>)}
        {visibleCount < filtered.length && <div className="border-t border-border-faint p-3 text-center text-xs text-muted-light">Scroll for more</div>}
      </div>}
      {error && <small id={errorId} className="text-error-dark">{error}</small>}
    </div>
  );
}

export function PreferenceSelector({ register }: { register: (name: "preference") => object }) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-[.09em] text-muted-light">Optimize for</span>
      <div className="mt-2 flex gap-1">
        <label className="rounded-lg border border-(--color-border-strong) px-3 py-2 text-sm"><input className="accent-coral" type="radio" value="fastest" {...register("preference")} /> Fastest</label>
        <label className="rounded-lg border border-(--color-border-strong) px-3 py-2 text-sm"><input className="accent-coral" type="radio" value="cheapest" {...register("preference")} /> Best value</label>
      </div>
    </div>
  );
}

export function TransportFilter({ register, options }: {
  register: (name: "transportTypes") => object;
  options: { value: TransportType; label: string }[];
}) {
  return (
    <fieldset className="flex gap-[1.8rem] border-0 px-0 pt-5">
      <legend className="mr-2 text-xs font-bold uppercase tracking-[.09em] text-muted-light">Travel by</legend>
      {options.map((option) => (
        <label className="text-sm" key={option.value}><input className="accent-coral" type="checkbox" value={option.value} {...register("transportTypes")} /> {option.label}</label>
      ))}
    </fieldset>
  );
}
