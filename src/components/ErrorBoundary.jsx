import React from 'react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-rose-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-100 shadow-lg p-8 text-center">
            <div className="text-4xl mb-3">🌸</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6 break-words">
              {this.state.error?.message || 'The app hit an unexpected error.'}
            </p>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-full"
              onClick={() => window.location.reload()}
            >
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
