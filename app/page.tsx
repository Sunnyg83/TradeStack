'use client'

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Status Badge Component with animated status change
function StatusBadge({ initialStatus, finalStatus, delay, animationKey }: { 
  initialStatus: string; 
  finalStatus?: string; 
  delay: number;
  animationKey: number;
}) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Reset to initial status when animation restarts
    setCurrentStatus(initialStatus);
    setIsChanging(false);
    
    if (finalStatus && delay > 0) {
      let timer2: NodeJS.Timeout;
      const timer1 = setTimeout(() => {
        setIsChanging(true);
        timer2 = setTimeout(() => {
          setCurrentStatus(finalStatus);
          setIsChanging(false);
        }, 300);
      }, delay * 1000);
      
      return () => {
        clearTimeout(timer1);
        if (timer2) clearTimeout(timer2);
      };
    }
  }, [finalStatus, delay, animationKey, initialStatus]);

  return (
    <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200 transition-all duration-300">
      <span className={`inline-block transition-opacity duration-300 ${isChanging ? 'opacity-0' : 'opacity-100'}`}>
        {currentStatus}
      </span>
    </div>
  );
}

// Interactive Chart Component with hover zoom
function InteractiveChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Sample data for the chart
  const data = [
    { day: 'Mon', value: 2 },
    { day: 'Tue', value: 3 },
    { day: 'Wed', value: 4 },
    { day: 'Thu', value: 3.5 },
    { day: 'Fri', value: 5 },
    { day: 'Sat', value: 4 },
    { day: 'Sun', value: 3 }
  ];
  
  const width = 280;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;
  
  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...d };
  });
  
  // Create path for the line
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find closest point
    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((point, i) => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });
    
    setHoveredIndex(closestIndex);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setMousePosition(null);
  };
  
  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding.top + (i / 4) * chartHeight;
          return (
            <line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          );
        })}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          className="transition-all duration-200"
          style={{
            transform: hoveredIndex !== null ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: hoveredIndex !== null && points[hoveredIndex] 
              ? `${points[hoveredIndex].x}px ${points[hoveredIndex].y}px` 
              : 'center',
          }}
        />
        
        {/* Area under line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
          fill="url(#gradient)"
          opacity="0.2"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            {/* Hover circle */}
            {hoveredIndex === i && (
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="#3b82f6"
                opacity="0.2"
                className="animate-pulse"
              />
            )}
            {/* Point */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === i ? "5" : "3"}
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-200"
            />
          </g>
        ))}
        
        {/* X-axis labels */}
        {points.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={height - 5}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
            className={hoveredIndex === i ? "font-semibold" : ""}
          >
            {point.day}
          </text>
        ))}
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = minValue + (i / 4) * valueRange;
          const y = padding.top + ((4 - i) / 4) * chartHeight;
          return (
            <text
              key={i}
              x={padding.left - 5}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="#64748b"
            >
              {value.toFixed(1)}
            </text>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredIndex !== null && mousePosition && (
        <div
          className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{data[hoveredIndex].day}</div>
          <div className="text-blue-300">{data[hoveredIndex].value.toFixed(1)} leads</div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0); // 0: CRM, 1: Analytics, 2: Website, 3: Ads, 4: Invoices
  const dashboardRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const [comparisonKey, setComparisonKey] = useState(0);
  
  // Different heights for different tabs - adjusted to fit all content
  const tabHeights: Record<number, string> = {
    0: 'h-[320px]', // CRM - fixed height
    1: 'h-[380px]', // Analytics - fixed height
    2: 'h-[350px]', // Website - fixed height
    3: 'h-[403px]', // Ads - fixed height to fit all
    4: 'h-[380px]', // Invoices - fixed height to fit all
  };

  const faqs = [
    {
      question: "How quickly can I get started?",
      answer: "You can set up your TradeStack account in just 5 minutes. Simply sign up, complete the onboarding, and start managing your leads immediately."
    },
    {
      question: "Do I need a credit card to start?",
      answer: "No credit card required! TradeStack offers a free forever plan so you can start managing your business right away."
    },
    {
      question: "How do I create and send invoices?",
      answer: "TradeStack makes invoicing simple. Create professional invoices in seconds, track payment status, and send them directly to clients. All your invoices are organized in one place so you never lose track of what you're owed."
    },
    {
      question: "Can I customize my website?",
      answer: "Yes! Our AI website builder lets you customize colors, content, and layout instantly. Just tell the AI what you want changed, and it updates your site in seconds."
    },
    {
      question: "How do customers find me?",
      answer: "You get a custom public page URL that you can share anywhere. Customers can request quotes directly from your page, and leads appear in your dashboard instantly."
    }
  ];

  // Intersection Observer to restart animation when dashboard comes into view
  useEffect(() => {
    let hasAnimated = false;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            // Restart animation when element enters viewport
            hasAnimated = true;
            setAnimationKey((prev) => prev + 1);
            setActiveTab(0); // Reset to first tab
          } else if (!entry.isIntersecting) {
            // Reset flag when element leaves viewport
            hasAnimated = false;
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of element is visible
      }
    );

    const currentRef = dashboardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Continuous tab cycling animation - cycles every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 5); // Cycle through 0-4 (CRM, Analytics, Website, Ads, Invoices)
      setAnimationKey((prev) => prev + 1); // Restart animations on tab change
    }, 4000); // Change tab every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer to restart comparison animation when it comes into view
  useEffect(() => {
    let hasAnimated = false;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            // Restart animation when element enters viewport
            hasAnimated = true;
            setComparisonKey((prev) => prev + 1);
          } else if (!entry.isIntersecting) {
            // Reset flag when element leaves viewport
            hasAnimated = false;
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of element is visible
      }
    );

    const currentRef = comparisonRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Continuous comparison animation cycle - restarts every 9 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setComparisonKey((prev) => prev + 1);
    }, 9000); // Restart animation every 9 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Light Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.04),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.04),transparent_70%)]"></div>
        
        {/* Floating gradient orbs - Blue only */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                TradeStack
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">Features</a>
              <a href="#faq" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">FAQs</a>
            </nav>

            {/* CTA Button */}
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:items-start">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6 animate-fade-in-up">
                Stop losing leads.
                <span className="block bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mt-2">
                  Start closing more deals.
                </span>
              </h1>
              
              {/* Text content wrapper - this is what the dashboard should align with */}
              <div className="space-y-0">
                <p className="text-xl md:text-2xl text-slate-600 leading-relaxed mb-8 animate-fade-in-up animation-delay-200 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                  TradeStack is an all-in-one platform for tradespeople: CRM, website builder, ad creator, and invoicing.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-400 mb-8 mt-6">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-500 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105"
                  >
                    Start Free — No Credit Card
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-600 animate-fade-in animation-delay-600 mt-14">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Free forever plan available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Setup in 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">✓</span>
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Compact Dashboard Preview - Aligned to start where paragraph text starts */}
            <div ref={dashboardRef} key={animationKey} className="relative animate-fade-in animation-delay-500 max-w-xl lg:pt-[calc(1rem+0.5rem)]">
              <div className="relative bg-white backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 p-2.5 overflow-hidden w-full">
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">T</span>
                    </div>
                    <span className="text-slate-900 font-semibold text-xs">TradeStack</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['CRM', 'Analytics', 'Website', 'Ads', 'Invoices'].map((tab, i) => (
                      <div
                        key={i}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-500 ${
                          activeTab === i ? 'bg-blue-100 text-blue-600 scale-105' : 'text-slate-600 opacity-60'
                        }`}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Tab Content - Cycles through all tabs */}
                <div className={`relative ${tabHeights[activeTab]} flex flex-col transition-all duration-500 overflow-hidden`}>
                  {/* Tab 0: AI CRM */}
                  <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${activeTab === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    key={`crm-${animationKey}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">AI CRM - Active Leads</h3>
                        <p className="text-[10px] text-slate-600">AI automatically follows up</p>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded border border-blue-200">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-blue-600 font-medium">AI Active</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: '12px' }}>
                      {[
                        { 
                          name: 'Sarah J.', 
                          phone: '(555) 123-4567', 
                          status: 'New Lead', 
                          statusChange: 'Contacted',
                          delay: '0s',
                          statusChangeDelay: '1s',
                          service: 'Plumbing',
                          showTyping: false
                        },
                        { 
                          name: 'Mike C.', 
                          phone: '(555) 987-6543',
                          status: 'AI Contacting', 
                          delay: '0.3s',
                          typingStart: '0.8s',
                          service: 'HVAC',
                          showTyping: true
                        },
                        {
                          name: 'Emma D.',
                          phone: '(555) 456-7890',
                          status: 'New Lead',
                          statusChange: 'Quote Sent',
                          delay: '0.6s',
                          statusChangeDelay: '1.5s',
                          service: 'Electrical',
                          showTyping: false
                        },
                        {
                          name: 'James W.',
                          phone: '(555) 321-9876',
                          status: 'New Lead',
                          statusChange: 'Follow Up',
                          delay: '0.9s',
                          statusChangeDelay: '2s',
                          service: 'Roofing',
                          showTyping: false
                        }
                      ].map((lead, i) => (
                        <div
                          key={`${animationKey}-crm-${i}`}
                          className="bg-slate-50 rounded-lg border border-slate-200 opacity-0 flex-shrink-0"
                          style={{
                            padding: '7px',
                            marginBottom: '4px',
                            animationName: 'fadeInUp',
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-out',
                            animationDelay: lead.delay,
                            animationFillMode: 'both'
                          }}
                        >
                          <div className="flex items-center justify-between" style={{ marginBottom: '3px' }}>
                            <div className="flex items-center" style={{ gap: '7px' }}>
                              <div className="bg-blue-100 rounded-full flex items-center justify-center" style={{ width: '24px', height: '24px' }}>
                                <span className="text-blue-600 font-semibold" style={{ fontSize: '10px' }}>{lead.name.split(' ').map(n => n[0]).join('')}</span>
                              </div>
                              <div>
                                <div className="font-medium text-slate-900" style={{ fontSize: '12px' }}>{lead.name}</div>
                                {lead.phone && <div className="text-slate-600" style={{ fontSize: '10px' }}>{lead.phone}</div>}
                              </div>
                            </div>
                            <StatusBadge 
                              key={`status-${animationKey}-crm-${i}`}
                              initialStatus={lead.status}
                              finalStatus={lead.statusChange}
                              delay={lead.statusChangeDelay ? parseFloat(lead.statusChangeDelay) : 0}
                              animationKey={animationKey}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600" style={{ fontSize: '10px' }}>Service: {lead.service}</span>
                            {lead.showTyping && (
                              <div 
                                className="flex items-center gap-1 text-blue-600 opacity-0"
                                style={{
                                  fontSize: '10px',
                                  animationName: 'fadeIn',
                                  animationDuration: '0.3s',
                                  animationTimingFunction: 'ease-out',
                                  animationDelay: lead.typingStart || '0.8s',
                                  animationFillMode: 'both'
                                }}
                              >
                                <span>AI generating...</span>
                                <div className="flex gap-0.5">
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab 1: Analytics Dashboard */}
                  <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${activeTab === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    key={`analytics-${animationKey}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">Analytics Dashboard</h3>
                        <p className="text-[10px] text-slate-600">Real-time business performance</p>
                      </div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { label: 'Leads', value: '24', trend: '+12%', delay: '0s' },
                        { label: 'Revenue', value: '$8.2K', trend: '+23%', delay: '0.2s' },
                        { label: 'Closed', value: '12', trend: '+8%', delay: '0.4s' }
                      ].map((stat, i) => (
                        <div 
                          key={`${animationKey}-analytics-${i}`}
                          className="bg-slate-50 rounded-lg p-1.5 border border-slate-200 opacity-0 flex-shrink-0"
                          style={{ 
                            animationName: 'fadeInUp',
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-out',
                            animationDelay: stat.delay,
                            animationFillMode: 'both'
                          }}
                        >
                          <div className="text-[10px] text-slate-600 mb-0.5">{stat.label}</div>
                          <div className="text-base font-bold text-slate-900 mb-1">{stat.value}</div>
                          <div className="text-[10px] text-blue-600 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded inline-block">
                            {stat.trend}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {/* Multi-line Chart */}
                      <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 opacity-0 p-2.5 flex flex-col h-[200px]"
                        style={{
                          animationName: 'fadeIn',
                          animationDuration: '0.5s',
                          animationTimingFunction: 'ease-out',
                          animationDelay: '0.6s',
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="text-[10px] font-semibold text-slate-700 mb-3">Performance Trends (Last 7 Days)</div>
                        <div className="flex-1 relative min-h-[120px] flex items-end">
                          <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                            {/* Grid lines */}
                            {[0, 25, 50, 75, 100].map((y, i) => (
                              <line
                                key={`grid-${i}`}
                                x1="0"
                                y1={y}
                                x2="200"
                                y2={y}
                                stroke="#cbd5e1"
                                strokeWidth="0.5"
                                opacity="0.5"
                              />
                            ))}
                            
                            {/* Revenue line (Blue) */}
                            <polyline
                              points="0,50 28,45 57,48 85,30 114,35 143,15 171,20 200,22"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                              style={{
                                opacity: 0,
                                animationName: 'fadeIn',
                                animationDuration: '0.8s',
                                animationTimingFunction: 'ease-out',
                                animationDelay: '0.9s',
                                animationFillMode: 'forwards'
                              }}
                            />
                            
                            {/* Leads line (Green) */}
                            <polyline
                              points="0,65 28,60 57,55 85,50 114,45 143,40 171,35 200,30"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              style={{
                                opacity: 0,
                                animationName: 'fadeIn',
                                animationDuration: '0.8s',
                                animationTimingFunction: 'ease-out',
                                animationDelay: '1.1s',
                                animationFillMode: 'forwards'
                              }}
                            />
                            
                            {/* Closed line (Purple) */}
                            <polyline
                              points="0,70 28,65 57,60 85,55 114,52 143,50 171,48 200,45"
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="2"
                              style={{
                                opacity: 0,
                                animationName: 'fadeIn',
                                animationDuration: '0.8s',
                                animationTimingFunction: 'ease-out',
                                animationDelay: '1.3s',
                                animationFillMode: 'forwards'
                              }}
                            />
                            
                            {/* Data points for Revenue */}
                            {[
                              { x: 0, y: 50 },
                              { x: 28, y: 45 },
                              { x: 57, y: 48 },
                              { x: 85, y: 30 },
                              { x: 114, y: 35 },
                              { x: 143, y: 15 },
                              { x: 171, y: 20 },
                              { x: 200, y: 22 }
                            ].map((point, i) => (
                              <circle
                                key={`revenue-${i}`}
                                cx={point.x}
                                cy={point.y}
                                r="1.5"
                                fill="#3b82f6"
                                style={{
                                  opacity: 0,
                                  animationName: 'fadeIn',
                                  animationDuration: '0.3s',
                                  animationTimingFunction: 'ease-out',
                                  animationDelay: `${0.9 + i * 0.1}s`,
                                  animationFillMode: 'forwards'
                                }}
                              />
                            ))}
                            
                            {/* Data points for Leads */}
                            {[
                              { x: 0, y: 65 },
                              { x: 28, y: 60 },
                              { x: 57, y: 55 },
                              { x: 85, y: 50 },
                              { x: 114, y: 45 },
                              { x: 143, y: 40 },
                              { x: 171, y: 35 },
                              { x: 200, y: 30 }
                            ].map((point, i) => (
                              <circle
                                key={`leads-${i}`}
                                cx={point.x}
                                cy={point.y}
                                r="1.5"
                                fill="#10b981"
                                style={{
                                  opacity: 0,
                                  animationName: 'fadeIn',
                                  animationDuration: '0.3s',
                                  animationTimingFunction: 'ease-out',
                                  animationDelay: `${1.1 + i * 0.1}s`,
                                  animationFillMode: 'forwards'
                                }}
                              />
                            ))}
                            
                            {/* Data points for Closed */}
                            {[
                              { x: 0, y: 70 },
                              { x: 28, y: 65 },
                              { x: 57, y: 60 },
                              { x: 85, y: 55 },
                              { x: 114, y: 52 },
                              { x: 143, y: 50 },
                              { x: 171, y: 48 },
                              { x: 200, y: 45 }
                            ].map((point, i) => (
                              <circle
                                key={`closed-${i}`}
                                cx={point.x}
                                cy={point.y}
                                r="1.5"
                                fill="#8b5cf6"
                                style={{
                                  opacity: 0,
                                  animationName: 'fadeIn',
                                  animationDuration: '0.3s',
                                  animationTimingFunction: 'ease-out',
                                  animationDelay: `${1.3 + i * 0.1}s`,
                                  animationFillMode: 'forwards'
                                }}
                              />
                            ))}
                          </svg>
                          
                          {/* X-axis labels */}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-slate-600 px-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Today'].map((day, i) => (
                              <span key={i}>{day}</span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Legend */}
                        <div className="flex gap-4 mt-3 text-[9px]"
                          style={{
                            opacity: 0,
                            animationName: 'fadeIn',
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-out',
                            animationDelay: '1.5s',
                            animationFillMode: 'forwards'
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-blue-500"></div>
                            <span className="text-slate-700">Revenue</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-green-500"></div>
                            <span className="text-slate-700">Leads</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-purple-500"></div>
                            <span className="text-slate-700">Closed</span>
                          </div>
                        </div>
                      </div>
                      {/* Additional Metrics */}
                      <div className="grid grid-cols-2 gap-2 opacity-0"
                        style={{
                          animationName: 'fadeIn',
                          animationDuration: '0.5s',
                          animationTimingFunction: 'ease-out',
                          animationDelay: '1.7s',
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-[10px] text-slate-600 mb-1">Avg Response Time</div>
                          <div className="text-sm font-bold text-slate-900">2.4 min</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-[10px] text-slate-600 mb-1">Conversion Rate</div>
                          <div className="text-sm font-bold text-slate-900">34%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab 2: Website Builder */}
                  <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${activeTab === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    key={`website-${animationKey}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">Website Builder</h3>
                        <p className="text-[10px] text-slate-600">Your live website</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded border border-blue-700 hover:bg-blue-700 transition-colors">
                          Deploy
                        </button>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded border border-blue-200">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] text-blue-600 font-medium">Live</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-200 mb-2 opacity-0 flex flex-col"
                        style={{
                          animationName: 'fadeInUp',
                          animationDuration: '0.5s',
                          animationTimingFunction: 'ease-out',
                          animationDelay: '0s',
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xs">🌐</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-slate-900">Your Website</div>
                            <div className="text-[10px] text-slate-600">tradestack.co/you</div>
                          </div>
                        </div>
                        <div className="flex-1 bg-white rounded border border-slate-200 overflow-hidden p-2.5 flex flex-col">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                            <div className="h-1.5 w-16 bg-blue-600 rounded"></div>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                            </div>
                          </div>
                          {/* Content */}
                          <div className="space-y-2 flex-1">
                            <div className="h-2 bg-slate-900 rounded w-3/4"></div>
                            <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                            <div className="h-1.5 bg-slate-400 rounded w-5/6"></div>
                            <div className="h-1.5 bg-slate-400 rounded w-4/6"></div>
                            <div className="grid grid-cols-3 gap-1.5 mt-3">
                              <div className="bg-blue-50 rounded border border-blue-100 p-1.5 flex flex-col gap-1">
                                <div className="h-1 bg-blue-600 rounded w-2/3"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-full"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-3/4"></div>
                              </div>
                              <div className="bg-blue-50 rounded border border-blue-100 p-1.5 flex flex-col gap-1">
                                <div className="h-1 bg-blue-600 rounded w-2/3"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-full"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-3/4"></div>
                              </div>
                              <div className="bg-blue-50 rounded border border-blue-100 p-1.5 flex flex-col gap-1">
                                <div className="h-1 bg-blue-600 rounded w-2/3"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-full"></div>
                                <div className="h-0.5 bg-slate-300 rounded w-3/4"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 opacity-0"
                        style={{
                          animationName: 'fadeIn',
                          animationDuration: '0.5s',
                          animationTimingFunction: 'ease-out',
                          animationDelay: '0.3s',
                          animationFillMode: 'both'
                        }}
                      >
                        <span>✓</span>
                        <span>Auto-deployed to Netlify</span>
                      </div>
                    </div>
                  </div>

                  {/* Tab 3: Facebook Ads */}
                  <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${activeTab === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    key={`ads-${animationKey}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">Facebook Ads</h3>
                        <p className="text-[10px] text-slate-600">Auto-posting ads</p>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded border border-blue-200">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-blue-600 font-medium">Active</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col" style={{ marginBottom: '-16px' }}>
                      {[
                        { 
                          title: 'Expert Plumbing Services', 
                          status: 'Posted',
                          delay: '0s',
                          preview: 'Looking for reliable plumbing? We provide expert...'
                        },
                        { 
                          title: 'HVAC Installation Special', 
                          status: 'Posted',
                          delay: '0.3s',
                          preview: 'Book your HVAC installation today and save 15%...'
                        },
                        { 
                          title: 'Electrical Repair Services', 
                          status: 'Posted',
                          delay: '0.6s',
                          preview: 'Professional electrical repairs and installations...'
                        },
                        { 
                          title: 'Roofing Solutions', 
                          status: 'Posted',
                          delay: '0.9s',
                          preview: 'Expert roofing services for all your needs...'
                        },
                        { 
                          title: 'General Contracting', 
                          status: 'Posted',
                          delay: '1.2s',
                          preview: 'Full-service contracting for all projects...'
                        },
                        { 
                          title: 'Landscaping Services', 
                          status: 'Posted',
                          delay: '1.5s',
                          preview: 'Transform your outdoor space with professional...'
                        }
                      ].map((ad, i, arr) => (
                        <div
                          key={`${animationKey}-ad-${i}`}
                          className="bg-slate-50 rounded-lg border border-slate-200 opacity-0 flex-shrink-0"
                          style={{
                            padding: '8px',
                            marginBottom: i === arr.length - 1 ? '1.5px' : '3px',
                            animationName: 'fadeInUp',
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-out',
                            animationDelay: ad.delay,
                            animationFillMode: 'both'
                          }}
                        >
                          <div className="flex items-center" style={{ gap: '10px' }}>
                            <div className="bg-blue-600 rounded-lg flex items-center justify-center" style={{ width: '27px', height: '27px' }}>
                              <span className="text-white font-bold" style={{ fontSize: '13px' }}>f</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-900" style={{ fontSize: '14px' }}>{ad.title}</div>
                              <div className="text-slate-600" style={{ fontSize: '12px' }}>{ad.preview}</div>
                            </div>
                            <div className="bg-blue-100 rounded border border-blue-200" style={{ padding: '5px 8px' }}>
                              <span className="text-blue-600" style={{ fontSize: '12px' }}>✓</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab 4: Invoicing */}
                  <div 
                    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${activeTab === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    key={`invoices-${animationKey}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">Invoicing</h3>
                        <p className="text-[10px] text-slate-600">Auto-generated invoices</p>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded border border-blue-200">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] text-blue-600 font-medium">Auto</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden flex flex-col">
                      {[
                        { 
                          customer: 'Sarah J.', 
                          amount: '$1,250',
                          status: 'Paid',
                          delay: '0s'
                        },
                        { 
                          customer: 'Mike C.', 
                          amount: '$850',
                          status: 'Pending',
                          delay: '0.3s'
                        },
                        { 
                          customer: 'Emma D.', 
                          amount: '$2,100',
                          status: 'Sent',
                          delay: '0.6s'
                        },
                        { 
                          customer: 'John M.', 
                          amount: '$1,450',
                          status: 'Paid',
                          delay: '0.9s'
                        },
                        { 
                          customer: 'Lisa K.', 
                          amount: '$975',
                          status: 'Pending',
                          delay: '1.2s'
                        },
                        { 
                          customer: 'Tom B.', 
                          amount: '$1,650',
                          status: 'Paid',
                          delay: '1.5s'
                        },
                        { 
                          customer: 'Rachel P.', 
                          amount: '$1,100',
                          status: 'Sent',
                          delay: '1.8s'
                        }
                      ].map((invoice, i) => (
                        <div
                          key={`${animationKey}-invoice-${i}`}
                          className="bg-slate-50 rounded-lg p-1.5 border border-slate-200 opacity-0 flex-shrink-0"
                          style={{
                            animationName: 'fadeInUp',
                            animationDuration: '0.5s',
                            animationTimingFunction: 'ease-out',
                            animationDelay: invoice.delay,
                            animationFillMode: 'both'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{invoice.customer}</div>
                              <div className="text-[10px] text-slate-600">Invoice #{1000 + i}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-900">{invoice.amount}</div>
                              <div className={`text-[10px] ${
                                invoice.status === 'Paid' ? 'text-blue-600' : 
                                invoice.status === 'Pending' ? 'text-slate-500' : 
                                'text-blue-600'
                              }`}>
                                {invoice.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Removed stats band to restore original landing layout */}

      {/* Problem/Solution Section */}
      <section className="relative py-24 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Own your lead management.
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                See exactly where every lead stands, track follow-ups, and get clear actions to turn inquiries into revenue.
              </p>
            </div>
            <div className="relative" ref={comparisonRef}>
              <div className="bg-white backdrop-blur-xl rounded-2xl p-6 border border-slate-200 shadow-xl overflow-hidden" style={{ minHeight: '180px' }}>
                <div className="relative h-full min-h-[180px] flex items-center justify-center" key={`comparison-${comparisonKey}`}>
                  {/* Before TradeStack - Red Box with Text */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0"
                    style={{
                      animationName: 'slideInThenSlideOut',
                      animationDuration: '2.5s',
                      animationTimingFunction: 'ease-in-out',
                      animationDelay: '0.5s',
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="text-red-600 font-bold text-center mb-3" style={{ fontSize: '24px' }}>Before:</div>
                    <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded-lg w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-red-600 text-xl font-bold">✗</span>
                        <div className="flex-1">
                          <div className="text-slate-900 font-semibold">Sarah's Plumbing Inquiry</div>
                          <div className="text-red-600 text-sm">No follow-up for 3 days</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* After TradeStack - Green Box with Text */}
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0"
                    style={{
                      animationName: 'slideInThenSlideOut',
                      animationDuration: '5s',
                      animationTimingFunction: 'ease-in-out',
                      animationDelay: '3s',
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="text-green-600 font-bold text-center mb-3" style={{ fontSize: '24px' }}>After:</div>
                    <div className="flex flex-col gap-2 p-4 bg-green-50 border-2 border-green-300 rounded-lg w-full shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 text-xl font-bold">✓</span>
                        <div className="flex-1">
                          <div className="text-slate-900 font-semibold">Mike's HVAC Request</div>
                          <div className="text-green-600 text-sm font-medium">Followed up in an hour</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase Section */}
      <section id="features" className="relative py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Title Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to run your trade business
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Monitor leads, revenue, and conversions with actionable insights to grow your business.
            </p>
          </div>

          {/* Combined Cards with Hover Zoom */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {/* Left Card - Lead Pipeline + AI CRM */}
            <div className="group bg-blue-50 rounded-xl p-8 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-600">AI CRM</span>
                  </div>
                  <span className="text-xs text-slate-500">Live Dashboard</span>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-slate-900 mb-1">5</div>
                  <div className="text-sm text-slate-600">Total Leads</div>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">3</div>
                  <div className="text-sm text-slate-600">New Leads to Review</div>
                </div>
                <div className="pt-4 border-t border-blue-200">
                  <div className="text-2xl font-bold text-slate-900 mb-1">0%</div>
                  <div className="text-sm text-slate-600">Win Rate</div>
                </div>
              </div>
              <div className="pt-6 border-t border-blue-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Understand Your Lead Pipeline</h3>
                <p className="text-slate-600 leading-relaxed">
                  See how leads flow through your system, track follow-ups, and use those insights to shape your sales strategy.
                </p>
              </div>
            </div>

            {/* Right Card - Revenue Performance + Analytics */}
            <div className="group bg-blue-50 rounded-xl p-8 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-600">Analytics</span>
                  </div>
                  <span className="text-xs text-slate-500">This Week</span>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-slate-900 mb-1">$71,300</div>
                  <div className="text-sm text-slate-600">Total Income</div>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">94</div>
                  <div className="text-sm text-slate-600">Completed Leads</div>
                </div>
                <div className="pt-4 border-t border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">68%</div>
                  <div className="text-sm text-slate-600">Completion Rate</div>
                </div>
              </div>
              <div className="pt-6 border-t border-blue-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Track Revenue Performance</h3>
                <p className="text-slate-600 leading-relaxed">
                  Measure how much revenue you're generating and track progress over time to optimize your business.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Screenshots Row */}
          <div className="grid lg:grid-cols-4 gap-6 items-stretch">
            {/* Services Dashboard */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-4 border-b border-blue-200 bg-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-slate-500">Services & Pricing</span>
                </div>
              </div>
              <div className="p-6 bg-blue-50 flex flex-col h-full">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Manage your services and pricing in one place.</h3>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold text-slate-900 mb-1 text-sm">Emergency Repair</div>
                    <div className="text-xs text-slate-600 mb-1">24/7 emergency plumbing</div>
                    <div className="text-blue-600 font-bold">$150.00</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold text-slate-900 mb-1 text-sm">Drain Cleaning</div>
                    <div className="text-xs text-slate-600 mb-1">Professional drain cleaning</div>
                    <div className="text-blue-600 font-bold">$125.00</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold text-slate-900 mb-1 text-sm">Water Heater Install</div>
                    <div className="text-xs text-slate-600 mb-1">New water heater installation</div>
                    <div className="text-blue-600 font-bold">$800.00</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold text-slate-900 mb-1 text-sm">Pipe Repair</div>
                    <div className="text-xs text-slate-600 mb-1">Leak detection and repair</div>
                    <div className="text-blue-600 font-bold">$200.00</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-semibold text-slate-900 mb-1 text-sm">Fixture Installation</div>
                    <div className="text-xs text-slate-600 mb-1">Sink, toilet, faucet install</div>
                    <div className="text-blue-600 font-bold">$175.00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Builder Dashboard */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-4 border-b border-blue-200 bg-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-slate-500">Website Builder</span>
                </div>
              </div>
              <div className="p-6 bg-blue-50 flex flex-col h-full">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Create and customize your website with AI</h3>
                  <div className="flex gap-1.5 mb-3">
                    <button className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Save</button>
                    <button className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">Deploy</button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 mb-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3">
                    <div className="text-white font-bold text-sm mb-1">Mike's Plumbing Services</div>
                    <div className="text-blue-100 text-xs">Professional • Reliable • 24/7</div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                    <div className="flex gap-2 mt-3">
                      <div className="flex-1 h-16 bg-blue-50 rounded border border-blue-200 flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">Services</span>
                      </div>
                      <div className="flex-1 h-16 bg-blue-50 rounded border border-blue-200 flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">About</span>
                      </div>
                      <div className="flex-1 h-16 bg-blue-50 rounded border border-blue-200 flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">Contact</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200 mt-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-900">AI Assistant</span>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">Modify your website instantly</div>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Make header darker blue
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Add contact form
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Update hero section text
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Add testimonials section
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded border border-slate-300 p-1.5 text-xs text-slate-500 mb-1.5">Ask me to modify...</div>
                  <div className="flex gap-1">
                    <button className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Change colors</button>
                    <button className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">Add section</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ads Manager Dashboard */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-4 border-b border-blue-200 bg-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-slate-500">Ad Manager</span>
                </div>
              </div>
              <div className="p-6 bg-blue-50 flex flex-col h-full">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Post directly to Facebook, Instagram or Craigslist</h3>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="text-lg font-bold text-slate-900">0</div>
                      <div className="text-xs text-slate-600">Drafts</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="text-lg font-bold text-slate-900">0</div>
                      <div className="text-xs text-slate-600">Scheduled</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="text-lg font-bold text-slate-900">1</div>
                      <div className="text-xs text-slate-600">Posted</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="w-4 h-4 bg-blue-600 rounded mx-auto mb-1 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+</span>
                      </div>
                      <div className="text-xs text-slate-700">Blank Ad</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mx-auto mb-1 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>
                      <div className="text-xs text-slate-700">Template</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                      <div className="w-4 h-4 bg-purple-500 rounded mx-auto mb-1 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="text-xs text-slate-700">AI Generate</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 mb-0.5">SF Drains Got You Down?</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          We'll Flush Away Your Troubles! 🚰
                        </p>
                      </div>
                      <button className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Delete</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 mb-0.5">24/7 Emergency Plumbing</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Fast, reliable service when you need it most! ⚡
                        </p>
                      </div>
                      <button className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Delete</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 mb-0.5">Water Heater Experts</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Installation & repair services 🔧
                        </p>
                      </div>
                      <button className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Delete</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-blue-200">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-slate-900 mb-0.5">Leak Detection Specialists</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Find and fix leaks fast! 💧
                        </p>
                      </div>
                      <button className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices Dashboard */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="p-4 border-b border-blue-200 bg-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-slate-500">Invoices</span>
                </div>
              </div>
              <div className="p-6 bg-blue-50 flex flex-col h-full">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Create and manage invoices</h3>
                    <button className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-slate-700 font-semibold">INVOICE #</th>
                          <th className="px-2 py-1.5 text-left text-slate-700 font-semibold">CLIENT</th>
                          <th className="px-2 py-1.5 text-left text-slate-700 font-semibold">AMOUNT</th>
                          <th className="px-2 py-1.5 text-left text-slate-700 font-semibold">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251109-0001</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Rish</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$1.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Draft</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251108-0002</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Sarah J.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$450.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Paid</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251107-0003</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Mike T.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$1,200.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Sent</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251106-0004</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">John M.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$850.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Paid</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251105-0005</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Lisa K.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$325.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Draft</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251104-0006</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Tom B.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$675.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Paid</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251103-0007</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">Emma W.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$225.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Sent</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-slate-900 text-xs">INV-20251102-0008</td>
                          <td className="px-2 py-1 text-slate-700 text-xs">David R.</td>
                          <td className="px-2 py-1 text-slate-900 font-semibold text-xs">$550.00</td>
                          <td className="px-2 py-1">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Paid</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple pricing plans.



            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We've designed our pricing to maximize your ROI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white backdrop-blur-xl rounded-xl p-8 border-2 border-slate-200 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">Perfect for getting started</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Up to 50 leads/month', 'AI-powered CRM', 'Service management', 'Public page', 'Basic analytics', 'Email support'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Standard Plan - Highlighted */}
            <div className="bg-white backdrop-blur-xl rounded-xl p-8 border-2 border-blue-500 shadow-xl shadow-blue-500/20 relative scale-105 ring-2 ring-blue-200">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Standard</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$29</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">For growing businesses</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Unlimited leads', 'AI-powered CRM', 'Service management', 'Public page', 'Advanced analytics', 'AI message generation', 'Priority support', 'Custom branding'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-white backdrop-blur-xl rounded-xl p-8 border-2 border-slate-200 shadow-lg">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">$99</span>
                <span className="text-slate-600">/month</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">For teams and agencies</p>
              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition-colors mb-8"
              >
                Get Started
              </Link>
              <ul className="space-y-3">
                {['Everything in Standard', 'Multi-user access', 'API access', 'Custom integrations', 'Dedicated support', 'Advanced reporting'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="relative py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Starting as a tradesperson is hard. We've got you covered.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white backdrop-blur-xl rounded-xl border border-slate-200 shadow-lg overflow-hidden hover:border-blue-300 transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 text-lg">{faq.question}</span>
                  <span className={`text-2xl text-blue-600 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-slate-600 leading-relaxed animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to stop losing leads?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            TradeStack empowers you to manage your business and grow faster.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-500 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105"
          >
            Get Started
            <span className="ml-2">→</span>
          </Link>
          <p className="mt-6 text-sm text-slate-600">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-100 border-t border-slate-200 text-slate-600 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <span className="text-xl font-bold text-slate-900">TradeStack</span>
              </div>
              <p className="text-slate-600 text-sm">
                AI-powered CRM for trade businesses
              </p>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-slate-600 mb-4">Get tips and updates delivered to your inbox</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-slate-300 pt-8 text-center text-sm text-slate-600">
            <p>TradeStack. All rights reserved. © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
