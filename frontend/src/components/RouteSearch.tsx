import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getLocations } from "../api";
import type { SearchRequest, TransportType } from "../types";

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

export function RouteSearch({ onSubmitted }: { onSubmitted: () => void }) {
  const navigate = useNavigate();
  const { data: locations = [], isLoading, isError } = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const { register, handleSubmit, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { preference: "fastest", transportTypes: [], maximumTransfers: 3 },
  });

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
    <form className="search-card" onSubmit={handleSubmit(onSubmit)}>
      <div className="search-card-header">
        <div><p className="eyebrow">ROUTE PLANNER</p><h2>Where will you go?</h2></div>
        <span className="status-dot">LIVE</span>
      </div>
      {isError && <p className="api-warning" role="alert">Connect the routing API to load locations. Set <code>VITE_API_BASE_URL</code> to its address.</p>}
      <div className="form-grid">
        <label className="field">
          <span>From</span>
          <input list="location-options" placeholder={isLoading ? "Loading locations…" : "Search a country"} {...register("origin")} disabled={isLoading} aria-invalid={Boolean(errors.origin)} />
          {errors.origin && <small>{errors.origin.message}</small>}
        </label>
        <div className="swap" aria-hidden="true">↔</div>
        <label className="field">
          <span>To</span>
          <input list="location-options" placeholder={isLoading ? "Loading locations…" : "Search a country"} {...register("destination")} disabled={isLoading} aria-invalid={Boolean(errors.destination)} />
          {errors.destination && <small>{errors.destination.message}</small>}
        </label>
      </div>
      <datalist id="location-options">
        {locations.map((location) => <option key={location.country} value={location.country}>{location.capital}</option>)}
      </datalist>
      <div className="preference-row">
        <div>
          <span className="control-label">Optimize for</span>
          <div className="segmented">
            <label><input type="radio" value="fastest" {...register("preference")} /> Fastest</label>
            <label><input type="radio" value="cheapest" {...register("preference")} /> Best value</label>
          </div>
        </div>
        <label className="transfer-field"><span className="control-label">Max transfers</span><input type="number" min="0" max="10" {...register("maximumTransfers")} /></label>
      </div>
      <fieldset className="transport-filter">
        <legend className="control-label">Travel by</legend>
        {transportOptions.map((option) => (
          <label key={option.value}><input type="checkbox" value={option.value} {...register("transportTypes")} /> {option.label}</label>
        ))}
      </fieldset>
      <button className="primary-button" type="submit">Search routes <span>→</span></button>
    </form>
  );
}
