import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PollChartProps {
  poll: PollWithOptionsAndVotes;
  className?: string;
}

export function PollChart({ poll, className }: PollChartProps) {
  // Transform data for the chart
  const chartData = poll.optionsWithVotes.map((option) => ({
    name: option.text,
    votes: option.votes,
    fill: option.id === poll.userVote?.optionId 
      ? "url(#selectedGradient)" 
      : "url(#defaultGradient)",
  }));

  return (
    <Card className={cn("w-full overflow-hidden shadow-md border-slate-200 rounded-xl", className)}>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-center mb-2 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Poll Results
          </h3>
          <p className="text-sm text-gray-600 text-center font-medium">
            Total votes: {poll.totalVotes}
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              barGap={10}
              barCategoryGap={20}
            >
              <defs>
                <linearGradient id="defaultGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="selectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-25} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis 
                tickFormatter={(value) => `${value} votes`}
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={{ stroke: "#e2e8f0" }}
              />
              <Tooltip 
                formatter={(value) => [`${value} votes`, "Votes"]}
                labelStyle={{ fontSize: 14, fontWeight: 500, color: "#334155" }}
                contentStyle={{ 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "8px", 
                  backgroundColor: "white",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" 
                }}
              />
              <Bar 
                dataKey="votes" 
                name="Votes" 
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}