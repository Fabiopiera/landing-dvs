import React, { useState, useEffect, useRef } from "react";
import styles from "./Gallery.module.css";

// Importar imágenes desde src/assets/gallery automáticamente
const importImages = () => {
  const modules = import.meta.glob(
    "/src/assets/gallery/*.{png,jpg,jpeg,webp,gif}",
    { eager: true }
  );
  return Object.values(modules).map((mod: any) => mod.default);
};

const images: string[] = importImages();

export default function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const animTimeoutRef = useRef<number | null>(null);
  const ANIM_DURATION = 220;

  // Manejar botón atrás del celular
  useEffect(() => {
    const handlePopState = () => {
      setOpenIndex(null);
    };
    if (openIndex !== null) {
      window.history.pushState({ lightbox: true }, "");
      window.addEventListener("popstate", handlePopState);
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, [openIndex]);

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) {
        window.clearTimeout(animTimeoutRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    offsetRef.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current !== null) {
      const delta = e.touches[0].clientX - startXRef.current;
      offsetRef.current = delta;
      setOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || startXRef.current === null || openIndex === null) {
      setOffset(0);
      setIsDragging(false);
      return;
    }

    const delta = offsetRef.current;
    const threshold = 70;
    const vw = window.innerWidth || document.documentElement.clientWidth;

    const clearAnim = () => {
      if (animTimeoutRef.current) {
        window.clearTimeout(animTimeoutRef.current);
        animTimeoutRef.current = null;
      }
    };

    if (Math.abs(delta) > threshold) {
      if (delta < 0 && openIndex < images.length - 1) {
        setOffset(-vw);
        clearAnim();
        animTimeoutRef.current = window.setTimeout(() => {
          setOpenIndex((v) => (v === null ? v : v + 1));
          setOffset(vw);
          requestAnimationFrame(() => setOffset(0));
          animTimeoutRef.current = window.setTimeout(
            () => clearAnim(),
            ANIM_DURATION
          );
        }, ANIM_DURATION);
      } else if (delta > 0 && openIndex > 0) {
        setOffset(vw);
        clearAnim();
        animTimeoutRef.current = window.setTimeout(() => {
          setOpenIndex((v) => (v === null ? v : v - 1));
          setOffset(-vw);
          requestAnimationFrame(() => setOffset(0));
          animTimeoutRef.current = window.setTimeout(
            () => clearAnim(),
            ANIM_DURATION
          );
        }, ANIM_DURATION);
      } else {
        setOffset(0);
      }
    } else {
      setOffset(0);
    }

    startXRef.current = null;
    offsetRef.current = 0;
    setIsDragging(false);
  };

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, i) => (
          <button
            key={i}
            className={styles.card}
            onClick={() => setOpenIndex(i)}
          >
            <img src={src} alt={`Foto ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className={styles.modal}>
          <button className={styles.close} onClick={() => setOpenIndex(null)}>
            ✕
          </button>
          <div
            className={styles.modalInner}
            style={{
              transform: `translateX(${offset}px)`,
              transition: isDragging ? "none" : "transform 220ms ease",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[openIndex]}
              alt={`Foto ${openIndex + 1}`}
              className={styles.modalImage}
            />
          </div>
        </div>
      )}
    </>
  );
}
