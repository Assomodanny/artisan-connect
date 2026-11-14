import Hero from '../../components/landing/Hero'
import PopularCategories from '../../components/landing/PopularCategories'
import HowItWorks from '../../components/landing/HowItWorks'
import FeaturedArtisans from '../../components/landing/FeaturedArtisans'
import WhyChoose from '../../components/landing/WhyChoose'
import Testimonials from '../../components/landing/Testimonials'
import ArtisanCTA from '../../components/landing/ArtisanCTA'

export default function Landing() {
  return (
    <>
      <Hero />
      <PopularCategories />
      <HowItWorks />
      <FeaturedArtisans />
      <WhyChoose />
      <Testimonials />
      <ArtisanCTA />
    </>
  )
}
