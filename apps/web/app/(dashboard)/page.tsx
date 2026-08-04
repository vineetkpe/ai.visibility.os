import React from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <PageContainer
      title="Overview"
      description="Production-ready UI foundation shell for AI Visibility OS."
      action={
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Resource
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Skeleton Card Grid Showcase */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Empty State Showcase */}
        <EmptyState
          title="No monitors configured"
          description="Get started by configuring your first monitor to track AI model visibility metrics."
          action={<Button variant="outline">Configure Monitor</Button>}
        />

        {/* Skeleton Table Showcase */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Resource Stream
          </h2>
          <SkeletonTable rows={4} columns={4} />
        </div>
      </div>
    </PageContainer>
  );
}
