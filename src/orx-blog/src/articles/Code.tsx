import { darcula, gml, gruvboxDark, hybrid, irBlack } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import SyntaxHighlighter from 'react-syntax-highlighter';

type CodeProps = {
    code: string,
}

export const Code = ({ code }: CodeProps) => {
    return (
        <SyntaxHighlighter language='rust' style={hybrid}>
            {code}
        </SyntaxHighlighter>
    );
}
