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
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        } // if (args.path === 'index.js')

        // Check to see if already fetched this package and if
        // in in cache
        // const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);

        // if (cachedResult) {
        //   return cachedResult;
        // }

        const { data, request} = await axios.get(args.path)

        const fileType = args.path.match(/.css$/) ? 'css' : 'jsx';

        const escaped = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = fileType === 'css' ? 
        `
          const style = document.createElement('style')
          style.innerText = '${escaped}';
          document.head.appendChild(style);
        ` : data

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
    } // setup
  } // return

} // fetchPlugin