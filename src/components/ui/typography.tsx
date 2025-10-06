export function TypographyParagraph({ children }) {
  return <p className="leading-6 text-[13px]">{children}</p>;
}

export function TypographyH1({ children }) {
  return <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">{children}</h1>;
}

export function TypographyH2({ children }) {
  return <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">{children}</h2>;
}

export function TypographyH3({ children }) {
  return <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>;
}

export function TypographyH4({ children }) {
  return <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">{children}</h4>;
}
