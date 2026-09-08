import { TileLayer } from 'react-leaflet';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemedTileLayer — switches between CartoDB Dark (default) and
 * CartoDB Positron light tiles based on the current theme.
 */
export default function ThemedTileLayer() {
  const { isDark } = useTheme();

  const url = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return <TileLayer key={isDark ? 'dark' : 'light'} url={url} attribution="" />;
}
