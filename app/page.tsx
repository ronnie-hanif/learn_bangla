// @ts-nocheck
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

type Card = {
  id: string;
  en: string;
  bn: string;
  translit: string;
  topic: string;
  emoji?: string;
  img?: string;   // photo URL
};

type Strength = { correct: number; wrong: number; lastSeen: number };

const key = (k: string) => `bengali-buddy:${k}`;
const loadStrength = (): Record<string, Strength> => {
  try { return JSON.parse(localStorage.getItem(key('strength')) || '{}'); } catch { return {}; }
};
const saveStrength = (s: Record<string, Strength>) => localStorage.setItem(key('strength'), JSON.stringify(s));
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(key('prefs')) || 'null') || { translit: true, photos: true }; }
  catch { return { translit: true, photos: true }; }
};
const savePrefs = (p: any) => localStorage.setItem(key('prefs'), JSON.stringify(p));

// Using Unsplash Source (free hotlink) for simple, relevant photos by keyword.
// You can replace any of these URLs with your own images in /public or a CMS.
const U = (q: string) => `https://source.unsplash.com/featured/300x300?${encodeURIComponent(q)}`;

const CARDS: Card[] = [
  // Basics
  { id: 'hello', en: 'Hello', bn: 'হ্যালো', translit: 'hyālō', topic: 'Basics', emoji: '👋', img: U('wave hello person') },
  { id: 'hi', en: 'Hi', bn: 'হাই', translit: 'hai', topic: 'Basics', emoji: '🙋', img: U('greeting wave hand') },
  { id: 'how_are_you', en: 'How are you?', bn: 'আপনি কেমন আছেন?', translit: 'apni kemon achen?', topic: 'Basics', emoji: '🙂', img: U('smiling person portrait friendly') },
  { id: 'im_fine', en: \"I'm fine\", bn: 'আমি ভালো আছি', translit: 'ami bhalo achi', topic: 'Basics', emoji: '💪', img: U('thumbs up success') },
  { id: 'please', en: 'Please', bn: 'দয়া করে', translit: 'dôya kore', topic: 'Basics', emoji: '🙏', img: U('hands together please gesture') },
  { id: 'thank_you', en: 'Thank you', bn: 'ধন্যবাদ', translit: 'dhônnôbād', topic: 'Basics', emoji: '🙏', img: U('thank you card note') },
  { id: 'sorry', en: 'Sorry', bn: 'দুঃখিত', translit: 'dukkhito', topic: 'Basics', emoji: '😔', img: U('apology sorry') },
  { id: 'yes', en: 'Yes', bn: 'হ্যাঁ', translit: 'hyã', topic: 'Basics', emoji: '✅', img: U('check mark green tick') },
  { id: 'no', en: 'No', bn: 'না', translit: 'nā', topic: 'Basics', emoji: '❌', img: U('red cross x sign') },
  { id: 'goodbye', en: 'Goodbye', bn: 'বিদায়', translit: 'bidāy', topic: 'Basics', emoji: '👋', img: U('goodbye wave leaving') },

  // Food
  { id: 'water', en: 'Water', bn: 'পানি', translit: 'pani', topic: 'Food', emoji: '💧', img: U('glass of water') },
  { id: 'tea', en: 'Tea', bn: 'চা', translit: 'cha', topic: 'Food', emoji: '🍵', img: U('cup of tea chai') },
  { id: 'rice', en: 'Rice', bn: 'ভাত', translit: 'bhat', topic: 'Food', emoji: '🍚', img: U('bowl of rice white rice') },
  { id: 'fish', en: 'Fish', bn: 'মাছ', translit: 'machh', topic: 'Food', emoji: '🐟', img: U('fish cooked fish plate') },
  { id: 'chicken', en: 'Chicken', bn: 'মুরগি', translit: 'murgi', topic: 'Food', emoji: '🍗', img: U('chicken curry dish') },
  { id: 'vegetarian', en: 'Vegetarian', bn: 'নিরামিষ', translit: 'niromish', topic: 'Food', emoji: '🥗', img: U('vegetarian salad greens') },
  { id: 'not_spicy', en: 'Not spicy', bn: 'ঝাল কম', translit: 'jhal kom', topic: 'Food', emoji: '🥛', img: U('mild food not spicy') },
  { id: 'tasty', en: 'Very tasty!', bn: 'খুব মজা!', translit: 'khub moja!', topic: 'Food', emoji: '😋', img: U('delicious food dish') },

  // Travel/places
  { id: 'where_is', en: 'Where is…?', bn: '… কোথায়?', translit: '… kothay?', topic: 'Travel', emoji: '🧭', img: U('map navigation pointer') },
  { id: 'bathroom', en: 'Bathroom', bn: 'বাথরুম', translit: 'bathrum', topic: 'Travel', emoji: '🚻', img: U('toilet bathroom sign') },

  // Transport
  { id: 'bus', en: 'Bus', bn: 'বাস', translit: 'bas', topic: 'Transport', emoji: '🚌', img: U('bus in city dhaka bus') },
  { id: 'train', en: 'Train', bn: 'ট্রেন', translit: 'tren', topic: 'Transport', emoji: '🚆', img: U('train station platform') },
  { id: 'rickshaw', en: 'Rickshaw', bn: 'রিকশা', translit: 'ricksha', topic: 'Transport', emoji: '🛺', img: U('rickshaw in dhaka bangladesh') },
  { id: 'ticket', en: 'Ticket', bn: 'টিকিট', translit: 'tikit', topic: 'Transport', emoji: '🎫', img: U('ticket stub paper') },

  // Numbers
  { id: 'one', en: 'One', bn: 'এক', translit: 'ek', topic: 'Numbers', emoji: '1️⃣', img: U('number one 1') },
  { id: 'two', en: 'Two', bn: 'দুই', translit: 'dui', topic: 'Numbers', emoji: '2️⃣', img: U('number two 2') },
  { id: 'three', en: 'Three', bn: 'তিন', translit: 'tin', topic: 'Numbers', emoji: '3️⃣', img: U('number three 3') },
];

const speak = (text: string, lang = 'bn-BD') => {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = lang; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
};

function pick<T>(arr: T[], n: number) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function Picture({ card, size = 96, enabled = true }: { card: Card; size?: number; enabled?: boolean }) {
  if (enabled && card.img) return (
    <img
      src={card.img}
      alt={card.en}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-xl object-cover aspect-square w-full h-auto"
      style={{ maxWidth: size, maxHeight: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
  return <div style={{ fontSize: size * 0.7 }} className="leading-none select-none">{card.emoji || '🖼️'}</div>;
}

function UnitBadge({ title, completed, total }: { title: string; completed: number; total: number }) {
  const pct = Math.min(100, Math.round((completed / Math.max(1, total)) * 100));
  return (
    <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-neutral-500">{completed} / {total} mastered</div>
      </div>
      <div className="text-sm">{pct}%</div>
    </div>
  );
}

type ExType = 'imageChoice' | 'audioChoice';

function makeRound(cards: Card[], size = 8): { ex: ExType; target: Card; options: Card[] }[] {
  const pool = pick(cards, Math.min(size, cards.length));
  return pool.map((target) => {
    const distractors = pick(cards.filter((c) => c.id !== target.id && c.topic === target.topic), 3);
    const options = pick([target, ...distractors], Math.min(4, 1 + distractors.length));
    const ex: ExType = Math.random() < 0.5 ? 'imageChoice' : 'audioChoice';
    return { ex, target, options };
  });
}

function ImageChoice({ q, onAnswer, showTranslit, photosEnabled }: { q: { target: Card; options: Card[] }; onAnswer: (ok: boolean) => void; showTranslit: boolean; photosEnabled: boolean }) {
  const { target, options } = q;
  return (
    <div className="grid gap-4">
      <div className="text-center">
        <div className="text-2xl font-semibold mb-1">{target.en}</div>
        <div className="text-neutral-500">Tap the correct picture</div>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {options.map((o) => (
          <button key={o.id} onClick={() => onAnswer(o.id === target.id)} className="bg-white rounded-2xl p-3 shadow flex flex-col items-center gap-2">
            <Picture card={o} enabled={photosEnabled} />
            <div className="text-lg">{o.bn}</div>
            {showTranslit && <div className="text-xs text-neutral-500">{o.translit}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function AudioChoice({ q, onAnswer, showTranslit, photosEnabled }: { q: { target: Card; options: Card[] }; onAnswer: (ok: boolean) => void; showTranslit: boolean; photosEnabled: boolean }) {
  const { target, options } = q;
  return (
    <div className="grid gap-4">
      <div className="text-center">
        <div className="text-2xl font-semibold mb-1">Listen and choose</div>
        <button className="px-4 py-2 rounded-xl bg-neutral-100" onClick={() => speak(target.bn)}>🔊 Play</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
        {options.map((o) => (
          <button key={o.id} onClick={() => onAnswer(o.id === target.id)} className="bg-white rounded-2xl p-4 shadow text-left">
            <div className="flex items-center gap-3">
              <Picture card={o} size={64} enabled={photosEnabled} />
              <div>
                <div className="text-lg">{o.bn}</div>
                {showTranslit && <div className="text-xs text-neutral-500">{o.translit}</div>}
                <div className="text-xs text-neutral-500">{o.en}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function updateStrength(id: string, ok: boolean) {
  const s = loadStrength();
  const prev = s[id] || { correct: 0, wrong: 0, lastSeen: 0 };
  s[id] = { correct: prev.correct + (ok ? 1 : 0), wrong: prev.wrong + (ok ? 0 : 1), lastSeen: Date.now() };
  saveStrength(s);
}

export default function Page() {
  const [prefs, setPrefs] = useState(loadPrefs());
  const [tab, setTab] = useState<'home' | 'lesson' | 'progress' | 'settings'>('home');
  const [topic, setTopic] = useState<string | null>(null);
  const [round, setRound] = useState<ReturnType<typeof makeRound>>([]);
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(key('streak'))) || 0);

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const topics = useMemo(() => Array.from(new Set(CARDS.map(c => c.topic))), []);
  const topicCounts = useMemo(() => Object.fromEntries(topics.map(t => [t, CARDS.filter(c => c.topic === t).length])), [topics]);

  const startLesson = (t: string) => {
    setTopic(t);
    setRound(makeRound(CARDS.filter(c => c.topic === t), 8));
    setIdx(0);
    setTab('lesson');
  };

  const current = round[idx];
  const answer = (ok: boolean) => {
    if (current) updateStrength(current.target.id, ok);
    if (idx + 1 >= round.length) {
      setTab('home');
      const newStreak = streak + 1; setStreak(newStreak); localStorage.setItem(key('streak'), String(newStreak));
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <div className="text-2xl font-semibold">Bengali Buddy <span className="text-neutral-400 text-base">(Photos + Audio)</span></div>
            <div className="text-sm text-neutral-500">Beginner-friendly lessons with real photos. Bangladesh dialect, transliteration on.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('home')} className={clsx('px-3 py-1 rounded-2xl text-sm', tab === 'home' ? 'bg-black text-white' : 'bg-white shadow')}>Home</button>
            <button onClick={() => setTab('progress')} className={clsx('px-3 py-1 rounded-2xl text-sm', tab === 'progress' ? 'bg-black text-white' : 'bg-white shadow')}>Progress</button>
            <button onClick={() => setTab('settings')} className={clsx('px-3 py-1 rounded-2xl text-sm', tab === 'settings' ? 'bg-black text-white' : 'bg-white shadow')}>Settings</button>
          </div>
        </header>

        {tab === 'home' && (
          <div className="grid gap-4">
            <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-500">Daily streak</div>
                <div className="text-2xl font-semibold">{streak} 🔥</div>
              </div>
              <div className="text-xs text-neutral-500">Complete a lesson to extend it</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topics.map((t) => (
                <button key={t} onClick={() => startLesson(t)} className="bg-white rounded-2xl p-4 shadow text-left hover:shadow-md transition">
                  <div className="text-sm text-neutral-500">Skill</div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-xs text-neutral-500">{topicCounts[t]} words</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'lesson' && current && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">{idx + 1} / {round.length}</div>
              <button className="text-sm underline" onClick={() => speak(current.target.bn)}>🔊 Hear target</button>
            </div>
            {current.ex === 'imageChoice' ? (
              <ImageChoice q={current} onAnswer={answer} showTranslit={prefs.translit} photosEnabled={prefs.photos} />
            ) : (
              <AudioChoice q={current} onAnswer={answer} showTranslit={prefs.translit} photosEnabled={prefs.photos} />
            )}
          </div>
        )}

        {tab === 'progress' && (
          <div className="grid gap-3 max-w-xl">
            {topics.map((t) => (
              <div key={t} className="bg-white rounded-2xl p-4 shadow">
                <div className="font-semibold mb-1">{t}</div>
                <div className="grid grid-cols-1 gap-2">
                  {CARDS.filter(c => c.topic === t).map((c) => {
                    const s = loadStrength()[c.id];
                    const total = s ? s.correct + s.wrong : 0;
                    const acc = total ? Math.round((s!.correct / total) * 100) : 0;
                    return (
                      <div key={c.id} className="flex items-center justify-between border rounded-xl p-2">
                        <div className="flex items-center gap-3">
                          <Picture card={c} size={48} enabled={prefs.photos} />
                          <div>
                            <div className="font-medium">{c.bn} <span className="text-neutral-400 text-sm">{prefs.translit ? c.translit : ''}</span></div>
                            <div className="text-xs text-neutral-500">{c.en}</div>
                          </div>
                        </div>
                        <div className="text-sm">{total ? `${acc}%` : '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="grid gap-3 max-w-xl">
            <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
              <div>
                <div className="font-semibold">Show transliteration</div>
                <div className="text-sm text-neutral-500">Turn off later to rely only on Bengali script</div>
              </div>
              <button onClick={() => setPrefs({ ...prefs, translit: !prefs.translit })} className="px-3 py-2 rounded-xl bg-neutral-100">{prefs.translit ? 'On' : 'Off'}</button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
              <div>
                <div className="font-semibold">Use real photos</div>
                <div className="text-sm text-neutral-500">Toggle to switch between photos and emoji</div>
              </div>
              <button onClick={() => setPrefs({ ...prefs, photos: !prefs.photos })} className="px-3 py-2 rounded-xl bg-neutral-100">{prefs.photos ? 'On' : 'Off'}</button>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow">
              <div className="font-semibold mb-2">About photos</div>
              <div className="text-sm text-neutral-600">Images are fetched from Unsplash Source by keyword. For production, replace with your own images in <code>/public</code> or a CMS.</div>
            </div>
          </div>
        )}

        <footer className="mt-10 text-xs text-neutral-500">Add to Home Screen on iOS (Share → Add to Home Screen) for an app‑like experience.</footer>
      </div>
    </div>
  );
}
