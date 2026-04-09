import React from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, Video, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Resource {
  type: 'image' | 'video' | 'file' | 'link';
  url: string;
  title: string;
}

interface ResourceListProps {
  resources: Resource[];
  onDelete?: (index: number) => void;
  isEditable?: boolean;
}

export function ResourceList({ resources, onDelete, isEditable }: ResourceListProps) {
  if (!resources || resources.length === 0) {
    return <p className="text-sm text-stone-400 italic">No resources attached.</p>;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={18} />;
      case 'video': return <Video size={18} />;
      case 'file': return <FileText size={18} />;
      case 'link': return <LinkIcon size={18} />;
      default: return <LinkIcon size={18} />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {resources.map((resource, index) => (
        <div 
          key={index} 
          className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white rounded-lg text-stone-500 shadow-sm">
              {getIcon(resource.type)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{resource.title}</p>
              <Badge variant="ghost" className="text-[10px] uppercase tracking-wider p-0 h-auto text-stone-400">
                {resource.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <ExternalLink size={16} />
            </a>
            {isEditable && onDelete && (
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => onDelete(index)}
                className="text-stone-300 hover:text-red-600"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
