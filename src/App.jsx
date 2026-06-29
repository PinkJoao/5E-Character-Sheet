import { Routes, Route, Navigate } from 'react-router-dom';
import useDataEngine from './hooks/useDataEngine';
import DataProvider from './data/DataProvider';
import UpdatingScreen from './components/common/UpdatingScreen';
import ErrorScreen from './components/common/ErrorScreen';
import VersionTag from './components/common/VersionTag';
import Home from './pages/Home';
import Builder from './pages/Builder';
import styles from './App.module.css';

export default function App() {
  const { status, db, progress, stale, forceCacheUpdate, retry } =
    useDataEngine();

  // Gatekeeper: só liberamos o app depois que os dados estão prontos.
  if (status === 'checking' || status === 'updating') {
    return <UpdatingScreen progress={progress} />;
  }
  if (status === 'error') {
    return <ErrorScreen onRetry={retry} />;
  }

  return (
    <DataProvider value={{ db, stale }}>
      <div className={styles.app}>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/build/:id" element={<Builder />} />
            <Route path="/build/:id/wizard" element={<Builder />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className={styles.footer}>
          <VersionTag onForceUpdate={forceCacheUpdate} />
        </footer>
      </div>
    </DataProvider>
  );
}
