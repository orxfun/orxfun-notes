import { ReactNode } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { LeftNav } from "./LeftNav";
import { Page } from "./Page";
import './Page.css';
import { PageMetaImpVecMotivation } from "./articles/ImpVecMotivation";
import { Home } from './pages/Home';

export type PageMeta = {
  path: string,
  page: ReactNode,
  date: string,
  title: string,
  summary: string,
}

function App() {

  const pageMetas: PageMeta[] = [
    { path: '/', page: <Home />, title: 'home', date: '', summary: '' },
    PageMetaImpVecMotivation(),
  ];

  const leftNav = <LeftNav pageMetas={pageMetas} />;
  const pageOf = (page: ReactNode) => <Page leftNav={leftNav} page={page} />;

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        {
          pageMetas.map(x => {
            return (
              <Route key={x.path} path={x.path} element={pageOf(x.page)} />
            )
          })
        }
      </Routes>
    </BrowserRouter>
  );
}

export default App;
