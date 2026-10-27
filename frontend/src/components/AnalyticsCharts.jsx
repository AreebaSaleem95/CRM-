import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function AnalyticsCharts({ deals = [], currencySymbol = '$' }) {
  // 1. Stage-wise value aggregation for Bar Chart
  const stageDataMap = {};
  deals.forEach((deal) => {
    const stage = deal.stage || 'Lead In';
    const val = Number(deal.value) || 0;
    stageDataMap[stage] = (stageDataMap[stage] || 0) + val;
  });

  const barData = Object.keys(stageDataMap).map((stage) => ({
    stage,
    totalValue: stageDataMap[stage]
  }));

  // 2. Priority breakdown for Pie Chart
  const priorityMap = { High: 0, Medium: 0, Low: 0 };
  deals.forEach((deal) => {
    const p = deal.priority || 'Medium';
    if (priorityMap[p] !== undefined) {
      priorityMap[p] += 1;
    } else {
      priorityMap['Medium'] += 1;
    }
  });

  const pieData = Object.keys(priorityMap).map((key) => ({
    name: key,
    value: priorityMap[key]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-6 animate-fadeIn">
      {/* Revenue by Stage Bar Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Pipeline Revenue by Stage</h3>
        <p className="text-xs text-slate-400 mb-4">Total deal value active across pipeline stages</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Total Value']}
              />
              <Bar dataKey="totalValue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution Pie Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-1">Deals Priority Breakdown</h3>
        <p className="text-xs text-slate-400 mb-4">Active deal volume segmented by urgency</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={5}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}