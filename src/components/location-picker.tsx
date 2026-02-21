"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LocationOption = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (location: LocationOption | null) => void;
  placeholder: string;
};

export function LocationPicker({
  label,
  value,
  onValueChange,
  onSelect,
  placeholder,
}: LocationPickerProps) {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setLoading(true);

      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
        });

        const data = (await response.json()) as { locations?: LocationOption[] };

        if (requestId !== requestIdRef.current) {
          return;
        }

        const nextOptions = data.locations ?? [];
        setOptions(nextOptions);
        setOpen(focused && nextOptions.length > 0);
      } catch {
        if (requestId === requestIdRef.current) {
          setOptions([]);
          setOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 260);

    return () => clearTimeout(timeout);
  }, [focused, value]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="relative">
        <Input
          value={value}
          onFocus={() => {
            setFocused(true);
            if (options.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            onValueChange(event.target.value);
            onSelect(null);
            if (focused) {
              setOpen(true);
            }
          }}
          placeholder={placeholder}
        />
        {loading && <Loader2 className="absolute top-2.5 right-2.5 h-4 w-4 animate-spin text-slate-400" />}

        {open && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {options.map((option) => (
              <button
                key={`${option.lat}-${option.lng}-${option.address}`}
                type="button"
                className={cn(
                  "w-full rounded-lg px-2 py-2 text-left transition-colors",
                  "hover:bg-slate-100"
                )}
                onMouseDown={() => {
                  onValueChange(option.name);
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{option.name}</p>
                    <p className="text-xs text-slate-500">{option.address}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
