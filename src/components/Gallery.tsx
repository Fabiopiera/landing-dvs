import React, { useMemo, useState, useRef, useEffect } from "react";
import styles from "./Gallery.module.css";

/* un solo glob válido para Vite */
const modules = import.meta.glob(
  "/src/assets/gallery/*.{jpg,jpeg,png,gif,webp}",
  { eager: true, import: "default" }
) as Record<string, string>;

export default function Gallery() {
  const images = useMemo(
    () =>
      Object.keys(modules)
        .sort()
        .map((k) => modules[k]),
    []
  );

  const [loadedIndexes, setLoadedIndexes] = useState<Record<number, boolean>>(
    {}
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);

  // swipe / drag state
  const startXRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // push history flag + anim timeout
  const pushedRef = useRef(false);
  const animTimeoutRef = useRef<number | null>(null);
  const ANIM_DURATION = 220;

  const handleImgLoad = (idx: number) => {
    setLoadedIndexes((prev) => ({ ...prev, [idx]: true }));
  };

  const openModal = (idx: number) => {
    setOpenIndex(idx);
    try {
      history.pushState({ galleryLightbox: true, idx }, "");
      pushedRef.current = true;
    } catch {
      pushedRef.current = false;
    }
  };

  const doCloseModalLocal = () => {
    setExiting(true);
    setTimeout(() => {
      setOpenIndex(null);
      setExiting(false);
      offsetRef.current = 0;
      setOffset(0);
      setIsDragging(false);
    }, ANIM_DURATION);
  };

  const closeModal = () => {
    if (pushedRef.current) {
      history.back();
      return;
    }
    doCloseModalLocal();
  };

  // popstate: cerrar modal si el estado no es el nuestro
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as any;
      if (st && st.galleryLightbox) return;
      if (openIndex !== null) {
        doCloseModalLocal();
        pushedRef.current = false;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openIndex]);

  // limpieza timeouts al desmontar
  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) {
        window.clearTimeout(animTimeoutRef.current);
      }
    };
  }, []);

  // TOUCH handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (openIndex === null) return;
    startXRef.current = e.touches[0].clientX;
    offsetRef.current = 0;
    setOffset(0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const x = e.touches[0].clientX;
    const delta = x - startXRef.current;
    offsetRef.current = delta;
    setOffset(delta);
    if (Math.abs(delta) > 10) e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging || startXRef.current === null || openIndex === null) {
      startXRef.current = null;
      offsetRef.current = 0;
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
        // swipe izquierda -> siguiente
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
        // swipe derecha -> anterior
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

  // ---- funciones de flecha (prev/next) — evitan error "goPrev undefined"
  const goNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openIndex === null || openIndex >= images.length - 1) return;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    // animar salida a la izquierda y traer siguiente
    setOffset(-vw);
    if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = window.setTimeout(() => {
      setOpenIndex((v) => (v === null ? v : v + 1));
      setOffset(vw);
      requestAnimationFrame(() => setOffset(0));
      animTimeoutRef.current = window.setTimeout(() => {
        if (animTimeoutRef.current) {
          window.clearTimeout(animTimeoutRef.current);
          animTimeoutRef.current = null;
        }
      }, ANIM_DURATION);
    }, ANIM_DURATION);
  };

  const goPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (openIndex === null || openIndex <= 0) return;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    setOffset(vw);
    if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = window.setTimeout(() => {
      setOpenIndex((v) => (v === null ? v : v - 1));
      setOffset(-vw);
      requestAnimationFrame(() => setOffset(0));
      animTimeoutRef.current = window.setTimeout(() => {
        if (animTimeoutRef.current) {
          window.clearTimeout(animTimeoutRef.current);
          animTimeoutRef.current = null;
        }
      }, ANIM_DURATION);
    }, ANIM_DURATION);
  };

  // keyboard nav
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (openIndex === null) return;
      if (ev.key === "ArrowRight") goNext();
      else if (ev.key === "ArrowLeft") goPrev();
      else if (ev.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, images.length]);

  // Si no hay imágenes mostramos mensaje útil
  if (!images || images.length === 0) {
    return (
      <div className={styles.empty}>
        No se encontraron imágenes en <code>src/assets/gallery</code>.
        <div style={{ marginTop: 8, fontSize: 13, color: "#ddd" }}>
          Verificá: ruta, extensiones (jpg/png/webp), reiniciar dev server.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, i) => (
          <button
            key={src}
            className={`${styles.card} ${
              loadedIndexes[i] ? styles.visible : ""
            }`}
            onClick={() => openModal(i)}
            aria-label={`Abrir imagen ${i + 1}`}
          >
            <img
              src={src}
              alt={`Imagen ${i + 1}`}
              loading="lazy"
              onLoad={() => handleImgLoad(i)}
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className={`${styles.modal} ${exiting ? styles["modal-exit"] : ""}`}
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              if (pushedRef.current) history.back();
              else doCloseModalLocal();
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>

          {openIndex > 0 && (
            <button
              className={`${styles.arrow} ${styles.left}`}
              onClick={goPrev}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          <div
            className={styles.modalInner}
            style={{
              transform: `translateX(${offset}px)`,
              transition: isDragging ? "none" : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className={styles.modalImage}
              src={images[openIndex]}
              alt={`Imagen ${openIndex + 1}`}
            />
          </div>

          {openIndex < images.length - 1 && (
            <button
              className={`${styles.arrow} ${styles.right}`}
              onClick={goNext}
              aria-label="Siguiente"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
