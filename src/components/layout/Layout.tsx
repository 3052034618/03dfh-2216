import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from './Header';

export const Layout = () => {
  return (
    <div className="h-full w-full flex flex-col bg-deep-blue overflow-hidden">
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-hidden"
      >
        <Outlet />
      </motion.main>
    </div>
  );
};
