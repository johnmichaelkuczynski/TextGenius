import { useEffect, useState, useCallback } from 'react';
import { AnalysisResult } from '@shared/schema';

interface StreamEvent {
  type: 'connected' | 'update' | 'complete' | 'error';
  analysisId?: string;
  analysis?: any;
  error?: string;
}

export function useAnalysisStream(analysisId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const connectToStream = useCallback(() => {
    if (!analysisId) return;

    const eventSource = new EventSource(`/api/analysis/${analysisId}/stream`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            setIsConnected(true);
            break;
          
          case 'update':
            if (data.analysis) {
              // Transform the analysis data to match our AnalysisResult interface
              const transformedAnalysis: AnalysisResult = {
                id: data.analysis.id,
                overallScore: data.analysis.overallScore || 0,
                processingTime: data.analysis.processingTime || 0,
                results: data.analysis.results?.results || data.analysis.results || [],
                document2Results: data.analysis.results?.document2Results,
                comparisonResults: data.analysis.results?.comparisonResults,
              };
              setAnalysis(transformedAnalysis);
            }
            break;

          case 'complete':
            setIsComplete(true);
            setIsConnected(false);
            break;

          case 'error':
            setError(data.error || 'Unknown streaming error');
            setIsConnected(false);
            break;
        }
      } catch (err) {
        console.error('Error parsing stream event:', err);
        setError('Failed to parse stream data');
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setError('Connection error');
      setIsConnected(false);
    };

    return eventSource;
  }, [analysisId]);

  useEffect(() => {
    let eventSource: EventSource | undefined;

    if (analysisId && !isComplete) {
      eventSource = connectToStream();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [analysisId, isComplete, connectToStream]);

  // Reset state when analysisId changes
  useEffect(() => {
    setAnalysis(null);
    setError(null);
    setIsComplete(false);
    setIsConnected(false);
  }, [analysisId]);

  return {
    analysis,
    isConnected,
    error,
    isComplete
  };
}