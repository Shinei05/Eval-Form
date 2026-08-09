import depedLogo from '../assets/DepEd-Logo.png'
import bagongPinasLogo from '../assets/bagongpinas.png'
import logo2 from '../assets/logo2.png'
import jlgisLogo from '../assets/JLGISlogo.png'
import bgImage from '../assets/background.png'

export const branding = {
  name: 'EduRate',
  tagline: 'Teacher Performance Evaluation System',
  campusImage: bgImage,
  seals: [
    {
      src: depedLogo,
      alt: 'Department of Education seal',
    },
    {
      src: bagongPinasLogo,
      alt: 'Bagong Pilipinas seal',
    },
    {
      src: logo2,
      alt: 'EduRate logo',
    },
    {
      src: jlgisLogo,
      alt: 'James L. Gordon Integrated School seal',
    },
  ],
}
