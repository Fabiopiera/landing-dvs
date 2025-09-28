import React, { useMemo, useState, useRef, useEffect } from "react";
import styles from "./Gallery.module.css";

/* import.meta.glob para obtener las imágenes de /src/assets/gallery */
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

  // --- history push flag
  const pushedRef = useRef(false);

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
    }, 220);
  };

  const closeModal = () => {
    if (pushedRef.current) {
      history.back();
      return;
    }
    doCloseModalLocal();
  };

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

  // --- navegación con teclado
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (openIndex === null) return;
      if (ev.key === "ArrowRight" && openIndex < images.length - 1) {
        setOpenIndex(openIndex + 1);
      } else if (ev.key === "ArrowLeft" && openIndex > 0) {
        setOpenIndex(openIndex - 1);
      } else if (ev.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, images.length]);

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, i) => (
          <button
            key={i}
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
        >
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              if (pushedRef.current) {
                history.back();
              } else {
                doCloseModalLocal();
              }
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Flecha izquierda */}
          {openIndex > 0 && (
            <button
              className={`${styles.arrow} ${styles.left}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(openIndex - 1);
              }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          {/* Imagen */}
          <div
            className={styles.modalInner}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className={styles.modalImage}
              src={images[openIndex]}
              alt={`Imagen ${openIndex + 1}`}
            />
          </div>

          {/* Flecha derecha */}
          {openIndex < images.length - 1 && (
            <button
              className={`${styles.arrow} ${styles.right}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex(openIndex + 1);
              }}
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
