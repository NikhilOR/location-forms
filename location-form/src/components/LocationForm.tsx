import { useState, useEffect } from "react";

interface LocationPayload {
  wa_id?: string | null;
  name?: string | null;
  state: string;
  district: string;
  taluk: string;
  village: string;
}

export default function LocationForm() {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [taluks, setTaluks] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluk, setSelectedTaluk] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTaluks, setLoadingTaluks] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [countdown, setCountdown] = useState(3); // seconds before redirect

  // Auto-identification
  const [waId, setWaId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setWaId(params.get("wa_id"));
    setName(params.get("name"));

    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const res = await fetch(`${API_BASE}/api/states`);
      const data = await res.json();
      setStates(data.states || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (state: string) => {
    setLoadingDistricts(true);
    try {
      const res = await fetch(`${API_BASE}/api/districts?state=${encodeURIComponent(state)}`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchTaluks = async (district: string) => {
    setLoadingTaluks(true);
    try {
      const res = await fetch(`${API_BASE}/api/taluks?district=${encodeURIComponent(district)}`);
      const data = await res.json();
      setTaluks(data.taluks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaluks(false);
    }
  };

  const fetchVillages = async (taluk: string) => {
    setLoadingVillages(true);
    try {
      const res = await fetch(`${API_BASE}/api/villages?taluk=${encodeURIComponent(taluk)}`);
      const data = await res.json();
      setVillages(data.villages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVillages(false);
    }
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
    setSelectedTaluk("");
    setSelectedVillage("");
    setDistricts([]);
    setTaluks([]);
    setVillages([]);
    if (state) fetchDistricts(state);
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setSelectedTaluk("");
    setSelectedVillage("");
    setTaluks([]);
    setVillages([]);
    if (district) fetchTaluks(district);
  };

  const handleTalukSelect = (taluk: string) => {
    setSelectedTaluk(taluk);
    setSelectedVillage("");
    setVillages([]);
    if (taluk) fetchVillages(taluk);
  };

  const handleSubmit = async () => {
    setLoadingSubmit(true);
    const payload: LocationPayload = {
      wa_id: waId,
      name,
      state: selectedState,
      district: selectedDistrict,
      taluk: selectedTaluk,
      village: selectedVillage,
    };

    try {
      const res = await fetch(`${API_BASE}/api/submit-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        console.log("Toast visible");
        setToastVisible(true);

        // Start countdown for redirect
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev === 1) {
              clearInterval(interval);
              if (waId) window.location.href = `https://wa.me/${waId}`;
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        console.error("Submission failed:", data);
      }
    } catch (err) {
      console.error("Error submitting:", err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const dropdownClass = "w-full border p-2 rounded-lg disabled:opacity-50";
  const spinner = (
    <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 space-y-5 relative">
        <h1 className="text-2xl font-bold text-center text-blue-700">📍 Select Your Location</h1>

        {/* State */}
        <div className="relative">
          <label className="block font-semibold mb-1 text-gray-600">State</label>
          <select
            className={dropdownClass}
            value={selectedState}
            onChange={(e) => handleStateSelect(e.target.value)}
            disabled={loadingStates}
          >
            <option value="">{loadingStates ? "Loading..." : "Select State"}</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
          {loadingStates && <div className="absolute right-3 top-9">{spinner}</div>}
        </div>

        {/* District */}
        <div className="relative">
          <label className="block font-semibold mb-1 text-gray-600">District</label>
          <select
            className={dropdownClass}
            value={selectedDistrict}
            onChange={(e) => handleDistrictSelect(e.target.value)}
            disabled={!selectedState || loadingDistricts}
          >
            <option value="">{loadingDistricts ? "Loading..." : "Select District"}</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          {loadingDistricts && <div className="absolute right-3 top-9">{spinner}</div>}
        </div>

        {/* Taluk */}
        <div className="relative">
          <label className="block font-semibold mb-1 text-gray-600">Taluk</label>
          <select
            className={dropdownClass}
            value={selectedTaluk}
            onChange={(e) => handleTalukSelect(e.target.value)}
            disabled={!selectedDistrict || loadingTaluks}
          >
            <option value="">{loadingTaluks ? "Loading..." : "Select Taluk"}</option>
            {taluks.map((t) => <option key={t}>{t}</option>)}
          </select>
          {loadingTaluks && <div className="absolute right-3 top-9">{spinner}</div>}
        </div>

        {/* Village */}
        <div className="relative">
          <label className="block font-semibold mb-1 text-gray-600">Village</label>
          <select
            className={dropdownClass}
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            disabled={!selectedTaluk || loadingVillages}
          >
            <option value="">{loadingVillages ? "Loading..." : "Select Village"}</option>
            {villages.map((v) => <option key={v}>{v}</option>)}
          </select>
          {loadingVillages && <div className="absolute right-3 top-9">{spinner}</div>}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedVillage || loadingSubmit}
          className="w-full py-2 bg-blue-600 text-white rounded-lg mt-4 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loadingSubmit ? "Saving..." : "Save & Return"}
        </button>

        {/* Success Toast */}
        {toastVisible && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex flex-col items-center animate-fade-in">
            <span className="font-semibold">✅ Location saved!</span>
            <span className="text-sm mt-1">Returning to WhatsApp in {countdown} seconds...</span>
          </div>
        )}
      </div>
    </div>
  );
}
