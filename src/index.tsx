// 1) Import ReactDOM library
import * as esbuild from 'esbuild-wasm';
import ReactDOM from "react-dom/client";
import { useState, useEffect, useRef } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

 
// 2) Get a reference to the div with ID root
const el = document.getElementById("root");
  
// 3) Tell React to take control of that element
const root = ReactDOM.createRoot(el!);
  
// 4) Create a component
const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    startService();
  }, [])

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm'
    });   
  }; // startService

  const onClick = async () => {
    if (!ref.current) {
      return;
    }
    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [
        unpkgPathPlugin(),
        fetchPlugin(input)
      ],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window'
      }
    });

    setCode(result.outputFiles[0].text);

    try {
      eval(result.outputFiles[0].text)
    } catch (err) {
      alert(err);
    }


  }; // onClick

  return (
   <div>
    <textarea 
      value={input}
      onChange={e => setInput(e.target.value)}></textarea>
    <div>
      <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
   </div>
  );
};
  
// 5) Show the component on the screen
root.render(<App />);