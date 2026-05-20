import logoUrl from '../../logo.png';

interface Props {
  variant?: 'default' | 'light';
  size?: 'default' | 'hero';
}

const BrandLogo: React.FC<Props> = ({ variant = 'default', size = 'default' }) => {
  return (
    <span className={`brand-logo-frame brand-logo-${variant} brand-logo-${size}`}>
      <img src={logoUrl} alt="UNIPORT" className="brand-logo-image" />
    </span>
  );
};

export default BrandLogo;
