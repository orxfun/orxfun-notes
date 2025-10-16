import './Page.css';
import { ReactNode } from "react";
import { Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Top } from "./pages/Top";
import { Page } from "./Page";
import { PageMetaImpVecMotivation } from "./articles/ImpVecMotivation";
import { PageMetaVForVectors } from "./articles/VForVectors";
import { PageMetaMissingIterableTraits } from "./articles/MissingIterableTraits";
import { PageMetaImplicitViewTypes } from './articles/ImplicitViewTypes';
import { PageMetaZeroCostComposition } from './articles/ZeroCostComposition';

export type PageMeta = {
  path: string,
  page: ReactNode,
  date: string,
  title: string,
  summary: string,
}

function App() {

  const articles: PageMeta[] = [
    PageMetaZeroCostComposition(),
    PageMetaImplicitViewTypes(),
    PageMetaMissingIterableTraits(),
    PageMetaVForVectors(),
    PageMetaImpVecMotivation(),
  ];

  const top = <Top />;
  const pageOf = (article: ReactNode) => <Page top={top} article={article} />;

  const home = pageOf(<Home articles={articles} />);

  return (
    <div className="page">
      <Routes>
        <Route path="/" element={home} />
        {
          articles.map(x => {
            return (
              <Route key={x.path} path={x.path} element={pageOf(x.page)} />
            )
          })
        }
      </Routes>
    </div>
  );
}

export default App;
