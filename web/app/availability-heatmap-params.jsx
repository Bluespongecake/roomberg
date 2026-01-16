"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PARAM_KEYS = ["start", "jump", "nights", "end", "rooms"];

export default function AvailabilityHeatmapParams({ criteria }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [startDate, setStartDate] = useState(criteria.startDate);
  const [leadJumpDays, setLeadJumpDays] = useState(String(criteria.leadJumpDays));
  const [stayLengthNights, setStayLengthNights] = useState(String(criteria.stayLengthNights));
  const [leadEndDays, setLeadEndDays] = useState(String(criteria.leadEndDays));
  const [roomsRequired, setRoomsRequired] = useState(String(criteria.roomsRequired));

  useEffect(() => {
    setStartDate(criteria.startDate);
    setLeadJumpDays(String(criteria.leadJumpDays));
    setStayLengthNights(String(criteria.stayLengthNights));
    setLeadEndDays(String(criteria.leadEndDays));
    setRoomsRequired(String(criteria.roomsRequired));
  }, [
    criteria.startDate,
    criteria.leadJumpDays,
    criteria.stayLengthNights,
    criteria.leadEndDays,
    criteria.roomsRequired,
  ]);

  const applyParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) {
      params.set("start", startDate);
    }
    if (leadJumpDays) {
      params.set("jump", leadJumpDays);
    }
    if (stayLengthNights) {
      params.set("nights", stayLengthNights);
    }
    if (leadEndDays) {
      params.set("end", leadEndDays);
    }
    if (roomsRequired) {
      params.set("rooms", roomsRequired);
    }
    const query = params.toString();
    router.replace(query ? `/availability-heatmap?${query}` : "/availability-heatmap");
  };

  const resetParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    PARAM_KEYS.forEach((key) => params.delete(key));
    const query = params.toString();
    router.replace(query ? `/availability-heatmap?${query}` : "/availability-heatmap");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyParams();
  };

  return (
    <form className="params-form" onSubmit={handleSubmit}>
      <section className="stats-grid" aria-label="Availability search criteria">
        <div className="stat-card">
          <label className="stat-label" htmlFor="availability-start">
            Start date
          </label>
          <input
            id="availability-start"
            className="param-input"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="stat-card">
          <label className="stat-label" htmlFor="availability-jump">
            Lead jump (days)
          </label>
          <input
            id="availability-jump"
            className="param-input"
            type="number"
            min="1"
            value={leadJumpDays}
            onChange={(event) => setLeadJumpDays(event.target.value)}
          />
        </div>
        <div className="stat-card">
          <label className="stat-label" htmlFor="availability-nights">
            Stay length (nights)
          </label>
          <input
            id="availability-nights"
            className="param-input"
            type="number"
            min="1"
            value={stayLengthNights}
            onChange={(event) => setStayLengthNights(event.target.value)}
          />
        </div>
        <div className="stat-card">
          <label className="stat-label" htmlFor="availability-end">
            Lead end (days)
          </label>
          <input
            id="availability-end"
            className="param-input"
            type="number"
            min="1"
            value={leadEndDays}
            onChange={(event) => setLeadEndDays(event.target.value)}
          />
        </div>
        <div className="stat-card">
          <label className="stat-label" htmlFor="availability-rooms">
            Rooms required
          </label>
          <input
            id="availability-rooms"
            className="param-input"
            type="number"
            min="1"
            value={roomsRequired}
            onChange={(event) => setRoomsRequired(event.target.value)}
          />
        </div>
        <div className="stat-card param-actions">
          <button className="btn" type="submit">
            Apply
          </button>
          <button className="btn secondary" type="button" onClick={resetParams}>
            Reset
          </button>
        </div>
      </section>
    </form>
  );
}
