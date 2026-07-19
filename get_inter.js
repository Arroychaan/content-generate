async function getFont() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@600').then(r => r.text());
  console.log(css.match(/url\((.*?)\)/)[1]);
}
getFont();
