import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';
 
const fileCache = localForage.createInstance({
  name: 'filecache'
});

export const fetchPlugin = (inputCode: string) => {

  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      // index.ts onload
      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: 'jsx',
          contents: inputCode,
        }
      }); // build.onLoad

      // Check to see if already fetched this package and if
      // in cache, if true return
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);

        if (cachedResult) {
          return cachedResult;
        }
      }) // build.onLoad

      // css onload file
      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        const { data, request} = await axios.get(args.path)

        const escaped = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = 
          `
            const style = document.createElement('style')
            style.innerText = '${escaped}';
            document.head.appendChild(style);
          ` 
        // store response in cache
        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: contents,
          resolveDir: new URL('./', request.responseURL).pathname
        }
        // store in cache
        await fileCache.setItem(args.path, result);

        return result;

      }); // build.onLoad

      // all other files
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        } // if (args.path === 'index.js')

        const { data, request} = await axios.get(args.path)
       
        // store response in cache
        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname
        }
        // store in cache
        await fileCache.setItem(args.path, result);

        return result;
      }); // build.onLoad
    } // setup
  } // return

} // fetchPlugin