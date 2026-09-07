"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Users, Coins } from "lucide-react";

export interface MPEntity {
  name: string;
  works_count: number;
  total_capital: number;
}

interface SearchableMpDropdownProps {
  selectedMp: string;
  mps: MPEntity[];
  onSelectMp: (mpName: string) => void;
  selectedState?: string;
  placeholder?: string;
  className?: string;
}

export function SearchableMpDropdown({
  selectedMp,
  mps = [],
  onSelectMp,
  selectedState,
  placeholder = "Type to filter MPs...",
  className = "",
}: SearchableMpDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset query when state changes
  useEffect(() => {
    setSearchQuery("");
  }, [selectedState]);

  // Filter MPs based on query
  const filteredMps = useMemo(() => {
    if (!searchQuery.trim()) return mps;
    const q = searchQuery.toLowerCase().trim();
    return mps.filter((m) => m.name.toLowerCase().includes(q));
  }, [mps, searchQuery]);

  // Find currently selected MP metadata
  const currentMpData = useMemo(() => {
    return mps.find((m) => m.name.toLowerCase() === selectedMp.toLowerCase());
  }, [mps, selectedMp]);

  const handleSelect = (name: string) => {
    onSelectMp(name);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50/60 px-3 py-1.5 text-xs font-semibold text-blue-950 shadow-xs hover:border-blue-400 hover:bg-blue-50 focus:outline-hidden transition-all cursor-pointer min-w-[220px] max-w-[340px] justify-between"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-blue-700">🗳️</span>
          <span className="truncate font-bold text-blue-900">
            {selectedMp || "Select Member of Parliament"}
          </span>
          {currentMpData && (
            <span className="text-[10px] text-blue-600 font-mono bg-blue-100/70 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
              {currentMpData.works_count}w
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-blue-600 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Floating Searchable Menu Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  } else if (e.key === "Enter" && filteredMps.length > 0) {
                    handleSelect(filteredMps[0].name);
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Scope / Count subtext */}
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-600" />
                {selectedState && selectedState !== "All India"
                  ? `${selectedState} MPs`
                  : "All Available MPs"}
              </span>
              <span className="font-mono text-slate-600">
                {filteredMps.length} of {mps.length}
              </span>
            </div>
          </div>

          {/* MP Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredMps.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-700">No MPs found</p>
                <p className="text-[11px] mt-0.5">Try searching with a different name</p>
              </div>
            ) : (
              filteredMps.map((mp) => {
                const isSelected = mp.name.toLowerCase() === selectedMp.toLowerCase();
                const capitalCr = (mp.total_capital / 10000000).toFixed(2);
                return (
                  <button
                    key={mp.name}
                    type="button"
                    onClick={() => handleSelect(mp.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-950 font-bold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-slate-400 shrink-0">🗳️</span>
                      <div className="truncate">
                        <div className="truncate font-semibold">{mp.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{mp.works_count} works</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">₹{capitalCr} Cr</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
