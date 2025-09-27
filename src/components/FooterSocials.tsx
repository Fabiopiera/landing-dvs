import styles from "./FooterSocials.module.css";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaShareAlt,
} from "react-icons/fa";

export default function FooterSocials() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://wa.me/+543624607162"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className={styles.icon}
      >
        <FaWhatsapp />
      </a>

      <a
        href="https://instagram.com/diversionsinlimitesss"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        className={styles.icon}
      >
        <FaInstagram />
      </a>

      <a
        href="https://www.facebook.com/Diversion.Sin.Limites/"
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
        className={styles.icon}
      >
        <FaFacebookF />
      </a>

      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: "Promo",
              text: "Mirá esta promo que encontre en Diversión sin limites!",
              url: location.href,
            });
          } else {
            navigator.clipboard.writeText(location.href);
            alert("Enlace copiado al portapapeles");
          }
        }}
        aria-label="Compartir"
        className={styles.icon}
      >
        <FaShareAlt />
      </button>
    </footer>
  );
}
