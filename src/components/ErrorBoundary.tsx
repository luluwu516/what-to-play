import { Component, type ErrorInfo, type ReactNode } from "react";

// Top-level safety net: any render/lifecycle error in the tree lands here
// instead of unmounting everything into a blank white page. Shows a friendly
// recovery UI and a Reload action. The `onError` hook is where a crash-
// reporting service (Sentry, or a home-grown /api endpoint) would plug in.
type Props = {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-4 text-center">
        <p className="text-5xl" aria-hidden>
          🎲
        </p>
        <h1 className="text-2xl font-extrabold">Something went wrong</h1>
        <p className="text-cocoa/70 max-w-sm">
          The app hit an unexpected error. Your collection is stored safely in
          this browser — reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-sticker active:btn-sticker-active bg-tangerine text-lg px-6 py-3"
        >
          🔄 Reload
        </button>
      </main>
    );
  }
}
