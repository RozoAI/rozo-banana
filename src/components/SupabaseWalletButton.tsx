'use client';

import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Wallet, Mail, Chrome, Github } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SupabaseWalletButton() {
  const {
    user,
    loading,
    isAuthenticated,
    isConnected,
    address,
    signIn,
    signUp,
    signOut,
    signInWithWallet,
    signInWithProvider,
  } = useSupabaseAuth();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleWalletAuth = async () => {
    try {
      setAuthLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const inviteCode = urlParams.get('invite') || undefined;
      await signInWithWallet(inviteCode);
    } catch (error) {
      console.error('Wallet auth error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      await signIn(email, password);
      setShowAuthDialog(false);
    } catch (error) {
      console.error('Email sign in error:', error);
      alert('Sign in failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      await signUp(email, password);
      setShowAuthDialog(false);
      alert('Please check your email to verify your account.');
    } catch (error) {
      console.error('Email sign up error:', error);
      alert('Sign up failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: 'google' | 'github' | 'discord') => {
    try {
      setAuthLoading(true);
      await signInWithProvider(provider);
      setShowAuthDialog(false);
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      alert(`Sign in with ${provider} failed. Please try again.`);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Wallet className="mr-2 h-4 w-4" />
            {user.email || user.user_metadata?.address || 'Account'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>
            {user.email && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.email}</span>
                {user.user_metadata?.address && (
                  <span className="text-xs text-muted-foreground">
                    {user.user_metadata.address.slice(0, 6)}...
                    {user.user_metadata.address.slice(-4)}
                  </span>
                )}
              </div>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (isConnected && address) {
    return (
      <Button onClick={handleWalletAuth} disabled={authLoading}>
        {authLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Sign in with Wallet
          </>
        )}
      </Button>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <ConnectButton />
        <Button onClick={() => setShowAuthDialog(true)} variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign In to Banana</DialogTitle>
            <DialogDescription>
              Choose your preferred sign in method
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-signin">Email</Label>
                      <Input
                        id="email-signin"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signin">Password</Label>
                      <Input
                        id="password-signin"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Password</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={authLoading}>
                      {authLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Sign Up'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <Button
                onClick={() => handleProviderSignIn('google')}
                className="w-full"
                variant="outline"
                disabled={authLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              <Button
                onClick={() => handleProviderSignIn('github')}
                className="w-full"
                variant="outline"
                disabled={authLoading}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
              <Button
                onClick={() => handleProviderSignIn('discord')}
                className="w-full"
                variant="outline"
                disabled={authLoading}
              >
                Continue with Discord
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}