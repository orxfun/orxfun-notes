type LinkProps = {
    href: string,
    text: string,
}

export const Link = ({ href, text }: LinkProps) => {
    return (
        <a href={href} target="blank">{text}</a>
    );
}
