async function getOswald() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Oswald:wght@700').then(res => res.text());
  const url = css.match(/url\((.*?)\)/)[1];
  console.log(url);
}
getOswald();
