'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/project-form';
import { Search, LineChart, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface OnboardingWizardProps {
  userEmail: string;
}

export function OnboardingWizard({ userEmail }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 text-xs font-medium">
        <div
          className={`flex items-center gap-1.5 ${step === 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            1
          </div>
          <span>Welcome & How It Works</span>
        </div>
        <div className="h-px w-8 bg-slate-200" />
        <div
          className={`flex items-center gap-1.5 ${step === 2 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}
        >
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            2
          </div>
          <span>Add Website</span>
        </div>
      </div>

      {step === 1 ? (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="space-y-1.5 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Welcome to AI Visibility OS</CardTitle>
            <CardDescription className="text-xs text-slate-500 max-w-md mx-auto">
              You are signed in as <strong>{userEmail}</strong>. Let&apos;s get your brand monitored
              across AI models in just a few clicks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Feature Highlights */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-left space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 shadow-xs border border-slate-200">
                  <Search className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900">AI Model Tracking</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Monitor how ChatGPT, Perplexity, Claude & Gemini evaluate and cite your brand.
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-left space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 shadow-xs border border-slate-200">
                  <LineChart className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900">Share of Voice</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Benchmark your brand domain visibility against industry competitors.
                </p>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-left space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 shadow-xs border border-slate-200">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-semibold text-slate-900">Actionable Steps</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Get automated recommendations to improve domain authority and prompt rankings.
                </p>
              </div>
            </div>

            <Button type="button" className="w-full text-xs gap-2 py-5" onClick={() => setStep(2)}>
              Get Started — Add Your First Website
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Add Your First Website</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Enter your project name and primary website URL to setup tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm redirectOnSuccess="/dashboard" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
