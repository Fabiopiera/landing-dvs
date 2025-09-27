import React, { useMemo, useState, useRef, useEffect } from "react";
import styles from "./Gallery.module.css";

/* import.meta.glob eager para obtener URLs */
const modules = import.meta.glob(
  "/src/assets/gallery/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    import: "default",
  }
) as Record<string, string>;

export default function Gallery() {
  const images = useMemo(() => Object.keys(modules).map((k) => modules[k]), []);
  const [loadedIndexes, setLoadedIndexes] = useState<Record<number, boolean>>(
    {}
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);

  // --- drag state (refs + state para render)
  const startXRef = useRef<number | null>(null); // donde empezó el touch
  const offsetRef = useRef(0); // offset actual mientras arrastra
  const [offset, setOffset] = useState(0); // para renderizar translateX
  const [isDragging, setIsDragging] = useState(false);

  // --- history push flag
  const pushedRef = useRef(false);

  // --- handlers simples
  const handleImgLoad = (idx: number) => {
    setLoadedIndexes((prev) => ({ ...prev, [idx]: true }));
  };

  const openModal = (idx: number) => {
    setOpenIndex(idx);
    // pushState para que el botón "Atrás" cierre el modal en vez de salir del sitio
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
      // reset drag state
      offsetRef.current = 0;
      setOffset(0);
      setIsDragging(false);
    }, 220);
  };

  const closeModal = () => {
    // si hicimos push, usamos history.back() para que popstate se encargue de cerrar
    if (pushedRef.current) {
      history.back();
      return;
    }
    doCloseModalLocal();
  };

  // --- popstate: cerrar modal si no es nuestro estado
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as any;
      if (st && st.galleryLightbox) {
        // si es nuestro estado (pushed), podemos sincronizar pero no cerramos
        return;
      }
      // si no es nuestro state y modal está abierto, cerramos
      if (openIndex !== null) {
        doCloseModalLocal();
        pushedRef.current = false;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  // --- touch handlers (seguimiento del dedo)
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
    // si detectamos desplazamiento horizontal significativo, prevenimos scroll vertical
    if (Math.abs(delta) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || startXRef.current === null || openIndex === null) {
      // reset
      startXRef.current = null;
      offsetRef.current = 0;
      setOffset(0);
      setIsDragging(false);
      return;
    }

    const delta = offsetRef.current;
    const threshold = 70; // px mínimo para cambiar de imagen
    if (Math.abs(delta) > threshold) {
      if (delta < 0 && openIndex < images.length - 1) {
        setOpenIndex((v) => (v === null ? v : v + 1));
      } else if (delta > 0 && openIndex > 0) {
        setOpenIndex((v) => (v === null ? v : v - 1));
      }
    }
    // animar vuelta al centro (o al 0) y resetear
    offsetRef.current = 0;
    setOffset(0);
    setIsDragging(false);
    startXRef.current = null;
  };

  // --- keyboard (opcional)
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
          // los handlers de touch van en el modal para capturar en toda la pantalla
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              // si abrimos con push, sincronizamos el history al cerrar
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

          {/* wrapper que se mueve segun offset (offset en px) */}
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
        </div>
      )}
    </>
  );
}
