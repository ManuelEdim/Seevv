import { useState, useCallback } from "react";

const useSuccessAnimation = (duration = 3000) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const trigger = useCallback(() => {
    setIsVisible(true);
    setIsAnimating(true);

    // Stop wobble animation after duration
    setTimeout(() => {
      setIsAnimating(false);
    }, duration);

    // Hide success banner after duration + 500ms
    setTimeout(() => {
      setIsVisible(false);
    }, duration + 500);
  }, [duration]);

  const reset = useCallback(() => {
    setIsAnimating(false);
    setIsVisible(false);
  }, []);

  return { isAnimating, isVisible, trigger, reset };
};

export default useSuccessAnimation;
