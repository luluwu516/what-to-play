import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { Collection } from "./pages/Collection";
import { CollectionAdd } from "./pages/CollectionAdd";
import { InstallHint } from "./components/InstallHint";

// The wheel pulls in framer-motion (the heaviest dependency) and is only used
// on /play — split it into its own chunk so Home/Collection don't pay for it.
const Play = lazy(() =>
  import("./pages/Play").then((m) => ({ default: m.Play })),
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/add" element={<CollectionAdd />} />
        <Route
          path="/play"
          element={
            <Suspense
              fallback={
                <p className="flex-1 text-center text-cocoa/60 py-16">Loading…</p>
              }
            >
              <Play />
            </Suspense>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      <InstallHint />
    </BrowserRouter>
  );
}
