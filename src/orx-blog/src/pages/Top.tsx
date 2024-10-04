import './Top.css';
import { Link } from "../articles/Link"

export const Top = () => {

    const imgHeight = 15;

    const imgIn = <img
        src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg"
        alt="in"
        height={imgHeight}
    />;

    const imgX = <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg"
        alt="X"
        height={imgHeight}
    />;

    const imgGitHub = <img
        src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
        alt="GitHub"
        height={imgHeight}
    />;

    const imgEmail = (
        <span style={{ color: '#264d00', fontWeight: 'x-bold' }}>
            ✉
        </span>
    );

    const imgHome = (
        <span style={{ color: '#264d00', fontWeight: 'x-bold' }}>
            🏠
        </span>
    );

    return (
        <div className='top'>

            <Link
                text={imgHome}
                href={process.env.PUBLIC_URL}
                target={"page"}
                tooltip='home'
            />

            <div className='top-separator'>&nbsp;</div>

            <div className='top-links'>
                <Link
                    text={imgGitHub}
                    href="https://github.com/orxfun/"
                />

                <Link
                    text={imgEmail}
                    href="mailto:orx.ugur.arikan@gmail.com"
                />

                <Link
                    text={imgIn}
                    href="https://www.linkedin.com/in/uarikan/"
                />

                <Link
                    text={imgX}
                    href="https://twitter.com/ugur_orx"
                />
            </div>
        </div>
    );
}
