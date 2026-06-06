import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const authLabelClass =
  'text-sm font-semibold text-slate-800 dark:text-gray-200';
export const authHintClass = 'text-xs text-slate-500 dark:text-gray-400 mt-1.5';
export const authInputClass =
  'h-11 rounded-xl border-slate-200 dark:border-gray-600 focus-visible:ring-rose-400 dark:bg-gray-800 dark:text-gray-100';
export const authMutedClass = 'text-sm text-slate-500 dark:text-gray-400';
export const authLinkClass =
  'font-semibold text-slate-900 dark:text-gray-100 hover:text-rose-600 dark:hover:text-rose-400';
export const authBackLinkClass =
  'inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400';

export function AuthBrand({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-block">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 shadow-lg shadow-rose-200/60 dark:shadow-rose-900/30 mb-4 ring-4 ring-rose-50 dark:ring-gray-800">
          <span className="text-3xl" aria-hidden>
            🌸
          </span>
        </div>
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-50 tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-br from-rose-50 via-white to-sky-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/30 dark:bg-rose-900/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/30 dark:bg-sky-900/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-rose-100/50 dark:shadow-none border border-rose-100/80 dark:border-gray-800 p-8">
        {children}
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white dark:bg-gray-900 px-3 text-slate-400 dark:text-gray-500 font-medium tracking-wide">
          or
        </span>
      </div>
    </div>
  );
}

export function AuthError({ children, className }) {
  return (
    <div
      className={cn(
        'text-sm text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl px-3 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
