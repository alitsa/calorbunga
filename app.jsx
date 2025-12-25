import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  Utensils,
  Info,
  ListPlus,
  Loader2,
  Cloud,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  CheckCircle2,
  Lightbulb,
  Sun,
  Palmtree,
  Waves,
  Zap,
  Star,
  Droplets
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';

// --- Firebase Configuration ---
/**
 * Safely handle environment variables for both Preview and Heroku/Vite environments.
 * To avoid "import.meta" warnings in environments that don't support it,
 * we use a try-catch block to probe for the existence of the meta object.
 */
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }

  try {
    // Attempting to access import.meta via a dynamic property check
    // to bypass static analysis warnings in some compilers.
    const meta = (window as any).import?.meta || (globalThis as any).import?.meta;
    const env = meta?.env;
    if (env?.VITE_FIREBASE_CONFIG) {
      return JSON.parse(env.VITE_FIREBASE_CONFIG);
    }
  } catch (e) {
    // Fallback if import.meta is strictly forbidden/unavailable
  }

  // Final fallback: check process.env (common in older bundlers/Heroku)
  if (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_CONFIG) {
    return JSON.parse(process.env.VITE_FIREBASE_CONFIG);
  }

  return {};
};

const getAppId = () => {
  if (typeof __app_id !== 'undefined') return __app_id;

  try {
    const meta = (window as any).import?.meta || (globalThis as any).import?.meta;
    const env = meta?.env;
    if (env?.VITE_APP_ID) return env.VITE_APP_ID;
  } catch (e) {}

  if (typeof process !== 'undefined' && process.env?.VITE_APP_ID) {
    return process.env.VITE_APP_ID;
  }

  return 'permanent-christmas-food-diary-v1';
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = getAppId();

const App = () => {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));

  const displayDate = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDate]);

  const changeDate = (offset) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);
    setSelectedDate(getLocalDateString(date));
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'food_logs');
    const unsubscribe = onSnapshot(colRef,
      (snapshot) => {
        const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = allItems
          .filter(item => item.date === selectedDate)
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(filtered);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Sync error.");
      }
    );
    return () => unsubscribe();
  }, [user, selectedDate]);

  const totals = useMemo(() => {
    const stats = items.reduce((acc, item) => ({
      cal: acc.cal + Math.round(item.stats?.cal || 0),
      p: acc.p + Math.round(item.stats?.p || 0),
      c: acc.c + Math.round(item.stats?.c || 0),
      f: acc.f + Math.round(item.stats?.f || 0),
      w: acc.w + Math.round(item.stats?.w || 0)
    }), { cal: 0, p: 0, c: 0, f: 0, w: 0 });

    const totalMass = stats.p + stats.c + stats.f;
    const percentages = {
      p: totalMass > 0 ? Math.round((stats.p / totalMass) * 100) : 0,
      c: totalMass > 0 ? Math.round((stats.c / totalMass) * 100) : 0,
      f: totalMass > 0 ? Math.round((stats.f / totalMass) * 100) : 0,
    };

    return { ...stats, percentages, totalMass };
  }, [items]);

  const currentTheme = useMemo(() => {
    const patterns = {
      default: {
        advice: "The vibes are pristine, friend! Log some fuel to keep the day looking bright.",
        color: '#e9d5ff',
        pattern: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='black' stroke-width='1'%3E%3Cpath d='M15 15 L45 20 L25 50 Z' transform='rotate(25 30 30)'/%3E%3Cpath d='M85 85 L115 90 L95 120 Z' transform='rotate(-15 100 100)'/%3E%3Crect x='60' y='15' width='25' height='25' transform='rotate(45 72 27)'/%3E%3Crect x='15' y='85' width='18' height='18' transform='rotate(-30 24 94)'/%3E%3Ccircle cx='95' cy='30' r='12'/%3E%3Ccircle cx='50' cy='85' r='8'/%3E%3C/g%3E%3C/svg%3E")`
      },
      carbs: {
        advice: "Total Carborama! You're crushing the energy. Next up, try some tempeh or lentils to balance out that protein vibe.",
        color: '#bbf7d0',
        pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='black' stroke-width='1'%3E%3Cpath d='M10 10 L30 15 L15 35 Z' transform='rotate(15 20 20)'/%3E%3Cpath d='M70 20 L90 10 L85 40 Z' transform='rotate(-10 80 25)'/%3E%3Cpath d='M40 50 L60 45 L55 70 Z' transform='rotate(45 50 55)'/%3E%3Cpath d='M15 80 L40 90 L20 95 Z' transform='rotate(20 27 87)'/%3E%3Cpath d='M80 70 L95 85 L75 95 Z' transform='rotate(-30 85 82)'/%3E%3Cpath d='M45 10 L55 30 L35 25 Z' transform='rotate(180 45 20)'/%3E%3C/g%3E%3C/svg%3E")`
      },
      protein: {
        advice: "Protein Powerhouse! Totally stellar. Maybe grab some sweet potato or fruit to get those carbs back in the mix.",
        color: '#fce7f3',
        pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='black' stroke-width='1'%3E%3Crect x='10' y='15' width='20' height='20' transform='rotate(12 20 25)'/%3E%3Crect x='65' y='10' width='15' height='15' transform='rotate(-20 72 17)'/%3E%3Crect x='40' y='45' width='25' height='25' transform='rotate(35 52 57)'/%3E%3Crect x='70' y='70' width='18' height='18' transform='rotate(10 79 79)'/%3E%3Crect x='15' y='75' width='12' height='12' transform='rotate(-45 21 81)'/%3E%3Crect x='45' y='5' width='10' height='10' transform='rotate(60 50 10)'/%3E%3C/g%3E%3C/svg%3E")`
      },
      fats: {
        advice: "Omega-Rad! Your fats are looking solid. Try some brown rice or black beans for a complex carb boost.",
        color: '#fef9c3',
        pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='black' stroke-width='1'%3E%3Ccircle cx='20' cy='20' r='10'/%3E%3Ccircle cx='80' cy='15' r='6'/%3E%3Ccircle cx='50' cy='50' r='15'/%3E%3Ccircle cx='15' cy='80' r='8'/%3E%3Ccircle cx='85' cy='85' r='12'/%3E%3Ccircle cx='55' cy='15' r='4'/%3E%3C/g%3E%3C/svg%3E")`
      }
    };

    const foodItems = items.filter(item => (item.stats?.cal || 0) > 0 || (item.stats?.p || 0) > 0);
    if (foodItems.length === 0) return patterns.default;

    const pCals = totals.p * 4;
    const cCals = totals.c * 4;
    const fCals = totals.f * 9;
    const totalCals = pCals + cCals + fCals;

    if (totalCals > 0) {
      const pPct = pCals / totalCals;
      const fPct = fCals / totalCals;
      const cPct = cCals / totalCals;

      if (pPct > 0.30) return patterns.protein;
      if (fPct > 0.40) return patterns.fats;
      if (cPct > 0.60) return patterns.carbs;
    }

    return {
      ...patterns.default,
      advice: "You're keeping it totally balanced, dude! Keep that plant-power coming."
    };
  }, [items, totals]);

  const fetchNutritionStats = async (foodQuery) => {
    const apiKey = "";
    const model = "gemini-2.5-flash-preview-09-2025";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const systemPrompt = `Nutrition calculator. Provide estimated cal, p, c, f (in grams) and w (water in ounces) as JSON object. Assume vegan ingredients unless specified. If the user logs water or a beverage, calculate "w" based on the volume mentioned or estimated. If it is JUST water, set cal, p, c, f to 0.`;
    const payload = {
      contents: [{ parts: [{ text: foodQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    };
    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      } catch (err) {
        if (i === 4) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;
    setIsLoading(true);
    setError(null);
    const rawNames = input.split(/[,\n]/).map(str => str.trim()).filter(s => s.length > 0);
    try {
      for (const name of rawNames) {
        const stats = await fetchNutritionStats(name);
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'food_logs'), {
          name,
          date: selectedDate,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          stats: {
            cal: Math.round(stats.cal || 0),
            p: Math.round(stats.p || 0),
            c: Math.round(stats.c || 0),
            f: Math.round(stats.f || 0),
            w: Math.round(stats.w || 0)
          }
        });
      }
      setInput('');
    } catch (err) { setError("Wipeout! Save failed."); } finally { setIsLoading(false); }
  };

  const removeItem = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'food_logs', id));
  };

  const handleCopyClipboard = () => {
    if (items.length === 0) return;
    const text = items.map(i => i.name).join(', ');
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      setError("Failed to copy.");
    }
    document.body.removeChild(textArea);
  };

  const handleDownloadCSV = () => {
    if (items.length === 0) return;
    const headers = "Name,Time,Date,Calories,Protein,Carbs,Fat,Water\n";
    const rows = items.map(i =>
      `"${i.name}","${i.time}","${i.date}",${Math.round(i.stats?.cal || 0)},${Math.round(i.stats?.p || 0)},${Math.round(i.stats?.c || 0)},${Math.round(i.stats?.f || 0)},${Math.round(i.stats?.w || 0)}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `calorbunga_log_${selectedDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="block min-h-screen overflow-y-auto p-4 sm:p-8 font-sans text-slate-900 transition-all duration-500 relative"
      style={{
        backgroundColor: currentTheme.color,
        backgroundImage: currentTheme.pattern,
        backgroundAttachment: 'fixed'
      }}
    >
      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black animate-bounce">
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold uppercase italic tracking-tighter">Totally Copied!</span>
        </div>
      )}

      <div className="block w-full max-w-xl mx-auto bg-white rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

        <div className="block bg-teal-400 p-6 border-b-4 border-black relative overflow-hidden">
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-pink-500 rounded-full opacity-20"></div>
          <div className="absolute -bottom-8 -right-4 w-24 h-24 bg-yellow-300 rotate-45 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-black italic tracking-tighter mb-4 text-black uppercase flex items-center gap-2 drop-shadow-[2px_2px_0px_#fff]">
              <Waves className="text-pink-500" />
              Calorbunga!
            </h1>

            <div className="flex items-center justify-between bg-black text-white px-4 py-2 border-2 border-pink-500 shadow-[4px_4px_0px_0px_#ec4899]">
              <button onClick={() => changeDate(-1)} className="hover:text-teal-400 transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest italic text-center min-w-[140px]">
                <Sun size={16} className="text-yellow-400 shrink-0" />
                {displayDate}
              </div>
              <button onClick={() => changeDate(1)} className="hover:text-teal-400 transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="block p-5 border-b-4 border-black bg-pink-50">
          <form onSubmit={handleAdd} className="block">
            <textarea
              className="block w-full p-4 border-4 border-black focus:ring-0 outline-none text-sm resize-none shadow-[4px_4px_0px_0px_#000] mb-4 font-bold"
              rows="3"
              placeholder="Log food or water (e.g., '16oz water' or 'Açaí bowl')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || !user}
            />
            {error && <p className="text-red-600 font-bold text-xs mb-3">⚠️ {error}</p>}
            <button
              type="submit"
              disabled={isLoading || !user}
              className="flex w-full bg-teal-400 hover:bg-teal-300 disabled:bg-slate-300 text-black border-4 border-black font-black uppercase italic py-3 rounded-none items-center justify-center gap-2 transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><ListPlus size={18} /> Add to The Log</>}
            </button>
          </form>
        </div>

        <div className="block px-6 py-5 bg-white border-b-4 border-black">
          <div className="block p-5 border-4 border-black bg-yellow-100 shadow-[6px_6px_0px_0px_rgba(236,72,153,1)]">
            {!user ? (
              <p className="text-center font-black italic text-pink-500 uppercase tracking-widest animate-pulse">Syncing the Grid...</p>
            ) : (
              <div className="block space-y-4">
                <div className="block text-center sm:text-left border-b-2 border-black pb-3">
                  <p className="block text-sm font-black uppercase italic leading-none mb-3 text-slate-800">
                    Daily Intake: <span className="text-teal-600 text-3xl drop-shadow-[1px_1px_0px_#000]">{Math.round(totals.cal)}</span> cals
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000]">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-pink-500">Protein</span>
                      <span className="text-sm font-black">{Math.round(totals.p)}g</span>
                      <span className="text-[10px] font-bold opacity-60 italic">{Math.round(totals.percentages.p)}%</span>
                    </div>
                    <div className="flex flex-col bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000]">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-teal-600">Carbs</span>
                      <span className="text-sm font-black">{Math.round(totals.c)}g</span>
                      <span className="text-[10px] font-bold opacity-60 italic">{Math.round(totals.percentages.c)}%</span>
                    </div>
                    <div className="flex flex-col bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000]">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-yellow-600">Fats</span>
                      <span className="text-sm font-black">{Math.round(totals.f)}g</span>
                      <span className="text-[10px] font-bold opacity-60 italic">{Math.round(totals.percentages.f)}%</span>
                    </div>
                    <div className="flex flex-col bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000]">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500">Water</span>
                      <span className="text-sm font-black">{Math.round(totals.w)}oz</span>
                      <Droplets size={10} className="text-blue-400 mt-auto" />
                    </div>
                  </div>
                </div>

                <div className="block flex gap-3 items-start pt-1">
                  <Zap size={20} className="text-pink-500 shrink-0 fill-pink-500" />
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-1 underline">Sensei's Tips:</h3>
                    <p className="text-xs text-slate-700 leading-tight font-bold italic">"{currentTheme.advice}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="block px-6 py-6 min-h-[300px] bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-pink-500 fill-pink-500" />
              <h2 className="text-[10px] font-black text-black uppercase tracking-[0.3em] underline decoration-teal-400 decoration-4">The Feed</h2>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopyClipboard} className="p-2 border-2 border-black bg-white hover:bg-pink-100 shadow-[2px_2px_0px_0px_#000]" title="Copy"><Copy size={16} /></button>
                <button onClick={handleDownloadCSV} className="p-2 border-2 border-black bg-white hover:bg-teal-100 shadow-[2px_2px_0px_0px_#000]" title="CSV"><Download size={16} /></button>
              </div>
            )}
          </div>

          <div className="block space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white border-4 border-black hover:bg-pink-50 transition-colors shadow-[4px_4px_0px_0px_#000] group relative">
                <div className="block flex-1 min-w-0 pr-4">
                  <p className="block text-sm font-black text-black uppercase italic truncate">{item.name}</p>
                  <p className="block text-[10px] text-teal-600 font-black tracking-tighter mt-1 uppercase">
                    {item.time} // <span className="text-pink-500">{Math.round(item.stats?.cal || 0)} CALS</span>
                    {item.stats?.w > 0 && <span className="text-blue-500 ml-2">// {Math.round(item.stats.w)} OZ WATER</span>}
                  </p>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-black hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="block text-center py-10 opacity-30 italic font-black uppercase tracking-widest text-xs">
                No entries logged yet...
              </div>
            )}
          </div>
        </div>

        <div className="block p-4 bg-teal-400 border-t-4 border-black text-center">
          <p className="text-[10px] font-black uppercase italic text-black">Calorbunga! • Stay Radical</p>
        </div>
      </div>
    </div>
  );
};

export default App;
