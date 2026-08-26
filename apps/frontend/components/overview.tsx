import { Calendar, Clock, Clock3, Download, HelpCircle, MessageSquare, Ticket, TrendingUp } from "lucide-react";
import { Badge, Button } from "@central-support/ui";
import { MetricCard } from "./shared";

export function Overview({
  conversationsCount,
  agentsCount,
  onInbox
}: {
  conversationsCount: number;
  agentsCount: number;
  onInbox: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-secondary">Monitor performance and ticket trends.</p>
        </div>
        <div className="flex gap-3">
          <Button className="h-9 gap-2 rounded border border-border bg-white px-4 text-xs font-semibold text-secondary shadow-sm hover:bg-hover">
            Last 7 Days
            <Calendar size={14} className="ml-1 text-tertiary" />
          </Button>
          <Button className="h-9 gap-2 rounded border-brand bg-brand px-4 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:gap-6">
        <MetricCard 
          title="Total Tickets" 
          value="1,248" 
          delta="+12% vs last period" 
          icon={<Ticket size={16} className="text-tertiary" />} 
        />
        <MetricCard 
          title="Avg Resolution Time" 
          value="4h 12m" 
          delta="-45m vs last period" 
          icon={<Clock3 size={16} className="text-tertiary" />} 
        />
        <MetricCard 
          title="CSAT Score" 
          value="4.8/5" 
          delta="— No change vs last period" 
          icon={<HelpCircle size={16} className="text-tertiary" />} 
          neutral
        />
        <MetricCard 
          title="First Response" 
          value="15m" 
          delta="+2m vs last period" 
          icon={<MessageSquare size={16} className="text-tertiary" />} 
          negative
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3 xl:gap-6">
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-primary">Ticket Volume Trends</h2>
              <p className="mt-1 text-xs text-secondary">Incoming vs Resolved tickets over time.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-secondary">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Incoming</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Resolved</div>
            </div>
          </div>
          <div className="relative mt-8 h-64 w-full">
            {/* SVG Chart Placeholder to replicate the visual */}
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-tertiary">
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">300</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">250</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">200</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">150</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">100</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">50</span></div>
              <div className="border-t border-border flex items-center h-0"><span className="-mt-2.5 pr-2 w-8 text-right bg-white">0</span></div>
            </div>
            <svg viewBox="0 0 800 250" className="absolute inset-y-0 left-8 right-0 h-full w-[calc(100%-2rem)] overflow-visible">
              <path d="M 0 170 Q 100 80 200 120 T 400 40 T 600 200 T 800 210" fill="none" stroke="#0f766e" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M 0 150 Q 100 50 200 110 T 400 20 T 600 180 T 800 200" fill="none" stroke="#2563eb" strokeWidth="2" />
              <path d="M 0 150 Q 100 50 200 110 T 400 20 T 600 180 T 800 200 L 800 250 L 0 250 Z" fill="#2563eb" fillOpacity="0.1" />
              
              <circle cx="0" cy="150" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="150" cy="80" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="280" cy="115" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="430" cy="30" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="560" cy="140" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="680" cy="190" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
              <circle cx="800" cy="200" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
            </svg>
            <div className="absolute -bottom-6 left-8 flex w-[calc(100%-2rem)] justify-between text-xs text-tertiary">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-primary">Top Performers</h2>
            <p className="mt-1 text-xs text-secondary">Tickets resolved this period.</p>
          </div>
          <div className="flex h-64 flex-col justify-between pb-4">
            <div className="flex items-center gap-3">
              <span className="w-14 text-right text-xs font-semibold text-secondary">Sarah J.</span>
              <div className="h-6 w-[80%] rounded bg-blue-600"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 text-right text-xs font-semibold text-secondary">Mike T.</span>
              <div className="h-6 w-[70%] rounded bg-blue-600"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 text-right text-xs font-semibold text-secondary">Alex R.</span>
              <div className="h-6 w-[55%] rounded bg-blue-600"></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-14 text-right text-xs font-semibold text-secondary">Emma W.</span>
              <div className="h-6 w-[45%] rounded bg-blue-600"></div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pl-17 pt-2 text-xs text-tertiary">
              <span className="ml-16">0</span>
              <span className="ml-8">100</span>
              <span>200</span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-primary">Ticket Heatmap</h2>
            <p className="mt-1 text-xs text-secondary">Busiest hours based on incoming volume.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-tertiary">
            Low 
            <div className="h-2 w-24 rounded bg-gradient-to-r from-blue-100 to-blue-700"></div>
            High
          </div>
        </div>
        <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-1 text-center text-xs font-semibold text-secondary">
          <div className="pt-2"></div>
          <div className="pb-2">Mon</div><div className="pb-2">Tue</div><div className="pb-2">Wed</div><div className="pb-2">Thu</div><div className="pb-2">Fri</div><div className="pb-2">Sat</div><div className="pb-2">Sun</div>
          
          <div className="flex items-center justify-end pr-3">8 AM</div>
          <div className="h-8 rounded bg-blue-200"></div><div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-blue-200"></div><div className="h-8 rounded bg-blue-100"></div><div className="h-8 rounded bg-blue-400"></div><div className="h-8 rounded bg-slate-50"></div><div className="h-8 rounded bg-slate-50"></div>
          
          <div className="flex items-center justify-end pr-3">10 AM</div>
          <div className="h-8 rounded bg-blue-500"></div><div className="h-8 rounded bg-blue-600"></div><div className="h-8 rounded bg-blue-500"></div><div className="h-8 rounded bg-blue-700"></div><div className="h-8 rounded bg-blue-500"></div><div className="h-8 rounded bg-blue-100"></div><div className="h-8 rounded bg-blue-200"></div>
          
          <div className="flex items-center justify-end pr-3">12 PM</div>
          <div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-blue-400"></div><div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-blue-400"></div><div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-slate-50"></div><div className="h-8 rounded bg-slate-50"></div>
          
          <div className="flex items-center justify-end pr-3">2 PM</div>
          <div className="h-8 rounded bg-blue-400"></div><div className="h-8 rounded bg-blue-700"></div><div className="h-8 rounded bg-blue-600"></div><div className="h-8 rounded bg-blue-500"></div><div className="h-8 rounded bg-blue-600"></div><div className="h-8 rounded bg-blue-100"></div><div className="h-8 rounded bg-blue-100"></div>
          
          <div className="flex items-center justify-end pr-3">4 PM</div>
          <div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-blue-400"></div><div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-blue-200"></div><div className="h-8 rounded bg-blue-300"></div><div className="h-8 rounded bg-slate-50"></div><div className="h-8 rounded bg-slate-50"></div>
        </div>
      </section>
    </main>
  );
}


