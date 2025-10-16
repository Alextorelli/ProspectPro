import React, { useEffect, useId, useRef } from "react";

/**
 * Step configuration matching discovery workflow stages
 * Aligned with SYSTEM_REFERENCE.md discovery pipeline
 */
export interface StepConfig {
  id: string;
  label: string;
  description?: string;
  status?: "pending" | "active" | "completed" | "error";
}

interface StepperProps {
  steps: StepConfig[];
  activeStep: number;
  onStepChange?: (stepIndex: number) => void;
  /** Enable keyboard navigation (arrow keys) */
  keyboardNavigation?: boolean;
  /** Allow clicking on completed steps to navigate back */
  allowBackNavigation?: boolean;
  className?: string;
}

/**
 * Accessible Stepper Component
 *
 * Features:
 * - WCAG 2.1 AA compliant with full keyboard support
 * - Roving tabindex for arrow key navigation
 * - ARIA attributes for screen readers
 * - Design tokens from tailwind.config.js
 * - Supports discovery workflow from SYSTEM_REFERENCE.md
 *
 * Usage in BusinessDiscovery.tsx:
 * ```tsx
 * <Stepper
 *   steps={discoverySteps}
 *   activeStep={currentStepIndex}
 *   onStepChange={handleStepChange}
 *   keyboardNavigation
 * />
 * ```
 */
export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  keyboardNavigation = true,
  allowBackNavigation = true,
  className = "",
}) => {
  const stepperBaseId = useId();
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    const activeElement = stepRefs.current[activeStep];
    if (
      activeElement &&
      document.activeElement?.closest('[role="group"]') === containerRef.current
    ) {
      activeElement.focus();
    }
  }, [activeStep]);

  const handleStepClick = (index: number) => {
    if (!onStepChange) return;

    // Allow clicking on active step or completed steps if back navigation is enabled
    const isClickable =
      index === activeStep || (allowBackNavigation && index < activeStep);

    if (isClickable) {
      onStepChange(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!keyboardNavigation || !onStepChange) return;

    let targetIndex: number | null = null;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        // Move to next step if not at the end
        if (index < steps.length - 1) {
          targetIndex = index + 1;
        }
        break;

      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        // Move to previous step if not at the beginning
        if (index > 0) {
          targetIndex = index - 1;
        }
        break;

      case "Home":
        e.preventDefault();
        targetIndex = 0;
        break;

      case "End":
        e.preventDefault();
        targetIndex = steps.length - 1;
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        handleStepClick(index);
        return;
    }

    if (targetIndex !== null) {
      const targetStep = stepRefs.current[targetIndex];
      if (targetStep) {
        targetStep.focus();
      }
    }
  };

  const getStepStatus = (index: number): StepConfig["status"] => {
    if (steps[index].status) return steps[index].status;
    if (index < activeStep) return "completed";
    if (index === activeStep) return "active";
    return "pending";
  };

  const getStepStyles = (index: number) => {
    const status = getStepStatus(index);
    const isClickable =
      index === activeStep || (allowBackNavigation && index < activeStep);

    const baseStyles =
      "flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all";

    switch (status) {
      case "completed":
        return `${baseStyles} bg-blue-600 text-white dark:bg-sky-500 ${
          isClickable
            ? "cursor-pointer hover:bg-blue-700 dark:hover:bg-sky-600"
            : ""
        }`;
      case "active":
        return `${baseStyles} bg-blue-600 text-white dark:bg-sky-500 ring-4 ring-blue-200 dark:ring-sky-900`;
      case "error":
        return `${baseStyles} bg-red-600 text-white dark:bg-red-500`;
      default:
        return `${baseStyles} bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-400`;
    }
  };

  const getConnectorStyles = (index: number) => {
    const status = getStepStatus(index);
    const baseStyles = "flex-1 h-0.5 mx-2 transition-colors";

    return status === "completed"
      ? `${baseStyles} bg-blue-600 dark:bg-sky-500`
      : `${baseStyles} bg-gray-200 dark:bg-slate-700`;
  };

  return (
    <div className={`w-full ${className}`}>
      <nav
        ref={containerRef}
        role="group"
        aria-label="Progress steps"
        className="flex items-center justify-between"
      >
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const stepId = `${stepperBaseId}-step-${index}`;
          const isClickable =
            index === activeStep || (allowBackNavigation && index < activeStep);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id || stepId}>
              <div className="flex flex-col items-center flex-shrink-0">
                <button
                  ref={(el) => (stepRefs.current[index] = el)}
                  id={stepId}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={!isClickable && !keyboardNavigation}
                  tabIndex={index === activeStep ? 0 : -1}
                  aria-current={status === "active" ? "step" : undefined}
                  aria-label={`${step.label}${
                    step.description ? `: ${step.description}` : ""
                  }`}
                  className={`${getStepStyles(
                    index
                  )} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : status === "error" ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      status === "active"
                        ? "text-blue-600 dark:text-sky-400"
                        : status === "completed"
                        ? "text-gray-900 dark:text-slate-100"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {!isLast && (
                <div className={getConnectorStyles(index)} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};

/**
 * Discovery workflow steps configuration
 * Matches the discovery pipeline in SYSTEM_REFERENCE.md
 */
export const DISCOVERY_WORKFLOW_STEPS: StepConfig[] = [
  {
    id: "select-business",
    label: "Business Type",
    description: "Choose industry",
  },
  {
    id: "set-location",
    label: "Location",
    description: "Set target area",
  },
  {
    id: "configure",
    label: "Configure",
    description: "Set parameters",
  },
  {
    id: "review",
    label: "Review",
    description: "Confirm settings",
  },
  {
    id: "processing",
    label: "Processing",
    description: "Discovering leads",
  },
];

export default Stepper;
