import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DomainTrend } from '../services/gemini';
import { BarChart3 } from 'lucide-react';

interface DomainTrendsProps {
  trends: DomainTrend[];
}

export const DomainTrends: React.FC<DomainTrendsProps> = ({ trends }) => {
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="glass-card p-6 mb-12">
      <div className="flex items-center gap-2 mb-6 text-zinc-800">
        <BarChart3 size={20} className="text-black" />
        <h2 className="text-sm font-bold uppercase tracking-widest">Global Domain Intensity</h2>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trends}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="domain" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
            />
            <Tooltip 
              cursor={{ fill: '#f8f9fa' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="intensity" 
              radius={[6, 6, 0, 0]}
              barSize={40}
            >
              {trends.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {trends.map((trend, i) => (
          <div key={i} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{trend.domain}</p>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold text-zinc-800">{trend.growth}%</span>
              <span className="text-[10px] text-emerald-600 font-bold mb-1">↑ Growth</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
