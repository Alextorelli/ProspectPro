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
    if (allowBackNavigation || index > activeStep) {
      onStepChange(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!keyboardNavigation || !onStepChange) return;

    let targetIndex: number | null = null;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        targetIndex = Math.max(0, index - 1);
        break;

      case "ArrowRight":
        e.preventDefault();
        targetIndex = Math.min(steps.length - 1, index + 1);
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
        aria-label="Progress steps"
        className="flex items-center justify-between"
        role="group"
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
                  aria-current={status === "active" ? "step" : undefined}
                  aria-label={`${step.label}${
                    step.description ? `: ${step.description}` : ""
                  }`}
                  className={`${getStepStyles(
                    index
                  )} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
                  disabled={!isClickable && !keyboardNavigation}
                  id={stepId}
                  tabIndex={index === activeStep ? 0 : -1}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  {status === "completed" ? (
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  ) : status === "active" ? (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                      {index + 1}
                    </span>
                  )}
                </button>

                {step.label && (
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-medium ${
                        status === "active"
                          ? "text-blue-600 dark:text-sky-400"
                          : status === "completed"
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {step.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isLast && <div className={getConnectorStyles(index)} />}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
