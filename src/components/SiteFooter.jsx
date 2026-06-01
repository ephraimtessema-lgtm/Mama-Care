const COPYRIGHT_YEAR = new Date().getFullYear();

export default function SiteFooter({ variant = 'compact' }) {
  if (variant === 'landing') {
    return (
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span
            className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-base"
            aria-hidden
          >
            🌸
          </span>
          <span className="text-white font-bold">Mama-Care</span>
        </div>
        <p className="mb-2">Built with ❤️ for Ethiopian Mothers</p>
        <p className="text-gray-600 text-xs max-w-xl mx-auto">
          This platform provides informational support only. Always consult a licensed medical
          professional for medical decisions.
        </p>
        <p className="text-gray-500 text-xs mt-6 pt-4 border-t border-gray-800">
          © {COPYRIGHT_YEAR} Mama-Care. All rights reserved.
        </p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-rose-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-6 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
      <p>© {COPYRIGHT_YEAR} Mama-Care. All rights reserved.</p>
      <p className="mt-1 text-gray-400 dark:text-gray-500">Built with ❤️ for Ethiopian mothers</p>
    </footer>
  );
}
