import { ReactNode } from "react";

type LinkProps = {
    href: string,
    text: ReactNode,
}

export const Link = ({ href, text }: LinkProps) => {
    return (
        <a href={href} target="blank">{text}</a>
    );
}
