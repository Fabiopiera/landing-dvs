import HeroPromo from "./components/HeroPromo";
import Header from "./components/Header";
import Gallery from "./components/Gallery";
import FooterSocials from "./components/FooterSocials";
import SectionTitle from "./components/SectionTitle";

export default function App() {
  const promoSrc = "/promo.jpg"; // reemplazá con tu imagen en public/

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Header />
      {/* Título sobre el hero */}
      <SectionTitle>Promo</SectionTitle>

      <HeroPromo imageSrc={promoSrc} />
      {/* Título sobre la galería */}
      <SectionTitle>Galería de fotos</SectionTitle>
      <Gallery />
      <FooterSocials />
    </div>
  );
}
