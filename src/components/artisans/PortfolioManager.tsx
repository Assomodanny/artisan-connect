import { MAX_PORTFOLIO_PHOTOS } from '../../services/profileService'
import MultiImagePicker from '../ui/MultiImagePicker'

interface PortfolioManagerProps {
  id: string
  images: string[]
  onChange: (images: string[]) => void
}

export default function PortfolioManager({ id, images, onChange }: PortfolioManagerProps) {
  return (
    <MultiImagePicker
      id={id}
      label="Portfolio photos"
      itemLabel="Portfolio photo"
      hint="Customers can see these, so show your best work. Click Save profile to keep your changes."
      emptyText="No photos yet. Add pictures of your finished work."
      max={MAX_PORTFOLIO_PHOTOS}
      images={images}
      onChange={onChange}
    />
  )
}