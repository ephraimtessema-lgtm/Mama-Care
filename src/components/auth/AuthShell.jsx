import React from 'react';
import { Link } from 'react-router-dom';

export function AuthBrand({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-block">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 shadow-lg shadow-rose-200/60 mb-4 ring-4 ring-rose-50">
          <span className="text-3xl" aria-hidden>
            🌸
          </span>
        </div>
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-1.5">{subtitle}</p>}
    </div>
  );
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl shadow-rose-100/50 border border-rose-100/80 p-8">
        {children}
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-3 text-slate-400 font-medium tracking-wide">or</span>
      </div>
    </div>
  );
}
