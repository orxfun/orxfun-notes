import { ReactNode } from "react";

type LinkProps = {
    href: string,
    text: ReactNode,
    target?: "blank" | "page",
    tooltip?: string,
}

export const Link = ({ href, text, target, tooltip }: LinkProps) => {
    const title = tooltip ?? href;

    if (target === undefined || target === "blank") {
        return <a href={href} target="blank" title={title} >{text}</a>;
    } else {
        return <a href={href} title={title} >{text}</a>;
    }
}
