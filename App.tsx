import React, { Suspense } from 'react';
import { Experience } from './components/Experience';
import { UI } from './components/UI';

const App = () => {
  return (
    <div className="w-full h-full relative">
      <UI />
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
    </div>
  );
};

export default App;