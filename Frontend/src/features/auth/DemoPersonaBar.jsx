import React from "react";
import { Zap, Car, User } from "lucide-react";

export const DEMO_PERSONAS = [
  {
    name: "Jashim",
    role: "DRIVER",
    email: "jashim@teslapool.com",
    password: "password123",
    description: "Driver of 'Bullet' (3 Seats)",
    icon: Car,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    name: "Nusrat",
    role: "PASSENGER",
    email: "nusrat@teslapool.com",
    password: "password123",
    description: "Banani → Mohakhali (Office)",
    icon: User,
    badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
  },
  {
    name: "Rafiq",
    role: "PASSENGER",
    email: "rafiq@teslapool.com",
    password: "password123",
    description: "Banani → Gulshan 1 (Meetings)",
    icon: User,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    name: "Shirin",
    role: "PASSENGER",
    email: "shirin@teslapool.com",
    password: "password123",
    description: "Banani → Mohakhali (Last Seat)",
    icon: User,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
];

const DemoPersonaBar = ({ onSelectPersona, isSubmitting }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-slate-800">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            PRD Demo Cast — Instant 1-Click Sign In
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Click to auto-fill & login
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DEMO_PERSONAS.map((persona) => {
          return (
            <button
              key={persona.email}
              type="button"
              disabled={isSubmitting}
              onClick={() => onSelectPersona(persona)}
              className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all text-left group disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                  {persona.name}
                </span>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${persona.badgeColor}`}>
                  {persona.role === "DRIVER" ? "Driver" : "Passenger"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {persona.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoPersonaBar;
