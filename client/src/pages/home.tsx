import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Microscope, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ApiKeysModal } from '@/components/api-keys-modal';
import { AnalysisConfigPanel } from '@/components/analysis-config';
import { DocumentInput } from '@/components/document-input';
import { ProgressTracker } from '@/components/progress-tracker';
import { ResultsDisplay } from '@/components/results-display';
import { ApiKeys, AnalysisRequest, AnalysisResult } from '@shared/schema';

interface AnalysisConfig {
  documentMode: 'single' | 'dual';
  llmProvider: 'anthropic' | 'openai' | 'perplexity' | 'deepseek';
  evaluationParam: 'originality' | 'intelligence' | 'cogency' | 'quality';
  analysisMode: 'quick' | 'comprehensive';
}

export default function Home() {
  const { toast } = useToast();
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [config, setConfig] = useState<AnalysisConfig>({
    documentMode: 'single',
    llmProvider: 'anthropic',
    evaluationParam: 'originality',
    analysisMode: 'quick'
  });
  const [document1Text, setDocument1Text] = useState('');
  const [document2Text, setDocument2Text] = useState('');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

  // Load API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (error) {
        console.error('Failed to load saved API keys:', error);
      }
    }
  }, []);

  // Poll for analysis results
  const { data: analysisData, refetch } = useQuery({
    queryKey: ['/api/analysis', analysisId],
    enabled: !!analysisId && isAnalyzing,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (analysisData && typeof analysisData === 'object' && 'overallScore' in analysisData && analysisData.overallScore !== null) {
      setIsAnalyzing(false);
      const data = analysisData as any;
      setAnalysisResults({
        id: data.id,
        overallScore: data.overallScore,
        processingTime: data.processingTime,
        results: data.results?.results || [],
        document2Results: data.results?.document2Results,
        comparisonResults: data.results?.comparisonResults,
      });
    }
  }, [analysisData]);

  const startAnalysisMutation = useMutation({
    mutationFn: async (request: AnalysisRequest & { apiKeys: ApiKeys }) => {
      const response = await apiRequest('POST', '/api/analysis', request);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisId(data.analysisId);
      setIsAnalyzing(true);
      setAnalysisResults(null);
      toast({
        title: "Analysis started",
        description: "Your text analysis is now in progress.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  const handleApiKeysSave = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('apiKeys', JSON.stringify(keys));
    toast({
      title: "API keys saved",
      description: "Your API keys have been configured successfully.",
    });
  };

  const handleStartAnalysis = () => {
    // Validate inputs
    if (!document1Text.trim()) {
      toast({
        title: "Missing document",
        description: "Please provide text for analysis.",
        variant: "destructive",
      });
      return;
    }

    if (config.documentMode === 'dual' && !document2Text.trim()) {
      toast({
        title: "Missing second document",
        description: "Please provide text for the second document.",
        variant: "destructive",
      });
      return;
    }

    // Check if API key is available for selected provider
    const requiredKey = apiKeys[config.llmProvider];
    if (!requiredKey) {
      toast({
        title: "API key required",
        description: `Please configure your ${config.llmProvider} API key.`,
        variant: "destructive",
      });
      setApiKeysOpen(true);
      return;
    }

    const request: AnalysisRequest & { apiKeys: ApiKeys } = {
      documentMode: config.documentMode,
      llmProvider: config.llmProvider,
      evaluationParam: config.evaluationParam,
      analysisMode: config.analysisMode,
      document1Text,
      document2Text: config.documentMode === 'dual' ? document2Text : undefined,
      apiKeys,
    };

    startAnalysisMutation.mutate(request);
  };

  const handleDownloadReport = async () => {
    if (!analysisId) return;

    try {
      const response = await fetch(`/api/analysis/${analysisId}/report`);
      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-report-${analysisId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the analysis report.",
        variant: "destructive",
      });
    }
  };

  const handleNewAnalysis = () => {
    setAnalysisId(null);
    setIsAnalyzing(false);
    setAnalysisResults(null);
    setDocument1Text('');
    setDocument2Text('');
  };

  const getLLMDisplayName = (provider: string) => {
    switch (provider) {
      case 'anthropic': return 'Anthropic';
      case 'openai': return 'OpenAI';
      case 'perplexity': return 'Perplexity';
      case 'deepseek': return 'DeepSeek';
      default: return provider;
    }
  };

  const getParamDisplayName = (param: string) => {
    switch (param) {
      case 'originality': return 'Originality';
      case 'intelligence': return 'Intelligence';
      case 'cogency': return 'Cogency';
      case 'quality': return 'Overall Quality';
      default: return param;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Microscope className="text-primary-600 h-8 w-8 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Originality Meter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Advanced Text Analysis</span>
              <Button
                onClick={() => setApiKeysOpen(true)}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="configure-api-keys"
              >
                <Key className="mr-2 h-4 w-4" />
                Configure API Keys
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Keys Modal */}
        <ApiKeysModal
          open={apiKeysOpen}
          onOpenChange={setApiKeysOpen}
          onSave={handleApiKeysSave}
          initialKeys={apiKeys}
        />

        {/* Configuration Panel */}
        <AnalysisConfigPanel
          config={config}
          onConfigChange={setConfig}
        />

        {/* Document Input Section */}
        <div className={`grid gap-8 mb-8 ${config.documentMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          <DocumentInput
            title={config.documentMode === 'dual' ? 'Document 1' : 'Document'}
            text={document1Text}
            onTextChange={setDocument1Text}
            required
            disabled={isAnalyzing}
          />
          
          {config.documentMode === 'dual' && (
            <DocumentInput
              title="Document 2"
              text={document2Text}
              onTextChange={setDocument2Text}
              required
              disabled={isAnalyzing}
            />
          )}
        </div>

        {/* Analysis Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Analyze</h3>
                <p className="text-sm text-gray-600">
                  Analyzing for <span className="font-medium text-primary-600">{getParamDisplayName(config.evaluationParam)}</span>{' '}
                  using <span className="font-medium text-primary-600">{getLLMDisplayName(config.llmProvider)}</span>{' '}
                  in <span className="font-medium text-primary-600">{config.analysisMode}</span> mode
                </p>
              </div>
              <Button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || startAnalysisMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
                data-testid="start-analysis"
              >
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <ProgressTracker
          isVisible={isAnalyzing}
          currentStep={1}
          totalSteps={4}
          currentPhase="Processing Document - Analyzing text..."
          currentAction="Evaluating originality questions..."
          showPhaseDetails={config.analysisMode === 'comprehensive'}
          onCancel={() => setIsAnalyzing(false)}
        />

        {/* Results Display */}
        <ResultsDisplay
          results={analysisResults}
          isVisible={!!analysisResults}
          onDownloadReport={handleDownloadReport}
          onNewAnalysis={handleNewAnalysis}
        />
      </div>
    </div>
  );
}
