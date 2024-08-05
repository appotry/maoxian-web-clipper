
import fs                     from 'fs';
import path                   from 'path';
import { fileURLToPath }      from 'url';
import webpack                from 'webpack';
import CopyWebpackPlugin      from "copy-webpack-plugin";
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import RemovePlugin           from 'remove-files-webpack-plugin';
import ZipPlugin              from 'zip-webpack-plugin';


const ENVIRONMENT = process.env.NODE_ENV || "development";
const IS_PRODUCTION  = (ENVIRONMENT === "production");
const IS_DEVELOPMENT = (ENVIRONMENT === "development");


// "chromium" or "firefox"
const PLATFORM = process.env.MX_PLATFORM

//
// PLATFORM_ID
//   - on Firefox, platform id is extension's id (generated by AMO).
//   - on Chromium, the extension's public key which will be hashed to extension id.
//
// We are not use the public key that generated by Chrome Web Store anymore,
// because it's dangerous, Chrome can use it to
// disable the installed extension without a reason.
//
const PLATFORM_ID = process.env.MX_PLATFORM_ID

// The update manifest file's URL that we self hosted (Chromium).
const PLATFORM_UPDATE_URL = process.env.MX_PLATFORM_UPDATE_URL

if (IS_PRODUCTION) {
  if (PLATFORM && PLATFORM_ID && PLATFORM_UPDATE_URL) {
    // all required environment variables was provided.
  } else {
    const errors = [];
    if (!PLATFORM)            { errors.push("PLATFORM is empty") }
    if (!PLATFORM_ID)         { errors.push("PLATFORM_ID is empty") }
    if (PLATFORM && PLATFORM == 'chromium' && !PLATFORM_UPDATE_URL) {
      errors.push("PLATFORM_UPDATE_URL is empty")
    }
    if (errors.length > 0) {
      throw new Error(errors.join(", "))
    }
  }
}

// Fix CJS global variables
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const pages_folder = path.join(__dirname, "src", "pages");
const dist_folder  = path.join(__dirname, "dist", "extension", "maoxian-web-clipper");
const npm_folder   = path.join(__dirname, "node_modules");
const manifestPath = path.join(__dirname, "src", "manifest.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath));

// extension page names
const pages = [
  'background', 'popup', 'welcome', 'history', 'home', 'last-clipping-result',
  'plan-subscription', 'reset-history', 'setting',
  'ui-control', 'ui-selection', 'failed-tasks',  'debug'];

function getCopyItems() {

  const items = [];

  // 3rd party js and css
  [
    ['webextension-polyfill/dist/browser-polyfill.js', 'vendor/js/browser-polyfill.js'],
    ['css.escape/css.escape.js'    , 'vendor/js/css.escape.js'],
    ['roddeh-i18n/dist/i18n.js'    , 'vendor/js/i18n.js']          ,
    ['awesomplete/awesomplete.js'  , 'vendor/js/awesomplete.js']   ,
    ['pikaday/pikaday.js'          , 'vendor/js/pikaday.js']       ,

    ['awesomplete/awesomplete.css' , 'vendor/css/awesomplete.css'] ,
    ['pikaday/css/pikaday.css'     , 'vendor/css/pikaday.css']     ,
  ].forEach((pair) => {
    const sourceFilename = path.join(npm_folder, pair[0]);
    const targetFilename = path.join(dist_folder, pair[1]);
    items.push({from: sourceFilename, to: targetFilename});
  });

  // page assets
  [
    /* icons and locale files */
    ['src/icons', 'icons'],
    ['src/_locales/en',    '_locales/en' ],
    ['src/_locales/zh_CN', '_locales/zh_CN' ],
    ['src/_locales/pikaday.i18n.js', '_locales/pikaday.i18n.js' ],

    /* page libs */
    ['src/js/lib/log.js'               , 'js/lib/log.js']               ,
    ['src/js/lib/tool.js'              , 'js/lib/tool.js']              ,
    ['src/js/lib/icon.js'              , 'js/lib/icon.js']              ,
    ['src/js/lib/translation.js'       , 'js/lib/translation.js']       ,
    ['src/js/lib/mime.js'              , 'js/lib/mime.js']              ,
    ['src/js/lib/ext-api.js'           , 'js/lib/ext-api.js']           ,
    ['src/js/lib/ext-msg.js'           , 'js/lib/ext-msg.js']           ,
    ['src/js/lib/storage.js'           , 'js/lib/storage.js']           ,
    ['src/js/lib/config.js'            , 'js/lib/config.js']            ,
    ['src/js/lib/link.js'              , 'js/lib/link.js']              ,
    ['src/js/lib/inspector.js'         , 'js/lib/inspector.js']         ,
    ['src/js/lib/template.js'          , 'js/lib/template.js']          ,
    ['src/js/lib/handler.js'           , 'js/lib/handler.js']           ,
    ['src/js/lib/frame-msg.js'         , 'js/lib/frame-msg.js']         ,
    ['src/js/lib/notify.js'            , 'js/lib/notify.js']            ,
    ['src/js/lib/query.js'             , 'js/lib/query.js']             ,
    ['src/js/lib/event-target.js'      , 'js/lib/event-target.js']      ,
    ['src/js/lib/fetcher-using-xhr.js' , 'js/lib/fetcher-using-xhr.js'] ,
    ['src/js/lib/task-fetcher.js'      , 'js/lib/task-fetcher.js']      ,
    ['src/js/lib/action-cache.js'      , 'js/lib/action-cache.js']      ,
    ['src/js/lib/auto-complete.js'     , 'js/lib/auto-complete.js']      ,
    ['src/js/lib/qwebchannel.js'       , 'js/lib/qwebchannel.js']       ,

    /* page scripts */
    ['src/js/page-scripts' , 'js/page-scripts'],

    /* content */
    ['src/js/page-scripts-loader.js', 'js/page-scripts-loader.js'],
    ['src/js/content-scripts-loader.js', 'js/content-scripts-loader.js'],

    /* background */
    ['src/js/handler'                      , 'js/handler']                      ,
    ['src/js/saving'                       , 'js/saving']                       ,
    ['src/js/background'                   , 'js/background']                   ,
    ['src/js/clipping/backend.js'          , 'js/clipping/backend.js']          ,
    ['src/js/assistant/backend.js'         , 'js/assistant/backend.js']         ,
    ['src/js/assistant/plan-repository.js' , 'js/assistant/plan-repository.js'] ,
    ['src/js/assistant/fuzzy-matcher.js'   , 'js/assistant/fuzzy-matcher.js']   ,
    ['src/js/selection/backend.js'         , 'js/selection/backend.js']         ,
    ['src/js/selection/store.js'           , 'js/selection/store.js']           ,
  ].forEach((pair) => {
    const sourceFilename = pair[0];
    const targetFilename = path.join(dist_folder, pair[1]);
    items.push({from: sourceFilename, to: targetFilename});
  })

  // page htmls
  pages.forEach((name) => {
    const sourceFilename = `src/pages/${name}.html`;
    const targetFilename = path.join(dist_folder, `pages/${name}.html`);
    items.push({from: sourceFilename, to: targetFilename});
  });

  // page javascripts
  ['reset-history-worker'].concat(pages).forEach((name) => {
    const sourceFilename = `src/pages/${name}.js`;
    const targetFilename = path.join(dist_folder, `pages/${name}.js`);
    items.push({from: sourceFilename, to: targetFilename});
  });


  // page stylesheets
  const cssBlackList = ['ui-selection', 'background'];
  const cssNames = ['_base'].concat(pages);
  cssNames.forEach((name) => {
    if (cssBlackList.indexOf(name) == -1) {
      items.push({
        from: `src/pages/${name}.css`,
        to: path.join(dist_folder, `pages/${name}.css`),
      });
    }
  });

  // manifest
  items.push({
    from: 'src/manifest.json',
    to: path.join(dist_folder, 'manifest.json'),
    transform: renderManifestWithPlatformMsg,
  });

  // env
  items.push({
    from: (IS_PRODUCTION ? 'src/js/env.production.js' : 'src/js/env.js'),
    to: path.join(dist_folder, 'js/env.js'),
  });

  return items;
}

const config = {
  mode: ENVIRONMENT,
  entry: {
    'content-frame' : path.join(__dirname, "src", "js", "content-frame.js"),
    'content'       : path.join(__dirname, "src", "js", "content.js"),
  },
  output: {
    filename: "js/[name].js",
    path: dist_folder
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-transform-regenerator',
                "@babel/plugin-transform-runtime"],
              cacheDirectory: true
            }
          }
        ],
        // webpack/webpack/issues/11467
        resolve: { fullySpecified: false }
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin({patterns: getCopyItems()}),
    new webpack.NormalModuleReplacementPlugin(
      /js\/env\.js/,
      (IS_PRODUCTION ? 'env.production.js' : 'env.js')
    ),
  ],
}



function renderManifestWithPlatformMsg(content, path) {
  let manifest = JSON.parse(content.toString());
  switch(PLATFORM) {
    case 'chromium':
      if (PLATFORM_ID) {
        manifest.key = PLATFORM_ID;
      }
      if (PLATFORM_UPDATE_URL) {
        manifest.update_url = PLATFORM_UPDATE_URL;
      }
      break;
    case 'firefox':
      if (PLATFORM_ID) {
        manifest.applications = {
          gecko: {id: PLATFORM_ID}
        }
      }
      break;
    default: break;
  }
  return Buffer.from(JSON.stringify(manifest, null, 2));
}

if (IS_PRODUCTION) {

  const zipfile = `maoxian-web-clipper-${PLATFORM}-${manifest.version}.zip`
  config.plugins.push(
    // Clean dist/extension/maoxian-web-clipper before every build.
    new CleanWebpackPlugin(),
    // Remove last zip files
    new RemovePlugin({
      before: {
        root: path.resolve('dist', 'extension'),
        include: [
          zipfile
        ]
      }
    }),
    // Compress dist/extension/maoxian-web-clipper
    new ZipPlugin({
      // Relative to Webpack output path
      path: '../',
      filename: zipfile,
    })
  );
} else if (IS_DEVELOPMENT) {
  config.devtool = 'inline-source-map';
}


export default config;
