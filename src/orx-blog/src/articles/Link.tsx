import { ReactNode } from "react";

type LinkProps = {
    href: string,
    text: ReactNode,
    target?: "blank" | "page",
}

export const Link = ({ href, text, target }: LinkProps) => {
    if (target === undefined || target === "blank") {
        return <a href={href} target="blank">{text}</a>;
    } else {
        return <a href={href} >{text}</a>;
    }
}
