'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';

export interface LogoutButtonProps {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = 'outline',
  size = 'default',
  className,
  children = 'Log out',
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Failed to log out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? 'Logging out...' : children}
    </Button>
  );
}
