import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import Overview from '@/pages/Overview';
import Detail from '@/pages/Detail';
import Disposal from '@/pages/Disposal';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="detail/:vehicleId" element={<Detail />} />
          <Route path="disposal" element={<Disposal />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
