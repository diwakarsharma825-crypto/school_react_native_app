// Allow side-effect and CSS-module imports (NativeWind / global.css) to type-check.
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
