import styles from "./HeroPromo.module.css";

type Props = {
  imageSrc: string;
  imageAlt?: string;
};

export default function HeroPromo({ imageSrc, imageAlt = "Promo" }: Props) {
  return (
    <section className={styles.hero} aria-label="Promo principal">
      <div className={styles.imageWrap} role="img" aria-label={imageAlt}>
        <img src={imageSrc} alt={imageAlt} className={styles.image} />
      </div>
    </section>
  );
}
