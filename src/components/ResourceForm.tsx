import React, { useState } from 'react';
import { Plus, Link as LinkIcon, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Resource } from './ResourceList';

interface ResourceFormProps {
  onAdd: (resource: Resource) => void;
}

export function ResourceForm({ onAdd }: ResourceFormProps) {
  const [newResource, setNewResource] = useState<Resource>({
    type: 'link',
    url: '',
    title: ''
  });

  const handleAdd = () => {
    if (!newResource.url || !newResource.title) return;
    onAdd(newResource);
    setNewResource({ type: 'link', url: '', title: '' });
  };

  return (
    <div className="space-y-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select 
            value={newResource.type} 
            onValueChange={(val: any) => setNewResource({ ...newResource, type: val })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="file">File</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label>Title</Label>
          <Input 
            placeholder="Resource Title" 
            value={newResource.title}
            onChange={e => setNewResource({ ...newResource, title: e.target.value })}
            className="bg-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="https://..." 
            value={newResource.url}
            onChange={e => setNewResource({ ...newResource, url: e.target.value })}
            className="bg-white"
          />
          <Button 
            onClick={handleAdd}
            disabled={!newResource.url || !newResource.title}
            className="bg-stone-900 text-white shrink-0"
          >
            <Plus size={18} className="mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
