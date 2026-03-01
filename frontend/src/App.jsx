// frontend/src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import TripDetail from "./pages/TripDetail";
import BookingConfirmation from "./pages/BookingConfirmation";
import TrackBooking from "./pages/TrackBooking";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/trips/:slug" element={<TripDetail />} />
          <Route path="/stage-runs/:slug" element={<TripDetail isStageRun />} />
          <Route path="/booking/:reference" element={<BookingConfirmation />} />
          <Route path="/track/:reference" element={<TrackBooking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}