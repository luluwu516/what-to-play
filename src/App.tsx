import { BrowserRouter, Route, Routes } from "react-router";
import { Home } from "./pages/Home";
import { Collection } from "./pages/Collection";
import { CollectionAdd } from "./pages/CollectionAdd";
import { Play } from "./pages/Play";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/add" element={<CollectionAdd />} />
        <Route path="/play" element={<Play />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
