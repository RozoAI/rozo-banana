import { useEffect, useState } from "react";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        const userAgent =
          navigator.userAgent || navigator.vendor || (window as any).opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent.toLowerCase()
        );
      };
      setIsMobile(checkMobile());
    }
  }, []);

  return isMobile;
};
