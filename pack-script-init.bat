@echo off

(
    echo {
    echo   "compilerOptions": {
    echo     "module": "ES2020",
    echo     "target": "ES2021",
    echo     "moduleResolution": "Node",
    echo     "allowSyntheticDefaultImports": true,
    echo     "baseUrl": "./src",
    echo     "rootDir": "./src",
    echo     "outDir": "./scripts",
    echo     "strict": true,
    echo     "forceConsistentCasingInFileNames": true,
    echo   },
    echo   "exclude": [ "node_modules" ],
    echo   "include": [ "src" ]
    echo }
) > tsconfig.json

(
    echo @echo off
    echo call tsc -w
) > TS-compiler.bat

(
    echo node_modules/
    echo package.json
    echo package-lock.json
    echo tsconfig.json
    echo TS-compiler.bat
    echo .vscode/
) > .gitignore

call mkdir src
cd src
call mkdir server