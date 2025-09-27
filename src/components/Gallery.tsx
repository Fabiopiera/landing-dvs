import React, { useMemo, useState, useRef, useEffect } from "react";
import styles from "./Gallery.module.css";

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

  // drag state
  const startXRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0); // offset in px while dragging
  const [offset, setOffset] = useState(0); // used to render transform
  const [isDragging, setIsDragging] = useState(false);

  // history flag: indicamos si pusimos estado al abrir modal
  const pushedRef = useRef(false);

  // control de carga de imagen
  const handleImgLoad = (idx: number) => {
    setLoadedIndexes((prev) => ({ ...prev, [idx]: true }));
  };

  // abrir modal: push state para interceptar back
  const openModal = (idx: number) => {
    setOpenIndex(idx);
    // pushState para que el botón Atrás cierre el modal en lugar de salir del sitio
    try {
      history.pushState({ galleryLightbox: true, idx }, "");
      pushedRef.current = true;
    } catch (e) {
      pushedRef.current = false;
    }
  };

  // cerrar modal (inicia animación y finalmente cierra)
  const closeModal = () => {
    // si venimos con push en history, mejor hacer history.back() para sincronizar
    if (pushedRef.current) {
      // esto desencadenará 'popstate' y el handler de abajo cerrará el modal
      history.back();
      return;
    }
    // si no hay push (fallback), hacemos cierre local
    setExiting(true);
    setTimeout(() => {
      setOpenIndex(null);
      setExiting(false);
    }, 250);
  };

  // popstate: si hay estado "galleryLightbox" no hacemos nada (usuario navegó dentro),
  // si no lo hay y el modal está abierto, cerramos modal.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as any;
      if (st && st.galleryLightbox) {
        // si el estado es nuestro, podriamos mover al index indicado
        // (en general no necesitamos hacer nada)
        return;
      }
      // no es nuestro state -> cerramos modal si está abierto
      if (openIndex !== null) {
        // cerrar con animación
        setExiting(true);
        setTimeout(() => {
          setOpenIndex(null);
          setExiting(false);
          pushedRef.current = false;
        }, 200);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openIndex]);

  // TOUCH / DRAG handlers (para el modal)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (openIndex === null) return;
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    currentOffsetRef.current = 0;
    setOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const x = e.touches[0].clientX;
    const delta = x - startXRef.current;
    currentOffsetRef.current = delta;
    setOffset(delta); // actualiza transform visual
    // evitar scroll vertical accidental mientras el usuario mueve horizontalmente
    if (Math.abs(delta) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const delta = currentOffsetRef.current;
    const threshold = 70; // px mínimo para cambiar foto
    if (Math.abs(delta) > threshold && openIndex !== null) {
      if (delta < 0 && openIndex < images.length - 1) {
        // swipe izquierda => siguiente
        setOpenIndex((v) => (v === null ? v : v + 1));
      } else if (delta > 0 && openIndex > 0) {
        // swipe derecha => previa
        setOpenIndex((v) => (v === null ? v : v - 1));
      }
      // animamos a 0 offset y dejamos que React cambie la imagen
      setOffset(0);
      currentOffsetRef.current = 0;
    } else {
      // volver al centro suavemente
      setOffset(0);
      currentOffsetRef.current = 0;
    }
    startXRef.current = null;
  };

  // keyboard navigation optional: flechas y Escape
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
          // handlers touch en el contenedor para detectar drag sobre la pantalla completa
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              // si hicimos push al abrir, hacemos history.back() para sincronizar
              if (pushedRef.current) {
                history.back();
              } else {
                closeModal();
              }
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* wrapper que se transforma según offset para dar efecto de arrastre */}
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
