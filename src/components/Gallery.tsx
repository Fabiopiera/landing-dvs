import { useState, useMemo } from "react";
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

  // Para swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleImgLoad = (idx: number) => {
    setLoadedIndexes((prev) => ({ ...prev, [idx]: true }));
  };

  const closeModal = () => {
    setExiting(true);
    setTimeout(() => {
      setOpenIndex(null);
      setExiting(false);
    }, 250);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].screenX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || openIndex === null) return;

    const touchEnd = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEnd;

    if (Math.abs(diff) > 50) {
      // swipe mínimo de 50px
      if (diff > 0 && openIndex < images.length - 1) {
        setOpenIndex(openIndex + 1); // swipe izquierda → siguiente imagen
      } else if (diff < 0 && openIndex > 0) {
        setOpenIndex(openIndex - 1); // swipe derecha → anterior imagen
      }
    }

    setTouchStartX(null);
  };

  return (
    <>
      <div className={styles.gallery}>
        {images.map((src, i) => (
          <button
            key={i}
            className={`${styles.card} ${
              loadedIndexes[i] ? styles.visible : ""
            }`}
            onClick={() => setOpenIndex(i)}
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
          onTouchEnd={handleTouchEnd}
        >
          <button
            className={styles.close}
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
          <img
            className={styles.modalImage}
            src={images[openIndex]}
            alt={`Imagen ${openIndex + 1}`}
          />
        </div>
      )}
    </>
  );
}
