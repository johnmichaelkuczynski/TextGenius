import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { analysisRequestSchema, type AnalysisRequest, apiKeysSchema } from "@shared/schema";
import { getQuestions } from "./services/question-sets";
import { LLMClients } from "./services/llm-clients";
import { TextProcessor } from "./services/text-processor";
import { FileParser } from "./services/file-parser";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        filename: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size
      });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const extension = req.file.originalname.toLowerCase().split('.').pop();
      console.log('File extension:', extension);

      if (!FileParser.validateFileType(req.file.originalname)) {
        return res.status(400).json({ 
          message: `Unsupported file type: .${extension}. Please use TXT files or copy/paste your text directly.` 
        });
      }

      const text = await FileParser.parseFile(req.file.buffer, req.file.originalname);
      
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ 
          message: "File appears to be empty or could not be read." 
        });
      }

      const wordCount = TextProcessor.countWords(text);
      const chunkCount = TextProcessor.calculateChunkCount(text);

      console.log('File processed successfully:', {
        filename: req.file.originalname,
        wordCount,
        chunkCount,
        textLength: text.length
      });

      res.json({
        text,
        wordCount,
        chunkCount,
        filename: req.file.originalname
      });
    } catch (error) {
      console.error('File upload error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filename: req.file?.originalname
      });
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process file" 
      });
    }
  });

  // Start analysis endpoint
  app.post("/api/analysis", async (req, res) => {
    try {
      const validatedRequest = analysisRequestSchema.parse(req.body);
      const apiKeys = apiKeysSchema.parse(req.body.apiKeys || {});

      // Create analysis record
      const analysis = await storage.createAnalysis(validatedRequest);

      // Start background processing
      processAnalysisAsync(analysis.id, validatedRequest, apiKeys);

      res.json({ 
        analysisId: analysis.id,
        message: "Analysis started successfully" 
      });
    } catch (error) {
      console.error('Analysis start error:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  // Get analysis status/results
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve analysis" 
      });
    }
  });

  // Download report endpoint
  app.get("/api/analysis/:id/report", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (!analysis.results || !analysis.overallScore) {
        return res.status(400).json({ message: "Analysis not yet complete" });
      }

      const report = generateTextReport(analysis);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-report-${analysis.id}.txt"`);
      res.send(report);
    } catch (error) {
      console.error('Download report error:', error);
      res.status(500).json({ 
        message: "Failed to generate report" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processAnalysisAsync(
  analysisId: string, 
  request: AnalysisRequest, 
  apiKeys: any
) {
  const startTime = Date.now();
  
  try {
    const llmClient = new LLMClients(apiKeys);
    
    let allResults: any[] = [];
    let allDoc2Results: any[] = [];
    
    if (request.evaluationParam === 'complete') {
      // Complete analysis - run all 4 parameters
      const parameters = ['originality', 'intelligence', 'cogency', 'quality'] as const;
      
      for (const param of parameters) {
        console.log(`Processing complete analysis - ${param} parameter...`);
        
        if (request.analysisMode === 'quick') {
          // Quick complete - single phase for each parameter
          const questions = getQuestions(param, 'quick');
          const doc1Results = await processDocument(
            request.document1Text, 
            questions, 
            request.llmProvider, 
            llmClient,
            apiKeys,
            'quick'
          );
          allResults.push(...doc1Results.map(r => ({ ...r, parameter: param })));
          
          if (request.documentMode === 'dual' && request.document2Text) {
            const doc2Results = await processDocument(
              request.document2Text, 
              questions, 
              request.llmProvider, 
              llmClient,
              apiKeys,
              'quick'
            );
            allDoc2Results.push(...doc2Results.map(r => ({ ...r, parameter: param })));
          }
        } else {
          // Comprehensive complete - 4 phases for each parameter
          for (let phase = 1; phase <= 4; phase++) {
            console.log(`Processing ${param} parameter - Phase ${phase}/4...`);
            const questions = getQuestions(param, 'comprehensive', phase);
            
            if (questions.length > 0) {
              const doc1Results = await processDocument(
                request.document1Text, 
                questions, 
                request.llmProvider, 
                llmClient,
                apiKeys,
                'comprehensive'
              );
              allResults.push(...doc1Results.map(r => ({ ...r, parameter: param, phase })));
              
              if (request.documentMode === 'dual' && request.document2Text) {
                const doc2Results = await processDocument(
                  request.document2Text, 
                  questions, 
                  request.llmProvider, 
                  llmClient,
                  apiKeys,
                  'comprehensive'
                );
                allDoc2Results.push(...doc2Results.map(r => ({ ...r, parameter: param, phase })));
              }
            }
          }
        }
      }
    } else {
      // Single parameter analysis (existing logic)
      const questions = getQuestions(request.evaluationParam, request.analysisMode);

      // Process document 1
      allResults = await processDocument(
        request.document1Text, 
        questions, 
        request.llmProvider, 
        llmClient,
        apiKeys,
        request.analysisMode
      );

      // Process document 2 if dual mode
      if (request.documentMode === 'dual' && request.document2Text) {
        allDoc2Results = await processDocument(
          request.document2Text, 
          questions, 
          request.llmProvider, 
          llmClient,
          apiKeys,
          request.analysisMode
        );
      }
    }

    let comparisonResults = undefined;
    
    // Generate comparison for dual mode
    if (request.documentMode === 'dual' && request.document2Text && allDoc2Results.length > 0) {
      comparisonResults = await generateComparison(
        request.document1Text,
        request.document2Text,
        allResults,
        allDoc2Results,
        request.evaluationParam,
        request.llmProvider,
        llmClient,
        apiKeys
      );
    }

    // Calculate overall score
    const overallScore = calculateOverallScore(allResults, allDoc2Results);
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    // Update analysis with results
    await storage.updateAnalysisResults(analysisId, {
      results: allResults,
      document2Results: allDoc2Results.length > 0 ? allDoc2Results : undefined,
      comparisonResults
    }, overallScore, processingTime);

  } catch (error) {
    console.error('Analysis processing error:', error);
    // Update analysis with error status
    await storage.updateAnalysisResults(analysisId, {
      error: error instanceof Error ? error.message : "Analysis failed"
    }, 0, Math.round((Date.now() - startTime) / 1000));
  }
}

async function processDocument(
  text: string,
  questions: string[],
  provider: string,
  llmClient: LLMClients,
  apiKeys: any,
  analysisMode: string = 'quick'
) {
  const chunks = TextProcessor.chunkText(text);
  const results = [];

  for (const question of questions) {
    const chunkResults = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const result = await llmClient.analyzeText(provider, chunk.text, question, apiKeys);
        chunkResults.push({
          chunkIndex: i,
          ...result
        });

        // Wait between chunks to avoid rate limiting (shorter for quick analysis)
        if (i < chunks.length - 1) {
          const delay = analysisMode === 'quick' ? 1 : 3;
          await TextProcessor.delay(delay);
        }
      } catch (error) {
        console.error(`Error processing chunk ${i} for question "${question}":`, error);
        chunkResults.push({
          chunkIndex: i,
          score: 0,
          explanation: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          quotes: []
        });
      }
    }

    // Amalgamate results for this question
    const amalgamatedResult = amalgamateChunkResults(question, chunkResults);
    results.push(amalgamatedResult);
  }

  return results;
}

function amalgamateChunkResults(question: string, chunkResults: any[]) {
  // Calculate average score
  const validResults = chunkResults.filter(r => r.score > 0);
  const averageScore = validResults.length > 0 
    ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length)
    : 0;

  // Combine explanations
  const explanations = chunkResults
    .filter(r => r.explanation && !r.explanation.startsWith('Error:'))
    .map(r => r.explanation);

  const combinedExplanation = explanations.length > 0
    ? explanations.join('\n\n')
    : 'Unable to generate explanation due to processing errors.';

  // Combine quotes
  const allQuotes = chunkResults
    .flatMap(r => r.quotes || [])
    .filter(quote => quote && quote.trim().length > 0);

  return {
    question,
    score: averageScore,
    explanation: combinedExplanation,
    quotes: allQuotes
  };
}

async function generateComparison(
  doc1Text: string,
  doc2Text: string,
  doc1Results: any[],
  doc2Results: any[],
  evaluationParam: string,
  provider: string,
  llmClient: LLMClients,
  apiKeys: any
) {
  const comparisonPrompt = `Compare these two documents based on ${evaluationParam}. 

Document 1 Results:
${JSON.stringify(doc1Results, null, 2)}

Document 2 Results:
${JSON.stringify(doc2Results, null, 2)}

Provide a comparative analysis in JSON format:
{
  "explanation": "[detailed comparison explanation]",
  "scores": {
    "document1": [overall score for document 1],
    "document2": [overall score for document 2]
  }
}`;

  try {
    const result = await llmClient.analyzeText(provider, comparisonPrompt, 'Provide a comparative analysis', apiKeys);
    return JSON.parse(result.explanation);
  } catch (error) {
    console.error('Comparison generation error:', error);
    return {
      explanation: 'Unable to generate comparison due to processing error.',
      scores: {
        document1: calculateOverallScore(doc1Results),
        document2: calculateOverallScore(doc2Results)
      }
    };
  }
}

function calculateOverallScore(doc1Results: any[], doc2Results?: any[]): number {
  const doc1Score = doc1Results.reduce((sum, r) => sum + r.score, 0) / doc1Results.length;
  
  if (doc2Results) {
    const doc2Score = doc2Results.reduce((sum, r) => sum + r.score, 0) / doc2Results.length;
    return Math.round((doc1Score + doc2Score) / 2);
  }
  
  return Math.round(doc1Score);
}

function generateTextReport(analysis: any): string {
  const results = analysis.results;
  let report = `ORIGINALITY METER ANALYSIS REPORT\n`;
  report += `=====================================\n\n`;
  report += `Analysis ID: ${analysis.id}\n`;
  report += `Date: ${new Date(analysis.createdAt).toLocaleString()}\n`;
  report += `Document Mode: ${analysis.documentMode}\n`;
  report += `LLM Provider: ${analysis.llmProvider}\n`;
  report += `Evaluation Parameter: ${analysis.evaluationParam}\n`;
  report += `Analysis Mode: ${analysis.analysisMode}\n`;
  report += `Overall Score: ${analysis.overallScore}/100\n`;
  report += `Processing Time: ${analysis.processingTime} seconds\n\n`;

  if (results.results) {
    report += `DOCUMENT 1 ANALYSIS\n`;
    report += `===================\n\n`;
    
    results.results.forEach((result: any, index: number) => {
      report += `Question ${index + 1}: ${result.question}\n`;
      report += `Score: ${result.score}/100\n`;
      report += `Explanation: ${result.explanation}\n`;
      if (result.quotes.length > 0) {
        report += `Key Quotes:\n`;
        result.quotes.forEach((quote: string) => {
          report += `  - "${quote}"\n`;
        });
      }
      report += `\n`;
    });
  }

  if (results.document2Results) {
    report += `DOCUMENT 2 ANALYSIS\n`;
    report += `===================\n\n`;
    
    results.document2Results.forEach((result: any, index: number) => {
      report += `Question ${index + 1}: ${result.question}\n`;
      report += `Score: ${result.score}/100\n`;
      report += `Explanation: ${result.explanation}\n`;
      if (result.quotes.length > 0) {
        report += `Key Quotes:\n`;
        result.quotes.forEach((quote: string) => {
          report += `  - "${quote}"\n`;
        });
      }
      report += `\n`;
    });
  }

  if (results.comparisonResults) {
    report += `COMPARATIVE ANALYSIS\n`;
    report += `====================\n\n`;
    report += `${results.comparisonResults.explanation}\n\n`;
    report += `Comparative Scores:\n`;
    report += `Document 1: ${results.comparisonResults.scores.document1}/100\n`;
    report += `Document 2: ${results.comparisonResults.scores.document2}/100\n`;
  }

  return report;
}
