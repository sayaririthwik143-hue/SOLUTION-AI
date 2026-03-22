import { useState, FormEvent, useEffect } from 'react';
import { Search, Globe, Sparkles, Loader2, AlertCircle, TrendingUp, Bookmark, ChevronRight, Bot } from 'lucide-react';
import { Problem, searchProblems, getTrendingProblems, getDomainTrends, DomainTrend, getSubDomains } from './services/gemini';
import { ProblemCard } from './components/ProblemCard';
import { DomainTrends } from './components/DomainTrends';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [domain, setDomain] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [trends, setTrends] = useState<DomainTrend[]>([]);
  const [subDomains, setSubDomains] = useState<string[]>([]);
  const [savedProblems, setSavedProblems] = useState<Problem[]>(() => {
    const saved = localStorage.getItem('savedProblems');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'all' | 'saved'>('all');
  const [impactFilter, setImpactFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [agentOnly, setAgentOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTrending, setIsTrending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [trending, domainTrends] = await Promise.all([
          getTrendingProblems(),
          getDomainTrends()
        ]);
        setProblems(trending);
        setTrends(domainTrends);
        setIsTrending(true);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem('savedProblems', JSON.stringify(savedProblems));
  }, [savedProblems]);

  const handleToggleSave = (problem: Problem) => {
    setSavedProblems(prev => {
      const isAlreadySaved = prev.some(p => p.id === problem.id);
      if (isAlreadySaved) {
        return prev.filter(p => p.id !== problem.id);
      }
      return [...prev, problem];
    });
  };

  const handleSearch = async (e: FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const searchTerm = typeof e === 'string' ? e : domain;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setIsTrending(false);
    if (typeof e === 'string') setDomain(searchTerm);

    try {
      const [results, subs] = await Promise.all([
        searchProblems(searchTerm),
        getSubDomains(searchTerm)
      ]);
      setProblems(results);
      setSubDomains(subs);
      if (results.length === 0) {
        setError("No problems found for this domain. Try something broader like 'Healthcare' or 'Logistics'.");
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProblems = problems.filter(p => 
    (impactFilter === 'All' || p.impactLevel === impactFilter) &&
    (!agentOnly || p.isAgentSuitable)
  );

  const filteredSavedProblems = savedProblems.filter(p => 
    (impactFilter === 'All' || p.impactLevel === impactFilter) &&
    (!agentOnly || p.isAgentSuitable)
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <header className="pt-20 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-6">
            <Globe size={14} />
            <span>Global Problem Explorer</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-black to-zinc-600">
            Build things that <br />actually matter.
          </h1>
          <p className="text-xl text-zinc-500 mb-10 leading-relaxed">
            Enter a domain to discover real-world problems and architectural solutions. 
            Stop building clones, start solving pain points.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-6">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. Sports, Fitness, Healthcare, Logistics..."
              className="input-field pr-32 h-14 text-lg shadow-xl shadow-black/5"
            />
            <button
              type="submit"
              disabled={loading || !domain.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              <span>Search</span>
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {['Sports', 'Fitness', 'Healthcare', 'Education', 'Logistics'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleSearch(cat)}
                className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-black hover:text-black transition-all shadow-sm"
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      </header>

      {/* Results Section */}
      <main className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8 border-b border-zinc-200">
          <button 
            onClick={() => setView('all')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${view === 'all' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Explore
            {view === 'all' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
          </button>
          <button 
            onClick={() => setView('saved')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative flex items-center gap-2 ${view === 'saved' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            Saved
            <span className="bg-zinc-100 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded-full">{savedProblems.length}</span>
            {view === 'saved' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2 whitespace-nowrap">Impact Level:</span>
            {['All', 'Low', 'Medium', 'High'].map((level) => (
              <button
                key={level}
                onClick={() => setImpactFilter(level as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                  impactFilter === level 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          <div className="h-4 w-px bg-zinc-200 hidden md:block" />

          <button
            onClick={() => setAgentOnly(!agentOnly)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
              agentOnly 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <Bot size={14} />
            AI Agent Suitable
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === 'saved' ? (
            <motion.div
              key="saved-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {savedProblems.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <Bookmark className="mx-auto text-zinc-300 mb-4" size={40} />
                  <p className="text-zinc-500 font-medium">No saved problems yet.</p>
                  <p className="text-zinc-400 text-sm mt-1">Problems you bookmark will appear here.</p>
                  <button 
                    onClick={() => setView('all')}
                    className="mt-6 text-sm font-bold text-black hover:underline"
                  >
                    Start Exploring
                  </button>
                </div>
              ) : filteredSavedProblems.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">
                  <p>No saved problems match your filters.</p>
                </div>
              ) : (
                filteredSavedProblems.map((problem) => (
                  <ProblemCard 
                    key={problem.id} 
                    problem={problem} 
                    isSaved={true}
                    onToggleSave={handleToggleSave}
                  />
                ))
              )}
            </motion.div>
          ) : loading && problems.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-zinc-400"
            >
              <div className="relative mb-6">
                <Loader2 className="animate-spin text-black" size={48} />
                <Sparkles className="absolute -top-2 -right-2 text-emerald-500 animate-pulse" size={24} />
              </div>
              <p className="text-lg font-medium text-zinc-600">Scanning global data for problems...</p>
              <p className="text-sm">This might take a few seconds.</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600"
            >
              <AlertCircle size={20} />
              <p className="font-medium">{error}</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {isTrending && trends.length > 0 && (
                <DomainTrends trends={trends} />
              )}

              <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                    {isTrending ? 'Trending Global Problems' : `Problems in ${domain}`}
                  </h2>
                  {isTrending && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase rounded border border-amber-100">
                      <TrendingUp size={10} />
                      High Impact
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 italic">
                  Click a card to generate a solution
                </div>
              </div>

              {!isTrending && subDomains.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    Refine by Sub-Domain <ChevronRight size={10} />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subDomains.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(sub)}
                        className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-600 hover:border-black hover:text-black transition-all shadow-sm"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredProblems.length === 0 && !loading ? (
                <div className="text-center py-20 text-zinc-400">
                  <p>No problems found matching your filters in this domain.</p>
                </div>
              ) : (
                filteredProblems.map((problem) => (
                  <ProblemCard 
                    key={problem.id} 
                    problem={problem} 
                    isSaved={savedProblems.some(p => p.id === problem.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Info */}
      <footer className="mt-20 border-t border-zinc-100 pt-12 text-center text-zinc-400 text-xs">
        <p>© 2026 Problem-Solution Explorer • Powered by Gemini AI</p>
      </footer>
    </div>
  );
}
