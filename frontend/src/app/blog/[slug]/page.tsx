'use client';

import React from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import { blogPosts } from '@/data/blogPosts';

export default function BlogPostDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <LayoutWrapper>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-8 max-w-md">
            The blog article you are looking for does not exist or has been relocated.
          </p>
          <Link
            href="/blog"
            className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Back to All Articles
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-700">
        
        {/* ARTICLE HEADER HERO */}
        <header className="bg-slate-900 text-white py-16 md:py-20 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-400 hover:text-blue-300 uppercase tracking-widest mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Articles
            </Link>

            <div>
              <span className="bg-blue-600/90 text-white text-xs font-black tracking-wider uppercase px-3.5 py-1.5 rounded-full inline-block mb-4 shadow-xs">
                {post.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-6">
              {post.title}
            </h1>

            <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-8">
              {post.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-between border-t border-slate-800 pt-6 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/50"
                />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{post.author.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">{post.author.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                <span>Published: {post.publishedDate}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-400 font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN ARTICLE BODY */}
        <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          
          {/* Main Featured Image */}
          <div className="rounded-2xl overflow-hidden shadow-xl mb-12 border border-slate-200 bg-slate-100">
            <img
              src={post.image}
              alt={post.title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>

          {/* Article Introduction */}
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200/90 shadow-sm mb-10">
            <p className="text-lg md:text-xl text-slate-700 font-medium leading-relaxed whitespace-pre-line">
              {post.content.intro}
            </p>
          </div>

          {/* Article Sections */}
          <div className="space-y-10">
            {post.content.sections.map((section, idx) => (
              <section key={idx} className="bg-white rounded-2xl p-8 md:p-10 border border-slate-200/90 shadow-sm">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-3">
                  {section.heading}
                </h2>
                
                <p className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-line mb-6">
                  {section.body}
                </p>

                {section.bullets && section.bullets.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Key Focus Points</h4>
                    <ul className="space-y-3">
                      {section.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-3 text-slate-700 text-sm md:text-base font-medium">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            ✓
                          </span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Key Takeaways Card */}
          <div className="mt-12 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-8 md:p-10 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">
                ★
              </span>
              <h3 className="text-2xl font-black tracking-tight">Executive Summary & Key Takeaways</h3>
            </div>
            
            <ul className="space-y-4">
              {post.content.keyTakeaways.map((takeaway, tIdx) => (
                <li key={tIdx} className="flex items-start gap-3 text-slate-200 text-base font-medium">
                  <span className="text-blue-400 font-bold text-lg leading-none">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Article CTA Section */}
          <div className="mt-12 bg-blue-600 text-white rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <h3 className="text-2xl md:text-3xl font-black mb-4">
              {post.content.cta.title}
            </h3>
            <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto mb-8 font-medium">
              {post.content.cta.text}
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-md hover:scale-105 transform text-sm"
            >
              {post.content.cta.buttonText}
            </Link>
          </div>

          {/* Navigation Back */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              ← Back to All Articles
            </Link>
          </div>

        </main>

      </div>
    </LayoutWrapper>
  );
}
