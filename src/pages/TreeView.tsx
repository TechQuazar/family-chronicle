// Tree view - Shows the family tree canvas with auto-layout

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAdapter } from '@/adapters';
import type { Family, Bud, BudConnection } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TreeCanvas from '@/components/tree/TreeCanvas';

export default function TreeView() {
  const { familyId } = useParams<{ familyId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [family, setFamily] = useState<Family | null>(null);
  const [buds, setBuds] = useState<Bud[]>([]);
  const [connections, setConnections] = useState<BudConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBudName, setNewBudName] = useState('');
  const [selectedBudId, setSelectedBudId] = useState<string | null>(null);

  // New bud connection state
  const [connectToBudId, setConnectToBudId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('');
  const [secondParentId, setSecondParentId] = useState<string>('');

  // Helper to check if two buds are spouses
  const isSpouseOf = (budId1: string, budId2: string): boolean => {
    return connections.some(
      conn => conn.relationshipType === 'spouse' && 
      ((conn.fromBudId === budId1 && conn.toBudId === budId2) ||
       (conn.fromBudId === budId2 && conn.toBudId === budId1))
    );
  };

  // Get possible second parents (spouses first, then other buds)
  const getSpouseOptions = (firstParentId: string): Bud[] => {
    const spouse = buds.find(bud => 
      bud.id !== firstParentId && isSpouseOf(bud.id, firstParentId)
    );
    const otherBuds = buds.filter(bud => 
      bud.id !== firstParentId && (!spouse || bud.id !== spouse.id)
    );
    // Put spouse first if exists
    return spouse ? [spouse, ...otherBuds] : otherBuds;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && familyId) {
      loadFamilyData();
    }
  }, [user, familyId]);

  const loadFamilyData = async () => {
    if (!familyId) return;
    
    const adapter = getAdapter();
    
    // Load family, buds, and connections in parallel
    const [familyRes, budsRes, connectionsRes] = await Promise.all([
      adapter.families.getFamily(familyId),
      adapter.buds.getBudsByFamily(familyId),
      adapter.connections.getConnectionsByFamily(familyId),
    ]);

    if (familyRes.error) {
      toast({ title: 'Error loading family', description: familyRes.error.message, variant: 'destructive' });
      navigate('/');
      return;
    }

    setFamily(familyRes.data || null);
    setBuds(budsRes.data || []);
    setConnections(connectionsRes.data || []);
    setIsLoading(false);
  };

  const handleCreateBud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !familyId || !newBudName.trim()) return;

    const adapter = getAdapter();
    
    // Calculate position based on existing buds (simple grid for now)
    const position = { x: (buds.length % 4) * 200, y: Math.floor(buds.length / 4) * 200 };
    
    const { data: newBud, error } = await adapter.buds.createBud({
      familyId,
      name: newBudName.trim(),
      position,
    });

    if (error) {
      toast({ title: 'Failed to create bud', description: error.message, variant: 'destructive' });
      return;
    }

    if (newBud) {
      // If connecting to another bud
      if (connectToBudId && relationshipType) {
        await adapter.connections.createConnection({
          familyId,
          fromBudId: newBud.id,
          toBudId: connectToBudId,
          relationshipType: relationshipType as BudConnection['relationshipType'],
        });

        // If child has a second parent, create that connection too
        if (relationshipType === 'child' && secondParentId && secondParentId !== 'none') {
          await adapter.connections.createConnection({
            familyId,
            fromBudId: newBud.id,
            toBudId: secondParentId,
            relationshipType: 'child',
          });
        }
      }

      // Reload data to get updated connections
      await loadFamilyData();
      
      setNewBudName('');
      setConnectToBudId('');
      setRelationshipType('');
      setSecondParentId('');
      setDialogOpen(false);
      toast({ title: 'Bud created!', description: `${newBud.name} has been added to the tree.` });
    }
  };

  const handleBudClick = useCallback((budId: string) => {
    setSelectedBudId(budId);
    navigate(`/tree/${familyId}/bud/${budId}`);
  }, [familyId, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse-soft mx-auto mb-4" />
          <p className="text-muted-foreground">Growing your tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <span className="font-display text-lg font-medium">{family?.name}</span>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Bud
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Add a New Bud</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBud} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="budName">Name</Label>
                  <Input
                    id="budName"
                    placeholder="e.g., John Smith"
                    value={newBudName}
                    onChange={(e) => setNewBudName(e.target.value)}
                    required
                  />
                </div>

                {buds.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relationship</Label>
                      <Select value={relationshipType} onValueChange={(val) => {
                        setRelationshipType(val);
                        setConnectToBudId('');
                        setSecondParentId('');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="How is this person related?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Is a parent</SelectItem>
                          <SelectItem value="child">Is a child</SelectItem>
                          <SelectItem value="spouse">Is a spouse</SelectItem>
                          <SelectItem value="sibling">Is a sibling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {relationshipType && (
                      <div className="space-y-2">
                        <Label htmlFor="connectTo">
                          {relationshipType === 'child' ? 'Select parent(s)' : 
                           relationshipType === 'parent' ? 'Select child' :
                           relationshipType === 'spouse' ? 'Select spouse' : 'Select sibling'}
                        </Label>
                        <Select value={connectToBudId} onValueChange={setConnectToBudId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a family member" />
                          </SelectTrigger>
                          <SelectContent>
                            {buds.map((bud) => (
                              <SelectItem key={bud.id} value={bud.id}>
                                {bud.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Second parent selection for children */}
                    {relationshipType === 'child' && connectToBudId && (
                      <div className="space-y-2">
                        <Label htmlFor="secondParent">Second parent (optional)</Label>
                        <Select value={secondParentId} onValueChange={setSecondParentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select second parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No second parent</SelectItem>
                            {getSpouseOptions(connectToBudId).map((bud) => (
                              <SelectItem key={bud.id} value={bud.id}>
                                {bud.name} {isSpouseOf(bud.id, connectToBudId) ? '(spouse)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select if this child has two parents in the tree
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Button type="submit" className="w-full">
                  Create Bud
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        {buds.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-10 h-10 text-primary/50" />
              </div>
              <h2 className="font-display text-xl mb-2">Plant your first bud</h2>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Start by adding yourself or a family member. Each bud represents a person in your family timeline.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Bud
              </Button>
            </div>
          </div>
        ) : (
          <TreeCanvas 
            buds={buds} 
            connections={connections} 
            onBudClick={handleBudClick}
            selectedBudId={selectedBudId}
          />
        )}
      </div>
    </div>
  );
}
