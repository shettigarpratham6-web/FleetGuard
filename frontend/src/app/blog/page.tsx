'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LayoutWrapper from '@/components/LayoutWrapper';
import { blogPosts } from '@/data/blogPosts';

export default function BlogListingPage() {
  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-700">
        
        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-16 md:py-24 px-6 text-center shadow-md">
          <div className="max-w-5xl mx-auto">
            <span className="text-xs font-black tracking-widest text-blue-200 uppercase bg-blue-800/60 border border-blue-400/30 px-4 py-1.5 rounded-full inline-block mb-4 shadow-sm">
              FleetGuard Knowledge Hub
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-sm">
              Our Latest Blogs & Articles
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto font-medium leading-relaxed">
              Insights, maintenance strategies, and software guides for modern fleets.
            </p>
          </div>
        </section>

        {/* BLOG CARDS GRID SECTION */}
        <main className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-slate-200 pb-6">
            <div>
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase">Featured Publications</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Industry Guides & Best Practices</h2>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 md:mt-0">
              Showing 3 featured articles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {/* Article Image */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-xs">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center text-xs font-semibold text-slate-400 gap-3 mb-3">
                    <span>{post.publishedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>

                  <p className="mt-3 text-slate-600 text-sm line-clamp-3 leading-relaxed flex-1">
                    {post.description}
                  </p>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <span className="text-xs font-semibold text-slate-700">{post.author.name}</span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition-colors"
                    >
                      Read Article
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* BOTTOM CTA SECTION */}
        <section className="bg-slate-900 text-white py-16 px-6 border-t border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs font-black tracking-widest text-blue-400 uppercase bg-blue-950 border border-blue-800 px-4 py-1.5 rounded-full inline-block mb-4">
              Get FleetGuard Operations
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Ready to Modernize Your Fleet Workflows?
            </h2>
            <p className="mt-4 text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
              Join leading operations managers leveraging FleetGuard for digital inspections, predictive maintenance, and real-time fuel tracking.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105 text-center text-sm"
              >
                Start Free Trial
              </Link>
              <Link
                href="/about"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-8 py-3.5 rounded-xl border border-slate-700 transition-all text-center text-sm"
              >
                Learn More About Us
              </Link>
            </div>
          </div>
        </section>

      </div>
    </LayoutWrapper>
  );
}