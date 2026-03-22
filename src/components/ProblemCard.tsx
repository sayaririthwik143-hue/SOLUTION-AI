import React, { useState } from 'react';
import { Problem, Solution, generateSolution, searchProblems } from '../services/gemini';
import { ChevronDown, ChevronUp, Lightbulb, Target, Cpu, Users, Loader2, Share2, Check, Bot, Zap, Bookmark, BookmarkCheck, BarChart2, CheckCircle2, Layers, Code2, Link as LinkIcon, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProblemCardProps {
  problem: Problem;
  isSaved?: boolean;
  onToggleSave?: (problem: Problem) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, isSaved = false, onToggleSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [relatedProblems, setRelatedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!solution) return;

    let shareText = `Problem: ${problem.title}\n\nSolution Concept: ${solution.concept}\n\nKey Features:\n${solution.features.map(f => `- ${f}`).join('\n')}\n\nTech Stack: ${solution.techStack.join(', ')}`;

    if (solution.isAgentBased) {
      if (solution.agentCapabilities) {
        shareText += `\n\nAI Agent Capabilities:\n${solution.agentCapabilities.map(c => `- ${c}`).join('\n')}`;
      }
      if (solution.agentIntegrations) {
        shareText += `\n\nPotential Integrations:\n${solution.agentIntegrations.map(i => `- ${i}`).join('\n')}`;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Solution: ${problem.title}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleToggle = async () => {
    if (!isExpanded && !solution) {
      setLoading(true);
      setLoadingRelated(true);
      
      try {
        const [sol, related] = await Promise.all([
          generateSolution(problem),
          searchProblems(problem.domain)
        ]);
        
        setSolution(sol);
        // Filter out the current problem from related results
        setRelatedProblems(related.filter(p => p.id !== problem.id).slice(0, 3));
      } catch (err) {
        console.error("Error loading expanded data:", err);
      } finally {
        setLoading(false);
        setLoadingRelated(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.(problem);
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
  };

  return (
    <motion.div 
      layout
      className="glass-card overflow-hidden mb-4"
    >
      <div 
        className="p-6 cursor-pointer flex justify-between items-start gap-4"
        onClick={handleToggle}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 border border-zinc-200 rounded-full">
              {problem.domain}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getImpactColor(problem.impactLevel)}`}>
              <BarChart2 size={10} />
              {problem.impactLevel} Impact
            </span>
            {problem.isAgentSuitable && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                <Bot size={10} />
                Agent Suitable
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
          <p className="text-zinc-600 leading-relaxed">{problem.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            className={`p-2 rounded-full transition-all ${isSaved ? 'text-amber-500 bg-amber-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
          >
            {isSaved ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}
          </button>
          <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 bg-zinc-50/50"
          >
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <Target size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">The Impact</span>
                </div>
                <p className="text-zinc-700">{problem.impact}</p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p className="text-sm font-medium">Architecting a solution...</p>
                </div>
              ) : solution ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                    <div className="flex items-center justify-between gap-2 text-emerald-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Solution Concept</span>
                      </div>
                      <button 
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors border border-emerald-100"
                      >
                        {copied ? (
                          <>
                            <Check size={14} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={14} />
                            <span>Share Solution</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-zinc-800 font-medium leading-relaxed mb-4">
                      {solution.concept}
                    </p>

                    {solution.isAgentBased && (
                      <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-2 text-indigo-600 mb-3">
                          <Bot size={20} />
                          <span className="text-sm font-bold uppercase tracking-wider">AI Agent Architecture</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Autonomous Capabilities</p>
                            <div className="flex flex-wrap gap-2">
                              {solution.agentCapabilities?.map((cap, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-sm">
                                  <Zap size={12} className="text-indigo-400" />
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                          {solution.agentIntegrations && solution.agentIntegrations.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Potential Integrations</p>
                              <div className="flex flex-wrap gap-2">
                                {solution.agentIntegrations.map((integration, i) => (
                                  <span key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 shadow-sm">
                                    <LinkIcon size={12} className="text-indigo-400" />
                                    {integration}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8">
                      <div className="flex items-center gap-2 text-zinc-500 mb-4">
                        <Layers size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Core Features</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {solution.features.map((feature, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all flex gap-3 items-start"
                          >
                            <div className="mt-1 p-1 bg-emerald-50 rounded-md text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <CheckCircle2 size={14} />
                            </div>
                            <p className="text-sm text-zinc-700 font-medium leading-snug">{feature}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                      <div className="bg-gradient-to-br from-zinc-50 to-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 text-zinc-600 mb-4">
                          <div className="p-2 bg-zinc-100 rounded-lg">
                            <Users size={18} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">Target Audience</span>
                        </div>
                        <p className="text-sm text-zinc-800 font-semibold leading-relaxed">
                          {solution.targetAudience}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-zinc-50 to-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 text-zinc-600 mb-4">
                          <div className="p-2 bg-zinc-100 rounded-lg">
                            <Code2 size={18} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">Tech Stack</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {solution.techStack.map((tech, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] font-mono bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm text-zinc-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-default"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Related Problems Section */}
                    <div className="mt-10 pt-8 border-t border-zinc-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Sparkles size={18} className="text-amber-500" />
                          <span className="text-sm font-bold uppercase tracking-wider">Related Challenges</span>
                        </div>
                        <span className="text-[10px] font-medium text-zinc-400 italic">Explore similar pain points in {problem.domain}</span>
                      </div>

                      {loadingRelated ? (
                        <div className="flex items-center gap-3 py-4 text-zinc-400">
                          <Loader2 className="animate-spin" size={16} />
                          <span className="text-xs font-medium">Finding related problems...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {relatedProblems.map((rp) => (
                            <div 
                              key={rp.id}
                              className="group p-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    rp.impactLevel === 'High' ? 'bg-red-400' : 
                                    rp.impactLevel === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`} />
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{rp.impactLevel} Impact</span>
                                </div>
                                <h4 className="text-sm font-bold text-zinc-800 mb-2 line-clamp-2 group-hover:text-black transition-colors">{rp.title}</h4>
                                <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed mb-4">{rp.description}</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSave?.(rp);
                                }}
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider transition-colors border border-zinc-100"
                              >
                                <Plus size={12} />
                                Save to List
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-400 text-center py-4 italic">Failed to generate solution. Please try again.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
