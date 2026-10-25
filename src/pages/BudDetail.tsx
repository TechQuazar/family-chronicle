// Bud detail page - shows messages to future and diary access

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAdapter } from '@/adapters';
import type { Bud, MessageToFuture, DiaryEntry } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, MessageCircle, BookHeart, Send, Leaf, Calendar, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function BudDetail() {
  const { familyId, budId } = useParams<{ familyId: string; budId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bud, setBud] = useState<Bud | null>(null);
  const [messages, setMessages] = useState<MessageToFuture[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [newDiaryEntry, setNewDiaryEntry] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Edit-bud form state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editDeathDate, setEditDeathDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && budId) {
      loadBudData();
    }
  }, [user, budId]);

  const loadBudData = async () => {
    if (!budId) return;

    const adapter = getAdapter();
    
    const [budRes, messagesRes, diaryRes] = await Promise.all([
      adapter.buds.getBud(budId),
      adapter.messages.getMessagesByBud(budId),
      adapter.diary.getEntriesByBud(budId),
    ]);

    if (budRes.error) {
      toast({ title: 'Error loading bud', description: budRes.error.message, variant: 'destructive' });
      navigate(`/tree/${familyId}`);
      return;
    }

    setBud(budRes.data || null);
    setMessages(messagesRes.data || []);
    setDiaryEntries(diaryRes.data || []);
    setIsLoading(false);
  };

  const toDateInputValue = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };

  const openEditDialog = () => {
    if (!bud) return;
    setEditName(bud.name);
    setEditBio(bud.bio || '');
    setEditBirthDate(toDateInputValue(bud.birthDate));
    setEditDeathDate(toDateInputValue(bud.deathDate));
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budId || !editName.trim()) return;

    if (editBirthDate && editDeathDate && editDeathDate < editBirthDate) {
      toast({ title: 'Invalid dates', description: 'Death date cannot be before birth date.', variant: 'destructive' });
      return;
    }

    setIsSavingEdit(true);
    const adapter = getAdapter();

    const { data, error } = await adapter.buds.updateBud(budId, {
      name: editName.trim(),
      bio: editBio.trim() || undefined,
      birthDate: editBirthDate ? new Date(editBirthDate) : undefined,
      deathDate: editDeathDate ? new Date(editDeathDate) : undefined,
    });

    if (error) {
      toast({ title: 'Failed to save changes', description: error.message, variant: 'destructive' });
    } else if (data) {
      setBud(data);
      setEditOpen(false);
      toast({ title: 'Bud updated', description: `${data.name}'s details have been saved.` });
    }
    setIsSavingEdit(false);
  };

  const handleSendMessage = async () => {
    if (!user || !budId || !newMessage.trim()) return;

    setIsSending(true);
    const adapter = getAdapter();
    
    const { data, error } = await adapter.messages.createMessage({
      budId,
      authorId: user.id,
      content: newMessage.trim(),
      isPublic: true,
    });

    if (error) {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else if (data) {
      setMessages([data, ...messages]);
      setNewMessage('');
      toast({ title: 'Message sent', description: 'Your message to the future has been saved.' });
    }
    setIsSending(false);
  };

  const handleSaveDiaryEntry = async () => {
    if (!user || !budId || !newDiaryEntry.trim()) return;

    setIsSending(true);
    const adapter = getAdapter();
    
    const { data, error } = await adapter.diary.createEntry({
      budId,
      content: newDiaryEntry.trim(),
      date: new Date(),
    });

    if (error) {
      toast({ title: 'Failed to save entry', description: error.message, variant: 'destructive' });
    } else if (data) {
      setDiaryEntries([data, ...diaryEntries]);
      setNewDiaryEntry('');
      toast({ title: 'Entry saved', description: 'Your diary entry has been recorded.' });
    }
    setIsSending(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-primary animate-pulse-soft mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const initials = bud?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tree/${familyId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tree
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Bud header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-bud flex items-center justify-center text-xl font-medium text-primary-foreground">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold">{bud?.name}</h1>
            {(bud?.birthDate || bud?.deathDate) && (
              <p className="text-sm text-muted-foreground">
                {bud?.birthDate ? format(new Date(bud.birthDate), 'MMMM d, yyyy') : ''}
                {bud?.birthDate && bud?.deathDate ? ' — ' : ''}
                {bud?.deathDate ? format(new Date(bud.deathDate), 'MMMM d, yyyy') : ''}
              </p>
            )}
            {bud?.bio && (
              <p className="text-muted-foreground">{bud.bio}</p>
            )}
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Edit Bud</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBio">Bio</Label>
                  <Textarea
                    id="editBio"
                    placeholder="A short biography or description..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editBirthDate">Birth date</Label>
                    <Input
                      id="editBirthDate"
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDeathDate">Death date</Label>
                    <Input
                      id="editDeathDate"
                      type="date"
                      value={editDeathDate}
                      onChange={(e) => setEditDeathDate(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="messages" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages to Future
            </TabsTrigger>
            <TabsTrigger value="diary" className="flex-1">
              <BookHeart className="w-4 h-4 mr-2" />
              Diary
            </TabsTrigger>
          </TabsList>

          {/* Messages to Future Tab */}
          <TabsContent value="messages" className="space-y-6">
            {/* New message form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">Write a message to the future</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Share a memory, wish, or message for future generations..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending || !newMessage.trim()}
                  className="w-full sm:w-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send to Future'}
                </Button>
              </CardContent>
            </Card>

            {/* Messages list */}
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map(msg => (
                  <Card key={msg.id}>
                    <CardContent className="pt-4">
                      <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Be the first to leave a message for the future.</p>
              </div>
            )}
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary" className="space-y-6">
            {/* New diary entry form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="What's on your mind today? Record your thoughts, feelings, and experiences..."
                  value={newDiaryEntry}
                  onChange={(e) => setNewDiaryEntry(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button 
                  onClick={handleSaveDiaryEntry} 
                  disabled={isSending || !newDiaryEntry.trim()}
                  className="w-full sm:w-auto"
                >
                  <BookHeart className="w-4 h-4 mr-2" />
                  {isSending ? 'Saving...' : 'Save Entry'}
                </Button>
              </CardContent>
            </Card>

            {/* Diary entries list */}
            {diaryEntries.length > 0 ? (
              <div className="space-y-4">
                {diaryEntries.map(entry => (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-base">
                        {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookHeart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Your diary is empty. Start writing your first entry.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
