# Papiée

## Installation

A recent version of `npm` is needed (at least 21.7.3).
One way to get it is with `virtualenv`:
```sh
virtualenv virtualenv
source virtualenv/bin/activate
# Entering virtualenv
pip install nodeenv
nodeenv -p
```

The first time `npm install` will be run, an error will be thrown about a file to be retrived from the Rocq-lsp github document.
The link and location of the needed file is provided as error in the console.
```sh
npm install
# ...
# File /static/worker_artifact.zip does not exist, download it from github and place it there.
# (https://github.com/ejgallego/rocq-lsp/actions/runs/19231026459/artifacts/4518852242)
# ...
```

Download the requested file (here `https://github.com/ejgallego/rocq-lsp/actions/runs/19231026459/artifacts/4518852242`, which lead to the download of the file `coq-lsp_worker and front-end.zip`) and rename it into `static/worker_artifact.zip`.

The second invocation of `npm install` should now work.

## Developing

Once you've imported Papiée and installed dependencies with `npm install`, start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

One can then open a webbrowser at `http://localhost:5173/document` to open a Papiée document.

## Building

To create a production version of Papiée:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

