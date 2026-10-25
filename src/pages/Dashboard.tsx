// Dashboard - Main authenticated page showing family trees

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAdapter } from '@/adapters';
import type { Family } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Leaf, Plus, TreeDeciduous, LogOut, Download, Upload } from 'lucide-react';
import { backupCounts, downloadBackup, importBackup, parseBackup } from '@/lib/backup';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadFamilies();
    }
  }, [user]);

  const loadFamilies = async () => {
    if (!user) return;
    
    const adapter = getAdapter();
    const { data, error } = await adapter.families.getFamiliesByUser(user.id);
    
    if (error) {
      toast({ title: 'Error loading families', description: error.message, variant: 'destructive' });
    } else {
      setFamilies(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFamilyName.trim()) return;

    setIsCreating(true);
    const adapter = getAdapter();
    
    const { data, error } = await adapter.families.createFamily({
      name: newFamilyName.trim(),
      createdById: user.id,
    });

    if (error) {
      toast({ title: 'Failed to create family', description: error.message, variant: 'destructive' });
    } else if (data) {
      setFamilies([...families, data]);
      setNewFamilyName('');
      setDialogOpen(false);
      toast({ title: 'Family created!', description: `"${data.name}" is ready to grow.` });
    }
    setIsCreating(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadBackup();
    toast({ title: 'Backup downloaded', description: 'Keep the file somewhere safe — it is the only copy of your chronicle outside this browser.' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const backup = parseBackup(await file.text());
      const confirmed = window.confirm(
        `Restore this backup (${backupCounts(backup)})?\n\nThis replaces everything currently stored in this browser.`
      );
      if (!confirmed) return;
      importBackup(backup);
      await loadFamilies();
      toast({ title: 'Backup restored', description: backupCounts(backup) });
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Could not read that file.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse-soft mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your garden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-semibold">Buds</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.displayName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleExport} title="Download a JSON backup of all your trees">
              <Download className="w-4 h-4 mr-2" />
              Backup
            </Button>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Restore from a JSON backup">
              <Upload className="w-4 h-4 mr-2" />
              Restore
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold mb-2">Your Family Trees</h1>
          <p className="text-muted-foreground">
            Each tree holds the stories and memories of your loved ones.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create new family card */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-dashed border-2 border-border hover:border-primary/50 cursor-pointer transition-colors group">
                <CardContent className="flex flex-col items-center justify-center h-48">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground">Start a new tree</p>
                  <p className="text-sm text-muted-foreground">Create a family timeline</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create a Family Tree</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFamily} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="familyName">Family Name</Label>
                  <Input
                    id="familyName"
                    placeholder="e.g., The Smith Family"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Tree'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Existing families */}
          {families.map((family) => (
            <Card 
              key={family.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/tree/${family.id}`)}
            >
              <CardHeader>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <TreeDeciduous className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="font-display">{family.name}</CardTitle>
                <CardDescription>
                  Created {new Date(family.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click to view and manage this family tree
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {families.length === 0 && (
          <div className="text-center mt-12 p-8 rounded-lg bg-muted/50">
            <TreeDeciduous className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="font-display text-xl mb-2">No family trees yet</h2>
            <p className="text-muted-foreground mb-4">
              Start by creating your first family tree. Add buds for each family member
              and watch your timeline grow.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
