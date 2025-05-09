import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, Pause } from "lucide-react";

interface ExecutionControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  disabled?: boolean;
}

export default function ExecutionControls({
  isRunning,
  isPaused,
  canStepBackward,
  canStepForward,
  onStart,
  onPause,
  onStop,
  onStepBackward,
  onStepForward,
  disabled = false
}: ExecutionControlsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      <h2 className="font-heading font-semibold text-lg mb-4">Execution Controls</h2>
      
      <div className="flex space-x-2 mb-6">
        {!isRunning || isPaused ? (
          <Button 
            className="flex-1 flex items-center justify-center bg-secondary hover:bg-green-600"
            onClick={onStart}
            disabled={disabled}
          >
            <PlayIcon className="mr-1 h-4 w-4" />
            Run
          </Button>
        ) : (
          <Button 
            className="flex-1 flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={onPause}
            disabled={disabled}
            variant="secondary"
          >
            <PauseIcon className="mr-1 h-4 w-4" />
            Pause
          </Button>
        )}
        
        <Button 
          className="flex-1 flex items-center justify-center"
          onClick={onStop}
          disabled={disabled || (!isRunning && !isPaused)}
          variant="secondary"
        >
          <Pause className="mr-1 h-4 w-4" />
          Stop
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          className="flex-1"
          onClick={onStepBackward}
          disabled={disabled || !canStepBackward}
          variant="secondary"
        >
          Previous Step
        </Button>
        <Button 
          className="flex-1"
          onClick={onStepForward}
          disabled={disabled || !canStepForward}
          variant="secondary"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
