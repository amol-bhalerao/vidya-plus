import React from 'react';
import { Link } from 'react-router-dom';

import HeroImage from '@/components/HeroImage';
import WelcomeMessage from '@/components/WelcomeMessage';
import CallToAction from '@/components/CallToAction';
import { Button } from '@/components/ui/button';

const Website = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 px-6 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Vidya+</p>
          <h1 className="text-4xl font-bold md:text-6xl">College Management System</h1>
          <WelcomeMessage />
          <CallToAction />
        </div>

        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
          <HeroImage />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
            <Link to="/admin/login">Open Admin Login</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
            <a href="http://localhost:8000" target="_blank" rel="noreferrer">Open Backend</a>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Website;
