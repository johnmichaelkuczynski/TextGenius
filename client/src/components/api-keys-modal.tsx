import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Bot, Search, Layers } from 'lucide-react';
import { ApiKeys } from '@shared/schema';

interface ApiKeysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (keys: ApiKeys) => void;
  initialKeys?: ApiKeys;
}

export function ApiKeysModal({ open, onOpenChange, onSave, initialKeys }: ApiKeysModalProps) {
  const [keys, setKeys] = useState<ApiKeys>(initialKeys || {});

  const handleSave = () => {
    onSave(keys);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="api-keys-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Configure API Keys</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Anthropic API Key */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Brain className="mr-2 h-4 w-4 text-purple-600" />
              Anthropic API Key (Default)
            </Label>
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={keys.anthropic || ''}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              className="focus:ring-purple-500 focus:border-purple-500"
              data-testid="anthropic-api-key"
            />
            <p className="text-xs text-gray-500 mt-1">Required for Claude analysis</p>
          </div>
          
          {/* OpenAI API Key */}
          <div className="bg-green-50 p-4 rounded-lg">
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Bot className="mr-2 h-4 w-4 text-green-600" />
              OpenAI API Key
            </Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={keys.openai || ''}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              className="focus:ring-green-500 focus:border-green-500"
              data-testid="openai-api-key"
            />
            <p className="text-xs text-gray-500 mt-1">Required for GPT analysis</p>
          </div>
          
          {/* Perplexity API Key */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Search className="mr-2 h-4 w-4 text-blue-600" />
              Perplexity API Key
            </Label>
            <Input
              type="password"
              placeholder="pplx-..."
              value={keys.perplexity || ''}
              onChange={(e) => setKeys({ ...keys, perplexity: e.target.value })}
              className="focus:ring-blue-500 focus:border-blue-500"
              data-testid="perplexity-api-key"
            />
            <p className="text-xs text-gray-500 mt-1">Required for Perplexity analysis</p>
          </div>
          
          {/* DeepSeek API Key */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <Label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Layers className="mr-2 h-4 w-4 text-orange-600" />
              DeepSeek API Key
            </Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={keys.deepseek || ''}
              onChange={(e) => setKeys({ ...keys, deepseek: e.target.value })}
              className="focus:ring-orange-500 focus:border-orange-500"
              data-testid="deepseek-api-key"
            />
            <p className="text-xs text-gray-500 mt-1">Required for DeepSeek analysis</p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <Button onClick={handleSave} data-testid="save-api-keys">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
