import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — AI Visibility OS',
  description: 'Get in touch with the AI Visibility OS team.',
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-4 mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Get in Touch
          </h1>
          <p className="text-base text-slate-600">
            Have questions about AI search auditing or want early access? We’d love to hear from you.
          </p>
        </div>

        <div className="mx-auto max-w-xl">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Send us a Message</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Fill out the form below and our team will get back to you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Work Email</label>
                <input
                  type="email"
                  placeholder="jane@company.com"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Message</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your AI visibility requirements..."
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  readOnly
                />
              </div>

              <Button className="w-full text-xs gap-2" disabled>
                <Mail className="h-3.5 w-3.5" />
                Submit Inquiry (UI Preview)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
