import './ui/styles/tokens.css';
import { loadFonts } from './ui/fonts';

loadFonts();
const app = document.getElementById('app')!;
app.textContent = 'Planet RNG';
