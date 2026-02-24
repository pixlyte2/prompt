import { useState } from "react";

export default function useLoading() {

  const [loading, setLoading] = useState({});

  const startLoading = (key) => {
    setLoading(prev => ({
      ...prev,
      [key]: true
    }));
  };

  const stopLoading = (key) => {
    setLoading(prev => ({
      ...prev,
      [key]: false
    }));
  };

  const isLoading = (key) => {
    return loading[key] || false;
  };

  return {
    startLoading,
    stopLoading,
    isLoading
  };
}