import { AlgorithmResult, AlgorithmStep } from "@shared/schema";

interface AlgorithmMetricsProps {
  result?: AlgorithmResult;
  currentStep?: AlgorithmStep;
  currentStepIndex: number;
  totalSteps: number;
}

export default function AlgorithmMetrics({
  result,
  currentStep,
  currentStepIndex,
  totalSteps
}: AlgorithmMetricsProps) {
  // If no result yet, show empty state
  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Algorithm Metrics</h2>
        
        <div className="text-center py-4 text-gray-500">
          <p>Run an algorithm to see metrics</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      <h2 className="font-heading font-semibold text-lg mb-4">Algorithm Metrics</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Current Step:</span>
          <span className="font-medium">{currentStepIndex + 1} of {totalSteps}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Visited Nodes:</span>
          <span className="font-medium">
            {currentStep?.visited?.length || 0}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Time Complexity:</span>
          <span className="font-mono">{result.timeComplexity}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Space Complexity:</span>
          <span className="font-mono">{result.spaceComplexity}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Execution Time:</span>
          <span className="font-medium">
            {result.executionTime.toFixed(2)}ms
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-sm mb-2">Current Status:</h3>
        <div className="bg-gray-50 rounded p-3 font-mono text-sm overflow-auto max-h-[120px]">
          {currentStep ? (
            <>
              <p>{currentStep.description}</p>
              {currentStep.queue && currentStep.queue.length > 0 && (
                <p>Queue: [{currentStep.queue.join(', ')}]</p>
              )}
              {currentStep.stack && currentStep.stack.length > 0 && (
                <p>Stack: [{currentStep.stack.join(', ')}]</p>
              )}
              {currentStep.path && currentStep.path.length > 0 && (
                <p>Path: [{currentStep.path.join(' → ')}]</p>
              )}
            </>
          ) : (
            <p>No algorithm execution data</p>
          )}
        </div>
      </div>
    </div>
  );
}
