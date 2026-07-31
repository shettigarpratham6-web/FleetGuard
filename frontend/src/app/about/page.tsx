'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper'; // Adjust import path as needed
import Footer from '@/components/Footer';
export default function AboutUsPage() {
  const router = useRouter();

  // Mock data for Ratings / Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Greg Blessing',
      role: 'Fleet Maintenance Coordinator',
      company: 'Huber Heights City Schools',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      review:
        'I was dreading a mid-year switch, but the FleetGuard team made it as painless as possible. The dashboard is easy to follow, and I no longer have to fight the software to find what I need.',
      caseStudyTitle: 'FleetGuard + Samsara: A Switch That Transformed School Bus Maintenance',
    },
    {
      id: 2,
      name: 'Alejandro Berzunza',
      role: 'Founder',
      company: 'Yuca Fleet Solutions',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      review:
        'FleetGuard gave me the confidence to grow. Today I have full control over every vehicle in my fleet, right from my phone. Everything became much easier.',
      caseStudyTitle: 'How FleetGuard Powers Yuca Fleet’s Expansion Across States',
    },
    {
      id: 3,
      name: 'Brooklynn Henderson',
      role: 'Sergeant',
      company: 'Cottleville Police Dept',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      review:
        'We would absolutely recommend FleetGuard to other departments, especially those looking to improve organization, reduce manual workload, and stay ahead of maintenance.',
      caseStudyTitle: 'How Cottleville PD Upgraded Their Fleet Operations in 2 Days',
    },
  ];

  // Mock data for Blog Posts
  const blogPosts = [
    {
      id: 1,
      slug: 'ultimate-guide-to-fleet-management-2026',
      tag: 'FLEET MANAGEMENT',
      title: 'The Ultimate Guide to Vehicle Fleet Management in 2026',
      description: 'Ultimate Guide to Fleet Management 2026: Tools & Best Practices for enterprise scale.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      slug: 'fleet-maintenance-software-checklist-2026',
      tag: 'FLEET MAINTENANCE',
      title: 'Fleet Maintenance Software in 2026: A Manager’s Checklist',
      description: 'Do I Need Fleet Maintenance Software in 2026? A Checklist for Operations Managers.',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      slug: 'lower-fleet-fuel-cost-2026',
      tag: 'FUEL MANAGEMENT',
      title: 'How Can You Lower Your Fleet Fuel Cost in 2026?',
      description: 'Practical strategies and AI insights to lower your fleet fuel expenditure by up to 18%.',
      image: 'https://static.vecteezy.com/system/resources/previews/049/858/629/non_2x/a-fleet-of-parked-trucks-is-poised-waiting-for-the-break-of-dawn-to-begin-their-crucial-deliveries-while-the-vibrant-colors-of-the-sky-serve-to-beautify-the-surrounding-industrial-environment-photo.jpg',
    },
  ];

  const handleBlogClick = (slug: string) => {
    router.push(`/blog/${slug}`);
  };

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-700">
        <main>

          {/* HERO SECTION */}
          <section className="py-16 md:py-24 px-8 max-w-7xl mx-auto text-center">
            <span className="text-sm font-black tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full inline-block">
              One Source of Truth
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-5xl mx-auto">
              Mobile Fleet Workflows For Drivers, Technicians And Managers
            </h1>
            <p className="mt-6 text-base md:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Give each role a focused workflow while keeping every inspection, receipt, work order, and update connected to the same fleet record.
            </p>

            {/* WORKFLOW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">

              {/* DRIVERS */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
                <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
                  DRIVERS
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3 mb-6">
                  Inspections, Defects, Fuel and Mileage
                </h3>
                <ul className="space-y-4">
                  {[
                    'Complete mobile inspections',
                    'Report defects with photos',
                    'Scan fuel receipts',
                    'Log mileage or issues by voice',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3.5 text-sm md:text-base font-bold text-slate-700">
                      <span className="material-symbols-outlined text-amber-500 text-[22px]">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* TECHNICIANS */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
                <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
                  TECHNICIANS
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3 mb-6">
                  Work Orders, Parts and Labor
                </h3>
                <ul className="space-y-4">
                  {[
                    'View assigned work orders',
                    'Record parts and labor',
                    'Add notes and repair evidence',
                    'Update job status from mobile',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3.5 text-sm md:text-base font-bold text-slate-700">
                      <span className="material-symbols-outlined text-amber-500 text-[22px]">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* FLEET MANAGERS */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
                <span className="text-xs font-black tracking-wider text-blue-600 uppercase">
                  FLEET MANAGERS
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3 mb-6">
                  Costs, Compliance and Performance
                </h3>
                <ul className="space-y-4">
                  {[
                    'Monitor overdue maintenance',
                    'Track work orders and downtime',
                    'Compare vehicle operating costs',
                    'Ask AI for instant fleet insights',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3.5 text-sm md:text-base font-bold text-slate-700">
                      <span className="material-symbols-outlined text-amber-500 text-[22px]">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

          {/* RATINGS & TESTIMONIALS SECTION */}
          <section className="py-20 bg-white border-y border-slate-200/90">
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                  How Growing Fleets Use FleetGuard
                </h2>
                <p className="mt-4 text-base md:text-lg font-semibold text-slate-500">
                  Trusted by operators, municipality heads, and logistics managers nationwide.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-8 rounded-2xl border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex justify-center mb-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-600/20"
                        />
                      </div>

                      {/* Star Rating */}
                      <div className="flex justify-center gap-1 text-amber-400 mb-3">
                        {[...Array(item.rating)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[20px] fill">
                            star
                          </span>
                        ))}
                      </div>

                      <h4 className="text-center text-lg font-black text-slate-900">
                        {item.name}
                      </h4>
                      <p className="text-center text-xs md:text-sm font-bold text-slate-500 mb-6">
                        {item.role}, {item.company}
                      </p>

                      <p className="text-sm md:text-base text-slate-700 text-center leading-relaxed italic mb-8 font-medium">
                        "{item.review}"
                      </p>
                    </div>

                    <div className="pt-5 border-t border-slate-200 text-center">
                      <span className="text-xs md:text-sm font-black text-blue-600 hover:underline cursor-pointer">
                        {item.caseStudyTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BLOGS & ARTICLES SECTION */}
          <section className="py-20 md:py-28 max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                Our latest blogs and articles
              </h2>
              <p className="mt-4 text-base md:text-lg font-semibold text-slate-500">
                Insights, maintenance strategies, and software guides for modern fleets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleBlogClick(post.slug)}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent flex items-end p-5">
                      <div>
                        <span className="text-xs font-black tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded-xs uppercase">
                          {post.tag}
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-2 line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-2 mb-6">
                      {post.description}
                    </p>

                    <div className="flex items-center text-sm font-black text-blue-600 group-hover:text-blue-700">
                      Read Article
                      <span className="material-symbols-outlined text-[18px] ml-1.5 group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Router Push CTA Button */}
            <div className="mt-16 text-center">
              <button
                onClick={() => router.push('/blog')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold px-8 py-4 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
              >
                Explore All Blog Posts
              </button>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </LayoutWrapper>
  );
}