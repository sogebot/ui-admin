import { highlight, languages } from 'prismjs';
import { PrismEditor } from 'vue-prism-editor';

import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css'; // import syntax highlighting styles

const highlighterJS = (code: string) => {
  return highlight(code, languages.js, 'javascript'); // returns html
};
const highlighterHTML = (code: string) => {
  return highlight(code, languages.html, 'html'); // returns html
};
const highlighterCSS = (code: string) => {
  return highlight(code, languages.css, 'css'); // returns html
};

export {
  PrismEditor, highlighterJS, highlighterCSS, highlighterHTML,
};
